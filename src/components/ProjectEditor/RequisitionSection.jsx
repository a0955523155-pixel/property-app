import React, { useState, useMemo } from 'react';
import { Camera, Edit2, Trash2 } from 'lucide-react';
import { toROCDate } from '../../utils/helpers';

const RequisitionSection = ({ requisitions, setRequisitions, lands, buildings, handleImageUploadGeneric, setPreviewImage }) => {
  // ✅ 新增 type: 'expense' (預設支出)
  const [newReq, setNewReq] = useState({ date: new Date().toISOString().split('T')[0], type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });
  const [editingId, setEditingId] = useState(null);

  const save = () => {
    if (!newReq.target || !newReq.amount) return alert("請填寫完整資料");
    if (editingId) setRequisitions(requisitions.map(r => r.id === editingId ? { ...newReq, id: editingId } : r));
    else setRequisitions([...requisitions, { ...newReq, id: Date.now() }]);
    // 重置表單，但保留日期與股東
    setNewReq({ ...newReq, details: "", amount: "", image: null, type: 'expense' }); 
    setEditingId(null);
  };
  const edit = (r) => { setNewReq({...r}); setEditingId(r.id); };
  const del = (id) => { if(confirm("確定刪除此請款單？")) setRequisitions(requisitions.filter(r => r.id !== id)); };

  const groups = useMemo(() => {
     const g = {};
     requisitions.forEach(r => { const k = r.shareholder || '未分類'; if(!g[k]) g[k] = []; g[k].push(r); });
     return g;
  }, [requisitions]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
       <h2 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">請款單管理</h2>
       <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
             <div><label className="text-xs font-bold text-purple-700 mb-1 block">日期 (民國 {newReq.date.split('-')[0]-1911} 年)</label><input type="date" className="w-full p-3 border rounded-lg bg-white" value={newReq.date} onChange={e=>setNewReq({...newReq, date:e.target.value})}/></div>
             {/* ✅ 新增類型選擇 */}
             <div>
                <label className="text-xs font-bold text-purple-700 mb-1 block">類型</label>
                <select className="w-full p-3 border rounded-lg bg-white font-bold" value={newReq.type || 'expense'} onChange={e=>setNewReq({...newReq, type:e.target.value})}>
                    <option value="expense">支出 (請款)</option>
                    <option value="income">收入 (暫收)</option>
                </select>
             </div>
             <div className="md:col-span-2"><label className="text-xs font-bold text-purple-700 mb-1 block">標的 (土地/建物)</label><select className="w-full p-3 border rounded-lg bg-white" value={newReq.target} onChange={e=>setNewReq({...newReq, target:e.target.value})}><option value="">請選擇</option><optgroup label="土地">{lands.map(l=><option key={l.id} value={`土地:${l.sellers.map(s=>s.name).join('/')}`}>土地:{l.sellers.map(s=>s.name).join('/')}</option>)}</optgroup><optgroup label="建物">{buildings.map(b=><option key={b.id} value={`建物:${b.address}`}>建物:{b.address}</option>)}</optgroup><option value="其他">其他</option></select></div>
             <div><label className="text-xs font-bold text-purple-700 mb-1 block">收/支款股東</label><input className="w-full p-3 border rounded-lg bg-white" placeholder="股東姓名" value={newReq.shareholder} onChange={e=>setNewReq({...newReq, shareholder:e.target.value})}/></div>
             <div><label className="text-xs font-bold text-purple-700 mb-1 block">金額 ($)</label><input type="number" className="w-full p-3 border rounded-lg bg-white font-bold" placeholder="0" value={newReq.amount} onChange={e=>setNewReq({...newReq, amount:e.target.value})}/></div>
             <div className="md:col-span-6 flex gap-2 items-center">
                <div className="flex-1"><label className="text-xs font-bold text-purple-700 mb-1 block">款項明細說明</label><input className="w-full p-3 border rounded-lg bg-white" placeholder="輸入款項用途或說明..." value={newReq.details} onChange={e=>setNewReq({...newReq, details:e.target.value})}/></div>
                <label className="cursor-pointer bg-white border border-purple-200 p-3 rounded-lg text-purple-600 hover:bg-purple-50 self-end"><Camera className="w-5 h-5"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setNewReq({...newReq, image: res}))}/></label>{newReq.image && <span className="text-xs text-green-600 font-bold self-end">圖</span>}
                <button onClick={save} className="p-3 px-6 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-md self-end whitespace-nowrap">{editingId ? "更新" : "新增"}</button>
             </div>
          </div>
       </div>
       <div className="space-y-6">{Object.keys(groups).map(sh => {
          // ✅ 計算小計邏輯修正
          let subTotal = 0;
          return (
            <div key={sh} className="rounded-xl border overflow-hidden">
                <div className="bg-purple-100 p-3 font-black text-purple-900 flex justify-between">
                    <span>股東: {sh}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded">共 {groups[sh].length} 筆</span>
                </div>
                <table className="w-full text-sm text-left bg-white">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-3 w-32">日期</th>
                            <th className="p-3 w-20">類型</th>
                            <th className="p-3 w-48">標的物</th>
                            <th className="p-3">明細</th>
                            <th className="p-3 w-32 text-right">金額</th>
                            <th className="p-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {groups[sh].map(r => {
                            const isIncome = r.type === 'income';
                            const amt = Number(r.amount) || 0;
                            // 累加：收入加，支出減
                            subTotal += isIncome ? amt : -amt; 
                            return (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3">{toROCDate(r.date)}</td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${isIncome ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {isIncome ? '收入' : '支出'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs">{r.target}</td>
                                    <td className="p-3 flex items-center gap-1"><span>{r.details}</span>{r.image && <button onClick={()=>setPreviewImage(r.image)} className="text-blue-500 text-xs">[圖]</button>}</td>
                                    <td className={`p-3 text-right font-mono font-bold ${isIncome ? 'text-red-600' : 'text-blue-600'}`}>
                                        {isIncome ? '' : '-'}${amt.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center flex gap-1 justify-center">
                                        <button onClick={()=>edit(r)} className="text-gray-300 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={()=>del(r.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-purple-50 font-bold text-purple-900">
                        <tr>
                            <td colSpan="4" className="p-3 text-right">小計:</td>
                            {/* ✅ 依據正負值顯示顏色 */}
                            <td className={`p-3 text-right ${subTotal >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {subTotal.toLocaleString()}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
          );
       })}</div>
    </div>
  );
};

export default RequisitionSection;
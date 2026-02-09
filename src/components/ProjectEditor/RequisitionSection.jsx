import React, { useState, useMemo } from 'react';
import { Camera, Edit2, Trash2, Plus, X, Users, Save } from 'lucide-react';
import { toROCDate } from '../../utils/helpers';

const handleImageUploadGeneric = (file, callback) => { 
  if (file) { 
    const reader = new FileReader(); 
    reader.onloadend = () => callback(reader.result); 
    reader.readAsDataURL(file); 
  } 
};

const RequisitionSection = ({ 
  requisitions, setRequisitions, 
  lands, buildings, 
  handleImageUploadGeneric, setPreviewImage,
  shareholders, setShareholders 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  // 狀態管理
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newShareholderName, setNewShareholderName] = useState("");

  // 表單暫存
  const [temp, setTemp] = useState({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });

  // 儲存
  const save = () => {
    if (!temp.target || !temp.amount) return alert("請填寫完整資料");
    const dataToSave = { ...temp, date: temp.date || today };

    if (editingId) {
        setRequisitions(requisitions.map(r => r.id === editingId ? { ...dataToSave, id: editingId } : r));
    } else {
        setRequisitions([...requisitions, { ...dataToSave, id: Date.now() }]);
    }
    cancelEdit();
  };

  // 取消
  const cancelEdit = () => {
      setIsCreating(false);
      setEditingId(null);
      setTemp({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });
  };

  const startCreating = () => {
      setEditingId(null);
      setTemp({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });
      setIsCreating(true);
  };

  const startEditing = (r) => {
      setIsCreating(false);
      setEditingId(r.id);
      setTemp({...r});
  };
  
  const del = (id) => { if(confirm("確定刪除此請款單？")) setRequisitions(requisitions.filter(r => r.id !== id)); };

  const groups = useMemo(() => {
     const g = {};
     requisitions.forEach(r => { const k = r.shareholder || '未分類'; if(!g[k]) g[k] = []; g[k].push(r); });
     return g;
  }, [requisitions]);

  const getROCYear = (dateStr) => dateStr ? dateStr.split('-')[0] - 1911 : "";

  // 股東管理
  const addShareholder = () => {
      if(!newShareholderName.trim()) return;
      if(shareholders.includes(newShareholderName)) return alert("此股東已存在");
      setShareholders([...shareholders, newShareholderName]);
      setNewShareholderName("");
  };
  const removeShareholder = (name) => {
      if(confirm(`刪除股東「${name}」？`)) setShareholders(shareholders.filter(s => s !== name));
  };

  // ✅ 共用的編輯表單 (Row Form)
  const EditForm = () => (
      <div className="bg-purple-50 p-4 border-2 border-purple-300 rounded-xl my-2 shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
             <div>
                 <label className="text-xs font-bold text-purple-700 mb-1 block">日期 (民國 {getROCYear(temp.date)} 年)</label>
                 <input type="date" className="w-full p-2 border rounded-lg bg-white" value={temp.date} onChange={e=>setTemp({...temp, date:e.target.value})}/>
             </div>
             <div>
                <label className="text-xs font-bold text-purple-700 mb-1 block">類型</label>
                <select className="w-full p-2 border rounded-lg bg-white font-bold" value={temp.type} onChange={e=>setTemp({...temp, type:e.target.value})}>
                    <option value="expense">支出</option><option value="income">收入</option>
                </select>
             </div>
             <div className="md:col-span-2">
                 <label className="text-xs font-bold text-purple-700 mb-1 block">標的</label>
                 <select className="w-full p-2 border rounded-lg bg-white" value={temp.target} onChange={e=>setTemp({...temp, target:e.target.value})}>
                     <option value="">請選擇</option>
                     <optgroup label="土地">{lands.map(l=><option key={l.id} value={`土地:${l.sellers.map(s=>s.name).join('/')}`}>土地:{l.sellers.map(s=>s.name).join('/')}</option>)}</optgroup>
                     <optgroup label="建物">{buildings.map(b=><option key={b.id} value={`建物:${b.address}`}>建物:{b.address}</option>)}</optgroup>
                     <option value="其他">其他</option>
                 </select>
             </div>
             <div>
                <label className="text-xs font-bold text-purple-700 mb-1 block">股東</label>
                <select className="w-full p-2 border rounded-lg bg-white" value={temp.shareholder} onChange={e=>setTemp({...temp, shareholder:e.target.value})}>
                    <option value="">請選擇</option>{shareholders.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div>
                 <label className="text-xs font-bold text-purple-700 mb-1 block">金額 ($)</label>
                 <input type="number" className="w-full p-2 border rounded-lg bg-white font-bold" value={temp.amount} onChange={e=>setTemp({...temp, amount:e.target.value})}/>
             </div>
             <div className="md:col-span-6 flex gap-2 items-center mt-2">
                <div className="flex-1"><label className="text-xs font-bold text-purple-700 mb-1 block">明細</label><input className="w-full p-2 border rounded-lg bg-white" value={temp.details} onChange={e=>setTemp({...temp, details:e.target.value})}/></div>
                <label className="cursor-pointer bg-white border p-2 rounded-lg text-purple-600 hover:bg-purple-50 self-end"><Camera className="w-5 h-5"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, image: res}))}/></label>
                {temp.image && <span className="text-green-600 text-xs font-bold self-end">有圖</span>}
                
                <div className="flex gap-2 self-end">
                    <button onClick={cancelEdit} className="p-2 px-4 rounded-lg bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">取消</button>
                    <button onClick={save} className="p-2 px-4 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 shadow flex items-center gap-1"><Save className="w-4 h-4"/> 儲存</button>
                </div>
             </div>
          </div>
      </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
       <h2 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">請款單管理</h2>
       
       {/* 股東設定 (置頂) */}
       <div className="mb-8 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
           <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-1"><Users className="w-4 h-4"/> 股東名單設定</h4>
           <div className="flex flex-wrap gap-2 mb-3">
               {shareholders.map(name => (
                   <span key={name} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm">
                       {name}<button onClick={()=>removeShareholder(name)} className="text-gray-400 hover:text-red-500 rounded-full p-0.5"><X className="w-3 h-3"/></button>
                   </span>
               ))}
               {shareholders.length === 0 && <span className="text-gray-400 text-sm italic">尚無股東，請新增</span>}
           </div>
           <div className="flex gap-2 max-w-md">
               <input className="flex-1 p-2 border rounded-lg text-sm" placeholder="輸入股東姓名..." value={newShareholderName} onChange={e=>setNewShareholderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addShareholder()}/>
               <button onClick={addShareholder} className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-black">新增</button>
           </div>
       </div>

       {/* 新增按鈕 */}
       {!isCreating && (
           <button onClick={startCreating} className="w-full py-4 mb-6 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 font-bold hover:bg-purple-50 flex justify-center items-center gap-2 transition">
               <Plus className="w-5 h-5"/> 新增請款單
           </button>
       )}
       {/* 新增表單 */}
       {isCreating && <EditForm />}

       <div className="space-y-6">{Object.keys(groups).map(sh => {
          let subTotal = 0;
          return (
            <div key={sh} className="rounded-xl border overflow-hidden">
                <div className="bg-purple-100 p-3 font-black text-purple-900 flex justify-between"><span>股東: {sh}</span><span className="text-xs bg-white px-2 py-1 rounded">共 {groups[sh].length} 筆</span></div>
                <table className="w-full text-sm text-left bg-white">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                        <tr><th className="p-3 w-32">日期</th><th className="p-3 w-20">類型</th><th className="p-3 w-48">標的物</th><th className="p-3">明細</th><th className="p-3 w-32 text-right">金額</th><th className="p-3 w-20"></th></tr>
                    </thead>
                    <tbody className="divide-y">
                        {groups[sh].map(r => {
                            // ✅ 關鍵：如果正在編輯這行，替換成表單
                            if (editingId === r.id) {
                                return (
                                    <tr key={r.id}>
                                        <td colSpan="6" className="p-2">
                                            <EditForm />
                                        </td>
                                    </tr>
                                );
                            }

                            const isIncome = r.type === 'income';
                            const amt = Number(r.amount) || 0;
                            subTotal += isIncome ? amt : -amt; 
                            return (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="p-3">{toROCDate(r.date)}</td>
                                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded font-bold ${isIncome ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{isIncome ? '收入' : '支出'}</span></td>
                                    <td className="p-3 text-xs">{r.target}</td>
                                    <td className="p-3 flex items-center gap-1"><span>{r.details}</span>{r.image && <button onClick={()=>setPreviewImage(r.image)} className="text-blue-500 text-xs">[圖]</button>}</td>
                                    <td className={`p-3 text-right font-mono font-bold ${isIncome ? 'text-red-600' : 'text-blue-600'}`}>{isIncome ? '' : '-'}${amt.toLocaleString()}</td>
                                    <td className="p-3 text-center flex gap-1 justify-center"><button onClick={()=>startEditing(r)} className="text-gray-300 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button><button onClick={()=>del(r.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-purple-50 font-bold text-purple-900"><tr><td colSpan="4" className="p-3 text-right">小計:</td><td className={`p-3 text-right ${subTotal >= 0 ? 'text-red-600' : 'text-blue-600'}`}>{subTotal.toLocaleString()}</td><td></td></tr></tfoot>
                </table>
            </div>
          );
       })}</div>
    </div>
  );
};

export default RequisitionSection;
import React, { useState, useMemo } from 'react';
import { Camera, Edit2, Trash2, Plus, X, Users, Save, Calendar, DollarSign, FileText } from 'lucide-react';
import { toROCDate } from '../../utils/helpers';

// ✅ 1. 將編輯表單提取到主元件外部，解決輸入跳字 (Focus Loss) 問題
const RequisitionForm = ({ 
    data, onChange, onSave, onCancel, 
    lands, buildings, shareholders, 
    handleImageUploadGeneric 
}) => {
    const getROCYear = (dateStr) => dateStr ? dateStr.split('-')[0] - 1911 : "";

    return (
        <div className="bg-purple-50 p-4 border-2 border-purple-300 rounded-xl my-2 shadow-inner animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* 日期 (2格) */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-purple-700 mb-1 block">日期 (民國{getROCYear(data.date)}年)</label>
                    <div className="relative">
                        <Calendar className="w-4 h-4 text-purple-400 absolute left-2 top-2.5"/>
                        <input 
                            type="date" 
                            className="w-full pl-8 p-2 border rounded-lg bg-white text-sm font-bold" 
                            value={data.date} 
                            onChange={e => onChange('date', e.target.value)}
                        />
                    </div>
                </div>

                {/* 類型 (2格) */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-purple-700 mb-1 block">類型</label>
                    <select 
                        className={`w-full p-2 border rounded-lg font-bold text-sm ${data.type === 'income' ? 'text-red-600' : 'text-blue-600'}`}
                        value={data.type} 
                        onChange={e => onChange('type', e.target.value)}
                    >
                        <option value="expense">支出</option>
                        <option value="income">收入</option>
                    </select>
                </div>

                {/* 標的 (3格) */}
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-purple-700 mb-1 block">標的物</label>
                    <select 
                        className="w-full p-2 border rounded-lg bg-white text-sm" 
                        value={data.target} 
                        onChange={e => onChange('target', e.target.value)}
                    >
                        <option value="">-- 請選擇 --</option>
                        <optgroup label="土地">
                            {lands.map(l => {
                                const val = `土地:${l.sellers.map(s => s.name).join('/')}`;
                                return <option key={l.id} value={val}>{val}</option>;
                            })}
                        </optgroup>
                        <optgroup label="建物">
                            {buildings.map(b => {
                                const val = `建物:${b.address}`;
                                return <option key={b.id} value={val}>{val}</option>;
                            })}
                        </optgroup>
                        <option value="其他">其他 / 公用</option>
                    </select>
                </div>

                {/* 股東 (2格) */}
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-purple-700 mb-1 block">股東/對象</label>
                    <select 
                        className="w-full p-2 border rounded-lg bg-white text-sm" 
                        value={data.shareholder} 
                        onChange={e => onChange('shareholder', e.target.value)}
                    >
                        <option value="">-- 請選擇 --</option>
                        {shareholders.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* 金額 (3格) */}
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-purple-700 mb-1 block">金額 ($)</label>
                    <div className="relative">
                        <DollarSign className="w-4 h-4 text-purple-400 absolute left-2 top-2.5"/>
                        <input 
                            type="number" 
                            className="w-full pl-8 p-2 border rounded-lg bg-white font-black text-right text-lg outline-none focus:ring-2 focus:ring-purple-400" 
                            value={data.amount} 
                            onChange={e => onChange('amount', e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* 第二列：明細與按鈕 */}
                <div className="md:col-span-12 flex gap-2 items-center mt-2 bg-white p-2 rounded-lg border border-purple-100">
                    <div className="flex-1 relative">
                        <FileText className="w-4 h-4 text-gray-400 absolute left-2 top-2.5"/>
                        <input 
                            className="w-full pl-8 p-2 border rounded-lg bg-gray-50 focus:bg-white transition-colors text-sm" 
                            placeholder="輸入明細說明..."
                            value={data.details} 
                            onChange={e => onChange('details', e.target.value)}
                        />
                    </div>
                    
                    <label className={`cursor-pointer border p-2 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs font-bold ${data.image ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500'}`}>
                        <Camera className="w-4 h-4"/>
                        {data.image ? '已更換圖片' : '上傳圖片'}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUploadGeneric(e.target.files[0], (res) => onChange('image', res))} />
                    </label>

                    <div className="flex gap-2 ml-auto border-l pl-2">
                        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 text-sm">取消</button>
                        <button onClick={onSave} className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 shadow flex items-center gap-1 text-sm">
                            <Save className="w-4 h-4"/> 儲存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 主元件
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

  // 表單暫存 (統一管理新增與編輯的狀態)
  const [temp, setTemp] = useState({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });

  // 處理暫存資料變更
  const handleTempChange = (field, value) => {
      setTemp(prev => ({ ...prev, [field]: value }));
  };

  // 儲存邏輯
  const save = () => {
    if (!temp.target || !temp.amount || !temp.shareholder) return alert("請填寫標的、股東及金額");
    
    const dataToSave = { ...temp, date: temp.date || today };

    if (editingId) {
        setRequisitions(requisitions.map(r => r.id === editingId ? { ...dataToSave, id: editingId } : r));
    } else {
        setRequisitions([...requisitions, { ...dataToSave, id: Date.now() }]);
    }
    cancelEdit();
  };

  // 取消邏輯
  const cancelEdit = () => {
      setIsCreating(false);
      setEditingId(null);
      setTemp({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });
  };

  // 開始新增
  const startCreating = () => {
      setEditingId(null);
      setTemp({ date: today, type: 'expense', target: "", details: "", shareholder: "", amount: "", image: null });
      setIsCreating(true);
  };

  // 開始編輯
  const startEditing = (r) => {
      setIsCreating(false);
      setEditingId(r.id);
      setTemp({...r});
  };
  
  const del = (id) => { if(confirm("確定刪除此請款單？")) setRequisitions(requisitions.filter(r => r.id !== id)); };

  // ✅ 2. 自動排序與分組：先依日期排序，再分組
  const groups = useMemo(() => {
      // 先複製並排序 (由舊到新)
      const sorted = [...requisitions].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const g = {};
      sorted.forEach(r => { 
          const k = r.shareholder || '未分類'; 
          if(!g[k]) g[k] = []; 
          g[k].push(r); 
      });
      return g;
  }, [requisitions]);

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
               <input className="flex-1 p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300" placeholder="輸入股東姓名..." value={newShareholderName} onChange={e=>setNewShareholderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addShareholder()}/>
               <button onClick={addShareholder} className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-black">新增</button>
           </div>
       </div>

       {/* 新增按鈕區塊 */}
       {!isCreating && (
           <button onClick={startCreating} className="w-full py-4 mb-6 border-2 border-dashed border-purple-200 rounded-xl text-purple-500 font-bold hover:bg-purple-50 flex justify-center items-center gap-2 transition">
               <Plus className="w-5 h-5"/> 新增請款單
           </button>
       )}
       
       {/* 新增表單 */}
       {isCreating && (
           <RequisitionForm 
               data={temp} 
               onChange={handleTempChange} 
               onSave={save} 
               onCancel={cancelEdit}
               lands={lands}
               buildings={buildings}
               shareholders={shareholders}
               handleImageUploadGeneric={handleImageUploadGeneric}
           />
       )}

       {/* 列表區塊 */}
       <div className="space-y-6">
           {Object.keys(groups).map(sh => {
             let subTotal = 0;
             return (
               <div key={sh} className="rounded-xl border overflow-hidden">
                   <div className="bg-purple-100 p-3 font-black text-purple-900 flex justify-between">
                       <span>股東: {sh}</span>
                       <span className="text-xs bg-white px-2 py-1 rounded text-purple-700">共 {groups[sh].length} 筆</span>
                   </div>
                   <table className="w-full text-sm text-left bg-white">
                       <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
                           <tr>
                               <th className="p-3 w-32">日期</th>
                               <th className="p-3 w-20">類型</th>
                               <th className="p-3 w-48">標的物</th>
                               <th className="p-3">明細</th>
                               <th className="p-3 w-32 text-right">金額</th>
                               <th className="p-3 w-20">操作</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y">
                           {groups[sh].map(r => {
                               // 如果正在編輯這行
                               if (editingId === r.id) {
                                   return (
                                       <tr key={r.id}>
                                           <td colSpan="6" className="p-2 bg-purple-50">
                                               <RequisitionForm 
                                                   data={temp} 
                                                   onChange={handleTempChange} 
                                                   onSave={save} 
                                                   onCancel={cancelEdit}
                                                   lands={lands}
                                                   buildings={buildings}
                                                   shareholders={shareholders}
                                                   handleImageUploadGeneric={handleImageUploadGeneric}
                                               />
                                           </td>
                                       </tr>
                                   );
                               }

                               const isIncome = r.type === 'income';
                               const amt = Number(r.amount) || 0;
                               subTotal += isIncome ? amt : -amt; 
                               
                               return (
                                   <tr key={r.id} className="hover:bg-gray-50">
                                       <td className="p-3 font-mono text-gray-600">{toROCDate(r.date)}</td>
                                       <td className="p-3">
                                           <span className={`text-xs px-2 py-1 rounded font-bold ${isIncome ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                               {isIncome ? '收入' : '支出'}
                                           </span>
                                       </td>
                                       <td className="p-3 text-xs text-gray-700 font-medium">{r.target}</td>
                                       <td className="p-3 flex items-center gap-2">
                                           <span className="text-gray-800">{r.details}</span>
                                           {r.image && (
                                               <button onClick={()=>setPreviewImage(r.image)} className="flex items-center text-blue-500 text-xs hover:underline bg-blue-50 px-1.5 py-0.5 rounded">
                                                   <Camera className="w-3 h-3 mr-1"/>查看
                                               </button>
                                           )}
                                       </td>
                                       <td className={`p-3 text-right font-mono font-bold text-base ${isIncome ? 'text-red-600' : 'text-blue-600'}`}>
                                           {isIncome ? '' : '-'}${amt.toLocaleString()}
                                       </td>
                                       <td className="p-3 text-center flex gap-1 justify-center">
                                           <button onClick={()=>startEditing(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                               <Edit2 className="w-4 h-4"/>
                                           </button>
                                           <button onClick={()=>del(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                               <Trash2 className="w-4 h-4"/>
                                           </button>
                                       </td>
                                   </tr>
                               );
                           })}
                       </tbody>
                       <tfoot className="bg-purple-50 font-bold text-purple-900 border-t-2 border-purple-100">
                           <tr>
                               <td colSpan="4" className="p-3 text-right">本類別小計:</td>
                               <td className={`p-3 text-right text-lg ${subTotal >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                   ${subTotal.toLocaleString()}
                               </td>
                               <td></td>
                           </tr>
                       </tfoot>
                   </table>
               </div>
             );
           })}
       </div>
    </div>
  );
};

export default RequisitionSection;
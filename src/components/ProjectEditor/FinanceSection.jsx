import React, { useState } from 'react';
import { DollarSign, Edit2, Trash2, Camera, X, ImageIcon, Save, Plus } from 'lucide-react';
import { CATEGORIES, toROCDate } from '../../utils/helpers';

// ✅ 財務表格元件 (接收 props)
const TransactionTable = ({ 
    data, typeLabel, colorTheme, subStats, 
    editingTxId, startEditing, // ✅ 接收狀態與函式
    setTransactions, transactions, setPreviewImage,
    EditForm // ✅ 接收表單元件
}) => {
    const net = (subStats?.income || 0) - (subStats?.expense || 0);
    return (
        <div className={`rounded-2xl border bg-white overflow-hidden mb-8 shadow-md transition-all hover:shadow-lg ${colorTheme} break-inside-avoid`}>
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center"><h4 className="font-black text-gray-700 flex items-center gap-2 text-lg">{typeLabel}</h4><span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">共 {data.length} 筆</span></div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 bg-gray-50 uppercase tracking-wider"><tr><th className="p-4 w-28 whitespace-nowrap">日期</th><th className="p-4 w-32 whitespace-nowrap">類型</th><th className="p-4 min-w-[200px]">項目 / 對象 / 備註</th><th className="p-4 text-right w-32 whitespace-nowrap">金額</th><th className="p-4 w-16 text-center print:hidden">操作</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map(t => { 
                        // ✅ 原地變身邏輯
                        if (editingTxId === t.id) {
                            return (
                                <tr key={t.id}>
                                    <td colSpan="5" className="p-2 bg-gray-50">
                                        <EditForm />
                                    </td>
                                </tr>
                            );
                        }

                        return (
                            <tr key={t.id} className="hover:bg-gray-50 group transition-colors">
                                <td className="p-4 text-gray-500 font-mono text-sm whitespace-nowrap">{toROCDate(t.date)}</td>
                                <td className="p-4 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-full text-xs font-bold ${t.type==='income'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>{t.category}</span></td>
                                <td className="p-4"><span className="text-gray-700 font-medium">{t.note || "-"}</span>{t.image && <button onClick={() => setPreviewImage(t.image)} className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1 mt-1 whitespace-nowrap"><ImageIcon className="w-3 h-3"/> 憑證</button>}</td>
                                <td className={`p-4 text-right font-mono font-black text-base whitespace-nowrap ${t.type==='income'?'text-red-600':'text-blue-600'}`}>{t.type==='expense' && '-'}{Number(t.amount).toLocaleString()}</td>
                                <td className="p-4 text-center print:hidden">
                                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => startEditing(t)} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => { if(confirm("刪除？")) setTransactions(transactions.filter(item => item.id !== t.id)) }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ); 
                    })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-100 text-xs"><tr><td colSpan="3" className="p-4 text-right font-bold text-gray-500 uppercase tracking-widest">本欄小計</td><td className="p-4 text-right whitespace-nowrap"><div className="flex justify-end gap-3"><div className="text-red-600 font-bold">收 ${subStats?.income?.toLocaleString()}</div><div className="text-blue-600 font-bold">支 ${subStats?.expense?.toLocaleString()}</div></div><div className={`mt-1 pt-1 border-t border-gray-200 font-black text-sm ${net >= 0 ? 'text-red-600' : 'text-blue-600'}`}>淨 ${net.toLocaleString()}</div></td><td className="print:hidden"></td></tr></tfoot>
            </table>
        </div>
        </div>
    );
};

const FinanceSection = ({ transactions, setTransactions, stats, groupedTransactions, lands, buildings, buyers, visibleLedgers, setVisibleLedgers, handleImageUploadGeneric, setPreviewImage }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTxId, setEditingTxId] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [newTx, setNewTx] = useState({ date: today, type: 'expense', category: CATEGORIES.expense[0], amount: '', note: '', image: null, linkedId: null, linkedType: 'general' });

  const handleImage = (file) => handleImageUploadGeneric(file, (res) => setNewTx(p => ({...p, image: res})));

  const startCreating = () => {
      setEditingTxId(null);
      setNewTx({ date: today, type: 'expense', category: CATEGORIES.expense[0], amount: '', note: '', image: null, linkedId: null, linkedType: 'general' });
      setIsCreating(true);
  };

  const startEditing = (tx) => {
      setIsCreating(false);
      setEditingTxId(tx.id);
      setNewTx({...tx});
  };

  const cancelEdit = () => {
      setIsCreating(false);
      setEditingTxId(null);
  };

  const saveTransaction = (e) => {
     if(e) e.preventDefault();
     if (!newTx.amount) return;
     
     if (editingTxId) setTransactions(transactions.map(t => t.id === editingTxId ? { ...newTx, id: t.id, amount: Number(newTx.amount) } : t));
     else setTransactions([...transactions, { ...newTx, id: Date.now(), amount: Number(newTx.amount) }]);
     
     cancelEdit();
  };

  // ✅ 抽離出共用表單，讓 Table 也能呼叫
  const EditForm = () => (
      <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div><label className="text-xs font-black block mb-2">日期</label><input type="date" className="w-full p-2 border rounded-lg" value={newTx.date} onChange={e=>setNewTx({...newTx, date:e.target.value})}/></div>
              <div><label className="text-xs font-black block mb-2">類型</label><select className="w-full p-2 border rounded-lg" value={newTx.type} onChange={e=>setNewTx({...newTx, type:e.target.value, category:CATEGORIES[e.target.value][0]})}>{/* Options */}<option value="expense">支出</option><option value="income">收入</option></select></div>
              <div><label className="text-xs font-black block mb-2">歸屬</label><select className="w-full p-2 border rounded-lg" value={newTx.linkedType||"general"} onChange={e=>setNewTx({...newTx, linkedType:e.target.value, linkedId:null})}><option value="general">一般</option><option value="land">土地</option><option value="building">建物</option><option value="buyer">買方</option></select></div>
              {newTx.linkedType !== 'general' && (<div><label className="text-xs font-black block mb-2">對象</label><select className="w-full p-2 border rounded-lg" value={newTx.linkedId||""} onChange={e=>setNewTx({...newTx, linkedId:Number(e.target.value)})}>{newTx.linkedType==='land'?lands.map(l=><option key={l.id} value={l.id}>{l.sellers.map(s=>s.name).join('/')}</option>):newTx.linkedType==='building'?buildings.map(b=><option key={b.id} value={b.id}>{b.sellers.map(s=>s.name).join('/')}</option>):buyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>)}
              <div><label className="text-xs font-black block mb-2">科目</label><select className="w-full p-2 border rounded-lg" value={newTx.category} onChange={e=>setNewTx({...newTx, category:e.target.value})}>{CATEGORIES[newTx.type].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-black block mb-2">金額</label><input type="number" className="w-full p-2 border rounded-lg font-bold" value={newTx.amount} onChange={e=>setNewTx({...newTx, amount:e.target.value})}/></div>
          </div>
          <div className="flex gap-4 mt-4 items-center">
              <input className="flex-1 p-2 border rounded-lg" placeholder="備註說明..." value={newTx.note} onChange={e=>setNewTx({...newTx, note:e.target.value})}/>
              <label className="cursor-pointer p-2 border-2 border-dashed rounded-lg flex items-center gap-1 hover:bg-gray-50"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImage(e.target.files[0])} /></label>
              {newTx.image && <span className="text-green-600 text-xs font-bold">有圖</span>}
              
              <div className="flex gap-2">
                  <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 font-bold hover:bg-gray-300">取消</button>
                  <button onClick={saveTransaction} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow flex items-center gap-1"><Save className="w-4 h-4"/> 儲存</button>
              </div>
          </div>
      </div>
  );
  
  return (
    <div className="space-y-8 animate-fadeIn relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center h-32"><div className="text-sm text-gray-400 font-black uppercase text-center">總收入</div><div className="text-4xl font-black text-red-600 text-center">${stats.totalIncome.toLocaleString()}</div></div><div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-center h-32"><div className="text-sm text-gray-400 font-black uppercase text-center">總支出</div><div className="text-4xl font-black text-blue-600 text-center">${stats.totalExpense.toLocaleString()}</div></div><div className={`p-6 rounded-2xl shadow-xl flex flex-col justify-center h-32 ${stats.netProfit >= 0 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}><div className="text-sm text-white/60 font-black uppercase text-center">淨利 (ROI: {stats.roi}%)</div><div className="text-4xl font-black text-center">${stats.netProfit.toLocaleString()}</div></div></div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bg-gray-50 border rounded-xl p-4 flex flex-wrap gap-6 flex-1"><label className="flex gap-2 font-bold cursor-pointer"><input type="checkbox" checked={visibleLedgers.general} onChange={(e)=>setVisibleLedgers({...visibleLedgers, general: e.target.checked})} />一般</label><label className="flex gap-2 font-bold cursor-pointer text-blue-700"><input type="checkbox" checked={visibleLedgers.land} onChange={(e)=>setVisibleLedgers({...visibleLedgers, land: e.target.checked})} />土地</label><label className="flex gap-2 font-bold cursor-pointer text-orange-700"><input type="checkbox" checked={visibleLedgers.building} onChange={(e)=>setVisibleLedgers({...visibleLedgers, building: e.target.checked})} />建物</label><label className="flex gap-2 font-bold cursor-pointer text-green-700"><input type="checkbox" checked={visibleLedgers.buyer} onChange={(e)=>setVisibleLedgers({...visibleLedgers, buyer: e.target.checked})} />買方</label></div>
            
            {/* 新增按鈕 */}
            {!isCreating && (
                <button onClick={startCreating} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-md flex items-center gap-2 whitespace-nowrap"><Plus className="w-5 h-5"/> 新增收支</button>
            )}
        </div>

        {/* 新增表單 (置頂) */}
        {isCreating && <div className="mb-8"><EditForm /></div>}

        {visibleLedgers.general && <TransactionTable data={groupedTransactions.general} typeLabel="一般專案收支" colorTheme="border-gray-200" subStats={stats.subTotals.general} editingTxId={editingTxId} startEditing={startEditing} setTransactions={setTransactions} transactions={transactions} setPreviewImage={setPreviewImage} EditForm={EditForm} />}
        {visibleLedgers.land && <TransactionTable data={groupedTransactions.land} typeLabel="土地出售人帳目" colorTheme="border-blue-200" subStats={stats.subTotals.land} editingTxId={editingTxId} startEditing={startEditing} setTransactions={setTransactions} transactions={transactions} setPreviewImage={setPreviewImage} EditForm={EditForm} />}
        {visibleLedgers.building && <TransactionTable data={groupedTransactions.building} typeLabel="建物出售人帳目" colorTheme="border-orange-200" subStats={stats.subTotals.building} editingTxId={editingTxId} startEditing={startEditing} setTransactions={setTransactions} transactions={transactions} setPreviewImage={setPreviewImage} EditForm={EditForm} />}
        {visibleLedgers.buyer && <TransactionTable data={groupedTransactions.buyer} typeLabel="買受人帳目" colorTheme="border-green-200" subStats={stats.subTotals.buyer} editingTxId={editingTxId} startEditing={startEditing} setTransactions={setTransactions} transactions={transactions} setPreviewImage={setPreviewImage} EditForm={EditForm} />}
    </div>
  );
};

export default FinanceSection;
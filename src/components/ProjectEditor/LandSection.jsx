import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Map, Edit2, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { PREDEFINED_SELLERS, toPing, createEmptyLandItem, toROCDate } from '../../utils/helpers';
import LinkedLedger from '../LinkedLedger';

const LandSection = ({ lands, setLands, transactions, setTransactions, landGrandTotal }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 雖然保留 today 變數以備不時之需，但不再強制預設使用
  const today = new Date().toISOString().split('T')[0];

  const [tempLand, setTempLand] = useState({ section: "", items: [createEmptyLandItem()], sellers: [] });
  const [seller, setSeller] = useState({ name: "", phone: "", address: "" });
  const [expanded, setExpanded] = useState({});

  const tempTotals = useMemo(() => {
    let sumM2 = 0, sumPing = 0, sumPrice = 0;
    tempLand.items.forEach(item => {
       const area = Number(item.detailM2) || (Number(item.areaM2) * (Number(item.shareNum) / (Number(item.shareDenom)||1))) || 0;
       sumM2 += area;
       sumPing += Number(item.detailPing) || toPing(area);
       sumPrice += (Number(item.subtotal) || 0);
    });
    return { m2: sumM2.toFixed(3), ping: sumPing.toFixed(3), price: sumPrice };
  }, [tempLand.items]);

  const addSeller = () => { if (seller.name) { setTempLand({ ...tempLand, sellers: [...tempLand.sellers, { id: Date.now(), ...seller }] }); setSeller({ name: "", phone: "", address: "" }); } };
  const removeSeller = (id) => { if(confirm("確定移除此出售人？")) setTempLand({ ...tempLand, sellers: tempLand.sellers.filter(s => s.id !== id) }); };
  
  // ✅ 新增地號：日期預設為空字串，不再強制代入 today
  const addItem = () => setTempLand({ ...tempLand, items: [...tempLand.items, { ...createEmptyLandItem(), date: '' }] });
  
  const removeItem = (idx) => { if(confirm("確定刪除此地號行？")) setTempLand({ ...tempLand, items: tempLand.items.filter((_, i) => i !== idx) }); };
  
  const handleItemChange = (idx, field, value) => {
    const newItems = [...tempLand.items];
    newItems[idx][field] = value;
    if (['areaM2', 'shareNum', 'shareDenom'].includes(field)) {
      const area = Number(newItems[idx].areaM2)||0, num = Number(newItems[idx].shareNum)||0, denom = Number(newItems[idx].shareDenom)||1;
      const hM2 = area * (num / denom);
      newItems[idx].detailM2 = hM2.toFixed(3); newItems[idx].detailPing = toPing(hM2).toFixed(3);
      newItems[idx].subtotal = Math.round(Number(newItems[idx].detailPing) * (Number(newItems[idx].pricePerPing)||0)).toString();
    }
    if (field==='detailM2') { const hM2 = Number(value)||0; newItems[idx].detailPing=toPing(hM2).toFixed(3); newItems[idx].subtotal=Math.round(Number(newItems[idx].detailPing)*(Number(newItems[idx].pricePerPing)||0)).toString(); }
    if (field==='detailPing' || field==='pricePerPing') { newItems[idx].subtotal=Math.round((Number(newItems[idx].detailPing)||0)*(Number(newItems[idx].pricePerPing)||0)).toString(); }
    setTempLand({ ...tempLand, items: newItems });
  };
  
  const save = () => {
    if (tempLand.items.some(i => !i.lotNumber)) return alert("請填寫地號");
    
    // ✅ 儲存時：取消強迫代入 today，維持使用者輸入的狀態（含空字串）
    const data = { ...tempLand, holdingAreaM2: tempTotals.m2, holdingAreaPing: tempTotals.ping, totalPrice: tempTotals.price };
    
    if (editingId) setLands(lands.map(l => l.id === editingId ? { ...data, id: l.id } : l));
    else setLands([...lands, { ...data, id: Date.now() }]);
    
    setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] }); setShowForm(false); setEditingId(null);
  };
  
  const edit = (l) => { 
      setEditingId(l.id); 
      // ✅ 編輯時：取消強迫代入 today
      setTempLand({...l}); 
      setShowForm(true); 
  };
  
  const del = (id) => { if(confirm("確定刪除此土地標的？")) setLands(lands.filter(l => l.id !== id)); };

  const getROCYear = (dateStr) => dateStr ? dateStr.split('-')[0] - 1911 : "";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-3xl text-white shadow-xl mb-6"><h3 className="text-lg font-black mb-4 flex items-center gap-2"><Map className="w-6 h-6"/> 全案土地總結算</h3><div className="grid grid-cols-3 gap-6 text-center"><div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-blue-200 font-bold mb-1">總持有面積 (㎡)</span><span className="text-3xl font-black">{landGrandTotal.m2}</span></div><div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-blue-200 font-bold mb-1">總持有坪數</span><span className="text-3xl font-black">{landGrandTotal.ping}</span></div><div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-blue-200 font-bold mb-1">總金額 ($)</span><span className="text-3xl font-black">${Number(landGrandTotal.price).toLocaleString()}</span></div></div></div>
      {!showForm && <button onClick={() => { setEditingId(null); setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] }); setShowForm(true); }} className="w-full py-6 border-2 border-dashed rounded-2xl text-gray-400 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2 transition bg-white shadow-sm text-lg font-bold"><Plus className="w-6 h-6" /> 錄入土地標的資訊</button>}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-fadeIn">
           <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100"><h4 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">步驟 1: 土地出售人</h4><div className="flex flex-col md:flex-row gap-4 mb-4"><div className="flex-1"><input list="pre-sellers" placeholder="姓名" className="w-full p-3 border rounded-lg bg-white" value={seller.name} onChange={e=>setSeller({...seller, name:e.target.value})} /><datalist id="pre-sellers">{PREDEFINED_SELLERS.map(n=><option key={n} value={n}/>)}</datalist></div><input placeholder="電話" className="flex-1 p-3 border rounded-lg bg-white" value={seller.phone} onChange={e=>setSeller({...seller, phone:e.target.value})} /><input placeholder="地址" className="flex-1 p-3 border rounded-lg bg-white" value={seller.address} onChange={e=>setSeller({...seller, address:e.target.value})} /><button onClick={addSeller} className="bg-gray-800 text-white px-8 rounded-lg font-black">加入</button></div><div className="space-y-2">{tempLand.sellers.map(s => <div key={s.id} className="text-sm flex justify-between items-center p-3 bg-white border rounded-lg"><span>{s.name} | {s.phone} {s.address && `| ${s.address}`}</span><button onClick={()=>removeSeller(s.id)}><Trash2 className="w-4 h-4 text-red-400"/></button></div>)}</div></div>
           <div className="mb-8"><div className="flex justify-between items-center mb-4"><h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">步驟 2: 地號規格</h4><input placeholder="地段 (如：仁武段)" className="p-2 border rounded" value={tempLand.section} onChange={e=>setTempLand({...tempLand, section: e.target.value})} /></div><div className="overflow-x-auto"><table className="w-full text-sm text-left border-collapse bg-white"><thead className="text-xs font-black uppercase text-gray-400"><tr className="border-b"><th className="p-3 w-20">戶號</th><th className="p-3 w-32">成交日期</th><th className="p-3 w-24">地號</th><th className="p-3 w-20">原始(m2)</th><th className="p-3">持分</th><th className="p-3 w-20">持分(m2)</th><th className="p-3 w-20">持分(坪)</th><th className="p-3 w-24">單價</th><th className="p-3 text-right">小計</th><th className="w-10"></th></tr></thead><tbody>{tempLand.items.map((item, idx) => (<tr key={item.id}><td className="p-2"><input className="w-full p-2 border rounded" value={item.unit} onChange={e=>handleItemChange(idx,'unit',e.target.value)}/></td><td className="p-2"><input type="date" className="w-full p-1 border rounded text-xs" value={item.date || ''} onChange={e=>handleItemChange(idx,'date',e.target.value)}/><span className="text-[10px] text-gray-400">{getROCYear(item.date) ? `民國${getROCYear(item.date)}年`:''}</span></td><td className="p-2"><input className="w-full p-2 border rounded" value={item.lotNumber} onChange={e=>handleItemChange(idx,'lotNumber',e.target.value)}/></td><td className="p-2"><input type="number" className="w-full p-2 border rounded" value={item.areaM2} onChange={e=>handleItemChange(idx,'areaM2',e.target.value)}/></td><td className="p-2"><div className="flex items-center"><input className="w-10 p-1 border text-center" value={item.shareNum} onChange={e=>handleItemChange(idx,'shareNum',e.target.value)}/>/<input className="w-10 p-1 border text-center" value={item.shareDenom} onChange={e=>handleItemChange(idx,'shareDenom',e.target.value)}/></div></td><td className="p-2"><input className="w-full p-2 border rounded text-blue-600 font-bold" value={item.detailM2} onChange={e=>handleItemChange(idx,'detailM2',e.target.value)}/></td><td className="p-2"><input className="w-full p-2 border rounded text-blue-600 font-bold" value={item.detailPing} onChange={e=>handleItemChange(idx,'detailPing',e.target.value)}/></td><td className="p-2"><input type="number" className="w-full p-2 border rounded" value={item.pricePerPing} onChange={e=>handleItemChange(idx,'pricePerPing',e.target.value)}/></td><td className="p-2"><input type="number" className="w-full p-2 border rounded text-right text-blue-600 font-bold" value={item.subtotal} onChange={e=>handleItemChange(idx,'subtotal',e.target.value)}/></td><td className="p-2"><button onClick={()=>removeItem(idx)} className="text-red-400"><Minus className="w-4 h-4"/></button></td></tr>))}</tbody><tfoot><tr><td colSpan="6" className="text-right p-3">本筆合計:</td><td className="text-center p-3">{tempTotals.m2}</td><td className="text-center p-3">{tempTotals.ping}</td><td></td><td className="text-right p-3 text-blue-600">${Number(tempTotals.price).toLocaleString()}</td></tr></tfoot></table><button onClick={addItem} className="mt-4 w-full py-3 border-2 border-dashed rounded-xl text-blue-500 font-bold text-sm"><Plus className="w-5 h-5"/> 增加地號</button></div></div>
           <button onClick={save} className="w-full py-5 rounded-2xl text-white font-black bg-blue-600 shadow-2xl hover:bg-blue-700 tracking-widest text-lg">儲存土地標的</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6">{lands.map(l => (<div key={l.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition group"><div className="flex justify-between items-start mb-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-black">土地標的</span><h4 className="font-black text-gray-900 text-2xl">{l.sellers.length > 0 ? l.sellers.map(s => s.name).join(' / ') : `地段: ${l.section}`}</h4></div><div className="grid grid-cols-4 gap-6 text-base text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100"><div>地號數: {l.items.length}</div><div>持有(㎡): {Number(l.holdingAreaM2).toFixed(3)}</div><div>持有(坪): {Number(l.holdingAreaPing).toFixed(3)}</div><div>總額: ${Number(l.totalPrice).toLocaleString()}</div></div></div><div className="flex gap-2 ml-4"><button onClick={()=>edit(l)} className="p-3 text-gray-300 hover:text-blue-600"><Edit2 className="w-5 h-5"/></button><button onClick={()=>del(l.id)} className="p-3 text-gray-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button></div></div><button onClick={()=>setExpanded(p=>({...p,[l.id]:!p[l.id]}))} className="w-full flex justify-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg">{expanded[l.id]?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>} 詳細地號</button>{expanded[l.id]&&( <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 animate-fadeIn"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs font-bold"><tr><th className="p-3">戶號</th><th className="p-3">成交日期</th><th className="p-3">地號</th><th className="p-3">原始</th><th className="p-3">持分</th><th className="p-3">持分(m2)</th><th className="p-3">持分(坪)</th><th className="p-3 text-right">小計</th></tr></thead><tbody className="divide-y">{l.items.map(i=>(<tr key={i.id}><td className="p-3 font-bold text-blue-600">{i.unit}</td><td className="p-3">{i.date ? toROCDate(i.date) : '-'}</td><td className="p-3 font-mono">{i.lotNumber}</td><td className="p-3 text-gray-400">{i.areaM2}</td><td className="p-3 text-gray-400">{i.shareNum}/{i.shareDenom}</td><td className="p-3 font-bold">{i.detailM2}</td><td className="p-3 font-bold">{i.detailPing}</td><td className="p-3 text-right text-blue-600 font-mono">${Number(i.subtotal).toLocaleString()}</td></tr>))}</tbody></table></div> )}<LinkedLedger linkedId={l.id} linkedType="land" transactions={transactions} onSaveTransaction={(tx)=>setTransactions([...transactions,tx])}/></div>))}</div>
    </div>
  );
};

export default LandSection;
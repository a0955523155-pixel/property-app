// src/components/ProjectEditor.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, DollarSign, Image as ImageIcon, FileSpreadsheet, Printer, X, 
  Users, Map, Home, Edit2, Save, ArrowLeft, Check, Camera, 
  Calculator, Minus, Link as LinkIcon
} from 'lucide-react';
import { CATEGORIES, PREDEFINED_SELLERS, toPing, createEmptyLandItem, exportMasterCSV } from '../utils/helpers';
import LinkedLedger from './LinkedLedger';

const ProjectEditor = ({ initialData, onSave, onBack }) => {
  if (!initialData) return null;

  const [activeTab, setActiveTab] = useState('project');
  
  // 1. 專案基本狀態
  const [projectName, setProjectName] = useState(initialData.name || "新專案名稱");
  const [isEditingName, setIsEditingName] = useState(false);

  // 2. 買受人資料
  const [buyers, setBuyers] = useState(initialData.buyers || []);
  const [newBuyer, setNewBuyer] = useState({ name: "", phone: "", address: "" });
  const [editingBuyerId, setEditingBuyerId] = useState(null);

  // 3. 土地標格資料
  const [lands, setLands] = useState(initialData.lands || []);
  const [showLandForm, setShowLandForm] = useState(false);
  const [editingLandId, setEditingLandId] = useState(null);
  
  const [tempLand, setTempLand] = useState({
    section: "", 
    items: [createEmptyLandItem()], 
    sellers: []
  });
  const [tempLandSeller, setTempLandSeller] = useState({ name: "", phone: "", address: "" });

  // 4. 建物標格資料
  const [buildings, setBuildings] = useState(initialData.buildings || []);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [tempBuilding, setTempBuilding] = useState({
    permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: []
  });
  const [tempBuildingSeller, setTempBuildingSeller] = useState({ name: "", phone: "", address: "" });

  // 5. 財務帳目
  const [transactions, setTransactions] = useState(initialData.transactions || []);
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: CATEGORIES.expense[0],
    amount: '',
    note: '',
    image: null,
    linkedId: null,
    linkedType: 'general' 
  });
  const [editingTxId, setEditingTxId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // --- 計算邏輯 ---
  
  // ✅ 修正 1: 即時計算的總持有面積改為 3 位小數 (原本是 4)
  const currentHoldingAreaM2 = useMemo(() => {
    let total = 0;
    tempLand.items.forEach(item => {
      const area = Number(item.areaM2) || 0;
      const num = Number(item.shareNum) || 0;
      const denom = Number(item.shareDenom) || 1;
      total += area * (num / denom);
    });
    return total.toFixed(3);
  }, [tempLand.items]);

  // ✅ 修正 2: 即時計算的總持有坪數改為 3 位小數
  const currentHoldingAreaPing = useMemo(() => toPing(currentHoldingAreaM2).toFixed(3), [currentHoldingAreaM2]);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const subTotals = { general: { income: 0, expense: 0 }, land: { income: 0, expense: 0 }, building: { income: 0, expense: 0 } };

    transactions.forEach(t => {
      const val = Number(t.amount) || 0;
      const lType = t.linkedType || 'general';
      if (t.type === 'income') {
        totalIncome += val;
        if (subTotals[lType]) subTotals[lType].income += val;
      } else {
        totalExpense += val;
        if (subTotals[lType]) subTotals[lType].expense += val;
      }
    });

    const netProfit = totalIncome - totalExpense;
    const roi = totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : 0;
    return { totalIncome, totalExpense, netProfit, roi, subTotals };
  }, [transactions]);

  useEffect(() => {
    if (!initialData) return;
    const timer = setTimeout(() => {
      onSave({ 
        id: initialData.id, 
        name: projectName, 
        buyers, 
        lands, 
        buildings, 
        transactions, 
        updatedAt: new Date().toISOString() 
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [projectName, buyers, lands, buildings, transactions]);

  // --- 操作函式 ---
  const addLandSeller = () => { if (!tempLandSeller.name) return; setTempLand({ ...tempLand, sellers: [...tempLand.sellers, { id: Date.now(), ...tempLandSeller }] }); setTempLandSeller({ name: "", phone: "", address: "" }); };
  const removeLandSeller = (id) => { setTempLand({ ...tempLand, sellers: tempLand.sellers.filter(s => s.id !== id) }); };
  const addLandItemField = () => { setTempLand({ ...tempLand, items: [...tempLand.items, createEmptyLandItem()] }); };
  const removeLandItemField = (idx) => { const newItems = tempLand.items.filter((_, i) => i !== idx); setTempLand({ ...tempLand, items: newItems.length > 0 ? newItems : [createEmptyLandItem()] }); };
  
  const handleLandItemChange = (idx, field, value) => {
    const newItems = [...tempLand.items];
    newItems[idx][field] = value;
    if (['areaM2', 'shareNum', 'shareDenom', 'pricePerPing'].includes(field)) {
      const area = Number(newItems[idx].areaM2) || 0;
      const num = Number(newItems[idx].shareNum) || 0;
      const denom = Number(newItems[idx].shareDenom) || 1;
      const price = Number(newItems[idx].pricePerPing) || 0;
      const hM2 = area * (num / denom);
      const hPing = toPing(hM2);
      newItems[idx].subtotal = Math.round(hPing * price).toString();
    }
    setTempLand({ ...tempLand, items: newItems });
  };

  const saveLand = () => {
    if (tempLand.items.some(item => !item.lotNumber)) return alert("請填寫所有地號");
    let totalM2 = 0; let totalPingSum = 0; let totalPriceSum = 0;
    tempLand.items.forEach(item => {
      const hM2 = Number(item.areaM2) * (Number(item.shareNum) / Number(item.shareDenom));
      totalM2 += hM2; 
      totalPingSum += toPing(hM2); 
      totalPriceSum += (Number(item.subtotal) || 0);
    });
    
    // ✅ 修正 3: 儲存資料時，強制小數點後 3 位
    const landData = { 
        ...tempLand, 
        holdingAreaM2: totalM2.toFixed(3), 
        holdingAreaPing: totalPingSum.toFixed(3), 
        totalPrice: totalPriceSum 
    };

    if (editingLandId) setLands(lands.map(l => l.id === editingLandId ? { ...landData, id: l.id } : l));
    else setLands([...lands, { ...landData, id: Date.now() }]);
    setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] });
    setShowLandForm(false);
    setEditingLandId(null);
  };

  const saveBuyer = () => { if (!newBuyer.name) return; if (editingBuyerId) setBuyers(buyers.map(b => b.id === editingBuyerId ? { ...b, ...newBuyer } : b)); else setBuyers([...buyers, { id: Date.now(), ...newBuyer }]); setEditingBuyerId(null); setNewBuyer({ name: "", phone: "", address: "" }); };
  const addBuildingSeller = () => { if (!tempBuildingSeller.name) return; setTempBuilding({ ...tempBuilding, sellers: [...tempBuilding.sellers, { id: Date.now(), ...tempBuildingSeller }] }); setTempBuildingSeller({ name: "", phone: "", address: "" }); };
  const removeBuildingSeller = (id) => { setTempBuilding({ ...tempBuilding, sellers: tempBuilding.sellers.filter(s => s.id !== id) }); };
  
  const saveBuilding = () => {
    if(!tempBuilding.address) return alert("請輸入門牌地址");
    if (editingBuildingId) setBuildings(buildings.map(b => b.id === editingBuildingId ? { ...tempBuilding, id: b.id } : b));
    else setBuildings([...buildings, { ...tempBuilding, id: Date.now() }]);
    setTempBuilding({ permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [] });
    setShowBuildingForm(false);
    setEditingBuildingId(null);
  };

  const saveTransaction = (e) => {
    if(e) e.preventDefault();
    if (!newTx.amount) return;
    if (editingTxId) setTransactions(transactions.map(t => t.id === editingTxId ? { ...newTx, id: t.id, amount: Number(newTx.amount) } : t));
    else setTransactions([...transactions, { ...newTx, id: Date.now(), amount: Number(newTx.amount) }]);
    setNewTx({ date: new Date().toISOString().split('T')[0], type: 'expense', category: CATEGORIES.expense[0], amount: '', note: '', image: null, linkedId: null, linkedType: 'general' });
    setEditingTxId(null);
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setNewTx({ ...newTx, image: reader.result }); reader.readAsDataURL(file); } };

  // --- CSV 與列印 ---
  const handleExport = () => exportMasterCSV(projectName, buyers, lands, buildings, transactions);
  const handlePrint = () => window.print();

  return (
    <div className="animate-fadeIn pb-24 text-base app-wrapper">
      {/* 互動介面 (列印時隱藏) */}
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
            <div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-widest decoration-blue-500 underline underline-offset-4">專案管理工作區</div>
              <div className="flex items-center gap-2 mt-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent" autoFocus />
                    <button onClick={() => setIsEditingName(false)} className="text-green-600"><Save className="w-6 h-6" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-3xl font-bold text-gray-800">{projectName}</h1>
                    <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm shadow-sm transition font-bold"><FileSpreadsheet className="w-5 h-5" /> 匯出完整 CSV</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm shadow-sm transition font-bold"><Printer className="w-5 h-5" /> 列印 PDF</button>
          </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
          {[{ id: 'project', icon: Users, label: '買受人資訊' }, { id: 'land', icon: Map, label: '土地標格資訊' }, { id: 'building', icon: Home, label: '建物標格資訊' }, { id: 'finance', icon: DollarSign, label: '財務收支帳' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'project' && (
          <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
            <h2 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">買受人資訊管理</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
              <input type="text" placeholder="姓名" className="w-full p-3 border rounded-lg text-base outline-none focus:ring-1 focus:ring-blue-400" value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} />
              <input type="text" placeholder="電話" className="w-full p-3 border rounded-lg text-base focus:ring-1 focus:ring-blue-400" value={newBuyer.phone} onChange={e => setNewBuyer({...newBuyer, phone: e.target.value})} />
              <input type="text" placeholder="地址" className="w-full p-3 border rounded-lg text-base focus:ring-1 focus:ring-blue-400" value={newBuyer.address} onChange={e => setNewBuyer({...newBuyer, address: e.target.value})} />
              <button onClick={saveBuyer} className={`px-6 py-3 rounded-lg text-white text-base font-bold transition-all shadow-md ${editingBuyerId ? 'bg-orange-600' : 'bg-blue-600'}`}>
                {editingBuyerId ? "更新" : "新增"}
              </button>
            </div>
            <div className="space-y-3">
              {buyers.map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition group">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
                    <div className="font-bold text-gray-800 underline decoration-blue-200 underline-offset-4">{b.name}</div>
                    <div className="text-gray-600">{b.phone}</div>
                    <div className="text-gray-500 truncate">{b.address}</div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => {setEditingBuyerId(b.id); setNewBuyer({...b});}} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => setBuyers(buyers.filter(item => item.id !== b.id))} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'land' && (
           <div className="space-y-6 animate-fadeIn">
              {!showLandForm && <button onClick={() => { setEditingLandId(null); setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] }); setShowLandForm(true); }} className="w-full py-6 border-2 border-dashed rounded-2xl text-gray-400 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2 transition bg-white shadow-sm text-lg font-bold"><Plus className="w-6 h-6" /> 錄入土地標的資訊 (多筆錄入)</button>}
              {showLandForm && (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-fadeIn">
                   <div className="flex justify-between mb-8 font-bold text-blue-900 border-b pb-4">
                     <h3 className="flex items-center gap-2 text-xl"><Map className="w-7 h-7" /> {editingLandId ? "修改標的" : "新增土地標的"}</h3>
                     <button onClick={() => setShowLandForm(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-7 h-7" /></button>
                   </div>
                   <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">步驟 1: 土地出售人</h4>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <input list="pre-sellers" placeholder="出售人姓名" className="w-full p-3 border rounded-lg text-base outline-none bg-white focus:ring-2 focus:ring-blue-100" value={tempLandSeller.name} onChange={e => setTempLandSeller({...tempLandSeller, name: e.target.value})} />
                          <datalist id="pre-sellers">{PREDEFINED_SELLERS.map(n => <option key={n} value={n} />)}</datalist>
                        </div>
                        <input placeholder="電話" className="flex-1 p-3 border rounded-lg text-base outline-none bg-white" value={tempLandSeller.phone} onChange={e => setTempLandSeller({...tempLandSeller, phone: e.target.value})} />
                        <button onClick={addLandSeller} className="bg-gray-800 text-white px-8 rounded-lg font-black hover:bg-black transition shadow-lg text-sm">加入</button>
                    </div>
                    <div className="space-y-2">
                      {tempLand.sellers.map(s => <div key={s.id} className="text-sm flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"><span>{s.name} <span className="text-gray-300 mx-2">|</span> {s.phone}</span> <button onClick={() => removeLandSeller(s.id)} className="text-red-400 hover:bg-red-50 p-1 rounded-full"><Trash2 className="w-4 h-4" /></button></div>)}
                    </div>
                   </div>
                   <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">步驟 2: 地號規格</h4>
                      <input placeholder="地段 (如：仁武段)" className="p-2 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-100 w-40" value={tempLand.section} onChange={e => setTempLand({...tempLand, section: e.target.value})} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse bg-white">
                        <thead className="text-xs font-black uppercase text-gray-400 tracking-wider">
                          <tr className="border-b"><th className="p-3 w-24">地號</th><th className="p-3 w-24">面積(㎡)</th><th className="p-3 w-16">分子</th><th className="p-3 w-16">分母</th><th className="p-3 w-28">單價(元/坪)</th><th className="p-3 text-right">小計金額 ($)</th><th className="p-3 w-12"></th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {tempLand.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-blue-50/30 transition">
                              <td className="p-2"><input className="w-full p-2 border rounded outline-none focus:bg-white bg-transparent" value={item.lotNumber} onChange={e => handleLandItemChange(idx, 'lotNumber', e.target.value)} /></td>
                              <td className="p-2"><input type="number" className="w-full p-2 border rounded outline-none focus:bg-white bg-transparent" value={item.areaM2} onChange={e => handleLandItemChange(idx, 'areaM2', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full p-2 border rounded outline-none text-center bg-transparent" value={item.shareNum} onChange={e => handleLandItemChange(idx, 'shareNum', e.target.value)} /></td>
                              <td className="p-2"><input className="w-full p-2 border rounded outline-none text-center bg-transparent" value={item.shareDenom} onChange={e => handleLandItemChange(idx, 'shareDenom', e.target.value)} /></td>
                              <td className="p-2"><input type="number" className="w-full p-2 border rounded outline-none bg-transparent" value={item.pricePerPing} onChange={e => handleLandItemChange(idx, 'pricePerPing', e.target.value)} /></td>
                              <td className="p-2 text-right relative"><input type="number" className="w-full p-2 pl-6 border border-blue-100 rounded outline-none font-mono font-black text-blue-600 text-right bg-blue-50/20 focus:bg-white" value={item.subtotal} onChange={e => handleLandItemChange(idx, 'subtotal', e.target.value)} /></td>
                              <td className="p-2"><button onClick={() => removeLandItemField(idx)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Minus className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={addLandItemField} className="mt-4 w-full py-3 border-2 border-dashed rounded-xl text-blue-500 hover:bg-blue-50 transition flex justify-center items-center gap-1 font-bold text-sm"><Plus className="w-5 h-5" /> 增加地號行</button>
                    </div>
                   </div>
                   <button onClick={saveLand} className="w-full py-5 rounded-2xl text-white font-black bg-blue-600 shadow-2xl transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-100 tracking-[0.3em] uppercase font-bold text-lg">儲存土地標的</button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                {lands.map(l => (
                   <div key={l.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-500 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4"><span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-black tracking-widest">土地標的</span><h4 className="font-black text-gray-900 text-2xl">{l.sellers.length > 0 ? l.sellers.map(s => s.name).join(' / ') : `地段: ${l.section || "未命名"}`}</h4></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-base text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">地號總數</span><p className="font-black text-gray-700">{l.items.length} 筆</p></div>
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">持有 (㎡)</span><p className="font-mono font-bold text-gray-700">{Number(l.holdingAreaM2).toFixed(3)}</p></div>
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">持有 (坪)</span><p className="font-mono font-bold text-gray-700">{Number(l.holdingAreaPing).toFixed(3)}</p></div>
                            <div><span className="text-xs text-blue-500 block font-black uppercase mb-1">成交總額</span><p className="font-mono font-black text-blue-600 text-xl">${Number(l.totalPrice).toLocaleString()}</p></div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button onClick={() => { setEditingLandId(l.id); setTempLand({...l}); setShowLandForm(true); }} className="p-3 text-gray-300 hover:text-blue-600 transition hover:bg-blue-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => setLands(lands.filter(item => item.id !== l.id))} className="p-3 text-gray-300 hover:text-red-500 transition hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <LinkedLedger linkedId={l.id} linkedType="land" transactions={transactions} onSaveTransaction={(tx) => setTransactions([...transactions, tx])} />
                   </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'building' && (
           <div className="space-y-6 animate-fadeIn">
              {!showBuildingForm && <button onClick={() => { setEditingBuildingId(null); setTempBuilding({ permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [] }); setShowBuildingForm(true); }} className="w-full py-6 border-2 border-dashed rounded-2xl text-gray-400 hover:border-orange-500 hover:text-orange-500 flex justify-center items-center gap-2 transition bg-white shadow-sm text-lg font-bold"><Plus className="w-6 h-6" /> 新增建物案場資料</button>}
              {showBuildingForm && (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-200 animate-fadeIn">
                   <div className="flex justify-between mb-8 font-bold text-orange-900 border-b pb-4">
                     <h3 className="flex items-center gap-2 text-xl"><Home className="w-7 h-7" /> {editingBuildingId ? "修改建物資訊" : "新增建物案場"}</h3>
                     <button onClick={() => setShowBuildingForm(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-7 h-7" /></button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">建照號碼</label><input placeholder="建照號碼" className="w-full p-3 border rounded-lg text-base outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.permitNumber} onChange={e => setTempBuilding({...tempBuilding, permitNumber: e.target.value})} /></div>
                     
                     <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">門牌地址</label><input placeholder="完整門牌地址" className="w-full p-3 border rounded-lg text-base outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.address} onChange={e => setTempBuilding({...tempBuilding, address: e.target.value})} /></div>
                     <div><label className="text-sm text-gray-500 block mb-2 font-bold">使用執照號碼</label><input placeholder="使照號碼" className="w-full p-3 border rounded-lg text-base outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.license} onChange={e => setTempBuilding({...tempBuilding, license: e.target.value})} /></div>
                     <div><label className="text-sm text-gray-500 block mb-2 font-bold">建物建號</label><input placeholder="建號" className="w-full p-3 border rounded-lg text-base outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.buildNumber} onChange={e => setTempBuilding({...tempBuilding, buildNumber: e.target.value})} /></div>
                     <div><label className="text-sm text-gray-500 block mb-2 font-bold">建物面積(㎡)</label><input type="number" className="w-full p-3 border rounded-lg text-base" value={tempBuilding.areaM2} onChange={e => setTempBuilding({...tempBuilding, areaM2: e.target.value})} /></div>
                     <div><label className="text-sm text-gray-500 block mb-2 text-orange-600 font-bold underline font-black">單價 (元/坪)</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg text-base bg-orange-50/20 outline-none" value={tempBuilding.pricePerUnit} onChange={e => setTempBuilding({...tempBuilding, pricePerUnit: e.target.value})} /></div>
                     <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 text-orange-600 font-bold underline font-black">成交總金額 (元)</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg text-base bg-orange-50/20 font-bold" value={tempBuilding.totalPrice} onChange={e => setTempBuilding({...tempBuilding, totalPrice: e.target.value})} /></div>
                   </div>
                   <div className="bg-orange-50/30 p-6 rounded-2xl mb-8 border border-orange-100">
                    <h4 className="text-xs font-bold text-orange-700 mb-4 uppercase tracking-wider">屋主/出售人資訊</h4>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                       <div className="flex-1"><input list="pre-sellers" placeholder="姓名" className="w-full p-3 border rounded-lg text-base outline-none bg-white" value={tempBuildingSeller.name} onChange={e => setTempBuildingSeller({...tempBuildingSeller, name: e.target.value})} /></div>
                       <input placeholder="電話" className="flex-1 p-3 border rounded-lg text-base outline-none bg-white" value={tempBuildingSeller.phone} onChange={e => setTempBuildingSeller({...tempBuildingSeller, phone: e.target.value})} />
                       <button onClick={addBuildingSeller} className="bg-orange-600 text-white px-8 rounded-lg text-sm hover:bg-orange-700 transition shadow-sm font-bold">加入</button>
                    </div>
                    <div className="space-y-2">
                      {tempBuilding.sellers.map(s => <div key={s.id} className="text-sm flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"><span>{s.name} | {s.phone}</span> <button onClick={() => removeBuildingSeller(s.id)} className="text-red-400 hover:bg-red-50 p-1 rounded-full"><Trash2 className="w-4 h-4" /></button></div>)}
                    </div>
                   </div>
                   <button onClick={saveBuilding} className="w-full py-5 rounded-2xl text-white font-black bg-orange-600 shadow-xl transition-all hover:bg-orange-700 hover:scale-[1.01] tracking-widest uppercase font-bold text-lg">儲存建物標的</button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-6">
                {buildings.map(b => (
                  <div key={b.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-500 group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3"><span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold tracking-tighter">建物案場</span><h4 className="font-black text-gray-900 text-2xl">{b.sellers.length > 0 ? b.sellers.map(s => s.name).join(' / ') : `地址: ${b.address}`}</h4></div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">建照號碼</span>{b.permitNumber || "-"}</div>
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">地址</span>{b.address}</div>
                            <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">建號</span>{b.buildNumber}</div>
                            <div className="md:col-span-3"><span className="text-xs text-orange-500 block font-black uppercase mb-1">總額</span><span className="font-mono font-black text-orange-600 text-xl">${Number(b.totalPrice).toLocaleString()}</span></div>
                          </div>
                        </div>
                        <div className="flex gap-3 ml-4">
                          <button onClick={() => { setEditingBuildingId(b.id); setTempBuilding({...b}); setShowBuildingForm(true); }} className="p-3 text-gray-300 hover:text-orange-600 transition hover:bg-orange-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => setBuildings(buildings.filter(item => item.id !== b.id))} className="p-3 text-gray-300 hover:text-red-500 transition hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <LinkedLedger linkedId={b.id} linkedType="building" transactions={transactions} onSaveTransaction={(tx) => setTransactions([...transactions, tx])} />
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'finance' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center h-32"><div className="text-sm text-gray-400 font-black uppercase mb-2 tracking-widest text-center">累計總收入</div><div className="text-4xl font-black text-green-600 text-center">${stats.totalIncome.toLocaleString()}</div></div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center h-32"><div className="text-sm text-gray-400 font-black uppercase mb-2 tracking-widest text-center">累計總支出</div><div className="text-4xl font-black text-red-500 text-center">${stats.totalExpense.toLocaleString()}</div></div>
                 <div className={`p-6 rounded-2xl shadow-xl flex flex-col justify-center h-32 ${stats.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}><div className="text-sm text-white/60 font-black uppercase mb-2 tracking-widest text-center">當前總損益 (ROI: {stats.roi}%)</div><div className="text-4xl font-black text-center">${stats.netProfit.toLocaleString()}</div></div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                <h3 className="text-xs font-black text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]"><Calculator className="w-5 h-5 text-blue-500" /> 分項財務小計 (Subtotals)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[{ key: 'land', label: '土地相關', icon: Map, color: 'blue' }, { key: 'building', label: '建物相關', icon: Home, color: 'orange' }, { key: 'general', label: '一般項目', icon: DollarSign, color: 'gray' }].map(item => (
                    <div key={item.key} className={`p-6 rounded-2xl border-2 ${item.key==='land'?'bg-blue-50 border-blue-100':item.key==='building'?'bg-orange-50 border-orange-100':'bg-gray-50 border-gray-200'}`}>
                      <div className={`font-black mb-4 flex items-center gap-2 text-sm uppercase tracking-widest ${item.key==='land'?'text-blue-800':item.key==='building'?'text-orange-800':'text-gray-700'}`}>
                        <item.icon className="w-5 h-5"/> {item.label}
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>收入：</span><span className="font-mono font-bold text-green-600">${(stats.subTotals[item.key]?.income || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>支出：</span><span className="font-mono font-bold text-red-500">${(stats.subTotals[item.key]?.expense || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between border-t pt-3 mt-3 font-black"><span>淨利：</span><span className={`font-mono ${(stats.subTotals[item.key]?.income - stats.subTotals[item.key]?.expense) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>${((stats.subTotals[item.key]?.income || 0) - (stats.subTotals[item.key]?.expense || 0)).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-8 rounded-3xl shadow-xl border transition-all ${editingTxId ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                 <h3 className="font-black text-gray-800 mb-8 flex justify-between items-center text-base uppercase tracking-widest border-b pb-4">
                    <span className="flex items-center gap-2">{editingTxId ? <><Edit2 className="w-6 h-6 text-orange-600" /> 修改收支資料</> : <><Plus className="w-6 h-6 text-blue-600" /> 登錄專案收支</>}</span>
                    {editingTxId && <button onClick={() => setEditingTxId(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">取消修改</button>}
                 </h3>
                 <form onSubmit={saveTransaction} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                    <div><label className="text-xs text-gray-400 block mb-2 font-black uppercase">日期</label><input type="date" className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} /></div>
                    <div><label className="text-xs text-gray-400 block mb-2 font-black uppercase">類型</label><select className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value, category: CATEGORIES[e.target.value][0]})}>
                      <option value="expense">支出 (Expense)</option><option value="income">收入 (Income)</option>
                    </select></div>
                    <div>
                      <label className="text-xs text-blue-500 font-bold block mb-2 font-black uppercase tracking-widest">收支歸屬</label>
                      <select className="w-full p-4 border border-blue-100 rounded-xl bg-blue-50/20 font-bold outline-none focus:ring-2 focus:ring-blue-200" value={newTx.linkedType || "general"} onChange={e => setNewTx({...newTx, linkedType: e.target.value, linkedId: null})}>
                        <option value="general">一般專案收支</option><option value="land">土地標的 (依出售人)</option><option value="building">建物標的 (依屋主)</option>
                      </select>
                    </div>
                    {newTx.linkedType !== 'general' && (
                      <div>
                        <label className="text-xs text-blue-500 font-bold block mb-2 font-black uppercase tracking-widest">具體對象</label>
                        <select className="w-full p-4 border border-blue-100 rounded-xl bg-blue-50/20 font-bold outline-none focus:ring-2 focus:ring-blue-200" value={newTx.linkedId || ""} onChange={e => setNewTx({...newTx, linkedId: Number(e.target.value)})}>
                          <option value="">-- 請選擇 --</option>
                          {newTx.linkedType === 'land' ? lands.map(l => (<option key={l.id} value={l.id}>{l.sellers.map(s=>s.name).join('/') || `地段: ${l.section}`}</option>)) : buildings.map(b => (<option key={b.id} value={b.id}>{b.sellers.map(s=>s.name).join('/') || b.address.substring(0,10)}</option>))}
                        </select>
                      </div>
                    )}
                    <div><label className="text-xs text-gray-400 block mb-2 font-black uppercase">會計科目</label><select className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>{CATEGORIES[newTx.type].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="text-xs text-blue-600 block mb-2 font-black underline uppercase">金額 ($)</label><input type="number" className="w-full p-4 border border-blue-100 rounded-xl font-black bg-blue-50/30 outline-none" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-8"><input placeholder="備註說明 (用途、廠商、發票編號)..." className="w-full p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white" value={newTx.note} onChange={e => setNewTx({...newTx, note: e.target.value})} /></div>
                    
                    <div className="md:col-span-2 relative">
                       <input type="file" id="fileUploadGlobal" className="hidden" accept="image/*" onChange={handleImageUpload} />
                       <label htmlFor="fileUploadGlobal" className={`flex justify-center items-center gap-2 w-full p-4 border-2 border-dashed rounded-xl text-xs font-black cursor-pointer transition-all hover:bg-blue-50 ${newTx.image ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                         {newTx.image ? <><Check className="w-5 h-5" /> 單據已存</> : <><Camera className="w-5 h-5" /> 插入圖片</>}
                       </label>
                       {newTx.image && <button type="button" onClick={(e) => { e.preventDefault(); setNewTx({...newTx, image: null}); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition z-10"><X className="w-3 h-3" /></button>}
                    </div>

                    <div className="md:col-span-2"><button type="submit" className={`w-full py-4 rounded-xl text-white text-sm font-black shadow-xl transition-all ${editingTxId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700 uppercase tracking-widest'}`}>{editingTxId ? "更新" : "錄入"}</button></div>
                  </div>
                 </form>
              </div>
              <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                   <thead className="bg-gray-50 text-gray-400 border-b uppercase text-xs font-black tracking-widest">
                     <tr><th className="p-6">日期</th><th className="p-6">科目</th><th className="p-6">歸屬 / 備註</th><th className="p-6 text-right">金額 ($)</th><th className="p-6 text-center print:hidden">操作</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {transactions.length > 0 ? transactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t => {
                       let linkedLabel = "一般專案收支";
                       if(t.linkedType === 'land') { const land = lands.find(l=>l.id===t.linkedId); linkedLabel = land ? (land.sellers.map(s=>s.name).join('/') || land.items[0]?.lotNumber) : '未知土地'; } 
                       else if(t.linkedType === 'building') { const build = buildings.find(b=>b.id===t.linkedId); linkedLabel = build ? (build.sellers.map(s=>s.name).join('/') || build.address.substring(0,8)) : '未知建物'; }
                       return (
                         <tr key={t.id} className={`hover:bg-gray-50 transition group ${editingTxId === t.id ? 'bg-orange-50' : ''}`}>
                           <td className="p-6 text-gray-500 font-mono">{t.date}</td>
                           <td className="p-6"><span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter ${t.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.category}</span></td>
                           <td className="p-6">
                              <div className="flex items-center gap-2 mb-2">
                                 <span className={`text-xs px-3 py-1 rounded flex items-center gap-1 font-black ${t.linkedId ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{t.linkedId && <LinkIcon className="w-3 h-3" />}{linkedLabel}</span>
                                 {t.image && <button onClick={() => setPreviewImage(t.image)} className="text-xs text-blue-400 hover:underline font-black flex items-center gap-1 hover:text-blue-600"><ImageIcon className="w-4 h-4" /> 查看憑證</button>}
                              </div>
                              <div className="text-gray-700 font-medium text-base">{t.note || "-"}</div>
                           </td>
                           <td className={`p-6 text-right font-mono font-black text-xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>${Number(t.amount).toLocaleString()}</td>
                           <td className="p-6 text-center print:hidden">
                             <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                               <button onClick={() => {setEditingTxId(t.id); setNewTx({...t});}} className="text-gray-400 hover:text-blue-600 transition-all p-3 hover:bg-white rounded-full shadow-sm"><Edit2 className="w-5 h-5" /></button>
                               <button onClick={() => setTransactions(transactions.filter(item => item.id !== t.id))} className="text-gray-400 hover:text-red-500 transition-all p-3 hover:bg-white rounded-full shadow-sm"><Trash2 className="w-5 h-5" /></button>
                             </div>
                           </td>
                         </tr>
                       );
                     }) : <tr><td colSpan="5" className="p-24 text-center text-gray-300 italic font-black uppercase tracking-widest">無帳目流水紀錄</td></tr>}
                   </tbody>
                </table>
              </div>
           </div>
        )}
      </div>

      {/* 完整報表列印區塊 (預設隱藏，列印時顯示) */}
      <div className="hidden print:block print:p-8">
        <h1 className="text-2xl font-bold mb-2">專案管理報表: {projectName}</h1>
        <p className="text-sm text-gray-500 mb-8">列印日期: {new Date().toLocaleDateString()}</p>

        {/* 1. 買受人列表 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">一、買受人資訊</h2>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">姓名</th>
                <th className="border p-2 text-left">電話</th>
                <th className="border p-2 text-left">地址</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map(b => (
                <tr key={b.id}>
                  <td className="border p-2">{b.name}</td>
                  <td className="border p-2">{b.phone}</td>
                  <td className="border p-2">{b.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 2. 土地列表 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">二、土地標的</h2>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">出售人</th>
                <th className="border p-2 text-left">地段</th>
                <th className="border p-2 text-left">地號 (詳細筆數: {lands.reduce((acc,l)=>acc+l.items.length,0)})</th>
                <th className="border p-2 text-right">持有(m2)</th>
                <th className="border p-2 text-right">持有(坪)</th>
                <th className="border p-2 text-right">總金額</th>
              </tr>
            </thead>
            <tbody>
              {lands.map(l => (
                <tr key={l.id}>
                  <td className="border p-2">{l.sellers.map(s => s.name).join(', ')}</td>
                  <td className="border p-2">{l.section}</td>
                  <td className="border p-2 text-xs">
                      {l.items.map(i => i.lotNumber).join(', ').substring(0, 50)}{l.items.length > 5 ? '...' : ''}
                  </td>
                  {/* ✅ 確保列印時也是 3 位小數 */}
                  <td className="border p-2 text-right">{Number(l.holdingAreaM2).toFixed(3)}</td>
                  <td className="border p-2 text-right">{Number(l.holdingAreaPing).toFixed(3)}</td>
                  <td className="border p-2 text-right">${Number(l.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 3. 建物列表 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold border-b pb-2 mb-4">三、建物標的</h2>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">出售人/屋主</th>
                <th className="border p-2 text-left">建照號碼</th>
                <th className="border p-2 text-left">門牌地址</th>
                <th className="border p-2 text-right">面積(m2)</th>
                <th className="border p-2 text-right">總金額</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map(b => (
                <tr key={b.id}>
                  <td className="border p-2">{b.sellers.map(s => s.name).join(', ')}</td>
                  <td className="border p-2">{b.permitNumber}</td>
                  <td className="border p-2">{b.address}</td>
                  <td className="border p-2 text-right">{b.areaM2}</td>
                  <td className="border p-2 text-right">${Number(b.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 4. 財務摘要 */}
        <section className="mb-8 break-inside-avoid">
           <h2 className="text-lg font-bold border-b pb-2 mb-4">四、財務摘要</h2>
           <div className="flex gap-8 mb-4">
              <div>總收入: <span className="font-bold text-green-600">${stats.totalIncome.toLocaleString()}</span></div>
              <div>總支出: <span className="font-bold text-red-600">${stats.totalExpense.toLocaleString()}</span></div>
              <div>淨利: <span className="font-bold text-blue-600">${stats.netProfit.toLocaleString()}</span></div>
           </div>
        </section>

        {/* 5. 交易明細 */}
        <section>
          <h2 className="text-lg font-bold border-b pb-2 mb-4">五、收支明細表</h2>
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-24">日期</th>
                <th className="border p-2 w-16">類型</th>
                <th className="border p-2 w-24">科目</th>
                <th className="border p-2">說明</th>
                <th className="border p-2 text-right w-28">金額</th>
              </tr>
            </thead>
            <tbody>
              {transactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t => (
                <tr key={t.id}>
                  <td className="border p-2">{t.date}</td>
                  <td className="border p-2">{t.type === 'income' ? '收入' : '支出'}</td>
                  <td className="border p-2">{t.category}</td>
                  <td className="border p-2">{t.note}</td>
                  <td className={`border p-2 text-right font-mono ${t.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>${Number(t.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default ProjectEditor;
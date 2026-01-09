import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, 
  Image as ImageIcon, FileSpreadsheet, Printer, X, 
  Users, Map, Home, Edit2, Save, ArrowLeft, FolderPlus, LayoutGrid, Calendar, Check, Link as LinkIcon, Camera, Calculator, Minus
} from 'lucide-react';

// --- 引入 Firebase 模組 ---
import { db } from './firebase'; 
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- 設定收支分類 ---
const CATEGORIES = {
  expense: ["土地成本", "建物成本", "仲介費", "代書/規費", "整地/工程", "廣告行銷", "稅務支出", "雜支"],
  income: ["銷售定金", "簽約款", "用印款", "完稅款", "尾款", "租金收入", "退稅/其他"]
};

// --- 預設出售人清單 ---
const PREDEFINED_SELLERS = ["衍得發建設有限公司", "余聰毅", "曾久峰", "邱照達", "吳銀郎", "簡永欽", "簡永源", "張平馬"];

// --- 工具函式：m2 轉 坪 (精確到小數點第四位) ---
const toPing = (m2) => {
  const val = Number(m2);
  return isNaN(val) ? 0 : (val * 0.3025);
};

// ====================================================================================================
// 子組件：專案編輯器 (ProjectEditor)
// ====================================================================================================
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
  
  const createEmptyLandItem = () => ({
    id: Date.now() + Math.random(),
    lotNumber: "",
    areaM2: "",
    shareNum: "1",
    shareDenom: "1",
    pricePerPing: "",
    subtotal: "" 
  });

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
    address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: []
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

  // --- 計算邏輯：持有面積 ---
  const currentHoldingAreaM2 = useMemo(() => {
    let total = 0;
    tempLand.items.forEach(item => {
      const area = Number(item.areaM2) || 0;
      const num = Number(item.shareNum) || 0;
      const denom = Number(item.shareDenom) || 1;
      total += area * (num / denom);
    });
    return total.toFixed(4);
  }, [tempLand.items]);

  const currentHoldingAreaPing = useMemo(() => toPing(currentHoldingAreaM2).toFixed(4), [currentHoldingAreaM2]);

  // --- 財務統計 ---
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

  // --- 自動儲存 (Debounce: 1.5秒後寫入資料庫) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      // 只有當資料真的有變動時才呼叫 onSave (這裡假設 onSave 會處理 DB 更新)
      onSave({ 
        ...initialData, 
        name: projectName, 
        buyers, 
        lands, 
        buildings, 
        transactions, 
        updatedAt: new Date().toISOString() 
      });
    }, 1500); // 延遲 1.5 秒

    return () => clearTimeout(timer);
  }, [projectName, buyers, lands, buildings, transactions]);

  // --- 操作函式 ---
  const addLandSeller = () => {
    if (!tempLandSeller.name) return;
    setTempLand({ ...tempLand, sellers: [...tempLand.sellers, { id: Date.now(), ...tempLandSeller }] });
    setTempLandSeller({ name: "", phone: "", address: "" });
  };

  const removeLandSeller = (id) => {
    setTempLand({ ...tempLand, sellers: tempLand.sellers.filter(s => s.id !== id) });
  };

  const addLandItemField = () => {
    setTempLand({ ...tempLand, items: [...tempLand.items, createEmptyLandItem()] });
  };

  const removeLandItemField = (idx) => {
    const newItems = tempLand.items.filter((_, i) => i !== idx);
    setTempLand({ ...tempLand, items: newItems.length > 0 ? newItems : [createEmptyLandItem()] });
  };

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
    
    let totalM2 = 0;
    let totalPingSum = 0;
    let totalPriceSum = 0;
    
    tempLand.items.forEach(item => {
      const hM2 = Number(item.areaM2) * (Number(item.shareNum) / Number(item.shareDenom));
      totalM2 += hM2;
      totalPingSum += toPing(hM2);
      totalPriceSum += (Number(item.subtotal) || 0);
    });

    const landData = { 
      ...tempLand, 
      holdingAreaM2: totalM2.toFixed(4), 
      holdingAreaPing: totalPingSum.toFixed(4), 
      totalPrice: totalPriceSum 
    };

    if (editingLandId) setLands(lands.map(l => l.id === editingLandId ? { ...landData, id: l.id } : l));
    else setLands([...lands, { ...landData, id: Date.now() }]);
    
    setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] });
    setShowLandForm(false);
    setEditingLandId(null);
  };

  const saveBuyer = () => {
    if (!newBuyer.name) return;
    if (editingBuyerId) setBuyers(buyers.map(b => b.id === editingBuyerId ? { ...b, ...newBuyer } : b));
    else setBuyers([...buyers, { id: Date.now(), ...newBuyer }]);
    setEditingBuyerId(null);
    setNewBuyer({ name: "", phone: "", address: "" });
  };

  const addBuildingSeller = () => {
    if (!tempBuildingSeller.name) return;
    setTempBuilding({ ...tempBuilding, sellers: [...tempBuilding.sellers, { id: Date.now(), ...tempBuildingSeller }] });
    setTempBuildingSeller({ name: "", phone: "", address: "" });
  };

  const removeBuildingSeller = (id) => {
    setTempBuilding({ ...tempBuilding, sellers: tempBuilding.sellers.filter(s => s.id !== id) });
  };

  const saveBuilding = () => {
    if(!tempBuilding.address) return alert("請輸入門牌地址");
    if (editingBuildingId) setBuildings(buildings.map(b => b.id === editingBuildingId ? { ...tempBuilding, id: b.id } : b));
    else setBuildings([...buildings, { ...tempBuilding, id: Date.now() }]);
    setTempBuilding({ address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [] });
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewTx({ ...newTx, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const exportMasterCSV = () => {
    let csvContent = "\uFEFF"; 
    csvContent += `=== 專案報表 ===\n專案名稱,${projectName}\n最後更新,${new Date().toLocaleString()}\n\n`;
    csvContent += "=== 土地清單 ===\n出售人,地段,地號,持有面積(㎡),持有坪數,單價,小計\n";
    lands.forEach(l => {
      const sellersStr = l.sellers.map(s => s.name).join(';');
      l.items.forEach(item => {
        const hM2 = (Number(item.areaM2) * (Number(item.shareNum) / Number(item.shareDenom))).toFixed(4);
        csvContent += `"${sellersStr}",${l.section},${item.lotNumber},${hM2},${toPing(hM2).toFixed(4)},${item.pricePerPing},${item.subtotal}\n`;
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `[完整數據]_${projectName}.csv`;
    link.click();
  };

  const handlePrint = () => window.print();

  const LinkedLedger = ({ linkedId, linkedType }) => {
    const relatedTxs = transactions.filter(t => t.linkedId === linkedId && t.linkedType === linkedType);
    const [isAdding, setIsAdding] = useState(false);

    return (
      <div className="mt-4 border-t pt-4 bg-gray-50/50 p-4 rounded-xl print:bg-white print:border print:p-2">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider"><LinkIcon className="w-3 h-3" /> 此標的收支紀錄</h5>
          <button onClick={() => { setNewTx({ ...newTx, linkedId, linkedType, note: "" }); setIsAdding(!isAdding); }} className="text-[10px] font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition print:hidden">
            {isAdding ? "關閉" : "＋ 新增帳目"}
          </button>
        </div>
        {isAdding && (
          <div className="bg-white p-3 border rounded shadow-sm mb-3 animate-fadeIn print:hidden">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="date" className="p-1 border rounded text-xs" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
              <select className="p-1 border rounded text-xs" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value, category: CATEGORIES[e.target.value][0]})}>
                <option value="expense">支出</option><option value="income">收入</option>
              </select>
              <select className="p-1 border rounded text-xs" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                {CATEGORIES[newTx.type].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="金額" className="p-1 border rounded text-xs" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
            </div>
            <input placeholder="說明..." className="w-full p-1 border rounded text-xs mb-2" value={newTx.note} onChange={e => setNewTx({...newTx, note: e.target.value})} />
            <button onClick={() => { saveTransaction(); setIsAdding(false); }} className="w-full bg-blue-600 text-white text-xs py-1 rounded font-bold">儲存紀錄</button>
          </div>
        )}
        <div className="space-y-1">
          {relatedTxs.length > 0 ? relatedTxs.map(t => (
            <div key={t.id} className="flex justify-between items-center text-[11px] p-2 bg-white border rounded">
              <span className="text-gray-400">{t.date}</span>
              <span className="flex-1 px-3 text-gray-700 font-medium">{t.note} <span className="text-[10px] text-gray-300">({t.category})</span></span>
              <span className={`font-mono font-bold ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                {t.type==='income'?'+':'-'}${Number(t.amount).toLocaleString()}
              </span>
            </div>
          )) : <div className="text-[10px] text-gray-300 italic text-center py-2">目前尚無收支紀錄</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4 print:mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition print:hidden"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-widest decoration-blue-500 underline underline-offset-4">專案管理工作區</div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent" autoFocus />
                  <button onClick={() => setIsEditingName(false)} className="text-green-600"><Save className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-gray-800">{projectName}</h1>
                  <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-600 print:hidden transition"><Edit2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportMasterCSV} className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm shadow-sm transition font-bold"><FileSpreadsheet className="w-4 h-4" /> 匯出資料</button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm shadow-sm transition font-bold"><Printer className="w-4 h-4" /> 列印 PDF</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto print:hidden no-scrollbar">
        {[ { id: 'project', icon: Users, label: '買受人資訊' }, { id: 'land', icon: Map, label: '土地標格資訊' }, { id: 'building', icon: Home, label: '建物標格資訊' }, { id: 'finance', icon: DollarSign, label: '財務收支帳' } ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'project' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 animate-fadeIn">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-l-4 border-blue-500 pl-3 uppercase tracking-wider">買受人資訊管理</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100 print:hidden">
            <input type="text" placeholder="姓名" className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} />
            <input type="text" placeholder="電話" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-400" value={newBuyer.phone} onChange={e => setNewBuyer({...newBuyer, phone: e.target.value})} />
            <input type="text" placeholder="地址" className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-400" value={newBuyer.address} onChange={e => setNewBuyer({...newBuyer, address: e.target.value})} />
            <button onClick={saveBuyer} className={`px-4 py-2 rounded text-white text-sm font-bold transition-all shadow-md ${editingBuyerId ? 'bg-orange-600' : 'bg-blue-600'}`}>
              {editingBuyerId ? "更新" : "新增"}
            </button>
          </div>
          <div className="space-y-2">
            {buyers.map(b => (
              <div key={b.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition group print:p-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="font-bold text-gray-800 underline decoration-blue-200 underline-offset-4">{b.name}</div>
                  <div className="text-gray-600">{b.phone}</div>
                  <div className="text-gray-500 truncate">{b.address}</div>
                </div>
                <div className="flex gap-2 ml-4 print:hidden">
                  <button onClick={() => {setEditingBuyerId(b.id); setNewBuyer({...b});}} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setBuyers(buyers.filter(item => item.id !== b.id))} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'land' && (
        <div className="space-y-4 animate-fadeIn">
          {!showLandForm && <button onClick={() => { setEditingLandId(null); setTempLand({ section: "", items: [createEmptyLandItem()], sellers: [] }); setShowLandForm(true); }} className="w-full py-4 border-2 border-dashed rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center gap-2 transition bg-white print:hidden shadow-sm"><Plus className="w-5 h-5" /> 錄入土地標的資訊 (多筆錄入)</button>}
          {showLandForm && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 animate-fadeIn">
              <div className="flex justify-between mb-6 font-bold text-blue-900 border-b pb-3">
                <h3 className="flex items-center gap-2"><Map className="w-6 h-6" /> {editingLandId ? "修改標的" : "新增土地標的"}</h3>
                <button onClick={() => setShowLandForm(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-6 h-6" /></button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">步驟 1: 土地出售人</h4>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                   <div className="flex-1">
                      <input list="pre-sellers" placeholder="出售人姓名" className="w-full p-2 border rounded text-sm outline-none bg-white focus:ring-2 focus:ring-blue-100" value={tempLandSeller.name} onChange={e => setTempLandSeller({...tempLandSeller, name: e.target.value})} />
                      <datalist id="pre-sellers">{PREDEFINED_SELLERS.map(n => <option key={n} value={n} />)}</datalist>
                   </div>
                   <input placeholder="電話" className="flex-1 p-2 border rounded text-sm outline-none bg-white" value={tempLandSeller.phone} onChange={e => setTempLandSeller({...tempLandSeller, phone: e.target.value})} />
                   <button onClick={addLandSeller} className="bg-gray-800 text-white px-8 rounded font-black hover:bg-black transition shadow-lg text-sm">加入</button>
                </div>
                <div className="space-y-1">
                  {tempLand.sellers.map(s => <div key={s.id} className="text-xs flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm"><span>{s.name} <span className="text-gray-300 mx-2">|</span> {s.phone}</span> <button onClick={() => removeLandSeller(s.id)} className="text-red-400 hover:bg-red-50 p-1 rounded-full"><Trash2 className="w-3 h-3" /></button></div>)}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">步驟 2: 地號規格 (小計可手填)</h4>
                  <input placeholder="地段 (如：仁武段)" className="p-2 border rounded text-xs outline-none focus:ring-2 focus:ring-blue-100 w-32" value={tempLand.section} onChange={e => setTempLand({...tempLand, section: e.target.value})} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse bg-white">
                    <thead className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      <tr className="border-b">
                        <th className="p-2 w-24">地號</th>
                        <th className="p-2 w-24">面積(㎡)</th>
                        <th className="p-2 w-14">分子</th>
                        <th className="p-2 w-14">分母</th>
                        <th className="p-2 w-24">單價(元/坪)</th>
                        <th className="p-2 text-right">小計金額 ($)</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tempLand.items.map((item, idx) => {
                        const hM2 = (Number(item.areaM2) * (Number(item.shareNum) / Number(item.shareDenom)) || 0).toFixed(3);
                        const hPing = toPing(hM2).toFixed(3);
                        return (
                          <tr key={item.id} className="hover:bg-blue-50/30 transition">
                            <td className="p-2"><input className="w-full p-1.5 border rounded outline-none focus:bg-white bg-transparent" value={item.lotNumber} onChange={e => handleLandItemChange(idx, 'lotNumber', e.target.value)} /></td>
                            <td className="p-2"><input type="number" className="w-full p-1.5 border rounded outline-none focus:bg-white bg-transparent" value={item.areaM2} onChange={e => handleLandItemChange(idx, 'areaM2', e.target.value)} /></td>
                            <td className="p-2"><input className="w-full p-1.5 border rounded outline-none text-center bg-transparent" value={item.shareNum} onChange={e => handleLandItemChange(idx, 'shareNum', e.target.value)} /></td>
                            <td className="p-2"><input className="w-full p-1.5 border rounded outline-none text-center bg-transparent" value={item.shareDenom} onChange={e => handleLandItemChange(idx, 'shareDenom', e.target.value)} /></td>
                            <td className="p-2"><input type="number" className="w-full p-1.5 border rounded outline-none bg-transparent" value={item.pricePerPing} onChange={e => handleLandItemChange(idx, 'pricePerPing', e.target.value)} /></td>
                            <td className="p-2 text-right relative">
                              <span className="absolute left-2 top-3.5 text-blue-400 font-bold">$</span>
                              <input 
                                type="number" 
                                className="w-full p-1.5 pl-5 border border-blue-100 rounded outline-none font-mono font-black text-blue-600 text-right bg-blue-50/20 focus:bg-white" 
                                value={item.subtotal} 
                                onChange={e => handleLandItemChange(idx, 'subtotal', e.target.value)} 
                              />
                              <div className="text-[9px] text-gray-400 mt-1">持有: {hPing} 坪</div>
                            </td>
                            <td className="p-2"><button onClick={() => removeLandItemField(idx)} className="text-red-400 p-1 hover:bg-red-50 rounded"><Minus className="w-4 h-4" /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <button onClick={addLandItemField} className="mt-3 w-full py-2 border-2 border-dashed rounded-lg text-blue-500 hover:bg-blue-50 transition flex justify-center items-center gap-1 font-bold text-xs"><Plus className="w-4 h-4" /> 增加地號行</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-blue-600 p-4 rounded-xl text-white shadow-lg mb-6">
                <div><span className="text-[10px] font-bold opacity-60 block uppercase">案場總持有面積 (㎡)</span><span className="text-xl font-black font-mono">{currentHoldingAreaM2}</span></div>
                <div><span className="text-[10px] font-bold opacity-60 block uppercase">案場總持有面積 (坪)</span><span className="text-xl font-black font-mono">{currentHoldingAreaPing}</span></div>
              </div>

              <button onClick={saveLand} className="w-full py-4 rounded-xl text-white font-black bg-blue-600 shadow-2xl transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-100 tracking-[0.3em] uppercase font-bold">儲存土地標的</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {lands.map(l => (
              <div key={l.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-500 group print:shadow-none print:p-2">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest">土地標的</span>
                      <h4 className="font-black text-gray-900 text-2xl">
                        {l.sellers.length > 0 ? l.sellers.map(s => s.name).join(' / ') : `地段: ${l.section || "未命名"}`}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                      <div><span className="text-[10px] text-gray-400 block font-black uppercase mb-1">地號總數</span><p className="font-black text-gray-700">{l.items.length} 筆</p></div>
                      <div><span className="text-[10px] text-gray-400 block font-black uppercase mb-1">持有 (㎡)</span><p className="font-mono font-bold text-gray-700">{l.holdingAreaM2}</p></div>
                      <div><span className="text-[10px] text-gray-400 block font-black uppercase mb-1">持有 (坪)</span><p className="font-mono font-bold text-gray-700">{l.holdingAreaPing}</p></div>
                      <div><span className="text-[10px] text-blue-500 block font-black uppercase mb-1">成交總額</span><p className="font-mono font-black text-blue-600 text-lg">${Number(l.totalPrice).toLocaleString()}</p></div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 print:hidden">
                    <button onClick={() => { setEditingLandId(l.id); setTempLand({...l}); setShowLandForm(true); }} className="p-3 text-gray-300 hover:text-blue-600 transition hover:bg-blue-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => setLands(lands.filter(item => item.id !== l.id))} className="p-3 text-gray-300 hover:text-red-500 transition hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <LinkedLedger linkedId={l.id} linkedType="land" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: 建物資訊 --- */}
      {activeTab === 'building' && (
        <div className="space-y-4 animate-fadeIn">
          {!showBuildingForm && <button onClick={() => { setEditingBuildingId(null); setTempBuilding({ address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [] }); setShowBuildingForm(true); }} className="w-full py-4 border-2 border-dashed rounded-xl text-gray-400 hover:border-orange-500 hover:text-orange-500 flex justify-center items-center gap-2 transition bg-white print:hidden shadow-sm"><Plus className="w-5 h-5" /> 新增建物案場資料</button>}
          {showBuildingForm && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-orange-200 animate-fadeIn">
               <div className="flex justify-between mb-6 font-bold text-orange-900 border-b pb-3">
                 <h3 className="flex items-center gap-2"><Home className="w-6 h-6" /> {editingBuildingId ? "修改建物資訊" : "新增建物案場"}</h3>
                 <button onClick={() => setShowBuildingForm(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X className="w-6 h-6" /></button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="md:col-span-2"><label className="text-xs text-gray-500 block mb-1 font-bold">門牌地址</label><input placeholder="完整門牌地址" className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.address} onChange={e => setTempBuilding({...tempBuilding, address: e.target.value})} /></div>
                 <div><label className="text-xs text-gray-500 block mb-1 font-bold">使用執照號碼</label><input placeholder="使照號碼" className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.license} onChange={e => setTempBuilding({...tempBuilding, license: e.target.value})} /></div>
                 <div><label className="text-xs text-gray-500 block mb-1 font-bold">建物建號</label><input placeholder="建號" className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-orange-400" value={tempBuilding.buildNumber} onChange={e => setTempBuilding({...tempBuilding, buildNumber: e.target.value})} /></div>
                 <div><label className="text-xs text-gray-500 block mb-1 font-bold">建物面積(㎡)</label><input type="number" className="w-full p-2 border rounded text-sm" value={tempBuilding.areaM2} onChange={e => setTempBuilding({...tempBuilding, areaM2: e.target.value})} /></div>
                 <div><label className="text-xs text-gray-500 block mb-1 text-orange-600 font-bold underline font-black">單價 (元/坪)</label><input type="number" className="w-full p-2 border border-orange-200 rounded text-sm bg-orange-50/20 outline-none" value={tempBuilding.pricePerUnit} onChange={e => setTempBuilding({...tempBuilding, pricePerUnit: e.target.value})} /></div>
                 <div className="md:col-span-2"><label className="text-xs text-gray-500 block mb-1 text-orange-600 font-bold underline font-black">成交總金額 (元)</label><input type="number" className="w-full p-2 border border-orange-200 rounded text-sm bg-orange-50/20 font-bold" value={tempBuilding.totalPrice} onChange={e => setTempBuilding({...tempBuilding, totalPrice: e.target.value})} /></div>
               </div>
               <div className="bg-orange-50/30 p-4 rounded-xl mb-6 border border-orange-100">
                <h4 className="text-xs font-bold text-orange-700 mb-3 uppercase tracking-wider">屋主/出售人資訊</h4>
                <div className="flex flex-col md:flex-row gap-2 mb-3">
                   <div className="flex-1">
                      <input list="pre-sellers" placeholder="姓名" className="w-full p-2 border rounded text-sm outline-none bg-white" value={tempBuildingSeller.name} onChange={e => setTempBuildingSeller({...tempBuildingSeller, name: e.target.value})} />
                   </div>
                   <input placeholder="電話" className="flex-1 p-2 border rounded text-sm outline-none bg-white" value={tempBuildingSeller.phone} onChange={e => setTempBuildingSeller({...tempBuildingSeller, phone: e.target.value})} />
                   <button onClick={addBuildingSeller} className="bg-orange-600 text-white px-6 rounded text-sm hover:bg-orange-700 transition shadow-sm font-bold">加入</button>
                </div>
                <div className="space-y-1">
                  {tempBuilding.sellers.map(s => <div key={s.id} className="text-xs flex justify-between items-center p-2 bg-white border rounded shadow-sm"><span>{s.name} | {s.phone}</span> <button onClick={() => removeBuildingSeller(s.id)} className="text-red-400 hover:bg-red-50 p-1 rounded-full"><Trash2 className="w-3 h-3" /></button></div>)}
                </div>
              </div>
               <button onClick={saveBuilding} className="w-full py-4 rounded-xl text-white font-black bg-orange-600 shadow-xl transition-all hover:bg-orange-700 hover:scale-[1.01] tracking-widest uppercase font-bold">儲存建物標的</button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-6">
            {buildings.map(b => (
              <div key={b.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-500 group print:shadow-none print:p-2">
                 <div className="flex justify-between items-start">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tighter">建物案場</span>
                       <h4 className="font-black text-gray-900 text-xl">{b.sellers.length > 0 ? b.sellers.map(s => s.name).join(' / ') : `地址: ${b.address}`}</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                       <div><span className="text-[10px] text-gray-400 block font-black uppercase mb-1">地址</span>{b.address}</div>
                       <div><span className="text-[10px] text-gray-400 block font-black uppercase mb-1">建號</span>{b.buildNumber}</div>
                       <div><span className="text-[10px] text-orange-500 block font-black uppercase mb-1">總額</span><span className="font-mono font-black text-orange-600 text-lg">${Number(b.totalPrice).toLocaleString()}</span></div>
                     </div>
                   </div>
                   <div className="flex gap-3 ml-4 print:hidden">
                     <button onClick={() => { setEditingBuildingId(b.id); setTempBuilding({...b}); setShowBuildingForm(true); }} className="p-3 text-gray-300 hover:text-orange-600 transition hover:bg-orange-50 rounded-full"><Edit2 className="w-5 h-5" /></button>
                     <button onClick={() => setBuildings(buildings.filter(item => item.id !== b.id))} className="p-3 text-gray-300 hover:text-red-500 transition hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                   </div>
                 </div>
                 <LinkedLedger linkedId={b.id} linkedType="building" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: 財務帳 --- */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 總計面板 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center h-28"><div className="text-xs text-gray-400 font-black uppercase mb-2 tracking-widest text-center">累計總收入</div><div className="text-3xl font-black text-green-600 text-center">${stats.totalIncome.toLocaleString()}</div></div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center h-28"><div className="text-xs text-gray-400 font-black uppercase mb-2 tracking-widest text-center">累計總支出</div><div className="text-3xl font-black text-red-500 text-center">${stats.totalExpense.toLocaleString()}</div></div>
             <div className={`p-5 rounded-xl shadow-xl flex flex-col justify-center h-28 ${stats.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}><div className="text-xs text-white/60 font-black uppercase mb-2 tracking-widest text-center">當前總損益 (ROI: {stats.roi}%)</div><div className="text-3xl font-black text-center">${stats.netProfit.toLocaleString()}</div></div>
          </div>
          
          {/* 分項小計 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em]"><Calculator className="w-4 h-4 text-blue-500" /> 分項財務小計 (Subtotals)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[ { key: 'land', label: '土地相關', icon: Map, color: 'blue' }, { key: 'building', label: '建物相關', icon: Home, color: 'orange' }, { key: 'general', label: '一般項目', icon: DollarSign, color: 'gray' } ].map(item => (
                <div key={item.key} className={`p-4 rounded-xl border-2 ${item.key==='land'?'bg-blue-50 border-blue-100':item.key==='building'?'bg-orange-50 border-orange-100':'bg-gray-50 border-gray-200'}`}>
                  <div className={`font-black mb-3 flex items-center gap-2 text-xs uppercase tracking-widest ${item.key==='land'?'text-blue-800':item.key==='building'?'text-orange-800':'text-gray-700'}`}>
                    <item.icon className="w-4 h-4"/> {item.label}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span>收入：</span><span className="font-mono font-bold text-green-600">${(stats.subTotals[item.key]?.income || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>支出：</span><span className="font-mono font-bold text-red-500">${(stats.subTotals[item.key]?.expense || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-black"><span>淨利：</span><span className={`font-mono ${(stats.subTotals[item.key]?.income - stats.subTotals[item.key]?.expense) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>${((stats.subTotals[item.key]?.income || 0) - (stats.subTotals[item.key]?.expense || 0)).toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-2xl shadow-xl border transition-all print:hidden ${editingTxId ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
            <h3 className="font-black text-gray-800 mb-6 flex justify-between items-center text-sm uppercase tracking-widest border-b pb-4">
              <span className="flex items-center gap-2">{editingTxId ? <><Edit2 className="w-5 h-5 text-orange-600" /> 修改收支資料</> : <><Plus className="w-5 h-5 text-blue-600" /> 登錄專案收支</>}</span>
              {editingTxId && <button onClick={() => setEditingTxId(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">取消修改</button>}
            </h3>
            <form onSubmit={saveTransaction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                <div><label className="text-[10px] text-gray-400 block mb-2 font-black uppercase">日期</label><input type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} /></div>
                <div><label className="text-[10px] text-gray-400 block mb-2 font-black uppercase">類型</label><select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value, category: CATEGORIES[e.target.value][0]})}>
                  <option value="expense">支出 (Expense)</option><option value="income">收入 (Income)</option>
                </select></div>
                <div>
                  <label className="text-[10px] text-blue-500 font-bold block mb-2 font-black uppercase tracking-widest">收支歸屬</label>
                  <select className="w-full p-3 border border-blue-100 rounded-xl bg-blue-50/20 font-bold outline-none focus:ring-2 focus:ring-blue-200" value={newTx.linkedType || "general"} onChange={e => setNewTx({...newTx, linkedType: e.target.value, linkedId: null})}>
                    <option value="general">一般專案收支</option><option value="land">土地標的 (依出售人)</option><option value="building">建物標的 (依屋主)</option>
                  </select>
                </div>
                {newTx.linkedType !== 'general' && (
                  <div>
                    <label className="text-[10px] text-blue-500 font-bold block mb-2 font-black uppercase tracking-widest">具體對象</label>
                    <select className="w-full p-3 border border-blue-100 rounded-xl bg-blue-50/20 font-bold outline-none focus:ring-2 focus:ring-blue-200" value={newTx.linkedId || ""} onChange={e => setNewTx({...newTx, linkedId: Number(e.target.value)})}>
                      <option value="">-- 請選擇 --</option>
                      {newTx.linkedType === 'land' ? 
                        lands.map(l => (
                          <option key={l.id} value={l.id}>{l.sellers.map(s=>s.name).join('/') || `地段: ${l.section}`}</option>
                        )) : 
                        buildings.map(b => (
                          <option key={b.id} value={b.id}>{b.sellers.map(s=>s.name).join('/') || b.address.substring(0,10)}</option>
                        ))
                      }
                    </select>
                  </div>
                )}
                <div><label className="text-[10px] text-gray-400 block mb-2 font-black uppercase">會計科目</label><select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-white" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>{CATEGORIES[newTx.type].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-[10px] text-blue-600 block mb-2 font-black underline uppercase">金額 ($)</label><input type="number" className="w-full p-3 border border-blue-100 rounded-xl font-black bg-blue-50/30 outline-none" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-8"><input placeholder="備註說明 (用途、廠商、發票編號)..." className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 focus:bg-white" value={newTx.note} onChange={e => setNewTx({...newTx, note: e.target.value})} /></div>
                <div className="md:col-span-2">
                  <input type="file" id="fileUploadGlobal" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <label htmlFor="fileUploadGlobal" className={`flex justify-center items-center gap-2 w-full p-3 border-2 border-dashed rounded-xl text-[10px] font-black cursor-pointer transition-all hover:bg-blue-50 ${newTx.image ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                    {newTx.image ? <><Check className="w-4 h-4" /> 單據已存</> : <><Camera className="w-4 h-4" /> 插入圖片</>}
                  </label>
                </div>
                <div className="md:col-span-2"><button type="submit" className={`w-full py-3.5 rounded-xl text-white text-xs font-black shadow-xl transition-all ${editingTxId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700 uppercase tracking-widest'}`}>{editingTxId ? "更新" : "錄入"}</button></div>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
             <table className="w-full text-xs text-left border-collapse">
               <thead className="bg-gray-50 text-gray-400 border-b uppercase text-[10px] font-black tracking-widest">
                 <tr><th className="p-6">日期</th><th className="p-6">科目</th><th className="p-6">歸屬 / 備註</th><th className="p-6 text-right">金額 ($)</th><th className="p-6 text-center print:hidden">操作</th></tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {transactions.length > 0 ? transactions.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t => {
                   let linkedLabel = "一般專案收支";
                   if(t.linkedType === 'land') {
                     const land = lands.find(l=>l.id===t.linkedId);
                     linkedLabel = land ? (land.sellers.map(s=>s.name).join('/') || land.items[0]?.lotNumber) : '未知土地';
                   } else if(t.linkedType === 'building') {
                     const build = buildings.find(b=>b.id===t.linkedId);
                     linkedLabel = build ? (build.sellers.map(s=>s.name).join('/') || build.address.substring(0,8)) : '未知建物';
                   }
                   return (
                     <tr key={t.id} className={`hover:bg-gray-50 transition group ${editingTxId === t.id ? 'bg-orange-50' : ''}`}>
                       <td className="p-6 text-gray-500 font-mono">{t.date}</td>
                       <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${t.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.category}</span></td>
                       <td className="p-6">
                          <div className="flex items-center gap-2 mb-2">
                             <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-black ${t.linkedId ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                {t.linkedId && <LinkIcon className="w-2 h-2" />}
                                {linkedLabel}
                             </span>
                             {t.image && <button onClick={() => setPreviewImage(t.image)} className="text-[10px] text-blue-400 hover:underline font-black flex items-center gap-1 hover:text-blue-600"><ImageIcon className="w-3 h-3" /> 查看憑證</button>}
                          </div>
                          <div className="text-gray-700 font-medium">{t.note || "-"}</div>
                       </td>
                       <td className={`p-6 text-right font-mono font-black text-lg ${t.type==='income'?'text-green-600':'text-red-600'}`}>${Number(t.amount).toLocaleString()}</td>
                       <td className="p-6 text-center print:hidden">
                         <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                           <button onClick={() => {setEditingTxId(t.id); setNewTx({...t});}} className="text-gray-400 hover:text-blue-600 transition-all p-2 hover:bg-white rounded-full shadow-sm"><Edit2 className="w-4 h-4" /></button>
                           <button onClick={() => setTransactions(transactions.filter(item => item.id !== t.id))} className="text-gray-400 hover:text-red-500 transition-all p-2 hover:bg-white rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>
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

      {/* 圖片預覽 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-6 print:hidden animate-fadeIn" onClick={() => setPreviewImage(null)}>
          <div className="relative w-full max-w-4xl h-full flex flex-col justify-center">
            <button onClick={() => setPreviewImage(null)} className="absolute top-0 right-0 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition shadow-2xl mb-4"><X className="w-8 h-8" /></button>
            <img src={previewImage} alt="憑證預覽" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl mx-auto object-contain bg-white" />
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================================================
// 主組件：App
// ====================================================================================================
const App = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "屏東案場開發 (範例)",
      updatedAt: new Date().toISOString(),
      transactions: [],
      buyers: [], lands: [], buildings: []
    }
  ]);

  const [activeProjectId, setActiveProjectId] = useState(null);

  const handleSaveProject = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const getProjectSummary = (project) => {
    const income = project.transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
    const expense = project.transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
    return { income, expense, profit: income - expense };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 bg-gray-50 min-h-screen font-sans">
      {activeProjectId ? (
        <ProjectEditor 
          key={activeProjectId} 
          initialData={projects.find(p => p.id === activeProjectId)} 
          onSave={handleSaveProject} 
          onBack={() => setActiveProjectId(null)} 
        />
      ) : (
        <div className="animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200"><LayoutGrid className="w-10 h-10 text-white" /></div>
                資產管理系統
              </h1>
              <p className="text-gray-400 mt-4 font-bold tracking-[0.3em] uppercase ml-16">Yandefa Asset Management</p>
            </div>
            <button 
              onClick={() => { const newP = { id: Date.now(), name: "新案場 " + new Date().toLocaleDateString(), updatedAt: new Date().toISOString(), transactions: [], buyers: [], lands: [], buildings: [] }; setProjects([newP, ...projects]); setActiveProjectId(newP.id); }}
              className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 shadow-2xl transition-all transform hover:-translate-y-2 font-black tracking-widest uppercase"
            >
              <FolderPlus className="w-6 h-6" /> 建立新案場
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {projects.map(project => {
              const summary = getProjectSummary(project);
              return (
                <div 
                  key={project.id} 
                  onClick={() => setActiveProjectId(project.id)}
                  className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 cursor-pointer hover:shadow-2xl hover:border-blue-200 transition-all duration-500 group flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] transition-all group-hover:bg-blue-600 group-hover:scale-110 -z-10 opacity-50" />
                  <div className="flex justify-between items-start mb-10">
                    <div className="bg-blue-50 p-5 rounded-3xl group-hover:bg-white transition-colors duration-500 shadow-sm">
                      <Home className="w-10 h-10 text-blue-600 group-hover:text-white" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm('確定刪除此案場？此動作不可撤銷。')) setProjects(projects.filter(p => p.id !== project.id)); }} className="text-gray-200 hover:text-red-500 transition-all p-3 rounded-full hover:bg-red-50"><Trash2 className="w-6 h-6" /></button>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-3 line-clamp-2 min-h-[4.5rem] leading-tight">{project.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-12">
                    <Calendar className="w-4 h-4" /> 更新日期: {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-auto pt-8 border-t border-gray-50 grid grid-cols-2 gap-6">
                    <div><div className="text-[10px] text-gray-400 font-black uppercase mb-2">案場成本</div><div className="font-mono font-black text-gray-700 text-lg">${summary.expense.toLocaleString()}</div></div>
                    <div><div className="text-[10px] text-gray-400 font-black uppercase mb-2">目前盈虧</div><div className={`font-mono font-black text-lg ${summary.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>${summary.profit.toLocaleString()}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
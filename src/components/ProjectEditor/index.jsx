import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, Users, Receipt, Map, Home, ClipboardCheck, DollarSign, 
  ArrowLeft, Building2, Tag, Save, FileSpreadsheet, Printer, Settings, X,
  Edit2 // ✅ 已補上此圖示
} from 'lucide-react';
import { exportMasterCSV, toROCDate } from '../../utils/helpers'; 

// 引入拆分組件
import TeamSection from './TeamSection';
import BuyerSection from './BuyerSection';
import LandSection from './LandSection';
import BuildingSection from './BuildingSection';
import RequisitionSection from './RequisitionSection';
import HandoverSection from './HandoverSection';
import FinanceSection from './FinanceSection';
import PrintView from './PrintView'; 

const deepSanitize = (data) => {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => deepSanitize(item));
  const sanitizedObj = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    sanitizedObj[key] = (typeof value !== 'function' && typeof value !== 'symbol') ? deepSanitize(value) : null;
  });
  return sanitizedObj;
};

const ProjectEditor = ({ initialData, onSave, onBack, agencyDB }) => {
  const [activeTab, setActiveTab] = useState('team'); 
  const [projectName, setProjectName] = useState(initialData.name || "新案件名稱");
  const [projectZone, setProjectZone] = useState(initialData.zone || "未分類"); 
  const [projectSite, setProjectSite] = useState(initialData.site || "大成工業城");
  const [isEditingName, setIsEditingName] = useState(false);

  // States
  const [projectTeams, setProjectTeams] = useState(Array.isArray(initialData.projectTeam) ? initialData.projectTeam : (initialData.projectTeam ? [{ id: Date.now(), ...initialData.projectTeam }] : []));
  const [buyers, setBuyers] = useState(initialData.buyers || []);
  const [lands, setLands] = useState(initialData.lands || []);
  const [buildings, setBuildings] = useState(initialData.buildings || []);
  const [transactions, setTransactions] = useState(initialData.transactions || []);
  const [requisitions, setRequisitions] = useState(initialData.requisitions || []);
  const [handoverData, setHandoverData] = useState({ handoverDate: "", remotes: "0", keysFront: "0", keysBack: "0", warranty: false, drawings: false, electricityBill: "", waterBill: "", originalPermit: false, ...initialData.handoverData });
  
  // UI States
  const [printConfig, setPrintConfig] = useState({ team: true, buyers: true, lands: true, buildings: true, handover: true, finance: true, requisition: true });
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [visibleLandIds, setVisibleLandIds] = useState([]);
  const [visibleLedgers, setVisibleLedgers] = useState({ general: true, land: true, building: true, buyer: true });

  // Sorting
  const sortedBuyers = useMemo(() => [...buyers].sort((a, b) => (a.unit || "").localeCompare(b.unit || "", "zh-Hant")), [buyers]);
  const sortedTeams = useMemo(() => [...projectTeams].sort((a, b) => (a.unit || "").localeCompare(b.unit || "", "zh-Hant")), [projectTeams]);
  const sortedBuildings = useMemo(() => [...buildings].sort((a, b) => (a.unit || "").localeCompare(b.unit || "", "zh-Hant")), [buildings]);

  // Calculations
  const landGrandTotal = useMemo(() => {
    let totalAreaM2 = 0, totalAreaPing = 0, totalMoney = 0;
    lands.forEach(l => { totalAreaM2 += Number(l.holdingAreaM2) || 0; totalAreaPing += Number(l.holdingAreaPing) || 0; totalMoney += Number(l.totalPrice) || 0; });
    return { m2: totalAreaM2.toFixed(3), ping: totalAreaPing.toFixed(3), price: totalMoney };
  }, [lands]);

  const stats = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    const subTotals = { general: { income: 0, expense: 0 }, land: { income: 0, expense: 0 }, building: { income: 0, expense: 0 }, buyer: { income: 0, expense: 0 } };
    transactions.forEach(t => {
      const val = Number(t.amount) || 0;
      const lType = t.linkedType || 'general';
      if (t.type === 'income') { totalIncome += val; if (subTotals[lType]) subTotals[lType].income += val; } 
      else { totalExpense += val; if (subTotals[lType]) subTotals[lType].expense += val; }
    });
    const netProfit = totalIncome - totalExpense;
    const roi = totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : 0;
    return { totalIncome, totalExpense, netProfit, roi, subTotals };
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const groups = { general: [], land: [], building: [], buyer: [] };
    const sortedTx = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    sortedTx.forEach(t => { const type = t.linkedType || 'general'; if (groups[type]) groups[type].push(t); });
    return groups;
  }, [transactions]);

  const groupedRequisitions = useMemo(() => {
    const g = {};
    requisitions.forEach(r => { const k = r.shareholder || '未分類'; if(!g[k]) g[k] = []; g[k].push(r); });
    return g;
  }, [requisitions]);

  const allLotNumbers = lands.map(l => `${l.section} (${l.items.map(i=>i.lotNumber).join(',')})`).join('; ');
  const allBuildingInfo = buildings.map(b => `建號:${b.buildNumber} / 地址:${b.address}`).join('; ');

  // Effects
  useEffect(() => { if (lands.length > 0 && visibleLandIds.length === 0) setVisibleLandIds(lands.map(l => l.id)); }, [lands]);
  useEffect(() => {
    if (!initialData) return;
    const timer = setTimeout(() => {
      const rawData = { id: initialData.id, name: projectName, zone: projectZone, site: projectSite, projectTeam: projectTeams, buyers, lands, buildings, transactions, handoverData, requisitions, updatedAt: new Date().toISOString() };
      onSave(deepSanitize(rawData));
    }, 1500);
    return () => clearTimeout(timer);
  }, [projectName, projectZone, projectSite, projectTeams, buyers, lands, buildings, transactions, handoverData, requisitions]);

  const handlePrint = () => window.print();
  const toggleLandVisibility = (id) => { if (visibleLandIds.includes(id)) { setVisibleLandIds(visibleLandIds.filter(v => v !== id)); } else { setVisibleLandIds([...visibleLandIds, id]); } };

  const handleImageUploadGeneric = (file, callback) => { 
    if (file) { const reader = new FileReader(); reader.onloadend = () => callback(reader.result); reader.readAsDataURL(file); } 
  };

  return (
    <div className="animate-fadeIn pb-24 text-base app-wrapper">
       <div className="print:hidden">
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6">
            <div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button><div><div className="text-sm text-gray-500 font-medium uppercase tracking-widest decoration-blue-500 underline underline-offset-4">專案管理工作區</div><div className="flex flex-wrap items-center gap-4 mt-1">{isEditingName ? (<div className="flex items-center gap-2"><input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none bg-transparent" autoFocus /><button onClick={() => setIsEditingName(false)} className="text-green-600"><Save className="w-6 h-6" /></button></div>) : (<div className="flex items-center gap-2 group"><h1 className="text-3xl font-bold text-gray-800" title="點擊修改名稱">{projectName}</h1><button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-5 h-5" /></button></div>)}<div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-lg border border-gray-200"><Building2 className="w-4 h-4 text-gray-500 ml-1" /><input className="bg-transparent text-sm font-bold text-gray-700 outline-none w-28 placeholder-gray-400" placeholder="輸入案場名稱" value={projectSite} onChange={(e) => setProjectSite(e.target.value)} /><div className="w-px h-4 bg-gray-300 mx-1"></div><Tag className="w-4 h-4 text-gray-500" /><select className="bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer" value={projectZone} onChange={(e) => setProjectZone(e.target.value)}><option value="未分類">未分類</option><option value="A區">A區</option><option value="B區">B區</option><option value="C區">C區</option><option value="D區">D區</option><option value="E區">E區</option></select></div></div></div></div>
            <div className="flex gap-3"><div className="relative"><button onClick={() => setShowPrintSettings(!showPrintSettings)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm shadow-sm transition font-bold"><Settings className="w-5 h-5" /> 匯出設定</button>{showPrintSettings && (<div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 animate-fadeIn"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">勾選要匯出的項目</h4><div className="space-y-2 max-h-[60vh] overflow-y-auto"><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.team} onChange={(e) => setPrintConfig({...printConfig, team: e.target.checked})} /><span className="text-sm font-bold text-gray-700">專案團隊</span></label><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.buyers} onChange={(e) => setPrintConfig({...printConfig, buyers: e.target.checked})} /><span className="text-sm font-bold text-gray-700">買受人</span></label><div className="border rounded-lg p-2 bg-gray-50"><label className="flex items-center gap-3 cursor-pointer mb-2"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.lands} onChange={(e) => setPrintConfig({...printConfig, lands: e.target.checked})} /><span className="text-sm font-bold text-gray-700">土地清單 (總開關)</span></label>{printConfig.lands && lands.length > 0 && (<div className="pl-6 space-y-1 border-t border-gray-200 pt-2">{lands.map(l => (<label key={l.id} className="flex items-center gap-2 cursor-pointer hover:text-blue-600"><input type="checkbox" className="w-3 h-3 accent-blue-500" checked={visibleLandIds.includes(l.id)} onChange={() => toggleLandVisibility(l.id)} /><span className="text-xs text-gray-600 truncate max-w-[180px]">{l.sellers.map(s=>s.name).join('/')} ({l.section})</span></label>))}</div>)}</div><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.buildings} onChange={(e) => setPrintConfig({...printConfig, buildings: e.target.checked})} /><span className="text-sm font-bold text-gray-700">建物清單</span></label><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.requisition} onChange={(e) => setPrintConfig({...printConfig, requisition: e.target.checked})} /><span className="text-sm font-bold text-gray-700">請款單</span></label><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.handover} onChange={(e) => setPrintConfig({...printConfig, handover: e.target.checked})} /><span className="text-sm font-bold text-gray-700">點交單</span></label><label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={printConfig.finance} onChange={(e) => setPrintConfig({...printConfig, finance: e.target.checked})} /><span className="text-sm font-bold text-gray-700">財務報表</span></label></div></div>)}</div><button onClick={()=>exportMasterCSV(projectName, buyers, lands, buildings, transactions, handoverData, projectTeams, requisitions, visibleLandIds)} className="flex items-center gap-2 px-4 py-2.5 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm shadow-sm transition font-bold"><FileSpreadsheet className="w-5 h-5" /> 匯出 CSV</button><button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm shadow-sm transition font-bold"><Printer className="w-5 h-5" /> 預覽/列印</button></div>
          </div>
          
          <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar"><button onClick={() => setActiveTab('team')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><Briefcase className="w-5 h-5" /> 專案團隊</button><button onClick={() => setActiveTab('project')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'project' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><Users className="w-5 h-5" /> 買受人資訊</button><button onClick={() => setActiveTab('requisition')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'requisition' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><Receipt className="w-5 h-5" /> 請款單</button><button onClick={() => setActiveTab('land')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'land' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><Map className="w-5 h-5" /> 土地標格</button><button onClick={() => setActiveTab('building')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'building' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><Home className="w-5 h-5" /> 建物標格</button><button onClick={() => setActiveTab('handover')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'handover' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><ClipboardCheck className="w-5 h-5" /> 交屋點交</button><button onClick={() => setActiveTab('finance')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 text-sm ${activeTab === 'finance' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}><DollarSign className="w-5 h-5" /> 財務收支</button></div>

          {activeTab === 'team' && <TeamSection projectTeams={sortedTeams} setProjectTeams={setProjectTeams} agencyDB={agencyDB} sortedBuildings={sortedBuildings} setPreviewImage={setPreviewImage} handleImageUploadGeneric={handleImageUploadGeneric} />}
          {activeTab === 'project' && <BuyerSection buyers={buyers} setBuyers={setBuyers} sortedBuyers={sortedBuyers} setPreviewImage={setPreviewImage} handleImageUploadGeneric={handleImageUploadGeneric} />}
          {activeTab === 'land' && <LandSection lands={lands} setLands={setLands} transactions={transactions} setTransactions={setTransactions} landGrandTotal={landGrandTotal} />}
          {activeTab === 'building' && <BuildingSection buildings={buildings} setBuildings={setBuildings} sortedBuildings={sortedBuildings} setPreviewImage={setPreviewImage} transactions={transactions} setTransactions={setTransactions} handleImageUploadGeneric={handleImageUploadGeneric} />}
          {activeTab === 'requisition' && <RequisitionSection requisitions={requisitions} setRequisitions={setRequisitions} lands={lands} buildings={buildings} handleImageUploadGeneric={handleImageUploadGeneric} setPreviewImage={setPreviewImage} />}
          {activeTab === 'handover' && <HandoverSection handoverData={handoverData} setHandoverData={setHandoverData} allLotNumbers={allLotNumbers} allBuildingInfo={allBuildingInfo} />}
          {activeTab === 'finance' && <FinanceSection transactions={transactions} setTransactions={setTransactions} stats={stats} groupedTransactions={groupedTransactions} lands={lands} buildings={buildings} buyers={buyers} visibleLedgers={visibleLedgers} setVisibleLedgers={setVisibleLedgers} handleImageUploadGeneric={handleImageUploadGeneric} setPreviewImage={setPreviewImage} />}

       </div>

       <PrintView projectName={projectName} printConfig={printConfig} projectTeams={sortedTeams} landGrandTotal={landGrandTotal} buyers={buyers} sortedBuyers={sortedBuyers} lands={lands} visibleLandIds={visibleLandIds} buildings={buildings} sortedBuildings={sortedBuildings} handoverData={handoverData} allLotNumbers={allLotNumbers} allBuildingInfo={allBuildingInfo} visibleLedgers={visibleLedgers} groupedTransactions={groupedTransactions} stats={stats} requisitions={requisitions} groupedRequisitions={groupedRequisitions} />

       {previewImage && (<div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-6 print:hidden animate-fadeIn" onClick={() => setPreviewImage(null)}><div className="relative w-full max-w-4xl h-full flex flex-col justify-center"><button onClick={() => setPreviewImage(null)} className="absolute top-0 right-0 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition shadow-2xl mb-4"><X className="w-8 h-8" /></button><img src={previewImage} alt="預覽" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl mx-auto object-contain bg-white" /></div></div>)}
    </div>
  );
};

export default ProjectEditor;
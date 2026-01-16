import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, CheckSquare, Square, Printer, PieChart, 
  Calculator, Map, DollarSign, Building, Users, Home, Search,
  ChevronDown, ChevronRight, Tag, Building2
} from 'lucide-react';
import { toPing } from '../utils/helpers';

const ProjectSummaryReport = ({ projects, onBack }) => {
  // 1. 案場選擇狀態 (預設為第一個案場或大成工業城)
  const uniqueSites = useMemo(() => {
    const sites = projects.map(p => p.site || "大成工業城");
    const unique = [...new Set(sites)].sort();
    if (!unique.includes("大成工業城")) unique.unshift("大成工業城");
    return unique;
  }, [projects]);
  
  const [activeSite, setActiveSite] = useState(uniqueSites[0]);

  // 2. 根據案場過濾後的案件，並分組
  const filteredProjects = useMemo(() => {
    const target = projects.filter(p => (p.site || "大成工業城") === activeSite);
    const groups = {};
    target.forEach(p => {
      const z = p.zone || "未分類";
      if (!groups[z]) groups[z] = [];
      groups[z].push(p);
    });
    // 回傳排序後的物件
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [projects, activeSite]);

  // 3. UI 狀態
  const [selectedIds, setSelectedIds] = useState([]); // 預設不勾選，或可改為全選
  const [expandedZones, setExpandedZones] = useState({}); // 區域收合狀態
  const [searchTerm, setSearchTerm] = useState("");

  // --- 操作邏輯 ---
  const toggleProject = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(pid => pid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const toggleZoneExpand = (zone) => {
    setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  // 全選/取消全選 某個區域
  const toggleSelectZone = (zone, e) => {
    e.stopPropagation();
    const projectIdsInZone = filteredProjects[zone].map(p => p.id);
    const allSelected = projectIdsInZone.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // 取消全選此區
      setSelectedIds(selectedIds.filter(id => !projectIdsInZone.includes(id)));
    } else {
      // 全選此區 (保留原本已選的其他區)
      const newIds = [...selectedIds];
      projectIdsInZone.forEach(id => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      setSelectedIds(newIds);
    }
  };

  // --- 核心計算與整合邏輯 (同前) ---
  const summary = useMemo(() => {
    const targetProjects = projects.filter(p => selectedIds.includes(p.id));
    let totalIncome = 0, totalExpense = 0, totalLandM2 = 0, totalLandPrice = 0, totalBuildingPrice = 0;
    const allBuyers = [], allLands = [], allBuildings = [];

    targetProjects.forEach(p => {
      if (p.transactions) p.transactions.forEach(t => { const amount = Number(t.amount)||0; if (t.type === 'income') totalIncome += amount; else totalExpense += amount; });
      if (p.buyers) p.buyers.forEach(b => allBuyers.push({ ...b, projectName: p.name }));
      if (p.lands) p.lands.forEach(l => { totalLandM2 += Number(l.holdingAreaM2)||0; totalLandPrice += Number(l.totalPrice)||0; allLands.push({ ...l, projectName: p.name }); });
      if (p.buildings) p.buildings.forEach(b => { totalBuildingPrice += Number(b.totalPrice)||0; allBuildings.push({ ...b, projectName: p.name }); });
    });

    const netProfit = totalIncome - totalExpense;
    const roi = totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : 0;
    const totalLandPing = toPing(totalLandM2);

    return { projectCount: targetProjects.length, totalIncome, totalExpense, netProfit, roi, totalLandM2, totalLandPing, totalLandPrice, totalBuildingPrice, allBuyers, allLands, allBuildings };
  }, [projects, selectedIds]);

  const filteredBuyers = summary.allBuyers.filter(b => !searchTerm || b.name.includes(searchTerm) || b.address.includes(searchTerm) || b.projectName.includes(searchTerm));
  const filteredLands = summary.allLands.filter(l => !searchTerm || l.section.includes(searchTerm) || l.sellers.some(s=>s.name.includes(searchTerm)) || l.items.some(i=>i.lotNumber.includes(searchTerm)));
  const filteredBuildings = summary.allBuildings.filter(b => !searchTerm || b.address.includes(searchTerm) || b.permitNumber?.includes(searchTerm) || b.sellers.some(s=>s.name.includes(searchTerm)));

  const handlePrint = () => window.print();

  return (
    <div className="animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 print:hidden">
        <div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft className="w-6 h-6 text-gray-600" /></button><h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><PieChart className="w-8 h-8 text-blue-600" /> 全區案件資訊總表</h1></div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition font-bold shadow-md"><Printer className="w-5 h-5" /> 列印總表 PDF</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* ✅ 左側：案場選擇與案件勾選 (手風琴式) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit print:hidden">
          
          {/* 案場選擇器 */}
          <div className="mb-6">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">選擇目標案場</label>
             <div className="relative">
                <select 
                  className="w-full p-3 pl-10 border rounded-xl bg-gray-50 font-bold text-gray-700 outline-none appearance-none"
                  value={activeSite}
                  onChange={(e) => { setActiveSite(e.target.value); setSelectedIds([]); setExpandedZones({}); }}
                >
                  {uniqueSites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
             </div>
          </div>

          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-700">選擇納入計算的案件</h3></div>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {Object.keys(filteredProjects).map(zone => {
               // 檢查此區是否全選
               const projectIdsInZone = filteredProjects[zone].map(p => p.id);
               const isZoneAllSelected = projectIdsInZone.length > 0 && projectIdsInZone.every(id => selectedIds.includes(id));
               const isExpanded = expandedZones[zone];

               return (
                 <div key={zone} className="border border-gray-200 rounded-xl overflow-hidden mb-2">
                    {/* 區域標題列 */}
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => toggleZoneExpand(zone)}
                    >
                       <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-gray-700 text-sm">{zone}</span>
                          <span className="text-xs bg-white border px-1.5 rounded text-gray-400">{filteredProjects[zone].length}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          {/* 全選該區按鈕 */}
                          <button 
                            onClick={(e) => toggleSelectZone(zone, e)}
                            className={`p-1 rounded hover:bg-white transition ${isZoneAllSelected ? 'text-blue-600' : 'text-gray-300'}`}
                            title="全選/取消全選此區"
                          >
                             <CheckSquare className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                       </div>
                    </div>

                    {/* 案件清單 (預設收合) */}
                    {isExpanded && (
                       <div className="bg-white border-t border-gray-100 p-2 space-y-1">
                          {filteredProjects[zone].map(p => {
                             const isSelected = selectedIds.includes(p.id);
                             return (
                               <div 
                                 key={p.id} 
                                 onClick={() => toggleProject(p.id)}
                                 className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-500'}`}
                               >
                                 {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0"/> : <Square className="w-4 h-4 text-gray-300 shrink-0"/>}
                                 <span className="text-sm font-medium">{p.name}</span>
                               </div>
                             );
                          })}
                       </div>
                    )}
                 </div>
               );
            })}
            
            {Object.keys(filteredProjects).length === 0 && (
               <div className="text-center text-gray-400 text-sm py-4 italic">此案場無案件</div>
            )}
          </div>
        </div>

        {/* 右側：統計數據 (略) */}
        <div className="lg:col-span-3 space-y-8 print:w-full print:col-span-4">
          <div className="hidden print:block mb-8 border-b pb-4"><h1 className="text-3xl font-black mb-2">{activeSite} - 全區案件總結算表</h1><p className="text-sm text-gray-500">製表日期: {new Date().toLocaleDateString()} | 納入案件數: {summary.projectCount} 筆</p></div>

          {/* 1. 財務總覽 */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden break-inside-avoid">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
            <h2 className="text-lg font-black text-gray-700 mb-6 flex items-center gap-2 uppercase tracking-widest"><DollarSign className="w-6 h-6 text-blue-600" /> 財務總覽</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div><span className="block text-sm text-gray-400 font-bold mb-1">總收入</span><span className="text-4xl font-black text-green-600 tracking-tight">${summary.totalIncome.toLocaleString()}</span></div>
              <div><span className="block text-sm text-gray-400 font-bold mb-1">總支出</span><span className="text-4xl font-black text-red-500 tracking-tight">${summary.totalExpense.toLocaleString()}</span></div>
              <div><span className="block text-sm text-gray-400 font-bold mb-1">淨利 (ROI: {summary.roi}%)</span><span className={`text-4xl font-black tracking-tight ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>${summary.netProfit.toLocaleString()}</span></div>
            </div>
          </div>

          {/* 2. 資產統計 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-gray-400"/> 土地資產總計</h3><div className="space-y-4"><div className="flex justify-between items-center border-b border-dashed pb-2"><span className="text-sm text-gray-500">持有總面積</span><span className="font-bold text-xl">{summary.totalLandM2.toFixed(3)} <span className="text-xs text-gray-400">㎡</span></span></div><div className="flex justify-between items-center border-b border-dashed pb-2"><span className="text-sm text-gray-500">持有總坪數</span><span className="font-bold text-xl">{summary.totalLandPing.toFixed(3)} <span className="text-xs text-gray-400">坪</span></span></div><div className="flex justify-between items-center pt-2"><span className="text-sm text-gray-500">土地總成本/價值</span><span className="font-black text-2xl text-blue-600">${summary.totalLandPrice.toLocaleString()}</span></div></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"><h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-gray-400"/> 建物資產總計</h3><div className="flex flex-col justify-center h-full pb-6"><div className="text-center"><span className="block text-sm text-gray-500 mb-2">建物成交總額</span><span className="font-black text-4xl text-orange-500">${summary.totalBuildingPrice.toLocaleString()}</span></div><div className="text-center mt-4 text-xs text-gray-400">共計 {summary.allBuildings.length} 筆建物資料</div></div></div>
          </div>

          <hr className="border-t-2 border-gray-100 my-8"/>

          <div className="print:hidden relative mb-6"><Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" /><input type="text" placeholder="輸入關鍵字搜尋 (地號、姓名、建照、地址)..." className="w-full p-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

          {/* 3. 詳細清單 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2"><Users className="w-5 h-5 text-gray-500" /><h3 className="font-black text-gray-700">全區買受人名冊 ({filteredBuyers.length})</h3></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-4 w-1/4">所屬案件</th><th className="p-4 w-1/4">姓名</th><th className="p-4 w-1/4">電話</th><th className="p-4 w-1/4">地址</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredBuyers.map((b, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-400">{b.projectName}</td><td className="p-4 font-bold text-gray-800">{b.name}</td><td className="p-4">{b.phone}</td><td className="p-4 text-xs text-gray-500">{b.address}</td></tr>))}</tbody></table></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2"><Map className="w-5 h-5 text-blue-500" /><h3 className="font-black text-gray-700">全區土地標的清單 ({filteredLands.length})</h3></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-4">所屬案件</th><th className="p-4">出售人</th><th className="p-4">地段</th><th className="p-4">地號</th><th className="p-4 text-right">面積(m2)</th><th className="p-4 text-right">坪數</th><th className="p-4 text-right">總價</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredLands.map((l, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-400">{l.projectName}</td><td className="p-4">{l.sellers.map(s=>s.name).join(', ')}</td><td className="p-4">{l.section}</td><td className="p-4 text-xs">{l.items.map(i=>i.lotNumber).join(', ').substring(0,20)}{l.items.length>3?'...':''}</td><td className="p-4 text-right font-mono">{Number(l.holdingAreaM2).toFixed(3)}</td><td className="p-4 text-right font-mono text-blue-500">{Number(l.holdingAreaPing).toFixed(3)}</td><td className="p-4 text-right font-mono font-bold text-blue-600">${Number(l.totalPrice).toLocaleString()}</td></tr>))}</tbody></table></div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2"><Home className="w-5 h-5 text-orange-500" /><h3 className="font-black text-gray-700">全區建物標的清單 ({filteredBuildings.length})</h3></div>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="p-4">所屬案件</th><th className="p-4">屋主</th><th className="p-4">建照</th><th className="p-4">地址</th><th className="p-4 text-right">面積(m2)</th><th className="p-4 text-right">總價</th></tr></thead><tbody className="divide-y divide-gray-100">{filteredBuildings.map((b, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-400">{b.projectName}</td><td className="p-4">{b.sellers.map(s=>s.name).join(', ')}</td><td className="p-4">{b.permitNumber || '-'}</td><td className="p-4">{b.address}</td><td className="p-4 text-right font-mono">{b.areaM2}</td><td className="p-4 text-right font-mono font-bold text-orange-600">${Number(b.totalPrice).toLocaleString()}</td></tr>))}</tbody></table></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryReport;
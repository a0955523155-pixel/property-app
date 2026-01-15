import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, CheckSquare, Square, Printer, PieChart, 
  Calculator, Map, DollarSign, Building, Users, Home 
} from 'lucide-react';
import { toPing } from '../utils/helpers';

const ProjectSummaryReport = ({ projects, onBack }) => {
  // 預設全選所有專案
  const [selectedIds, setSelectedIds] = useState(projects.map(p => p.id));

  // --- 切換勾選狀態 ---
  const toggleProject = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(pid => pid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => setSelectedIds(projects.map(p => p.id));
  const handleDeselectAll = () => setSelectedIds([]);

  // --- 核心計算與整合邏輯 ---
  const summary = useMemo(() => {
    // 1. 過濾出已勾選的專案
    const targetProjects = projects.filter(p => selectedIds.includes(p.id));

    let totalIncome = 0;
    let totalExpense = 0;
    let totalLandM2 = 0;
    let totalLandPrice = 0;
    let totalBuildingPrice = 0;
    
    // 整合列表容器
    const allBuyers = [];
    const allLands = [];
    const allBuildings = [];

    targetProjects.forEach(p => {
      // A. 累加財務
      if (p.transactions) {
        p.transactions.forEach(t => {
          const amount = Number(t.amount) || 0;
          if (t.type === 'income') totalIncome += amount;
          else totalExpense += amount;
        });
      }

      // B. 整合買受人
      if (p.buyers) {
        p.buyers.forEach(b => {
          allBuyers.push({ ...b, projectName: p.name });
        });
      }

      // C. 整合與累加土地
      if (p.lands) {
        p.lands.forEach(l => {
          totalLandM2 += Number(l.holdingAreaM2) || 0;
          totalLandPrice += Number(l.totalPrice) || 0;
          allLands.push({ ...l, projectName: p.name });
        });
      }

      // D. 整合與累加建物
      if (p.buildings) {
        p.buildings.forEach(b => {
          totalBuildingPrice += Number(b.totalPrice) || 0;
          allBuildings.push({ ...b, projectName: p.name });
        });
      }
    });

    const netProfit = totalIncome - totalExpense;
    const roi = totalExpense > 0 ? ((netProfit / totalExpense) * 100).toFixed(2) : 0;
    const totalLandPing = toPing(totalLandM2);

    return {
      projectCount: targetProjects.length,
      totalIncome,
      totalExpense,
      netProfit,
      roi,
      totalLandM2,
      totalLandPing,
      totalLandPrice,
      totalBuildingPrice,
      // 回傳整合後的清單
      allBuyers,
      allLands,
      allBuildings
    };
  }, [projects, selectedIds]);

  const handlePrint = () => window.print();

  return (
    <div className="animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <PieChart className="w-8 h-8 text-blue-600" /> 全區案件資訊總表
          </h1>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition font-bold shadow-md">
          <Printer className="w-5 h-5" /> 列印總表 PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左側：案件選擇清單 (列印時隱藏) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit print:hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">選擇納入計算的案件</h3>
            <div className="text-xs flex gap-2">
              <button onClick={handleSelectAll} className="text-blue-600 hover:underline">全選</button>
              <span className="text-gray-300">|</span>
              <button onClick={handleDeselectAll} className="text-gray-400 hover:text-gray-600 hover:underline">清空</button>
            </div>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {projects.sort((a,b)=>a.name.localeCompare(b.name)).map(p => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <div 
                  key={p.id} 
                  onClick={() => toggleProject(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                >
                  {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600 shrink-0"/> : <Square className="w-5 h-5 text-gray-400 shrink-0"/>}
                  <span className={`text-sm font-bold ${isSelected ? 'text-blue-800' : 'text-gray-500'}`}>{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右側：統計數據顯示 (列印時全螢幕) */}
        <div className="lg:col-span-3 space-y-8 print:w-full print:col-span-4">
          
          {/* 列印標頭 */}
          <div className="hidden print:block mb-8 border-b pb-4">
            <h1 className="text-3xl font-black mb-2">大成工業城 - 全區案件總結算表</h1>
            <p className="text-sm text-gray-500">製表日期: {new Date().toLocaleDateString()} | 納入案件數: {summary.projectCount} 筆</p>
          </div>

          {/* 1. 財務總覽 */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 relative overflow-hidden break-inside-avoid">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
            <h2 className="text-lg font-black text-gray-700 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <DollarSign className="w-6 h-6 text-blue-600" /> 財務總覽 (Financial Summary)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <span className="block text-sm text-gray-400 font-bold mb-1">總收入</span>
                <span className="text-4xl font-black text-green-600 tracking-tight">${summary.totalIncome.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-400 font-bold mb-1">總支出</span>
                <span className="text-4xl font-black text-red-500 tracking-tight">${summary.totalExpense.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-400 font-bold mb-1">淨利 (ROI: {summary.roi}%)</span>
                <span className={`text-4xl font-black tracking-tight ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>${summary.netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 2. 資產統計 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-gray-400"/> 土地資產總計</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-dashed pb-2">
                    <span className="text-sm text-gray-500">持有總面積</span>
                    <span className="font-bold text-xl">{summary.totalLandM2.toFixed(3)} <span className="text-xs text-gray-400">㎡</span></span>
                  </div>
                  <div className="flex justify-between items-center border-b border-dashed pb-2">
                    <span className="text-sm text-gray-500">持有總坪數</span>
                    <span className="font-bold text-xl">{summary.totalLandPing.toFixed(3)} <span className="text-xs text-gray-400">坪</span></span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-500">土地總成本/價值</span>
                    <span className="font-black text-2xl text-blue-600">${summary.totalLandPrice.toLocaleString()}</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
               <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-gray-400"/> 建物資產總計</h3>
               <div className="flex flex-col justify-center h-full pb-6">
                  <div className="text-center">
                    <span className="block text-sm text-gray-500 mb-2">建物成交總額</span>
                    <span className="font-black text-4xl text-orange-500">${summary.totalBuildingPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-center mt-4 text-xs text-gray-400">
                    共計 {summary.allBuildings.length} 筆建物資料
                  </div>
               </div>
            </div>
          </div>

          <hr className="border-t-2 border-gray-100 my-8"/>

          {/* 3. 詳細清單：買受人 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
               <Users className="w-5 h-5 text-gray-500" />
               <h3 className="font-black text-gray-700">全區買受人名冊 ({summary.allBuyers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4 w-1/4">所屬案件</th>
                    <th className="p-4 w-1/4">姓名</th>
                    <th className="p-4 w-1/4">電話</th>
                    <th className="p-4 w-1/4">地址</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.allBuyers.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-400">{b.projectName}</td>
                      <td className="p-4 font-bold text-gray-800">{b.name}</td>
                      <td className="p-4">{b.phone}</td>
                      <td className="p-4 text-xs text-gray-500">{b.address}</td>
                    </tr>
                  ))}
                  {summary.allBuyers.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400 italic">無資料</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. 詳細清單：土地 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
               <Map className="w-5 h-5 text-blue-500" />
               <h3 className="font-black text-gray-700">全區土地標的清單 ({summary.allLands.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">所屬案件</th>
                    <th className="p-4">出售人</th>
                    <th className="p-4">地段</th>
                    <th className="p-4">地號</th>
                    <th className="p-4 text-right">面積(m2)</th>
                    <th className="p-4 text-right">總價</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.allLands.map((l, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-400">{l.projectName}</td>
                      <td className="p-4">{l.sellers.map(s=>s.name).join(', ')}</td>
                      <td className="p-4">{l.section}</td>
                      <td className="p-4 text-xs">{l.items.map(i=>i.lotNumber).join(', ').substring(0,20)}{l.items.length>3?'...':''}</td>
                      <td className="p-4 text-right font-mono">{Number(l.holdingAreaM2).toFixed(3)}</td>
                      <td className="p-4 text-right font-mono font-bold text-blue-600">${Number(l.totalPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                  {summary.allLands.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400 italic">無資料</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. 詳細清單：建物 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
               <Home className="w-5 h-5 text-orange-500" />
               <h3 className="font-black text-gray-700">全區建物標的清單 ({summary.allBuildings.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">所屬案件</th>
                    <th className="p-4">屋主</th>
                    <th className="p-4">建照</th>
                    <th className="p-4">地址</th>
                    <th className="p-4 text-right">面積(m2)</th>
                    <th className="p-4 text-right">總價</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.allBuildings.map((b, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-400">{b.projectName}</td>
                      <td className="p-4">{b.sellers.map(s=>s.name).join(', ')}</td>
                      <td className="p-4">{b.permitNumber || '-'}</td>
                      <td className="p-4">{b.address}</td>
                      <td className="p-4 text-right font-mono">{b.areaM2}</td>
                      <td className="p-4 text-right font-mono font-bold text-orange-600">${Number(b.totalPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                  {summary.allBuildings.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-gray-400 italic">無資料</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryReport;
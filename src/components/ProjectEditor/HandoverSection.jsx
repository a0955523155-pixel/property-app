import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ClipboardCheck, Key, Plus, Trash2 } from 'lucide-react';

const HandoverSection = ({ handoverData, setHandoverData, lands, buildings }) => {
  // 1. 確保 handoverData 是陣列
  const safeData = Array.isArray(handoverData) ? handoverData : [];
  
  // 2. 當前選中的戶號
  const [selectedUnit, setSelectedUnit] = useState("");

  // ✅ 新增：將建物列表依照戶號排序 (自然排序: A1, A2, A10)
  const sortedBuildings = useMemo(() => {
      return [...buildings].sort((a, b) => 
          (a.unit || "").localeCompare(b.unit || "", "zh-Hant", { numeric: true })
      );
  }, [buildings]);

  // 3. 初始化：預設選第一戶 (排序後的)
  useEffect(() => {
      if (!selectedUnit && sortedBuildings.length > 0) {
          setSelectedUnit(sortedBuildings[0].unit);
      }
  }, [sortedBuildings]);

  // 4. 取得當前選中戶號的點交資料
  const currentHandover = safeData.find(h => h.unit === selectedUnit);

  // 5. 取得該戶號的關聯資訊
  const relatedInfo = useMemo(() => {
      if (!selectedUnit) return { lot: "無", build: "無", address: "無" };
      
      const building = buildings.find(b => b.unit === selectedUnit);
      
      const landItems = [];
      lands.forEach(l => {
          const matchedItem = l.items.find(i => i.unit === selectedUnit);
          if (matchedItem) {
              landItems.push(`${l.section} ${matchedItem.lotNumber}`);
          }
      });

      return {
          build: building ? building.buildNumber : "未建立",
          address: building ? building.address : "",
          lot: landItems.length > 0 ? landItems.join(", ") : "未建立"
      };
  }, [selectedUnit, buildings, lands]);

  // 6. 新增點交單
  const createHandover = () => {
      if (!selectedUnit) return;
      const newRecord = {
          id: Date.now(),
          unit: selectedUnit,
          handoverDate: new Date().toISOString().split('T')[0],
          remotes: "0", keysFront: "0", keysBack: "0",
          warranty: false, drawings: false, originalPermit: false,
          electricityBill: "", waterBill: ""
      };
      setHandoverData([...safeData, newRecord]);
  };

  // 7. 更新資料
  const updateCurrent = (field, value) => {
      setHandoverData(safeData.map(h => h.unit === selectedUnit ? { ...h, [field]: value } : h));
  };

  // 8. 刪除資料
  const deleteCurrent = () => {
      if (confirm(`確定刪除 [${selectedUnit}] 的點交單嗎？`)) {
          setHandoverData(safeData.filter(h => h.unit !== selectedUnit));
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-green-600"/> 交屋點交確認單
        </h2>

        {/* 選單區域 */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="font-bold text-gray-600 whitespace-nowrap">選擇戶號：</label>
            <select 
                className="w-full md:w-auto p-2 border rounded-lg font-bold text-lg outline-none focus:ring-2 focus:ring-green-500"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
            >
                {sortedBuildings.length === 0 && <option value="">請先建立建物資料</option>}
                {/* ✅ 改用 sortedBuildings 渲染選項 */}
                {sortedBuildings.map(b => (
                    <option key={b.id} value={b.unit}>
                        {b.unit} {safeData.some(h => h.unit === b.unit) ? "✅" : ""}
                    </option>
                ))}
            </select>
            
            <div className="flex-1 text-sm text-gray-500 flex flex-wrap gap-4 justify-end">
                <span><span className="font-bold text-gray-400">地號:</span> {relatedInfo.lot}</span>
                <span><span className="font-bold text-gray-400">建號:</span> {relatedInfo.build}</span>
                <span><span className="font-bold text-gray-400">地址:</span> {relatedInfo.address}</span>
            </div>
        </div>

        {/* 內容區 */}
        {!currentHandover ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                <p className="text-gray-400 mb-4">戶號 <span className="font-bold text-gray-800">{selectedUnit}</span> 尚未建立點交單</p>
                <button onClick={createHandover} disabled={!selectedUnit} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg disabled:bg-gray-300">
                    <Plus className="w-5 h-5 inline mr-1"/> 建立此戶點交單
                </button>
            </div>
        ) : (
            <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex-1">
                        <label className="font-bold text-yellow-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> 點交日期 (民國 {currentHandover.handoverDate.split('-')[0]-1911} 年)</label>
                        <input type="date" className="p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-yellow-400" value={currentHandover.handoverDate} onChange={(e)=>updateCurrent('handoverDate', e.target.value)} />
                    </div>
                    <button onClick={deleteCurrent} className="ml-4 text-red-400 hover:text-red-600 p-2 border border-red-100 rounded-lg hover:bg-red-50"><Trash2 className="w-5 h-5"/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div><label className="font-bold text-gray-700 block mb-2">捲門遙控器數量 (0-4)</label><select className="w-full p-3 border rounded-lg bg-white" value={currentHandover.remotes} onChange={(e)=>updateCurrent('remotes', e.target.value)}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n} 顆</option>)}</select></div>
                        <div className="flex gap-4">
                            <div className="flex-1"><label className="font-bold text-gray-700 block mb-2"><Key className="w-4 h-4 inline mr-1"/> 小門鑰匙 (前)</label><select className="w-full p-3 border rounded-lg bg-white" value={currentHandover.keysFront} onChange={(e)=>updateCurrent('keysFront', e.target.value)}>{[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} 支</option>)}</select></div>
                            <div className="flex-1"><label className="font-bold text-gray-700 block mb-2"><Key className="w-4 h-4 inline mr-1"/> 小門鑰匙 (後)</label><select className="w-full p-3 border rounded-lg bg-white" value={currentHandover.keysBack} onChange={(e)=>updateCurrent('keysBack', e.target.value)}>{[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} 支</option>)}</select></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={currentHandover.warranty} onChange={(e)=>updateCurrent('warranty', e.target.checked)} /><span className="font-bold text-gray-700">廠房保固書</span></label>
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={currentHandover.drawings} onChange={(e)=>updateCurrent('drawings', e.target.checked)} /><span className="font-bold text-gray-700">廠房竣工圖</span></label>
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={currentHandover.originalPermit} onChange={(e)=>updateCurrent('originalPermit', e.target.checked)} /><span className="font-bold text-gray-700">使用執照正本</span></label>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div><label className="font-bold text-gray-700 block mb-1">電單號碼</label><div className="flex items-center gap-2"><span className="text-xl font-black text-gray-300">【</span><input type="text" className="w-full text-center border-b-2 border-gray-300 focus:border-green-500 outline-none text-xl font-mono" value={currentHandover.electricityBill} onChange={(e)=>updateCurrent('electricityBill', e.target.value)} /><span className="text-xl font-black text-gray-300">】</span></div></div>
                            <div><label className="font-bold text-gray-700 block mb-1">水單號碼</label><div className="flex items-center gap-2"><span className="text-xl font-black text-gray-300">【</span><input type="text" className="w-full text-center border-b-2 border-gray-300 focus:border-blue-500 outline-none text-xl font-mono" value={currentHandover.waterBill} onChange={(e)=>updateCurrent('waterBill', e.target.value)} /><span className="text-xl font-black text-gray-300">】</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default HandoverSection;
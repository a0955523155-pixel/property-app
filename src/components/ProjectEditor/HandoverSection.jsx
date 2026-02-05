import React from 'react';
import { Calendar as CalendarIcon, ClipboardCheck, Key } from 'lucide-react';

const HandoverSection = ({ handoverData, setHandoverData, allLotNumbers, allBuildingInfo }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
      <div className="border-b pb-6 mb-6">
        <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-green-600"/> 交屋點交確認單</h2>
        <div className="flex items-center gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6">
           <label className="font-bold text-yellow-800 flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> 點交日期 (民國 {handoverData.handoverDate ? handoverData.handoverDate.split('-')[0]-1911 : ''} 年)</label>
           <input type="date" className="p-2 border rounded-lg bg-white" value={handoverData.handoverDate || ""} onChange={(e)=>setHandoverData({...handoverData, handoverDate: e.target.value})} />
        </div>
        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 space-y-2 font-mono">
           <p><span className="font-bold text-gray-400">地籍地號：</span> {allLotNumbers || "無資料"}</p>
           <p><span className="font-bold text-gray-400">建物資訊：</span> {allBuildingInfo || "無資料"}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div><label className="font-bold text-gray-700 block mb-2">捲門遙控器數量 (0-4)</label><select className="w-full p-3 border rounded-lg bg-white" value={handoverData.remotes} onChange={(e)=>setHandoverData({...handoverData, remotes: e.target.value})}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n} 顆</option>)}</select></div>
           <div className="flex gap-4">
              <div className="flex-1"><label className="font-bold text-gray-700 block mb-2"><Key className="w-4 h-4 inline mr-1"/> 小門鑰匙 (前)</label><select className="w-full p-3 border rounded-lg bg-white" value={handoverData.keysFront} onChange={(e)=>setHandoverData({...handoverData, keysFront: e.target.value})}>{[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} 支</option>)}</select></div>
              <div className="flex-1"><label className="font-bold text-gray-700 block mb-2"><Key className="w-4 h-4 inline mr-1"/> 小門鑰匙 (後)</label><select className="w-full p-3 border rounded-lg bg-white" value={handoverData.keysBack} onChange={(e)=>setHandoverData({...handoverData, keysBack: e.target.value})}>{[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} 支</option>)}</select></div>
           </div>
        </div>
        <div className="space-y-4">
           <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={handoverData.warranty} onChange={(e)=>setHandoverData({...handoverData, warranty: e.target.checked})} /><span className="font-bold text-gray-700">廠房保固書</span></label>
           <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={handoverData.drawings} onChange={(e)=>setHandoverData({...handoverData, drawings: e.target.checked})} /><span className="font-bold text-gray-700">廠房竣工圖</span></label>
           <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" className="w-5 h-5 accent-green-600" checked={handoverData.originalPermit} onChange={(e)=>setHandoverData({...handoverData, originalPermit: e.target.checked})} /><span className="font-bold text-gray-700">使用執照正本</span></label>
           <div className="grid grid-cols-2 gap-4 mt-4">
              <div><label className="font-bold text-gray-700 block mb-1">電單號碼</label><input className="w-full text-center border-b-2 border-gray-300 focus:border-green-500 outline-none text-xl font-mono" value={handoverData.electricityBill} onChange={(e)=>setHandoverData({...handoverData, electricityBill: e.target.value})} /></div>
              <div><label className="font-bold text-gray-700 block mb-1">水單號碼</label><input className="w-full text-center border-b-2 border-gray-300 focus:border-blue-500 outline-none text-xl font-mono" value={handoverData.waterBill} onChange={(e)=>setHandoverData({...handoverData, waterBill: e.target.value})} /></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default HandoverSection;
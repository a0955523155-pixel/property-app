import React, { useState } from 'react';
import { Edit2, Trash2, Check, Camera, X } from 'lucide-react';

const BuyerSection = ({ buyers, setBuyers, sortedBuyers, setPreviewImage, handleImageUploadGeneric }) => {
  const [newBuyer, setNewBuyer] = useState({ name: "", phone: "", address: "", unit: "", landPrice: "", buildingPrice: "", totalPrice: "", image: null });
  const [editingId, setEditingId] = useState(null);

  const handlePriceChange = (field, value) => {
    const updated = { ...newBuyer, [field]: value };
    if (field === 'landPrice' || field === 'buildingPrice') {
        updated.totalPrice = (Number(updated.landPrice || 0) + Number(updated.buildingPrice || 0)).toString();
    }
    setNewBuyer(updated);
  };
  const saveBuyer = () => {
    if (!newBuyer.name) return;
    if (editingId) setBuyers(buyers.map(b => b.id === editingId ? { ...b, ...newBuyer } : b));
    else setBuyers([...buyers, { id: Date.now(), ...newBuyer }]);
    setEditingId(null);
    setNewBuyer({ name: "", phone: "", address: "", image: null, unit: "", landPrice: "", buildingPrice: "", totalPrice: "" });
  };
  const editBuyer = (b) => { setEditingId(b.id); setNewBuyer({...b}); };
  const deleteBuyer = (id) => { if(confirm("確定刪除此買受人？")) setBuyers(buyers.filter(b => b.id !== id)); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
       <h2 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">買受人資訊管理</h2>
       <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <input type="text" placeholder="戶號" className="w-full p-3 border rounded-lg font-bold text-blue-600" value={newBuyer.unit} onChange={e => setNewBuyer({...newBuyer, unit: e.target.value})} />
          <input type="text" placeholder="姓名" className="md:col-span-2 w-full p-3 border rounded-lg" value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} />
          <input type="text" placeholder="電話" className="w-full p-3 border rounded-lg" value={newBuyer.phone} onChange={e => setNewBuyer({...newBuyer, phone: e.target.value})} />
          <input type="text" placeholder="地址" className="md:col-span-2 w-full p-3 border rounded-lg" value={newBuyer.address} onChange={e => setNewBuyer({...newBuyer, address: e.target.value})} />
          <div className="md:col-span-2"><label className="text-xs font-bold text-gray-400">土地合約價</label><input type="number" className="w-full p-2 border rounded" value={newBuyer.landPrice} onChange={e=>handlePriceChange('landPrice', e.target.value)}/></div>
          <div className="md:col-span-2"><label className="text-xs font-bold text-gray-400">建物合約價</label><input type="number" className="w-full p-2 border rounded" value={newBuyer.buildingPrice} onChange={e=>handlePriceChange('buildingPrice', e.target.value)}/></div>
          <div className="md:col-span-2"><label className="text-xs font-bold text-blue-500">合約總價</label><input type="number" className="w-full p-2 border border-blue-300 rounded font-bold text-blue-600" value={newBuyer.totalPrice} onChange={e=>setNewBuyer({...newBuyer, totalPrice: e.target.value})}/></div>
          <div className="md:col-span-6 flex gap-2"><div className="relative flex-1"><input type="file" id="buyerImg" className="hidden" accept="image/*" onChange={(e) => handleImageUploadGeneric(e.target.files[0], (res) => setNewBuyer({...newBuyer, image: res}))} /><label htmlFor="buyerImg" className="flex justify-center items-center gap-2 w-full p-3 border-2 border-dashed rounded-lg text-xs font-bold cursor-pointer transition-all bg-white border-gray-300">{newBuyer.image ? <Check className="w-4 h-4"/> : <Camera className="w-4 h-4"/>} {newBuyer.image ? "已選圖" : "插入證件圖"}</label>{newBuyer.image && <button onClick={()=>setNewBuyer({...newBuyer, image: null})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button>}</div><button onClick={saveBuyer} className="flex-[3] py-3 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-md">{editingId ? "更新" : "新增買受人"}</button></div>
       </div>
       <div className="space-y-3">{sortedBuyers.map(b => (<div key={b.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition group"><div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 text-base items-center"><div className="font-black text-blue-600">{b.unit}</div><div className="font-bold text-gray-800 underline decoration-blue-200">{b.name}</div><div className="text-gray-600">{b.phone}</div><div className="text-gray-500 truncate">{b.address}</div><div className="md:col-span-4 text-xs text-gray-400 mt-2 border-t pt-2 flex gap-4"><span>土: ${Number(b.landPrice).toLocaleString()}</span><span>建: ${Number(b.buildingPrice).toLocaleString()}</span><span className="text-blue-600 font-bold">總: ${Number(b.totalPrice).toLocaleString()}</span></div></div><div className="flex gap-2 ml-4"><button onClick={()=>editBuyer(b)} className="text-gray-400 hover:text-blue-600 p-2"><Edit2 className="w-5 h-5"/></button><button onClick={()=>deleteBuyer(b.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5"/></button></div></div>))}</div>
    </div>
  );
};

export default BuyerSection;
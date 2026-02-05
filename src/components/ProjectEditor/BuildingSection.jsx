import React, { useState } from 'react';
import { Plus, Trash2, Home, Camera, Edit2 } from 'lucide-react';
import { toROCDate } from '../../utils/helpers';
import LinkedLedger from '../LinkedLedger';

const BuildingSection = ({ buildings, setBuildings, sortedBuildings, setPreviewImage, transactions, setTransactions, handleImageUploadGeneric }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [temp, setTemp] = useState({ saleDate: new Date().toISOString().split('T')[0], unit: "", permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [], permitImage: null, licenseImage: null, buildNoImage: null });
  const [seller, setSeller] = useState({ name: "", phone: "", address: "" });

  const addSeller = () => { if(seller.name){ setTemp({...temp, sellers:[...temp.sellers, {id:Date.now(), ...seller}]}); setSeller({name:"",phone:"",address:""}); } };
  const removeSeller = (id) => { if(confirm("移除？")) setTemp({...temp, sellers:temp.sellers.filter(s=>s.id!==id)}); };
  const save = () => { if(!temp.address)return alert("請輸入地址"); if(editingId) setBuildings(buildings.map(b=>b.id===editingId?{...temp, id:b.id}:b)); else setBuildings([...buildings, {...temp, id:Date.now()}]); setShowForm(false); setEditingId(null); setTemp({ saleDate: new Date().toISOString().split('T')[0], unit: "", permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [], permitImage: null, licenseImage: null, buildNoImage: null }); };
  const edit = (b) => { setEditingId(b.id); setTemp({...b}); setShowForm(true); };
  const del = (id) => { if(confirm("確定刪除此建物標的？")) setBuildings(buildings.filter(b=>b.id!==id)); };

  return (
    <div className="space-y-6 animate-fadeIn">
       {!showForm && <button onClick={()=>{setEditingId(null); setShowForm(true);}} className="w-full py-6 border-2 border-dashed rounded-2xl text-gray-400 hover:border-orange-500 hover:text-orange-500 flex justify-center items-center gap-2 transition bg-white shadow-sm text-lg font-bold"><Plus className="w-6 h-6"/> 新增建物案場資料</button>}
       {showForm && (
         <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-200 animate-fadeIn">
            <h3 className="flex items-center gap-2 text-xl font-bold text-orange-900 mb-8 border-b pb-4"><Home className="w-7 h-7"/> {editingId?"修改":"新增"}建物</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">成交日期 (民國 {temp.saleDate.split('-')[0]-1911} 年)</label><input type="date" className="w-full p-3 border rounded-lg" value={temp.saleDate} onChange={e=>setTemp({...temp, saleDate: e.target.value})}/></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">戶號</label><input placeholder="例如：A1" className="w-full p-3 border rounded-lg font-bold text-blue-600" value={temp.unit} onChange={e=>setTemp({...temp, unit: e.target.value})}/></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">建照號碼</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.permitNumber} onChange={e=>setTemp({...temp, permitNumber: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, permitImage: res}))}/></label></div></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">門牌地址</label><input className="w-full p-3 border rounded-lg" value={temp.address} onChange={e=>setTemp({...temp, address: e.target.value})}/></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">使用執照</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.license} onChange={e=>setTemp({...temp, license: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, licenseImage: res}))}/></label></div></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">建物建號</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.buildNumber} onChange={e=>setTemp({...temp, buildNumber: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, buildNoImage: res}))}/></label></div></div>
               <div><label className="text-sm text-gray-500 block mb-2 font-bold">面積(㎡)</label><input type="number" className="w-full p-3 border rounded-lg" value={temp.areaM2} onChange={e=>setTemp({...temp, areaM2: e.target.value})}/></div>
               <div><label className="text-sm text-gray-500 block mb-2 font-bold text-orange-600">單價</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg" value={temp.pricePerUnit} onChange={e=>setTemp({...temp, pricePerUnit: e.target.value})}/></div>
               <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold text-orange-600">總價</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg font-bold" value={temp.totalPrice} onChange={e=>setTemp({...temp, totalPrice: e.target.value})}/></div>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl mb-8"><h4 className="text-xs font-bold text-orange-700 mb-4">屋主/出售人</h4><div className="flex gap-4 mb-4"><input className="flex-1 p-2 border rounded" placeholder="姓名" value={seller.name} onChange={e=>setSeller({...seller,name:e.target.value})}/><input className="flex-1 p-2 border rounded" placeholder="電話" value={seller.phone} onChange={e=>setSeller({...seller,phone:e.target.value})}/><button onClick={addSeller} className="bg-orange-600 text-white px-4 rounded">加入</button></div><div className="space-y-2">{temp.sellers.map(s=><div key={s.id} className="flex justify-between p-2 bg-white border rounded"><span>{s.name} {s.phone}</span><button onClick={()=>removeSeller(s.id)}><Trash2 className="w-4 h-4 text-red-400"/></button></div>)}</div></div>
            <button onClick={save} className="w-full py-5 rounded-2xl text-white font-black bg-orange-600 shadow-xl hover:bg-orange-700 tracking-widest text-lg">儲存建物</button>
         </div>
       )}
       <div className="grid grid-cols-1 gap-6">{sortedBuildings.map(b => (<div key={b.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition group"><div className="flex justify-between items-start"><div className="flex-1"><div className="flex items-center gap-2 mb-3"><span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold">建物</span><h4 className="font-black text-gray-900 text-2xl">{b.unit ? `[${b.unit}]` : ''} {b.address}</h4></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner"><div>成交日: {toROCDate(b.saleDate)}</div><div>建號: {b.buildNumber}</div><div className="text-orange-600 font-bold text-xl">${Number(b.totalPrice).toLocaleString()}</div></div></div><div className="flex gap-3 ml-4"><button onClick={()=>edit(b)} className="p-3 text-gray-300 hover:text-orange-600"><Edit2 className="w-5 h-5"/></button><button onClick={()=>del(b.id)} className="p-3 text-gray-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button></div></div><LinkedLedger linkedId={b.id} linkedType="building" transactions={transactions} onSaveTransaction={(tx)=>setTransactions([...transactions,tx])}/></div>))}</div>
    </div>
  );
};

export default BuildingSection;
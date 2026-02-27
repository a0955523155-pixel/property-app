import React, { useState } from 'react';
import { Plus, Trash2, Home, Camera, Edit2, X, ImageIcon, Save } from 'lucide-react';
import { toROCDate } from '../../utils/helpers';
import LinkedLedger from '../LinkedLedger';

const handleImageUploadGeneric = (file, callback) => { 
  if (file) { 
    const reader = new FileReader(); 
    reader.onloadend = () => callback(reader.result); 
    reader.readAsDataURL(file); 
  } 
};

const BuildingSection = ({ buildings, setBuildings, sortedBuildings, setPreviewImage, transactions, setTransactions, buildingGrandTotal }) => {
  // 狀態：控制是「新增模式」還是「編輯模式」
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  
  // 保留 today 變數，但不再強制作為預設值
  const today = new Date().toISOString().split('T')[0];

  // ✅ 表單暫存資料：saleDate 預設改為空字串
  const [temp, setTemp] = useState({ 
    saleDate: "", 
    unit: "", permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [], permitImage: null, licenseImage: null, buildNoImage: null 
  });
  const [seller, setSeller] = useState({ name: "", phone: "", address: "" });

  const addSeller = () => { if(seller.name){ setTemp({...temp, sellers:[...temp.sellers, {id:Date.now(), ...seller}]}); setSeller({name:"",phone:"",address:""}); } };
  const removeSeller = (id) => { if(confirm("移除？")) setTemp({...temp, sellers:temp.sellers.filter(s=>s.id!==id)}); };
  
  // 儲存 (新增 或 更新)
  const save = () => { 
      if(!temp.address) return alert("請輸入地址"); 
      // ✅ 取消強制帶入 today，完全依照使用者輸入(包含留白)
      const dataToSave = { ...temp };

      if(editingId) {
          // 更新現有
          setBuildings(buildings.map(b=>b.id===editingId?{...dataToSave, id:b.id}:b)); 
      } else {
          // 新增
          setBuildings([...buildings, {...dataToSave, id:Date.now()}]); 
      }
      
      cancelEdit(); // 關閉編輯狀態
  };
  
  // 取消 / 關閉
  const cancelEdit = () => {
      setIsCreating(false);
      setEditingId(null);
      // ✅ 重置時 saleDate 設為空字串
      setTemp({ saleDate: "", unit: "", permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [], permitImage: null, licenseImage: null, buildNoImage: null });
  };

  // 開啟「新增」表單 (在最上方)
  const startCreating = () => {
      setEditingId(null); // 關閉其他編輯
      // ✅ 新增時 saleDate 設為空字串
      setTemp({ saleDate: "", unit: "", permitNumber: "", address: "", license: "", buildNumber: "", areaM2: "", pricePerUnit: "", totalPrice: "", sellers: [], permitImage: null, licenseImage: null, buildNoImage: null });
      setIsCreating(true);
  };
  
  // 開啟「原地編輯」
  const startEditing = (b) => { 
      setIsCreating(false); // 關閉新增
      setEditingId(b.id);   // 設定當前編輯 ID
      // ✅ 編輯舊資料時，沒日期就帶空字串
      setTemp({ ...b, saleDate: b.saleDate || "" }); 
  };
  
  const del = (id) => { if(confirm("確定刪除此建物標的？")) setBuildings(buildings.filter(b=>b.id!==id)); };
  const getROCYear = (dateStr) => dateStr ? dateStr.split('-')[0] - 1911 : "";

  // 抽離出共用的表單 UI
  const renderForm = (isEditMode) => (
    <div className={`p-6 rounded-3xl shadow-xl border-2 ${isEditMode ? 'bg-orange-50 border-orange-400' : 'bg-white border-orange-200'} animate-fadeIn`}>
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-orange-200">
            <h3 className="flex items-center gap-2 text-xl font-bold text-orange-900">
                <Home className="w-6 h-6"/> {isEditMode ? "修改建物資料" : "新增建物資料"}
            </h3>
            <button onClick={cancelEdit} className="p-2 hover:bg-black/5 rounded-full text-gray-500"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">成交日期 {temp.saleDate ? `(民國 ${getROCYear(temp.saleDate)} 年)` : ''}</label>
                    {/* ✅ 綁定 value 保證清除時會空白 */}
                    <input type="date" className="w-full p-3 border rounded-lg bg-white" value={temp.saleDate || ''} onChange={e=>setTemp({...temp, saleDate: e.target.value})}/>
                </div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">戶號</label><input placeholder="例如：A1" className="w-full p-3 border rounded-lg font-bold text-blue-600" value={temp.unit} onChange={e=>setTemp({...temp, unit: e.target.value})}/></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">建照號碼</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.permitNumber} onChange={e=>setTemp({...temp, permitNumber: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, permitImage: res}))}/></label>{temp.permitImage && <button onClick={()=>setTemp({...temp, permitImage: null})} className="bg-red-50 text-red-500 p-3 rounded-lg"><X className="w-4 h-4"/></button>}</div></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">門牌地址</label><input className="w-full p-3 border rounded-lg" value={temp.address} onChange={e=>setTemp({...temp, address: e.target.value})}/></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">使用執照</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.license} onChange={e=>setTemp({...temp, license: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, licenseImage: res}))}/></label>{temp.licenseImage && <button onClick={()=>setTemp({...temp, licenseImage: null})} className="bg-red-50 text-red-500 p-3 rounded-lg"><X className="w-4 h-4"/></button>}</div></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold">建物建號</label><div className="flex gap-2"><input className="flex-1 w-full p-3 border rounded-lg" value={temp.buildNumber} onChange={e=>setTemp({...temp, buildNumber: e.target.value})}/><label className="cursor-pointer bg-gray-100 p-3 rounded-lg"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>setTemp({...temp, buildNoImage: res}))}/></label>{temp.buildNoImage && <button onClick={()=>setTemp({...temp, buildNoImage: null})} className="bg-red-50 text-red-500 p-3 rounded-lg"><X className="w-4 h-4"/></button>}</div></div>
                <div><label className="text-sm text-gray-500 block mb-2 font-bold">面積(㎡)</label><input type="number" className="w-full p-3 border rounded-lg" value={temp.areaM2} onChange={e=>setTemp({...temp, areaM2: e.target.value})}/></div>
                <div><label className="text-sm text-gray-500 block mb-2 font-bold text-orange-600">單價</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg" value={temp.pricePerUnit} onChange={e=>setTemp({...temp, pricePerUnit: e.target.value})}/></div>
                <div className="md:col-span-2"><label className="text-sm text-gray-500 block mb-2 font-bold text-orange-600">總價</label><input type="number" className="w-full p-3 border border-orange-200 rounded-lg font-bold" value={temp.totalPrice} onChange={e=>setTemp({...temp, totalPrice: e.target.value})}/></div>
            </div>
            <div className="bg-white/50 p-4 rounded-xl border border-orange-100"><h4 className="text-xs font-bold text-orange-700 mb-4">屋主/出售人</h4><div className="flex gap-4 mb-4"><input className="flex-1 p-2 border rounded" placeholder="姓名" value={seller.name} onChange={e=>setSeller({...seller,name:e.target.value})}/><input className="flex-1 p-2 border rounded" placeholder="電話" value={seller.phone} onChange={e=>setSeller({...seller,phone:e.target.value})}/><button onClick={addSeller} className="bg-orange-600 text-white px-4 rounded">加入</button></div><div className="space-y-2">{temp.sellers.map(s=><div key={s.id} className="flex justify-between p-2 bg-white border rounded"><span>{s.name} {s.phone}</span><button onClick={()=>removeSeller(s.id)}><Trash2 className="w-4 h-4 text-red-400"/></button></div>)}</div></div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
            <button onClick={cancelEdit} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-black/5">取消</button>
            <button onClick={save} className="px-8 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-lg flex items-center gap-2"><Save className="w-5 h-5"/> 儲存</button>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
       {/* 建物總結算卡片 */}
       <div className="bg-gradient-to-r from-orange-600 to-orange-800 p-6 rounded-3xl text-white shadow-xl mb-6">
          <h3 className="text-lg font-black mb-4 flex items-center gap-2"><Home className="w-6 h-6"/> 全案建物總結算</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
             <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-orange-200 font-bold mb-1">總面積 (㎡)</span><span className="text-3xl font-black">{buildingGrandTotal.m2}</span></div>
             <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-orange-200 font-bold mb-1">總坪數</span><span className="text-3xl font-black">{buildingGrandTotal.ping}</span></div>
             <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm"><span className="block text-xs text-orange-200 font-bold mb-1">總金額 ($)</span><span className="text-3xl font-black">${Number(buildingGrandTotal.price).toLocaleString()}</span></div>
          </div>
       </div>

       {/* 1. 新增區域 */}
       {isCreating ? (
           renderForm(false)
       ) : (
           <button onClick={startCreating} className="w-full py-6 border-2 border-dashed rounded-2xl text-gray-400 hover:border-orange-500 hover:text-orange-500 flex justify-center items-center gap-2 transition bg-white shadow-sm text-lg font-bold"><Plus className="w-6 h-6"/> 新增建物案場資料</button>
       )}
       
       {/* 2. 列表區域 */}
       <div className="grid grid-cols-1 gap-6">
           {sortedBuildings.map(b => {
               if (editingId === b.id) {
                   return <div key={b.id}>{renderForm(true)}</div>;
               }

               return (
                 <div key={b.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition group">
                   <div className="flex justify-between items-start">
                     <div className="flex-1">
                       <div className="flex items-center gap-2 mb-3">
                         <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-bold">建物</span>
                         <h4 className="font-black text-gray-900 text-3xl">{b.unit || "(未填寫)"}</h4>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-gray-500 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                          <div className="md:col-span-3 border-b border-gray-200 pb-3 mb-1">
                             <span className="text-xs text-gray-400 block font-black uppercase mb-1">地址</span>
                             <span className="text-gray-800 font-bold text-lg">{b.address}</span>
                          </div>
                          
                          {/* ✅ 若無日期顯示 '-' */}
                          <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">成交日期</span>{b.saleDate ? toROCDate(b.saleDate) : '-'}</div>
                          <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">建號</span><div className="flex items-center gap-2">{b.buildNumber}{b.buildNoImage && <ImageIcon className="w-4 h-4 text-blue-500 cursor-pointer" onClick={()=>setPreviewImage(b.buildNoImage)}/>}</div></div>
                          <div><span className="text-xs text-gray-400 block font-black uppercase mb-1">總額</span><span className="text-orange-600 font-bold text-xl">${Number(b.totalPrice).toLocaleString()}</span></div>
                       </div>
                     </div>
                     
                     <div className="flex gap-3 ml-4">
                       <button onClick={()=>startEditing(b)} className="p-3 text-gray-300 hover:text-orange-600 transition hover:bg-orange-50 rounded-full"><Edit2 className="w-5 h-5"/></button>
                       <button onClick={()=>del(b.id)} className="p-3 text-gray-300 hover:text-red-500 transition hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5"/></button>
                     </div>
                   </div>
                   <LinkedLedger linkedId={b.id} linkedType="building" transactions={transactions} onSaveTransaction={(tx)=>setTransactions([...transactions,tx])}/>
                 </div>
               );
           })}
       </div>
    </div>
  );
};

export default BuildingSection;
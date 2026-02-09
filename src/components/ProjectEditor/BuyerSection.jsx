import React, { useState } from 'react';
import { Edit2, Trash2, Check, Camera, X, User, Phone, MapPin, Save, Plus } from 'lucide-react';

const handleImageUploadGeneric = (file, callback) => { 
  if (file) { 
    const reader = new FileReader(); 
    reader.onloadend = () => callback(reader.result); 
    reader.readAsDataURL(file); 
  } 
};

const BuyerSection = ({ buyers, setBuyers, sortedBuyers, setPreviewImage }) => {
  // 狀態管理
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 表單暫存
  const [temp, setTemp] = useState({ name: "", phone: "", address: "", unit: "", landPrice: "", buildingPrice: "", totalPrice: "", image: null });

  // 計算總價
  const handlePriceChange = (field, value) => {
    const updated = { ...temp, [field]: value };
    if (field === 'landPrice' || field === 'buildingPrice') {
        updated.totalPrice = (Number(updated.landPrice || 0) + Number(updated.buildingPrice || 0)).toString();
    }
    setTemp(updated);
  };

  // 儲存 (新增或更新)
  const save = () => {
    if (!temp.name) return alert("請輸入姓名");
    
    if (editingId) {
        setBuyers(buyers.map(b => b.id === editingId ? { ...temp, id: b.id } : b));
    } else {
        setBuyers([...buyers, { ...temp, id: Date.now() }]);
    }
    cancelEdit();
  };

  // 取消 / 重置
  const cancelEdit = () => {
      setIsCreating(false);
      setEditingId(null);
      setTemp({ name: "", phone: "", address: "", unit: "", landPrice: "", buildingPrice: "", totalPrice: "", image: null });
  };

  // 開始新增
  const startCreating = () => {
      setEditingId(null);
      setTemp({ name: "", phone: "", address: "", unit: "", landPrice: "", buildingPrice: "", totalPrice: "", image: null });
      setIsCreating(true);
  };

  // 開始編輯 (原地)
  const startEditing = (b) => {
      setIsCreating(false);
      setEditingId(b.id);
      setTemp({...b});
  };

  const deleteBuyer = (id) => { if(confirm("確定刪除此買受人？")) setBuyers(buyers.filter(b => b.id !== id)); };

  // 共用表單 UI
  const renderForm = (isEditMode) => (
      <div className={`p-6 rounded-2xl border-2 ${isEditMode ? 'bg-blue-50 border-blue-400' : 'bg-white border-blue-200'} shadow-lg animate-fadeIn mb-6`}>
          <div className="flex justify-between items-center mb-6 border-b pb-4 border-blue-200">
             <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                 <User className="w-5 h-5"/> {isEditMode ? "修改買受人" : "新增買受人"}
             </h3>
             <button onClick={cancelEdit} className="p-2 hover:bg-black/5 rounded-full text-gray-500"><X className="w-5 h-5"/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-6">
            <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-500 mb-1 block">戶號</label>
                <input type="text" placeholder="A1" className="w-full p-3 border rounded-lg font-bold text-blue-600" value={temp.unit} onChange={e => setTemp({...temp, unit: e.target.value})} />
            </div>
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">姓名</label>
                <input type="text" placeholder="姓名" className="w-full p-3 border rounded-lg" value={temp.name} onChange={e => setTemp({...temp, name: e.target.value})} />
            </div>
            <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 mb-1 block">電話</label>
                <input type="text" placeholder="電話" className="w-full p-3 border rounded-lg" value={temp.phone} onChange={e => setTemp({...temp, phone: e.target.value})} />
            </div>
            <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-500 mb-1 block">地址</label>
                <input type="text" placeholder="地址" className="w-full p-3 border rounded-lg" value={temp.address} onChange={e => setTemp({...temp, address: e.target.value})} />
            </div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-400 block mb-1">土地合約價</label><input type="number" className="w-full p-2 border rounded" value={temp.landPrice} onChange={e=>handlePriceChange('landPrice', e.target.value)}/></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-gray-400 block mb-1">建物合約價</label><input type="number" className="w-full p-2 border rounded" value={temp.buildingPrice} onChange={e=>handlePriceChange('buildingPrice', e.target.value)}/></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-blue-500 block mb-1">合約總價</label><input type="number" className="w-full p-2 border border-blue-300 rounded font-bold text-blue-600" value={temp.totalPrice} onChange={e=>setTemp({...temp, totalPrice: e.target.value})}/></div>
            
            <div className="md:col-span-6 mt-2">
                <div className="relative">
                    <input type="file" id="buyerImg" className="hidden" accept="image/*" onChange={(e) => handleImageUploadGeneric(e.target.files[0], (res) => setTemp({...temp, image: res}))} />
                    <label htmlFor="buyerImg" className="flex justify-center items-center gap-2 w-full p-3 border-2 border-dashed rounded-lg text-xs font-bold cursor-pointer transition-all bg-white border-gray-300 hover:bg-gray-50">
                        {temp.image ? <Check className="w-4 h-4 text-green-500"/> : <Camera className="w-4 h-4"/>} {temp.image ? "已選圖 (點擊更換)" : "上傳證件圖"}
                    </label>
                    {temp.image && <button onClick={()=>setTemp({...temp, image: null})} className="absolute top-2 right-2 bg-red-100 text-red-500 rounded-full p-1"><X className="w-3 h-3"/></button>}
                </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
              <button onClick={cancelEdit} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-black/5">取消</button>
              <button onClick={save} className="px-8 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2"><Save className="w-4 h-4"/> 儲存</button>
          </div>
      </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
       <h2 className="font-bold text-gray-700 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">買受人資訊管理</h2>
       
       {/* 新增按鈕 (如果不在新增模式) */}
       {!isCreating && (
           <button onClick={startCreating} className="w-full py-4 mb-6 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 font-bold hover:bg-blue-50 flex justify-center items-center gap-2 transition">
               <Plus className="w-5 h-5"/> 新增買受人
           </button>
       )}

       {/* 新增表單 */}
       {isCreating && renderForm(false)}

       <div className="space-y-4">
           {sortedBuyers.map(b => {
               // ✅ 如果正在編輯此 ID，顯示表單，否則顯示卡片
               if (editingId === b.id) {
                   return <div key={b.id}>{renderForm(true)}</div>;
               }

               return (
                <div key={b.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border rounded-2xl hover:shadow-md transition group bg-white">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-black">{b.unit || "未填"}</span>
                            <span className="font-bold text-gray-800 text-lg">{b.name}</span>
                            <span className="text-gray-400 text-sm flex items-center gap-1"><Phone className="w-3 h-3"/> {b.phone}</span>
                        </div>
                        <div className="text-gray-500 text-sm mb-3 flex items-center gap-1"><MapPin className="w-3 h-3"/> {b.address}</div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 w-full md:w-auto">
                            <div className="text-gray-500">土地: ${Number(b.landPrice).toLocaleString()}</div>
                            <div className="text-gray-500">建物: ${Number(b.buildingPrice).toLocaleString()}</div>
                            <div className="text-blue-600 font-black">總價: ${Number(b.totalPrice).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 md:mt-0 md:ml-4 self-end md:self-center">
                        {b.image && <button onClick={()=>setPreviewImage(b.image)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg text-xs font-bold">證件</button>}
                        <button onClick={()=>startEditing(b)} className="text-gray-400 hover:text-blue-600 p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-5 h-5"/></button>
                        <button onClick={()=>deleteBuyer(b.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-gray-100 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                    </div>
                </div>
               );
           })}
       </div>
    </div>
  );
};

export default BuyerSection;
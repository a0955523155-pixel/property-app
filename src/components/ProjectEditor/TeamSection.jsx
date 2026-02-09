import React, { useState } from 'react';
import { Plus, Trash2, Camera, FileText, Receipt } from 'lucide-react'; // ✅ 新增圖示

const TeamSection = ({ 
  projectTeams, 
  setProjectTeams, 
  agencyDB, 
  sortedBuildings, 
  setPreviewImage,
  handleImageUploadGeneric 
}) => {
  // 內部狀態：用來處理新增合約的小表單
  const [newContract, setNewContract] = useState({ type: '一般約', no: '' });
  // ✅ 新增內部狀態：用來處理新增單據的小表單
  const [newReceipt, setNewReceipt] = useState({ no: '' });

  const addTeamMember = () => setProjectTeams([...projectTeams, { id: Date.now(), unit: "", agency: "", broker: "", developer: "", developerType: "", developerNo: "", marketer: "", marketerNo: "", scrivener: "" }]);
  const removeTeamMember = (id) => { if(confirm("確定刪除？")) setProjectTeams(projectTeams.filter(t => t.id !== id)); };
  const updateTeamMember = (id, field, value) => setProjectTeams(projectTeams.map(t => t.id === id ? { ...t, [field]: value } : t));
  const handleAgencyChange = (id, agencyName) => {
     const brokers = (agencyDB && agencyDB[agencyName]) || [];
     setProjectTeams(projectTeams.map(t => t.id === id ? { ...t, agency: agencyName, broker: brokers[0] || "" } : t));
  };

  // 處理合約添加
  const handleAddContract = (teamId, currentType, currentNo) => {
      if(!newContract.no) return alert("請輸入合約編號");
      // 如果原本有值，就用 " / " 分隔，否則直接賦值
      const nextType = currentType ? `${currentType} / ${newContract.type}` : newContract.type;
      const nextNo = currentNo ? `${currentNo} / ${newContract.no}` : newContract.no;
      updateTeamMember(teamId, 'developerType', nextType);
      updateTeamMember(teamId, 'developerNo', nextNo);
      setNewContract({ type: '一般約', no: '' }); // 重置
  };

  // ✅ 新增：處理單據添加
  const handleAddReceipt = (teamId, currentNo) => {
      if(!newReceipt.no) return alert("請輸入單據編號");
      // 如果原本有值，就用 " / " 分隔
      const nextNo = currentNo ? `${currentNo} / ${newReceipt.no}` : newReceipt.no;
      updateTeamMember(teamId, 'marketerNo', nextNo);
      setNewReceipt({ no: '' }); // 重置
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 border-l-4 border-blue-500 pl-4 uppercase tracking-wider text-lg">專案團隊資訊</h2>
        <button onClick={addTeamMember} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-1"><Plus className="w-4 h-4"/> 新增團隊成員</button>
      </div>
      <div className="space-y-6">
        {projectTeams.map((team) => (
          <div key={team.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group">
            <div className="absolute top-4 right-4"><button onClick={()=>removeTeamMember(team.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button></div>
            <div className="md:col-span-2"><label className="text-xs font-bold text-blue-600 mb-1 block">歸屬建物戶號</label><select className="w-full p-2 border border-blue-200 rounded-lg bg-white font-bold" value={team.unit} onChange={e=>updateTeamMember(team.id, 'unit', e.target.value)}><option value="">-- 全案通用 --</option>{sortedBuildings.map(b => <option key={b.id} value={b.unit}>{b.unit} ({b.address})</option>)}</select></div>
            <div><label className="text-sm text-gray-500 block mb-2 font-bold">仲介公司</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.agency} onChange={e => handleAgencyChange(team.id, e.target.value)}><option value="">-- 請選擇 --</option>{agencyDB && Object.keys(agencyDB).map(ag => <option key={ag} value={ag}>{ag}</option>)}</select></div>
            <div><label className="text-sm text-gray-500 block mb-2 font-bold">經紀人</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.broker} onChange={e => updateTeamMember(team.id, 'broker', e.target.value)} disabled={!team.agency}><option value="">{team.agency ? "-- 請選擇經紀人 --" : "-- 請先選擇公司 --"}</option>{team.agency && agencyDB[team.agency]?.map(bk => <option key={bk} value={bk}>{bk}</option>)}</select></div>
            
            {/* ✅ 開發業務與合約區塊 (已修改) */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">開發業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.developer} onChange={e=>updateTeamMember(team.id, 'developer', e.target.value)} placeholder="輸入姓名" />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-blue-700 flex items-center gap-1"><FileText className="w-4 h-4"/> 已登錄合約清單</label>
                        {/* 圖片上傳移到這裡 */}
                        <div className="flex gap-2">
                            <label className="cursor-pointer bg-white p-2 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 border shadow-sm"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'developerImg', res))} /></label>
                            {team.developerImg && <button onClick={()=>setPreviewImage(team.developerImg)} className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xs whitespace-nowrap shadow-sm">查看圖片</button>}
                        </div>
                    </div>
                    
                    {/* 顯示已加入的合約 (唯讀) */}
                    {(team.developerNo) ? (
                        <div className="text-sm bg-white border border-blue-200 p-2 rounded mb-3 text-gray-700">
                            <div><span className="font-bold">類型:</span> {team.developerType}</div>
                            <div><span className="font-bold">編號:</span> {team.developerNo}</div>
                        </div>
                    ) : <div className="text-xs text-gray-400 italic mb-3">尚無合約資料</div>}
                    
                    {/* 增加合約工具 */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                        <span className="text-xs font-bold text-blue-600 whitespace-nowrap">➕ 增加合約</span>
                        <select className="p-2 border rounded text-sm bg-gray-50 outline-none" value={newContract.type} onChange={e=>setNewContract({...newContract, type: e.target.value})}><option value="一般約">一般約</option><option value="專任約">專任約</option></select>
                        <input className="p-2 border rounded text-sm w-full outline-none" placeholder="輸入編號" value={newContract.no} onChange={e=>setNewContract({...newContract, no: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddContract(team.id, team.developerType, team.developerNo)} />
                        <button onClick={()=>handleAddContract(team.id, team.developerType, team.developerNo)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 whitespace-nowrap">加入</button>
                    </div>
                </div>
            </div>

            {/* ✅ 行銷業務與單據區塊 (已修改，新增累加功能) */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">行銷業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.marketer} onChange={e=>updateTeamMember(team.id, 'marketer', e.target.value)} placeholder="輸入姓名" />
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-purple-700 flex items-center gap-1"><Receipt className="w-4 h-4"/> 已登錄 斡旋/訂金 單據</label>
                        {/* 圖片上傳移到這裡 */}
                        <div className="flex gap-2">
                             <label className="cursor-pointer bg-white p-2 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 border shadow-sm"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'marketerImg', res))} /></label>
                             {team.marketerImg && <button onClick={()=>setPreviewImage(team.marketerImg)} className="bg-purple-600 text-white p-2 rounded-lg font-bold text-xs whitespace-nowrap shadow-sm">查看圖片</button>}
                        </div>
                    </div>
                    
                    {/* 顯示已加入的單據 (唯讀) */}
                    {(team.marketerNo) ? (
                        <div className="text-sm bg-white border border-purple-200 p-2 rounded mb-3 text-gray-700 break-all">
                            <span className="font-bold">編號:</span> {team.marketerNo}
                        </div>
                    ) : <div className="text-xs text-gray-400 italic mb-3">尚無單據資料</div>}

                    {/* ✅ 新增單據工具 */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-purple-200">
                        <span className="text-xs font-bold text-purple-600 whitespace-nowrap">➕ 增加單據</span>
                        <input className="p-2 border rounded text-sm w-full outline-none" placeholder="輸入單據編號" value={newReceipt.no} onChange={e=>setNewReceipt({...newReceipt, no: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddReceipt(team.id, team.marketerNo)} />
                        <button onClick={()=>handleAddReceipt(team.id, team.marketerNo)} className="bg-purple-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-purple-700 whitespace-nowrap">加入</button>
                    </div>
                </div>
            </div>
            
            <div className="md:col-span-2 border-t pt-4"><label className="text-sm text-gray-500 block mb-2 font-bold">承辦代書</label><input className="w-full p-3 border rounded-lg text-base" value={team.scrivener} onChange={e=>updateTeamMember(team.id, 'scrivener', e.target.value)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;
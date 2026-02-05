import React from 'react';
import { Plus, Trash2, Camera } from 'lucide-react';

const TeamSection = ({ 
  projectTeams, 
  setProjectTeams, 
  agencyDB, 
  sortedBuildings, 
  setPreviewImage,
  handleImageUploadGeneric 
}) => {
  const addTeamMember = () => setProjectTeams([...projectTeams, { id: Date.now(), unit: "", agency: "", broker: "", developer: "", developerType: "general", developerNo: "", marketer: "", marketerNo: "", scrivener: "" }]);
  const removeTeamMember = (id) => { if(confirm("確定刪除？")) setProjectTeams(projectTeams.filter(t => t.id !== id)); };
  const updateTeamMember = (id, field, value) => setProjectTeams(projectTeams.map(t => t.id === id ? { ...t, [field]: value } : t));
  const handleAgencyChange = (id, agencyName) => {
     const brokers = (agencyDB && agencyDB[agencyName]) || [];
     setProjectTeams(projectTeams.map(t => t.id === id ? { ...t, agency: agencyName, broker: brokers[0] || "" } : t));
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
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4"><div><label className="text-sm text-gray-500 block mb-2 font-bold">開發業務</label><input className="w-full p-3 border rounded-lg" value={team.developer} onChange={e=>updateTeamMember(team.id, 'developer', e.target.value)} /></div><div className="flex gap-2"><div className="flex-1"><label className="text-sm text-gray-500 block mb-2 font-bold">合約類型</label><select className="w-full p-3 border rounded-lg bg-white" value={team.developerType} onChange={e=>updateTeamMember(team.id, 'developerType', e.target.value)}><option value="general">一般約</option><option value="exclusive">專任約</option></select></div><div className="flex-[2]"><label className="text-sm text-gray-500 block mb-2 font-bold">合約號碼</label><div className="flex gap-2"><input className="w-full p-3 border rounded-lg" value={team.developerNo} onChange={e=>updateTeamMember(team.id, 'developerNo', e.target.value)} /><label className="cursor-pointer bg-gray-200 p-3 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-300"><Camera className="w-5 h-5"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'developerImg', res))} /></label>{team.developerImg && <button onClick={()=>setPreviewImage(team.developerImg)} className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs whitespace-nowrap">圖</button>}</div></div></div></div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4"><div><label className="text-sm text-gray-500 block mb-2 font-bold">行銷業務</label><input className="w-full p-3 border rounded-lg" value={team.marketer} onChange={e=>updateTeamMember(team.id, 'marketer', e.target.value)} /></div><div className="flex gap-2"><div className="flex-1 pt-8 text-sm font-bold text-gray-400 text-center bg-gray-100 rounded-lg">斡旋 / 訂金</div><div className="flex-[2]"><label className="text-sm text-gray-500 block mb-2 font-bold">單據號碼</label><div className="flex gap-2"><input className="w-full p-3 border rounded-lg" value={team.marketerNo} onChange={e=>updateTeamMember(team.id, 'marketerNo', e.target.value)} /><label className="cursor-pointer bg-gray-200 p-3 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-300"><Camera className="w-5 h-5"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'marketerImg', res))} /></label>{team.marketerImg && <button onClick={()=>setPreviewImage(team.marketerImg)} className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs whitespace-nowrap">圖</button>}</div></div></div></div>
            <div className="md:col-span-2 border-t pt-4"><label className="text-sm text-gray-500 block mb-2 font-bold">承辦代書</label><input className="w-full p-3 border rounded-lg text-base" value={team.scrivener} onChange={e=>updateTeamMember(team.id, 'scrivener', e.target.value)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;
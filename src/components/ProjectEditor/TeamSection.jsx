import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Camera, FileText, Receipt, Building2, Map } from 'lucide-react';

const TeamSection = ({ 
  projectTeams, 
  setProjectTeams, 
  agencyDB, 
  sortedBuildings = [], // 預設值防止崩潰
  lands = [],           // ✅ 新增：必須傳入 lands 資料
  setPreviewImage,
  handleImageUploadGeneric 
}) => {
  // 內部狀態：用來處理新增合約的小表單
  const [newContract, setNewContract] = useState({ type: '一般約', no: '' });
  // 內部狀態：用來處理新增單據的小表單
  const [newReceipt, setNewReceipt] = useState({ no: '' });

  // 1. 準備下拉選單資料 (Memo 優化效能)
  const buildingOptions = useMemo(() => {
    if (!Array.isArray(sortedBuildings)) return [];
    return sortedBuildings.map(b => ({ value: b.unit, label: `${b.unit} (${b.address || '無地址'})` }));
  }, [sortedBuildings]);

  const landOptions = useMemo(() => {
    if (!Array.isArray(lands)) return [];
    let options = [];
    lands.forEach(l => {
        if (Array.isArray(l.items)) {
            l.items.forEach(item => {
                // 組合顯示名稱：地段 + 地號
                const label = `${l.section} ${item.lotNumber}地號`;
                // 值：這裡存 地號 或是 唯一識別碼，視您後續 PrintView 如何對應
                // 建議存 "地段 地號" 以免不同地段有相同地號
                options.push({ value: item.lotNumber, label: label }); 
            });
        }
    });
    return options;
  }, [lands]);

  // 2. 新增成員 (預設 targetType 為 building)
  const addTeamMember = () => setProjectTeams([
      ...projectTeams, 
      { 
          id: Date.now(), 
          targetType: 'building', // ✅ 新增：預設為建物
          unit: "", 
          agency: "", broker: "", 
          developer: "", developerType: "", developerNo: "", 
          marketer: "", marketerNo: "", 
          scrivener: "" 
      }
  ]);

  const removeTeamMember = (id) => { if(confirm("確定刪除？")) setProjectTeams(projectTeams.filter(t => t.id !== id)); };

  // 3. 更新成員 (包含切換類型時清空 unit)
  const updateTeamMember = (id, field, value) => {
      setProjectTeams(projectTeams.map(t => {
          if (t.id === id) {
              // 如果切換類型，清空原本選中的標的，避免混淆
              if (field === 'targetType' && value !== t.targetType) {
                  return { ...t, [field]: value, unit: '' };
              }
              return { ...t, [field]: value };
          }
          return t;
      }));
  };

  const handleAgencyChange = (id, agencyName) => {
     const brokers = (agencyDB && agencyDB[agencyName]) || [];
     setProjectTeams(projectTeams.map(t => t.id === id ? { ...t, agency: agencyName, broker: brokers[0] || "" } : t));
  };

  // 處理合約添加
  const handleAddContract = (teamId, currentType, currentNo) => {
      if(!newContract.no) return alert("請輸入合約編號");
      const nextType = currentType ? `${currentType} / ${newContract.type}` : newContract.type;
      const nextNo = currentNo ? `${currentNo} / ${newContract.no}` : newContract.no;
      updateTeamMember(teamId, 'developerType', nextType);
      updateTeamMember(teamId, 'developerNo', nextNo);
      setNewContract({ type: '一般約', no: '' });
  };

  // 處理單據添加
  const handleAddReceipt = (teamId, currentNo) => {
      if(!newReceipt.no) return alert("請輸入單據編號");
      const nextNo = currentNo ? `${currentNo} / ${newReceipt.no}` : newReceipt.no;
      updateTeamMember(teamId, 'marketerNo', nextNo);
      setNewReceipt({ no: '' });
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
            
            {/* ✅ 修改：歸屬選擇區塊 */}
            <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-blue-600 block">歸屬標的 (請先選擇類型)</label>
                
                {/* 類型切換按鈕 */}
                <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden p-1 gap-1 w-fit mb-2">
                    <button 
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${team.targetType === 'land' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}
                        onClick={() => updateTeamMember(team.id, 'targetType', 'land')}
                    >
                        <Map className="w-3 h-3"/> 土地
                    </button>
                    <button 
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${team.targetType !== 'land' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'}`}
                        onClick={() => updateTeamMember(team.id, 'targetType', 'building')}
                    >
                        <Building2 className="w-3 h-3"/> 建物
                    </button>
                </div>

                {/* 動態下拉選單 */}
                <select 
                    className={`w-full p-2 border rounded-lg font-bold transition-colors outline-none focus:ring-2 ${team.targetType === 'land' ? 'border-green-200 bg-green-50 focus:ring-green-500' : 'border-blue-200 bg-white focus:ring-blue-500'}`} 
                    value={team.unit} 
                    onChange={e=>updateTeamMember(team.id, 'unit', e.target.value)}
                >
                    <option value="">-- {team.targetType === 'land' ? '選擇地號' : '選擇建物戶號'} --</option>
                    {/* 根據 targetType 渲染不同選項 */}
                    {(team.targetType === 'land' ? landOptions : buildingOptions).map(opt => (
                        <option key={`${opt.value}-${opt.label}`} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div><label className="text-sm text-gray-500 block mb-2 font-bold">仲介公司</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.agency} onChange={e => handleAgencyChange(team.id, e.target.value)}><option value="">-- 請選擇 --</option>{agencyDB && Object.keys(agencyDB).map(ag => <option key={ag} value={ag}>{ag}</option>)}</select></div>
            <div><label className="text-sm text-gray-500 block mb-2 font-bold">經紀人</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.broker} onChange={e => updateTeamMember(team.id, 'broker', e.target.value)} disabled={!team.agency}><option value="">{team.agency ? "-- 請選擇經紀人 --" : "-- 請先選擇公司 --"}</option>{team.agency && agencyDB[team.agency]?.map(bk => <option key={bk} value={bk}>{bk}</option>)}</select></div>
            
            {/* 開發業務與合約區塊 */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">開發業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.developer} onChange={e=>updateTeamMember(team.id, 'developer', e.target.value)} placeholder="輸入姓名" />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-blue-700 flex items-center gap-1"><FileText className="w-4 h-4"/> 已登錄合約清單</label>
                        <div className="flex gap-2">
                            <label className="cursor-pointer bg-white p-2 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 border shadow-sm"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'developerImg', res))} /></label>
                            {team.developerImg && <button onClick={()=>setPreviewImage(team.developerImg)} className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xs whitespace-nowrap shadow-sm">查看圖片</button>}
                        </div>
                    </div>
                    
                    {(team.developerNo) ? (
                        <div className="text-sm bg-white border border-blue-200 p-2 rounded mb-3 text-gray-700">
                            <div><span className="font-bold">類型:</span> {team.developerType}</div>
                            <div><span className="font-bold">編號:</span> {team.developerNo}</div>
                        </div>
                    ) : <div className="text-xs text-gray-400 italic mb-3">尚無合約資料</div>}
                    
                    <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                        <span className="text-xs font-bold text-blue-600 whitespace-nowrap">➕ 增加合約</span>
                        <select className="p-2 border rounded text-sm bg-gray-50 outline-none" value={newContract.type} onChange={e=>setNewContract({...newContract, type: e.target.value})}><option value="一般約">一般約</option><option value="專任約">專任約</option></select>
                        <input className="p-2 border rounded text-sm w-full outline-none" placeholder="輸入編號" value={newContract.no} onChange={e=>setNewContract({...newContract, no: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddContract(team.id, team.developerType, team.developerNo)} />
                        <button onClick={()=>handleAddContract(team.id, team.developerType, team.developerNo)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 whitespace-nowrap">加入</button>
                    </div>
                </div>
            </div>

            {/* 行銷業務與單據區塊 */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">行銷業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.marketer} onChange={e=>updateTeamMember(team.id, 'marketer', e.target.value)} placeholder="輸入姓名" />
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-purple-700 flex items-center gap-1"><Receipt className="w-4 h-4"/> 已登錄 斡旋/訂金 單據</label>
                        <div className="flex gap-2">
                             <label className="cursor-pointer bg-white p-2 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 border shadow-sm"><Camera className="w-4 h-4"/><input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageUploadGeneric(e.target.files[0], (res)=>updateTeamMember(team.id, 'marketerImg', res))} /></label>
                             {team.marketerImg && <button onClick={()=>setPreviewImage(team.marketerImg)} className="bg-purple-600 text-white p-2 rounded-lg font-bold text-xs whitespace-nowrap shadow-sm">查看圖片</button>}
                        </div>
                    </div>
                    
                    {(team.marketerNo) ? (
                        <div className="text-sm bg-white border border-purple-200 p-2 rounded mb-3 text-gray-700 break-all">
                            <span className="font-bold">編號:</span> {team.marketerNo}
                        </div>
                    ) : <div className="text-xs text-gray-400 italic mb-3">尚無單據資料</div>}

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
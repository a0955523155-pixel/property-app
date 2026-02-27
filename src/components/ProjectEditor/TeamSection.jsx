import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Camera, FileText, Receipt, Building2, Map, DollarSign } from 'lucide-react';

const TeamSection = ({ 
  projectTeams, 
  setProjectTeams, 
  agencyDB, 
  sortedBuildings = [], 
  lands = [],           
  setPreviewImage,
  handleImageUploadGeneric 
}) => {
  const [newContract, setNewContract] = useState({ type: '一般約', no: '' });
  const [newReceipt, setNewReceipt] = useState({ no: '' });

  // 1. 準備下拉選單資料
  const buildingOptions = useMemo(() => {
    if (!Array.isArray(sortedBuildings)) return [];
    return sortedBuildings.map(b => ({ value: b.unit, label: `${b.unit} (${b.address || '無地址'})` }));
  }, [sortedBuildings]);

  const landOptions = useMemo(() => {
    if (!Array.isArray(lands)) return [];
    let options = [];
    lands.forEach(l => {
        const sellerName = l.sellers && Array.isArray(l.sellers) && l.sellers.length > 0
            ? l.sellers.map(s => s.name).join('、') 
            : '未填寫出售人';

        if (Array.isArray(l.items)) {
            l.items.forEach(item => {
                const label = `${sellerName} (${l.section} ${item.lotNumber}地號)`;
                options.push({ value: item.lotNumber, label: label }); 
            });
        }
    });
    return options;
  }, [lands]);

  // 2. 新增成員 (加入全新的請款相關欄位)
  const addTeamMember = () => setProjectTeams([
      ...projectTeams, 
      { 
          id: Date.now(), 
          targetType: 'building', 
          unit: "", 
          agency: "", broker: "", 
          developer: "", developerType: "", developerNo: "", 
          // 開發業務請款欄位
          devInvoiceNo: "", devServiceFee: "", devPaymentDate: "", devDetails: "", devAmount: "", devSubtotal: "",
          marketer: "", marketerNo: "", 
          // 行銷業務請款欄位
          marInvoiceNo: "", marServiceFee: "", marPaymentDate: "", marDetails: "", marAmount: "", marSubtotal: "",
          scrivener: "" 
      }
  ]);

  const removeTeamMember = (id) => { if(confirm("確定刪除？")) setProjectTeams(projectTeams.filter(t => t.id !== id)); };

  // 3. 更新成員
  const updateTeamMember = (id, field, value) => {
      setProjectTeams(projectTeams.map(t => {
          if (t.id === id) {
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

  const handleAddContract = (teamId, currentType, currentNo) => {
      if(!newContract.no) return alert("請輸入合約編號");
      const nextType = currentType ? `${currentType} / ${newContract.type}` : newContract.type;
      const nextNo = currentNo ? `${currentNo} / ${newContract.no}` : newContract.no;
      updateTeamMember(teamId, 'developerType', nextType);
      updateTeamMember(teamId, 'developerNo', nextNo);
      setNewContract({ type: '一般約', no: '' });
  };

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
        {projectTeams.map((team, index) => (
          <div key={team.id || index} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group">
            <div className="absolute top-4 right-4"><button onClick={()=>removeTeamMember(team.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-5 h-5"/></button></div>
            
            {/* 歸屬選擇區塊 */}
            <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-blue-600 block">歸屬標的 (請先選擇類型)</label>
                
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

                <select 
                    className={`w-full p-2 border rounded-lg font-bold transition-colors outline-none focus:ring-2 ${team.targetType === 'land' ? 'border-green-200 bg-green-50 focus:ring-green-500' : 'border-blue-200 bg-white focus:ring-blue-500'}`} 
                    value={team.unit || ''} 
                    onChange={e=>updateTeamMember(team.id, 'unit', e.target.value)}
                >
                    <option value="">-- {team.targetType === 'land' ? '選擇出售人 (地號)' : '選擇建物戶號'} --</option>
                    {(team.targetType === 'land' ? landOptions : buildingOptions).map(opt => (
                        <option key={`${opt.value}-${opt.label}`} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div><label className="text-sm text-gray-500 block mb-2 font-bold">仲介公司</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.agency || ''} onChange={e => handleAgencyChange(team.id, e.target.value)}><option value="">-- 請選擇 --</option>{agencyDB && Object.keys(agencyDB).map(ag => <option key={ag} value={ag}>{ag}</option>)}</select></div>
            <div><label className="text-sm text-gray-500 block mb-2 font-bold">經紀人</label><select className="w-full p-3 border rounded-lg text-base bg-white" value={team.broker || ''} onChange={e => updateTeamMember(team.id, 'broker', e.target.value)} disabled={!team.agency}><option value="">{team.agency ? "-- 請選擇經紀人 --" : "-- 請先選擇公司 --"}</option>{team.agency && agencyDB[team.agency]?.map(bk => <option key={bk} value={bk}>{bk}</option>)}</select></div>
            
            {/* 開發業務區塊 */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">開發業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.developer || ''} onChange={e=>updateTeamMember(team.id, 'developer', e.target.value)} placeholder="輸入姓名" />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
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
                        <select className="p-2 border rounded text-sm bg-gray-50 outline-none" value={newContract.type || ''} onChange={e=>setNewContract({...newContract, type: e.target.value})}><option value="一般約">一般約</option><option value="專任約">專任約</option></select>
                        <input className="p-2 border rounded text-sm w-full outline-none" placeholder="輸入編號" value={newContract.no || ''} onChange={e=>setNewContract({...newContract, no: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddContract(team.id, team.developerType, team.developerNo)} />
                        <button onClick={()=>handleAddContract(team.id, team.developerType, team.developerNo)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-blue-700 whitespace-nowrap">加入</button>
                    </div>
                </div>

                {/* ✅ 新增：開發業務 請款與發票資訊 */}
                <div className="border-t border-blue-100 pt-4 mt-2">
                    <label className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1">
                        <DollarSign className="w-4 h-4"/> 發票與請款資訊 (開發)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">款項日期</label><input type="date" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400" value={team.devPaymentDate || ''} onChange={e=>updateTeamMember(team.id, 'devPaymentDate', e.target.value)} /></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">發票號碼</label><input type="text" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400" value={team.devInvoiceNo || ''} onChange={e=>updateTeamMember(team.id, 'devInvoiceNo', e.target.value)} placeholder="發票號碼"/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">服務費用</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400" value={team.devServiceFee || ''} onChange={e=>updateTeamMember(team.id, 'devServiceFee', e.target.value)} placeholder="$"/></div>
                        <div className="md:col-span-3"><label className="text-[10px] text-gray-500 font-bold block mb-1">明細</label><input type="text" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400" value={team.devDetails || ''} onChange={e=>updateTeamMember(team.id, 'devDetails', e.target.value)} placeholder="請款明細說明..."/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">金額</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400 font-bold text-blue-600" value={team.devAmount || ''} onChange={e=>updateTeamMember(team.id, 'devAmount', e.target.value)} placeholder="$"/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">小計</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-blue-400 font-bold text-blue-600" value={team.devSubtotal || ''} onChange={e=>updateTeamMember(team.id, 'devSubtotal', e.target.value)} placeholder="$"/></div>
                    </div>
                </div>
            </div>

            {/* 行銷業務區塊 */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="mb-4">
                    <label className="text-sm text-gray-500 block mb-2 font-bold">行銷業務姓名</label>
                    <input className="w-full p-3 border rounded-lg" value={team.marketer || ''} onChange={e=>updateTeamMember(team.id, 'marketer', e.target.value)} placeholder="輸入姓名" />
                </div>

                <div className="bg-purple-50 p-3 rounded-lg mb-4">
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
                        <input className="p-2 border rounded text-sm w-full outline-none" placeholder="輸入單據編號" value={newReceipt.no || ''} onChange={e=>setNewReceipt({...newReceipt, no: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleAddReceipt(team.id, team.marketerNo)} />
                        <button onClick={()=>handleAddReceipt(team.id, team.marketerNo)} className="bg-purple-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-purple-700 whitespace-nowrap">加入</button>
                    </div>
                </div>

                {/* ✅ 新增：行銷業務 請款與發票資訊 */}
                <div className="border-t border-purple-100 pt-4 mt-2">
                    <label className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-1">
                        <DollarSign className="w-4 h-4"/> 發票與請款資訊 (行銷)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">款項日期</label><input type="date" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400" value={team.marPaymentDate || ''} onChange={e=>updateTeamMember(team.id, 'marPaymentDate', e.target.value)} /></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">發票號碼</label><input type="text" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400" value={team.marInvoiceNo || ''} onChange={e=>updateTeamMember(team.id, 'marInvoiceNo', e.target.value)} placeholder="發票號碼"/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">服務費用</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400" value={team.marServiceFee || ''} onChange={e=>updateTeamMember(team.id, 'marServiceFee', e.target.value)} placeholder="$"/></div>
                        <div className="md:col-span-3"><label className="text-[10px] text-gray-500 font-bold block mb-1">明細</label><input type="text" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400" value={team.marDetails || ''} onChange={e=>updateTeamMember(team.id, 'marDetails', e.target.value)} placeholder="請款明細說明..."/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">金額</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400 font-bold text-purple-600" value={team.marAmount || ''} onChange={e=>updateTeamMember(team.id, 'marAmount', e.target.value)} placeholder="$"/></div>
                        <div><label className="text-[10px] text-gray-500 font-bold block mb-1">小計</label><input type="number" className="w-full p-2 border rounded bg-gray-50 text-xs outline-none focus:bg-white focus:border-purple-400 font-bold text-purple-600" value={team.marSubtotal || ''} onChange={e=>updateTeamMember(team.id, 'marSubtotal', e.target.value)} placeholder="$"/></div>
                    </div>
                </div>
            </div>
            
            <div className="md:col-span-2 border-t pt-4"><label className="text-sm text-gray-500 block mb-2 font-bold">承辦代書</label><input className="w-full p-3 border rounded-lg text-base" value={team.scrivener || ''} onChange={e=>updateTeamMember(team.id, 'scrivener', e.target.value)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;
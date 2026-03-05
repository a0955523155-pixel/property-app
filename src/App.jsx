import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, LayoutGrid, FolderPlus, 
  Trash2, CheckCircle2, MessageSquarePlus, Send, ChevronDown, ChevronRight, PieChart, Building2, Folder, Tag, Users, Settings, Plus, X,
  ArchiveRestore, Trash 
} from 'lucide-react';

import { db, auth } from './config/firebase';
import { 
  collection, doc, updateDoc, addDoc, deleteDoc, setDoc,
  onSnapshot, query, orderBy, limit 
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import ProjectEditor from './components/ProjectEditor';
import ProjectSummaryReport from './components/ProjectSummaryReport';
import Login from './components/Auth/Login';
import AuditLogView from './components/Auth/AuditLogView';

const APP_STYLES = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    body, #root, .app-wrapper { background-color: white !important; height: auto !important; overflow: visible !important; font-size: 10pt !important; }
    .print\\:hidden { display: none !important; }
    .print\\:block { display: block !important; }
    .print\\:p-8 { padding: 0 !important; }
    table { width: 100% !important; border-collapse: collapse !important; margin-bottom: 20px !important; table-layout: fixed; }
    th, td { border: 1px solid #000 !important; padding: 4px 6px !important; text-align: left; font-size: 9pt !important; word-wrap: break-word; overflow-wrap: break-word; }
    th:nth-child(1) { width: 15%; } th:nth-child(2) { width: 15%; }
    thead { display: table-header-group; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    * { box-shadow: none !important; text-shadow: none !important; }
  }
`;

// ==========================================
// 🚨 權限設定區：管理員信箱
// ==========================================
const ADMIN_EMAILS = [
  'admin@dinglong.com', 
  'zxcvbnm7780@gmail.com' 
];

const App = () => {
  // 統一使用 currentUser 管理身分，不再使用舊的 user
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email);

  const [auditLogs, setAuditLogs] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  
  const [activeSite, setActiveSite] = useState(""); 
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [expandedZones, setExpandedZones] = useState({});

  const [agencyDB, setAgencyDB] = useState({});
  const [showAgencyManager, setShowAgencyManager] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const [targetAgencyForBroker, setTargetAgencyForBroker] = useState("");
  const [newBrokerName, setNewBrokerName] = useState("");

  const [errorMsg, setErrorMsg] = useState(null);
  const [showTrashBin, setShowTrashBin] = useState(false);

  const activeProjects = useMemo(() => projects.filter(p => !p.isDeleted), [projects]);
  const trashedProjects = useMemo(() => projects.filter(p => p.isDeleted), [projects]);

  // ✅ 1. 嚴格的身分驗證監聽 (掃除幽靈匿名帳號)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        // 有信箱的才是合法登入
        setCurrentUser(user);
      } else if (user && !user.email) {
        // 如果抓到殘留的匿名無信箱帳號，強制踢出登出
        signOut(auth);
        setCurrentUser(null);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ 2. 嚴格抓取使用者信箱
  const logAction = async (action, module, details, overrideEmail = null) => {
    const userEmail = overrideEmail || (currentUser ? currentUser.email : null);
    
    // 如果真的抓不到信箱，就不記錄，避免產生空白紀錄
    if (!userEmail) return; 

    try {
      await addDoc(collection(db, "audit_logs"), {
        time: new Date().toLocaleString('zh-TW', { hour12: false }),
        timestamp: Date.now(),
        user: userEmail,
        action, 
        module, 
        details,
        acknowledged: false 
      });
    } catch (error) {
      console.error("無法寫入使用紀錄:", error);
    }
  };

  const handleAcknowledgeLog = async (logId) => {
    if (!logId) return;
    try {
      await updateDoc(doc(db, "audit_logs", String(logId)), { acknowledged: true });
    } catch (error) {
      console.error("確認失敗:", error);
      alert("確認失敗，請檢查網路連線。");
    }
  };

  useEffect(() => {
    if (!currentUser) return; 
    const handlePrint = () => { logAction('列印', '系統操作', '執行了列印報表/匯出PDF'); };
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') { logAction('截圖', '系統操作', '按下了 PrintScreen 截圖鍵'); }
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) { logAction('截圖', '系統操作', '使用了 Mac 快捷鍵截圖'); }
    };

    window.addEventListener('beforeprint', handlePrint);
    window.addEventListener('keyup', handleKeyDown);

    let unsubLogs = () => {};
    if (isAdmin) {
      const qLogs = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(200));
      unsubLogs = onSnapshot(qLogs, (snapshot) => {
        setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      window.removeEventListener('beforeprint', handlePrint);
      window.removeEventListener('keyup', handleKeyDown);
      unsubLogs(); 
    };
  }, [currentUser, isAdmin]);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = APP_STYLES;
    document.head.appendChild(styleTag);
    return () => { if(document.head.contains(styleTag)){ document.head.removeChild(styleTag); } }
  }, []);

  // ✅ 3. 資料庫連線全部改為依賴 currentUser
  useEffect(() => {
    if (!currentUser) return; 
    const q = query(collection(db, "projects"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => { console.error("Firestore Error:", error); setErrorMsg("連線錯誤"); });
    
    const qFeed = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsubFeed = onSnapshot(qFeed, (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const agencyDocRef = doc(db, "settings", "agency_list");
    const unsubAgency = onSnapshot(agencyDocRef, (docSnap) => {
      if (docSnap.exists()) { setAgencyDB(docSnap.data()); } 
      else { const defaultDB = { "自售/其他": ["屋主本人"] }; setDoc(agencyDocRef, defaultDB); setAgencyDB(defaultDB); }
    });

    return () => { unsubscribe(); unsubFeed(); unsubAgency(); };
  }, [currentUser]); // <-- 這裡改成 currentUser

  const saveAgencyDB = async (newDB) => {
    try { await setDoc(doc(db, "settings", "agency_list"), newDB); } 
    catch (error) { console.error("Save Agency Error:", error); alert("儲存失敗：" + error.message); }
  };

  const handleAddAgency = () => {
    if(!newAgencyName.trim()) return;
    if(agencyDB[newAgencyName]) return alert("公司已存在");
    const newDB = {...agencyDB, [newAgencyName]: []};
    saveAgencyDB(newDB); 
    setNewAgencyName("");
  };

  const handleDeleteAgency = (agencyName) => {
    if(!confirm(`確定要刪除「${agencyName}」及其下所有經紀人嗎？`)) return;
    const newDB = { ...agencyDB };
    delete newDB[agencyName];
    saveAgencyDB(newDB); 
  };
  
  const handleAddBroker = (agencyName) => {
    if(!newBrokerName.trim()) return;
    const brokers = agencyDB[agencyName] || [];
    if(brokers.includes(newBrokerName)) return alert("該經紀人已存在");
    const newDB = {...agencyDB, [agencyName]: [...brokers, newBrokerName]};
    saveAgencyDB(newDB); 
    setNewBrokerName("");
    setTargetAgencyForBroker("");
  };

  const handleDeleteBroker = (agencyName, brokerName) => {
    if(!confirm(`確定移除經紀人「${brokerName}」？`)) return;
    const brokers = agencyDB[agencyName] || [];
    const newDB = {...agencyDB, [agencyName]: brokers.filter(b => b !== brokerName)};
    saveAgencyDB(newDB); 
  };

  const uniqueSites = useMemo(() => {
    const sites = activeProjects.map(p => p.site || "大成工業城");
    const unique = [...new Set(sites)].sort();
    if (!unique.includes("大成工業城")) unique.unshift("大成工業城");
    return unique;
  }, [activeProjects]);

  const filteredGroupedProjects = useMemo(() => {
    if (!activeSite) return {};
    const targetProjects = activeProjects.filter(p => (p.site || "大成工業城") === activeSite);
    const groups = {};
    targetProjects.forEach(p => {
      const z = p.zone || "未分類";
      if (!groups[z]) groups[z] = [];
      groups[z].push(p);
    });
    return Object.keys(groups).sort().reduce((acc, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [activeProjects, activeSite]);

  const toggleZone = (zone) => setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));

  const handleSiteChange = (e) => {
    const value = e.target.value;
    if (value === "__NEW_SITE__") {
      const newName = prompt("請輸入新案場名稱:");
      if (newName && newName.trim()) setActiveSite(newName.trim());
    } else {
      setActiveSite(value);
    }
    setActiveProjectId(null);
    setExpandedZones({});
  };

  const handleSaveProject = async (updatedProject) => {
    if (!currentUser) return; 
    try {
      const { id, ...data } = updatedProject;
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, { ...data, updatedAt: new Date().toISOString() });
      logAction('編輯', '案件資料', `編輯了案件: ${updatedProject.name}`);
    } catch (error) { console.error(error); alert("儲存失敗: " + error.message); }
  };

  const createNewProject = async () => {
    if (!currentUser) return;
    const targetSite = activeSite || "大成工業城";
    const newProjectName = "新案件 " + new Date().toLocaleDateString();
    
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        site: targetSite, zone: "未分類", updatedAt: new Date().toISOString(),
        transactions: [], buyers: [], lands: [], buildings: [],
        isDeleted: false 
      });
      setActiveSite(targetSite);
      setActiveProjectId(docRef.id);
      logAction('新增', '案件資料', `在 [${targetSite}] 建立了: ${newProjectName}`);
    } catch (error) { console.error(error); alert("建立失敗: " + error.message); }
  };

  const moveToTrash = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm('確定要把此案件移至「資源回收桶」嗎？\n(管理員後續可以還原此案件)')) return;
    try { 
      const projectToTrash = projects.find(p => p.id === projectId);
      await updateDoc(doc(db, "projects", projectId), {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser.email
      });
      if (activeProjectId === projectId) setActiveProjectId(null); 
      logAction('刪除', '案件資料', `將案件移至垃圾桶: ${projectToTrash?.name || projectId}`);
    } catch (error) { console.error(error); alert("刪除失敗"); }
  };

  const restoreProject = async (projectId) => {
    try {
      const projectToRestore = projects.find(p => p.id === projectId);
      await updateDoc(doc(db, "projects", projectId), {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      });
      logAction('編輯', '案件資料', `從垃圾桶還原了案件: ${projectToRestore?.name || projectId}`);
    } catch (error) {
      console.error(error); alert("還原失敗");
    }
  };

  const hardDeleteProject = async (projectId) => {
    if (!confirm('⚠️ 警告：您即將「永久刪除」此案件！\n此動作絕對無法復原，請確認是否繼續？')) return;
    try {
      const projectToDelete = projects.find(p => p.id === projectId);
      await deleteDoc(doc(db, "projects", projectId));
      logAction('永久刪除', '案件資料', `徹底且永久刪除了案件: ${projectToDelete?.name || projectId}`);
    } catch (error) {
      console.error(error); alert("永久刪除失敗");
    }
  };

  const submitFeedback = async (e) => { e.preventDefault(); if (!newFeedback.trim()) return; try { await addDoc(collection(db, "feedbacks"), { content: newFeedback, createdAt: new Date().toISOString(), status: 'open' }); setNewFeedback(""); } catch (error) { console.error("Feedback Error:", error); alert("提交失敗"); } };
  const deleteFeedback = async (id) => { if (!confirm("確定移除？")) return; try { await deleteDoc(doc(db, "feedbacks", id)); } catch (error) { console.error("Delete Error:", error); } };

  const handleLogout = async () => {
    await logAction('登出', '系統存取', '登出系統');
    signOut(auth);
  };

  // ==========================================
  // Render 區塊
  // ==========================================

  if (!currentUser) {
    return (
      <Login onLogin={(email) => {
        logAction('登入', '系統存取', '成功登入系統', email);
      }} />
    );
  }

  if (showSummaryReport) return <div className="max-w-7xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans"><ProjectSummaryReport projects={activeProjects} onBack={() => setShowSummaryReport(false)} /></div>;
  
  if (activeProjectId) return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans">
      <div className="animate-fadeIn">
         <ProjectEditor 
           key={activeProjectId} 
           initialData={projects.find(p => p.id === activeProjectId)} 
           agencyDB={agencyDB}
           onSave={handleSaveProject} 
           onBack={() => setActiveProjectId(null)} 
         />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <div className="bg-gray-800 text-white p-3 px-6 flex justify-between items-center print:hidden shadow-md z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="font-bold text-sm tracking-wide">鼎龍資產管理系統</span>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-300">
               目前登入：<span className="text-white font-bold">{currentUser.email}</span>
               {isAdmin && <span className="ml-2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded text-[10px] font-black uppercase">管理員</span>}
             </span>
             <button 
                onClick={handleLogout} 
                className="bg-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition"
             >
                安全登出
             </button>
          </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12 flex-1 w-full relative">
        {errorMsg && <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-sm"><div className="flex items-center gap-2 mb-2 font-bold text-red-700 text-lg"><AlertCircle className="w-6 h-6"/> 無法存取資料庫</div><p className="text-sm text-red-600 mb-4 font-bold">{errorMsg}</p></div>}

        {isAdmin && showTrashBin && (
           <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowTrashBin(false)}>
             <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                   <h3 className="font-black text-xl text-gray-800 flex items-center gap-2"><Trash className="w-6 h-6 text-red-500"/> 資源回收桶 (已刪除案件)</h3>
                   <button onClick={() => setShowTrashBin(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6"/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                   {trashedProjects.length === 0 ? (
                      <div className="text-center text-gray-400 py-12 italic">目前垃圾桶是空的</div>
                   ) : (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0">
                          <tr><th className="p-3">案件名稱</th><th className="p-3">案場</th><th className="p-3">刪除時間</th><th className="p-3">刪除者</th><th className="p-3 text-center">操作</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {trashedProjects.map(p => (
                            <tr key={p.id} className="hover:bg-red-50 transition">
                              <td className="p-3 font-bold text-gray-700">{p.name}</td>
                              <td className="p-3 text-gray-500">{p.site}</td>
                              <td className="p-3 text-xs text-gray-400">{p.deletedAt ? new Date(p.deletedAt).toLocaleString() : ''}</td>
                              <td className="p-3 text-xs text-gray-400">{p.deletedBy}</td>
                              <td className="p-3 flex justify-center gap-2">
                                <button onClick={() => restoreProject(p.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200 flex items-center gap-1"><ArchiveRestore className="w-3 h-3"/> 還原</button>
                                <button onClick={() => hardDeleteProject(p.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200 flex items-center gap-1"><Trash2 className="w-3 h-3"/> 永久刪除</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   )}
                </div>
             </div>
           </div>
        )}

        {showAgencyManager && (
           <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAgencyManager(false)}>
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-black text-xl text-gray-800 flex items-center gap-2"><Users className="w-6 h-6"/> 仲介公司與經紀人管理</h3>
                   <button onClick={() => setShowAgencyManager(false)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronDown className="w-5 h-5"/></button>
                </div>
                
                <div className="flex gap-2 mb-6">
                   <input className="flex-1 p-3 border rounded-xl bg-gray-50 focus:bg-white transition outline-none font-bold" placeholder="輸入新仲介公司名稱..." value={newAgencyName} onChange={e => setNewAgencyName(e.target.value)} />
                   <button onClick={handleAddAgency} className="bg-blue-600 text-white px-6 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-1"><Plus className="w-4 h-4"/> 新增公司</button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                   {Object.keys(agencyDB).length === 0 && <div className="text-center text-gray-400 py-8 italic">尚無資料，請新增公司</div>}
                   {Object.keys(agencyDB).map(agency => (
                      <div key={agency} className="bg-white border-2 border-gray-100 p-4 rounded-xl shadow-sm hover:border-blue-100 transition group">
                         <div className="flex justify-between items-center mb-3">
                            <div className="font-black text-lg text-gray-700">{agency}</div>
                            <button onClick={() => handleDeleteAgency(agency)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition"><Trash2 className="w-4 h-4"/></button>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 mb-3">
                            {agencyDB[agency].map(bk => (
                               <span key={bk} className="text-xs bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 flex items-center gap-1 group/broker">
                                  {bk}
                                  <button onClick={() => handleDeleteBroker(agency, bk)} className="hover:text-red-500 ml-1"><X className="w-3 h-3"/></button>
                               </span>
                            ))}
                            {agencyDB[agency].length === 0 && <span className="text-xs text-gray-300 italic">無經紀人資料</span>}
                         </div>
                         
                         {targetAgencyForBroker === agency ? (
                            <div className="flex gap-2 animate-fadeIn">
                               <input className="flex-1 p-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="輸入經紀人姓名..." value={newBrokerName} onChange={e => setNewBrokerName(e.target.value)} autoFocus />
                               <button onClick={() => handleAddBroker(agency)} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-blue-700">儲存</button>
                               <button onClick={() => setTargetAgencyForBroker("")} className="bg-gray-100 text-gray-500 px-3 rounded-lg text-xs font-bold hover:bg-gray-200">取消</button>
                            </div>
                         ) : (
                            <button onClick={() => setTargetAgencyForBroker(agency)} className="w-full py-2 bg-gray-50 text-gray-400 rounded-lg text-xs font-bold border border-dashed border-gray-200 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 transition">+ 新增經紀人</button>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           </div>
        )}

        <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[60vh]">
            {isAdmin && (
                <div className="absolute top-0 right-0 flex gap-2">
                    <button onClick={() => setShowTrashBin(true)} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition shadow-sm">
                        <Trash className="w-4 h-4"/> 資源回收桶
                        {trashedProjects.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{trashedProjects.length}</span>}
                    </button>
                </div>
            )}

            <div className="text-center mb-12 mt-8 md:mt-0">
              <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 inline-flex mb-6"><LayoutGrid className="w-12 h-12 text-white" /></div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">多案場帳務管理系統</h1>
              <p className="text-gray-400 font-bold tracking-[0.3em] uppercase text-sm">Multi-Site Asset Management</p>
            </div>

            <div className="w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
               
               <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">步驟 1: 選擇案場 (Site)</label>
               <div className="relative mb-6">
                  <select 
                    className="w-full p-4 pl-12 pr-10 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold text-gray-800 appearance-none outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    value={activeSite}
                    onChange={handleSiteChange}
                  >
                    <option value="" disabled>-- 請選擇或新增案場 --</option>
                    {uniqueSites.map(site => <option key={site} value={site}>{site}</option>)}
                    {activeSite && !uniqueSites.includes(activeSite) && <option value={activeSite}>{activeSite} (新案場)</option>}
                    <option disabled>──────────</option>
                    <option value="__NEW_SITE__" className="text-blue-600 font-black">+ 新增案場...</option>
                  </select>
                  <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
               </div>

               <div className={`transition-all duration-500 ${activeSite ? 'opacity-100 max-h-[500px]' : 'opacity-50 max-h-0 overflow-hidden'}`}>
                  <div className="flex justify-between items-center mb-2 ml-1">
                     <label className="text-gray-500 text-xs font-bold uppercase tracking-widest">步驟 2: 選擇案件 (Project)</label>
                     <button onClick={createNewProject} className="text-blue-600 text-xs font-black flex items-center gap-1 hover:underline"><FolderPlus className="w-3 h-3"/> 建立新案件</button>
                  </div>
                  
                  <div className="border-2 border-blue-100 rounded-2xl bg-blue-50/30 overflow-hidden min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar">
                     {Object.keys(filteredGroupedProjects).length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">此案場尚無案件資料</div>
                     ) : (
                        Object.keys(filteredGroupedProjects).map(zone => (
                          <div key={zone} className="border-b border-blue-100 last:border-0">
                             <button onClick={() => toggleZone(zone)} className="w-full flex items-center justify-between p-3 bg-white hover:bg-blue-50 transition text-left">
                               <div className="flex items-center gap-2 font-bold text-gray-700"><Tag className="w-4 h-4 text-blue-500" />{zone} <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredGroupedProjects[zone].length}</span></div>
                               {expandedZones[zone] ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                             </button>
                             {expandedZones[zone] && (
                               <div className="bg-white/50">
                                 {filteredGroupedProjects[zone].map(p => (
                                   <div key={p.id} className="flex items-center justify-between p-3 pl-10 hover:bg-white border-t border-blue-50 group cursor-pointer" onClick={() => setActiveProjectId(p.id)}>
                                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 group-hover:text-blue-600"><Folder className="w-4 h-4 text-blue-300 group-hover:text-blue-500" />{p.name}</div>
                                      <button onClick={(e) => moveToTrash(e, p.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition opacity-0 group-hover:opacity-100" title="移至垃圾桶"><Trash2 className="w-4 h-4" /></button>
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        ))
                     )}
                  </div>
               </div>

               <div className="mt-6 flex gap-3">
                  <button onClick={() => setShowSummaryReport(true)} className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-black transition font-bold text-sm shadow-md"><PieChart className="w-4 h-4" /> 全區案件總表</button>
                  <button onClick={() => setShowAgencyManager(true)} className="flex justify-center items-center gap-2 px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition font-bold text-sm shadow-sm border border-blue-200"><Settings className="w-4 h-4" /> 仲介設定</button>
               </div>
            </div>
            
            <div className="w-full max-w-4xl mt-20 print:hidden">
              <div className="bg-yellow-50/80 border-2 border-yellow-200 rounded-[2rem] p-8 shadow-lg relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
                <h3 className="text-lg font-black text-yellow-800 mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5" /> 系統問題與需求回饋</h3>
                <form onSubmit={submitFeedback} className="flex gap-3 mb-6"><input type="text" placeholder="在此記錄系統問題或新功能需求..." className="flex-1 p-3 px-5 rounded-xl border-2 border-yellow-200 bg-white/80 focus:bg-white focus:outline-none focus:border-yellow-500 shadow-sm transition-all" value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)} /><button type="submit" className="bg-yellow-600 text-white px-5 rounded-xl hover:bg-yellow-700 transition font-bold flex items-center gap-2 shadow-md"><Send className="w-4 h-4" /> 記錄</button></form>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">{feedbacks.length > 0 ? feedbacks.map(item => (<div key={item.id} className="bg-white p-3 px-4 rounded-xl shadow-sm border border-yellow-100 flex justify-between items-center group hover:shadow-md transition"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></div><span className="text-gray-700 font-medium text-sm">{item.content}</span></div><div className="flex items-center gap-3"><span className="text-[10px] text-gray-300 font-mono hidden md:block">{new Date(item.createdAt).toLocaleDateString()}</span><button onClick={() => deleteFeedback(item.id)} className="text-gray-300 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-full transition"><CheckCircle2 className="w-4 h-4" /></button></div></div>)) : (<div className="text-center text-gray-400 py-2 text-sm italic">目前沒有待處理的問題，系統運作良好！ 👍</div>)}</div>
              </div>
            </div>

            {isAdmin && (
              <div className="w-full max-w-4xl mt-10 print:hidden">
                  <AuditLogView logs={auditLogs} onAcknowledge={handleAcknowledgeLog} />
              </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default App;
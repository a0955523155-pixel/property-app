import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, LayoutGrid, FolderPlus, 
  Trash2, CheckCircle2, MessageSquarePlus, Send, ChevronDown, ChevronRight, PieChart, Building2, Folder, Tag
} from 'lucide-react';

// --- 引入設定檔 ---
import { db, auth } from './config/firebase';

// --- 引入 Firestore 與 Auth ---
import { 
  collection, doc, updateDoc, addDoc, deleteDoc, 
  onSnapshot, query, orderBy 
} from "firebase/firestore";
import { 
  signInAnonymously, onAuthStateChanged 
} from "firebase/auth";

// 引入子元件
import ProjectEditor from './components/ProjectEditor';
import ProjectSummaryReport from './components/ProjectSummaryReport';

// --- CSS Styles ---
const APP_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1; 
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #ccc; 
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #aaa; 
  }
  
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

const App = () => {
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  
  // 頁面與選擇狀態
  const [activeSite, setActiveSite] = useState(""); 
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  
  // ✅ 新增：控制區域展開的狀態 (預設全部收合 = 空物件)
  const [expandedZones, setExpandedZones] = useState({});

  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 0. 注入樣式
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = APP_STYLES;
    document.head.appendChild(styleTag);
    return () => { if(document.head.contains(styleTag)){ document.head.removeChild(styleTag); } }
  }, []);

  // 1. 認證與監聽
  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); setErrorMsg(null); } catch (err) { console.error("Login Error:", err); setErrorMsg("登入失敗"); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore
  useEffect(() => {
    if (!user) return; 
    const q = query(collection(db, "projects"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
    }, (error) => { console.error("Firestore Error:", error); setErrorMsg("連線錯誤"); });
    return () => unsubscribe();
  }, [user]);

  // 3. 監聽回饋
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(feedbackData);
    });
    return () => unsubscribe();
  }, [user]);

  // --- 邏輯處理 ---
  const uniqueSites = useMemo(() => {
    const sites = projects.map(p => p.site || "大成工業城");
    const unique = [...new Set(sites)].sort();
    if (!unique.includes("大成工業城")) unique.unshift("大成工業城");
    return unique;
  }, [projects]);

  const filteredGroupedProjects = useMemo(() => {
    if (!activeSite) return {};
    const targetProjects = projects.filter(p => (p.site || "大成工業城") === activeSite);
    const groups = {};
    targetProjects.forEach(p => {
      const z = p.zone || "未分類";
      if (!groups[z]) groups[z] = [];
      groups[z].push(p);
    });
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
  }, [projects, activeSite]);

  const toggleZone = (zone) => {
    setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  const handleSiteChange = (e) => {
    const value = e.target.value;
    if (value === "__NEW_SITE__") {
      const newName = prompt("請輸入新案場名稱 (例如: 鳳山工業區):");
      if (newName && newName.trim()) setActiveSite(newName.trim());
    } else {
      setActiveSite(value);
    }
    setActiveProjectId(null);
    setExpandedZones({}); // 切換案場時，收合所有區域
  };

  // --- CRUD 操作 ---
  const handleSaveProject = async (updatedProject) => {
    if (!user) return; 
    try {
      const { id, ...data } = updatedProject;
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, { ...data, updatedAt: new Date().toISOString() });
    } catch (error) { console.error(error); alert("儲存失敗: " + error.message); }
  };

  const createNewProject = async () => {
    if (!user) { alert("請稍候，正在連線資料庫..."); return; }
    const targetSite = activeSite || "大成工業城";
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: "新案件 " + new Date().toLocaleDateString(),
        site: targetSite,
        zone: "未分類",
        updatedAt: new Date().toISOString(),
        transactions: [], buyers: [], lands: [], buildings: []
      });
      setActiveSite(targetSite);
      setActiveProjectId(docRef.id);
    } catch (error) { console.error(error); alert("建立失敗: " + error.message); }
  };

  // ✅ 刪除案件功能
  const deleteProject = async (e, projectId) => {
    e.stopPropagation(); // 防止觸發點擊案件進入編輯
    if (!confirm('確定要永久刪除此案件嗎？此動作無法復原。')) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      if (activeProjectId === projectId) setActiveProjectId(null);
    } catch (error) { console.error(error); alert("刪除失敗"); }
  };

  const submitFeedback = async (e) => { e.preventDefault(); if (!newFeedback.trim()) return; try { await addDoc(collection(db, "feedbacks"), { content: newFeedback, createdAt: new Date().toISOString(), status: 'open' }); setNewFeedback(""); } catch (error) { console.error("Feedback Error:", error); alert("提交失敗"); } };
  const deleteFeedback = async (id) => { if (!confirm("確定移除？")) return; try { await deleteDoc(doc(db, "feedbacks", id)); } catch (error) { console.error("Delete Error:", error); } };

  // --- Render ---
  if (showSummaryReport) return <div className="max-w-7xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans"><ProjectSummaryReport projects={projects} onBack={() => setShowSummaryReport(false)} /></div>;
  if (activeProjectId) return <div className="max-w-6xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans"><div className="animate-fadeIn"><ProjectEditor key={activeProjectId} initialData={projects.find(p => p.id === activeProjectId)} onSave={handleSaveProject} onBack={() => setActiveProjectId(null)} /></div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans">
      {errorMsg && <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-sm"><div className="flex items-center gap-2 mb-2 font-bold text-red-700 text-lg"><AlertCircle className="w-6 h-6"/> 無法存取資料庫</div><p className="text-sm text-red-600 mb-4 font-bold">{errorMsg}</p></div>}

      <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[80vh]">
          <div className="text-center mb-12">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 inline-flex mb-6"><LayoutGrid className="w-12 h-12 text-white" /></div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">多案場帳務管理系統</h1>
            <p className="text-gray-400 font-bold tracking-[0.3em] uppercase text-sm">Multi-Site Asset Management</p>
          </div>

          <div className="w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
             
             {/* 步驟 1: 選擇大案場 */}
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

             {/* 步驟 2: 選擇案件 (✅ 改為手風琴列表) */}
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
                           {/* 區域標題 (點擊展開/收合) */}
                           <button 
                             onClick={() => toggleZone(zone)}
                             className="w-full flex items-center justify-between p-3 bg-white hover:bg-blue-50 transition text-left"
                           >
                             <div className="flex items-center gap-2 font-bold text-gray-700">
                               <Tag className="w-4 h-4 text-blue-500" />
                               {zone} 
                               <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredGroupedProjects[zone].length}</span>
                             </div>
                             {expandedZones[zone] ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                           </button>

                           {/* 案件列表 (預設收合) */}
                           {expandedZones[zone] && (
                             <div className="bg-white/50">
                               {filteredGroupedProjects[zone].map(p => (
                                 <div key={p.id} className="flex items-center justify-between p-3 pl-10 hover:bg-white border-t border-blue-50 group cursor-pointer" onClick={() => setActiveProjectId(p.id)}>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 group-hover:text-blue-600">
                                       <Folder className="w-4 h-4 text-blue-300 group-hover:text-blue-500" />
                                       {p.name}
                                    </div>
                                    {/* ✅ 刪除按鈕 */}
                                    <button 
                                      onClick={(e) => deleteProject(e, p.id)} 
                                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition opacity-0 group-hover:opacity-100"
                                      title="刪除此案件"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
             </div>
          </div>

          {/* 問題回饋區 (略) */}
          <div className="w-full max-w-4xl mt-20">
            <div className="bg-yellow-50/80 border-2 border-yellow-200 rounded-[2rem] p-8 shadow-lg relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
              <h3 className="text-lg font-black text-yellow-800 mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5" /> 系統問題與需求回饋</h3>
              <form onSubmit={submitFeedback} className="flex gap-3 mb-6"><input type="text" placeholder="在此記錄系統問題或新功能需求..." className="flex-1 p-3 px-5 rounded-xl border-2 border-yellow-200 bg-white/80 focus:bg-white focus:outline-none focus:border-yellow-500 shadow-sm transition-all" value={newFeedback} onChange={(e) => setNewFeedback(e.target.value)} /><button type="submit" className="bg-yellow-600 text-white px-5 rounded-xl hover:bg-yellow-700 transition font-bold flex items-center gap-2 shadow-md"><Send className="w-4 h-4" /> 記錄</button></form>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">{feedbacks.length > 0 ? feedbacks.map(item => (<div key={item.id} className="bg-white p-3 px-4 rounded-xl shadow-sm border border-yellow-100 flex justify-between items-center group hover:shadow-md transition"><div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></div><span className="text-gray-700 font-medium text-sm">{item.content}</span></div><div className="flex items-center gap-3"><span className="text-[10px] text-gray-300 font-mono hidden md:block">{new Date(item.createdAt).toLocaleDateString()}</span><button onClick={() => deleteFeedback(item.id)} className="text-gray-300 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-full transition"><CheckCircle2 className="w-4 h-4" /></button></div></div>)) : (<div className="text-center text-gray-400 py-2 text-sm italic">目前沒有待處理的問題，系統運作良好！ 👍</div>)}</div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default App;
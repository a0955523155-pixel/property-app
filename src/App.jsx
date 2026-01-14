import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, LayoutGrid, FolderPlus, 
  Trash2, CheckCircle2, MessageSquarePlus, Send, ChevronDown, FolderOpen
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

// --- CSS Styles (包含列印設定) ---
const APP_STYLES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* --- 列印專用樣式 (PDF Export Settings) --- */
  @media print {
    @page { 
      size: A4 portrait; /* 直式 */
      margin: 10mm; 
    }
    body, #root, .app-wrapper {
      background-color: white !important;
      height: auto !important;
      overflow: visible !important;
      font-size: 10pt !important;
    }
    .print\\:hidden { display: none !important; }
    .print\\:block { display: block !important; }
    .print\\:p-8 { padding: 0 !important; }
    
    table { 
      width: 100% !important; 
      border-collapse: collapse !important; 
      margin-bottom: 20px !important; 
      table-layout: fixed;
    }
    th, td { 
      border: 1px solid #000 !important; 
      padding: 4px 6px !important; 
      text-align: left; 
      font-size: 9pt !important;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    /* 欄位寬度微調 */
    th:nth-child(1) { width: 15%; }
    th:nth-child(2) { width: 15%; }
    
    thead { display: table-header-group; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .no-scrollbar { overflow: visible !important; }
    * { box-shadow: none !important; text-shadow: none !important; }
  }
`;

const App = () => {
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 0. 注入樣式
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = APP_STYLES;
    document.head.appendChild(styleTag);
    return () => {
      if(document.head.contains(styleTag)){
        document.head.removeChild(styleTag);
      }
    }
  }, []);

  // 1. 認證流程
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        setErrorMsg(null);
      } catch (err) {
        console.error("Login Error:", err);
        setErrorMsg("登入失敗：請至 Authentication 啟用 'Anonymous'。");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. 監聽 Firestore (專案 - ✅ 改為按名稱 A-Z 排序)
  useEffect(() => {
    if (!user) return; 
    // orderBy("name", "asc") 實現 A 到 Z 排序
    const q = query(collection(db, "projects"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
      setErrorMsg(null);
    }, (error) => {
       console.error("Firestore Error:", error);
       if (error.code === 'permission-denied') setErrorMsg("權限不足：請至 Rules 修改為 'allow read, write: if true;'");
       else setErrorMsg(`連線錯誤: ${error.message}`);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. 監聽 Firestore (回饋)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(feedbackData);
    });
    return () => unsubscribe();
  }, [user]);

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
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: "新案場 " + new Date().toLocaleDateString(),
        updatedAt: new Date().toISOString(),
        transactions: [], buyers: [], lands: [], buildings: []
      });
      setActiveProjectId(docRef.id);
    } catch (error) { console.error(error); alert("建立失敗: " + error.message); }
  };

  const deleteProject = async () => {
    if (!activeProjectId || !user) return;
    if(!confirm('確定刪除此案場？此動作不可撤銷。')) return;
    try {
      await deleteDoc(doc(db, "projects", activeProjectId));
      setActiveProjectId(null); // 刪除後返回首頁
    } catch (error) { console.error(error); alert("刪除失敗"); }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    if (!user) return alert("請稍候資料庫連線...");
    try {
      await addDoc(collection(db, "feedbacks"), {
        content: newFeedback,
        createdAt: new Date().toISOString(),
        status: 'open'
      });
      setNewFeedback("");
    } catch (error) {
      console.error("Feedback Error:", error);
      alert("提交失敗");
    }
  };

  const deleteFeedback = async (id) => {
    if (!confirm("確定已修復此問題並移除？")) return;
    try {
      await deleteDoc(doc(db, "feedbacks"), id);
    } catch (error) {
      console.error("Delete Feedback Error:", error);
    }
  };

  // ✅ 已移除右上角資料庫連線與診斷按鈕

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 bg-gray-50 min-h-screen font-sans">
      {/* 錯誤訊息 */}
      {errorMsg && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-red-700 text-lg"><AlertCircle className="w-6 h-6"/> 無法存取資料庫</div>
          <p className="text-sm text-red-600 mb-4 font-bold">{errorMsg}</p>
        </div>
      )}

      {/* 主路由切換 */}
      {activeProjectId ? (
        <div className="animate-fadeIn">
           {/* 在專案編輯模式下，我們仍然傳入刪除功能，但通常刪除是在列表頁做，這裡僅供參考或保留結構 */}
           <ProjectEditor 
             key={activeProjectId} 
             initialData={projects.find(p => p.id === activeProjectId)} 
             onSave={handleSaveProject} 
             onBack={() => setActiveProjectId(null)} 
           />
           {/* 如果需要在編輯頁刪除，可在此處添加按鈕，但通常不建議在編輯中刪除 */}
        </div>
      ) : (
        <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[80vh]">
          {/* 1. 系統標題與 Logo */}
          <div className="text-center mb-12">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-200 inline-flex mb-6">
              <LayoutGrid className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
              大成工業城帳務系統
            </h1>
            <p className="text-gray-400 font-bold tracking-[0.3em] uppercase text-sm">Dacheng Industrial City Accounting</p>
          </div>

          {/* 2. 案件選單區塊 (核心修改) */}
          <div className="w-full max-w-lg bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
             
             <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 ml-1">
               選擇案件以開始管理 (Select Project)
             </label>

             <div className="relative">
               <select 
                 className="w-full p-5 pl-12 pr-10 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-bold text-gray-800 appearance-none outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer shadow-inner"
                 onChange={(e) => {
                    if(e.target.value === "new") {
                        createNewProject();
                    } else if (e.target.value) {
                        setActiveProjectId(e.target.value);
                    }
                 }}
                 defaultValue=""
               >
                 <option value="" disabled>請選擇現有案件...</option>
                 {projects.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
                 <option value="" disabled>──────────</option>
                 <option value="new" className="text-blue-600 font-bold">+ 建立新案件</option>
               </select>
               <FolderOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
               <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
             </div>

             <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-gray-400">
                <span>目前共有 <span className="text-blue-600 font-black">{projects.length}</span> 筆案件資料</span>
                
                {/* 獨立的新增按鈕 (備用) */}
                <button 
                  onClick={createNewProject}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition font-bold text-xs"
                >
                  <FolderPlus className="w-4 h-4" /> 快速建立
                </button>
             </div>
          </div>

          {/* 3. 問題回饋 (Issue Tracker) */}
          <div className="w-full max-w-4xl mt-20">
            <div className="bg-yellow-50/80 border-2 border-yellow-200 rounded-[2rem] p-8 shadow-lg relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
              
              <h3 className="text-lg font-black text-yellow-800 mb-6 flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5" /> 系統問題與需求回饋 (Developer Notes)
              </h3>
              
              <form onSubmit={submitFeedback} className="flex gap-3 mb-6">
                <input 
                  type="text" 
                  placeholder="在此記錄系統問題或新功能需求 (Bug / Feature Request)..." 
                  className="flex-1 p-3 px-5 rounded-xl border-2 border-yellow-200 bg-white/80 focus:bg-white focus:outline-none focus:border-yellow-500 shadow-sm transition-all"
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                />
                <button type="submit" className="bg-yellow-600 text-white px-5 rounded-xl hover:bg-yellow-700 transition font-bold flex items-center gap-2 shadow-md">
                  <Send className="w-4 h-4" /> 記錄
                </button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {feedbacks.length > 0 ? feedbacks.map(item => (
                  <div key={item.id} className="bg-white p-3 px-4 rounded-xl shadow-sm border border-yellow-100 flex justify-between items-center group hover:shadow-md transition">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></div>
                      <span className="text-gray-700 font-medium text-sm">{item.content}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] text-gray-300 font-mono hidden md:block">{new Date(item.createdAt).toLocaleDateString()}</span>
                       <button 
                        onClick={() => deleteFeedback(item.id)} 
                        className="text-gray-300 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-full transition"
                        title="標記為已修復/移除"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-2 text-sm italic">
                    目前沒有待處理的問題，系統運作良好！ 👍
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default App;
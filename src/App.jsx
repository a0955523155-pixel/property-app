import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, Wrench, AlertCircle, LayoutGrid, FolderPlus, 
  Home, Trash2, Calendar, CheckCircle2, XCircle, MessageSquarePlus, Send
} from 'lucide-react';

// --- 引入設定檔 ---
import { db, auth } from './config/firebase';

// --- 引入 Firestore 與 Auth ---
import { 
  collection, doc, updateDoc, addDoc, deleteDoc, 
  onSnapshot, query, orderBy, serverTimestamp 
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
      size: A4 portrait; /* ✅ 改為直式 */
      margin: 10mm; 
    }
    body, #root, .app-wrapper {
      background-color: white !important;
      height: auto !important;
      overflow: visible !important;
      font-size: 10pt !important;
    }
    /* 強制隱藏互動元素 */
    .print\\:hidden { display: none !important; }
    /* 強制顯示列印報表 */
    .print\\:block { display: block !important; }
    .print\\:p-8 { padding: 0 !important; }
    
    /* 表格樣式優化 (直向時特別重要，防止表格過寬) */
    table { 
      width: 100% !important; 
      border-collapse: collapse !important; 
      margin-bottom: 20px !important; 
      table-layout: fixed; /* ✅ 強制固定寬度，避免撐破頁面 */
    }
    th, td { 
      border: 1px solid #000 !important; 
      padding: 4px 6px !important; 
      text-align: left; 
      font-size: 9pt !important; /* ✅ 字體微調，讓直向能塞入更多內容 */
      word-wrap: break-word; /* ✅ 長文字自動換行 */
      overflow-wrap: break-word;
    }
    /* 針對不同欄位設定寬度比例，避免建照號碼或地址擠壓 */
    th:nth-child(1) { width: 15%; } /* 姓名/出售人 */
    th:nth-child(2) { width: 15%; } /* 電話/建照 */
    
    thead { display: table-header-group; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    
    /* 隱藏捲軸與陰影 */
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
  const [testResult, setTestResult] = useState(null);

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

  // 2. 監聽 Firestore (專案)
  useEffect(() => {
    if (!user) return; 
    const q = query(collection(db, "projects"), orderBy("updatedAt", "desc"));
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

  const deleteProject = async (projectId) => {
    if (!user) return;
    if(!confirm('確定刪除此案場？此動作不可撤銷。')) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      if (activeProjectId === projectId) setActiveProjectId(null);
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

  const runDiagnostics = async () => {
    setTestResult({ status: 'loading', msg: '測試寫入中...' });
    if (!user) {
      setTestResult({ status: 'error', msg: '使用者尚未登入' });
      return;
    }
    try {
      const testRef = await addDoc(collection(db, "_connection_test"), {
        timestamp: serverTimestamp(),
        test: "write_check"
      });
      await deleteDoc(testRef);
      setTestResult({ status: 'success', msg: '測試成功：資料庫讀寫正常！' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (err) {
      setTestResult({ status: 'error', msg: err.message });
    }
  };

  const getProjectSummary = (project) => {
    const income = (project.transactions || []).filter(t => t.type === 'income').reduce((acc, c) => acc + Number(c.amount), 0);
    const expense = (project.transactions || []).filter(t => t.type === 'expense').reduce((acc, c) => acc + Number(c.amount), 0);
    return { income, expense, profit: income - expense };
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 bg-gray-50 min-h-screen font-sans">
      {/* 狀態列 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 ${user && !errorMsg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {user && !errorMsg ? <><Wifi className="w-3 h-3" /> 資料庫已連線</> : <><WifiOff className="w-3 h-3" /> {errorMsg || "連線中..."}</>}
        </div>
        <button onClick={runDiagnostics} className="px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-black transition">
          <Wrench className="w-3 h-3" /> 測試資料庫連線
        </button>
        {testResult && (
          <div className={`mt-2 p-4 rounded-xl shadow-xl border-l-4 w-64 animate-fadeIn bg-white ${testResult.status === 'success' ? 'border-green-500' : 'border-red-500'}`}>
            <div className={`text-xs font-black uppercase mb-1 flex items-center gap-1 ${testResult.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.status === 'success' ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
              {testResult.status === 'success' ? '測試通過' : '測試失敗'}
            </div>
            <p className="text-xs text-gray-600">{testResult.msg}</p>
          </div>
        )}
      </div>

      {/* 錯誤訊息 */}
      {errorMsg && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-2 font-bold text-red-700 text-lg"><AlertCircle className="w-6 h-6"/> 無法存取資料庫</div>
          <p className="text-sm text-red-600 mb-4 font-bold">{errorMsg}</p>
        </div>
      )}

      {/* 主路由切換 */}
      {activeProjectId ? (
        <ProjectEditor 
          key={activeProjectId} 
          initialData={projects.find(p => p.id === activeProjectId)} 
          onSave={handleSaveProject} 
          onBack={() => setActiveProjectId(null)} 
        />
      ) : (
        <div className="animate-fadeIn">
          {/* 專案列表標題 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200"><LayoutGrid className="w-10 h-10 text-white" /></div>
                資產管理系統 (Cloud)
              </h1>
              <p className="text-gray-400 mt-4 font-bold tracking-[0.3em] uppercase ml-16">Yandefa Asset Management</p>
            </div>
            <button onClick={createNewProject} className="flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-[2rem] hover:bg-blue-700 shadow-2xl transition-all transform hover:-translate-y-2 font-black tracking-widest uppercase">
              <FolderPlus className="w-6 h-6" /> 建立新案場
            </button>
          </div>

          {/* 專案卡片網格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-16">
            {projects.length > 0 ? projects.map(project => {
              const summary = getProjectSummary(project);
              return (
                <div key={project.id} onClick={() => setActiveProjectId(project.id)} className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 cursor-pointer hover:shadow-2xl hover:border-blue-200 transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] transition-all group-hover:bg-blue-600 group-hover:scale-110 -z-10 opacity-50" />
                  <div className="flex justify-between items-start mb-10">
                    <div className="bg-blue-50 p-5 rounded-3xl group-hover:bg-white transition-colors duration-500 shadow-sm">
                      <Home className="w-10 h-10 text-blue-600 group-hover:text-white" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="text-gray-200 hover:text-red-500 transition-all p-3 rounded-full hover:bg-red-50"><Trash2 className="w-6 h-6" /></button>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-3 line-clamp-2 min-h-[4.5rem] leading-tight">{project.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-12">
                    <Calendar className="w-4 h-4" /> 更新日期: {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-auto pt-8 border-t border-gray-50 grid grid-cols-2 gap-6">
                    <div><div className="text-[10px] text-gray-400 font-black uppercase mb-2">案場成本</div><div className="font-mono font-black text-gray-700 text-lg">${summary.expense.toLocaleString()}</div></div>
                    <div><div className="text-[10px] text-gray-400 font-black uppercase mb-2">目前盈虧</div><div className={`font-mono font-black text-lg ${summary.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>${summary.profit.toLocaleString()}</div></div>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-20 text-gray-400 font-bold bg-gray-100 rounded-[3rem] border-2 border-dashed border-gray-300">
                {user ? "目前資料庫中無案場資料，請點擊上方按鈕建立。" : "正在連接安全資料庫..."}
              </div>
            )}
          </div>

          {/* 問題回饋區塊 */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-[2rem] p-8 max-w-4xl mx-auto shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-200 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
            
            <h3 className="text-xl font-black text-yellow-800 mb-6 flex items-center gap-2">
              <MessageSquarePlus className="w-6 h-6" /> 系統問題與需求回饋 (Developer Notes)
            </h3>
            
            <form onSubmit={submitFeedback} className="flex gap-4 mb-8">
              <input 
                type="text" 
                placeholder="在此記錄系統問題或新功能需求 (Bug / Feature Request)..." 
                className="flex-1 p-4 rounded-xl border-2 border-yellow-200 bg-white focus:outline-none focus:border-yellow-500 shadow-sm"
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
              />
              <button type="submit" className="bg-yellow-600 text-white px-6 rounded-xl hover:bg-yellow-700 transition font-bold flex items-center gap-2 shadow-lg">
                <Send className="w-4 h-4" /> 記錄
              </button>
            </form>

            <div className="space-y-3">
              {feedbacks.length > 0 ? feedbacks.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex justify-between items-center group hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-yellow-400 shrink-0"></div>
                    <div>
                      <p className="text-gray-800 font-medium">{item.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteFeedback(item.id)} 
                    className="text-gray-300 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition flex items-center gap-2"
                    title="標記為已修復/移除"
                  >
                    <span className="text-xs font-bold hidden group-hover:inline">已修復</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-4 italic">
                  目前沒有待處理的問題，系統運作良好！ 👍
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default App;
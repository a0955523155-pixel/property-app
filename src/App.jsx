import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, Wrench, AlertCircle, LayoutGrid, FolderPlus, 
  Home, Trash2, Calendar, CheckCircle2, XCircle 
} from 'lucide-react';

// --- 引入設定檔 ---
import { db, auth } from './config/firebase';

// --- ✅ 修正區塊：正確分開引入 Firestore 與 Auth ---

// 1. 從 firestore 引入資料庫功能
import { 
  collection, doc, updateDoc, addDoc, deleteDoc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";

// 2. 從 auth 引入驗證功能 (這裡才是正確的位置)
import { 
  signInAnonymously, onAuthStateChanged 
} from "firebase/auth";

// 引入子元件
import ProjectEditor from './components/ProjectEditor';

const App = () => {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // 0. 認證流程
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

  // 1. 監聽 Firestore
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

  // 2. CRUD 操作
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
        </div>
      )}
    </div>
  );
};

export default App;
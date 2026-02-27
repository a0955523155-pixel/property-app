import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
// ✅ 引入 Firebase 的登入語法與設定
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // ✅ 呼叫 Firebase 進行真實的驗證
      await signInWithEmailAndPassword(auth, email, password);
      // 注意：這裡不需要再呼叫 onLogin，因為 App.jsx 會自動監聽到登入成功
    } catch (err) {
      console.error('登入錯誤:', err);
      setError('帳號或密碼錯誤，或是您沒有權限進入系統。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-800 p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-2xl font-black text-white tracking-widest">鼎龍資產管理系統</h1>
          <p className="text-gray-400 text-sm mt-2">財務與專案機密資料庫</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">登入信箱 (Email)</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition"
                placeholder="請輸入公司配發的信箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">登入密碼</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="password" 
                required
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gray-800 text-white font-bold text-lg py-4 rounded-xl hover:bg-black transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoading ? '驗證中...' : '安全登入'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
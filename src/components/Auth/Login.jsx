import React, { useState } from 'react';
import { Lock, User, ShieldAlert } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // 目前寫死您指定的帳號密碼，後續可擴充連線到資料庫
    if (account === 'zxcvbnm7780' && password === 'p3926667') {
      onLogin(account);
    } else {
      setError('帳號或密碼錯誤，請重新輸入。');
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
            <label className="block text-sm font-bold text-gray-700 mb-2">登入帳號</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition"
                placeholder="請輸入帳號"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">登入密碼</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="password" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-800 outline-none transition"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-gray-800 text-white font-bold text-lg py-4 rounded-xl hover:bg-black transition-colors shadow-lg"
          >
            安全登入
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
// src/components/LinkedLedger.jsx
import React, { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { CATEGORIES } from '../utils/helpers';

const LinkedLedger = ({ linkedId, linkedType, transactions, onSaveTransaction }) => {
  const relatedTxs = transactions.filter(t => t.linkedId === linkedId && t.linkedType === linkedType);
  const [isAdding, setIsAdding] = useState(false);
  const [localTx, setLocalTx] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: CATEGORIES.expense[0],
    amount: '',
    note: ''
  });

  const handleSave = () => {
    if (!localTx.amount) return;
    onSaveTransaction({
      ...localTx,
      linkedId,
      linkedType,
      id: Date.now() // 臨時 ID，實際儲存會由父層處理
    });
    setLocalTx({ ...localTx, amount: '', note: '' });
    setIsAdding(false);
  };

  return (
    <div className="mt-6 border-t pt-6 bg-gray-50/50 p-6 rounded-xl print:hidden">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-sm font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider"><LinkIcon className="w-4 h-4" /> 此標的收支紀錄</h5>
        <button onClick={() => setIsAdding(!isAdding)} className="text-xs font-bold text-blue-600 bg-blue-100 px-4 py-2 rounded-full hover:bg-blue-200 transition">
          {isAdding ? "關閉" : "＋ 新增帳目"}
        </button>
      </div>
      {isAdding && (
        <div className="bg-white p-4 border rounded shadow-sm mb-4 animate-fadeIn">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="date" className="p-2 border rounded text-sm" value={localTx.date} onChange={e => setLocalTx({...localTx, date: e.target.value})} />
            <select className="p-2 border rounded text-sm" value={localTx.type} onChange={e => setLocalTx({...localTx, type: e.target.value, category: CATEGORIES[e.target.value][0]})}>
              <option value="expense">支出</option><option value="income">收入</option>
            </select>
            <select className="p-2 border rounded text-sm" value={localTx.category} onChange={e => setLocalTx({...localTx, category: e.target.value})}>
              {CATEGORIES[localTx.type].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="金額" className="p-2 border rounded text-sm" value={localTx.amount} onChange={e => setLocalTx({...localTx, amount: e.target.value})} />
          </div>
          <input placeholder="說明..." className="w-full p-2 border rounded text-sm mb-3" value={localTx.note} onChange={e => setLocalTx({...localTx, note: e.target.value})} />
          <button onClick={handleSave} className="w-full bg-blue-600 text-white text-sm py-2 rounded font-bold">儲存紀錄</button>
        </div>
      )}
      <div className="space-y-2">
        {relatedTxs.length > 0 ? relatedTxs.map(t => (
          <div key={t.id} className="flex justify-between items-center text-sm p-3 bg-white border rounded">
            <span className="text-gray-400 w-24">{t.date}</span>
            <span className="flex-1 px-4 text-gray-700 font-medium">{t.note} <span className="text-xs text-gray-400">({t.category})</span></span>
            <span className={`font-mono font-bold ${t.type==='income'?'text-green-600':'text-red-600'}`}>
              {t.type==='income'?'+':'-'}${Number(t.amount).toLocaleString()}
            </span>
          </div>
        )) : <div className="text-xs text-gray-400 italic text-center py-2">目前尚無收支紀錄</div>}
      </div>
    </div>
  );
};

export default LinkedLedger;
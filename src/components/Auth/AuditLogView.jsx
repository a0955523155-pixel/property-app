import React from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AuditLogView = ({ logs, onAcknowledge }) => {
  // 過濾出「未確認」且屬於「高風險動作」的紀錄
  const criticalAlerts = logs.filter(log => 
    ['列印', '刪除', '截圖'].includes(log.action) && !log.acknowledged
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn mb-8">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-6 border-l-4 border-gray-800 pl-4">
        <Activity className="w-6 h-6 text-gray-600"/> 系統使用紀錄 (Audit Log)
      </h2>
      
      {/* 🚨 敏感操作警戒區 (置頂顯示) */}
      {criticalAlerts.length > 0 && (
        <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-sm animate-fadeIn">
          <h3 className="text-red-700 font-black mb-4 flex items-center gap-2 text-lg">
            <AlertTriangle className="w-6 h-6"/> 高風險操作警報 (待確認)
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="flex flex-col md:flex-row justify-between md:items-center bg-white p-4 rounded-xl border border-red-100 shadow-sm gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-black">{alert.action}</span>
                    <span className="text-sm font-bold text-gray-800">{alert.user}</span>
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1"><Clock className="w-3 h-3"/> {alert.time}</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{alert.details}</div>
                </div>
                <button 
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 shadow-md transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4"/> 確認沒問題
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 歷史紀錄總表 */}
      <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-widest">歷史紀錄清單</h3>
      <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-xl custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 sticky top-0 shadow-sm">
            <tr>
              <th className="p-4 w-48"><Clock className="w-4 h-4 inline mr-1"/>時間</th>
              <th className="p-4 w-32">使用者</th>
              <th className="p-4 w-24">動作</th>
              <th className="p-4 w-32">模組</th>
              <th className="p-4">詳細內容</th>
              <th className="p-4 w-24 text-center">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400 italic">尚無操作紀錄</td></tr>
            ) : (
              logs.map(log => {
                const isCritical = ['列印', '刪除', '截圖'].includes(log.action);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">{log.time}</td>
                    <td className="p-4 font-bold text-blue-600">{log.user}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${log.action === '刪除' ? 'bg-red-100 text-red-700' : 
                          log.action === '列印' || log.action === '截圖' ? 'bg-orange-100 text-orange-700' : 
                          'bg-green-100 text-green-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-600">{log.module}</td>
                    <td className="p-4 text-gray-700">{log.details}</td>
                    <td className="p-4 text-center">
                      {isCritical ? (
                        log.acknowledged ? 
                          <span className="text-green-600 text-xs font-bold flex justify-center items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 已確認</span> : 
                          <span className="text-red-500 text-xs font-bold animate-pulse">待確認</span>
                      ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogView;
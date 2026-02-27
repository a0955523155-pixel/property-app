import React from 'react';
import { Activity, Clock } from 'lucide-react';

const AuditLogView = ({ logs }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 animate-fadeIn mb-8">
      <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-6 border-l-4 border-gray-800 pl-4">
        <Activity className="w-6 h-6 text-gray-600"/> 系統使用紀錄 (Audit Log)
      </h2>
      
      <div className="max-h-96 overflow-y-auto border rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 sticky top-0">
            <tr>
              <th className="p-3 w-48"><Clock className="w-4 h-4 inline mr-1"/>時間</th>
              <th className="p-3 w-32">使用者</th>
              <th className="p-3 w-24">動作</th>
              <th className="p-3 w-32">模組</th>
              <th className="p-3">詳細內容</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-gray-400">尚無操作紀錄</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{log.time}</td>
                  <td className="p-3 font-bold text-blue-600">{log.user}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${log.action === '刪除' ? 'bg-red-100 text-red-700' : 
                        log.action === '列印' || log.action === '截圖' ? 'bg-orange-100 text-orange-700' : 
                        'bg-green-100 text-green-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-gray-600">{log.module}</td>
                  <td className="p-3 text-gray-700">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogView;
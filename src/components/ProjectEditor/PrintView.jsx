import React from 'react';
import { toROCDate, toPing } from '../../utils/helpers';

const PrintView = ({ 
  projectName, printConfig, projectTeams, landGrandTotal, 
  buyers, sortedBuyers, lands, visibleLandIds, 
  buildings, sortedBuildings, handoverData, 
  allLotNumbers, allBuildingInfo, 
  visibleLedgers, groupedTransactions, stats, 
  requisitions, groupedRequisitions 
}) => {
  return (
    <div className="hidden print:block print:p-8 text-sm font-serif text-gray-900">
        <h1 className="text-3xl font-black mb-2 text-gray-800">專案管理報表: {projectName}</h1>
        <p className="text-sm text-gray-500 mb-8 border-b-2 border-gray-800 pb-2">列印日期: {toROCDate(new Date())}</p>
        
        {/* Page 1: 團隊 & 買受人 */}
        <div className="print-section">
           {printConfig.team && (
             <section className="mb-8 break-inside-avoid">
               <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">專案團隊資訊</h2>
               <table className="w-full border-collapse border border-gray-400 mb-4">
                 <thead>
                   <tr className="bg-gray-100 print:bg-gray-200">
                     <th className="border border-gray-400 p-2 whitespace-nowrap">歸屬戶號</th>
                     <th className="border border-gray-400 p-2 whitespace-nowrap">仲介公司</th>
                     <th className="border border-gray-400 p-2 whitespace-nowrap">經紀人</th>
                     <th className="border border-gray-400 p-2 whitespace-nowrap">開發業務</th>
                     <th className="border border-gray-400 p-2 whitespace-nowrap">行銷業務</th>
                     <th className="border border-gray-400 p-2 whitespace-nowrap">代書</th>
                   </tr>
                 </thead>
                 <tbody>
                   {projectTeams.map(t => (
                     <tr key={t.id}>
                       <td className="border border-gray-400 p-2 whitespace-nowrap text-center font-bold">{t.unit}</td>
                       <td className="border border-gray-400 p-2 whitespace-nowrap">{t.agency}</td>
                       <td className="border border-gray-400 p-2 whitespace-nowrap">{t.broker}</td>
                       <td className="border border-gray-400 p-2 whitespace-nowrap">{t.developer}</td>
                       <td className="border border-gray-400 p-2 whitespace-nowrap">{t.marketer}</td>
                       <td className="border border-gray-400 p-2 whitespace-nowrap">{t.scrivener}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </section>
           )}
           
           {printConfig.buyers && (
             <section className="mb-8 break-inside-avoid">
               <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">買受人資訊</h2>
               {buyers.length > 0 ? (
                 <table className="w-full border-collapse border border-gray-400">
                   <thead>
                     <tr className="bg-gray-100 print:bg-gray-200">
                       <th className="border border-gray-400 p-2 w-16 whitespace-nowrap">戶號</th>
                       <th className="border border-gray-400 p-2 w-24 whitespace-nowrap">姓名</th>
                       <th className="border border-gray-400 p-2 w-32 whitespace-nowrap">電話</th>
                       <th className="border border-gray-400 p-2 whitespace-nowrap">地址</th>
                       <th className="border border-gray-400 p-2 w-24 text-right whitespace-nowrap">土地合約價</th>
                       <th className="border border-gray-400 p-2 w-24 text-right whitespace-nowrap">建物合約價</th>
                       <th className="border border-gray-400 p-2 w-28 text-right whitespace-nowrap">合約總價</th>
                     </tr>
                   </thead>
                   <tbody>
                     {sortedBuyers.map(b => (
                       <tr key={b.id}>
                         <td className="border border-gray-400 p-2 text-center font-bold whitespace-nowrap">{b.unit}</td>
                         <td className="border border-gray-400 p-2 whitespace-nowrap">{b.name}</td>
                         <td className="border border-gray-400 p-2 whitespace-nowrap">{b.phone}</td>
                         <td className="border border-gray-400 p-2 text-xs whitespace-nowrap">{b.address}</td>
                         <td className="border border-gray-400 p-2 text-right text-gray-600 whitespace-nowrap">${Number(b.landPrice).toLocaleString()}</td>
                         <td className="border border-gray-400 p-2 text-right text-gray-600 whitespace-nowrap">${Number(b.buildingPrice).toLocaleString()}</td>
                         <td className="border border-gray-400 p-2 text-right font-bold text-black whitespace-nowrap">${Number(b.totalPrice).toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : <div className="text-gray-400 italic border p-4 text-center">無買受人資料</div>}
             </section>
           )}
        </div>
        
        {/* Page 2: 土地 (持分垂直顯示) */}
        {printConfig.lands && (
           <div className="print-section">
             {/* 全案土地總結算 */}
             <section className="mb-8 break-inside-avoid">
               <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">全案土地總結算</h2>
               <div className="grid grid-cols-3 gap-4 border border-gray-400 p-4 text-center bg-gray-50">
                 <div>
                   <span className="block text-xs text-gray-500 font-bold mb-1">總持有面積 (㎡)</span>
                   <span className="text-xl font-black">{landGrandTotal.m2}</span>
                 </div>
                 <div>
                   <span className="block text-xs text-gray-500 font-bold mb-1">總持有坪數</span>
                   <span className="text-xl font-black">{landGrandTotal.ping}</span>
                 </div>
                 <div>
                   <span className="block text-xs text-gray-500 font-bold mb-1">總金額 ($)</span>
                   <span className="text-xl font-black">${Number(landGrandTotal.price).toLocaleString()}</span>
                 </div>
               </div>
             </section>
             
             <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">土地標的詳細清單</h2>
             {lands.length > 0 ? lands.filter(l => visibleLandIds.includes(l.id)).map(l => (
               <div key={l.id} className="mb-6 border border-gray-400 break-inside-avoid">
                 <div className="bg-gray-100 print:bg-gray-200 p-2 font-bold text-sm flex justify-between border-b border-gray-400">
                   <span>出售人: {l.sellers.map(s=>s.name).join(', ')} {l.sellers[0]?.address && `(${l.sellers[0].address})`}</span>
                   <span>地段: {l.section}</span>
                 </div>
                 <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                            <th className="border-r border-gray-300 p-2 w-12 whitespace-nowrap">戶號</th>
                            <th className="border-r border-gray-300 p-2 w-24 whitespace-nowrap">成交日期</th>
                            <th className="border-r border-gray-300 p-2 w-20 whitespace-nowrap">地號</th>
                            <th className="border-r border-gray-300 p-2 w-20 whitespace-nowrap">原始(m2)</th>
                            <th className="border-r border-gray-300 p-2 w-24 whitespace-nowrap">持分</th>
                            <th className="border-r border-gray-300 p-2 whitespace-nowrap">持分(m2)</th>
                            <th className="border-r border-gray-300 p-2 whitespace-nowrap">持分(坪)</th>
                            <th className="border-r border-gray-300 p-2 whitespace-nowrap">單價</th>
                            <th className="p-2 text-right whitespace-nowrap">小計</th>
                        </tr>
                    </thead>
                    <tbody>{l.items.map(item => {
                       const rawM2 = Number(item.areaM2)||0;
                       const num = Number(item.shareNum)||0;
                       const denom = Number(item.shareDenom)||1;
                       const hM2 = item.detailM2 || (rawM2*(num/denom)).toFixed(3);
                       const hPing = item.detailPing || toPing(hM2).toFixed(3);
                       return (
                         <tr key={item.id} className="border-b border-gray-200">
                           <td className="border-r border-gray-300 p-2 text-center font-bold whitespace-nowrap">{item.unit}</td>
                           <td className="border-r border-gray-300 p-2 text-xs whitespace-nowrap">{toROCDate(item.date)}</td>
                           <td className="border-r border-gray-300 p-2 font-mono whitespace-nowrap">{item.lotNumber}</td>
                           <td className="border-r border-gray-300 p-2 text-center whitespace-nowrap">{item.areaM2}</td>
                           
                           {/* ✅ 修正：垂直排列持分 (分子上 / 分母下) */}
                           <td className="border-r border-gray-300 p-1 whitespace-nowrap text-center align-middle">
                               <div className="inline-flex flex-col items-center justify-center leading-none text-xs">
                                   <span className="border-b border-black pb-[1px] mb-[1px] w-full text-center block">{num}</span>
                                   <span className="w-full text-center block">{denom}</span>
                               </div>
                           </td>

                           <td className="border-r border-gray-300 p-2 text-center whitespace-nowrap">{hM2}</td>
                           <td className="border-r border-gray-300 p-2 text-center whitespace-nowrap">{hPing}</td>
                           <td className="border-r border-gray-300 p-2 text-center whitespace-nowrap">{item.pricePerPing}</td>
                           <td className="p-2 text-right whitespace-nowrap font-mono">${Number(item.subtotal).toLocaleString()}</td>
                         </tr>
                       )
                    })}
                    <tr className="bg-gray-100 font-bold border-t border-gray-400">
                          <td colSpan="6" className="p-2 text-right whitespace-nowrap border-r border-gray-300">本筆小計:</td>
                          <td className="p-2 text-center whitespace-nowrap border-r border-gray-300">{Number(l.holdingAreaM2).toFixed(3)}</td>
                          <td className="p-2 text-center whitespace-nowrap border-r border-gray-300">{Number(l.holdingAreaPing).toFixed(3)}</td>
                          <td className="p-2 border-r border-gray-300"></td>
                          <td className="p-2 text-right whitespace-nowrap">${Number(l.totalPrice).toLocaleString()}</td>
                    </tr>
                    </tbody>
                 </table>
               </div>
             )) : <div className="text-gray-400 italic border p-4 text-center">無土地資料</div>}
           </div>
        )}

        {/* Page 3: 建物 (戶號在前) */}
        <div className="print-section">
            {printConfig.buildings && (
              <section className="mb-8 break-inside-avoid">
                <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">建物標的</h2>
                {buildings.length > 0 ? (
                  <table className="w-full border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-gray-100 print:bg-gray-200">
                        <th className="border border-gray-400 p-2 w-12 whitespace-nowrap">戶號</th>
                        <th className="border border-gray-400 p-2 w-24 whitespace-nowrap">成交日期</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">出售人</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">建照</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">地址</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">建號</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">面積(m2)</th>
                        <th className="border border-gray-400 p-2 whitespace-nowrap">總金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBuildings.map(b => (
                        <tr key={b.id}>
                          <td className="border border-gray-400 p-2 font-bold text-center whitespace-nowrap">{b.unit}</td>
                          <td className="border border-gray-400 p-2 text-xs whitespace-nowrap">{toROCDate(b.saleDate)}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap">{b.sellers.map(s => s.name).join(', ')}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap">{b.permitNumber}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap">{b.address}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap">{b.buildNumber}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap">{b.areaM2}</td>
                          <td className="border border-gray-400 p-2 whitespace-nowrap text-right">${Number(b.totalPrice).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-gray-400 italic border p-4 text-center">無建物資料</div>}
              </section>
            )}
            
            {/* 交屋 (不變) */}
            {printConfig.handover && (
              <section className="mb-8 break-inside-avoid">
                <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">交屋點交確認</h2>
                {handoverData ? (
                  <div className="grid grid-cols-2 gap-0 border border-gray-400">
                    <div className="p-2 border-r border-b border-gray-400">點交日期: {toROCDate(handoverData.handoverDate)}</div>
                    <div className="p-2 border-b border-gray-400">遙控器: {handoverData.remotes} 顆</div>
                    <div className="p-2 border-r border-b border-gray-400">小門鑰匙(前): {handoverData.keysFront} 支</div>
                    <div className="p-2 border-b border-gray-400">小門鑰匙(後): {handoverData.keysBack} 支</div>
                    <div className="p-2 border-r border-b border-gray-400">保固書: {handoverData.warranty ? "有" : "無"}</div>
                    <div className="p-2 border-b border-gray-400">竣工圖: {handoverData.drawings ? "有" : "無"}</div>
                    <div className="p-2 border-r border-b border-gray-400">使照正本: {handoverData.originalPermit ? "有" : "無"}</div>
                    <div className="p-2 border-b border-gray-400">電單號碼: {handoverData.electricityBill}</div>
                    <div className="p-2 border-r border-gray-400">水單號碼: {handoverData.waterBill}</div>
                    <div className="p-2"></div>
                  </div>
                ) : <div className="text-gray-400 italic border p-4 text-center">無交屋資料</div>}
              </section>
            )}
            
            {/* 財務收支 (不變，保持紅藍) */}
            {printConfig.finance && (
              <section className="mb-8">
                <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">收支明細</h2>
                <div className="space-y-4">
                  {['general', 'land', 'building', 'buyer'].map(type => {
                      if (!visibleLedgers[type]) return null;
                      const subData = groupedTransactions[type];
                      if(subData.length === 0) return null;
                      const label = type==='general' ? '一般專案收支' : type==='land' ? '土地出售人帳目' : type==='buyer' ? '買受人帳目' : '建物出售人帳目';
                      const subStats = stats.subTotals[type];
                      const net = (subStats?.income || 0) - (subStats?.expense || 0);

                      return (
                        <div key={type} className="mb-4 break-inside-avoid">
                          <h3 className="font-bold text-sm bg-gray-200 p-1 border border-gray-400 border-b-0">{label}</h3>
                          <table className="w-full text-xs border-collapse border border-gray-400">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 whitespace-nowrap">日期</th>
                                <th className="border border-gray-400 p-2 whitespace-nowrap">類型</th>
                                <th className="border border-gray-400 p-2 whitespace-nowrap">對象/備註</th>
                                <th className="border border-gray-400 p-2 text-right whitespace-nowrap">金額</th>
                              </tr>
                            </thead>
                            <tbody>
                                {subData.map(t => (
                                  <tr key={t.id}>
                                    <td className="border border-gray-400 p-2 whitespace-nowrap">{toROCDate(t.date)}</td>
                                    <td className="border border-gray-400 p-2 whitespace-nowrap">{t.category}</td>
                                    <td className="border border-gray-400 p-2 whitespace-nowrap">{t.note}</td>
                                    <td className={`border border-gray-400 p-2 text-right whitespace-nowrap font-mono ${t.type==='income'?'text-red-600':'text-blue-600'}`}>
                                      {t.type==='income'?'':'-'}${Number(t.amount).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan="3" className="border border-gray-400 p-2 text-right whitespace-nowrap">本欄小計</td>
                                    <td className="border border-gray-400 p-2 text-right whitespace-nowrap">
                                        <div className="text-red-600">收: ${(subStats?.income||0).toLocaleString()}</div>
                                        <div className="text-blue-600">支: ${(subStats?.expense||0).toLocaleString()}</div>
                                        <div className={`border-t border-gray-400 mt-1 pt-1 ${net>=0?'text-red-600':'text-blue-600'}`}>淨: ${net.toLocaleString()}</div>
                                    </td>
                                </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                  })}
                </div>
              </section>
            )}

            {/* 請款單 (✅ 修正：顏色、正負、收入支出) */}
            {printConfig.requisition && (
              <section className="mb-8 style={{ breakInside: 'avoid' }}">
                <h2 className="text-lg font-bold border-l-4 border-gray-800 pl-2 mb-4">請款單明細</h2>
                {requisitions.length > 0 ? Object.keys(groupedRequisitions).map(shareholder => {
                  let subTotal = 0;
                  return (
                      <div key={shareholder} className="mb-4 break-inside-avoid">
                        <h3 className="font-bold text-sm bg-gray-200 p-2 border border-gray-400 border-b-0">股東: {shareholder}</h3>
                        <table className="w-full text-sm border-collapse border border-gray-400">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 w-24 whitespace-nowrap">日期</th>
                                <th className="border border-gray-400 p-2 w-16 whitespace-nowrap">類型</th>
                                <th className="border border-gray-400 p-2 whitespace-nowrap">標的物</th>
                                <th className="border border-gray-400 p-2 whitespace-nowrap">明細</th>
                                <th className="border border-gray-400 p-2 w-24 text-right whitespace-nowrap">金額</th>
                              </tr>
                            </thead>
                            <tbody>
                                {groupedRequisitions[shareholder].map(r => {
                                  const isIncome = r.type === 'income';
                                  const amt = Number(r.amount) || 0;
                                  const signAmt = isIncome ? amt : -amt;
                                  subTotal += signAmt;
                                  return (
                                    <tr key={r.id}>
                                      <td className="border border-gray-400 p-2 whitespace-nowrap">{toROCDate(r.date)}</td>
                                      <td className={`border border-gray-400 p-2 whitespace-nowrap font-bold ${isIncome?'text-red-600':'text-blue-600'}`}>{isIncome?'收入':'支出'}</td>
                                      <td className="border border-gray-400 p-2 text-xs whitespace-nowrap">{r.target}</td>
                                      <td className="border border-gray-400 p-2 flex items-center gap-1 whitespace-nowrap"><span>{r.details}</span>{r.image && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">圖</span>}</td>
                                      <td className={`border border-gray-400 p-2 text-right font-mono whitespace-nowrap ${isIncome?'text-red-600':'text-blue-600'}`}>
                                        {isIncome?'':'-'}${amt.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-gray-100">
                                  <td colSpan="4" className="border border-gray-400 p-2 text-right font-bold whitespace-nowrap">小計</td>
                                  <td className={`border border-gray-400 p-2 text-right font-bold whitespace-nowrap ${subTotal>=0?'text-red-600':'text-blue-600'}`}>
                                    ${subTotal.toLocaleString()}
                                  </td>
                                </tr>
                            </tbody>
                        </table>
                      </div>
                  )
                }) : <div className="text-gray-400 italic border p-4 text-center">無請款資料</div>}
              </section>
            )}
        </div>
    </div>
  );
};

export default PrintView;
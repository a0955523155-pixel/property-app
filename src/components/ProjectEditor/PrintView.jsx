import React from 'react';
import { toROCDate, toPing } from '../../utils/helpers';

const Label = ({ children }) => (
  <span className="inline-block bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-1.5 text-xs font-bold whitespace-nowrap align-middle">
    {children}
  </span>
);

const PrintView = ({ 
  projectName, printConfig, projectTeams, 
  landGrandTotal, buildingGrandTotal, 
  buyers, sortedBuyers, lands, visibleLandIds, 
  buildings, sortedBuildings, 
  handoverData, visibleHandoverUnits, 
  allLotNumbers, allBuildingInfo, 
  visibleLedgers, groupedTransactions, stats, 
  requisitions, groupedRequisitions 
}) => {
  return (
    <div className="hidden print:block print:p-8 font-sans text-xs text-gray-900 leading-snug">
        
        {/* ==================== PAGE 1: 封面與總結算 ==================== */}
        <div className="print-section-page">
            <h1 className="text-3xl font-black mb-4 text-gray-800">專案管理報表: {projectName}</h1>
            <p className="text-sm text-gray-500 mb-8 border-b-4 border-gray-800 pb-2">列印日期: {toROCDate(new Date())}</p>

            {/* 1. 全案土地總結算 */}
            {printConfig.lands && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-3">全案土地總結算</h2>
                    <div className="grid grid-cols-3 gap-4 border-2 border-gray-400 p-4 text-center bg-gray-50">
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總持有面積 (㎡)</span><span className="text-2xl font-black">{landGrandTotal.m2}</span></div>
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總持有坪數</span><span className="text-2xl font-black">{landGrandTotal.ping}</span></div>
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總金額 ($)</span><span className="text-2xl font-black">${Number(landGrandTotal.price).toLocaleString()}</span></div>
                    </div>
                </section>
            )}

            {/* 2. 全案建物總結算 */}
            {printConfig.buildings && (
                <section className="mb-8">
                    <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-3">全案建物總結算</h2>
                    <div className="grid grid-cols-3 gap-4 border-2 border-gray-400 p-4 text-center bg-gray-50">
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總面積 (㎡)</span><span className="text-2xl font-black">{buildingGrandTotal.m2}</span></div>
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總坪數</span><span className="text-2xl font-black">{buildingGrandTotal.ping}</span></div>
                        <div><span className="block text-xs text-gray-500 font-bold mb-1">總金額 ($)</span><span className="text-2xl font-black">${Number(buildingGrandTotal.price).toLocaleString()}</span></div>
                    </div>
                </section>
            )}
        </div>
        
        {/* ==================== PAGE 2: 專案團隊 (✅ 加入請款明細列印) ==================== */}
        {printConfig.team && (
             <div className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
               <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">專案團隊資訊</h2>
               <table className="w-full border-collapse border-2 border-black table-fixed text-xs">
                 {projectTeams.map(t => (
                    <tbody key={t.id} className="break-inside-avoid border-b-2 border-black">
                        <tr className="bg-gray-50 border-b border-gray-300">
                            <td rowSpan={3} className="border-r border-black p-2 font-black text-center align-middle text-xl w-[50px] bg-gray-100">{t.unit}</td>
                            <td className="p-2 border-r border-gray-300 w-1/2"><Label>仲介公司</Label><span className="font-bold">{t.agency}</span></td>
                            <td className="p-2 w-1/2"><Label>經紀人</Label><span className="font-bold">{t.broker}</span></td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="p-2 border-r border-gray-300 align-top">
                                <Label>開發業務</Label><span className="font-bold">{t.developer}</span>
                                <div className="mt-0.5 ml-1 text-gray-500 text-[10px]">合約: {t.developerType} {t.developerNo}</div>
                                
                                {/* 判斷是否有填寫開發請款資料，有填才顯示列印 */}
                                {(t.devInvoiceNo || t.devServiceFee || t.devPaymentDate || t.devAmount || t.devSubtotal || t.devDetails) && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-gray-300 text-[10px]">
                                        <div className="text-blue-700 font-bold mb-1">▼ 開發發票與請款</div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-700">
                                            <div><span className="text-gray-400">日期:</span> {t.devPaymentDate ? toROCDate(t.devPaymentDate) : '-'}</div>
                                            <div><span className="text-gray-400">發票:</span> {t.devInvoiceNo || '-'}</div>
                                            <div><span className="text-gray-400">服務費:</span> {t.devServiceFee ? `$${Number(t.devServiceFee).toLocaleString()}` : '-'}</div>
                                            <div><span className="text-gray-400">金額:</span> {t.devAmount ? `$${Number(t.devAmount).toLocaleString()}` : '-'}</div>
                                            <div className="col-span-2"><span className="text-gray-400">明細:</span> {t.devDetails || '-'}</div>
                                            <div className="col-span-2"><span className="text-gray-400 font-bold">小計:</span> {t.devSubtotal ? `$${Number(t.devSubtotal).toLocaleString()}` : '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td className="p-2 align-top">
                                <Label>行銷業務</Label><span className="font-bold">{t.marketer}</span>
                                <div className="mt-0.5 ml-1 text-gray-500 text-[10px]">單據: {t.marketerNo}</div>
                                
                                {/* 判斷是否有填寫行銷請款資料，有填才顯示列印 */}
                                {(t.marInvoiceNo || t.marServiceFee || t.marPaymentDate || t.marAmount || t.marSubtotal || t.marDetails) && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-gray-300 text-[10px]">
                                        <div className="text-purple-700 font-bold mb-1">▼ 行銷發票與請款</div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-700">
                                            <div><span className="text-gray-400">日期:</span> {t.marPaymentDate ? toROCDate(t.marPaymentDate) : '-'}</div>
                                            <div><span className="text-gray-400">發票:</span> {t.marInvoiceNo || '-'}</div>
                                            <div><span className="text-gray-400">服務費:</span> {t.marServiceFee ? `$${Number(t.marServiceFee).toLocaleString()}` : '-'}</div>
                                            <div><span className="text-gray-400">金額:</span> {t.marAmount ? `$${Number(t.marAmount).toLocaleString()}` : '-'}</div>
                                            <div className="col-span-2"><span className="text-gray-400">明細:</span> {t.marDetails || '-'}</div>
                                            <div className="col-span-2"><span className="text-gray-400 font-bold">小計:</span> {t.marSubtotal ? `$${Number(t.marSubtotal).toLocaleString()}` : '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} className="p-2"><Label>承辦代書</Label><span className="font-bold">{t.scrivener}</span></td>
                        </tr>
                    </tbody>
                 ))}
               </table>
             </div>
        )}
           
        {/* ==================== PAGE 3: 買受人資訊 ==================== */}
        {printConfig.buyers && (
             <div className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
               <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">買受人資訊</h2>
               {buyers.length > 0 ? (
                 <table className="w-full border-collapse border-2 border-black table-fixed text-xs">
                   {sortedBuyers.map(b => (
                     <tbody key={b.id} className="break-inside-avoid border-b-2 border-black">
                        <tr className="bg-gray-50 border-b border-gray-300">
                            <td rowSpan={3} className="border-r border-black p-2 font-black text-center align-middle text-xl w-[50px] bg-gray-100">{b.unit}</td>
                            <td className="p-2 border-r border-gray-300 w-1/2"><Label>買方姓名</Label><span className="font-bold text-sm align-middle">{b.name}</span></td>
                            <td className="p-2 w-1/2"><Label>聯絡電話</Label><span className="font-mono text-sm align-middle">{b.phone}</span></td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td colSpan={2} className="p-2"><Label>通訊地址</Label><span className="font-bold align-middle">{b.address}</span></td>
                        </tr>
                        <tr>
                            <td colSpan={2} className="p-0">
                                <div className="grid grid-cols-3 divide-x divide-gray-300">
                                    <div className="p-2"><Label>土地價款</Label><span className="font-mono block mt-0.5 text-right text-sm">${Number(b.landPrice).toLocaleString()}</span></div>
                                    <div className="p-2"><Label>建物價款</Label><span className="font-mono block mt-0.5 text-right text-sm">${Number(b.buildingPrice).toLocaleString()}</span></div>
                                    <div className="p-2 bg-yellow-50"><Label>合約總價</Label><span className="font-black block mt-0.5 text-right text-base">${Number(b.totalPrice).toLocaleString()}</span></div>
                                </div>
                            </td>
                        </tr>
                     </tbody>
                   ))}
                 </table>
               ) : <div className="text-gray-400 italic border p-4 text-center">無買受人資料</div>}
             </div>
        )}
        
        {/* ==================== PAGE 4: 土地標的 ==================== */}
        {printConfig.lands && (
           <div className="print-section-page">
             <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4 break-before-page" style={{ pageBreakBefore: 'always' }}>土地標的詳細清單</h2>
             
             {lands.length > 0 ? lands.filter(l => visibleLandIds.includes(l.id)).map((l, index) => (
               <div key={l.id} style={index === 0 ? {} : { pageBreakBefore: 'always' }} className="mb-8">
                 
                 <table className="w-full border-collapse table-fixed text-xs">
                    <thead>
                        <tr>
                            <th colSpan="3" className="border-2 border-black bg-gray-800 text-white p-3 text-left">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black tracking-wide">
                                        出售人: {l.sellers.map(s=>s.name).join(', ')} 
                                        {l.sellers[0]?.address && <span className="text-xs font-normal ml-2 opacity-80">({l.sellers[0].address})</span>}
                                    </span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-yellow-400">地段: {l.section}</div>
                                        <div className="text-[10px] font-light opacity-60 mt-0.5">(若跨頁請承接上頁)</div>
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>

                    {l.items.map(item => {
                       const rawM2 = Number(item.areaM2)||0;
                       const num = Number(item.shareNum)||0;
                       const denom = Number(item.shareDenom)||1;
                       const hM2 = item.detailM2 || (rawM2*(num/denom)).toFixed(3);
                       const hPing = item.detailPing || toPing(hM2).toFixed(3);
                       
                       return (
                         <tbody key={item.id} className="border-2 border-black border-t-0 break-inside-avoid">
                            <tr className="bg-gray-100 border-b border-gray-300">
                                <td className="p-2 border-r border-gray-300 w-[40px] text-center align-middle">
                                    <span className="font-black text-lg">{item.unit}</span>
                                </td>
                                <td className="p-2 border-r border-gray-300 w-auto align-middle">
                                    <Label>成交日期</Label>
                                    <span className="font-mono text-sm font-bold">{item.date ? toROCDate(item.date) : ''}</span>
                                </td>
                                <td className="p-2 w-auto align-middle">
                                    <Label>地號</Label>
                                    <span className="font-mono font-bold bg-white border px-1.5 py-0.5 rounded text-sm">{item.lotNumber}</span>
                                </td>
                            </tr>

                            <tr className="border-b border-gray-300">
                                <td colSpan={3} className="p-0">
                                    <div className="grid grid-cols-3 divide-x divide-gray-300">
                                        <div className="p-2"><Label>原始面積</Label><span className="font-mono align-middle font-bold text-sm">{item.areaM2} m²</span></div>
                                        <div className="p-2 flex items-center"><Label>持分比例</Label><div className="inline-flex flex-col items-center justify-center leading-none text-sm ml-1 font-bold"><span className="border-b border-black pb-[1px] w-full text-center">{num}</span><span className="w-full text-center">{denom}</span></div></div>
                                        <div className="p-2 bg-yellow-50"><Label>持分面積</Label><div className="font-black inline-block align-middle text-sm">{hM2} m² <span className="text-gray-500 text-xs font-normal">({hPing}坪)</span></div></div>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td colSpan={3} className="p-0">
                                    <div className="grid grid-cols-2 divide-x divide-gray-300">
                                        <div className="p-2"><Label>每坪單價</Label><span className="font-mono align-middle font-bold text-sm">${Number(item.pricePerPing).toLocaleString()}</span></div>
                                        <div className="p-2 text-right"><Label>本筆小計</Label><span className="font-black text-base align-middle">${Number(item.subtotal).toLocaleString()}</span></div>
                                    </div>
                                </td>
                            </tr>
                         </tbody>
                       )
                    })}

                    <tbody className="border-2 border-t-0 border-black bg-gray-100 font-bold break-inside-avoid">
                        <tr>
                            <td colSpan="3" className="p-3 text-right">
                                <span className="mr-6">合計持分面積: {Number(l.holdingAreaM2).toFixed(3)} m²</span>
                                <span className="mr-6">合計持分坪數: {Number(l.holdingAreaPing).toFixed(3)} 坪</span>
                                <span className="text-xl border-l-4 border-gray-400 pl-4">總價: ${Number(l.totalPrice).toLocaleString()}</span>
                            </td>
                        </tr>
                    </tbody>
                 </table>
               </div>
             )) : <div className="text-gray-400 italic border p-4 text-center">無土地資料</div>}
           </div>
        )}

        {/* ==================== PAGE 5: 建物標的 ==================== */}
        {printConfig.buildings && (
              <div className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">建物標的清單</h2>
                {buildings.length > 0 ? (
                  <table className="w-full border-collapse border-2 border-black table-fixed text-xs">
                    {sortedBuildings.map(b => (
                        <tbody key={b.id} className="break-inside-avoid border-b-2 border-black">
                            <tr className="bg-gray-50 border-b border-gray-300">
                                <td rowSpan={4} className="border-r border-black p-2 font-black text-center align-middle text-xl w-[50px] bg-gray-100">{b.unit}</td>
                                <td className="p-2 border-r border-gray-300 w-[160px]"><Label>成交日期</Label><span className="font-mono text-sm align-middle">{b.saleDate ? toROCDate(b.saleDate) : ''}</span></td>
                                <td className="p-2 w-auto" colSpan={2}><Label>出售人</Label><span className="font-bold text-sm align-middle">{b.sellers.map(s => s.name).join(', ')}</span></td>
                            </tr>
                            <tr className="border-b border-gray-300">
                                <td colSpan={3} className="p-2"><Label>門牌地址</Label><span className="font-bold text-black text-sm align-middle">{b.address}</span></td>
                            </tr>
                            <tr className="border-b border-gray-300">
                                <td colSpan={3} className="p-0">
                                    <div className="flex w-full">
                                        <div className="w-1/2 p-2 border-r border-gray-300 flex items-center">
                                            <Label>建照號碼</Label><span className="font-mono text-xs break-all">{b.permitNumber}</span>
                                        </div>
                                        <div className="w-1/2 p-2 flex items-center">
                                            <Label>使照號碼</Label><span className="font-mono text-xs break-all">{b.license}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 border-r border-gray-300"><Label>建號</Label><span className="font-mono font-bold text-sm align-middle">{b.buildNumber}</span></td>
                                <td className="p-2 border-r border-gray-300">
                                    <Label>面積</Label>
                                    <span className="font-mono align-middle font-bold text-sm">
                                        {b.areaM2} m² 
                                        <span className="text-gray-500 text-xs ml-1 font-normal">({toPing(b.areaM2).toFixed(2)}坪)</span>
                                    </span>
                                </td>
                                <td className="p-2 text-right"><Label>總金額</Label><span className="font-black text-base align-middle">${Number(b.totalPrice).toLocaleString()}</span></td>
                            </tr>
                        </tbody>
                    ))}
                  </table>
                ) : <div className="text-gray-400 italic border p-4 text-center">無建物資料</div>}
              </div>
        )}

        {/* ==================== PAGE 6+: 交屋點交 ==================== */}
        {printConfig.handover && handoverData && handoverData.length > 0 && (
            <>
                {handoverData
                    .filter(h => visibleHandoverUnits.includes(h.unit))
                    .sort((a, b) => (a.unit || "").localeCompare(b.unit || "", "zh-Hant", { numeric: true }))
                    .map(h => (
                    <div key={h.id} className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
                        <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">交屋點交確認單 - 戶號: {h.unit}</h2>
                        <div className="grid grid-cols-2 gap-0 border-2 border-gray-400 text-sm">
                            <div className="p-4 border-r border-b border-gray-400 flex justify-between"><span className="font-bold">點交日期</span> <span>{h.handoverDate ? toROCDate(h.handoverDate) : ''}</span></div>
                            <div className="p-4 border-b border-gray-400 flex justify-between"><span className="font-bold">捲門遙控器</span> <span>{h.remotes} 顆</span></div>
                            <div className="p-4 border-r border-b border-gray-400 flex justify-between"><span className="font-bold">小門鑰匙(前)</span> <span>{h.keysFront} 支</span></div>
                            <div className="p-4 border-b border-gray-400 flex justify-between"><span className="font-bold">小門鑰匙(後)</span> <span>{h.keysBack} 支</span></div>
                            <div className="p-4 border-r border-b border-gray-400 flex justify-between"><span className="font-bold">廠房保固書</span> <span>{h.warranty ? "有" : "無"}</span></div>
                            <div className="p-4 border-b border-gray-400 flex justify-between"><span className="font-bold">廠房竣工圖</span> <span>{h.drawings ? "有" : "無"}</span></div>
                            <div className="p-4 border-r border-b border-gray-400 flex justify-between"><span className="font-bold">使用執照正本</span> <span>{h.originalPermit ? "有" : "無"}</span></div>
                            <div className="p-4 border-b border-gray-400 flex justify-between"></div>
                            <div className="p-4 border-r border-gray-400 flex justify-between"><span className="font-bold">電單號碼</span> <span>{h.electricityBill}</span></div>
                            <div className="p-4 flex justify-between"><span className="font-bold">水單號碼</span> <span>{h.waterBill}</span></div>
                        </div>
                        <div className="mt-24 flex justify-around px-8">
                            <div className="text-center"><p className="mb-4 text-gray-500 text-base">建商簽章</p><div className="border-b-2 border-black w-56 h-8"></div></div>
                            <div className="text-center"><p className="mb-4 text-gray-500 text-base">買方簽章</p><div className="border-b-2 border-black w-56 h-8"></div></div>
                        </div>
                    </div>
                ))}
            </>
        )}
            
        {/* ==================== PAGE 7: 財務收支 ==================== */}
        {printConfig.finance && (
            <div className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">收支明細</h2>
                <div className="space-y-6">
                  {['general', 'land', 'building', 'buyer'].map(type => {
                      if (!visibleLedgers[type]) return null;
                      const subData = groupedTransactions[type];
                      if(subData.length === 0) return null;
                      const label = type==='general' ? '一般專案收支' : type==='land' ? '土地出售人帳目' : type==='buyer' ? '買受人帳目' : '建物出售人帳目';
                      const subStats = stats.subTotals[type];
                      const net = (subStats?.income || 0) - (subStats?.expense || 0);

                      return (
                        <div key={type} className="mb-6 break-inside-avoid">
                          <h3 className="font-bold text-base bg-gray-200 p-2 border-2 border-gray-400 border-b-0">{label}</h3>
                          <table className="w-full text-xs border-collapse border-2 border-gray-400">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 w-24 whitespace-nowrap">日期</th>
                                <th className="border border-gray-400 p-2 w-20 whitespace-nowrap">類型</th>
                                <th className="border border-gray-400 p-2 whitespace-normal">對象/備註</th>
                                <th className="border border-gray-400 p-2 w-36 text-right whitespace-nowrap">金額</th>
                              </tr>
                            </thead>
                            <tbody>
                                {subData.map(t => (
                                  <tr key={t.id}>
                                    <td className="border border-gray-400 p-2 align-top whitespace-nowrap">{t.date ? toROCDate(t.date) : ''}</td>
                                    <td className="border border-gray-400 p-2 align-top whitespace-nowrap">{t.category}</td>
                                    <td className="border border-gray-400 p-2 align-top whitespace-normal break-words">{t.note}</td>
                                    <td className={`border border-gray-400 p-2 text-right align-top whitespace-nowrap font-mono ${t.type==='income'?'text-red-600':'text-blue-600'}`}>
                                      {t.type==='income'?'':'-'}${Number(t.amount).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold text-sm">
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
            </div>
        )}

        {/* ==================== PAGE 8: 請款單 ==================== */}
        {printConfig.requisition && (
            <div className="print-section-page break-before-page" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-lg font-bold border-l-8 border-gray-800 pl-3 mb-4">請款單明細</h2>
                {requisitions.length > 0 ? Object.keys(groupedRequisitions).map(shareholder => {
                  let subTotal = 0;
                  return (
                      <div key={shareholder} className="mb-6 break-inside-avoid">
                        <h3 className="font-bold text-base bg-gray-200 p-2 border-2 border-gray-400 border-b-0">股東: {shareholder}</h3>
                        <table className="w-full text-xs border-collapse border-2 border-gray-400">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2 w-20 whitespace-nowrap">日期</th>
                                <th className="border border-gray-400 p-2 w-12 whitespace-nowrap">類型</th>
                                <th className="border border-gray-400 p-2 whitespace-normal min-w-[100px]">標的物</th>
                                <th className="border border-gray-400 p-2 whitespace-normal">明細</th>
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
                                      <td className="border border-gray-400 p-2 align-top whitespace-nowrap">{r.date ? toROCDate(r.date) : ''}</td>
                                      <td className={`border border-gray-400 p-2 align-top whitespace-nowrap font-bold ${isIncome?'text-red-600':'text-blue-600'}`}>{isIncome?'收入':'支出'}</td>
                                      <td className="border border-gray-400 p-2 text-xs align-top whitespace-normal break-words">{r.target}</td>
                                      <td className="border border-gray-400 p-2 align-top whitespace-normal break-words">{r.details}</td>
                                      <td className={`border border-gray-400 p-2 text-right align-top font-mono whitespace-nowrap ${isIncome?'text-red-600':'text-blue-600'}`}>
                                        {isIncome?'':'-'}${amt.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-gray-100 text-sm">
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
            </div>
        )}
    </div>
  );
};

export default PrintView;
// src/utils/helpers.js

export const CATEGORIES = {
  expense: ["土地成本", "建物成本", "仲介費", "代書/規費", "整地/工程", "廣告行銷", "稅務支出", "雜支"],
  income: ["銷售定金", "簽約款", "用印款", "完稅款", "尾款", "租金收入", "退稅/其他"]
};

export const PREDEFINED_SELLERS = ["衍得發建設有限公司", "余聰毅", "曾久峰", "邱照達", "吳銀郎", "簡永欽", "簡永源", "張平馬"];

export const toPing = (m2) => {
  const val = Number(m2);
  return isNaN(val) ? 0 : (val * 0.3025);
};

export const createEmptyLandItem = () => ({
  id: Date.now() + Math.random(),
  lotNumber: "",
  areaM2: "",
  shareNum: "1",
  shareDenom: "1",
  detailM2: "",   // 持分面積 (手動修正用)
  detailPing: "", // 持分坪數 (手動修正用)
  pricePerPing: "",
  subtotal: "" 
});

// ✅ CSV 匯出邏輯
export const exportMasterCSV = (projectName, buyers, lands, buildings, transactions, handoverData, projectTeam, requisitions, visibleLandIds = null) => {
    let csvContent = "\uFEFF"; 
    csvContent += `=== 專案報表: ${projectName} ===\n`;
    csvContent += `匯出日期,${new Date().toLocaleString()}\n\n`;

    // 0. 專案團隊
    if (projectTeam) {
      csvContent += "=== 專案團隊資訊 ===\n";
      csvContent += `仲介公司,${projectTeam.agency || ''}\n`;
      csvContent += `經紀人,${projectTeam.broker || ''}\n`;
      const devType = projectTeam.developerType === 'exclusive' ? '專任約' : '一般約';
      csvContent += `開發業務,${projectTeam.developer || ''},合約類型,${devType},合約號碼,${projectTeam.developerNo || ''}\n`;
      csvContent += `行銷業務,${projectTeam.marketer || ''},單據類型,斡旋/訂金,單據號碼,${projectTeam.marketerNo || ''}\n`;
      csvContent += `承辦代書,${projectTeam.scrivener || ''}\n\n`;
    }

    // 1. 買受人
    csvContent += "=== 買受人資訊 ===\n";
    csvContent += "姓名,電話,地址\n";
    buyers.forEach(b => {
        csvContent += `"${b.name}","${b.phone}","${b.address}"\n`;
    });
    csvContent += "\n";

    // 2. 土地 (✅ 修正：詳細列出地號規格、收支負號、本筆合計)
    csvContent += "=== 土地標的詳細清單 (金額為支出) ===\n";
    csvContent += "出售人,地段,地號,原始面積(m2),持分(分子/分母),持分面積(m2),持分坪數,單價(元/坪),小計($)\n";
    
    const targetLands = visibleLandIds ? lands.filter(l => visibleLandIds.includes(l.id)) : lands;

    targetLands.forEach(l => {
      const sellersStr = l.sellers.map(s => s.name).join(';');
      
      // 列出每一筆地號
      l.items.forEach(item => {
        const rawM2 = Number(item.areaM2) || 0;
        const num = Number(item.shareNum) || 0;
        const denom = Number(item.shareDenom) || 1;
        // 優先使用手動調整數值
        const hM2 = item.detailM2 ? item.detailM2 : (rawM2 * (num / denom)).toFixed(3);
        const hPing = item.detailPing ? item.detailPing : toPing(hM2).toFixed(3);
        
        // 金額加負號 (支出)
        const cost = Number(item.subtotal) > 0 ? `-${item.subtotal}` : item.subtotal;

        csvContent += `"${sellersStr}",${l.section},${item.lotNumber},${rawM2},${num}/${denom},${hM2},${hPing},${item.pricePerPing},${cost}\n`;
      });

      // ✅ 加入 [本筆合計] 行
      csvContent += `,,[本筆合計],,,${Number(l.holdingAreaM2).toFixed(3)},${Number(l.holdingAreaPing).toFixed(3)},,-${Number(l.totalPrice)}\n`;
    });
    csvContent += "\n";

    // 3. 建物
    csvContent += "=== 建物標的清單 ===\n";
    csvContent += "出售人/屋主,建照號碼,門牌地址,使照號碼,建號,面積(m2),單價(元/坪),成交總額($)\n";
    buildings.forEach(b => {
        const sellersStr = b.sellers.map(s => s.name).join(';');
        csvContent += `"${sellersStr}","${b.permitNumber || ''}","${b.address}","${b.license}","${b.buildNumber}",${b.areaM2},${b.pricePerUnit},-${b.totalPrice}\n`;
    });
    csvContent += "\n";

    // 4. 請款單
    if (requisitions && requisitions.length > 0) {
      csvContent += "=== 請款單明細 (依股東分類) ===\n";
      const reqGroups = requisitions.reduce((acc, curr) => {
        const key = curr.shareholder || '未分類股東';
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {});

      Object.keys(reqGroups).forEach(shareholder => {
        csvContent += `--- 股東: ${shareholder} ---\n`;
        csvContent += "日期,標的物,款項明細,金額\n";
        let subTotal = 0;
        reqGroups[shareholder].forEach(r => {
           csvContent += `${r.date},"${r.target}","${r.details}",-${r.amount}\n`;
           subTotal += Number(r.amount) || 0;
        });
        csvContent += `,,,總計: -${subTotal}\n\n`;
      });
      csvContent += "\n";
    }

    // 5. 財務收支
    csvContent += "=== 財務收支明細 ===\n";
    csvContent += "日期,類型,科目,歸屬類別,具體對象,金額,備註\n";
    transactions.forEach(t => {
        let linkTypeTw = "一般專案";
        let linkedLabel = "-";
        if(t.linkedType === 'land') { 
            linkTypeTw = "土地出售人";
            const land = lands.find(l=>l.id===t.linkedId); 
            linkedLabel = land ? (land.sellers.map(s=>s.name).join('/') || land.items[0]?.lotNumber) : '未知'; 
        } else if(t.linkedType === 'building') { 
            linkTypeTw = "建物出售人";
            const build = buildings.find(b=>b.id===t.linkedId); 
            linkedLabel = build ? (build.sellers.map(s=>s.name).join('/') || build.address.substring(0,8)) : '未知'; 
        }
        const finalAmt = t.type === 'expense' ? `-${t.amount}` : t.amount;
        csvContent += `${t.date},${t.type === 'income' ? '收入' : '支出'},${t.category},${linkTypeTw},"${linkedLabel}",${finalAmt},"${t.note}"\n`;
    });
    csvContent += "\n";

    // 6. 交屋 (略)
    if (handoverData) { /* ... same as before ... */ }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `[完整報表]_${projectName}.csv`;
    link.click();
};
// src/utils/helpers.js

export const CATEGORIES = {
  expense: ["土地成本", "建物成本", "仲介費", "代書/規費", "整地/工程", "廣告行銷", "稅務支出", "雜支"],
  income: ["銷售定金", "簽約款", "用印款", "完稅款", "尾款", "租金收入", "退稅/其他"]
};

export const PREDEFINED_SELLERS = ["衍得發建設有限公司", "余聰毅", "曾久峰", "邱照達", "吳銀郎", "簡永欽", "簡永源", "張平馬"];

// 坪數換算公式
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
  pricePerPing: "",
  subtotal: "" 
});

// CSV 匯出邏輯 (✅ 已修正：強制所有面積相關欄位為 3 位小數)
export const exportMasterCSV = (projectName, buyers, lands, buildings, transactions) => {
    let csvContent = "\uFEFF"; 
    csvContent += `=== 專案報表: ${projectName} ===\n`;
    csvContent += `匯出日期,${new Date().toLocaleString()}\n\n`;

    // 1. 買受人資料
    csvContent += "=== 買受人資訊 ===\n";
    csvContent += "姓名,電話,地址\n";
    buyers.forEach(b => {
        csvContent += `"${b.name}","${b.phone}","${b.address}"\n`;
    });
    csvContent += "\n";

    // 2. 土地資料
    csvContent += "=== 土地標的清單 ===\n";
    csvContent += "出售人,地段,地號,持有面積(m2),持有坪數,單價(元/坪),小計($)\n";
    lands.forEach(l => {
      const sellersStr = l.sellers.map(s => s.name).join(';');
      l.items.forEach(item => {
        // ✅ 修正：個別地號面積改為 3 位
        const hM2 = (Number(item.areaM2) * (Number(item.shareNum) / Number(item.shareDenom))).toFixed(3);
        const hPing = toPing(hM2).toFixed(3);
        csvContent += `"${sellersStr}",${l.section},${item.lotNumber},${hM2},${hPing},${item.pricePerPing},${item.subtotal}\n`;
      });
    });
    csvContent += "\n";

    // 3. 建物資料 (包含建照號碼)
    csvContent += "=== 建物標的清單 ===\n";
    csvContent += "出售人/屋主,建照號碼,門牌地址,使照號碼,建號,面積(m2),單價(元/坪),成交總額($)\n";
    buildings.forEach(b => {
        const sellersStr = b.sellers.map(s => s.name).join(';');
        csvContent += `"${sellersStr}","${b.permitNumber || ''}","${b.address}","${b.license}","${b.buildNumber}",${b.areaM2},${b.pricePerUnit},${b.totalPrice}\n`;
    });
    csvContent += "\n";

    // 4. 財務收支
    csvContent += "=== 財務收支明細 ===\n";
    csvContent += "日期,類型,科目,歸屬,具體對象,金額,備註\n";
    transactions.forEach(t => {
        let linkedLabel = "一般專案收支";
        if(t.linkedType === 'land') { const land = lands.find(l=>l.id===t.linkedId); linkedLabel = land ? (land.sellers.map(s=>s.name).join('/') || land.items[0]?.lotNumber) : '未知土地'; } 
        else if(t.linkedType === 'building') { const build = buildings.find(b=>b.id===t.linkedId); linkedLabel = build ? (build.sellers.map(s=>s.name).join('/') || build.address.substring(0,8)) : '未知建物'; }
        
        csvContent += `${t.date},${t.type === 'income' ? '收入' : '支出'},${t.category},${t.linkedType},"${linkedLabel}",${t.amount},"${t.note}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `[完整報表]_${projectName}.csv`;
    link.click();
};
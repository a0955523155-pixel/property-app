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

export const toROCDate = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  const year = date.getFullYear() - 1911;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createEmptyLandItem = () => ({
  id: Date.now() + Math.random(),
  date: new Date().toISOString().split('T')[0],
  unit: "",
  lotNumber: "",
  areaM2: "",
  shareNum: "1",
  shareDenom: "1",
  detailM2: "",   
  detailPing: "", 
  pricePerPing: "",
  subtotal: "" 
});

const safe = (str) => {
  if (str === null || str === undefined) return '""';
  const cleanStr = String(str).replace(/\n/g, ' ').replace(/\r/g, '').replace(/"/g, '""');
  return `"${cleanStr}"`;
};

// ✅ CSV 匯出邏輯
export const exportMasterCSV = (projectName, buyers, lands, buildings, transactions, handoverData, projectTeams, requisitions, visibleLandIds = null) => {
    let csvContent = "\uFEFF"; 
    csvContent += `=== 專案報表: ${safe(projectName)} ===\n`;
    csvContent += `匯出日期,${safe(toROCDate(new Date()))}\n\n`;

    // 0. 專案團隊
    if (projectTeams && projectTeams.length > 0) {
      csvContent += "=== 專案團隊資訊 ===\n";
      csvContent += "歸屬戶號,仲介公司,經紀人,開發業務,合約類型,合約編號,行銷業務,單據類型,單據編號,承辦代書\n";
      projectTeams.forEach(team => {
          const devType = team.developerType === 'exclusive' ? '專任約' : '一般約';
          csvContent += `${safe(team.unit)},${safe(team.agency)},${safe(team.broker)},${safe(team.developer)},${safe(devType)},${safe(team.developerNo)},${safe(team.marketer)},"斡旋/訂金",${safe(team.marketerNo)},${safe(team.scrivener)}\n`;
      });
      csvContent += "\n";
    }

    // 1. 買受人
    csvContent += "=== 買受人資訊 ===\n";
    csvContent += "戶號,姓名,電話,地址,土地合約價,建物合約價,合約總價\n";
    buyers.forEach(b => {
        csvContent += `${safe(b.unit)},${safe(b.name)},${safe(b.phone)},${safe(b.address)},${b.landPrice || 0},${b.buildingPrice || 0},${b.totalPrice || 0}\n`;
    });
    csvContent += "\n";

    // 2. 土地
    const targetLands = visibleLandIds ? lands.filter(l => visibleLandIds.includes(l.id)) : lands;
    
    let grandM2 = 0, grandPing = 0, grandPrice = 0;
    targetLands.forEach(l => {
        grandM2 += Number(l.holdingAreaM2) || 0;
        grandPing += Number(l.holdingAreaPing) || 0;
        grandPrice += Number(l.totalPrice) || 0;
    });

    csvContent += "=== 全案土地總結算 ===\n";
    csvContent += "總持有面積(m2),總持有坪數,總金額($)\n";
    csvContent += `${grandM2.toFixed(3)},${grandPing.toFixed(3)},${grandPrice}\n\n`;

    csvContent += "=== 土地標的詳細清單 ===\n";
    csvContent += "出售人(地址),地段,戶號,成交日期,地號,原始面積(m2),持分(分子/分母),持分面積(m2),持分坪數,單價(元/坪),小計($)\n";

    targetLands.forEach(l => {
      const sellersStr = l.sellers.map(s => `${s.name}${s.address ? `(${s.address})` : ''}`).join('; ');
      l.items.forEach(item => {
        const rawM2 = Number(item.areaM2) || 0;
        const num = Number(item.shareNum) || 0;
        const denom = Number(item.shareDenom) || 1;
        const hM2 = item.detailM2 ? item.detailM2 : (rawM2 * (num / denom)).toFixed(3);
        const hPing = item.detailPing ? item.detailPing : toPing(hM2).toFixed(3);
        const cost = item.subtotal;
        
        csvContent += `${safe(sellersStr)},${safe(l.section)},${safe(item.unit)},${safe(toROCDate(item.date))},${safe(item.lotNumber)},${rawM2},${num}/${denom},${hM2},${hPing},${item.pricePerPing},${cost}\n`;
      });
      csvContent += `,,,[本筆合計],,,,,${Number(l.holdingAreaM2).toFixed(3)},${Number(l.holdingAreaPing).toFixed(3)},,${Number(l.totalPrice)}\n`;
    });
    csvContent += "\n";

    // 3. 建物
    csvContent += "=== 建物標的清單 ===\n";
    csvContent += "戶號,成交日期,出售人/屋主,建照號碼,門牌地址,使照號碼,建號,面積(m2),單價(元/坪),成交總額($)\n";
    const sortedBuildings = [...buildings].sort((a, b) => (a.unit || a.address || "").localeCompare(b.unit || b.address || "", "zh-Hant"));
    sortedBuildings.forEach(b => {
        const sellersStr = b.sellers.map(s => s.name).join(';');
        csvContent += `${safe(b.unit)},${safe(toROCDate(b.saleDate))},${safe(sellersStr)},${safe(b.permitNumber)},${safe(b.address)},${safe(b.license)},${safe(b.buildNumber)},${b.areaM2},${b.pricePerUnit},${b.totalPrice}\n`;
    });
    csvContent += "\n";

    // 4. 請款單 (✅ 修正：判斷收入/支出)
    if (requisitions && requisitions.length > 0) {
      csvContent += "=== 請款單明細 (依股東分類) ===\n";
      const reqGroups = requisitions.reduce((acc, curr) => {
        const key = curr.shareholder || '未分類股東';
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {});
      Object.keys(reqGroups).forEach(shareholder => {
        csvContent += `--- 股東: ${safe(shareholder)} ---\n`;
        csvContent += "日期,類型,標的物,款項明細,金額\n"; // 新增類型欄位
        let subTotal = 0;
        reqGroups[shareholder].forEach(r => {
           const isIncome = r.type === 'income';
           const amount = Number(r.amount) || 0;
           // 收入為正，支出為負
           const signAmount = isIncome ? amount : -amount;
           const typeStr = isIncome ? '收入' : '支出';
           
           csvContent += `${safe(toROCDate(r.date))},${safe(typeStr)},${safe(r.target)},${safe(r.details)},${signAmount}\n`;
           subTotal += signAmount;
        });
        csvContent += `,,,,總計: ${subTotal}\n\n`;
      });
      csvContent += "\n";
    }

    // 5. 財務
    csvContent += "=== 財務收支明細 ===\n";
    csvContent += "日期,類型,科目,歸屬類別,具體對象,金額,備註\n";
    transactions.forEach(t => {
        let linkTypeTw = "一般專案";
        let linkedLabel = "-";
        if(t.linkedType === 'land') { const land = lands.find(l=>l.id===t.linkedId); linkedLabel = land ? (land.sellers.map(s=>s.name).join('/') || land.items[0]?.lotNumber) : '未知'; } 
        else if(t.linkedType === 'building') { const build = buildings.find(b=>b.id===t.linkedId); linkedLabel = build ? (build.sellers.map(s=>s.name).join('/') || build.address.substring(0,8)) : '未知'; } 
        else if(t.linkedType === 'buyer') { const buyer = buyers.find(b=>b.id===t.linkedId); linkedLabel = buyer ? buyer.name : '未知'; }
        const finalAmt = t.type === 'expense' ? `-${t.amount}` : t.amount;
        csvContent += `${safe(toROCDate(t.date))},${t.type === 'income' ? '收入' : '支出'},${safe(t.category)},${linkTypeTw},${safe(linkedLabel)},${finalAmt},${safe(t.note)}\n`;
    });
    csvContent += "\n";

    // 6. 交屋
    if (handoverData) {
      csvContent += "=== 交屋點交確認單 ===\n";
      csvContent += `點交日期,${safe(toROCDate(handoverData.handoverDate))}\n`;
      csvContent += `電單號碼,${safe(handoverData.electricityBill)}\n`;
      csvContent += `水單號碼,${safe(handoverData.waterBill)}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `[完整報表]_${projectName}.csv`;
    link.click();
};
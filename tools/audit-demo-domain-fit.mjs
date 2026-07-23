import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));

const domainTerms = {
  "人力資源": ["員工", "人事", "出勤", "薪資", "招募", "職缺", "績效", "人才", "訓練", "班表"],
  "內容管理": ["內容", "文章", "素材", "發布", "版本", "知識", "文件", "標籤"],
  "生活服務": ["會員", "預約", "服務", "門市", "訂單", "顧客"],
  "生產製造": ["工單", "產線", "製程", "設備", "良率", "生產", "排程", "批次", "物料"],
  "交通運輸": ["車輛", "路線", "班次", "駕駛", "派車", "運輸", "到站"],
  "企業協作": ["任務", "協作", "會議", "文件", "成員", "專案", "工作"],
  "企業營運": ["營運", "流程", "部門", "案件", "決策", "目標", "績效"],
  "宗教服務": ["信徒", "信眾", "點燈", "法會", "牌位", "捐獻", "收據", "宮廟", "寺廟"],
  "物流運輸": ["物流", "配送", "貨運", "路線", "車隊", "運單", "到貨"],
  "金融保險": ["金融", "保單", "理賠", "授信", "風險", "交易", "帳戶", "客戶"],
  "品質管理": ["品質", "稽核", "缺陷", "檢驗", "異常", "CAPA", "良率", "量測"],
  "客服管理": ["客服", "工單", "案件", "回覆", "客訴", "服務", "SLA"],
  "研發管理": ["研發", "設計", "版本", "變更", "BOM", "實驗", "專利", "產品"],
  "倉儲物流": ["倉庫", "庫存", "入庫", "出庫", "儲位", "揀貨", "盤點", "批號"],
  "財務會計": ["會計", "財務", "帳款", "發票", "預算", "付款", "收款", "成本", "對帳"],
  "專業服務": ["案件", "客戶", "顧問", "合約", "工時", "服務", "交付"],
  "採購供應鏈": ["採購", "供應商", "詢價", "報價", "訂單", "交期", "合約", "物料"],
  "教育": ["學生", "教師", "課程", "教案", "教材", "學習", "班級", "作業", "測驗"],
  "設備維護": ["設備", "保養", "維修", "故障", "工單", "巡檢", "備品"],
  "業務銷售": ["業務", "銷售", "客戶", "商機", "報價", "合約", "訂單", "目標"],
  "經營管理": ["經營", "策略", "目標", "績效", "決策", "風險", "預算"],
  "資訊安全": ["資安", "弱點", "事件", "威脅", "權限", "稽核", "風險", "防火牆"],
  "資訊科技": ["系統", "服務", "事件", "部署", "應用", "資料庫", "網路", "可用率"],
  "零售電商": ["商品", "訂單", "會員", "庫存", "門市", "購物", "促銷", "退貨"],
  "數據分析": ["資料", "指標", "分析", "模型", "報表", "洞察", "儀表板"],
  "餐飲旅宿": ["餐點", "訂位", "房間", "入住", "菜單", "桌位", "旅客", "住房"],
  "營建工程": ["工程", "工地", "施工", "承包", "材料", "進度", "安衛", "圖面"],
  "醫療照護": ["病患", "醫師", "護理", "診療", "病歷", "藥品", "照護", "床位"],
  "ESG 永續": ["永續", "碳排", "能源", "排放", "環境", "ESG", "盤查", "減碳"]
};

const genericMarkers = ["AI 評分趨勢", "階段分布", "營運統計表", "部門 / 客戶", "流程 01", "流程 02", "流程 03", "流程 04"];
const mojibakePatterns = [/\uFFFD/g, /(?:\?|嚗|雿|撌|蝞|銝|璅|頝|隞|摰|鞎|瘙|憸|霈|敺|蝯|撠){3,}/g];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedSignature(project, text) {
  const generic = text
    .replaceAll(project.title || "", "")
    .replaceAll(project.repoName || "", "")
    .replace(/\b\d+(?:[.,]\d+)*%?\b/g, "#")
    .replace(/[A-Z]{2,}/g, "X")
    .replace(/\s+/g, " ")
    .slice(0, 3000);
  return crypto.createHash("sha1").update(generic).digest("hex").slice(0, 12);
}

const entries = [];
const signatures = new Map();

for (const project of catalog.projects) {
  const file = path.join(root, project.localPath, "index.html");
  const issues = [];
  let text = "";
  let signature = "";
  if (!fs.existsSync(file)) {
    issues.push({ code: "missing-static-demo", severity: "critical", message: "缺少 index.html" });
  } else {
    const html = fs.readFileSync(file, "utf8");
    text = visibleText(html);
    signature = normalizedSignature(project, text);
    if (!signatures.has(signature)) signatures.set(signature, []);
    signatures.get(signature).push(project.repoName);

    const linkedScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((src) => !/^https?:\/\//i.test(src) && !src.includes("/_next/"));
    const scriptText = linkedScripts
      .map((src) => {
        const pathname = src.split(/[?#]/, 1)[0];
        const relative = pathname
          .replace(/^\/demos\/[^/]+\//, "")
          .replace(/^\.?\//, "");
        const candidate = path.join(root, project.localPath, relative);
        return fs.existsSync(candidate) ? fs.readFileSync(candidate, "utf8") : "";
      })
      .join("\n");
    const linkedStyles = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css(?:\?[^"']*)?)["']/gi)]
      .map((match) => match[1])
      .filter((href) => !/^https?:\/\//i.test(href) && !href.includes("/_next/"));
    const styleText = linkedStyles
      .map((href) => {
        const pathname = href.split(/[?#]/, 1)[0];
        const relative = pathname
          .replace(/^\/demos\/[^/]+\//, "")
          .replace(/^\.?\//, "");
        const candidate = path.join(root, project.localPath, relative);
        return fs.existsSync(candidate) ? fs.readFileSync(candidate, "utf8") : "";
      })
      .join("\n");
    const retiredLegacyOverlay = styleText.includes("Generic cross-project analytics are retired");
    const inspectedText = `${text}\n${scriptText}`;
    const markerHits = genericMarkers.filter((marker) => inspectedText.includes(marker));
    const terms = domainTerms[project.category] || [];
    const domainHits = terms.filter((term) => text.toLowerCase().includes(term.toLowerCase()));
    const mojibakeHits = mojibakePatterns.reduce((count, pattern) => count + (inspectedText.match(pattern)?.length || 0), 0);

    if (markerHits.length >= 3 && !retiredLegacyOverlay) {
      issues.push({
        code: "generic-analytics-template",
        severity: "high",
        message: `載入 ${markerHits.length} 個通用分析模板欄位`,
        evidence: markerHits
      });
    }
    if (terms.length && domainHits.length === 0) {
      issues.push({
        code: "missing-domain-language",
        severity: "high",
        message: `頁面未出現「${project.category}」核心業務詞`,
        expected: terms.slice(0, 8)
      });
    } else if (terms.length && domainHits.length < 2) {
      issues.push({
        code: "weak-domain-language",
        severity: "medium",
        message: `僅命中 ${domainHits.length} 個領域詞`,
        evidence: domainHits,
        expected: terms.slice(0, 8)
      });
    }
    if (mojibakeHits > 0) {
      issues.push({
        code: "mojibake",
        severity: mojibakeHits >= 3 ? "critical" : "high",
        message: `偵測到 ${mojibakeHits} 組疑似亂碼`
      });
    }
    if (text.length < 220) {
      issues.push({ code: "thin-demo", severity: "high", message: `可讀內容過少（${text.length} 字元）` });
    }
    const controls = (html.match(/<(button|input|select|textarea)\b/gi) || []).length;
    if (controls < 2) {
      issues.push({ code: "low-interactivity", severity: "medium", message: `僅有 ${controls} 個可操作控制項` });
    }
  }
  entries.push({
    id: project.id,
    repoName: project.repoName,
    title: project.title,
    category: project.category,
    demoUrl: project.demoUrl,
    signature,
    issues
  });
}

for (const entry of entries) {
  const group = signatures.get(entry.signature) || [];
  if (group.length >= 4) {
    entry.issues.push({
      code: "repeated-template",
      severity: group.length >= 10 ? "high" : "medium",
      message: `與另外 ${group.length - 1} 個專案具有近似內容骨架`,
      groupSize: group.length,
      examples: group.filter((repo) => repo !== entry.repoName).slice(0, 5)
    });
  }
}

const rank = { critical: 4, high: 3, medium: 2, low: 1 };
for (const entry of entries) {
  entry.risk = entry.issues.reduce((max, issue) => Math.max(max, rank[issue.severity] || 0), 0);
}
entries.sort((a, b) => b.risk - a.risk || b.issues.length - a.issues.length || a.id - b.id);

const counts = {
  total: entries.length,
  clean: entries.filter((entry) => entry.issues.length === 0).length,
  flagged: entries.filter((entry) => entry.issues.length > 0).length,
  critical: entries.filter((entry) => entry.issues.some((issue) => issue.severity === "critical")).length,
  high: entries.filter((entry) => entry.issues.some((issue) => issue.severity === "high")).length,
  mediumOnly: entries.filter((entry) => entry.risk === 2).length
};
const byCode = {};
for (const entry of entries) {
  for (const issue of entry.issues) byCode[issue.code] = (byCode[issue.code] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: "All locally integrated JVision demos",
  methodology: [
    "檢查靜態入口是否存在與內容量",
    "檢查分類領域詞是否出現在實際 Demo",
    "偵測 AI 評分／階段分布／流程編號等通用模板殘留",
    "偵測疑似中文亂碼",
    "檢查基本互動控制項",
    "比對大量重複內容骨架"
  ],
  summary: { ...counts, byCode },
  projects: entries
};

const jsonPath = path.join(root, "docs", "DEMO_DOMAIN_FIT_AUDIT.json");
const mdPath = path.join(root, "docs", "DEMO_DOMAIN_FIT_AUDIT.md");
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

const top = entries.filter((entry) => entry.issues.length).slice(0, 80);
const md = [
  "# Demo 主題一致性稽核",
  "",
  `產生時間：${report.generatedAt}`,
  "",
  "## 摘要",
  "",
  `- 專案總數：${counts.total}`,
  `- 無規則命中：${counts.clean}`,
  `- 需要人工複核：${counts.flagged}`,
  `- 嚴重問題：${counts.critical}`,
  `- 高風險問題：${counts.high}`,
  `- 僅中度風險：${counts.mediumOnly}`,
  "",
  "### 問題類型",
  "",
  ...Object.entries(byCode).sort((a, b) => b[1] - a[1]).map(([code, count]) => `- ${code}: ${count}`),
  "",
  "## 優先複核清單（前 80 筆）",
  "",
  "| ID | 專案 | 分類 | 風險 | 問題 |",
  "|---:|---|---|---|---|",
  ...top.map((entry) => {
    const severity = entry.risk === 4 ? "嚴重" : entry.risk === 3 ? "高" : "中";
    return `| ${entry.id} | ${entry.title} (\`${entry.repoName}\`) | ${entry.category} | ${severity} | ${entry.issues.map((issue) => issue.message).join("；")} |`;
  }),
  "",
  "> 此報告是自動化風險篩選，不等同於逐案產品驗收；命中項目需要依 README 與實際操作流程再人工複核。"
].join("\n");
fs.writeFileSync(mdPath, `${md}\n`);

console.log(JSON.stringify(report.summary, null, 2));

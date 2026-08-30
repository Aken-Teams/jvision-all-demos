/**
 * 接 ui-ux-pro-max 技能，替每套 demo 取一份真的設計系統。
 *
 * 這個技能的資料是英文的（79 種風格、192 組配色、74 組字體搭配），而站上的
 * 分類是中文，直接把中文題目丟進去搜不到東西。所以先把分類對成產業關鍵字，
 * 再加上三個刻度（variance／density／motion）決定它給哪一種風格。
 *
 * 三個刻度由 repo 名稱的雜湊決定：同一套永遠拿到同一份設計系統，而不同套
 * 即使同產業也會落在不同的風格上（實測同一個 query 在 variance 2/5/9 分別
 * 給出 Swiss、Dark OLED、Brutalism）。
 */
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { ROOT } from "./forge-common.mjs";

const SCRIPT = path.join(ROOT, ".agents", "skills", "ui-ux-pro-max", "scripts", "search.py");

/* 中文分類 → 技能資料裡的產業關鍵字。查得準不準幾乎全看這一層。 */
const CATEGORY_EN = {
  "生產製造": "manufacturing production operations dashboard",
  "品質管理": "quality inspection compliance dashboard",
  "AI 工程平台": "developer platform ai tooling console",
  "零售電商": "retail ecommerce merchandising dashboard",
  "業務銷售": "sales crm pipeline dashboard",
  "採購供應鏈": "procurement supply chain sourcing dashboard",
  "設備維護": "maintenance equipment reliability monitoring",
  "專業服務": "professional services consulting workspace",
  "營建工程": "construction project field management",
  "餐飲旅宿": "hospitality restaurant hotel operations",
  "人力資源": "hr people management workforce dashboard",
  "財務會計": "finance accounting ledger dashboard",
  "資訊科技": "it operations infrastructure console",
  "企業協作": "team collaboration workspace productivity",
  "數據分析": "analytics business intelligence dashboard",
  "醫療照護": "healthcare clinical patient records",
  "研發管理": "research development project tracking",
  "客服管理": "customer support helpdesk ticketing",
  "物流運輸": "logistics shipping fleet tracking",
  "教育": "education learning courses platform",
  "交通運輸": "transportation transit fleet operations",
  "金融保險": "fintech banking insurance dashboard",
  "倉儲物流": "warehouse inventory fulfillment operations",
  "房地產與物業": "real estate property management",
  "資訊安全": "security operations threat monitoring",
  "ESG 永續": "sustainability esg carbon reporting",
  "生活服務": "local services booking marketplace",
  "經營管理": "executive management strategy dashboard",
  "宗教服務": "community organization membership management",
};

function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/** 三個刻度。各取雜湊的不同位元段，否則會同步變化而只剩幾種固定搭配。 */
export function dialsFor(repoName) {
  const h = hash(repoName);
  return {
    variance: ((h >>> 0) % 10) + 1,
    density: ((h >>> 7) % 6) + 5,   // 這些都是資訊密集的內部系統，不要太空
    motion: ((h >>> 13) % 7) + 1,
  };
}

/**
 * 取設計系統。技能查不到或壞掉時回 null，呼叫端自己決定要不要繼續——
 * 這是加分項，不該讓整條產線停下來。
 */
export function designSystem(repoName, category, title) {
  const d = dialsFor(repoName);
  const q = `${CATEGORY_EN[category] || "business operations dashboard"} ${String(title || "").slice(0, 24)}`.trim();
  return new Promise((resolve) => {
    execFile("python3", [SCRIPT, q, "--design-system",
      "--variance", String(d.variance), "--density", String(d.density), "--motion", String(d.motion)],
    { cwd: ROOT, timeout: 90000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout || stdout.length < 400) return resolve(null);
      /* 只留框線裡的內容，去掉裝飾字元——那些框線佔掉 prompt 不小的篇幅，
         而 codex 要的是裡面的值。 */
      const text = stdout
        .split("\n")
        .filter((l) => !/^[╔╚═╝╗]/.test(l))
        .map((l) => l.replace(/^[│├┌└]+/, "").replace(/[│]+\s*$/, "").replace(/─+/g, "─").trimEnd())
        .filter((l) => l.trim())
        .join("\n");
      resolve({ text, dials: d, query: q });
    });
  });
}


/** 技能有沒有裝。沒裝就退回內建的風格矩陣，不讓整條產線停下來。 */
export const available = () => fs.existsSync(SCRIPT);

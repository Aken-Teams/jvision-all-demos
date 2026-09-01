/**
 * 從既有的規格資料長出 PRD / SDD / TDD 三份文件。
 *
 * 刻意不預先產生檔案：1,978 套 × 3 份約 90MB，而 .git 已經 360MB，
 * 而且那些內容 100% 從 content/details 與 content/schema 推導得出來——
 * 存成檔案只會多一份會跟規格脫節的副本。改規格、改欄位名之後，
 * 預先產生的那份就開始說謊，而且沒有人會發現。
 *
 * 同一支同時給瀏覽器（專案頁線上閱覽／下載）與 Node（交付到 GitHub 時寫檔）用，
 * 所以是純函式、不碰 DOM 也不碰 fs。
 */

const nz = (v, alt = "") => (v == null || v === "" ? alt : String(v));
const list = (a) => (Array.isArray(a) ? a : []);

/** Markdown 表格。欄寬不對齊沒關係，但每一格的 | 必須跳脫，否則整行會裂開。 */
function table(headers, rows) {
  const esc = (s) => nz(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const out = [`| ${headers.map(esc).join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`];
  for (const r of rows) out.push(`| ${r.map(esc).join(" | ")} |`);
  return out.join("\n");
}

const head = (d, kind) => [
  `# ${nz(d.title)}　${kind}`,
  "",
  table(["項目", "內容"], [
    ["系統代號", nz(d.repoName)],
    ["產業分類", nz(d.category)],
    ["系統類型", nz(d.systemType)],
    ["文件版本", "v1（依系統規格自動產生）"],
  ]),
  "",
].join("\n");

/* ── PRD：要做什麼、為誰做、怎麼算做到了 ───────────────── */
export function buildPRD(d, schema) {
  const s = [];
  s.push(head(d, "產品需求文件 PRD"));

  s.push("## 1. 系統概述\n", nz(d.hero?.tagline || d.system?.summary), "");
  const hi = list(d.hero?.highlights);
  if (hi.length) s.push(table(["指標", "數值"], hi.map((h) => [h.label, h.value])), "");

  s.push("## 2. 使用者與使用情境\n");
  const users = list(d.system?.users);
  if (users.length) s.push(users.map((u) => `- ${nz(u)}`).join("\n"), "");
  if (d.system?.dailyUse) s.push(`**日常使用方式**：${nz(d.system.dailyUse)}`, "");

  s.push("## 3. 要解決的問題\n", nz(d.problem?.situation), "");
  const pains = list(d.problem?.pains);
  if (pains.length) {
    s.push("### 3.1 傳統做法的困境\n");
    s.push(table(["#", "困境", "說明"], pains.map((p, i) => [`P-${String(i + 1).padStart(2, "0")}`, p.title, p.desc])), "");
  }
  if (d.problem?.impact) s.push("### 3.2 不解決的後果\n", nz(d.problem.impact), "");

  s.push("## 4. 功能需求\n");
  const mods = list(d.architecture?.modules);
  if (mods.length) {
    s.push(table(["編號", "功能", "說明"], mods.map((m, i) => [`FR-${String(i + 1).padStart(2, "0")}`, m.name, m.desc])), "");
  }

  s.push("## 5. 資料需求\n");
  const tables = list(schema?.tables);
  if (tables.length) {
    for (const t of tables) {
      s.push(`### ${nz(t.title, t.name)}\n`);
      s.push(table(["欄位", "型別"], list(t.columns).map((c) => [c.label, c.type || "text"])), "");
    }
  } else {
    const cols = list(d.records?.columns);
    if (cols.length) s.push(table(["欄位"], cols.map((c) => [c.label])), "");
  }

  s.push("## 6. 輸入與產出\n");
  const ins = list(d.flow?.inputs);
  if (ins.length) s.push("**輸入**\n", ins.map((x) => `- ${nz(x)}`).join("\n"), "");
  if (d.flow?.output) s.push(`**產出**：${nz(d.flow.output)}`, "");

  s.push("## 7. 驗收指標\n");
  const kpis = list(d.benefits?.kpis);
  if (kpis.length) {
    s.push(table(["指標", "導入前", "導入後", "單位"],
      kpis.map((k) => [k.label, k.before, k.after, k.unit || ""])), "");
  }
  const pts = list(d.benefits?.points);
  if (pts.length) s.push(pts.map((p) => `- **${nz(p.title)}**：${nz(p.desc)}`).join("\n"), "");

  const rules = list(d.decisionRules);
  if (rules.length) {
    s.push("## 8. 判斷規則\n");
    s.push(table(["編號", "規則", "依據"], rules.map((r) => [r.id, r.rule, r.evidence])), "");
  }
  return s.join("\n");
}

/* ── SDD：怎麼做出來的 ─────────────────────────────────── */
export function buildSDD(d, schema) {
  const s = [];
  s.push(head(d, "系統設計文件 SDD"));

  s.push("## 1. 架構總覽\n");
  s.push(table(["項目", "內容"], [
    ["核心系統", nz(d.architecture?.core)],
    ["進入點", list(d.architecture?.entry).join("、")],
    ["資料來源", list(d.architecture?.data).join("、")],
  ]), "");

  s.push("## 2. 模組設計\n");
  const mods = list(d.architecture?.modules);
  if (mods.length) {
    s.push(table(["模組", "職責"], mods.map((m) => [m.name, m.desc])), "");
  }

  s.push("## 3. 資料模型\n");
  const tables = list(schema?.tables);
  if (tables.length) {
    for (const t of tables) {
      s.push(`### ${nz(t.title, t.name)}（實體表 \`${nz(t.name)}\`）\n`);
      s.push(`出現在第 ${nz(t.screen, "?")} 個畫面。\n`);
      s.push(table(["欄位鍵", "顯示名稱", "型別"],
        list(t.columns).map((c) => [`\`${c.key}\``, c.label, c.type || "text"])), "");
    }
    s.push([
      "> 表格與資料表的對應是靠**表頭文字**建立的，不是靠 CSS 選擇器——",
      "> 版面改了不會壞，但表頭的字改了就會接不上。",
    ].join("\n"), "");
  }

  s.push("## 4. 流程設計\n");
  const stages = list(d.flow?.stages);
  if (stages.length) {
    s.push(table(["階段", "名稱", "負責角色", "說明"],
      stages.map((x, i) => [`S${i + 1}`, x.title, x.role, x.desc])), "");
  }
  const lanes = list(d.flow?.lanes);
  if (lanes.length) {
    s.push("### 4.1 角色分工\n");
    s.push(table(["角色", "負責步驟"], lanes.map((l) => [l.role, list(l.steps).join(" → ")])), "");
  }
  const dec = list(d.flow?.decisions);
  if (dec.length) {
    s.push("### 4.2 分支判斷\n");
    s.push(table(["判斷點", "是", "否"], dec.map((x) => [x.label, x.yes, x.no])), "");
  }

  s.push("## 5. 介面設計\n");
  s.push([
    `六個畫面，以 \`data-i\` 標記並支援 \`#go=<n>\` 深連結。`,
    stages.length ? `\n${stages.map((x, i) => `${i + 1}. ${nz(x.title)}`).join("\n")}` : "",
  ].join("\n"), "");

  s.push("## 6. 技術選型\n");
  s.push(table(["層次", "展示版", "客戶實例版"], [
    ["前端", "單一 index.html，不引用本地檔案", "同左，另注入執行時"],
    ["資料", "頁面內的示範資料", "各自獨立的 MySQL 資料庫"],
    ["介面", "無", "REST：`GET/POST/PATCH/DELETE /api/t/<表>`"],
    ["並行控制", "無", "`rev` 樂觀鎖，衝突回 409"],
    ["圖表", "CDN 圖表庫", "同左"],
  ]), "");
  return s.join("\n");
}

/* ── TDD：怎麼證明它真的做到了 ─────────────────────────── */
export function buildTDD(d, schema) {
  const s = [];
  s.push(head(d, "測試設計文件 TDD"));

  s.push("## 1. 測試範圍\n");
  s.push([
    "| 層次 | 測什麼 |",
    "|---|---|",
    "| 靜態 | 檔案大小、六個畫面、深連結、無本地腳本、無 setInterval、表頭非樣板 |",
    "| 畫面 | 六個畫面互異、首屏畫得出來、圖表有像素、三種寬度不溢出 |",
    "| 資料 | 欄位型別、必填、樂觀鎖衝突 |",
    "| 流程 | 每個階段的輸入與產出 |",
  ].join("\n"), "");

  s.push("## 2. 功能測試案例\n");
  const stages = list(d.flow?.stages);
  if (stages.length) {
    s.push(table(["編號", "情境", "操作者", "預期結果"],
      stages.map((x, i) => [`TC-${String(i + 1).padStart(2, "0")}`, x.title, x.role, x.desc])), "");
  }

  const dec = list(d.flow?.decisions);
  if (dec.length) {
    s.push("### 2.1 分支測試（每個判斷點的兩條路都要走過）\n");
    const rows = [];
    dec.forEach((x, i) => {
      rows.push([`TC-D${i + 1}a`, `${nz(x.label)} → 成立`, nz(x.yes)]);
      rows.push([`TC-D${i + 1}b`, `${nz(x.label)} → 不成立`, nz(x.no)]);
    });
    s.push(table(["編號", "條件", "預期"], rows), "");
  }

  const rules = list(d.decisionRules);
  if (rules.length) {
    s.push("### 2.2 判斷規則測試\n");
    s.push(table(["編號", "規則", "驗證依據"],
      rules.map((r, i) => [`TC-R${i + 1}`, r.rule, r.evidence])), "");
  }

  s.push("## 3. 資料驗證\n");
  const tables = list(schema?.tables);
  if (tables.length) {
    for (const t of tables) {
      s.push(`### ${nz(t.title, t.name)}\n`);
      s.push(table(["欄位", "型別", "驗證重點"], list(t.columns).map((c) => [
        c.label, c.type || "text",
        c.type === "int" || c.type === "number" ? "非數字要被拒絕、邊界值"
          : c.type === "date" ? "格式與不合理日期"
          : c.type === "percent" ? "0–100 範圍"
          : "長度上限、跳脫字元不破版",
      ])), "");
    }
    s.push("**並行**：兩個人同時改同一筆，後送出的要收到 409 並看到目前的值，不可以默默覆蓋。\n");
  }

  s.push("## 4. 驗收條件\n");
  const kpis = list(d.benefits?.kpis);
  if (kpis.length) {
    s.push(table(["指標", "基準", "目標", "單位", "判定"],
      kpis.map((k) => [k.label, k.before, k.after, k.unit || "", `達到 ${nz(k.after)}${nz(k.unit)} 才算通過`])), "");
  }

  s.push("## 5. 非功能測試\n");
  s.push([
    "| 項目 | 判準 |",
    "|---|---|",
    "| 響應式 | 390 / 768 / 1440 三種寬度，橫向溢出不超過 2px |",
    "| console | 零錯誤 |",
    "| 首屏 | 不靠捲動就看得到內容 |",
    "| 深連結 | `#go=1`～`#go=6` 各自落在正確畫面 |",
    "| 對比 | 正文對背景至少 4.5:1 |",
    "| 鍵盤 | 可聚焦元素有看得見的 focus ring |",
  ].join("\n"), "");
  return s.join("\n");
}

export const DOCS = [
  { key: "prd", name: "PRD", full: "產品需求文件", build: buildPRD, icon: "description" },
  { key: "sdd", name: "SDD", full: "系統設計文件", build: buildSDD, icon: "schema" },
  { key: "tdd", name: "TDD", full: "測試設計文件", build: buildTDD, icon: "checklist" },
];

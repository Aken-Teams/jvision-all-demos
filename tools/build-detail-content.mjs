/**
 * build-detail-content.mjs
 * ----------------------------------------------------------------------------
 * Generates content/details/<repo>.json for every catalog project so the
 * enriched project detail page (project.html) is driven by project-specific
 * data instead of hard-coded templates.
 *
 * - 400 AI/smart-mfg projects: mapped from content/practical-scenarios.json
 *   (real risks, stages, decision rules, personas) so pains / flow stages /
 *   rules are project-specific.
 * - legacy projects (no scenario): generated from projects-index.json +
 *   shared/system-content.js and flagged "generated":"needs-review".
 * - The 5 hand-authored pilot files are preserved (never overwritten).
 *
 * Run: node tools/build-detail-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const idx = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const scenarios = JSON.parse(fs.readFileSync(path.join(root, "content/practical-scenarios.json"), "utf8")).scenarios;

// ---- load classify() + TYPES from the shared runtime (browser file) ----
const scSrc = fs.readFileSync(path.join(root, "shared/system-content.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(scSrc, sandbox);
const JV = sandbox.window.JVSystemContent;

const PILOTS = new Set([
  "jvision-ai-case-001-production-scheduler",
  "jvision-smart-mfg-111-customer-relationship-management",
  "jvision-ai-case-006-quality-root-cause",
  "jvision-ai-case-070-financial-health-report",
  "jvision-production-order",
]);

const splitList = (s) => String(s || "").split(/[、,，/／·]/).map((x) => x.trim()).filter(Boolean);
const round = (v) => (Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v));
const ramp = (a, b, n = 6) => Array.from({ length: n }, (_, i) => round(a + (b - a) * (i / (n - 1))));

// pain icon by risk keyword
const PAIN_ICONS = [
  [/料|缺|庫存|補/, "inventory"], [/設備|負載|機|稼動|停機/, "warning"],
  [/交期|期限|逾期|時效|延遲/, "schedule"], [/品質|不良|規格|超差|瑕疵/, "rule"],
  [/客戶|客訴|抱怨|投訴/, "sentiment_dissatisfied"], [/風險|審核|核准|合規/, "gpp_maybe"],
  [/資料|散|文件|版本/, "table_view"], [/成本|費用|金額|預算/, "payments"],
  [/人力|排班|出勤|人員/, "groups"], [/安全|資安|漏洞|威脅/, "security"],
];
const painIcon = (t) => (PAIN_ICONS.find(([re]) => re.test(t)) || [, "warning"])[1];

// per-category improvement KPI templates: [label, unit, before, after]
const CAT_KPI = {
  "生產製造": [["排程作業工時", "小時/日", 8, 1.5], ["準時交付率", "%", 80, 95], ["缺料停線次數", "次/月", 12, 3], ["設備稼動率", "%", 74, 88]],
  "品質管理": [["批號追溯時間", "分鐘", 180, 15], ["客訴平均關案", "天", 21, 9], ["改善驗證率", "%", 64, 98], ["重複不良率", "%", 6, 2]],
  "業務銷售": [["商機轉換率", "%", 18, 27], ["平均回應時間", "小時", 26, 6], ["客戶資料完整率", "%", 62, 94], ["報價逾期流失", "件/月", 9, 2]],
  "採購供應鏈": [["採購前置時間", "天", 12, 5], ["準時到貨率", "%", 82, 96], ["缺料預警覆蓋", "%", 40, 92], ["議價作業工時", "小時/週", 8, 2]],
  "人力資源": [["薪資作業工時", "小時/月", 40, 8], ["出勤異常處理", "分鐘", 30, 5], ["招募到位天數", "天", 45, 28], ["表單簽核時效", "天", 3, 1]],
  "倉儲物流": [["揀貨作業工時", "小時/日", 7, 2], ["庫存準確率", "%", 88, 99], ["出貨延遲率", "%", 9, 2], ["盤點工時", "小時/月", 16, 3]],
  "研發管理": [["設計變更工時", "小時", 8, 2], ["文件版本錯誤", "件/月", 6, 1], ["專案準時率", "%", 70, 92], ["資料查找時間", "分鐘", 30, 5]],
  "經營管理": [["報表產出工時", "小時", 16, 1], ["異常發現時效", "天", 3, 1], ["決策資料覆蓋", "%", 55, 92], ["跨部門對齊", "%", 60, 90]],
  "ESG 永續": [["盤查作業工時", "小時", 40, 8], ["數據完整率", "%", 60, 95], ["減碳目標達成", "%", 50, 88], ["用能異常反應", "小時", 24, 2]],
  "零售電商": [["補貨反應", "小時", 24, 4], ["熱銷掌握率", "%", 60, 92], ["缺貨率", "%", 12, 4], ["結帳等待", "分鐘", 6, 1.5]],
  "教育": [["排課作業工時", "小時/週", 6, 1.5], ["作業批改時效", "天", 5, 1], ["出席掌握率", "%", 70, 95], ["學習進度可視", "%", 45, 90]],
  "企業協作": [["跨部門協調工時", "小時/週", 8, 2], ["任務準時率", "%", 68, 92], ["資訊落差", "%", 30, 8], ["文件查找時間", "分鐘", 20, 3]],
  "營建工程": [["日報彙整工時", "小時/日", 3, 0.5], ["進度落後預警", "%", 40, 90], ["估驗計價天數", "天", 10, 4], ["缺失改善時效", "天", 7, 2]],
  "醫療照護": [["候診等待", "分鐘", 35, 12], ["回診完成率", "%", 70, 92], ["申報退件率", "%", 8, 2], ["紀錄作業工時", "小時/日", 4, 1]],
  "財務會計": [["月結作業天數", "天", 6, 2], ["對帳錯誤", "件/月", 8, 1], ["帳款逾期率", "%", 15, 5], ["報表產出工時", "小時", 16, 1]],
  "金融保險": [["案件平均處理", "天", 7, 3], ["風險檢出率", "%", 70, 95], ["文件缺漏率", "%", 12, 3], ["覆核作業工時", "小時/日", 5, 1]],
  "資訊科技": [["事件平均處理", "分鐘", 120, 30], ["系統可用率", "%", 97, 99], ["SLA達成率", "%", 85, 98], ["資產盤點工時", "小時/月", 20, 4]],
  "交通運輸": [["派車規劃工時", "小時/日", 4, 1], ["準時配送率", "%", 85, 97], ["空車率", "%", 22, 10], ["油耗異常反應", "小時", 24, 3]],
  "設備維護": [["非計畫停機", "小時/月", 24, 6], ["保養準時率", "%", 75, 96], ["備品缺料", "次/月", 10, 2], ["故障排除時間", "分鐘", 90, 25]],
  "資訊安全": [["告警分流時間", "分鐘", 45, 8], ["事件平均處理", "小時", 12, 3], ["弱點修補率", "%", 68, 96], ["合規稽核工時", "小時/月", 30, 6]],
  "專業服務": [["案件文件工時", "小時", 6, 1.5], ["期限掌握率", "%", 72, 96], ["計費遺漏", "%", 10, 2], ["進度查找時間", "分鐘", 20, 3]],
  "物流運輸": [["派車規劃工時", "小時/日", 4, 1], ["準時配送率", "%", 85, 97], ["空車率", "%", 22, 10], ["簽收回單時效", "小時", 24, 2]],
  "餐飲旅宿": [["結帳等待", "分鐘", 8, 2], ["翻桌率", "%", 70, 90], ["備料浪費", "%", 15, 6], ["訂位掌握率", "%", 65, 94]],
  "生活服務": [["預約作業工時", "小時/日", 3, 0.5], ["準時到府率", "%", 82, 96], ["重工率", "%", 12, 4], ["客訴關案", "天", 4, 1]],
  "數據分析": [["報表產出工時", "小時", 16, 1], ["異常發現時效", "天", 3, 1], ["資料覆蓋率", "%", 55, 92], ["決策反應時間", "天", 5, 1]],
  "客服管理": [["首次回應時間", "分鐘", 30, 5], ["一次解決率", "%", 60, 88], ["客訴關案", "天", 5, 2], ["滿意度", "%", 72, 92]],
  "房地產與物業": [["報修處理", "小時", 24, 4], ["繳費即時率", "%", 70, 94], ["巡檢覆蓋", "%", 60, 95], ["公設調度工時", "小時/週", 6, 1]],
  "宗教服務": [["活動籌備工時", "小時", 20, 5], ["報名掌握率", "%", 65, 94], ["物資盤點", "小時", 6, 1], ["志工調度時效", "天", 3, 1]],
};
const DEFAULT_KPI = [["人工作業時間", "分鐘/日", 90, 25], ["處理時效", "小時", 24, 4], ["資料正確率", "%", 78, 96], ["例外處理耗時", "分鐘", 40, 10]];

function buildKpis(p) {
  const tpl = CAT_KPI[p.category] || DEFAULT_KPI;
  const j = (v, k) => { const f = 1 + (((p.id * k) % 7) - 3) * 0.02; let x = round(v * f); if (tpl[0][1] === "%" || String(v).length && v <= 100) x = Math.min(x, 99); return x; };
  return tpl.map(([label, unit, before, after], i) => ({ label, before: j(before, i + 2), after: j(after, i + 5), unit }));
}
function buildTrend(kpis) {
  const up = kpis.find((k) => k.after > k.before && k.unit === "%") || kpis.find((k) => k.unit === "%") || kpis[0];
  return { labels: ["第1週", "第2週", "第3週", "第4週", "第5週", "第6週"], series: [{ name: up.label + (up.unit === "%" ? " %" : ""), data: ramp(up.before, up.after) }] };
}
const POINTS = [
  { title: "減少人工往返", desc: "資料集中、流程可追蹤，省下每天反覆確認與追蹤的時間。" },
  { title: "異常更早發現", desc: "風險自動排序與提醒，把問題擋在事故發生之前。" },
  { title: "決策更快更準", desc: "營運數據即時彙整，主管一眼掌握該關注的重點。" },
];

function baseParts(p) {
  const sc = JV.get(p);
  const users = splitList(p.primaryUser || "部門使用者與主管");
  const kpis = buildKpis(p);
  return {
    id: p.id, repoName: p.repoName, title: p.title, category: p.category, systemType: sc.label,
    hero: {
      tagline: sc.tagline,
      highlights: [
        { icon: "groups", label: "適用角色", value: users.length + " 種" },
        { icon: "conversion_path", label: "作業階段", value: "多階段流程" },
        { icon: "monitoring", label: "關鍵指標", value: kpis.length + " 項" },
      ],
    },
    system: { summary: (p.description || "") + "把散落的作業，整合成一個「可操作、可追蹤、可稽核」的單一平台。", users, dailyUse: p.dailyUse || "" },
    architecture: { entry: sc.entry, core: sc.label, modules: sc.modules, data: sc.data },
    benefits: { kpis, trend: buildTrend(kpis), points: POINTS },
    _users: users, _sc: sc, _kpis: kpis,
  };
}

function fromScenario(p, sc) {
  const b = baseParts(p);
  const profile = sc.profile || {};
  const risks = (profile.risks || []).slice(0, 5);
  const obj = profile.object || "案件";
  const owner = (sc.persona && sc.persona.operator) || profile.owner || b._users[0] || "承辦";
  const supervisor = (sc.persona && sc.persona.supervisor) || b._users[1] || "主管";
  const rules = (sc.decisionRules || []).map((r) => ({ id: r.id, rule: r.rule, evidence: r.evidence }));
  const pains = risks.map((r) => ({ icon: painIcon(r), title: r, desc: `${obj}一旦遇到「${r}」，靠人工追蹤容易遺漏、反應太慢，往往拖到出事才被發現。` }));
  if (pains.length < 3) pains.unshift({ icon: "table_view", title: "資料分散難對齊", desc: "資料散在試算表與訊息，版本混亂、交接就斷。" });
  const stages = (profile.stages || []).map((st, i, arr) => ({
    title: st, role: i >= arr.length - 1 ? supervisor : owner,
    desc: `${obj}進入「${st}」階段，${owner}依系統提示完成作業並更新狀態，讓後段能接手。`,
    rule: rules[i] ? rules[i].id : undefined,
  }));
  const fields = profile.fields || (p.customerWorkflow && p.customerWorkflow.fields) || ["作業對象", "期限", "負責人"];
  b.hero.highlights[1].value = (stages.length || 4) + " 階段";
  b.problem = { situation: p.businessSituation || "", pains, impact: sc.triggerEvent ? `例如「${sc.triggerEvent}」，人工作業下容易延誤、也難事後追溯。` : "重複人工與資訊分散，讓交期、品質與決策都慢半拍。" };
  b.flow = { inputs: fields, stages: stages.length ? stages : undefined, output: (p.customerWorkflow && p.customerWorkflow.output) || `${obj}處理結果與操作紀錄` };
  b.decisionRules = rules.length ? rules : undefined;
  b.generated = "auto";
  delete b._users; delete b._sc; delete b._kpis;
  return b;
}

function fromLegacy(p) {
  const b = baseParts(p);
  const cw = p.customerWorkflow || {};
  const steps = (cw.steps && cw.steps.length) ? cw.steps : ["建立資料", "系統處理", "確認並留存"];
  const owner = b._users[0] || "承辦", supervisor = b._users[1] || "主管";
  b.hero.highlights[1].value = steps.length + " 階段";
  b.problem = {
    situation: p.businessSituation || "",
    pains: [
      { icon: "table_view", title: "試算表往返", desc: "資料散在各處試算表與訊息，版本混亂、難以對齊。" },
      { icon: "person_search", title: "人工追蹤", desc: "靠人一件件盯進度、追負責人，耗時又容易遺漏。" },
      { icon: "warning", title: "異常太晚發現", desc: "問題往往等到出事才被看到，錯過最佳處理時機。" },
    ],
    impact: "重複人工與資訊分散，讓交期、品質與決策都慢半拍。",
  };
  b.flow = {
    inputs: (cw.fields && cw.fields.length) ? cw.fields : ["名稱／編號", "負責人／期限"],
    stages: steps.map((st, i, arr) => ({ title: st, role: i >= arr.length - 1 ? supervisor : owner, desc: `於「${st}」階段完成對應作業並更新狀態。` })),
    output: cw.output || "處理結果與操作紀錄",
  };
  b.generated = "needs-review";
  delete b._users; delete b._sc; delete b._kpis;
  return b;
}

const outDir = path.join(root, "content/details");
fs.mkdirSync(outDir, { recursive: true });
let written = 0, skipped = 0, scenario = 0, legacy = 0;
for (const p of idx.projects) {
  if (PILOTS.has(p.repoName)) { skipped++; continue; }
  const sc = scenarios[p.repoName];
  const detail = sc ? fromScenario(p, sc) : fromLegacy(p);
  if (sc) scenario++; else legacy++;
  fs.writeFileSync(path.join(outDir, p.repoName + ".json"), JSON.stringify(detail, null, 2) + "\n");
  written++;
}
console.log(`Wrote ${written} detail files (scenario:${scenario}, legacy:${legacy}); preserved ${skipped} hand-authored pilots.`);

/**
 * generate-stitch-prompts.mjs
 * -------------------------------------------------------------
 * Reads projects-index.json and emits ONE self-contained Google Stitch
 * prompt file per project (463 total) into docs/stitch-prompts/.
 *
 * Each file contains, in English instructions with Traditional-Chinese UI copy:
 *   - a compact shared STYLE block (blue/white professional SaaS)
 *   - SCREEN 1: 專案介紹頁 (problem → system → features → flow → benefits → demo entry)
 *   - SCREEN 2: the demo screen, laid out per the project's SYSTEM TYPE
 *     (MES / CRM / ERP / WMS / QMS / BI / POS / ESG / HRIS / Finance / IT / Security /
 *      LMS / Clinic / Construction / CMMS / Fleet / Legal / Collaboration / Service),
 *     filled with THIS project's real metrics, stages, users and fields.
 *
 * Usage:  node tools/generate-stitch-prompts.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "stitch-prompts");

const index = JSON.parse(readFileSync(join(ROOT, "projects-index.json"), "utf8"));
const projects = index.projects;

/* ------------------------------------------------------------------ */
/* 1. System-type classifier                                           */
/* Each type carries: label, primaryWidget, sideWidget, term (glossary)*/
/* ------------------------------------------------------------------ */

const TYPES = {
  "sales-crm":       { label: "CRM 客戶關係 / 業務管線", widget: "pipeline",  side: "ai-next-best", object: "商機／客戶", action: "更新業務管線", modules: ["業務儀表板","商機管線","客戶名單","AI 業務助理"], term: "sales pipeline with deal stages, forecast and next-best-action" },
  "manufacturing-mes":{ label: "MES 製造執行 / 排程", widget: "kanban",     side: "ai-insight",   object: "工單", action: "產生排程建議", modules: ["生產總覽","工單派工","設備/品質","AI 改善會議"], term: "shop-floor work-order execution with scheduling, line load and OEE" },
  "erp":             { label: "ERP 企業資源規劃",      widget: "table",     side: "ai-insight",   object: "單據", action: "拋轉單據", modules: ["營運總覽","訂單/採購","庫存/成本","簽核作業"], term: "cross-module ERP records: orders, inventory, cost, approvals" },
  "warehouse-wms":   { label: "WMS 倉儲作業",          widget: "kanban",    side: "chart",        object: "揀貨／出貨單", action: "產生波次", modules: ["倉儲總覽","入庫上架","揀貨出貨","盤點/儲位"], term: "warehouse inbound/outbound waves, bin locations and stock levels" },
  "procurement-srm": { label: "SRM 採購 / 供應商協同", widget: "table",     side: "risk",         object: "採購／供應商", action: "發出詢價", modules: ["採購總覽","詢報價","供應商評分","交期風險"], term: "supplier scorecards, RFQ collaboration and delivery risk" },
  "quality-qms":     { label: "QMS 品質管理",          widget: "kanban",    side: "spc-chart",    object: "品質案件", action: "開立品質案件", modules: ["品質總覽","異常/NCR","CAPA/8D","SPC 管制圖"], term: "quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto" },
  "analytics-bi":    { label: "BI 商業智慧 / 經營分析",widget: "charts",    side: "insight",      object: "指標", action: "產生洞察", modules: ["經營儀表板","趨勢分析","指標下鑽","AI 洞察"], term: "executive analytics dashboard with KPI trends and drill-down" },
  "esg-energy":      { label: "ESG 永續 / 能源碳排",   widget: "charts",    side: "target",       object: "排放源", action: "更新盤查", modules: ["永續總覽","碳盤查","能源監控","減碳目標"], term: "carbon inventory, energy load curves and reduction targets" },
  "pos-frontdesk":   { label: "POS 門市前台",          widget: "pos",       side: "ticket",       object: "訂單／桌位", action: "結帳", modules: ["門市前台","點餐/開單","訂單管理","日結報表"], term: "point-of-sale front desk: cart, table map, tickets and daily sales" },
  "hr-hris":         { label: "HRIS 人力資源",         widget: "table",     side: "calendar",     object: "員工／班表", action: "產生班表", modules: ["人資總覽","出勤差勤","薪資計算","招募派遣"], term: "HR records: attendance, payroll, leave and recruiting pipeline" },
  "finance-ledger":  { label: "財務 / 會計台帳",        widget: "table",     side: "chart",        object: "帳款／傳票", action: "產生傳票", modules: ["財務總覽","應收/應付","帳齡分析","現金流"], term: "AR/AP ledger, aging, budget vs actual and cash-flow" },
  "finance-case":    { label: "金融保險 / 案件審核",    widget: "pipeline",  side: "risk",         object: "案件", action: "送出審核", modules: ["案件總覽","受理/初審","風險評分","覆核/核准"], term: "claim/loan case review pipeline with risk scoring and approval" },
  "it-ops":          { label: "IT 維運 / 監控",         widget: "console",   side: "topology",     object: "工單／資產", action: "指派工單", modules: ["維運總覽","服務工單","資產管理","即時監控"], term: "IT service tickets, asset inventory and live monitoring" },
  "security-soc":    { label: "資安 SOC / 事件應變",    widget: "console",   side: "alert",        object: "資安事件", action: "指派處理", modules: ["SOC 總覽","告警分流","事件應變","弱點/合規"], term: "security event console: alerts, severity triage and response" },
  "education-lms":   { label: "教育 / 學習平台",        widget: "cards",     side: "progress",     object: "課程／學員", action: "指派作業", modules: ["學習總覽","課程管理","學員進度","作業/測驗"], term: "learning platform: course catalog, learner progress and assignments" },
  "healthcare-clinic":{ label: "醫療 / 診所照護",       widget: "table",     side: "timeline",     object: "病患／預約", action: "安排回診", modules: ["診所總覽","預約掛號","病患照護","申報作業"], term: "clinic operations: appointments, patient records and follow-up" },
  "construction-pm": { label: "營建 / 工程專案",        widget: "kanban",    side: "timeline",     object: "工項／日報", action: "填寫日報", modules: ["專案總覽","工程進度","工地日報","巡檢改善"], term: "construction project: daily logs, WBS schedule and inspection" },
  "maintenance-cmms":{ label: "CMMS 設備維護",         widget: "kanban",    side: "gauge",        object: "維護工單", action: "派工維修", modules: ["設備總覽","保養排程","維修工單","預兆診斷"], term: "equipment maintenance: PM schedule, predictive alerts and downtime" },
  "logistics-fleet": { label: "TMS 運輸 / 車隊調度",   widget: "map",       side: "timeline",     object: "任務／車輛", action: "派車調度", modules: ["調度總覽","任務派車","路線追蹤","成本油耗"], term: "fleet dispatch: route map, job assignment and delivery status" },
  "legal-case":      { label: "法務 / 案件管理",        widget: "table",     side: "timeline",     object: "案件", action: "新增案件", modules: ["案件總覽","案件進度","庭期/合約","工時計費"], term: "legal matter management: cases, hearings, contracts and time tracking" },
  "collaboration-pm":{ label: "協作 / 專案任務",        widget: "kanban",    side: "ai-insight",   object: "任務", action: "指派任務", modules: ["工作總覽","任務看板","專案協作","流程自動化"], term: "team collaboration board with tasks, owners and automation" },
  "service-desk":    { label: "客服 / 服務台",          widget: "console",   side: "ai-insight",   object: "服務單", action: "受理服務單", modules: ["服務總覽","服務工單","SLA 追蹤","客訴補償"], term: "customer service desk: tickets, SLA timers and compensation" },
  "operations-console":{ label: "營運管理主控台",       widget: "kanban",    side: "ai-insight",   object: "作業", action: "新增作業", modules: ["營運總覽","作業看板","例外處理","營運洞察"], term: "operational console with records, workflow stages and daily summary" },
};

// keyword → type (checked against title). Order matters: most specific first.
const KEYWORD_RULES = [
  [/資安|SIEM|SOC|IAM|PAM|EDR|XDR|弱點管理|弱點掃描|防火牆|NGFW|GRC|滲透|災難復原|備份與|端點偵測/i, "security-soc"],
  [/ITSM|ITAM|NMS|APM|CMP|MDM|iPaaS|ESB|雲端資源|系統整合|網路監控|OT資安|資訊科技|資訊安全事件/i, "it-ops"],
  [/CRM|Sales|Pipeline|業務|客戶關係|商機|RFQ|報價|Quotation|詢報價|客戶入口|Customer Portal/i, "sales-crm"],
  [/SRM|SQM|SCAR|採購|供應商|供應鏈|詢價|綠色採購|供應交期/i, "procurement-srm"],
  [/QMS|品質|品管|CAPA|NCR|FMEA|AOI|SPC|追因|檢驗|8D|不良|稽核|安衛/i, "quality-qms"],
  [/WMS|WCS|倉儲|庫存|出貨|入庫|儲位|盤點|AS\/RS|AMHS|補料|補貨|波次/i, "warehouse-wms"],
  [/CMMS|設備維護|預測性?維護|PdM|模具|保養|預兆|OEE|EAP|點檢/i, "maintenance-cmms"],
  [/MES|生產|排程|排產|工單|產線|製造|精實|印刷|服飾|貿易營運|PLM|BOM|ECN|ECR|SMT/i, "manufacturing-mes"],
  [/ERP/i, "erp"],
  [/BI|商業智慧|經營分析|儀表板|Dashboard|洞察|BSC|平衡計分卡|策略|治理|合併報表|風險管理|法令遵循|Compliance|數據分析|行為分析/i, "analytics-bi"],
  [/ESG|碳|能源|EMS|排放|溫室|減碳|需量/i, "esg-energy"],
  [/POS|門市|餐飲|烘焙|旅宿|桌位|出單|洗衣|眼鏡|寵物旅宿|房況|前店後廠/i, "pos-frontdesk"],
  [/HRIS|人資|人力資源|出勤|差勤|薪資|Payroll|派遣|招募|打卡|工時計薪/i, "hr-hris"],
  [/理賠|貸款|投資風險|保險|授信|避險|催收/i, "finance-case"],
  [/財務|會計|帳款|AR|AP|預算|現金流|資金|固定資產|記帳|傳票|稅務|關稅|報稅/i, "finance-ledger"],
  [/教育|課程|學習|學生|補習|幼兒|內訓|證照|教學/i, "education-lms"],
  [/醫療|診所|牙科|藥局|照護|健康|申報|調劑/i, "healthcare-clinic"],
  [/營建|工程|工地|估價|巡檢|施工|PMIS|日報|室內設計/i, "construction-pm"],
  [/TMS|運輸|車隊|派車|停車|拖吊|冷鏈|救援|車聯網|機車|汽車|物流|簽收|油耗/i, "logistics-fleet"],
  [/法務|事務所|庭期|合約|案件進度/i, "legal-case"],
  [/客服|客訴|服務平台|補償/i, "service-desk"],
  [/協作|任務|知識|辦公|流程自動化|專案協作|工作台/i, "collaboration-pm"],
];

// category → fallback type
const CATEGORY_FALLBACK = {
  "生產製造": "manufacturing-mes", "品質管理": "quality-qms", "業務銷售": "sales-crm",
  "採購供應鏈": "procurement-srm", "人力資源": "hr-hris", "倉儲物流": "warehouse-wms",
  "研發管理": "manufacturing-mes", "經營管理": "analytics-bi", "ESG 永續": "esg-energy",
  "零售電商": "pos-frontdesk", "教育": "education-lms", "企業協作": "collaboration-pm",
  "營建工程": "construction-pm", "醫療照護": "healthcare-clinic", "財務會計": "finance-ledger",
  "金融保險": "finance-case", "資訊科技": "it-ops", "交通運輸": "logistics-fleet",
  "設備維護": "maintenance-cmms", "資訊安全": "security-soc", "專業服務": "legal-case",
  "物流運輸": "logistics-fleet", "餐飲旅宿": "pos-frontdesk", "生活服務": "operations-console",
  "數據分析": "analytics-bi", "客服管理": "service-desk", "房地產與物業": "operations-console",
  "宗教服務": "operations-console",
};

function classify(p) {
  for (const [re, type] of KEYWORD_RULES) if (re.test(p.title)) return type;
  return CATEGORY_FALLBACK[p.category] || "operations-console";
}

/* ------------------------------------------------------------------ */
/* 2. Primary-widget layout descriptions (English, with slots)         */
/* ------------------------------------------------------------------ */

function widgetSpec(widget, p, stages, metrics) {
  const cols = stages.join(" → ");
  switch (widget) {
    case "pipeline":
      return `PRIMARY (center, ~62% width): a horizontal deal PIPELINE with the stage columns 「${cols}」. Each column is a droppable lane holding 2–4 opportunity cards; every card shows a customer name (擬真中文人名/公司), amount, owner avatar, and a colored win-probability chip. A slim conversion funnel bar sits above the columns.`;
    case "kanban":
      return `PRIMARY (center, ~62% width): a status KANBAN board with columns 「${cols}」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.`;
    case "table":
      return `PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「${p.title}」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. ${cols}) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.`;
    case "charts":
      return `PRIMARY (center, ~62% width): an ANALYTICS canvas — one large line/area trend chart on top (with a period toggle 日/週/月), and below it a 2×2 grid of smaller charts (a bar ranking, a donut composition, a horizontal Pareto, and a mini table). Every chart uses the blue scale; one amber series marks the "needs attention" line.`;
    case "pos":
      return `PRIMARY (center, ~62% width): a POS FRONT-DESK — left two-thirds is a product/menu grid or a table-map of the venue (coloured occupancy states 「${cols}」); right third is the live order/cart ticket with line items, quantities, subtotal and a large 結帳 button.`;
    case "console":
      return `PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「${cols}」 counts) sits above the stream.`;
    case "cards":
      return `PRIMARY (center, ~62% width): a responsive CARD GRID (3 across) of 「${p.title}」 items (課程/學員/單元). Each card has a cover block, a title, a progress bar, a meta row and a primary action. A segmented filter (「${cols}」) sits above the grid.`;
    case "map":
      return `PRIMARY (center, ~62% width): a DISPATCH MAP panel (stylised city map with route lines and vehicle/pin markers in the blue palette) on top; below it a job list where each row shows a task ID, origin→destination, driver/vehicle, ETA and a status pill (「${cols}」).`;
    default:
      return `PRIMARY (center, ~62% width): a workflow board with stages 「${cols}」 holding record cards.`;
  }
}

function sideSpec(side, p) {
  switch (side) {
    case "ai-next-best": return `RIGHT RAIL (~26%): an "AI 下一步建議" panel — the traditional pain point (資料分散、人工追蹤) struck-through, then 3 AI recommended next actions as tappable rows with a confidence %, plus a "產生建議" button.`;
    case "ai-insight":   return `RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.`;
    case "risk":         return `RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk ${TYPES[classify(p)].object} with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.`;
    case "spc-chart":    return `RIGHT RAIL (~26%): an SPC CONTROL CHART (points with UCL/LCL lines, one out-of-control point highlighted red) above a defect Pareto bar list.`;
    case "chart":        return `RIGHT RAIL (~26%): a trend mini-dashboard — one sparkline KPI card stack and a small composition donut, plus an AI note.`;
    case "insight":      return `RIGHT RAIL (~26%): an "AI 洞察" panel — 3 auto-generated findings with an up/down delta each, and a "匯出報表" button.`;
    case "target":       return `RIGHT RAIL (~26%): a REDUCTION TARGET panel — a circular progress ring toward the carbon/energy target, current vs baseline, and 2–3 recommended actions.`;
    case "ticket":       return `RIGHT RAIL (~26%): the live ORDER TICKET / kitchen queue with items, timers and a 完成 button.`;
    case "calendar":     return `RIGHT RAIL (~26%): a mini MONTH CALENDAR with shift/leave markers and a list of today's exceptions to approve.`;
    case "topology":     return `RIGHT RAIL (~26%): a NETWORK/ASSET health panel — small topology or asset list with green/red status and uptime %.`;
    case "alert":        return `RIGHT RAIL (~26%): an ALERT TRIAGE panel — top severities with counts, MTTR gauge, and a "指派處理" button.`;
    case "progress":     return `RIGHT RAIL (~26%): a LEARNER PROGRESS panel — completion ring, at-risk students list and next assignment.`;
    case "timeline":     return `RIGHT RAIL (~26%): a vertical TIMELINE of the record's activity/appointments with time stamps and status dots.`;
    case "gauge":        return `RIGHT RAIL (~26%): equipment GAUGES — availability/performance/quality (OEE) rings and a predictive-alert list.`;
    default:             return `RIGHT RAIL (~26%): an "AI 賦能情境" panel with pain point, insight paragraph and risk bars.`;
  }
}

/* ------------------------------------------------------------------ */
/* 3. Shared style preamble                                            */
/* ------------------------------------------------------------------ */

const STYLE = `STYLE SYSTEM (apply to every screen):
- Product family: a professional, trustworthy B2B enterprise SaaS console. Clean, bright, high-contrast, data-dense but calm. Think Linear × modern ERP.
- Primary color #1E40AF (deep blue) and #3B82F6 (bright blue) for actions, active nav, chart series and key numbers. Background is white #FFFFFF and light blue-grey #F5F8FC. Text is slate #1E293B on white; muted #64748B for secondary. Borders are hairline #E2E8F0. Use one warm amber #D97706 ONLY for "needs attention / CTA highlight". Success green #16A34A, danger red #DC2626 used sparingly for status.
- Rounded 12px cards with a soft, low shadow; 8px controls. Generous whitespace, 8-pt spacing rhythm.
- Typography: clean geometric sans (Inter / Noto Sans TC). Big bold numbers for KPIs. Traditional-Chinese UI copy, ALL-CAPS latin section labels (e.g. "SEARCH RESULTS") as tiny eyebrows.
- Every screen: fixed top bar (left: JVision wordmark; center: global search; right: notifications + avatar). No dark mode. Desktop-first, but the layout must reflow gracefully to tablet/mobile.
- Tone: enterprise, credible, "a real system a customer would buy" — not a toy demo.`;

/* ------------------------------------------------------------------ */
/* 4. Build one project's prompt file                                  */
/* ------------------------------------------------------------------ */

function buildParts(p) {
  const type = classify(p);
  const t = TYPES[type];
  const cw = p.customerWorkflow || {};
  const stages = (cw.steps && cw.steps.length ? cw.steps : ["待處理", "處理中", "待確認", "已完成"])
    .map(s => (s.length > 10 ? s.slice(0, 10) + "…" : s));
  const metrics = (p.operationalMetrics && p.operationalMetrics.length ? p.operationalMetrics : ["待處理", "高風險", "完成率", "預估影響"]).slice(0, 4);
  const fields = (cw.fields && cw.fields.length ? cw.fields : ["名稱／編號", "負責人／期限"]);
  const choices = (cw.choices && cw.choices.length ? cw.choices : ["執行", "退回補件", "交由主管判斷"]);

  const kpiLine = metrics.map(m => `「${m}」`).join(", ");
  const detail = `## SCREEN 1 — 專案介紹頁 (Project Overview / "before the demo")
Generate a professional, single-scroll PRODUCT OVERVIEW page a salesperson would show a customer BEFORE opening the live demo. Use the STYLE SYSTEM. Sections top-to-bottom:

1. HERO: eyebrow "${t.label} · Case ${String(p.id)}"; H1 「${p.title}」; one-line subtitle 「${p.description}」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「${p.businessSituation}」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「${p.primaryUser}」. Include 「日常怎麼用」: 「${p.dailyUse}」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a ${t.label} system (e.g. ${t.term}).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「${stages.join("」→「")}」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around ${kpiLine} (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.`;

  const demo = `## SCREEN 2 — Demo 操作畫面 (the live ${t.label} workspace)
Generate the actual working application screen for 「${p.title}」, a ${t.label} system (${t.term}). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「${p.title}」; a vertical module nav of 4 items 「${t.modules.join("」「")}」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「${t.action}」 button.
- TOP BAR of the workspace: eyebrow 「${t.label} · Case ${String(p.id)}」, H1 「${p.title}」, subtitle 「${p.category}｜${p.description}」, and a global search 「搜尋${t.object}、負責人或編號」.
- KPI ROW: 4 stat cards → ${kpiLine}. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- ${widgetSpec(t.widget, p, stages, metrics)}
- ${sideSpec(t.side, p)}
- LOWER-LEFT: a 「新增${t.object}」 form panel with fields 「${fields.join("」「")}」 and a primary submit button 「${t.action}」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.`;

  return { type, t, detail, demo };
}

function buildPrompt(p) {
  const { type, t, detail, demo } = buildParts(p);
  return `<!-- ${p.id} · ${p.repoName} · type=${type} -->
# Stitch Prompt — 「${p.title}」
> 系統定位：${t.label}　｜　產業：${p.category}　｜　Case ${p.id}
> 用法：把下面【STYLE SYSTEM】貼進 Stitch 的 style/theme，再分別用 SCREEN 1、SCREEN 2 各生成一個畫面。

\`\`\`
${STYLE}
\`\`\`

${detail}

${demo}
`;
}

/* ------------------------------------------------------------------ */
/* 5. Emit                                                             */
/* ------------------------------------------------------------------ */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const typeCounts = {};
const indexRows = [];
const repById = {};      // type -> representative project (lowest id)
const examplesByType = {}; // type -> [titles]
for (const p of projects) {
  const type = classify(p);
  typeCounts[type] = (typeCounts[type] || 0) + 1;
  (examplesByType[type] = examplesByType[type] || []).push(p.title);
  if (!repById[type] || p.id < repById[type].id) repById[type] = p;
  const pad = String(p.id).padStart(4, "0");
  const fname = `${pad}-${p.repoName}.md`;
  writeFileSync(join(OUT, fname), buildPrompt(p), "utf8");
  indexRows.push(`| ${p.id} | ${p.title} | ${p.category} | ${TYPES[type].label} | [${fname}](./${fname}) |`);
}

/* ---- consolidated _TEMPLATES.md : the ~28 prompts you actually paste ---- */
const orderedTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
let tmpl = `# 只要貼這些：${orderedTypes.length} 個系統類型骨架（涵蓋全部 ${projects.length} 個專案）

> **不要一個一個貼 463 個檔案。** 同一系統類型的 demo 畫面骨架相同，只有資料不同。
> 在 Stitch 只生成「每個類型 1 個代表骨架」，之後由程式把 463 個專案的真實資料灌進對應骨架。
>
> 貼的順序：
> 1. 先貼 [STITCH_UI_PROMPTS.md](../STITCH_UI_PROMPTS.md) 的 **A STYLE SYSTEM** 當 theme。
> 2. 生成框架畫面：**B 首頁 / C 目錄 / D 選單 / E 專案介紹頁公版**（介紹頁一個公版就涵蓋全部 463 個，不用重生）。
> 3. 下面 **每個系統類型各生成 1 個 SCREEN 2 demo 骨架**（共 ${orderedTypes.length} 個）。
>
> 完成後把 Stitch 匯出的 HTML 交回，由程式碼批次填成 463 個成品頁。

`;
for (const type of orderedTypes) {
  const p = repById[type];
  const { demo } = buildParts(p);
  const egs = examplesByType[type].slice(0, 6).join("、");
  tmpl += `\n---\n\n## ${TYPES[type].label}　（此骨架涵蓋 ${typeCounts[type]} 個專案）
代表範例：Case ${p.id}「${p.title}」　｜　同類其他：${egs}${examplesByType[type].length > 6 ? " …" : ""}

${demo}
`;
}
writeFileSync(join(OUT, "_TEMPLATES.md"), tmpl, "utf8");

const indexMd = `# Stitch Prompts 索引（${projects.length} 個專案）

每個檔案 = 一個專案，內含【STYLE SYSTEM】+【SCREEN 1 專案介紹頁】+【SCREEN 2 Demo 畫面】。
系統類型統計：
${Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${TYPES[k].label} — ${v}`).join("\n")}

| ID | 專案 | 產業 | 系統類型 | 檔案 |
|----|------|------|----------|------|
${indexRows.join("\n")}
`;
writeFileSync(join(OUT, "INDEX.md"), indexMd, "utf8");

console.log(`Generated ${projects.length} prompt files -> docs/stitch-prompts/`);
console.log("Type distribution:");
Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(String(v).padStart(4), TYPES[k].label));

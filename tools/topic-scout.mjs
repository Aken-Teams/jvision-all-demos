#!/usr/bin/env node
/**
 * Agent A — 題目發掘與去重。
 *
 * 從既有 demo 的 systemType 分布算出缺口 → 交給 codex 出題 →
 * 用中文 trigram 五道閘去重 → 輸出候選清單供人審。
 * 完全唯讀（codex 以 -s read-only 執行），不寫任何專案檔。
 *
 *   node tools/topic-scout.mjs --gap-only
 *   node tools/topic-scout.mjs --count=30 --dry-run
 *   node tools/topic-scout.mjs --count=30
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT, EXIT, CANDIDATES_PATH, parseArgs, num, list, makeLogger,
  loadCatalog, loadClassifier, coverageByType, coverageByCategory, writeJson, SLUG_RE, existingRepoDirs,
} from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { buildExistingIndex, screenCandidates } from "./lib/topic-similarity.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });

const COUNT = num(args.count, 30);
const POOL = num(args.pool, COUNT * 2);
const ROUNDS = num(args.rounds, 2);
const OUT = args.out ? path.resolve(args.out) : CANDIDATES_PATH;
const SCHEMA = path.join(ROOT, "tools", "schemas", "topic-scout.schema.json");
const ONLY_TYPES = args.type ? list(args.type) : null;
const EXCLUDE_TYPES = args["exclude-type"] ? list(args["exclude-type"]) : [];

/* ── 1. 缺口分析 ─────────────────────────────────────────── */
const catalog = loadCatalog();
const JV = loadClassifier();
const { rows, median } = coverageByType(catalog.projects, JV);
const dirs = existingRepoDirs();

const eligible = rows
  .filter((r) => (!ONLY_TYPES || ONLY_TYPES.includes(r.type)) && !EXCLUDE_TYPES.includes(r.type));

// 稀缺者配額高：缺口權重 = max(1, median - count + 1)
const weights = eligible.map((r) => ({ ...r, weight: Math.max(1, median - r.count + 1) }));
const totalWeight = weights.reduce((sum, r) => sum + r.weight, 0);
const quota = weights.map((r) => ({
  ...r,
  quota: Math.max(1, Math.round((r.weight / totalWeight) * POOL)),
}));

/* ── 產業缺口（配額的實際依據）─────────────────────────────
   只用 systemType 算缺口的後果實測過一次：473 套新題有 141 套落在
   資訊科技，而餐飲旅宿、零售電商、醫療照護、營建工程、金融保險、
   房地產這些終端產業「一套都沒增加」。因為 systemType 只描述技術骨架，
   同一個「稽核流程」骨架可以套在任何產業，模型自然挑它最熟的 IT 題目。

   MARKET_WEIGHT 是台灣中小企業的家數密度與 IT 採購意願的粗略估計，
   用來算「這個產業應該佔目錄的幾成」。權重 0 代表不再增題。 */
const MARKET_WEIGHT = {
  生產製造: 10, 業務銷售: 9, 零售電商: 9, 餐飲旅宿: 8, 專業服務: 8,
  營建工程: 8, 採購供應鏈: 7, 人力資源: 7, 財務會計: 7, 醫療照護: 7,
  倉儲物流: 6, 物流運輸: 6, 交通運輸: 6, 教育: 6, 金融保險: 6,
  客服管理: 6, 房地產與物業: 6, 品質管理: 5, 設備維護: 5, 生活服務: 5,
  企業協作: 4, 經營管理: 4, 研發管理: 4, 數據分析: 3, 資訊安全: 3,
  "ESG 永續": 3, 資訊科技: 2, 宗教服務: 2,
  // 已有 87 套且買方稀少（企業內部 AI 平台團隊），不再增題
  "AI 工程平台": 0,
};

const catCoverage = coverageByCategory(catalog.projects);
const weightSum = Object.values(MARKET_WEIGHT).reduce((a, b) => a + b, 0);
const catRows = Object.entries(MARKET_WEIGHT).map(([category, w]) => {
  const have = catCoverage.find((r) => r.category === category)?.count || 0;
  // 依市場權重換算「應有的套數」，不足的部分才是真缺口
  const target = Math.round((w / weightSum) * catalog.projects.length);
  return { category, have, target, deficit: Math.max(0, target - have), weight: w };
}).sort((a, b) => b.deficit - a.deficit);

/* 用最大餘額法分配，讓各產業配額「精確加總等於 POOL」。
   逐項 Math.round 會湊不齊——實測配額合計 199、prompt 卻說要出 200 題，
   模型把這個矛盾當成阻斷條件，整輪不出題只回一則「請先確認配額」。 */
/* 所有產業都達標時 deficitRows 會是空的，配額表跟著變空，codex 拿到一張
   沒有任何產業的表就不出題了——而且不會報錯，只會安靜地回傳零題。目標是
   「市場權重 ÷ 權重總和 × 站上總數」，站台愈平衡缺口愈小，所以這一天遲早
   會到。沒有缺口時就退回純市場權重分配，讓產線繼續跑下去，分佈仍然是照
   權重走的，只是不再有「補不足」的偏向。 */
let deficitRows = catRows.filter((r) => r.deficit > 0);
let deficitBasis = "缺口";
if (!deficitRows.length) {
  deficitRows = catRows.filter((r) => r.weight > 0).map((r) => ({ ...r, deficit: r.weight }));
  deficitBasis = "市場權重（所有產業皆已達標）";
}
const deficitSum = deficitRows.reduce((sum, r) => sum + r.deficit, 0) || 1;
const exact = deficitRows.map((r) => ({ ...r, raw: (r.deficit / deficitSum) * POOL }));
const catQuota = exact.map((r) => ({ ...r, quota: Math.max(1, Math.floor(r.raw)) }));
let remainder = POOL - catQuota.reduce((sum, r) => sum + r.quota, 0);
const byFraction = [...catQuota].sort((a, b) => (b.raw - Math.floor(b.raw)) - (a.raw - Math.floor(a.raw)));
for (let i = 0; remainder > 0; i = (i + 1) % byFraction.length) { byFraction[i].quota += 1; remainder -= 1; }

log.step(`既有專案 ${catalog.projects.length} 筆，${rows.length} 種系統類型，中位數 ${median} 筆`);
log.info(`  配額依據：${deficitBasis}`);
log.info("  產業缺口由大到小（前 10）：");
for (const r of catQuota.slice(0, 10)) {
  log.info(`   ${r.category.padEnd(12)} 現有 ${String(r.have).padStart(3)}　應有 ${String(r.target).padStart(3)}　缺 ${String(r.deficit).padStart(3)}  → 配額 ${r.quota}`);
}

if (args["gap-only"]) {
  console.log(JSON.stringify({
    total: catalog.projects.length,
    byCategory: catRows,
    bySystemType: rows.map(({ type, count, label }) => ({ type, count, label })),
  }, null, 2));
  process.exit(EXIT.OK);
}

/* ── 2. 組 prompt ────────────────────────────────────────── */
/* 每個產業最多列 20 個標題。站上內容一多，這段會無上限成長——實測站上
   從 1011 長到 1311 時 prompt 由 8.8KB 漲到 17.5KB，codex 的結構化輸出
   連續六輪逾時，出題整個停擺。去重本來就在腳本端做，這裡只需要讓模型
   知道「這個產業大致已經有哪些東西」。 */
const TITLE_CAP = 20;
const coverageBlock = catQuota.map((r) => {
  const have = catCoverage.find((c) => c.category === r.category)?.titles || [];
  const shown = have.slice(-TITLE_CAP);
  const more = have.length > TITLE_CAP ? `⋯等 ${have.length} 題` : "";
  return `${r.category}（已有 ${r.have} 題，應有 ${r.target} 題・缺 ${r.deficit}）：${shown.join("、") || "（無）"}${more}`;
}).join("\n");

function buildPrompt(round, negatives, ideas) {
  /* 只餵缺口產業的既有標題。全部標題會把 context 撐爆，而且模型看到滿滿的
     IT 題目就會繼續往那邊靠——這正是上一批全部灌進資訊科技的原因之一。 */
  const quotaBlock = catQuota.map((r) => `- ${r.category}：${r.quota} 題`).join("\n");

  const saturatedBlock = catRows
    .filter((r) => r.deficit === 0)
    .map((r) => `${r.category}（${r.have}）`)
    .join("、");

  /* 圓桌結論。主席看到的是五個角色各自的提案，任務從「無中生有」變成
     「收斂與去重」——後者是模型比較擅長、也比較不會往同一個方向偏的事。 */
  const ideaBlock = ideas && ideas.length
    ? `\n## 圓桌討論的提案（由五個角色各自提出，尚未收斂）\n${ideas
        .map((i) => `- 〔${i.persona}〕${i.title}（${i.category}）：${i.pain}　→　${i.whyBuy}`)
        .join("\n")}\n
你的工作是**收斂這份提案**，不是重新發想：
- 把講同一件事的提案合併成一題，用最貼近作業現場的那個講法。
- 明顯是既有題目換句話說的，直接丟掉。
- 提案不足配額時才自己補題。
\n`
    : "";

  const negativeBlock = negatives.length
    ? `\n## 上一輪被判定重複的題目（請避開這些方向）\n${negatives.map((n) => `- ${n.title}（撞到「${n.matchedTitle}」，相似度 ${n.score}）`).join("\n")}\n`
    : "";

  return `你是 JVision 的產品企劃，要為 B2B 企業系統 demo 網站提案新題目。

## 這個網站是什麼
每個題目會做成一個「純 UI 展示」的單頁系統 demo：繁體中文、6 個可切換的操作畫面、擬真假資料、無後端。
客群是台灣的中小企業與工廠，題目必須是**企業內部真的會採購導入的系統**。

## 缺題的產業，以及該產業已有的題目（請避開這些，並補足同產業其他場景）
${coverageBlock}
${ideaBlock}

## 配額表（**只出以下產業**，總數以本表加總為準）
${quotaBlock}

配額是分配建議。若加總與你的計算有出入，**以本表逐列的數字為準直接產出**，
不要為此停下來詢問或改出其他題目。

## 以下產業已經飽和，這次一題都不要出
${saturatedBlock}
${negativeBlock}
## 好題目的硬性條件
1. **不可以是既有題目的換句話說**。每題都要在 differentiator 說明「跟哪一個既有題目最像、差在哪」。
1-1. **category 必須是上面配額表裡的產業之一**，不可自創、不可寫飽和產業。
1-2. 題目要貼著該產業的真實作業場景（例如餐飲要講排班、備料、訂位、外送抽成，
     而不是把一套通用的「稽核流程」換個名字掛到餐飲底下）。
2. 必須是企業會付錢買的內部系統，不是消費者 App、不是純資訊網站。
3. 不可依賴真實後端、硬體或即時裝置才成立（demo 是純 UI）。
4. 必須能自然拆成 **6 個彼此不同的操作畫面**，而不是同一個畫面換資料。
5. title 用 6-14 個中文字；description 60-120 字，講清楚解決什麼工作。
6. modules 剛好 6 個，icon 用 Material Symbols Outlined 的名稱（例如 inventory、rule、insights）。
7. flowStages 剛好 6 個，依序對應那 6 個畫面，每個階段要有負責角色。

只輸出符合 schema 的 JSON，不要 Markdown、不要任何說明文字。`;
}

/* ── 2.5 圓桌討論 ──────────────────────────────────────────
   一個模型獨自出題會一直往它最熟的方向靠（實測上一批 473 套裡有 141 套
   灌進資訊科技）。改成先讓五個角色各自從自己的位置提案，再由主席收斂：
   不同角色看見的是企業裡不同的作業面，天然把題目撐開。
   五個角色同時跑且互不相見——先讓其中一個回答再給別人看，後面會全部附和
   第一個定下的方向，那就退化成一個模型出題。收斂統一交給主席那一輪。 */
const PERSONAS = [
  { key: "顧問", role: "在台灣做了十五年中小企業導入的顧問",
    lens: "你看過很多公司「用 Excel 撐著」的環節。講那些每天有人在手動對帳、手動排、手動抄的作業。" },
  { key: "現場", role: "工廠與門市的現場主管",
    lens: "你在意交班、異常、找東西、等簽核。講那些現場真的會卡住產出的事，不要講管理層的儀表板。" },
  { key: "財會", role: "企業的財務與內部稽核主管",
    lens: "你在意憑證、對帳、期間關帳、授權與軌跡。講那些出錯要賠錢或被稽核開單的環節。" },
  { key: "資訊", role: "企業的資訊主管",
    lens: "你在意資料散在幾套系統之間、誰的主檔說了算、串接失敗怎麼補。講整合與主檔治理的實際場景。" },
  { key: "產品", role: "做垂直產業 SaaS 的產品經理",
    lens: "你在意既有套裝軟體沒做、但客戶年年抱怨的縫隙。講那些「大系統做不到、所以另外買一套」的題目。" },
];

const ROUNDTABLE_SCHEMA = path.join(ROOT, "tools", "schemas", "topic-roundtable.schema.json");

async function roundtable() {
  const perSeat = Math.max(4, Math.ceil((POOL * 1.2) / PERSONAS.length));
  const seatPrompt = (p) => `你是${p.role}。現在要為一個 B2B 企業系統 demo 網站提案題目。

${p.lens}

## 這個網站是什麼
每個題目會做成一個「純 UI 展示」的單頁系統 demo：繁體中文、6 個可切換的操作畫面、擬真假資料、無後端。
客群是台灣的中小企業與工廠，題目必須是**企業內部真的會採購導入的系統**。

## 缺題的產業，以及該產業已經有的題目（請避開這些）
${coverageBlock}

## 只能提以下產業的題目
${catQuota.map((r) => r.category).join("、")}

## 規則
1. 提 ${perSeat} 個題目，每個都要是**你這個角色親眼看過的作業**，不要提通用的「管理平台」。
2. 不可以是上面既有題目的換句話說。
3. 必須能自然拆成 6 個彼此不同的操作畫面。
4. 不依賴真實後端、硬體或即時裝置才成立。
5. title 用 6-14 個中文字。

只輸出符合 schema 的 JSON。`;

  log.step(`── 圓桌討論：${PERSONAS.length} 個角色各自提案（每人 ${perSeat} 題）──`);
  const settled = await Promise.all(PERSONAS.map(async (p) => {
    const r = await runCodexWithRetry({
      prompt: seatPrompt(p), cwd: ROOT, sandbox: "read-only",
      schemaPath: ROUNDTABLE_SCHEMA, timeoutMs: num(args.timeout, 900) * 1000, model: args.model,
      onLog: () => process.stderr.write("."),
    }, { retries: 1 });
    const ideas = Array.isArray(r.json?.ideas) ? r.json.ideas : [];
    return { persona: p.key, ideas, error: r.ok ? null : r.error };
  }));
  process.stderr.write("\n");

  for (const s of settled) log.info(`  ${s.persona}：${s.ideas.length} 個提案${s.error ? `（${s.error}）` : ""}`);
  const all = settled.flatMap((x) => x.ideas.map((i) => ({ ...i, persona: x.persona })));
  if (!all.length) { log.warn("  圓桌沒有任何提案，這一輪退回單獨出題"); return null; }
  log.info(`  合計 ${all.length} 個提案，交給主席收斂`);
  return all;
}

/* ── 3. 呼叫 codex + 去重 ────────────────────────────────── */
/* 去重池不能只有已上架的專案。已經建好、還沒上架的 demo 對標題與全文比對
   完全隱形（G1 只比得到 repoName），於是出題會反覆撞上自己昨天做過的東西
   ——實測佇列裡出現「旅宿早餐產能調度台」，而 demos/ 裡早就躺著同一套。
   把它們的 details JSON 一併讀進來補上標題與描述。 */
function unpublishedProjects() {
  const published = new Set(catalog.projects.map((p) => p.repoName));
  const out = [];
  for (const repo of dirs) {
    if (published.has(repo)) continue;
    const detail = path.join(ROOT, "content", "details", repo + ".json");
    if (!fs.existsSync(detail)) continue;
    try {
      const d = JSON.parse(fs.readFileSync(detail, "utf8"));
      if (d.title) out.push({ repoName: repo, title: d.title, description: d.hero?.tagline || "", category: d.category, systemType: d.systemType });
    } catch { /* 壞掉的 details 不影響出題 */ }
  }
  return out;
}

const drafts = unpublishedProjects();
if (drafts.length) log.info("去重池另納入 " + drafts.length + " 套已建置未上架的 demo");
const existingIndex = buildExistingIndex(
  [...catalog.projects, ...drafts],
  (p) => (p.systemType && JV.TYPES[p.systemType] ? p.systemType : JV.classify(p)),
);
const accepted = [];
const rejected = [];
let generated = 0;

if (args["dry-run"]) {
  const prompt = buildPrompt(1, []);
  log.step("── DRY RUN：以下是將送給 codex 的 prompt ──");
  console.log(prompt);
  log.step(`prompt 長度：${prompt.length} 字元（約 ${(Buffer.byteLength(prompt) / 1024).toFixed(1)} KB）`);
  log.info(`schema：${path.relative(ROOT, SCHEMA)}`);
  log.info(`輸出目標：${path.relative(ROOT, OUT)}（未寫入）`);
  process.exit(EXIT.OK);
}

/** schema 之外自己再驗一次；單筆不合格丟該筆，不整批中止。 */
function validate(topic) {
  const errors = [];
  if (!SLUG_RE.test(String(topic.slug || ""))) errors.push("slug 格式");
  if (!JV.TYPES[topic.systemType]) errors.push("systemType 不存在");
  if (!(topic.modules || []).length || topic.modules.length !== 6) errors.push("modules 需 6 個");
  if (!(topic.flowStages || []).length || topic.flowStages.length !== 6) errors.push("flowStages 需 6 個");
  if (String(topic.title || "").length < 3) errors.push("title 過短");
  if (dirs.has(`jvision-${topic.slug}`)) errors.push("repoName 已存在");
  return errors;
}

/* 圓桌只在第一輪開，之後幾輪是補題——那時已經有負面清單可以導向，再開一次
   圓桌只是重複付五次呼叫的錢。 */
let tableIdeas = null;
if (args.roundtable !== "off") tableIdeas = await roundtable();

for (let round = 1; round <= ROUNDS && accepted.length < COUNT; round += 1) {
  log.step(`── 第 ${round} 輪：呼叫 codex 產題（已收 ${accepted.length}/${COUNT}）──`);
  const result = await runCodexWithRetry({
    prompt: buildPrompt(round, rejected.slice(-12), round === 1 ? tableIdeas : null),
    cwd: ROOT,
    sandbox: "read-only",
    schemaPath: SCHEMA,
    timeoutMs: num(args.timeout, 900) * 1000,
    model: args.model,
    onLog: () => process.stderr.write("."),
  }, { retries: 2 });
  process.stderr.write("\n");

  if (!result.ok) { log.error(`codex 失敗：${result.error}`); if (round === ROUNDS) process.exit(EXIT.CODEX_FAILED); continue; }
  const topics = result.json?.topics;
  if (!Array.isArray(topics) || !topics.length) { log.error("codex 回應無法解析成題目清單"); if (round === ROUNDS) process.exit(EXIT.BAD_OUTPUT); continue; }

  generated += topics.length;
  const valid = [];
  for (const topic of topics) {
    const errors = validate(topic);
    if (errors.length) rejected.push({ ...topic, reason: "格式不合", detail: errors.join("、"), round });
    else valid.push({ ...topic, repoName: `jvision-${topic.slug}`, round });
  }

  const screened = screenCandidates(valid, existingIndex);
  for (const item of screened.accepted) {
    if (accepted.length >= COUNT) break;
    accepted.push(item);
    /* 用 buildExistingIndex 產生完整索引項再推回池裡。先前這裡手寫成
       { ...grams } —— 那是舊版的欄位名，而 findNearest 讀的是 fullGrams，
       於是第 2 輪一比對就 TypeError，整個出題流程從第 2 輪起必掛。 */
    existingIndex.push(buildExistingIndex([item], () => item.systemType)[0]);
  }
  rejected.push(...screened.rejected.map((r) => ({ ...r, round })));
  log.info(`  本輪 ${topics.length} 題 → 通過 ${screened.accepted.length}、重複/不合格 ${topics.length - screened.accepted.length}`);
}

/* ── 4. 輸出 ─────────────────────────────────────────────── */
const output = {
  generatedAt: new Date().toISOString(),
  config: { count: COUNT, pool: POOL, rounds: ROUNDS },
  catalogSize: catalog.projects.length,
  coverage: Object.fromEntries(rows.map((r) => [r.type, r.count])),
  stats: { generated, accepted: accepted.length, rejected: rejected.length },
  accepted,
  rejected,
};
writeJson(OUT, output);

const md = [
  `# 題目候選（${new Date().toISOString().slice(0, 10)}）`, "",
  `既有 ${catalog.projects.length} 題｜本次產 ${generated} 題｜通過 ${accepted.length}｜重複或不合格 ${rejected.length}`, "",
  "## 通過的題目", "",
  ...accepted.map((a, i) => `${i + 1}. **${a.title}**（${a.systemType}／${a.category}）\n   - ${a.description}\n   - 差異：${a.differentiator}\n   - repo：\`${a.repoName}\``),
  "", "## 被判重複或不合格", "",
  ...rejected.map((r) => `- ${r.title || "(無標題)"}　—　${r.reason}${r.matchedTitle ? `（撞到「${r.matchedTitle}」${r.score}）` : ""}${r.detail ? `：${r.detail}` : ""}`),
].join("\n");
fs.writeFileSync(OUT.replace(/\.json$/, ".md"), md + "\n");

log.step(`完成：通過 ${accepted.length}／目標 ${COUNT}，重複或不合格 ${rejected.length}`);
log.info(`  ${path.relative(ROOT, OUT)}`);
log.info(`  ${path.relative(ROOT, OUT.replace(/\.json$/, ".md"))}`);
process.exit(accepted.length >= COUNT ? EXIT.OK : EXIT.PARTIAL);

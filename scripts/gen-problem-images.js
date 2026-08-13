// Generate "傳統作業實景" pain-point illustrations for every project.
// Style: flat isometric SaaS illustration (matches site). English prompt, no text in image.
// Output: assets/problem/<repoName>.jpg  (resumable: skips existing)
// Usage: node scripts/gen-problem-images.js [sampleN] [concurrency]
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// PNG buffer -> resized JPEG file via ffmpeg (fit within 960x960, good quality)
function pngToJpeg(pngBuf, dest) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", "-i", "pipe:0", "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-q:v", "4", dest], { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("error", reject);
    ff.on("close", (code) => { code === 0 ? resolve() : reject(new Error("ffmpeg " + code + ": " + err.slice(-200))); });
    ff.stdin.on("error", () => {});
    ff.stdin.write(pngBuf);
    ff.stdin.end();
  });
}

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error("set GEMINI_API_KEY"); process.exit(1); }
const MODEL = "gemini-2.5-flash-image";
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "problem");
fs.mkdirSync(OUT, { recursive: true });

const sampleN = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
const CONC = process.argv[3] ? parseInt(process.argv[3], 10) : 4;

const idx = require(path.join(ROOT, "projects-index.json"));
let projects = idx.projects;
if (sampleN > 0) projects = projects.slice(0, sampleN);

const SETTING = {
  "生產製造": "a manufacturing factory production planning office and shop floor",
  "品質管理": "a factory quality-control and inspection area",
  "業務銷售": "a B2B sales team office",
  "採購供應鏈": "a procurement and supply-chain office",
  "人力資源": "a human-resources department office",
  "倉儲物流": "a warehouse and logistics operation",
  "研發管理": "an R&D and engineering lab office",
  "經營管理": "a company executive management office",
  "ESG 永續": "a corporate sustainability / ESG office",
  "零售電商": "a retail and e-commerce operations office",
  "教育": "a school administration office",
  "企業協作": "a corporate team collaboration office",
  "營建工程": "a construction site office",
  "醫療照護": "a hospital nursing / administration station",
  "財務會計": "a finance and accounting department office",
  "金融保險": "a bank and insurance branch office",
  "資訊科技": "an IT department and server room office",
  "交通運輸": "a transportation and fleet dispatch office",
  "設備維護": "an equipment maintenance workshop office",
  "資訊安全": "a cybersecurity operations office",
  "專業服務": "a professional-services consulting office",
  "物流運輸": "a freight and logistics dispatch office",
  "餐飲旅宿": "a restaurant and hotel back office",
  "生活服務": "a local services appointment office",
  "數據分析": "a data analytics office",
  "客服管理": "a customer-service call center",
  "房地產與物業": "a real-estate and property-management office",
  "宗教服務": "a temple / religious organization administration office",
};

function painsFor(p) {
  try {
    const d = require(path.join(ROOT, "content", "details", p.repoName + ".json"));
    if (d.problem && Array.isArray(d.problem.pains)) return d.problem.pains.map((c) => c.title).filter(Boolean).slice(0, 4);
  } catch (e) {}
  return [];
}

function buildPrompt(p) {
  const cat = p.category || p.industry || "其他";
  const setting = SETTING[cat] || "a busy corporate back office";
  const pains = painsFor(p);
  const painLine = pains.length ? `The specific problems to convey visually (interpret them, do NOT write these words): ${pains.join("、")}.` : "";
  return [
    "Flat isometric 3D vector illustration in a clean, modern SaaS tech style.",
    "Soft blue and slate color palette (deep blue #1e40af, bright blue #3b82f6, slate grey #64748b) with subtle gradients on a clean white background. Small red accents (#ef4444) used only for warning / alert marks.",
    `Depict the OLD, pre-digital, manual and chaotic way of working in ${setting}: overwhelmed staff surrounded by stacks of paper documents, several messy spreadsheets on monitors, sticky notes, a ringing phone, tangled and broken workflow connection lines, and a few small red warning marks conveying delays, errors and no visibility.`,
    painLine,
    "Absolutely NO text, NO letters, NO numbers, NO words anywhere in the image. Isometric, balanced centered composition, generous white space, high-quality website hero illustration.",
  ].filter(Boolean).join(" ");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function genOne(p) {
  const dest = path.join(OUT, p.repoName + ".jpg");
  if (fs.existsSync(dest)) return { repo: p.repoName, status: "skip" };
  const prompt = buildPrompt(p);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  let lastErr = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 90000);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) { lastErr = "HTTP " + res.status; await sleep((attempt + 1) * 4000 + Math.floor(Math.random() * 1500)); continue; }
      const j = await res.json();
      if (j.error) { lastErr = j.error.status + " " + j.error.message; if (/quota|rate|resource/i.test(lastErr)) { await sleep((attempt + 1) * 5000); continue; } break; }
      const part = (j.candidates?.[0]?.content?.parts || []).find((x) => x.inlineData);
      if (!part) { lastErr = "no image in response"; await sleep(2000); continue; }
      const png = Buffer.from(part.inlineData.data, "base64");
      await pngToJpeg(png, dest);
      return { repo: p.repoName, status: "ok", bytes: fs.statSync(dest).size };
    } catch (e) { lastErr = e.message; await sleep((attempt + 1) * 3000); }
  }
  return { repo: p.repoName, status: "fail", err: lastErr };
}

(async () => {
  const total = projects.length;
  let done = 0, ok = 0, skip = 0, fail = 0;
  const fails = [];
  const queue = projects.slice();
  const logFile = path.join(ROOT, "scripts", "gen-problem-images.log");
  function log(s) { const line = s + "\n"; process.stdout.write(line); try { fs.appendFileSync(logFile, line); } catch (e) {} }
  log(`=== start ${total} projects, conc=${CONC}, model=${MODEL} ===`);
  async function worker(id) {
    while (queue.length) {
      const p = queue.shift();
      const r = await genOne(p);
      done++;
      if (r.status === "ok") ok++; else if (r.status === "skip") skip++; else { fail++; fails.push(r); }
      if (done % 10 === 0 || r.status === "fail" || done === total) {
        log(`[${done}/${total}] ok=${ok} skip=${skip} fail=${fail} last=${r.repo}:${r.status}${r.err ? " (" + r.err.slice(0, 80) + ")" : ""}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i)));
  log(`=== DONE ok=${ok} skip=${skip} fail=${fail} ===`);
  if (fails.length) log("FAILS: " + fails.map((f) => f.repo).join(", "));
})();

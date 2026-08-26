#!/usr/bin/env node
/**
 * 用 Google 的影像模型產生真實圖片。
 *
 * 為什麼需要這支：codex 與 gemini CLI 都是「寫程式的 agent」，不是影像模型。
 * 叫它們畫圖，它們會寫一段程式把圖畫出來——實測 gemini CLI 畫一顆蘋果，
 * 結果是蘋果浮在半空、果梗和果實分開。要真實影像就得直接打影像模型的 API，
 * 而那需要一把 API 金鑰（CLI 的 OAuth 憑證是給 Code Assist 用的，不通這個端點）。
 *
 *   node tools/make-image.mjs "提示詞" 輸出.png [--model=gemini-2.5-flash-image] [--ratio=16:9]
 *
 * 金鑰：環境變數 GEMINI_API_KEY，或 .env 裡的同名欄位。
 * 到 https://aistudio.google.com/apikey 申請。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const positional = args.filter((a) => !a.startsWith("--"));
const [prompt, outFile] = positional;

if (!prompt || !outFile) {
  console.error('用法：node tools/make-image.mjs "提示詞" 輸出.png [--model=…] [--ratio=16:9]');
  process.exit(2);
}

function key() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = /^(?:GEMINI_API_KEY|GOOGLE_API_KEY)=(.+)$/m.exec(env);
    return m?.[1]?.trim().replace(/^["']|["']$/g, "") || null;
  } catch { return null; }
}

const API_KEY = key();
if (!API_KEY) {
  console.error("");
  console.error("✖ 找不到影像模型的 API 金鑰。");
  console.error("  codex 與 gemini CLI 都是寫程式的 agent，沒有影像生成能力——");
  console.error("  它們「畫圖」的方式是寫一段程式畫出來，做不出真實照片。");
  console.error("");
  console.error("  取得金鑰：https://aistudio.google.com/apikey");
  console.error("  然後擇一：");
  console.error("    1. 在 .env 加一行 GEMINI_API_KEY=<你的金鑰>");
  console.error("    2. export GEMINI_API_KEY=<你的金鑰>");
  process.exit(3);
}

const MODEL = flag("model", "gemini-2.5-flash-image");
const RATIO = flag("ratio", null);

const body = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseModalities: ["IMAGE"],
    ...(RATIO ? { imageConfig: { aspectRatio: RATIO } } : {}),
  },
};

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
  {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": API_KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180000),
  },
);
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`✖ ${MODEL} 回應 ${res.status}：${data?.error?.message || "未知錯誤"}`);
  process.exit(1);
}

/* 回應裡影像是 base64 的 inlineData。同一則回應可能夾雜文字，只取影像那一段。 */
const parts = data?.candidates?.[0]?.content?.parts || [];
const image = parts.find((p) => p.inlineData?.data);
if (!image) {
  const text = parts.map((p) => p.text).filter(Boolean).join(" ").slice(0, 200);
  console.error(`✖ 回應裡沒有影像${text ? `，模型說：${text}` : ""}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, Buffer.from(image.inlineData.data, "base64"));
const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log(`已寫入 ${outFile}（${kb} KB，${image.inlineData.mimeType || "image"}）`);

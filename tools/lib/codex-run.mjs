/**
 * codex CLI（codex exec）的非互動包裝。
 *
 * 骨架參考 jvision-agents-office/server/llm.py 的 CLI 包裝手法：
 * 硬性 deadline、逐行事件解析、失敗吞掉交由上層決定，
 * 但改用 codex 的 --output-last-message / --output-schema，
 * 不必自己解析 stream。
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const DEFAULT_TIMEOUT_MS = 300_000;

/** 剝掉 ```json 圍籬後解析；照 api/ai-advice.js 的 safeAdvice() 作法。 */
export function safeJson(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const unfenced = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    // 模型偶爾在 JSON 前後夾雜說明文字，退而求其次抓最外層大括號
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(unfenced.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

/**
 * 從 stderr 裡挑出「真正的錯誤」。
 *
 * codex 會把啟動橫幅與**整份 prompt** 原樣印到 stderr，所以直接拿
 * stderr.slice(-500) 當錯誤訊息，取到的永遠是 prompt 的最後 500 字元。
 * 換裝產線的失敗紀錄裡因此出現一堆「codex 失敗：);return;}var n=document.」
 * ——那是被換裝的那份 HTML 的結尾，不是任何錯誤，而真正的原因從來沒被記下來。
 *
 * 把 prompt 與橫幅剔掉，剩下的才是 codex 自己說的話。
 */
function cleanStderr(stderr, prompt) {
  let s = String(stderr || "");
  if (prompt) s = s.split(String(prompt)).join("");
  return s
    .split("\n")
    .filter((line) => !/^(Reading additional input|OpenAI Codex v|-{4,}|workdir:|model:|provider:|approval:|sandbox:|reasoning (effort|summaries):|session id:|user$)/.test(line.trim()))
    .join("\n")
    .trim()
    .slice(-500);
}

/**
 * 執行一次 codex exec。
 * @param {object} options
 * @param {string} options.prompt          給 codex 的指令
 * @param {string} options.cwd             --cd 工作根目錄
 * @param {"read-only"|"workspace-write"} [options.sandbox]
 * @param {string} [options.schemaPath]    --output-schema 的 JSON Schema 檔
 * @param {number} [options.timeoutMs]
 * @param {string} [options.model]
 * @param {(line:string)=>void} [options.onLog] 進度回呼
 * @returns {Promise<{ok:boolean, text:string, json:object|null, code:number|null, error?:string}>}
 */
export function runCodex({
  prompt,
  cwd,
  sandbox = "read-only",
  schemaPath,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  model,
  images,
  onLog,
} = {}) {
  return new Promise((resolve) => {
    const outFile = path.join(os.tmpdir(), `codex-out-${process.pid}-${Date.now()}.txt`);
    const args = ["exec", "--cd", cwd, "--sandbox", sandbox, "--skip-git-repo-check", "-o", outFile];
    if (schemaPath) args.push("--output-schema", schemaPath);
    if (model) args.push("--model", model);
    /* 附圖。使用者貼的截圖是「他指的是這裡」最直接的說法，
       用文字轉述一定會失真。
       -i 是可變長度參數，後面接的東西會一直被當成圖片路徑——不加 -- 隔開的話，
       prompt 會被當成第二個檔名吃掉，codex 就改去等 stdin 而立刻失敗
       （訊息是 "No prompt provided via stdin"，跟圖片完全看不出關係）。 */
    if (images && images.length) {
      for (const img of images) args.push("-i", img);
      args.push("--");
    }
    args.push(prompt);

    const child = spawn("codex", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      let text = "";
      try { text = fs.readFileSync(outFile, "utf8"); } catch { /* 沒產出就留空 */ }
      try { fs.unlinkSync(outFile); } catch { /* 清不掉不影響結果 */ }
      resolve({ ...result, text, json: safeJson(text) });
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      // 錯誤要指示改進方向：附上 prompt 大小，超過 20KB 直接點名裁剪
      //（我們踩過的坑就是 prompt 膨脹 → 連環逾時，卻要翻半天才定位到）。
      const promptKb = Math.round((Buffer.byteLength(String(prompt || "")) / 1024) * 10) / 10;
      const hint = promptKb > 20 ? `，偏大——先裁剪規格內容再重試` : "";
      finish({ ok: false, code: null, error: `codex 逾時（${Math.round(timeoutMs / 1000)} 秒；prompt ${promptKb} KB${hint}）` });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => { if (onLog) onLog(String(chunk)); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", (error) => finish({ ok: false, code: null, error: `無法啟動 codex：${error.message}` }));
    child.on("close", (code) => {
      if (code === 0) finish({ ok: true, code });
      else finish({ ok: false, code, error: cleanStderr(stderr, prompt) || `codex 結束碼 ${code}` });
    });
  });
}

/** 跑一次，失敗再試一次（第二次前短暫等待）。 */
export async function runCodexWithRetry(options, { retries = 1, retryDelayMs = 3000 } = {}) {
  let last = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    last = await runCodex(options);
    if (last.ok) return { ...last, attempts: attempt + 1 };
    if (attempt < retries) {
      if (options.onLog) options.onLog(`\n  重試中（第 ${attempt + 2} 次）…\n`);
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  return { ...last, attempts: retries + 1 };
}

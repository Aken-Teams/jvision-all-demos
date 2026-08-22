// 一鍵啟動「前端靜態站 (:3000) + Agents 後端 (aiohttp :4610)」。
// 用法：npm run dev   （Ctrl+C 會一起關閉兩者）
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import * as usage from "./lib/usage-log.mjs";

// 對外只開一個 port（PUBLIC_PORT）。靜態站和 Agents 後端都只綁 127.0.0.1，
// 由下面的 gateway 依路徑分流。這樣區網只要放行 3000，不必再開第二個 port
// ——先前 4610 從別台機器連進來會 ERR_CONNECTION_TIMED_OUT，就是被中間網路擋掉。
const PUBLIC_PORT = Number(process.env.JV_PORT || 3000);
const STATIC_PORT = 3100;
const BACKEND_PORT = 4610;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "jvision-agents-office", "server");
const isWin = process.platform === "win32";

// 找一個可用的 python（依序試 python / py / python3）
function pickPython() {
  const cands = isWin ? ["python", "py", "python3"] : ["python3", "python"];
  for (const c of cands) {
    try {
      const r = spawnSync(c, ["--version"], { shell: isWin, stdio: "ignore" });
      if (r.status === 0) return c;
    } catch { /* try next */ }
  }
  return cands[0];
}

const procs = [];
function pref(tag, buf) {
  return String(buf).split(/\r?\n/).filter(Boolean).map((l) => `${tag} ${l}`).join("\n") + "\n";
}
function run(name, cmd, args, cwd) {
  const tag = `[${name}]`;
  const p = spawn(cmd, args, { cwd, shell: isWin, env: process.env });
  p.stdout.on("data", (d) => process.stdout.write(pref(tag, d)));
  p.stderr.on("data", (d) => process.stdout.write(pref(tag, d)));
  p.on("error", (e) => console.log(`${tag} 無法啟動：${e.message}`));
  p.on("exit", (code) => console.log(`${tag} 已結束（code ${code}）。若是後端 4610 已被占用，代表它可能已在執行。`));
  procs.push(p);
}
// /run 與 /health 轉給 Agents 後端，其餘轉給靜態站。SSE 要逐塊送出，不能緩衝。
// /wish 兩邊都有：GET 是靜態的許願池頁面，POST/OPTIONS 才是後端分析 API，所以要看 method。
function isBackend(method, p) {
  if (p === "/run" || p === "/health") return true;
  return p === "/wish" && (method === "POST" || method === "OPTIONS");
}
function startGateway() {
  const gw = http.createServer((req, res) => {
    const p = req.url.split("?")[0];

    // 管理後台的使用統計：gateway 自己回，不轉給靜態站也不依賴 Vercel functions。
    if (p === "/api/usage") {
      const days = Number(new URL(req.url, "http://x").searchParams.get("days")) || 14;
      const body = JSON.stringify(usage.summarize({ root, days }));
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(body);
    }

    const port = isBackend(req.method, p) ? BACKEND_PORT : STATIC_PORT;
    const up = http.request(
      { host: "127.0.0.1", port, method: req.method, path: req.url,
        headers: { ...req.headers, host: `127.0.0.1:${port}` } },
      (upRes) => {
        const h = { ...upRes.headers };
        // 前面隔著 nginx/openresty + Cloudflare。nginx 預設 proxy_buffering on 會把 SSE
        // 整包緩衝到結束才送，串流因此卡死或被 proxy_read_timeout 砍掉（瀏覽器端看到
        // ERR_HTTP2_PROTOCOL_ERROR）。這個標頭會讓 nginx 對本筆回應關閉緩衝。
        if (port === BACKEND_PORT) {
          h["x-accel-buffering"] = "no";
          h["cache-control"] = "no-cache, no-transform";
        }
        usage.record(req, upRes.statusCode);
        res.writeHead(upRes.statusCode, h);
        upRes.on("data", (c) => res.write(c));
        upRes.on("end", () => res.end());
      }
    );
    up.on("error", (e) => {
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`gateway: 無法連到 127.0.0.1:${port} — ${e.message}`);
    });
    req.pipe(up);
  });
  gw.on("clientError", (_e, socket) => socket.destroy());
  const logFile = usage.open(root);
  gw.listen(PUBLIC_PORT, "0.0.0.0", () => {
    console.log(`[gateway] 對外服務於 0.0.0.0:${PUBLIC_PORT}`);
    console.log(`[gateway] 使用紀錄 → ${path.relative(root, logFile)}（不含 IP，僅存雜湊）`);
  });
  procs.push({ kill: () => gw.close() });
}

function shutdown() {
  procs.forEach((p) => { try { p.kill(); } catch { /* noop */ } });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const py = pickPython();
console.log("── JVision 一鍵啟動 ──");
console.log(`後端： ${py} app.py            → 127.0.0.1:${BACKEND_PORT}（內部）`);
console.log(`前端： npx serve .              → 127.0.0.1:${STATIC_PORT}（內部）`);
console.log(`對外： http://localhost:${PUBLIC_PORT}  ← 只有這個 port 需要開`);
console.log(`（Ctrl+C 一起關閉；請開 http://localhost:${PUBLIC_PORT}/agents-mission）\n`);

run("backend", py, ["app.py"], serverDir);
run("frontend", isWin ? "npx.cmd" : "npx", ["serve", ".", "-l", `tcp://127.0.0.1:${STATIC_PORT}`], root);
startGateway();

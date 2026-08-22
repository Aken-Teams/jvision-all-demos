/**
 * 零依賴靜態站。三支既有驗收工具（verify-demos / chartscan / loadscan）
 * 都硬編 http://localhost:4599/ 且無環境變數可覆寫，而 npm run dev 是 :3000，
 * node_modules 也沒有 serve —— 所以自己起一個，不改既有工具、不依賴 npx。
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".md": "text/plain; charset=utf-8", ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
};

/** 這個 port 上是否已有可用的站台（有就沿用，不重複起）。 */
export function probe(port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/favicon.svg", timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

export async function start({ root, port = 4599 }) {
  if (await probe(port)) {
    return { url: `http://127.0.0.1:${port}`, reused: true, close: async () => {} };
  }

  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://x").pathname); }
    catch { res.writeHead(400).end("bad request"); return; }

    let target = path.join(root, pathname);
    // 路徑逃逸防護
    if (!target.startsWith(root)) { res.writeHead(403).end("forbidden"); return; }
    try {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    } catch { /* 交給下面的 existsSync 判斷 */ }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end("not found"); return; }

    res.writeHead(200, {
      "Content-Type": MIME[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });
    fs.createReadStream(target).pipe(res);
  });

  await new Promise((resolve, reject) => {
    server.once("error", (error) => {
      // 這個 port 可能被別的服務占用（例如 agents-office 的 :4610），
      // 但 probe 只認靜態站，所以要在這裡給出可行動的訊息。
      if (error.code === "EADDRINUSE") {
        reject(new Error(`port ${port} 已被其他服務占用（非本專案靜態站）。請關閉它或用 --port 指定其他埠。`));
      } else reject(error);
    });
    server.listen(port, "127.0.0.1", resolve);
  });

  return {
    url: `http://127.0.0.1:${port}`,
    reused: false,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

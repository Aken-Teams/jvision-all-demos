import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const serverOnlyRoots = new Set(["api", "content", "node_modules", "output", "tools"]);
const serverOnlyFiles = new Set(["server.mjs", "middleware.js", "package.json", "package-lock.json"]);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnv();

const apiRoutes = new Map([
  ["/api/ai-advice", require("./api/ai-advice.js")],
  ["/api/admin/login", require("./api/admin/login.js")],
  ["/api/admin/logout", require("./api/admin/logout.js")],
  ["/api/admin/session", require("./api/admin/session.js")],
  ["/api/admin/submit", require("./api/admin/submit.js")],
  ["/api/share/create", require("./api/share/create.js")],
]);
const accessShare = require("./api/share/access.js");
const { readCookies, verifyScope } = require("./api/share/_scope.js");

function protocolFor(request) {
  const forwarded = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  if (forwarded === "https") return "https";
  return request.socket.encrypted ? "https" : "http";
}

function normaliseCookie(value, protocol) {
  if (protocol !== "http") return value;
  const stripSecure = (cookie) => String(cookie).replace(/;\s*Secure(?=;|$)/gi, "");
  return Array.isArray(value) ? value.map(stripSecure) : stripSecure(value);
}

function responseAdapter(response, protocol) {
  return {
    statusCode: 200,
    setHeader(name, value) {
      response.setHeader(name, name.toLowerCase() === "set-cookie" ? normaliseCookie(value, protocol) : value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      response.statusCode = code;
      return this;
    },
    json(value) {
      if (!response.hasHeader("Content-Type")) response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(JSON.stringify(value));
      return this;
    },
    send(value) {
      if (!response.hasHeader("Content-Type")) {
        response.setHeader("Content-Type", Buffer.isBuffer(value) ? "application/octet-stream" : "text/html; charset=utf-8");
      }
      response.end(value);
      return this;
    },
    end(value) {
      response.end(value);
      return this;
    },
  };
}

async function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw Object.assign(new Error("Request body too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  if (String(request.headers["content-type"] || "").includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      throw Object.assign(new Error("Invalid JSON"), { statusCode: 400 });
    }
  }
  return raw;
}

function queryObject(url) {
  return Object.fromEntries(url.searchParams.entries());
}

async function runHandler(handler, request, response, url, query = queryObject(url)) {
  const protocol = protocolFor(request);
  const adaptedRequest = {
    method: request.method,
    headers: {
      ...request.headers,
      "x-real-ip": request.headers["x-real-ip"] || request.socket.remoteAddress || "unknown",
    },
    body: await readBody(request),
    query,
    protocol,
  };
  await handler(adaptedRequest, responseAdapter(response, protocol));
}

function isPermittedPath(pathname, repoName) {
  const demoPath = `/demos/${repoName}`;
  return pathname === demoPath
    || pathname.startsWith(`${demoPath}/`)
    || pathname === "/api/ai-advice"
    || pathname.startsWith("/api/share/")
    || pathname.startsWith("/share/")
    || pathname.startsWith("/shared/")
    || pathname === "/favicon.svg";
}

function blockedPage(repoName) {
  const href = `/demos/${encodeURIComponent(repoName)}/?shared=1`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>此分享僅限指定專案｜JV Demo 網站</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#172554;font-family:Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}.card{width:min(520px,calc(100vw - 48px));box-sizing:border-box;padding:32px;border:1px solid #bfdbfe;border-radius:20px;background:#fff;box-shadow:0 20px 48px rgba(30,64,175,.12)}h1{margin:0;font-size:24px}p{margin:12px 0 0;color:#475569;line-height:1.7}a{display:inline-flex;min-height:44px;align-items:center;margin-top:24px;padding:0 16px;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:800;text-decoration:none}</style></head><body><main class="card"><h1>此分享僅限指定專案</h1><p>此瀏覽器目前只可查看分享給你的 Demo。請回到該專案繼續操作。</p><a href="${href}">回到分享的 Demo</a></main></body></html>`;
}

function scopedProject(request, pathname) {
  const token = readCookies(request).jv_share_scope;
  const scope = token ? verifyScope(token) : null;
  if (!scope || isPermittedPath(pathname, scope.repoName)) return "";
  return scope.repoName;
}

function safeStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return "";
  }
  const segments = decoded.split("/").filter(Boolean);
  if (segments.some((segment) => segment.startsWith("."))) return "";
  if (serverOnlyRoots.has(segments[0]) || serverOnlyFiles.has(segments[0])) return "";
  const candidate = path.resolve(root, ...segments);
  return candidate === root || candidate.startsWith(`${root}${path.sep}`) ? candidate : "";
}

async function serveStatic(request, response, pathname) {
  let filePath = safeStaticPath(pathname);
  if (!filePath) return false;
  let stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch {
    if (!path.extname(filePath)) {
      filePath += ".html";
      try {
        stats = await fs.promises.stat(filePath);
      } catch {
        return false;
      }
    } else {
      return false;
    }
  }
  if (stats.isDirectory()) {
    filePath = path.join(filePath, "index.html");
    try {
      stats = await fs.promises.stat(filePath);
    } catch {
      return false;
    }
  }
  if (!stats.isFile()) return false;

  const type = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
  response.statusCode = 200;
  response.setHeader("Content-Type", type);
  response.setHeader("Content-Length", stats.size);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", type.startsWith("text/html") ? "no-cache" : "public, max-age=300");
  if (request.method === "HEAD") {
    response.end();
    return true;
  }
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.pipe(response);
  });
  return true;
}

export function createJvisionServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
      const pathname = url.pathname.replace(/\/{2,}/g, "/");
      const blockedRepo = scopedProject(request, pathname);
      if (blockedRepo) {
        response.writeHead(403, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex",
        });
        response.end(blockedPage(blockedRepo));
        return;
      }

      const shareMatch = pathname.match(/^\/share\/([a-z0-9][a-z0-9-]{0,119})\/?$/);
      if (shareMatch) {
        await runHandler(accessShare, request, response, url, {
          repo: shareMatch[1],
          token: url.searchParams.get("token") || "",
        });
        return;
      }

      const handler = apiRoutes.get(pathname.replace(/\/$/, ""));
      if (handler) {
        await runHandler(handler, request, response, url);
        return;
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      if (await serveStatic(request, response, pathname)) return;
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(error.statusCode || 500, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.statusCode ? error.message : "Internal server error" }));
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4173;
  const host = process.env.HOST || "0.0.0.0";
  createJvisionServer().listen(port, host, () => {
    console.log(`JV Demo server listening on http://${host}:${port}`);
  });
}

import { next } from "@vercel/functions";

const COOKIE_NAME = "jv_share_scope";
const REPO_NAME = /^[a-z0-9][a-z0-9-]{0,119}$/;
const encoder = new TextEncoder();

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlToText(value) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const value = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return value ? value.slice(name.length + 1) : "";
}

function sameText(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function readScope(token) {
  const secret = process.env.SHARE_LINK_SECRET;
  const [payload, signature, extra] = String(token || "").split(".");
  if (!secret || !payload || !signature || extra) return null;

  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
    if (!sameText(signature, expected)) return null;
    const value = JSON.parse(base64UrlToText(payload));
    const repoName = String(value?.repoName || "");
    const expiresAt = Number(value?.exp);
    if (value?.v !== 1 || !REPO_NAME.test(repoName) || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + 30 * 24 * 60 * 60 * 1000) return null;
    return { repoName, expiresAt };
  } catch {
    return null;
  }
}

function isPermittedPath(pathname, repoName) {
  const demoPath = `/demos/${repoName}`;
  return pathname === demoPath
    || pathname.startsWith(`${demoPath}/`)
    || pathname === "/api/ai-advice"
    || pathname === "/run"
    || pathname === "/systems"
    || pathname.startsWith("/systems/")
    || pathname.startsWith("/api/share/")
    || pathname.startsWith("/share/")
    || pathname.startsWith("/shared/")
    || pathname === "/favicon.svg";
}

function blockedResponse(request, repoName) {
  const href = new URL(`/demos/${encodeURIComponent(repoName)}/?shared=1`, request.url).href;
  return new Response(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>此分享僅限指定專案｜JV Demo 網站</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#172554;font-family:Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}.card{width:min(520px,calc(100vw - 48px));box-sizing:border-box;padding:32px;border:1px solid #bfdbfe;border-radius:20px;background:#fff;box-shadow:0 20px 48px rgba(30,64,175,.12)}h1{margin:0;font-size:24px}p{margin:12px 0 0;color:#475569;line-height:1.7}a{display:inline-flex;min-height:44px;align-items:center;margin-top:24px;padding:0 16px;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:800;text-decoration:none}a:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}</style></head><body><main class="card"><h1>此分享僅限指定專案</h1><p>此瀏覽器目前只可查看分享給你的 Demo。請回到該專案繼續操作。</p><a href="${href}">回到分享的 Demo</a></main></body></html>`, { status: 403, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store, max-age=0", "x-robots-tag": "noindex" } });
}

export default async function middleware(request) {
  const scope = await readScope(getCookie(request, COOKIE_NAME));
  if (!scope || isPermittedPath(new URL(request.url).pathname, scope.repoName)) return next();
  return blockedResponse(request, scope.repoName);
}

export const config = { runtime: "edge" };

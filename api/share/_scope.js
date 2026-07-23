const crypto = require("node:crypto");

const SCOPE_COOKIE = "jv_share_scope";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REPO_NAME = /^[a-z0-9][a-z0-9-]{0,119}$/;

function secret() {
  return process.env.SHARE_LINK_SECRET || "";
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function normaliseRepoName(value) {
  const repoName = String(value || "").trim().toLowerCase();
  return REPO_NAME.test(repoName) ? repoName : "";
}

function createScope(repoName, ttlMs = DEFAULT_TTL_MS) {
  const safeRepoName = normaliseRepoName(repoName);
  if (!secret() || !safeRepoName) return null;

  const expiresAt = Date.now() + Math.min(Math.max(Number(ttlMs) || DEFAULT_TTL_MS, 60_000), MAX_TTL_MS);
  const payload = Buffer.from(JSON.stringify({ v: 1, repoName: safeRepoName, exp: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function verifyScope(token, expectedRepoName = "") {
  if (!secret() || typeof token !== "string") return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload))) return null;

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const repoName = normaliseRepoName(value?.repoName);
    const expected = expectedRepoName ? normaliseRepoName(expectedRepoName) : "";
    const exp = Number(value?.exp);
    if (value?.v !== 1 || !repoName || !Number.isFinite(exp) || exp <= Date.now() || exp > Date.now() + MAX_TTL_MS || (expected && expected !== repoName)) return null;
    return { repoName, expiresAt: exp };
  } catch {
    return null;
  }
}

function readCookies(request) {
  return Object.fromEntries(String(request?.headers?.cookie || "")
    .split(";")
    .map((entry) => entry.trim().split(/=(.*)/s))
    .filter(([name]) => name));
}

function cookieForScope(token, expiresAt) {
  const maxAge = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
  return `${SCOPE_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

module.exports = {
  DEFAULT_TTL_MS,
  SCOPE_COOKIE,
  cookieForScope,
  createScope,
  normaliseRepoName,
  readCookies,
  verifyScope,
};

const { createScope, normaliseRepoName } = require("./_scope");

const catalog = require("../../projects-index.json");
const validProjects = new Set(catalog.projects.map((project) => project.repoName));
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 30;
const requests = new Map();

function getIp(req) {
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "unknown").split(",")[0].trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const current = (requests.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  if (current.length >= RATE_LIMIT) {
    requests.set(ip, current);
    return true;
  }
  current.push(now);
  requests.set(ip, current);
  return false;
}

function body(req) {
  if (typeof req.body !== "string") return req.body || {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.SHARE_LINK_SECRET) return res.status(503).json({ error: "分享連結服務尚未設定" });
  if (rateLimited(getIp(req))) return res.status(429).json({ error: "分享連結建立過於頻繁，請稍後再試" });

  const repoName = normaliseRepoName(body(req).repoName);
  if (!repoName || !validProjects.has(repoName)) return res.status(404).json({ error: "找不到指定的 Demo" });

  const scope = createScope(repoName);
  if (!scope) return res.status(503).json({ error: "分享連結服務尚未設定" });

  return res.status(200).json({
    url: `/share/${encodeURIComponent(repoName)}/?token=${encodeURIComponent(scope.token)}`,
    expiresAt: new Date(scope.expiresAt).toISOString(),
  });
};

module.exports._test = { body, validProjects };

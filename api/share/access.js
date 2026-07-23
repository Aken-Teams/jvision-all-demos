const { cookieForScope, normaliseRepoName, verifyScope } = require("./_scope");

function errorPage(message) {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>分享連結無法使用｜JV Demo 網站</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#172554;font-family:Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}.card{width:min(520px,calc(100vw - 48px));box-sizing:border-box;padding:32px;border:1px solid #bfdbfe;border-radius:20px;background:#fff;box-shadow:0 20px 48px rgba(30,64,175,.12)}h1{margin:0;font-size:24px}p{margin:12px 0 0;color:#475569;line-height:1.7}a{display:inline-flex;min-height:44px;align-items:center;margin-top:24px;padding:0 16px;border-radius:10px;background:#1d4ed8;color:#fff;font-weight:800;text-decoration:none}a:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}</style></head><body><main class="card"><h1>分享連結無法使用</h1><p>${message}</p><a href="/">前往 JV Demo 網站</a></main></body></html>`;
}

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const repoName = normaliseRepoName(req.query?.repo);
  const token = typeof req.query?.token === "string" ? req.query.token : "";
  const scope = repoName && verifyScope(token, repoName);

  if (!scope) return res.status(403).send(errorPage("此連結可能已過期、已被修改，或不是有效的專案分享連結。"));

  res.setHeader("Set-Cookie", cookieForScope(token, scope.expiresAt));
  res.setHeader("Location", `/demos/${encodeURIComponent(scope.repoName)}/?shared=1`);
  return res.status(302).end();
};

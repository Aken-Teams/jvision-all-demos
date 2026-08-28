/**
 * 反爬蟲限流。以 IP 為單位的雙桶 token bucket：
 *
 *   一般請求　突發 150、每分鐘回補 90 —— 正常人到不了這個量
 *   demo 頁　　突發 60、每分鐘回補 20 —— 目錄卡片一次會拉進多個 iframe，
 *             突發要容得下；但要爬完 1,600 套得連續掃一個多小時，
 *             在動作紀錄裡會亮得像聖誕樹
 *
 * 迴環位址不限流：本機的監看、健檢、驗收工具全走 127.0.0.1，限了只會
 * 打斷自己的產線。真正的上層防線是 Cloudflare 的 bot 防護，這裡是站內底線。
 */
const buckets = new Map();
const CONF = {
  page: { burst: 150, perMin: 90 },
  demo: { burst: 60, perMin: 20 },
};

function take(key, kind) {
  const c = CONF[kind];
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) { b = { tokens: c.burst, at: now, flagged: 0 }; buckets.set(key, b); }
  b.tokens = Math.min(c.burst, b.tokens + ((now - b.at) / 60000) * c.perMin);
  b.at = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

export const isLoopback = (ip) => ip === "127.0.0.1" || ip === "::1" || ip === "";

/**
 * @returns {null | {status:number, why:string, firstBlock:boolean}} null = 放行
 */
export function check(ip, pathname, userAgent) {
  if (isLoopback(ip)) return null;

  /* 明擺著的抓取工具直接擋。偽裝 UA 很容易，這不是防禦而是門檻——
     會偽裝的還有限流與登入牆在等。 */
  if (/\b(bot|crawl|spider|scrapy|python-requests|python-urllib|go-http-client|curl|wget|httpclient|aiohttp|java\/)\b/i.test(userAgent || "")) {
    return { status: 403, why: `爬蟲 UA：${String(userAgent).slice(0, 40)}`, firstBlock: mark(ip) };
  }

  const isDemo = /^\/demos\//.test(pathname);
  if (!take(ip + (isDemo ? "|d" : "|p"), isDemo ? "demo" : "page")) {
    return { status: 429, why: isDemo ? "demo 頁超速" : "請求超速", firstBlock: mark(ip) };
  }
  return null;
}

/* 同一顆 IP 十分鐘內只記一筆動作紀錄——被限流的爬蟲每秒都在敲，
   逐筆記錄會把紀錄檔灌爆，那本身就成了另一種攻擊面。 */
function mark(ip) {
  const b = buckets.get(ip + "|m") || { at: 0 };
  buckets.set(ip + "|m", b);
  if (Date.now() - b.at > 600000) { b.at = Date.now(); return true; }
  return false;
}

/* 桶子表定期清掃，閒置一小時的丟掉 */
setInterval(() => {
  const cut = Date.now() - 3600000;
  for (const [k, b] of buckets) if (b.at < cut) buckets.delete(k);
}, 600000).unref();

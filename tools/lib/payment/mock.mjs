/**
 * 模擬金流：不收錢，但把真實金流會有的每一個環節都走一遍。
 *
 * 存在的意義是讓「下單 → 付款 → 建置」這條路在沒有金流商的情況下就能完整驗證，
 * 之後換成真的只要換一個檔。所以它刻意保留了真金流一定會有的兩件事：
 *   1. 付款頁是另一個網址（不是同一個請求裡直接完成）
 *   2. 回呼帶簽章，收到時要驗
 *
 * 簽章用站台自己的密鑰。真金流是用商店密鑰驗，形狀一樣，換掉的只是密鑰來源。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT } from "../forge-common.mjs";

function secret() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, "var", "admin.json"), "utf8")).secret; }
  catch { return "jv-mock-payment"; }
}

const sign = (ref) => crypto.createHmac("sha256", secret()).update(`mock:${ref}`).digest("base64url");

export function createCheckout(order) {
  /* ref 是這一次付款的識別。真金流是他們給的交易編號；這裡用訂單編號加時間，
     重新付款會產生新的 ref，才不會與上一次的回呼撞在一起。 */
  const ref = `mock_${order.id}_${Date.now().toString(36)}`;
  return {
    ref,
    url: `/pay?ref=${encodeURIComponent(ref)}&order=${encodeURIComponent(order.id)}&sig=${sign(ref)}`,
  };
}

export function verifyCallback(req, body) {
  const ref = String(body.ref || "");
  const sig = String(body.sig || "");
  const expected = sign(ref);
  /* 長度不同時 timingSafeEqual 會直接丟例外，先擋掉。 */
  if (!ref || sig.length !== expected.length) return { ok: false };
  const same = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!same) return { ok: false };
  const m = /^mock_(o_[a-z0-9_]+)_/i.exec(ref);
  return { ok: true, ref, orderId: m ? m[1] : null, paidAt: new Date().toISOString() };
}

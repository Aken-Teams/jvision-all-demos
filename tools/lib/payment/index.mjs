/**
 * 金流層。刻意只定義契約，實作各自成檔。
 *
 * 站主還沒選定金流商，所以先用 mock 把整條流程跑通。之後接綠界／藍新／Stripe
 * 時只要新增一個實作檔並改 var/payment.json 的 provider，其餘程式碼不動。
 *
 * 契約只有兩個動作：
 *   createCheckout(order)  → { url, ref }   把人帶去付款頁
 *   verifyCallback(req, body) → { ok, ref } 確認這通回呼是真的、對應哪一筆
 *
 * 回呼**只做一件事**：把訂單推進 paid。建置由 worker 主動拉 paid 的單，
 * 而不是由回呼直接觸發——回呼掉了還有 worker 定期掃，回呼重複了狀態機擋住。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../forge-common.mjs";

const CONF = path.join(ROOT, "var", "payment.json");

/** 設定。放 var/ 不進版控——之後接真金流時這裡會有商店代號與密鑰。 */
export function config() {
  try { return JSON.parse(fs.readFileSync(CONF, "utf8")); }
  catch { return { provider: "mock" }; }
}

const IMPLS = { mock: () => import("./mock.mjs") };

export async function provider() {
  const name = config().provider || "mock";
  const load = IMPLS[name];
  if (!load) throw Object.assign(new Error(`沒有這個金流實作：${name}`), { status: 500 });
  return load();
}

export async function createCheckout(order) {
  return (await provider()).createCheckout(order, config());
}

export async function verifyCallback(req, body) {
  return (await provider()).verifyCallback(req, body, config());
}

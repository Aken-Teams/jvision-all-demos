#!/usr/bin/env node
/**
 * 給 shell 用的動作記錄器，讓 agent-loop.sh 也能把每個階段寫進後台。
 *
 *   node tools/action-log.mjs <來源> <動作> [對象] [狀態] [備註]
 *   node tools/action-log.mjs Agent 上架 jvision-foo 200 "站上 1334 套"
 */
import path from "node:path";
import { recordTo } from "./lib/action-log.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const [actor, action, target, status, note] = process.argv.slice(2);
if (!actor || !action) {
  console.error("用法：node tools/action-log.mjs <來源> <動作> [對象] [狀態] [備註]");
  process.exit(2);
}
recordTo(ROOT, {
  actor, action,
  target: target || undefined,
  status: status ? (Number.isNaN(Number(status)) ? status : Number(status)) : undefined,
  note: note || undefined,
});

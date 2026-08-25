#!/usr/bin/env bash
# Agent 看門狗：確認每天真的有在產出。
#
# systemd 的 Restart=always 只處理「程序死掉」。真正吃掉一整天的是**卡住**
# ——程序還在、只是沒有進展（實測 codex 連續逾時六輪，agent 停了四小時沒人
# 發現）。那種情況 systemd 看起來一切正常，所以需要另外一隻定期來看有沒有動。
#
# 判斷方式刻意保守，只在「明明該動卻沒動」時才重啟：
#   1. 服務沒在跑           → 啟動它
#   2. 今日額度已滿         → 什麼都不做（休息中不寫 log 是正常的）
#   3. 額度未滿但 log 停滯   → 重啟
set -uo pipefail
cd "$(dirname "$0")/.."

STATE=docs/_state
LOG="$STATE/agent-loop.log"
SERVICE=jvdemo-agent.service
# 每日額度只定義在 docs/_state/agent-quota 一個地方。原本 unit 的參數、
# agent-loop 的預設值、這裡各寫一份 5，改一個地方就會不一致——而不一致的
# 後果是看門狗在額度已滿時仍判定「該動卻沒動」，每天固定亂重啟一次。
DAILY=$(cat "$STATE/agent-quota" 2>/dev/null || echo 5)
STALL_MIN=90            # 一套約 6 分鐘、每日收尾約 12 分鐘，90 分鐘沒動就是卡住了

log() { printf '%s  %s\n' "$(date '+%m-%d %H:%M:%S')" "$1" >> "$STATE/agent-watchdog.log"; }
note() { node tools/action-log.mjs 看門狗 "$@" >/dev/null 2>&1 || true; }

if ! systemctl --user is-active --quiet "$SERVICE"; then
  log "服務沒在跑，啟動它"
  note "服務未執行，已啟動" "" 500
  systemctl --user start "$SERVICE"
  exit 0
fi

made_today=$(node -e '
  const fs=require("fs");let t={};
  try{t=JSON.parse(fs.readFileSync("'"$STATE"'/agent-daily.json","utf8"))}catch{}
  console.log(t[new Date().toLocaleDateString("sv")]||0);' 2>/dev/null || echo 0)

# 額度已滿不代表沒事。做滿之後還有每日收尾（全站預覽檢查、console 掃描、
# 更新 PR），那一段也會卡——實測 git push 走 SSH 卡了一小時三十八分，收尾停在
# 那裡、標記檔沒寫、Agent 也沒進入休息，而看門狗連續三次判定「休息中，不介入」，
# 正好把這種卡法遮住。所以要分辨「收尾做完了」和「還在收尾」：
#   有標記檔  → 收尾已完成，接下來的安靜是正常的休息
#   沒有標記檔 → 還在收尾，一樣適用停滯判斷
WRAPUP_MARK="$STATE/agent-wrapup-$(date +%F)"
if [ "${made_today:-0}" -ge "$DAILY" ] && [ -f "$WRAPUP_MARK" ]; then
  log "今日已完成 $made_today/$DAILY，收尾已結束，休息中，不介入"
  exit 0
fi

if [ ! -f "$LOG" ]; then log "找不到 $LOG，不介入"; exit 0; fi
idle_min=$(( ( $(date +%s) - $(stat -c %Y "$LOG") ) / 60 ))

if [ "$idle_min" -ge "$STALL_MIN" ]; then
  phase="開發中"; [ "${made_today:-0}" -ge "$DAILY" ] && phase="每日收尾中"
  log "今日 $made_today/$DAILY（$phase）但 log 已 $idle_min 分鐘沒動靜，重啟服務"
  note "偵測到卡住，已重啟" "" 500 "今日 $made_today/$DAILY（$phase），停滯 $idle_min 分鐘"
  systemctl --user restart "$SERVICE"
else
  log "今日 $made_today/$DAILY，log $idle_min 分鐘前還有動靜，正常"
fi

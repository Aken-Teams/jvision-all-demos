#!/usr/bin/env bash
# 讓持續開發 Agent 停下來——而且停得住。
#
# 原本這支只 touch 一個旗標，agent-loop 看到就收工。實測那樣停不住，有三道
# 力量會把它拉回來，缺一道都不行：
#   1. unit 是 Restart=always  → 旗標讓 loop 乾淨退出，systemd 60 秒後又拉起來
#   2. agent-loop 開機第 43 行 rm -f "$STOP" → 新程序一開始就把旗標刪了
#   3. 看門狗計時器每 30 分鐘檢查 → 看到服務沒在跑就直接 start
# 所以「停」必須是：先關看門狗、再放旗標、最後 systemctl stop。
# systemd 的顯式 stop 不會觸發 Restart=always，這是唯一擋得住第 1 點的方式。
#
# 手上那一套會被中斷，但不會留下爛攤子：manifest 裡它的 state 還是 building、
# 也還沒進 content/catalog-index.json，下次啟動會重新接手。
set -uo pipefail
cd "$(dirname "$0")/.."

systemctl --user stop jvdemo-watchdog.timer 2>/dev/null
touch docs/_state/AGENT_STOP
systemctl --user stop jvdemo-agent.service 2>/dev/null

sleep 2
printf '已停止。\n'
printf '  開發 Agent      %s\n' "$(systemctl --user is-active jvdemo-agent.service 2>&1)"
printf '  看門狗計時器    %s\n' "$(systemctl --user is-active jvdemo-watchdog.timer 2>&1)"
cur=$(cat docs/_state/agent-current.txt 2>/dev/null || true)
[ -n "$cur" ] && printf '  中斷於          %s（下次啟動會重新接手）\n' "$cur"
printf '\n要恢復：bash tools/agent-start.sh\n'

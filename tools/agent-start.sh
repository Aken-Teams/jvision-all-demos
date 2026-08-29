#!/usr/bin/env bash
# 讓持續開發 Agent 重新開始。
#
# 要把 agent-stop.sh 關掉的三樣東西都打開，否則會停在半停半跑的狀態：
# 只 start 服務而沒開看門狗，卡住時就沒有人會發現（實測卡過四小時）。
set -uo pipefail
cd "$(dirname "$0")/.."

rm -f docs/_state/AGENT_STOP
systemctl --user start jvdemo-agent.service
systemctl --user start jvdemo-watchdog.timer

sleep 2
printf '已啟動。\n'
printf '  開發 Agent      %s\n' "$(systemctl --user is-active jvdemo-agent.service 2>&1)"
printf '  看門狗計時器    %s\n' "$(systemctl --user is-active jvdemo-watchdog.timer 2>&1)"

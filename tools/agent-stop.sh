#!/usr/bin/env bash
# 請持續開發 Agent 停下來。
#
# 不直接 kill：那會讓正在跑的 codex 留下孤兒程序、demo 只寫一半。
# 改成放一個旗標，Agent 做完手上這一輪（含驗收與上架）才收工。
cd "$(dirname "$0")/.."
touch docs/_state/AGENT_STOP
echo "已送出停止訊號。Agent 會在本輪結束後停下（可能需要數十分鐘）。"
echo "要立即中止請執行：pkill -f agent-loop.sh"

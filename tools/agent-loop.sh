#!/usr/bin/env bash
# 持續開發 Agent：一次做完一套，再做下一套，直到收到停止訊號或缺口補滿。
#
#   tools/agent-loop.sh            一次一套（預設）
#   tools/agent-stop.sh            請它做完手上這套後停下
#
# 每一套都走完整流程：建置 → 瀏覽器驗收 → 修溢出 → 重驗 → 上架。
# 上一套上架後才開始下一套，所以站上數字是一套一套往上跳的。
#
# 題目採佇列制而非每套都重新出題：codex 一次呼叫本來就會回十幾題，
# 為了一套題目就跑一次完整出題等於丟掉其餘十幾題。佇列空了才補，
# 補的時候會重算產業缺口，所以分布仍會隨著站上內容動態調整。
set -uo pipefail
cd "$(dirname "$0")/.."

STATE=docs/_state
STOP="$STATE/AGENT_STOP"
QUEUE="$STATE/agent-queue.json"
CYCLES="$STATE/agent-cycles.jsonl"
REFILL="${1:-20}"          # 佇列補題時一次出幾題
MIN_DEFICIT=20             # 缺口小於此值視為飽和，再逼出題只會得到換皮重複品
mkdir -p "$STATE"
rm -f "$STOP"

say() { printf '\n\033[1m═══ %s\033[0m  %s\n' "$1" "$(date '+%m-%d %H:%M:%S')"; }
count_site() { node -e 'console.log(require("./projects-index.json").projects.length)'; }

total_deficit() {
  node tools/topic-scout.mjs --gap-only 2>/dev/null \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
        try{const j=JSON.parse(s.slice(s.indexOf("{")));
          console.log(j.byCategory.reduce((a,r)=>a+r.deficit,0));}catch{console.log(0)}});'
}

queue_len() {
  node -e 'try{console.log((require("./'"$QUEUE"'").accepted||[]).length)}catch{console.log(0)}'
}

made=0
while true; do
  [ -f "$STOP" ] && { say "收到停止訊號，Agent 結束"; rm -f "$STOP"; break; }

  # ── 佇列空了就補題（重算缺口）──
  if [ "$(queue_len)" -eq 0 ]; then
    DEFICIT=$(total_deficit)
    if [ "${DEFICIT:-0}" -lt "$MIN_DEFICIT" ]; then
      say "所有產業已達目標（總缺口 $DEFICIT），Agent 自行停止"; break
    fi
    say "佇列空，重算缺口後補 $REFILL 題（目前總缺口 $DEFICIT）"
    node tools/topic-scout.mjs --count="$REFILL" --rounds=6 --out="$QUEUE" \
      > "$STATE/agent-scout.log" 2>&1
    [ "$(queue_len)" -eq 0 ] && { say "補題失敗，停止（見 $STATE/agent-scout.log）"; tail -12 "$STATE/agent-scout.log"; break; }
    say "已補 $(queue_len) 題"
  fi

  # ── 取出第一題 ──
  SLUG=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].slug)')
  TITLE=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].title)')
  CAT=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].category)')
  REPO="jvision-$SLUG"
  BEFORE=$(count_site)
  say "開發《$TITLE》（$CAT）　站上 $BEFORE 套"

  node -e '
const fs=require("fs");
fs.writeFileSync("docs/_state/current-job.json",JSON.stringify({
  phase:`開發《'"$TITLE"'》（'"$CAT"'）`,
  action:"建置 → 驗收 → 修溢出 → 重驗 → 上架",
  pid:Number(process.env.AGENT_PID||0),startedAt:Date.now(),total:1,concurrency:1,
  logPath:"docs/_state/agent-current.log",listPath:"docs/_state/agent-current.txt"},null,2)+"\n");
fs.writeFileSync("docs/_state/agent-current.txt","'"$REPO"'\n");'

  # ── 建置 ──
  node tools/demo-forge.mjs --from="$QUEUE" --pick="$SLUG" --concurrency=1 --timeout=1800 \
    > "$STATE/agent-current.log" 2>&1
  if [ ! -f "demos/$REPO/index.html" ]; then
    echo "  ✖ 建置失敗，跳過此題"
    node -e 'const fs=require("fs");const q=require("./'"$QUEUE"'");q.accepted.shift();fs.writeFileSync("'"$QUEUE"'",JSON.stringify(q,null,2)+"\n");'
    continue
  fi

  # ── 驗收 → 修 → 重驗（最多兩次修正）──
  ok=0
  for attempt in 1 2; do
    node tools/lib/verify-runner.mjs 4599 "$REPO" >> "$STATE/agent-current.log" 2>&1
    if grep -q "^OK $REPO" "$STATE/agent-current.log"; then ok=1; break; fi
    echo "  第 $attempt 次驗收未過，嘗試修正"
    node tools/fix-demo-overflow.mjs --port=4599 --concurrency=1 "$REPO" >> "$STATE/agent-current.log" 2>&1
  done

  if [ "$ok" -ne 1 ]; then
    echo "  ✖ 驗收仍未過，保留為草稿不上架（見 $STATE/agent-current.log）"
    node -e 'const fs=require("fs");const q=require("./'"$QUEUE"'");q.accepted.shift();fs.writeFileSync("'"$QUEUE"'",JSON.stringify(q,null,2)+"\n");'
    continue
  fi

  # ── 上架 ──
  node -e '
const fs=require("fs");const p="docs/DEMO_FORGE_MANIFEST.json";const m=JSON.parse(fs.readFileSync(p,"utf8"));
const e=m.entries.find(x=>x.repoName==="'"$REPO"'");
if(e){e.state="verified";e.checks={...(e.checks||{}),browser:{pass:true,at:new Date().toISOString()}};}
fs.writeFileSync(p,JSON.stringify(m,null,2)+"\n");'
  node tools/demo-publish.mjs --repo="$REPO" >> "$STATE/agent-current.log" 2>&1
  node tools/sync-catalog-counts.mjs > /dev/null 2>&1
  node tools/build-import-timeline.mjs > /dev/null 2>&1

  # ── 出佇列並記錄 ──
  node -e 'const fs=require("fs");const q=require("./'"$QUEUE"'");q.accepted.shift();fs.writeFileSync("'"$QUEUE"'",JSON.stringify(q,null,2)+"\n");'
  AFTER=$(count_site)
  made=$((made + 1))
  node -e '
const fs=require("fs");const [n,repo,title,cat,before,after]=process.argv.slice(1);
fs.appendFileSync("'"$CYCLES"'",JSON.stringify({cycle:Number(n),tag:repo,title,category:cat,
  at:new Date().toISOString(),before:Number(before),after:Number(after),
  added:Number(after)-Number(before)})+"\n");' "$made" "$REPO" "$TITLE" "$CAT" "$BEFORE" "$AFTER"
  say "《$TITLE》完成並上架　站上 $AFTER 套（本次 Agent 已做 $made 套）"
done

say "Agent 已停止　本次共完成 $made 套　站上 $(count_site) 套"

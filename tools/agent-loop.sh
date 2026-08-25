#!/usr/bin/env bash
# 持續開發 Agent：每天做滿額度就休息到隔天，只有收到停止訊號才真的停下。
#
#   tools/agent-loop.sh [每日額度]     預設一天 5 套
#   tools/agent-stop.sh                做完手上這套後停下
#
# 每一套都走完整流程：建置 → 瀏覽器驗收 → 修溢出 → 重驗 → 上架。
# 上一套上架後才開始下一套，所以站上數字是一套一套往上跳的。
#
# 題目採佇列制而非每套都重新出題：一次圓桌討論本來就會產出十幾題，
# 為了一套題目就跑一次完整討論等於丟掉其餘十幾題。佇列空了才補，
# 補的時候會重算產業缺口，所以分布仍會隨著站上內容動態調整。
set -uo pipefail
cd "$(dirname "$0")/.."

STATE=docs/_state
STOP="$STATE/AGENT_STOP"
QUEUE="$STATE/agent-queue.json"
CYCLES="$STATE/agent-cycles.jsonl"
TALLY="$STATE/agent-daily.json"
LOGDIR="$STATE/agent-logs"
# 每日額度：參數優先，其次讀 docs/_state/agent-quota，最後才是預設值。
# 定義在檔案裡而不是寫死在 systemd unit 的參數，是因為看門狗也要知道這個
# 數字——兩邊各寫一份，改一個地方就會不一致，而不一致的後果是看門狗在
# 額度已滿時仍判定「該動卻沒動」，每天固定亂重啟一次。改額度只要改那個檔。
DAILY="${1:-$(cat "$STATE/agent-quota" 2>/dev/null || echo 5)}"
# 佇列補題時一次出幾題。要蓋得住至少一天的產量，不然一天要開好幾次圓桌
# ——一次圓桌是五個角色平行呼叫 codex 加上主席收斂，比建一套 demo 還貴。
# 去重通過率會浮動（實測從 14 題過 4 題到 40 題過 39 題都有），所以抓寬一點；
# 真的不夠用時佇列空了會自己再補，不會卡住。
REFILL=60
mkdir -p "$STATE" "$LOGDIR"

# 同時只能有一個 agent。兩個 agent 會搶同一份佇列：兩邊各自讀 accepted[0]、
# 各自 shift 再寫回，結果是同一題被做兩次、另一題被跳過。systemd 服務加上
# 手動執行同一支腳本很容易就變成這樣。
exec 9>"$STATE/agent.lock"
if ! flock -n 9; then
  echo "已經有一個 agent 在跑（$STATE/agent.lock）。要停它請執行 tools/agent-stop.sh" >&2
  exit 1
fi

rm -f "$STOP"

say() { printf '\n\033[1m═══ %s\033[0m  %s\n' "$1" "$(date '+%m-%d %H:%M:%S')"; }

# 每個階段都寫進後台的動作紀錄。後台要的是「站上發生了什麼」，
# 而 agent 是站上動作的最大來源——只記在 log 檔的話，後台看不到它。
act() { node tools/action-log.mjs Agent "$@" >/dev/null 2>&1 || true; }

# 把剛上架的那一套提交起來。沒有 commit 的話，PR 裡什麼都看不到，
# 而且工作區會累積上千個未追蹤檔，任何 git 操作都變得難以判讀。
#
# 用 git commit --only 而不是先 git add 再 git commit：後者會把使用者原本
# 就 staged 的檔案一起掃進來（實測發生過三次，每次都要事後從 blob 還原）。
# --only 會用 HEAD 加上指定路徑另外組一份索引，其餘 staged 內容原封不動。
commit_demo() {
  local repo="$1" title="$2" after="$3"
  local branch; branch=$(git rev-parse --abbrev-ref HEAD)
  if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
    echo "  ⚠ 目前在 $branch，依規定不直接提交"; return 0
  fi
  local paths=("demos/$repo" "content/details/$repo.json" projects-index.json
               docs/DEMO_FORGE_MANIFEST.json content/import-timeline.json
               index.html catalog.html agents.html)
  local exist=()
  for p in "${paths[@]}"; do [ -e "$p" ] && exist+=("$p"); done
  [ ${#exist[@]} -eq 0 ] && return 0
  git add -- "${exist[@]}" >/dev/null 2>&1
  if git commit --only -q -m "新增《$title》（$repo），站上 $after 套" -- "${exist[@]}" >/dev/null 2>&1; then
    act "已提交" "$repo" 200 "$(git rev-parse --short HEAD)"
  else
    echo "  ⚠ 提交失敗或無變更"
  fi
}
count_site() { node -e 'console.log(require("./projects-index.json").projects.length)'; }
queue_len() { node -e 'try{console.log((require("./'"$QUEUE"'").accepted||[]).length)}catch{console.log(0)}'; }

# 今天已經做了幾套。用日期當 key，跨日自動歸零；重開 agent 也不會把
# 今天已經做掉的額度忘記重做一次。
today() { date '+%Y-%m-%d'; }
made_today() {
  node -e '
    const fs=require("fs");let t={};
    try{t=JSON.parse(fs.readFileSync("'"$TALLY"'","utf8"))}catch{}
    console.log(t["'"$(today)"'"]||0);'
}
bump_today() {
  node -e '
    const fs=require("fs");const k="'"$(today)"'";let t={};
    try{t=JSON.parse(fs.readFileSync("'"$TALLY"'","utf8"))}catch{}
    t[k]=(t[k]||0)+1;
    /* 只留最近 60 天，這個檔不需要無限長大 */
    const keys=Object.keys(t).sort().slice(-60);
    fs.writeFileSync("'"$TALLY"'",JSON.stringify(Object.fromEntries(keys.map(k=>[k,t[k]])),null,2)+"\n");'
}

# 每天做滿額度之後的收尾：全站預覽檢查、console 掃描、更新 PR。
#
# 用日期標記確保一天只做一次。這段原本寫在 rest_until_tomorrow() 裡面是錯的
# ——那個函式每次迴圈只要額度已滿就會被呼叫，於是每重啟一次 agent 就重跑一次
# 十幾分鐘的全站掃描並多推一次分支（實測今天重啟五次，log 裡就留下三行沒有
# 下文的「推送」，都是掃到一半被 systemctl stop 砍掉的）。
daily_wrapup() {
  local mark="$STATE/agent-wrapup-$(today)"
  [ -f "$mark" ] && return 0

  # 每天全站掃一次預覽畫面。單套的驗收在建置時就做過了，但共用檔案的變動
  # 或目錄資料出錯會讓「本來好好的卡片」變空白——那不會報錯，目錄照樣顯示、
  # 連結照樣能點，只有畫面是空的，不主動查就不會發現。
  if node tools/check-previews.mjs --render > "$STATE/agent-preview.log" 2>&1; then
    act "預覽全站檢查" "" 200 "$(grep -E '畫得出畫面' "$STATE/agent-preview.log" | tail -1 | tr -s ' ')"
    say "預覽檢查通過：全部專案都有預覽畫面"
  else
    act "預覽檢查發現空白卡片" "" 500 "$(tail -1 "$STATE/agent-preview.log")"
    say "⚠ 有專案看不到預覽畫面（見 $STATE/agent-preview.log）"
    grep -A 12 '空白或載入失敗 ──' "$STATE/agent-preview.log" | tail -12
  fi

  # 掃一次全站的 console 錯誤。一套不到一秒，1337 套約兩分鐘。這比逐套跑完整
  # 驗收便宜太多，而且抓得到「共用檔案改動後才壞掉」的情況——原本那 538 套舊
  # demo 就有兩套帶著 ReferenceError 上架了很久沒人發現。
  if node tools/scan-console-errors.mjs > "$STATE/agent-console.log" 2>&1; then
    act "console 全站檢查" "" 200 "$(grep -E '無錯誤' "$STATE/agent-console.log" | tail -1 | tr -s ' ')"
    say "console 檢查通過：全站無錯誤"
  else
    act "console 檢查發現錯誤" "" 500 "$(grep -E '有錯誤' "$STATE/agent-console.log" | tail -1 | tr -s ' ')"
    say "⚠ 有 demo 會噴 console 錯誤（見 $STATE/agent-console.log）"
    grep -A 8 '出錯的 demo ──' "$STATE/agent-console.log" | tail -8
  fi

  # 一天推一次、更新同一個 PR。每上架一套就推一次太吵，而且 PR 內文是依
  # 當下狀態重算的，一天更新一次就足以反映當天的全部產出。
  if node tools/open-pr.mjs > "$STATE/agent-pr.log" 2>&1; then
    act "已更新 PR" "" 200 "$(tail -1 "$STATE/agent-pr.log")"
    say "PR 已更新：$(tail -1 "$STATE/agent-pr.log")"
  else
    act "PR 更新失敗" "" 500 "$(grep -E '✖|error' "$STATE/agent-pr.log" | head -1)"
    say "PR 未更新（見 $STATE/agent-pr.log）"
    tail -8 "$STATE/agent-pr.log"
  fi

  : > "$mark"
  # 標記檔留一週就好，不需要無限累積。
  find "$STATE" -maxdepth 1 -name 'agent-wrapup-*' -mtime +7 -delete 2>/dev/null || true
}

# 休息到明天。每 5 分鐘醒來看一次停止訊號，不然叫停之後還要等到半夜才生效。
rest_until_tomorrow() {
  say "今天的 $DAILY 套已完成，休息到明天（每 5 分鐘檢查一次停止訊號）"
  act "今日額度完成" "" 200 "$DAILY 套"

  local start; start=$(today)
  while [ "$(today)" = "$start" ]; do
    [ -f "$STOP" ] && return 1
    sleep 300
  done
  say "換日，繼續開發"
  return 0
}

act "啟動" "" 200 "每日額度 $DAILY 套"

made=0
while true; do
  [ -f "$STOP" ] && { act "停止" "" 200 "收到停止訊號"; say "收到停止訊號，Agent 結束"; rm -f "$STOP"; break; }

  # ── 今日額度 ──
  DONE_TODAY=$(made_today)
  if [ "${DONE_TODAY:-0}" -ge "$DAILY" ]; then
    daily_wrapup
    rest_until_tomorrow || { say "休息期間收到停止訊號，Agent 結束"; rm -f "$STOP"; break; }
    continue
  fi

  # ── 佇列空了就補題（重算缺口 + 圓桌討論）──
  if [ "$(queue_len)" -eq 0 ]; then
    say "佇列空，重算缺口後開圓桌補 $REFILL 題"
    act "圓桌出題" "缺口補題" "" "目標 $REFILL 題"
    node tools/topic-scout.mjs --count="$REFILL" --rounds=6 --out="$QUEUE" \
      > "$STATE/agent-scout.log" 2>&1
    if [ "$(queue_len)" -eq 0 ]; then
      # 補題失敗不停 agent。出題會因為 codex 逾時、額度、暫時性錯誤而失敗，
      # 那些都是等一下就好的事；為此把整個 agent 停掉，等於每次小故障都要
      # 人工重啟（實測發生過一次，停了四小時沒人發現）。
      act "出題失敗" "" 500 "10 分鐘後重試"
      say "補題失敗，10 分鐘後重試（見 $STATE/agent-scout.log）"
      tail -6 "$STATE/agent-scout.log"
      for _ in $(seq 1 20); do [ -f "$STOP" ] && break; sleep 30; done
      continue
    fi
    say "已補 $(queue_len) 題"
    act "出題完成" "" 200 "佇列 $(queue_len) 題"
  fi

  # ── 取出第一題 ──
  SLUG=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].slug)')
  TITLE=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].title)')
  CAT=$(node -e 'const q=require("./'"$QUEUE"'");console.log(q.accepted[0].category)')
  REPO="jvision-$SLUG"
  LOG="$LOGDIR/$REPO.log"
  BEFORE=$(count_site)
  say "開發《$TITLE》（$CAT）　站上 $BEFORE 套　今日 $DONE_TODAY/$DAILY"
  act "開始開發" "$REPO" "" "《$TITLE》／$CAT　今日 $DONE_TODAY/$DAILY"

  node -e '
const fs=require("fs");
fs.writeFileSync("docs/_state/current-job.json",JSON.stringify({
  phase:`開發《'"$TITLE"'》（'"$CAT"'）`,
  action:"建置 → 驗收 → 修溢出 → 重驗 → 上架",
  pid:Number(process.env.AGENT_PID||0),startedAt:Date.now(),
  total:Number("'"$DAILY"'"),done:Number("'"$DONE_TODAY"'"),concurrency:1,
  logPath:"'"$LOG"'",listPath:"docs/_state/agent-current.txt"},null,2)+"\n");
fs.writeFileSync("docs/_state/agent-current.txt","'"$REPO"'\n");'

  dequeue() {
    node -e 'const fs=require("fs");const q=require("./'"$QUEUE"'");q.accepted.shift();
      fs.writeFileSync("'"$QUEUE"'",JSON.stringify(q,null,2)+"\n");'
  }

  # ── 建置 ──
  node tools/demo-forge.mjs --from="$QUEUE" --pick="$SLUG" --concurrency=1 --timeout=1800 > "$LOG" 2>&1
  if [ ! -f "demos/$REPO/index.html" ]; then
    echo "  ✖ 建置失敗，跳過此題（見 $LOG）"
    act "建置失敗" "$REPO" 500 "《$TITLE》"; dequeue; continue
  fi

  # ── 驗收 → 修 → 重驗（最多兩次修正）──
  ok=0
  for attempt in 1 2; do
    node tools/lib/verify-runner.mjs 4599 "$REPO" >> "$LOG" 2>&1
    if grep -q "^OK $REPO" "$LOG"; then ok=1; break; fi
    echo "  第 $attempt 次驗收未過，嘗試修正"
    act "驗收未過，修正中" "$REPO" 409 "第 $attempt 次"
    node tools/fix-demo-overflow.mjs --port=4599 --concurrency=1 "$REPO" >> "$LOG" 2>&1
  done

  if [ "$ok" -ne 1 ]; then
    echo "  ✖ 驗收仍未過，保留為草稿不上架（見 $LOG）"
    act "驗收失敗，未上架" "$REPO" 422 "《$TITLE》"
    grep -E '^XX ' "$LOG" | tail -2
    dequeue; continue
  fi

  # ── 上架 ──
  node -e '
const fs=require("fs");const p="docs/DEMO_FORGE_MANIFEST.json";const m=JSON.parse(fs.readFileSync(p,"utf8"));
const e=m.entries.find(x=>x.repoName==="'"$REPO"'");
if(e){e.state="verified";e.checks={...(e.checks||{}),browser:{pass:true,at:new Date().toISOString()}};}
fs.writeFileSync(p,JSON.stringify(m,null,2)+"\n");'
  node tools/demo-publish.mjs --repo="$REPO" >> "$LOG" 2>&1
  node tools/sync-catalog-counts.mjs > /dev/null 2>&1
  node tools/build-import-timeline.mjs > /dev/null 2>&1

  dequeue
  bump_today
  AFTER=$(count_site)
  made=$((made + 1))
  node -e '
const fs=require("fs");const [n,repo,title,cat,before,after]=process.argv.slice(1);
fs.appendFileSync("'"$CYCLES"'",JSON.stringify({cycle:Number(n),tag:repo,title,category:cat,
  at:new Date().toISOString(),before:Number(before),after:Number(after),
  added:Number(after)-Number(before)})+"\n");' "$made" "$REPO" "$TITLE" "$CAT" "$BEFORE" "$AFTER"
  act "上架" "$REPO" 200 "《$TITLE》　站上 $AFTER 套　今日 $(made_today)/$DAILY"
  commit_demo "$REPO" "$TITLE" "$AFTER"
  say "《$TITLE》完成並上架　站上 $AFTER 套　今日 $(made_today)/$DAILY　本次啟動共 $made 套"
done

say "Agent 已停止　本次共完成 $made 套　站上 $(count_site) 套"

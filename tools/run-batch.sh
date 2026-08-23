#!/usr/bin/env bash
# 一次跑完整條產線：出題 → 建置 → 驗收 → 修溢出 → 重驗 → 上架 → 同步數字。
#
#   tools/run-batch.sh <題數> [並行]
#
# 每個階段都會更新 docs/_state/current-job.json，所以 ./progress 隨時看得到
# 現在在哪一步。中途掛掉不會遺失進度：出題結果與 manifest 都落檔，
# 重跑同一支腳本會跳過已完成的 demo。
set -uo pipefail
cd "$(dirname "$0")/.."

COUNT="${1:-300}"
CONC="${2:-4}"
TAG="${3:-batch3}"          # 批次代號，讓每輪的 log 與清單各自獨立
STATE=docs/_state
CANDIDATES="$STATE/$TAG-candidates.json"
mkdir -p "$STATE"

job() {  # job <phase> <action> <pid> <total> <log> <list>
  node -e '
const fs=require("fs");const [phase,action,pid,total,logPath,listPath]=process.argv.slice(1);
fs.writeFileSync("docs/_state/current-job.json",JSON.stringify({
  phase,action,pid:Number(pid),startedAt:Date.now(),total:Number(total),
  concurrency:Number(process.env.CONC||1),logPath,listPath},null,2)+"\n");
' "$@"
}

say() { printf '\n\033[1m▸ %s\033[0m  %s\n' "$1" "$(date +%H:%M:%S)"; }

# ── 1. 出題 ────────────────────────────────────────────────
say "階段 1／6　出題（目標 $COUNT 題）"
job "出題（目標 $COUNT 題）" "codex 出題 → 五道閘去重" $$ "$COUNT" "$STATE/$TAG-scout.log" "$STATE/forged-repos.txt"
node tools/topic-scout.mjs --count="$COUNT" --rounds=40 --out="$CANDIDATES" > "$STATE/$TAG-scout.log" 2>&1
SCOUT_RC=$?
ACCEPTED=$(node -e 'try{console.log(require("./'"$CANDIDATES"'").accepted.length)}catch{console.log(0)}')
echo "  產出 $ACCEPTED 題（scout exit=$SCOUT_RC）"
if [ "$ACCEPTED" -eq 0 ]; then
  echo "出題失敗，以下是 scout 的最後輸出："
  tail -20 "$STATE/$TAG-scout.log"
  exit 1
fi

# ── 2. 建置 ────────────────────────────────────────────────
say "階段 2／6　建置 $ACCEPTED 套"
job "建置（$ACCEPTED 套）" "codex 產 index.html → 腳本寫 details/README → 靜態閘" $$ "$ACCEPTED" "$STATE/$TAG-forge.log" "$STATE/$TAG-repos.txt"
node -e '
const fs=require("fs");const c=require("./'"$CANDIDATES"'");
fs.writeFileSync("'"$STATE"'/$TAG-repos.txt",c.accepted.map(x=>"jvision-"+x.slug).join("\n")+"\n");'
node tools/demo-forge.mjs --from="$CANDIDATES" --count="$ACCEPTED" --concurrency="$CONC" --timeout=1800 > "$STATE/$TAG-forge.log" 2>&1
echo "  $(grep -c '✅ 已產出' "$STATE/$TAG-forge.log") 套產出成功"

# 只取這一批真的建出來的
node -e '
const fs=require("fs");
const want=new Set(fs.readFileSync("'"$STATE"'/$TAG-repos.txt","utf8").trim().split("\n"));
const built=[...want].filter(r=>fs.existsSync(`demos/${r}/index.html`));
fs.writeFileSync("'"$STATE"'/$TAG-built.txt",built.join("\n")+"\n");
console.log("  實際落檔",built.length,"套");'

# ── 3. 驗收 ────────────────────────────────────────────────
say "階段 3／6　瀏覽器驗收"
BUILT=$(wc -l < "$STATE/$TAG-built.txt")
job "瀏覽器驗收（$BUILT 套）" "六畫面互異 → 圖表像素 → 三寬度各自載入量溢出 → console" $$ "$BUILT" "$STATE/$TAG-verify.log" "$STATE/$TAG-built.txt"
node tools/lib/verify-runner.mjs 4599 $(tr '\n' ' ' < "$STATE/$TAG-built.txt") > "$STATE/$TAG-verify.log" 2>&1
echo "  通過 $(grep -c '^OK ' "$STATE/$TAG-verify.log")　未過 $(grep -c '^XX ' "$STATE/$TAG-verify.log")"

# ── 4. 修溢出 ──────────────────────────────────────────────
grep '^XX ' "$STATE/$TAG-verify.log" | grep -v 'overflow=none' | awk '{print $2}' > "$STATE/$TAG-fix.txt"
FIXN=$(wc -l < "$STATE/$TAG-fix.txt")
if [ "$FIXN" -gt 0 ]; then
  say "階段 4／6　修水平溢出（$FIXN 套）"
  job "修水平溢出（$FIXN 套）" "量測溢出元素 → 產生針對性 CSS → 重量 → 寫檔" $$ "$FIXN" "$STATE/$TAG-fix.log" "$STATE/$TAG-fix.txt"
  node tools/fix-demo-overflow.mjs --port=4599 --concurrency="$CONC" $(tr '\n' ' ' < "$STATE/$TAG-fix.txt") > "$STATE/$TAG-fix.log" 2>&1
  grep -E '完全修正' "$STATE/$TAG-fix.log" || true
else
  say "階段 4／6　沒有溢出需要修"
fi

# ── 5. 重驗 ────────────────────────────────────────────────
say "階段 5／6　重驗"
job "重驗（$BUILT 套）" "全部重跑一次瀏覽器驗收" $$ "$BUILT" "$STATE/$TAG-recheck.log" "$STATE/$TAG-built.txt"
node tools/lib/verify-runner.mjs 4599 $(tr '\n' ' ' < "$STATE/$TAG-built.txt") > "$STATE/$TAG-recheck.log" 2>&1
OK=$(grep -c '^OK ' "$STATE/$TAG-recheck.log"); XX=$(grep -c '^XX ' "$STATE/$TAG-recheck.log")
echo "  通過 $OK　未過 $XX"
grep '^OK ' "$STATE/$TAG-recheck.log" | awk '{print $2}' > "$STATE/$TAG-clean.txt"

# ── 6. 上架 ────────────────────────────────────────────────
say "階段 6／6　上架"
job "上架（$OK 套）" "寫入 projects-index.json → 同步頁面數字 → 稽核" $$ "$OK" "$STATE/$TAG-publish.log" "$STATE/$TAG-clean.txt"
node tools/demo-publish.mjs --repo="$(tr '\n' ',' < "$STATE/$TAG-clean.txt" | sed 's/,$//')" > "$STATE/$TAG-publish.log" 2>&1
tail -4 "$STATE/$TAG-publish.log"
node tools/sync-catalog-counts.mjs > "$STATE/$TAG-counts.log" 2>&1
node tools/build-import-timeline.mjs > /dev/null 2>&1

say "全部完成"
node -e 'const c=require("./projects-index.json");console.log("  站上系統數:",c.projects.length);'
echo "  未過需人工處理：$XX 套（見 $STATE/$TAG-recheck.log）"

# 題目發掘與 Demo 建置工具鏈

四支 CLI，把「找題目 → 建 demo → 驗收 → 上架」拆成可獨立重跑的階段。
每一階段的產出都是檔案，中途可停、可審、可丟棄。

```
題目來源 ──┬─ tools/topic-import.mjs   從 Master List(xlsx) 匯入
           └─ tools/topic-scout.mjs    用 codex 依缺口發想
                     │
                     ▼  docs/TOPIC_SCOUT_CANDIDATES.json
           tools/demo-forge.mjs        腳本產 details/README，codex 產 index.html
                     │
                     ▼  demos/<repo>/ + content/details/<repo>.json + manifest
           tools/demo-verify.mjs       起靜態站 + Playwright 三項檢查
                     │
                     ▼  manifest state = verified
           tools/demo-publish.mjs      唯一會寫 projects-index.json 的入口
```

## 常用指令

```bash
# 匯入 Master List，看有多少題沒做過（不寫檔）
node tools/topic-import.mjs --dry-run

# 取前 30 題並用 codex 補完模組與流程
node tools/topic-import.mjs --limit=30 --enrich

# 只要 P0、Wave 1、低重複風險的
node tools/topic-import.mjs --priority=P0 --wave=1 --max-risk=低 --enrich

# 建 demo（先 dry-run 看 prompt 與將寫入的路徑）
node tools/demo-forge.mjs --count=1 --dry-run
node tools/demo-forge.mjs --count=5

# 驗收 / 人工審閱 / 丟棄
node tools/demo-verify.mjs jvision-xxx
node tools/demo-verify.mjs --serve          # 起 :4599 自己點
node tools/demo-forge.mjs --status
node tools/demo-forge.mjs --discard=jvision-xxx

# 上架（唯一會動目錄的動作）
node tools/demo-publish.mjs --repo=jvision-xxx --dry-run
node tools/demo-publish.mjs --all-verified
```

## ⚠ 絕對不要執行的既有腳本

| 腳本 | 後果 |
|---|---|
| `tools/build-demo-pages.mjs` | **覆寫全部 539 個 index.html**，並刪除各 demo 目錄內其他檔案 |
| `tools/build-detail-content.mjs` | 全量重產 `content/details/*.json`，會把本工具鏈產出的內容蓋掉 |
| `tools/create-static-legacy-demos.mjs` | 覆寫 5 個舊 repo 成深色玻璃擬態樣板 |
| `tools/convert-generated-demos-to-next.mjs` | 針對已不存在的 Next.js 結構，會拋錯或產生垃圾 |
| `tools/enrich-flagged-demo-domain-content.mjs` | 用字串裁切改 `projects-index.json`（非 JSON 解析），高風險 |

**上架後的長期風險**：新 demo 一旦進 `projects-index.json`，日後若有人執行
`build-detail-content.mjs`，它的 details 會被重產覆蓋。這是既有工具的行為，不是本工具鏈能防的。

## 設計決定

**details 與 README 由腳本產、index.html 由 codex 產。**
details 是三方契約 —— `project.html` 靠它渲染詳細頁、`tools/verify-demos.mjs` 靠
`flow.stages[].demo` 判定「每個階段對到不同畫面」、README 的內容也源自它。
欄位固定 13 個、`demo` 必須精確為 `v0..v5`，交給 LLM 漏一欄就是一個壞掉的詳細頁。
`index.html` 才是唯一需要創意、且必須「每個都不一樣」的產物。

**上架獨立成第三支腳本，而非 `--publish` 旗標。**
寫 `projects-index.json` 是整條流程唯一不可逆、且會動到 538 個既有專案共用檔的動作，
必須有明確的單一入口，不能因為 forge 的參數打錯而誤觸。

**去重採五道閘，門檻由實測校準。**
G1 repoName／G2 標題不分型 0.85／G3 同型全文 0.72／G4 跨型全文 0.80／G5 批內 0.55·0.35。
批內門檻最低，因為同一批 LLM 產出天然互相回聲。
數值依 3000 組無關配對的實測分布訂定：全文 99 百分位 0.151、最高 0.292；標題最高 0.500。

## 環境需求

- **codex CLI** 已登入，且 `~/.codex/config.toml` 將本專案標為 `trust_level = "trusted"`
- **codex 在本環境無法寫檔**。它的沙箱用 bubblewrap，在容器內會失敗：
  `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，連 `/tmp` 都寫不進去。
  因此 `demo-forge` 一律以 `-s read-only` 呼叫 codex，要求它把完整 HTML 當作最後一則訊息回傳，
  再由腳本負責落檔。**不要改用 `--dangerously-bypass-approvals-and-sandbox`** —— 
  由腳本控制寫入位置本來就更安全，也讓「codex 只能產內容、不能動檔案」成為結構性保證。
- **驗收需要瀏覽器**。既有三支工具（`verify-demos` / `chartscan` / `loadscan`）用
  `chromium.launch({ channel: 'chrome' })`，本機若無系統 Chrome 會失敗；
  `tools/demo-verify.mjs` 會自動退回 `tools/lib/verify-runner.mjs`（Playwright bundled chromium）。
  要用正典工具請執行一次 `npx playwright install chrome`。
- **靜態站**：三支既有工具硬編 `localhost:4599`，而 `npm run dev` 是 `:3000`，
  且 `node_modules` 沒有 `serve`。`tools/lib/static-server.mjs` 是零依賴內建站，
  由 `demo-verify` 自動起停，不需另外安裝。

## 退出碼

`0` 成功／`1` 參數或前置條件錯誤／`2` codex 失敗／`3` codex 輸出無法解析／`4` 部分完成（仍會寫檔）

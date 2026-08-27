# Agents 落地藍圖

> 內部規劃 · JV Demo Hub · 2026-08-27 · Pilot 已完成驗證

讓「呼叫 AGENT」從**生成一份漂亮但無據的報告**,升級為 **AI 真的走進 1,600 套系統查資料、操作畫面、給出可溯源的結論**——客戶看得懂,也抓不出破綻。

---

## 01 · 現況:離目標比想像中近,缺的只有一塊

現有的 agents 後端(`jvision-agents-office`)已經是完整的「主 agent + 子 agent」編排:總指揮規劃任務 → 平行派出資料 agent → 串流生成 HTML/圖文報告,前端渲染系統也已成熟。**架構不用重做。**

唯一的斷點:資料 agent 的模式是 `internal-sim`——**數字是 LLM 現場編的**,和站上任何一套 demo 系統無關。報告再漂亮,客戶老闆對不上畫面、看不懂也無感。這是唯一要補的一塊,也是這份藍圖的全部。

## 02 · 架構:三層設計,資料先落地,體驗才有據

不幫 1,600 套各養一個常駐 agent——**一個參數化的「系統代理」+ 每套系統一張 agent card**(由既有 `content/details/*.json` 生成)就夠了,這也是 A2A 的正統做法:AgentCard 描述能力,執行時才實例化。

### 資料層(EXTRACT)

**抽取,而非生成。** 工具把每套 demo 渲染後的表格、KPI、圖表實例抽成結構化資料,agent 查到的數字**天生等於畫面上的數字**,一致性免費拿到。93%(1,522 套)的 demo 結構一致可抽。

- 產出:`content/agent-data/*.json`、`content/agent-cards/*.json`

### 工具層(MCP / WebMCP)

- **伺服器端**:掛在現有 aiohttp 後端,給 agent 抓資料——`list_systems` / `get_system_card` / `query_data` / `get_metrics`
- **瀏覽器端**:一支共用 bridge(`shared/jv-agent-bridge.js`)以產線既有的 `apply:*` 批次注入模式打進 demo,讓 agent 操作畫面——`goto_screen` / `highlight`

### 體驗層(AVATAR / SSE)

**全站浮動 AI 頭像**(登入者限定,沿用 `/api/visitor/me`),對話走既有 `/run` SSE 協定與 mission 渲染(`agents-mission-live.js`)。報告每個結論附溯源連結:點了就打開該系統、切到該畫面、把資料標示出來——**「AI 真的查過」變成看得見的瞬間**。

## 03 · 實證:Pilot 已跑完,20 套全數抽取成功

抽取工具 `tools/agent-data-extract.mjs` 已完成並實測。刻意混入六套 464 時期的舊世代 demo(Chart.js、const 陣列寫法)與十四套新世代(ECharts、產線生成),**兩代結構都抽得動**,全站鋪開有把握。

| Pilot 範圍 | KPI | 表格 | 明細列 | 圖表 | 結果 |
|---|--:|--:|--:|--:|---|
| 舊世代旗艦 6 套(crm / production-order / attendance …) | 78 | 19 | 98 | 39 | ✅ 6/6 |
| 新世代跨產業 14 套(依分類自動抽樣,涵蓋 14 個產業) | 96 | 28 | 134 | 39 | ✅ 14/14 |
| **合計** | **174** | **47** | **232** | **78** | ✅ **20/20** |

一致性抽查——CRM 儀表畫面 vs 抽出的資料,逐字相等:

| 畫面上顯示(jvision-crm) | agent 查到(agent-data/jvision-crm.json) |
|---|---|
| 管線總價值 **1658萬** | 管線總價值 **1658萬** |
| 本月成交 **430萬** | 本月成交 **430萬** |
| 平均成交週期 **38 天** | 平均成交週期 **38 天** |
| 成交金額趨勢(3–6月)**720 / 850 / 910 / 1040** | series「成交金額(萬)」**[720, 850, 910, 1040]** |

同時產出每套系統的 agent card(能力、模組、資料清單)與彙總索引 `content/agent-cards/index.json`,`list_systems` 工具的資料來源已就緒。

## 04 · 路線:三個階段,每一階段都有可展示的成果

### Phase 1 ✅ 已完成 — 抽取工具 + Agent Card(20 套 pilot)

不動任何現有畫面、零風險。
**交付:抽取工具、20 套結構化資料與 agent card、彙總索引。**

### Phase 2 ✅ 已完成(2026-08-27) — 接上 orchestrator,報告開始有據可查

後端新增系統資料層 `server/systems.py` 與工具端點 `GET /systems`、`/systems/{repo}/card`、`/systems/{repo}/data`;orchestrator 配到相關系統時改派「系統代理」讀實際畫面數據(零 LLM、零成本),站上沒有相關系統才退回 internal-sim。報告規格強制附「資料來源」溯源連結(`/demos/<repo>/#go=n`)。
**已以真實 /run 驗證:CRM 問題 → 系統代理讀到 10 項 KPI/3 張表/6 張圖 → 報告數字與畫面一致、附四個畫面的溯源連結。**
全站資料抽取(1,627 套)背景執行中,完成前站上約 7 成系統即可被 agent 點名。

### Phase 3 — WebMCP bridge + 浮動頭像,鋪向全站

bridge 以產線 `apply:*` 批次注入;全站頭像上線;其餘 1,600 套採 **lazy 抽取**——某套系統第一次被 agent 點名時才建卡,不必一口氣處理完。
**交付:客戶在任何頁面呼叫 AI,結論可點回系統畫面。**

## 05 · 需要拍板的兩件事(已拍板,2026-08-27)

### 決策 A · LLM 管線 ✅ 已採納並執行

現有三條互不相通:Claude CLI(本機、重量級)、DeepSeek(serverless、便宜)、Ollama gateway(地端)。開放給登入訪客後,Claude CLI 的成本與併發是主要風險。

> **執行結果:資料查詢做成純檔案讀取(比便宜線更便宜——零 LLM、零成本、結果可重現);Claude 只做總指揮與最終報告。**

### 決策 B · /run 補上身分檢查 ✅ 已完成

頁面有登入閘門,但 `/run` API 本身無身分檢查,可被直接呼叫。頭像功能上線前必須在 gateway 補 gate(比照 `/wish` 的既有寫法,順手可做);Vercel 端 `middleware.js` 的白名單需同步。

> **執行結果:gateway 已比照 /wish 補上 403 gate(整站 302 閘門之外的縱深防禦),前端對 403 顯示明確的登入提示;Vercel `middleware.js` 白名單已同步 `/run` 與 `/systems`。**

## 06 · 兩條不妥協的底線

1. **抽取,永遠不生成。** 用 LLM 幫系統「補」資料庫,畫面數字和 AI 講的數字終會對不上——客戶一抓包,整個展示的可信度全毀。抽不到的少數 demo 寧可不上,不硬補。
2. **一個系統代理,不是 1,600 個 agent。** 能力寫在卡片上,執行時才實例化。維運成本不隨站上套數成長。

---

*JVision · Agents 落地藍圖 · 依 2026-08-27 pilot 實測數據撰寫(tools/agent-data-extract.mjs,20/20 成功)*

# JVision Demo 平台 — Google Stitch UI 改造 Prompt 包

> 目標：把這套「463 個 AI 產業系統」的展示平台，從「點進去直接是 demo」改造成
> **可以給客戶看的專業產品目錄**：首頁 → 導覽/選單 → 每個專案的介紹頁（問題／系統做什麼／功能／流程／效益）→ 才進 Demo。
> 主色：**藍 + 白**。介面文字：**繁體中文**。Stitch 指令：**英文**（Stitch 對英文理解最佳）。

---

## 這份文件怎麼用

1. **先讀本檔的 A 段（STYLE SYSTEM）** — 這是所有畫面共用的設計系統，貼進 Stitch 的 style/theme。
2. **B～E 段是「框架畫面」** — 首頁、導覽目錄、選單、專案介紹公版。每段一個畫面，直接貼進 Stitch 生成。
3. **463 個 demo 畫面** — 不在本檔，已由 `tools/generate-stitch-prompts.mjs` 依每個專案的**真實資料 + 系統類型**（MES/CRM/ERP/WMS/QMS/BI/POS/ESG…）自動產生，一個專案一個檔，放在 [`docs/stitch-prompts/`](./stitch-prompts/)。索引見 [`stitch-prompts/INDEX.md`](./stitch-prompts/INDEX.md)。
   - 每個專案檔裡有 **SCREEN 1（專案介紹頁）** 和 **SCREEN 2（Demo 操作畫面）** 兩段，各自貼進 Stitch 生成一個畫面。
   - 要重新產生（例如改了文案或分類邏輯）：`node tools/generate-stitch-prompts.mjs`

---

## A. STYLE SYSTEM（所有畫面共用，先貼這段）

```
STYLE SYSTEM (apply to every screen):
- Product family: a professional, trustworthy B2B enterprise SaaS console. Clean, bright, high-contrast, data-dense but calm. Think Linear × modern ERP.
- Primary color #1E40AF (deep blue) and #3B82F6 (bright blue) for actions, active nav, chart series and key numbers. Background is white #FFFFFF and light blue-grey #F5F8FC. Text is slate #1E293B on white; muted #64748B for secondary. Borders are hairline #E2E8F0. Use one warm amber #D97706 ONLY for "needs attention / CTA highlight". Success green #16A34A, danger red #DC2626 used sparingly for status.
- Rounded 12px cards with a soft, low shadow; 8px controls. Generous whitespace, 8-pt spacing rhythm.
- Typography: clean geometric sans (Inter / Noto Sans TC). Big bold numbers for KPIs. Traditional-Chinese UI copy, ALL-CAPS latin section labels (e.g. "SEARCH RESULTS") as tiny eyebrows.
- Every screen: fixed top bar (left: JVision wordmark; center: global search; right: notifications + avatar). No dark mode. Desktop-first, but the layout must reflow gracefully to tablet/mobile.
- Tone: enterprise, credible, "a real system a customer would buy" — not a toy demo.
```

---

## B. 首頁 / Landing（Screen: `home`）

```
Using the STYLE SYSTEM, generate the HOME / landing page of "JVision Demo 平台", a gateway to 463 operable AI industry systems.

Sections top to bottom:
1. Top nav bar: JVision wordmark (JV blue + "DEMO"); right-side links 「產業目錄」「專案專家 Agent」「管理中心」; a search pill 「探索 Demo」 with a "/" kbd hint.
2. HERO (split, ~60/40): left column — tiny eyebrow "463 SYSTEMS · ONE GATEWAY"; a large H1 「以 AI 驅動企業轉型，讓營運決策更快、更準。」; a supporting line 「從製造現場到企業決策，每一個系統都能搜尋、能操作、能立即體驗。」; two buttons 「探索全部系統」(primary blue, arrow icon) and 「讓專案專家為你導航」(ghost). A row of 3 proof chips 「真實操作」「跨域場景」「即刻體驗」. Right column — an abstract, elegant blue "AI industry network" illustration: a glowing central node labeled JV·AI with orbiting nodes 「智慧製造」「ESG 決策」「智慧醫療」「企業營運」, plus a small live counter card 「463 個系統在線」 with a pulsing dot.
3. A slim auto-scrolling industry marquee strip: SMART MANUFACTURING · ENTERPRISE OPS · HEALTHCARE · FINTECH · ESG · CONSTRUCTION · RETAIL.
4. "你想解決哪一個問題？" search panel: a big search input 「搜尋名稱、產業、功能或編號（例如：工單、ESG、庫存、CRM、#82）」, an 產業分類 dropdown, a 排序 dropdown, and a wrapping row of quick-filter industry chips.
5. 產業專案統計: a clean stats section with a summary row (系統總數 / 可操作 Demo / 產業數) and a scrollable table 「產業分類 | 專案數 | 可開啟 Demo | 代表專案 | 開啟」.
6. Footer: JVision wordmark + a stat line.

Everything bright, blue/white, lots of whitespace, enterprise-credible.
```

---

## C. 產業目錄 / 專案卡片牆（Screen: `catalog`）

```
Using the STYLE SYSTEM, generate the CATALOG / browse page — a responsive grid of project cards for the 463 systems, with a left filter rail.

- LEFT RAIL (~22%): a sticky filter panel — a search box; an 產業分類 accordion list with counts (生產製造 64、品質管理 50、業務銷售 39、採購供應鏈 37、人力資源 23… as coloured rows); a 系統類型 filter (MES/CRM/ERP/WMS/QMS/BI/POS/ESG…); a "清除條件" text button.
- MAIN AREA: a result header 「專案結果 · 共 463 個系統」 with a sort dropdown; a wrapping row of active-filter chips; then a 3-column CARD GRID.
- Each PROJECT CARD: a top row with a case-id chip 「Case 001」 and a 「擬真資料」 badge; a 16:9 system preview thumbnail with a "系統示意圖" label; an H3 project title; a coloured category pill; a 2-line description; a collapsible 「查看實際用途」 row; and a footer with two buttons 「3 分鐘情境導覽」(ghost) and 「開啟 Demo」(primary blue).
- A "載入更多結果" button at the bottom.

Cards are calm and uniform; blue accents; generous spacing; clearly enterprise.
```

---

## D. 產品選單 / 導覽（Screen: `mega-menu`）

```
Using the STYLE SYSTEM, generate a full MEGA-MENU / product navigation overlay that drops from the top bar — the "menu where every project lives", grouped like a real enterprise product suite.

- A wide panel divided into columns by DOMAIN: 「智慧製造」「品質與供應鏈」「業務與客戶」「營運與財務」「永續與能源」「產業垂直（醫療/教育/營建/零售/物流）」.
- Under each domain, list the system families with a small blue line-icon each: e.g. under 智慧製造 → MES 製造執行、排程派工、設備維護 CMMS、OEE 分析; under 業務與客戶 → CRM、報價 RFQ、業務預測、客戶入口.
- A right-side highlighted panel: 「精選系統」 with 3 featured cards (thumbnail + title + one line + 開啟).
- A bottom bar: 「查看全部 463 個系統 →」.

Multi-column, scannable, blue hover states, white background.
```

---

## E. 專案介紹頁「公版」（Screen: `project-overview` — the template）

> 這是你要的「每個專案詳細的公版」。**已內建在 463 個生成檔的 SCREEN 1**，並用該專案真實資料填好。
> 下面是通用模板，方便你手動針對任一專案微調。把 `{{...}}` 換成該專案在 `projects-index.json` 的欄位。

```
Using the STYLE SYSTEM, generate a single-scroll PROJECT OVERVIEW page shown to a customer BEFORE the live demo.

HERO: eyebrow "{{系統類型，如 CRM 客戶關係}} · Case {{id}}"; H1 「{{title}}」; subtitle 「{{description}}」; buttons 「開啟互動 Demo」(primary) + 「觀看 3 分鐘導覽」(ghost); soft blue system illustration on the right.

Section 1 — 要解決的問題: 2–3 cards contrasting the old way (試算表往返、人工追蹤、異常太晚發現) with the pain. Seed: 「{{businessSituation}}」
Section 2 — 這套系統做什麼: a short paragraph; a 「適合誰」 chip row → 「{{primaryUser}}」; a 「日常怎麼用」 line → 「{{dailyUse}}」.
Section 3 — 核心功能: a 3×2 grid of 6 feature tiles (blue line-icons) reflecting a {{系統類型}} system.
Section 4 — 運作流程: a horizontal numbered step-flow using 「{{customerWorkflow.steps join →}}」, each a node with icon + one helper line.
Section 5 — 帶來的效益: a KPI strip of 4 outcome stats built from 「{{operationalMetrics}}」 shown as ▲/▼ deltas, then 2–3 benefit bullets.
CTA band: 「準備好看它實際運作了嗎？」 + big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

Bright, blue/white, confident, enterprise sales-ready.
```

---

## F. 每個 Demo 畫面（463 個，已分類生成）

Demo 畫面**不套同一個版**——每個依專案的**系統定位**呈現。生成器把 463 個專案分成 23 種系統類型，各有專屬的畫面骨架（主工作區 widget + 右側輔助面板），再填入該專案真實的 KPI、流程階段、使用者與欄位：

| 系統類型 | 主工作區 | 右側面板 |
|----------|----------|----------|
| MES 製造執行 / 排程 | 工單狀態看板 (Kanban) | AI 賦能情境 + 風險條 |
| CRM 客戶關係 / 業務管線 | 商機 Pipeline | AI 下一步建議 |
| ERP 企業資源規劃 | 單據資料表 | AI 賦能情境 |
| WMS 倉儲作業 | 揀貨/出貨看板 | 趨勢迷你儀表 |
| SRM 採購 / 供應商協同 | 採購/供應商資料表 | 風險雷達 |
| QMS 品質管理 | 品質案件看板 | SPC 管制圖 + Pareto |
| BI 商業智慧 / 經營分析 | 分析圖表牆 | AI 洞察 |
| ESG 永續 / 能源碳排 | 能源/碳趨勢圖 | 減碳目標環 |
| POS 門市前台 | 商品/桌位 + 結帳單 | 出單佇列 |
| HRIS 人力資源 | 員工/班表資料表 | 月曆 + 例外 |
| 財務 / 會計台帳 | 帳款/傳票資料表 | 趨勢圖 |
| 金融保險 / 案件審核 | 案件審核 Pipeline | 風險評分 |
| IT 維運 / 監控 | 事件/工單控制台 | 拓撲/資產健康 |
| 資安 SOC / 事件應變 | 告警事件控制台 | 告警分流 |
| 教育 / 學習平台 | 課程/學員卡片牆 | 學習進度 |
| 醫療 / 診所照護 | 預約/病患資料表 | 就診時間軸 |
| 營建 / 工程專案 | 工項看板 | 進度時間軸 |
| CMMS 設備維護 | 維護工單看板 | OEE 儀表 |
| TMS 運輸 / 車隊調度 | 派車地圖 + 任務 | 配送時間軸 |
| 法務 / 案件管理 | 案件資料表 | 案件時間軸 |
| 協作 / 專案任務 | 任務看板 | AI 賦能情境 |
| 客服 / 服務台 | 服務單控制台 | AI 賦能情境 |
| 營運管理主控台 | 作業看板 | AI 賦能情境 |

→ 完整 463 個檔案與對照：[`docs/stitch-prompts/INDEX.md`](./stitch-prompts/INDEX.md)

---

## G. 建議的操作順序（給你自己）

1. 先在 Stitch 用 **A 的 STYLE SYSTEM** 建一個 theme。
2. 依序生成 **B 首頁 → C 目錄 → D 選單 → E 介紹公版**，確定框架與藍白調性 OK。
3. 挑 3～5 個**不同系統類型**的代表專案（例如 Case 001 MES、036 BI、一個 CRM、一個 POS、一個 SOC），用它們的專案檔生成 SCREEN 1 + SCREEN 2，驗證每種骨架長得對。
4. 骨架定案後，再批次跑其餘專案。
5. 把 Stitch 產出的畫面丟回來，我依實際 HTML/CSS 幫你落地到這個 repo（首頁、目錄、`project-expert`、以及各 demo 的 `index.html` / 共用 `shared/` 樣式）。

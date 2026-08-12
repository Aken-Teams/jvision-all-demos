<!-- 1394 · jvision-smart-mfg-294-ir · type=analytics-bi -->
# Stitch Prompt — 「投資人關係管理系統（IR）」
> 系統定位：BI 商業智慧 / 經營分析　｜　產業：經營管理　｜　Case 1394
> 用法：把下面【STYLE SYSTEM】貼進 Stitch 的 style/theme，再分別用 SCREEN 1、SCREEN 2 各生成一個畫面。

```
STYLE SYSTEM (apply to every screen):
- Product family: a professional, trustworthy B2B enterprise SaaS console. Clean, bright, high-contrast, data-dense but calm. Think Linear × modern ERP.
- Primary color #1E40AF (deep blue) and #3B82F6 (bright blue) for actions, active nav, chart series and key numbers. Background is white #FFFFFF and light blue-grey #F5F8FC. Text is slate #1E293B on white; muted #64748B for secondary. Borders are hairline #E2E8F0. Use one warm amber #D97706 ONLY for "needs attention / CTA highlight". Success green #16A34A, danger red #DC2626 used sparingly for status.
- Rounded 12px cards with a soft, low shadow; 8px controls. Generous whitespace, 8-pt spacing rhythm.
- Typography: clean geometric sans (Inter / Noto Sans TC). Big bold numbers for KPIs. Traditional-Chinese UI copy, ALL-CAPS latin section labels (e.g. "SEARCH RESULTS") as tiny eyebrows.
- Every screen: fixed top bar (left: JVision wordmark; center: global search; right: notifications + avatar). No dark mode. Desktop-first, but the layout must reflow gracefully to tablet/mobile.
- Tone: enterprise, credible, "a real system a customer would buy" — not a toy demo.
```

## SCREEN 1 — 專案介紹頁 (Project Overview / "before the demo")
Generate a professional, single-scroll PRODUCT OVERVIEW page a salesperson would show a customer BEFORE opening the live demo. Use the STYLE SYSTEM. Sections top-to-bottom:

1. HERO: eyebrow "BI 商業智慧 / 經營分析 · Case 1394"; H1 「投資人關係管理系統（IR）」; one-line subtitle 「投資人關係管理系統（IR）提供法人會議與財報發布排程管理、投資人問答資料庫、股價/市場輿情監控。投資人關係部依「財報彙整 → 法說會準備 → 法人溝通 → 輿情監控 → 重大訊息公告 → 效益檢討」推進作業，優先解決「法人溝通紀錄分散難追蹤」，財務部則以法人溝通滿意度與重大訊息即時揭露率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「法人溝通紀錄分散難追蹤」發生時，投資人關係部可在投資人關係管理系統（IR）依序完成財報彙整、法說會準備、法人溝通、輿情監控、重大訊息公告、效益檢討；財務部再依法人溝通滿意度與重大訊息即時揭露率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「投資人關係部、財務部、發言人室」. Include 「日常怎麼用」: 「投資人關係部日常使用法人會議與財報發布排程管理、投資人問答資料庫、股價/市場輿情監控；案件依「財報彙整 → 法說會準備 → 法人溝通 → 輿情監控 → 重大訊息公告 → 效益檢討」流轉，並與財務系統、公開資訊觀測站系統、CRM系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a BI 商業智慧 / 經營分析 system (e.g. executive analytics dashboard with KPI trends and drill-down).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「財報彙整」→「法人溝通」→「效益檢討」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「法人溝通滿意度」, 「重大訊息即時揭露率」, 「法說會參與家數」, 「股價波動異常反應時效」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live BI 商業智慧 / 經營分析 workspace)
Generate the actual working application screen for 「投資人關係管理系統（IR）」, a BI 商業智慧 / 經營分析 system (executive analytics dashboard with KPI trends and drill-down). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「投資人關係管理系統（IR）」; a vertical module nav of 4 items 「經營儀表板」「趨勢分析」「指標下鑽」「AI 洞察」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生洞察」 button.
- TOP BAR of the workspace: eyebrow 「BI 商業智慧 / 經營分析 · Case 1394」, H1 「投資人關係管理系統（IR）」, subtitle 「經營管理｜投資人關係管理系統（IR）提供法人會議與財報發布排程管理、投資人問答資料庫、股價/市場輿情監控。投資人關係部依「財報彙整 → 法說會準備 → 法人溝通 → 輿情監控 → 重大訊息公告 → 效益檢討」推進作業，優先解決「法人溝通紀錄分散難追蹤」，財務部則以法人溝通滿意度與重大訊息即時揭露率確認成果。」, and a global search 「搜尋指標、負責人或編號」.
- KPI ROW: 4 stat cards → 「法人溝通滿意度」, 「重大訊息即時揭露率」, 「法說會參與家數」, 「股價波動異常反應時效」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): an ANALYTICS canvas — one large line/area trend chart on top (with a period toggle 日/週/月), and below it a 2×2 grid of smaller charts (a bar ranking, a donut composition, a horizontal Pareto, and a mini table). Every chart uses the blue scale; one amber series marks the "needs attention" line.
- RIGHT RAIL (~26%): an "AI 洞察" panel — 3 auto-generated findings with an up/down delta each, and a "匯出報表" button.
- LOWER-LEFT: a 「新增指標」 form panel with fields 「法人會議與財報發布排程管理／投資人問答資料庫」「股價/市場輿情監控／法人拜訪紀錄與客戶關係管理」 and a primary submit button 「產生洞察」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

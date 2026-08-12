<!-- 33 · jvision-srm · type=procurement-srm -->
# Stitch Prompt — 「供應商關係管理 SRM」
> 系統定位：SRM 採購 / 供應商協同　｜　產業：採購供應鏈　｜　Case 33
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

1. HERO: eyebrow "SRM 採購 / 供應商協同 · Case 33"; H1 「供應商關係管理 SRM」; one-line subtitle 「Jvision SRM 採購供應商協作平台 Demo，整合供應商管理、詢報價、電子競標、訂單交期、履約驗收、ERP 介接與 AI 採購摘要。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「Jvision SRM 採購供應商協作平台 Demo，整合供應商管理、詢報價、電子競標、訂單交期、履約驗收、ERP 介接與 AI 採購摘要」時，採購專員可使用供應商關係管理 SRM集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購專員、供應鏈經理、營運長」. Include 「日常怎麼用」: 「採購專員每天在供應商關係管理 SRM更新供應商關係管理 SRM資料、處理例外並保存結果；供應鏈經理只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a SRM 採購 / 供應商協同 system (e.g. supplier scorecards, RFQ collaboration and delivery risk).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立供應商關係管理 …」→「Jvision SR…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待採購」, 「可能缺料」, 「採購金額」, 「待核准」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live SRM 採購 / 供應商協同 workspace)
Generate the actual working application screen for 「供應商關係管理 SRM」, a SRM 採購 / 供應商協同 system (supplier scorecards, RFQ collaboration and delivery risk). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「供應商關係管理 SRM」; a vertical module nav of 4 items 「採購總覽」「詢報價」「供應商評分」「交期風險」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「發出詢價」 button.
- TOP BAR of the workspace: eyebrow 「SRM 採購 / 供應商協同 · Case 33」, H1 「供應商關係管理 SRM」, subtitle 「採購供應鏈｜Jvision SRM 採購供應商協作平台 Demo，整合供應商管理、詢報價、電子競標、訂單交期、履約驗收、ERP 介接與 AI 採購摘要。」, and a global search 「搜尋採購／供應商、負責人或編號」.
- KPI ROW: 4 stat cards → 「待採購」, 「可能缺料」, 「採購金額」, 「待核准」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「供應商關係管理 SRM」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 建立供應商關係管理 … → Jvision SR… → 確認結果並完成留存) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 採購／供應商 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增採購／供應商」 form panel with fields 「供應商關係管理 SRM名稱／編號」「供應商關係管理 SRM條件／負責人／期限」 and a primary submit button 「發出詢價」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

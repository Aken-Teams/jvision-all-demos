<!-- 1257 · jvision-smart-mfg-157-vmi-consignment · type=procurement-srm -->
# Stitch Prompt — 「供應商寄售與入廠庫存管理系統（VMI/Consignment）」
> 系統定位：SRM 採購 / 供應商協同　｜　產業：採購供應鏈　｜　Case 1257
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

1. HERO: eyebrow "SRM 採購 / 供應商協同 · Case 1257"; H1 「供應商寄售與入廠庫存管理系統（VMI/Consignment）」; one-line subtitle 「供應商寄售與入廠庫存管理系統（VMI/Consignment）提供寄售庫存即時查詢、用量觸發自動補貨、庫存所有權與結算管理。採購部依「設定庫存水位 → 供應商補貨入廠 → 實際領用扣帳 → 定期結算 → 補貨循環」推進作業，優先解決「傳統採購缺料與囤料並存」，倉儲部則以缺料次數與庫存週轉率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「傳統採購缺料與囤料並存」發生時，採購部可在供應商寄售與入廠庫存管理系統（VMI/Consignment）依序完成設定庫存水位、供應商補貨入廠、實際領用扣帳、定期結算、補貨循環；倉儲部再依缺料次數與庫存週轉率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購部、倉儲部、財務部」. Include 「日常怎麼用」: 「採購部日常使用寄售庫存即時查詢、用量觸發自動補貨、庫存所有權與結算管理；案件依「設定庫存水位 → 供應商補貨入廠 → 實際領用扣帳 → 定期結算 → 補貨循環」流轉，並與ERP、WMS、MES同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a SRM 採購 / 供應商協同 system (e.g. supplier scorecards, RFQ collaboration and delivery risk).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「設定庫存水位」→「實際領用扣帳」→「補貨循環」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「缺料次數」, 「庫存週轉率」, 「寄售庫存結算準確率」, 「補貨反應時間」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live SRM 採購 / 供應商協同 workspace)
Generate the actual working application screen for 「供應商寄售與入廠庫存管理系統（VMI/Consignment）」, a SRM 採購 / 供應商協同 system (supplier scorecards, RFQ collaboration and delivery risk). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「供應商寄售與入廠庫存管理系統（VMI/Consignment）」; a vertical module nav of 4 items 「採購總覽」「詢報價」「供應商評分」「交期風險」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「發出詢價」 button.
- TOP BAR of the workspace: eyebrow 「SRM 採購 / 供應商協同 · Case 1257」, H1 「供應商寄售與入廠庫存管理系統（VMI/Consignment）」, subtitle 「採購供應鏈｜供應商寄售與入廠庫存管理系統（VMI/Consignment）提供寄售庫存即時查詢、用量觸發自動補貨、庫存所有權與結算管理。採購部依「設定庫存水位 → 供應商補貨入廠 → 實際領用扣帳 → 定期結算 → 補貨循環」推進作業，優先解決「傳統採購缺料與囤料並存」，倉儲部則以缺料次數與庫存週轉率確認成果。」, and a global search 「搜尋採購／供應商、負責人或編號」.
- KPI ROW: 4 stat cards → 「缺料次數」, 「庫存週轉率」, 「寄售庫存結算準確率」, 「補貨反應時間」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「供應商寄售與入廠庫存管理系統（VMI/Consignment）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 設定庫存水位 → 實際領用扣帳 → 補貨循環) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 採購／供應商 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增採購／供應商」 form panel with fields 「寄售庫存即時查詢／用量觸發自動補貨」「庫存所有權與結算管理／安全庫存水位設定」 and a primary submit button 「發出詢價」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

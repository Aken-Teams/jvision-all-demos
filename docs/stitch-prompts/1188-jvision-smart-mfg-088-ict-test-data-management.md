<!-- 1188 · jvision-smart-mfg-088-ict-test-data-management · type=quality-qms -->
# Stitch Prompt — 「ICT Test Data Management（電路測試數據管理）」
> 系統定位：QMS 品質管理　｜　產業：品質管理　｜　Case 1188
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

1. HERO: eyebrow "QMS 品質管理 · Case 1188"; H1 「ICT Test Data Management（電路測試數據管理）」; one-line subtitle 「ICT Test Data Management（電路測試數據管理）提供測試程式版本管理、測試結果數據蒐集、不良項目統計。測試工程部依「測試程式載入→產品測試→數據蒐集→不良分析→治具維護追蹤」推進作業，優先解決「測試數據分散各測試機」，品保部則以測試通過率與治具稼動率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「測試數據分散各測試機」發生時，測試工程部可在ICT Test Data Management（電路測試數據管理）依序完成測試程式載入、產品測試、數據蒐集、不良分析、治具維護追蹤；品保部再依測試通過率與治具稼動率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「測試工程部、品保部、製程工程部」. Include 「日常怎麼用」: 「測試工程部日常使用測試程式版本管理、測試結果數據蒐集、不良項目統計；案件依「測試程式載入→產品測試→數據蒐集→不良分析→治具維護追蹤」流轉，並與MES、良率分析系統、SPC同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a QMS 品質管理 system (e.g. quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「測試程式載入」→「數據蒐集」→「治具維護追蹤」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「測試通過率」, 「治具稼動率」, 「測試程式異常率」, 「測試數據分散各測試機」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live QMS 品質管理 workspace)
Generate the actual working application screen for 「ICT Test Data Management（電路測試數據管理）」, a QMS 品質管理 system (quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「ICT Test Data Management（電路測試數據管理）」; a vertical module nav of 4 items 「品質總覽」「異常/NCR」「CAPA/8D」「SPC 管制圖」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「開立品質案件」 button.
- TOP BAR of the workspace: eyebrow 「QMS 品質管理 · Case 1188」, H1 「ICT Test Data Management（電路測試數據管理）」, subtitle 「品質管理｜ICT Test Data Management（電路測試數據管理）提供測試程式版本管理、測試結果數據蒐集、不良項目統計。測試工程部依「測試程式載入→產品測試→數據蒐集→不良分析→治具維護追蹤」推進作業，優先解決「測試數據分散各測試機」，品保部則以測試通過率與治具稼動率確認成果。」, and a global search 「搜尋品質案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「測試通過率」, 「治具稼動率」, 「測試程式異常率」, 「測試數據分散各測試機」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「測試程式載入 → 數據蒐集 → 治具維護追蹤」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an SPC CONTROL CHART (points with UCL/LCL lines, one out-of-control point highlighted red) above a defect Pareto bar list.
- LOWER-LEFT: a 「新增品質案件」 form panel with fields 「測試程式版本管理／測試結果數據蒐集」「不良項目統計／測試治具履歷」 and a primary submit button 「開立品質案件」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

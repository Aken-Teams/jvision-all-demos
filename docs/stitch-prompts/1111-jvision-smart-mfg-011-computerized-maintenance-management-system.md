<!-- 1111 · jvision-smart-mfg-011-computerized-maintenance-management-system · type=maintenance-cmms -->
# Stitch Prompt — 「CMMS（Computerized Maintenance Management System）」
> 系統定位：CMMS 設備維護　｜　產業：設備維護　｜　Case 1111
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

1. HERO: eyebrow "CMMS 設備維護 · Case 1111"; H1 「CMMS（Computerized Maintenance Management System）」; one-line subtitle 「CMMS（Computerized Maintenance Management System）提供預防保養排程、維修工單管理、備品庫存管理。設備工程依「保養計畫制定 → 工單自動產生 → 維修執行紀錄 → 備品領用 → 履歷歸檔分析」推進作業，優先解決「保養計畫遺漏導致突發停機」，廠務則以平均故障間隔（MTBF）與平均修復時間（MTTR）確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「保養計畫遺漏導致突發停機」發生時，設備工程可在CMMS（Computerized Maintenance Management System）依序完成保養計畫制定、工單自動產生、維修執行紀錄、備品領用、履歷歸檔分析；廠務再依平均故障間隔（MTBF）與平均修復時間（MTTR）判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「設備工程、廠務、品保」. Include 「日常怎麼用」: 「設備工程日常使用預防保養排程、維修工單管理、備品庫存管理；案件依「保養計畫制定 → 工單自動產生 → 維修執行紀錄 → 備品領用 → 履歷歸檔分析」流轉，並與MES、ERP、Predictive Maintenance同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a CMMS 設備維護 system (e.g. equipment maintenance: PM schedule, predictive alerts and downtime).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「保養計畫制定」→「維修執行紀錄」→「履歷歸檔分析」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「平均故障間隔（MTBF）」, 「平均修復時間（MTTR）」, 「保養達成率」, 「保養計畫遺漏導致突發停機」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live CMMS 設備維護 workspace)
Generate the actual working application screen for 「CMMS（Computerized Maintenance Management System）」, a CMMS 設備維護 system (equipment maintenance: PM schedule, predictive alerts and downtime). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「CMMS（Computerized Maintenance Management System）」; a vertical module nav of 4 items 「設備總覽」「保養排程」「維修工單」「預兆診斷」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「派工維修」 button.
- TOP BAR of the workspace: eyebrow 「CMMS 設備維護 · Case 1111」, H1 「CMMS（Computerized Maintenance Management System）」, subtitle 「設備維護｜CMMS（Computerized Maintenance Management System）提供預防保養排程、維修工單管理、備品庫存管理。設備工程依「保養計畫制定 → 工單自動產生 → 維修執行紀錄 → 備品領用 → 履歷歸檔分析」推進作業，優先解決「保養計畫遺漏導致突發停機」，廠務則以平均故障間隔（MTBF）與平均修復時間（MTTR）確認成果。」, and a global search 「搜尋維護工單、負責人或編號」.
- KPI ROW: 4 stat cards → 「平均故障間隔（MTBF）」, 「平均修復時間（MTTR）」, 「保養達成率」, 「保養計畫遺漏導致突發停機」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「保養計畫制定 → 維修執行紀錄 → 履歷歸檔分析」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): equipment GAUGES — availability/performance/quality (OEE) rings and a predictive-alert list.
- LOWER-LEFT: a 「新增維護工單」 form panel with fields 「預防保養排程／維修工單管理」「備品庫存管理／設備履歷紀錄」 and a primary submit button 「派工維修」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

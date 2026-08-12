<!-- 1313 · jvision-smart-mfg-213-ehs-environment-health-safety · type=quality-qms -->
# Stitch Prompt — 「職業安全衛生管理系統（EHS, Environment, Health & Safety）」
> 系統定位：QMS 品質管理　｜　產業：品質管理　｜　Case 1313
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

1. HERO: eyebrow "QMS 品質管理 · Case 1313"; H1 「職業安全衛生管理系統（EHS, Environment, Health & Safety）」; one-line subtitle 「職業安全衛生管理系統（EHS, Environment, Health & Safety）提供危害辨識與風險評估（HIRA）、工安事故/虛驚事件通報、個人防護具（PPE）發放紀錄。職安衛部門依「危害辨識 → 風險評估 → 防護措施執行 → 事故/異常通報 → 改善追蹤 → 稽核結案」推進作業，優先解決「工安事故通報延遲難即時處置」，產線主管則以職災發生率與虛驚事件通報數確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「工安事故通報延遲難即時處置」發生時，職安衛部門可在職業安全衛生管理系統（EHS, Environment, Health & Safety）依序完成危害辨識、風險評估、防護措施執行、事故/異常通報、改善追蹤、稽核結案；產線主管再依職災發生率與虛驚事件通報數判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「職安衛部門、產線主管、廠務工程部」. Include 「日常怎麼用」: 「職安衛部門日常使用危害辨識與風險評估（HIRA）、工安事故/虛驚事件通報、個人防護具（PPE）發放紀錄；案件依「危害辨識 → 風險評估 → 防護措施執行 → 事故/異常通報 → 改善追蹤 → 稽核結案」流轉，並與HRIS、教育訓練系統、產線MES/CCTV系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a QMS 品質管理 system (e.g. quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「危害辨識」→「防護措施執行」→「稽核結案」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「職災發生率」, 「虛驚事件通報數」, 「健檢異常改善率」, 「PPE配戴合規率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live QMS 品質管理 workspace)
Generate the actual working application screen for 「職業安全衛生管理系統（EHS, Environment, Health & Safety）」, a QMS 品質管理 system (quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「職業安全衛生管理系統（EHS, Environment, Health & Safety）」; a vertical module nav of 4 items 「品質總覽」「異常/NCR」「CAPA/8D」「SPC 管制圖」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「開立品質案件」 button.
- TOP BAR of the workspace: eyebrow 「QMS 品質管理 · Case 1313」, H1 「職業安全衛生管理系統（EHS, Environment, Health & Safety）」, subtitle 「品質管理｜職業安全衛生管理系統（EHS, Environment, Health & Safety）提供危害辨識與風險評估（HIRA）、工安事故/虛驚事件通報、個人防護具（PPE）發放紀錄。職安衛部門依「危害辨識 → 風險評估 → 防護措施執行 → 事故/異常通報 → 改善追蹤 → 稽核結案」推進作業，優先解決「工安事故通報延遲難即時處置」，產線主管則以職災發生率與虛驚事件通報數確認成果。」, and a global search 「搜尋品質案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「職災發生率」, 「虛驚事件通報數」, 「健檢異常改善率」, 「PPE配戴合規率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「危害辨識 → 防護措施執行 → 稽核結案」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an SPC CONTROL CHART (points with UCL/LCL lines, one out-of-control point highlighted red) above a defect Pareto bar list.
- LOWER-LEFT: a 「新增品質案件」 form panel with fields 「危害辨識與風險評估（HIRA）／工安事故/虛驚事件通報」「個人防護具（PPE）發放紀錄／健康檢查排程與異常追蹤」 and a primary submit button 「開立品質案件」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

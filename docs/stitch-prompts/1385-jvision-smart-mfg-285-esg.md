<!-- 1385 · jvision-smart-mfg-285-esg · type=esg-energy -->
# Stitch Prompt — 「ESG永續管理平台」
> 系統定位：ESG 永續 / 能源碳排　｜　產業：ESG 永續　｜　Case 1385
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

1. HERO: eyebrow "ESG 永續 / 能源碳排 · Case 1385"; H1 「ESG永續管理平台」; one-line subtitle 「ESG永續管理平台提供碳排放/能源/水資源數據收集、ESG指標盤點與GRI/SASB對應、供應鏈永續盡職調查管理。永續發展部依「數據收集 → 指標計算 → 供應鏈盡調 → 報告草擬 → 第三方查證 → 對外揭露」推進作業，優先解決「各廠區ESG數據分散難彙整」，環安衛部則以碳排放強度與再生能源占比確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「各廠區ESG數據分散難彙整」發生時，永續發展部可在ESG永續管理平台依序完成數據收集、指標計算、供應鏈盡調、報告草擬、第三方查證、對外揭露；環安衛部再依碳排放強度與再生能源占比判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「永續發展部、環安衛部、人資部」. Include 「日常怎麼用」: 「永續發展部日常使用碳排放/能源/水資源數據收集、ESG指標盤點與GRI/SASB對應、供應鏈永續盡職調查管理；案件依「數據收集 → 指標計算 → 供應鏈盡調 → 報告草擬 → 第三方查證 → 對外揭露」流轉，並與能源管理系統(EMS)、採購系統、HR系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a ESG 永續 / 能源碳排 system (e.g. carbon inventory, energy load curves and reduction targets).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「數據收集」→「供應鏈盡調」→「對外揭露」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「碳排放強度」, 「再生能源占比」, 「供應鏈盡調覆蓋率」, 「報告準時發布率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live ESG 永續 / 能源碳排 workspace)
Generate the actual working application screen for 「ESG永續管理平台」, a ESG 永續 / 能源碳排 system (carbon inventory, energy load curves and reduction targets). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「ESG永續管理平台」; a vertical module nav of 4 items 「永續總覽」「碳盤查」「能源監控」「減碳目標」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「更新盤查」 button.
- TOP BAR of the workspace: eyebrow 「ESG 永續 / 能源碳排 · Case 1385」, H1 「ESG永續管理平台」, subtitle 「ESG 永續｜ESG永續管理平台提供碳排放/能源/水資源數據收集、ESG指標盤點與GRI/SASB對應、供應鏈永續盡職調查管理。永續發展部依「數據收集 → 指標計算 → 供應鏈盡調 → 報告草擬 → 第三方查證 → 對外揭露」推進作業，優先解決「各廠區ESG數據分散難彙整」，環安衛部則以碳排放強度與再生能源占比確認成果。」, and a global search 「搜尋排放源、負責人或編號」.
- KPI ROW: 4 stat cards → 「碳排放強度」, 「再生能源占比」, 「供應鏈盡調覆蓋率」, 「報告準時發布率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): an ANALYTICS canvas — one large line/area trend chart on top (with a period toggle 日/週/月), and below it a 2×2 grid of smaller charts (a bar ranking, a donut composition, a horizontal Pareto, and a mini table). Every chart uses the blue scale; one amber series marks the "needs attention" line.
- RIGHT RAIL (~26%): a REDUCTION TARGET panel — a circular progress ring toward the carbon/energy target, current vs baseline, and 2–3 recommended actions.
- LOWER-LEFT: a 「新增排放源」 form panel with fields 「碳排放/能源/水資源數據收集／ESG指標盤點與GRI/SASB對應」「供應鏈永續盡職調查管理／永續報告書自動產出」 and a primary submit button 「更新盤查」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

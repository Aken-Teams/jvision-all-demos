<!-- 1260 · jvision-smart-mfg-160-should-cost · type=procurement-srm -->
# Stitch Prompt — 「Should-cost 成本分析系統」
> 系統定位：SRM 採購 / 供應商協同　｜　產業：採購供應鏈　｜　Case 1260
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

1. HERO: eyebrow "SRM 採購 / 供應商協同 · Case 1260"; H1 「Should-cost 成本分析系統」; one-line subtitle 「Should-cost 成本分析系統提供成本結構模型建置、材料/工時/製程成本拆解、報價合理性比對分析。採購部依「建立成本模型 → 輸入製程參數 → 系統推算合理成本 → 對比供應商報價 → 議價談判」推進作業，優先解決「供應商報價黑箱難以驗證」，成本工程部則以成本模型準確度與議價節省金額確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「供應商報價黑箱難以驗證」發生時，採購部可在Should-cost 成本分析系統依序完成建立成本模型、輸入製程參數、系統推算合理成本、對比供應商報價、議價談判；成本工程部再依成本模型準確度與議價節省金額判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購部、成本工程部、研發部」. Include 「日常怎麼用」: 「採購部日常使用成本結構模型建置、材料/工時/製程成本拆解、報價合理性比對分析；案件依「建立成本模型 → 輸入製程參數 → 系統推算合理成本 → 對比供應商報價 → 議價談判」流轉，並與RFQ系統、原物料價格分析系統、ERP同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a SRM 採購 / 供應商協同 system (e.g. supplier scorecards, RFQ collaboration and delivery risk).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立成本模型」→「系統推算合理成本」→「議價談判」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「成本模型準確度」, 「議價節省金額」, 「報價審查覆蓋率」, 「供應商報價黑箱難以驗證」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live SRM 採購 / 供應商協同 workspace)
Generate the actual working application screen for 「Should-cost 成本分析系統」, a SRM 採購 / 供應商協同 system (supplier scorecards, RFQ collaboration and delivery risk). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「Should-cost 成本分析系統」; a vertical module nav of 4 items 「採購總覽」「詢報價」「供應商評分」「交期風險」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「發出詢價」 button.
- TOP BAR of the workspace: eyebrow 「SRM 採購 / 供應商協同 · Case 1260」, H1 「Should-cost 成本分析系統」, subtitle 「採購供應鏈｜Should-cost 成本分析系統提供成本結構模型建置、材料/工時/製程成本拆解、報價合理性比對分析。採購部依「建立成本模型 → 輸入製程參數 → 系統推算合理成本 → 對比供應商報價 → 議價談判」推進作業，優先解決「供應商報價黑箱難以驗證」，成本工程部則以成本模型準確度與議價節省金額確認成果。」, and a global search 「搜尋採購／供應商、負責人或編號」.
- KPI ROW: 4 stat cards → 「成本模型準確度」, 「議價節省金額」, 「報價審查覆蓋率」, 「供應商報價黑箱難以驗證」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「Should-cost 成本分析系統」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 建立成本模型 → 系統推算合理成本 → 議價談判) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 採購／供應商 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增採購／供應商」 form panel with fields 「成本結構模型建置／材料/工時/製程成本拆解」「報價合理性比對分析／What-if成本模擬」 and a primary submit button 「發出詢價」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

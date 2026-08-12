<!-- 1145 · jvision-smart-mfg-045-smed-changeover-management-system · type=manufacturing-mes -->
# Stitch Prompt — 「換線管理系統（SMED Changeover Management System）」
> 系統定位：MES 製造執行 / 排程　｜　產業：生產製造　｜　Case 1145
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

1. HERO: eyebrow "MES 製造執行 / 排程 · Case 1145"; H1 「換線管理系統（SMED Changeover Management System）」; one-line subtitle 「換線管理系統（SMED Changeover Management System）提供換線標準作業程序管理、換線時間量測記錄、內外部作業拆分建議。製造工程依「換線需求觸發 → 標準流程執行 → 換線時間紀錄 → 績效分析 → 流程持續改善」推進作業，優先解決「換線時間過長影響產能」，生產則以平均換線時間與換線達標率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「換線時間過長影響產能」發生時，製造工程可在換線管理系統（SMED Changeover Management System）依序完成換線需求觸發、標準流程執行、換線時間紀錄、績效分析、流程持續改善；生產再依平均換線時間與換線達標率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「製造工程、生產、工業工程」. Include 「日常怎麼用」: 「製造工程日常使用換線標準作業程序管理、換線時間量測記錄、內外部作業拆分建議；案件依「換線需求觸發 → 標準流程執行 → 換線時間紀錄 → 績效分析 → 流程持續改善」流轉，並與MES、APS、產線平衡系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a MES 製造執行 / 排程 system (e.g. shop-floor work-order execution with scheduling, line load and OEE).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「換線需求觸發」→「換線時間紀錄」→「流程持續改善」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「平均換線時間」, 「換線達標率」, 「換線損失產能」, 「換線時間過長影響產能」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live MES 製造執行 / 排程 workspace)
Generate the actual working application screen for 「換線管理系統（SMED Changeover Management System）」, a MES 製造執行 / 排程 system (shop-floor work-order execution with scheduling, line load and OEE). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「換線管理系統（SMED Changeover Management System）」; a vertical module nav of 4 items 「生產總覽」「工單派工」「設備/品質」「AI 改善會議」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生排程建議」 button.
- TOP BAR of the workspace: eyebrow 「MES 製造執行 / 排程 · Case 1145」, H1 「換線管理系統（SMED Changeover Management System）」, subtitle 「生產製造｜換線管理系統（SMED Changeover Management System）提供換線標準作業程序管理、換線時間量測記錄、內外部作業拆分建議。製造工程依「換線需求觸發 → 標準流程執行 → 換線時間紀錄 → 績效分析 → 流程持續改善」推進作業，優先解決「換線時間過長影響產能」，生產則以平均換線時間與換線達標率確認成果。」, and a global search 「搜尋工單、負責人或編號」.
- KPI ROW: 4 stat cards → 「平均換線時間」, 「換線達標率」, 「換線損失產能」, 「換線時間過長影響產能」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「換線需求觸發 → 換線時間紀錄 → 流程持續改善」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.
- LOWER-LEFT: a 「新增工單」 form panel with fields 「換線標準作業程序管理／換線時間量測記錄」「內外部作業拆分建議／換線績效分析」 and a primary submit button 「產生排程建議」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

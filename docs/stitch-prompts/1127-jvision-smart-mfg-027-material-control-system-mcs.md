<!-- 1127 · jvision-smart-mfg-027-material-control-system-mcs · type=manufacturing-mes -->
# Stitch Prompt — 「物料控制系統（Material Control System, MCS）」
> 系統定位：MES 製造執行 / 排程　｜　產業：生產製造　｜　Case 1127
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

1. HERO: eyebrow "MES 製造執行 / 排程 · Case 1127"; H1 「物料控制系統（Material Control System, MCS）」; one-line subtitle 「物料控制系統（Material Control System, MCS）提供現場物料流轉追蹤、投料序列控管、在製物料庫存管理。物流工程依「物料領用申請 → 投料序列確認 → 現場流轉紀錄 → 在製庫存更新 → 異常短缺預警」推進作業，優先解決「現場物料流向不透明」，生產則以物料及時到位率與投料錯誤率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「現場物料流向不透明」發生時，物流工程可在物料控制系統（Material Control System, MCS）依序完成物料領用申請、投料序列確認、現場流轉紀錄、在製庫存更新、異常短缺預警；生產再依物料及時到位率與投料錯誤率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「物流工程、生產、生管」. Include 「日常怎麼用」: 「物流工程日常使用現場物料流轉追蹤、投料序列控管、在製物料庫存管理；案件依「物料領用申請 → 投料序列確認 → 現場流轉紀錄 → 在製庫存更新 → 異常短缺預警」流轉，並與MES、WMS、AMHS同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a MES 製造執行 / 排程 system (e.g. shop-floor work-order execution with scheduling, line load and OEE).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「物料領用申請」→「現場流轉紀錄」→「異常短缺預警」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「物料及時到位率」, 「投料錯誤率」, 「在製庫存準確率」, 「現場物料流向不透明」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live MES 製造執行 / 排程 workspace)
Generate the actual working application screen for 「物料控制系統（Material Control System, MCS）」, a MES 製造執行 / 排程 system (shop-floor work-order execution with scheduling, line load and OEE). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「物料控制系統（Material Control System, MCS）」; a vertical module nav of 4 items 「生產總覽」「工單派工」「設備/品質」「AI 改善會議」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生排程建議」 button.
- TOP BAR of the workspace: eyebrow 「MES 製造執行 / 排程 · Case 1127」, H1 「物料控制系統（Material Control System, MCS）」, subtitle 「生產製造｜物料控制系統（Material Control System, MCS）提供現場物料流轉追蹤、投料序列控管、在製物料庫存管理。物流工程依「物料領用申請 → 投料序列確認 → 現場流轉紀錄 → 在製庫存更新 → 異常短缺預警」推進作業，優先解決「現場物料流向不透明」，生產則以物料及時到位率與投料錯誤率確認成果。」, and a global search 「搜尋工單、負責人或編號」.
- KPI ROW: 4 stat cards → 「物料及時到位率」, 「投料錯誤率」, 「在製庫存準確率」, 「現場物料流向不透明」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「物料領用申請 → 現場流轉紀錄 → 異常短缺預警」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.
- LOWER-LEFT: a 「新增工單」 form panel with fields 「現場物料流轉追蹤／投料序列控管」「在製物料庫存管理／物料短缺預警」 and a primary submit button 「產生排程建議」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

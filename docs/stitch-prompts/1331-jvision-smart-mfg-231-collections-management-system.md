<!-- 1331 · jvision-smart-mfg-231-collections-management-system · type=finance-case -->
# Stitch Prompt — 「應收帳款催收管理系統（Collections Management System）」
> 系統定位：金融保險 / 案件審核　｜　產業：財務會計　｜　Case 1331
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

1. HERO: eyebrow "金融保險 / 案件審核 · Case 1331"; H1 「應收帳款催收管理系統（Collections Management System）」; one-line subtitle 「應收帳款催收管理系統（Collections Management System）提供逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)。會計專員、財務經理、負責人依「逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)」推進作業，優先解決「催收人員憑經驗判斷優先順序」，部門主管則以應收帳款催收管理追蹤台處理結果確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「催收人員憑經驗判斷優先順序」發生時，會計專員、財務經理、負責人可在應收帳款催收管理系統（Collections Management System）依序完成逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)；部門主管再依處理結果判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「會計專員、財務經理、負責人」. Include 「日常怎麼用」: 「會計專員、財務經理、負責人日常使用逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)；案件依「逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)」流轉，並與既有作業系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 金融保險 / 案件審核 system (e.g. claim/loan case review pipeline with risk scoring and approval).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「逾期帳款自動分級(依…」→「催收任務排程與分派」→「催收溝通紀錄管理(電…」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「催收人員憑經驗判斷優先順序」, 「催收紀錄分散難以追蹤」, 「高風險客戶未及早介入」, 「催收成效無法量化評估」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 金融保險 / 案件審核 workspace)
Generate the actual working application screen for 「應收帳款催收管理系統（Collections Management System）」, a 金融保險 / 案件審核 system (claim/loan case review pipeline with risk scoring and approval). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「應收帳款催收管理系統（Collections Management System）」; a vertical module nav of 4 items 「案件總覽」「受理/初審」「風險評分」「覆核/核准」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「送出審核」 button.
- TOP BAR of the workspace: eyebrow 「金融保險 / 案件審核 · Case 1331」, H1 「應收帳款催收管理系統（Collections Management System）」, subtitle 「財務會計｜應收帳款催收管理系統（Collections Management System）提供逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)。會計專員、財務經理、負責人依「逾期帳款自動分級(依天數/金額)、催收任務排程與分派、催收溝通紀錄管理(電話/email/信函)」推進作業，優先解決「催收人員憑經驗判斷優先順序」，部門主管則以應收帳款催收管理追蹤台處理結果確認成果。」, and a global search 「搜尋案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「催收人員憑經驗判斷優先順序」, 「催收紀錄分散難以追蹤」, 「高風險客戶未及早介入」, 「催收成效無法量化評估」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a horizontal deal PIPELINE with the stage columns 「逾期帳款自動分級(依… → 催收任務排程與分派 → 催收溝通紀錄管理(電…」. Each column is a droppable lane holding 2–4 opportunity cards; every card shows a customer name (擬真中文人名/公司), amount, owner avatar, and a colored win-probability chip. A slim conversion funnel bar sits above the columns.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 案件 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增案件」 form panel with fields 「逾期帳款自動分級(依天數/金額)／催收任務排程與分派」「催收溝通紀錄管理(電話/email/信函)／客戶還款承諾追蹤」 and a primary submit button 「送出審核」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

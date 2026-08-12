<!-- 1115 · jvision-smart-mfg-015-spare-parts-management-system · type=finance-ledger -->
# Stitch Prompt — 「備品備件管理系統（Spare Parts Management System）」
> 系統定位：財務 / 會計台帳　｜　產業：生產製造　｜　Case 1115
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

1. HERO: eyebrow "財務 / 會計台帳 · Case 1115"; H1 「備品備件管理系統（Spare Parts Management System）」; one-line subtitle 「備品備件管理系統（Spare Parts Management System）提供備品庫存即時管理、安全庫存與再訂購點設定、領用/歸還紀錄。設備工程依「備品需求預估 → 庫存監控 → 採購觸發 → 領用登記 → 庫存盤點」推進作業，優先解決「關鍵備品缺貨延誤維修」，倉儲則以備品缺貨率與庫存週轉率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「關鍵備品缺貨延誤維修」發生時，設備工程可在備品備件管理系統（Spare Parts Management System）依序完成備品需求預估、庫存監控、採購觸發、領用登記、庫存盤點；倉儲再依備品缺貨率與庫存週轉率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「設備工程、倉儲、採購」. Include 「日常怎麼用」: 「設備工程日常使用備品庫存即時管理、安全庫存與再訂購點設定、領用/歸還紀錄；案件依「備品需求預估 → 庫存監控 → 採購觸發 → 領用登記 → 庫存盤點」流轉，並與CMMS、ERP、WMS同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 財務 / 會計台帳 system (e.g. AR/AP ledger, aging, budget vs actual and cash-flow).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「備品需求預估」→「採購觸發」→「庫存盤點」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「備品缺貨率」, 「庫存週轉率」, 「緊急採購比率」, 「關鍵備品缺貨延誤維修」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 財務 / 會計台帳 workspace)
Generate the actual working application screen for 「備品備件管理系統（Spare Parts Management System）」, a 財務 / 會計台帳 system (AR/AP ledger, aging, budget vs actual and cash-flow). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「備品備件管理系統（Spare Parts Management System）」; a vertical module nav of 4 items 「財務總覽」「應收/應付」「帳齡分析」「現金流」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生傳票」 button.
- TOP BAR of the workspace: eyebrow 「財務 / 會計台帳 · Case 1115」, H1 「備品備件管理系統（Spare Parts Management System）」, subtitle 「生產製造｜備品備件管理系統（Spare Parts Management System）提供備品庫存即時管理、安全庫存與再訂購點設定、領用/歸還紀錄。設備工程依「備品需求預估 → 庫存監控 → 採購觸發 → 領用登記 → 庫存盤點」推進作業，優先解決「關鍵備品缺貨延誤維修」，倉儲則以備品缺貨率與庫存週轉率確認成果。」, and a global search 「搜尋帳款／傳票、負責人或編號」.
- KPI ROW: 4 stat cards → 「備品缺貨率」, 「庫存週轉率」, 「緊急採購比率」, 「關鍵備品缺貨延誤維修」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「備品備件管理系統（Spare Parts Management System）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 備品需求預估 → 採購觸發 → 庫存盤點) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a trend mini-dashboard — one sparkline KPI card stack and a small composition donut, plus an AI note.
- LOWER-LEFT: a 「新增帳款／傳票」 form panel with fields 「備品庫存即時管理／安全庫存與再訂購點設定」「領用/歸還紀錄／備品與設備關聯建檔」 and a primary submit button 「產生傳票」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

<!-- 1318 · jvision-smart-mfg-218-onboarding-management · type=finance-ledger -->
# Stitch Prompt — 「新進員工報到管理系統（Onboarding Management）」
> 系統定位：財務 / 會計台帳　｜　產業：人力資源　｜　Case 1318
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

1. HERO: eyebrow "財務 / 會計台帳 · Case 1318"; H1 「新進員工報到管理系統（Onboarding Management）」; one-line subtitle 「新進員工報到管理系統（Onboarding Management）提供報到前文件與體檢預約、到職手續電子化簽署、新人訓練排程自動指派。人資部依「錄取通知 → 報到文件準備 → 到職手續辦理 → 新人訓練指派 → 試用期追蹤 → 轉正評核」推進作業，優先解決「大量新人同時到職手續紙本作業慢」，產線用人主管則以報到手續完成時效與試用期留任率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「大量新人同時到職手續紙本作業慢」發生時，人資部可在新進員工報到管理系統（Onboarding Management）依序完成錄取通知、報到文件準備、到職手續辦理、新人訓練指派、試用期追蹤、轉正評核；產線用人主管再依報到手續完成時效與試用期留任率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「人資部、產線用人主管、教育訓練組」. Include 「日常怎麼用」: 「人資部日常使用報到前文件與體檢預約、到職手續電子化簽署、新人訓練排程自動指派；案件依「錄取通知 → 報到文件準備 → 到職手續辦理 → 新人訓練指派 → 試用期追蹤 → 轉正評核」流轉，並與招募管理系統(ATS)、HRIS、教育訓練系統(LMS)同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 財務 / 會計台帳 system (e.g. AR/AP ledger, aging, budget vs actual and cash-flow).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「錄取通知」→「到職手續辦理」→「轉正評核」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「報到手續完成時效」, 「試用期留任率」, 「新人訓練完成率」, 「轉正通過率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 財務 / 會計台帳 workspace)
Generate the actual working application screen for 「新進員工報到管理系統（Onboarding Management）」, a 財務 / 會計台帳 system (AR/AP ledger, aging, budget vs actual and cash-flow). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「新進員工報到管理系統（Onboarding Management）」; a vertical module nav of 4 items 「財務總覽」「應收/應付」「帳齡分析」「現金流」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生傳票」 button.
- TOP BAR of the workspace: eyebrow 「財務 / 會計台帳 · Case 1318」, H1 「新進員工報到管理系統（Onboarding Management）」, subtitle 「人力資源｜新進員工報到管理系統（Onboarding Management）提供報到前文件與體檢預約、到職手續電子化簽署、新人訓練排程自動指派。人資部依「錄取通知 → 報到文件準備 → 到職手續辦理 → 新人訓練指派 → 試用期追蹤 → 轉正評核」推進作業，優先解決「大量新人同時到職手續紙本作業慢」，產線用人主管則以報到手續完成時效與試用期留任率確認成果。」, and a global search 「搜尋帳款／傳票、負責人或編號」.
- KPI ROW: 4 stat cards → 「報到手續完成時效」, 「試用期留任率」, 「新人訓練完成率」, 「轉正通過率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「新進員工報到管理系統（Onboarding Management）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 錄取通知 → 到職手續辦理 → 轉正評核) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a trend mini-dashboard — one sparkline KPI card stack and a small composition donut, plus an AI note.
- LOWER-LEFT: a 「新增帳款／傳票」 form panel with fields 「報到前文件與體檢預約／到職手續電子化簽署」「新人訓練排程自動指派／試用期考核追蹤」 and a primary submit button 「產生傳票」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

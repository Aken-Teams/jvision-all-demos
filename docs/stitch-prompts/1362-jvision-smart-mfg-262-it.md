<!-- 1362 · jvision-smart-mfg-262-it · type=it-ops -->
# Stitch Prompt — 「ITAM（IT資產管理）」
> 系統定位：IT 維運 / 監控　｜　產業：資訊科技　｜　Case 1362
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

1. HERO: eyebrow "IT 維運 / 監控 · Case 1362"; H1 「ITAM（IT資產管理）」; one-line subtitle 「ITAM（IT資產管理）提供硬體資產盤點與序號追蹤、軟體授權管理與合規稽核、資產採購、報廢生命週期。資訊部依「資產採購入帳→標籤建檔→派發使用→定期盤點→報廢/汰換→稽核報表」推進作業，優先解決「資產帳實不符」，財務部則以資產盤點準確率與軟體合規率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「資產帳實不符」發生時，資訊部可在ITAM（IT資產管理）依序完成資產採購入帳、標籤建檔、派發使用、定期盤點、報廢/汰換、稽核報表；財務部再依資產盤點準確率與軟體合規率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「資訊部、財務部、採購部」. Include 「日常怎麼用」: 「資訊部日常使用硬體資產盤點與序號追蹤、軟體授權管理與合規稽核、資產採購、報廢生命週期；案件依「資產採購入帳→標籤建檔→派發使用→定期盤點→報廢/汰換→稽核報表」流轉，並與ITSM、採購系統(ERP)、財務系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a IT 維運 / 監控 system (e.g. IT service tickets, asset inventory and live monitoring).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「資產採購入帳」→「派發使用」→「稽核報表」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「資產盤點準確率」, 「軟體合規率」, 「閒置資產比例」, 「資產週轉率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live IT 維運 / 監控 workspace)
Generate the actual working application screen for 「ITAM（IT資產管理）」, a IT 維運 / 監控 system (IT service tickets, asset inventory and live monitoring). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「ITAM（IT資產管理）」; a vertical module nav of 4 items 「維運總覽」「服務工單」「資產管理」「即時監控」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派工單」 button.
- TOP BAR of the workspace: eyebrow 「IT 維運 / 監控 · Case 1362」, H1 「ITAM（IT資產管理）」, subtitle 「資訊科技｜ITAM（IT資產管理）提供硬體資產盤點與序號追蹤、軟體授權管理與合規稽核、資產採購、報廢生命週期。資訊部依「資產採購入帳→標籤建檔→派發使用→定期盤點→報廢/汰換→稽核報表」推進作業，優先解決「資產帳實不符」，財務部則以資產盤點準確率與軟體合規率確認成果。」, and a global search 「搜尋工單／資產、負責人或編號」.
- KPI ROW: 4 stat cards → 「資產盤點準確率」, 「軟體合規率」, 「閒置資產比例」, 「資產週轉率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「資產採購入帳 → 派發使用 → 稽核報表」 counts) sits above the stream.
- RIGHT RAIL (~26%): a NETWORK/ASSET health panel — small topology or asset list with green/red status and uptime %.
- LOWER-LEFT: a 「新增工單／資產」 form panel with fields 「硬體資產盤點與序號追蹤／軟體授權管理與合規稽核」「資產採購、報廢生命週期／自動探勘(Discovery)網路設備」 and a primary submit button 「指派工單」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

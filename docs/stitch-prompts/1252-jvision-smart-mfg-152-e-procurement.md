<!-- 1252 · jvision-smart-mfg-152-e-procurement · type=procurement-srm -->
# Stitch Prompt — 「電子採購平台（e-Procurement）」
> 系統定位：SRM 採購 / 供應商協同　｜　產業：採購供應鏈　｜　Case 1252
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

1. HERO: eyebrow "SRM 採購 / 供應商協同 · Case 1252"; H1 「電子採購平台（e-Procurement）」; one-line subtitle 「電子採購平台（e-Procurement）提供線上型錄與商品搜尋、電子請購單與預算檢核、多層級電子簽核。採購部依「線上請購 → 主管簽核 → 比價下單 → 供應商確認 → 驗收入庫」推進作業，優先解決「紙本簽核流程冗長」，資材部則以採購週期天數與電子化採購占比確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「紙本簽核流程冗長」發生時，採購部可在電子採購平台（e-Procurement）依序完成線上請購、主管簽核、比價下單、供應商確認、驗收入庫；資材部再依採購週期天數與電子化採購占比判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購部、資材部、財務部」. Include 「日常怎麼用」: 「採購部日常使用線上型錄與商品搜尋、電子請購單與預算檢核、多層級電子簽核；案件依「線上請購 → 主管簽核 → 比價下單 → 供應商確認 → 驗收入庫」流轉，並與ERP、SRM、電子簽核系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a SRM 採購 / 供應商協同 system (e.g. supplier scorecards, RFQ collaboration and delivery risk).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「線上請購」→「比價下單」→「驗收入庫」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「採購週期天數」, 「電子化採購占比」, 「簽核平均時效」, 「採購異常率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live SRM 採購 / 供應商協同 workspace)
Generate the actual working application screen for 「電子採購平台（e-Procurement）」, a SRM 採購 / 供應商協同 system (supplier scorecards, RFQ collaboration and delivery risk). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「電子採購平台（e-Procurement）」; a vertical module nav of 4 items 「採購總覽」「詢報價」「供應商評分」「交期風險」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「發出詢價」 button.
- TOP BAR of the workspace: eyebrow 「SRM 採購 / 供應商協同 · Case 1252」, H1 「電子採購平台（e-Procurement）」, subtitle 「採購供應鏈｜電子採購平台（e-Procurement）提供線上型錄與商品搜尋、電子請購單與預算檢核、多層級電子簽核。採購部依「線上請購 → 主管簽核 → 比價下單 → 供應商確認 → 驗收入庫」推進作業，優先解決「紙本簽核流程冗長」，資材部則以採購週期天數與電子化採購占比確認成果。」, and a global search 「搜尋採購／供應商、負責人或編號」.
- KPI ROW: 4 stat cards → 「採購週期天數」, 「電子化採購占比」, 「簽核平均時效」, 「採購異常率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「電子採購平台（e-Procurement）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 線上請購 → 比價下單 → 驗收入庫) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 採購／供應商 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增採購／供應商」 form panel with fields 「線上型錄與商品搜尋／電子請購單與預算檢核」「多層級電子簽核／電子下單與自動化訂單推送」 and a primary submit button 「發出詢價」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

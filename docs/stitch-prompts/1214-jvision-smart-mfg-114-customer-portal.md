<!-- 1214 · jvision-smart-mfg-114-customer-portal · type=sales-crm -->
# Stitch Prompt — 「Customer Portal 客戶入口網站」
> 系統定位：CRM 客戶關係 / 業務管線　｜　產業：業務銷售　｜　Case 1214
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

1. HERO: eyebrow "CRM 客戶關係 / 業務管線 · Case 1214"; H1 「Customer Portal 客戶入口網站」; one-line subtitle 「Customer Portal 客戶入口網站提供訂單/出貨狀態查詢、報價單/合約文件下載、線上詢價提交。業務部依「客戶登入入口網站→查詢訂單/文件→提交需求或問題→系統通知內部處理→結果回饋客戶」推進作業，優先解決「客戶頻繁來電查詢訂單狀態」，客服部則以客戶自助使用率與客服來電下降率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「客戶頻繁來電查詢訂單狀態」發生時，業務部可在Customer Portal 客戶入口網站依序完成客戶登入入口網站、查詢訂單/文件、提交需求或問題、系統通知內部處理、結果回饋客戶；客服部再依客戶自助使用率與客服來電下降率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「業務部、客服部、資訊部」. Include 「日常怎麼用」: 「業務部日常使用訂單/出貨狀態查詢、報價單/合約文件下載、線上詢價提交；案件依「客戶登入入口網站→查詢訂單/文件→提交需求或問題→系統通知內部處理→結果回饋客戶」流轉，並與ERP、CRM、Order Management同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a CRM 客戶關係 / 業務管線 system (e.g. sales pipeline with deal stages, forecast and next-best-action).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「客戶登入入口網站」→「提交需求或問題」→「結果回饋客戶」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「客戶自助使用率」, 「客服來電下降率」, 「文件下載時效」, 「客戶滿意度」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live CRM 客戶關係 / 業務管線 workspace)
Generate the actual working application screen for 「Customer Portal 客戶入口網站」, a CRM 客戶關係 / 業務管線 system (sales pipeline with deal stages, forecast and next-best-action). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「Customer Portal 客戶入口網站」; a vertical module nav of 4 items 「業務儀表板」「商機管線」「客戶名單」「AI 業務助理」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「更新業務管線」 button.
- TOP BAR of the workspace: eyebrow 「CRM 客戶關係 / 業務管線 · Case 1214」, H1 「Customer Portal 客戶入口網站」, subtitle 「業務銷售｜Customer Portal 客戶入口網站提供訂單/出貨狀態查詢、報價單/合約文件下載、線上詢價提交。業務部依「客戶登入入口網站→查詢訂單/文件→提交需求或問題→系統通知內部處理→結果回饋客戶」推進作業，優先解決「客戶頻繁來電查詢訂單狀態」，客服部則以客戶自助使用率與客服來電下降率確認成果。」, and a global search 「搜尋商機／客戶、負責人或編號」.
- KPI ROW: 4 stat cards → 「客戶自助使用率」, 「客服來電下降率」, 「文件下載時效」, 「客戶滿意度」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a horizontal deal PIPELINE with the stage columns 「客戶登入入口網站 → 提交需求或問題 → 結果回饋客戶」. Each column is a droppable lane holding 2–4 opportunity cards; every card shows a customer name (擬真中文人名/公司), amount, owner avatar, and a colored win-probability chip. A slim conversion funnel bar sits above the columns.
- RIGHT RAIL (~26%): an "AI 下一步建議" panel — the traditional pain point (資料分散、人工追蹤) struck-through, then 3 AI recommended next actions as tappable rows with a confidence %, plus a "產生建議" button.
- LOWER-LEFT: a 「新增商機／客戶」 form panel with fields 「訂單/出貨狀態查詢／報價單/合約文件下載」「線上詢價提交／品質文件(SPC/COA)查詢」 and a primary submit button 「更新業務管線」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

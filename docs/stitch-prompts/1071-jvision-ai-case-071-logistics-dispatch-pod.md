<!-- 1071 · jvision-ai-case-071-logistics-dispatch-pod · type=logistics-fleet -->
# Stitch Prompt — 「物流派車簽收台」
> 系統定位：TMS 運輸 / 車隊調度　｜　產業：物流運輸　｜　Case 1071
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

1. HERO: eyebrow "TMS 運輸 / 車隊調度 · Case 1071"; H1 「物流派車簽收台」; one-line subtitle 「管理配送訂單、派車、貨態與電子簽收。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「管理配送訂單、派車、貨態與電子簽收」時，調度專員可使用物流派車簽收台集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「調度專員、車隊主管、營運經理」. Include 「日常怎麼用」: 「調度專員每天在物流派車簽收台更新物流派車簽收台資料、處理例外並保存結果；車隊主管只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a TMS 運輸 / 車隊調度 system (e.g. fleet dispatch: route map, job assignment and delivery status).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立物流派車簽收台資…」→「管理配送訂單、派車、…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待派車」, 「延誤風險」, 「今日里程」, 「待回簽」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live TMS 運輸 / 車隊調度 workspace)
Generate the actual working application screen for 「物流派車簽收台」, a TMS 運輸 / 車隊調度 system (fleet dispatch: route map, job assignment and delivery status). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「物流派車簽收台」; a vertical module nav of 4 items 「調度總覽」「任務派車」「路線追蹤」「成本油耗」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「派車調度」 button.
- TOP BAR of the workspace: eyebrow 「TMS 運輸 / 車隊調度 · Case 1071」, H1 「物流派車簽收台」, subtitle 「物流運輸｜管理配送訂單、派車、貨態與電子簽收。」, and a global search 「搜尋任務／車輛、負責人或編號」.
- KPI ROW: 4 stat cards → 「待派車」, 「延誤風險」, 「今日里程」, 「待回簽」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a DISPATCH MAP panel (stylised city map with route lines and vehicle/pin markers in the blue palette) on top; below it a job list where each row shows a task ID, origin→destination, driver/vehicle, ETA and a status pill (「建立物流派車簽收台資… → 管理配送訂單、派車、… → 確認結果並完成留存」).
- RIGHT RAIL (~26%): a vertical TIMELINE of the record's activity/appointments with time stamps and status dots.
- LOWER-LEFT: a 「新增任務／車輛」 form panel with fields 「物流派車簽收台名稱／編號」「物流派車簽收台條件／負責人／期限」 and a primary submit button 「派車調度」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

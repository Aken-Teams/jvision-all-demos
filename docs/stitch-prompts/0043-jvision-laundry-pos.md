<!-- 43 · jvision-laundry-pos · type=pos-frontdesk -->
# Stitch Prompt — 「洗衣門市 POS」
> 系統定位：POS 門市前台　｜　產業：零售電商　｜　Case 43
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

1. HERO: eyebrow "POS 門市前台 · Case 43"; H1 「洗衣門市 POS」; one-line subtitle 「Jvision 洗衣門市管理平台，展示客戶資料、送洗衣服登入、衣物入庫、取件付款、每日支出、日月報表與資料備份流程。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「Jvision 洗衣門市管理平台，展示客戶資料、送洗衣服登入、衣物入庫、取件付款、每日支出、日月報表與資料備份流程」時，電商營運可使用洗衣門市 POS集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「電商營運、商品經理、品牌負責人」. Include 「日常怎麼用」: 「電商營運每天在洗衣門市 POS更新洗衣門市 POS資料、處理例外並保存結果；商品經理只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a POS 門市前台 system (e.g. point-of-sale front desk: cart, table map, tickets and daily sales).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立洗衣門市 POS…」→「Jvision 洗衣…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待出貨訂單」, 「低庫存商品」, 「今日銷售額」, 「退貨待處理」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live POS 門市前台 workspace)
Generate the actual working application screen for 「洗衣門市 POS」, a POS 門市前台 system (point-of-sale front desk: cart, table map, tickets and daily sales). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「洗衣門市 POS」; a vertical module nav of 4 items 「門市前台」「點餐/開單」「訂單管理」「日結報表」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「結帳」 button.
- TOP BAR of the workspace: eyebrow 「POS 門市前台 · Case 43」, H1 「洗衣門市 POS」, subtitle 「零售電商｜Jvision 洗衣門市管理平台，展示客戶資料、送洗衣服登入、衣物入庫、取件付款、每日支出、日月報表與資料備份流程。」, and a global search 「搜尋訂單／桌位、負責人或編號」.
- KPI ROW: 4 stat cards → 「待出貨訂單」, 「低庫存商品」, 「今日銷售額」, 「退貨待處理」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a POS FRONT-DESK — left two-thirds is a product/menu grid or a table-map of the venue (coloured occupancy states 「建立洗衣門市 POS… → Jvision 洗衣… → 確認結果並完成留存」); right third is the live order/cart ticket with line items, quantities, subtotal and a large 結帳 button.
- RIGHT RAIL (~26%): the live ORDER TICKET / kitchen queue with items, timers and a 完成 button.
- LOWER-LEFT: a 「新增訂單／桌位」 form panel with fields 「洗衣門市 POS名稱／編號」「洗衣門市 POS條件／負責人／期限」 and a primary submit button 「結帳」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

<!-- 1296 · jvision-smart-mfg-196-aging-obsolete-inventory-analysis · type=warehouse-wms -->
# Stitch Prompt — 「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）」
> 系統定位：WMS 倉儲作業　｜　產業：倉儲物流　｜　Case 1296
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

1. HERO: eyebrow "WMS 倉儲作業 · Case 1296"; H1 「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）」; one-line subtitle 「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）提供庫齡區間自動分類、呆滯料預警與清單產出、呆滯料處置建議(調撥/促銷/報廢)。倉儲部依「庫齡自動計算→呆滯門檻判定→預警通報→處置方案評估→執行處置→效益追蹤」推進作業，優先解決「呆滯料長期積壓占用資金」，財務部則以呆滯料金額占比與庫齡結構分布確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「呆滯料長期積壓占用資金」發生時，倉儲部可在庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）依序完成庫齡自動計算、呆滯門檻判定、預警通報、處置方案評估、執行處置、效益追蹤；財務部再依呆滯料金額占比與庫齡結構分布判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「倉儲部、財務部、採購部」. Include 「日常怎麼用」: 「倉儲部日常使用庫齡區間自動分類、呆滯料預警與清單產出、呆滯料處置建議(調撥/促銷/報廢)；案件依「庫齡自動計算→呆滯門檻判定→預警通報→處置方案評估→執行處置→效益追蹤」流轉，並與ERP、WMS、財務系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a WMS 倉儲作業 system (e.g. warehouse inbound/outbound waves, bin locations and stock levels).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「庫齡自動計算」→「預警通報」→「效益追蹤」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「呆滯料金額占比」, 「庫齡結構分布」, 「呆滯料處置率」, 「資產減損降低幅度」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live WMS 倉儲作業 workspace)
Generate the actual working application screen for 「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）」, a WMS 倉儲作業 system (warehouse inbound/outbound waves, bin locations and stock levels). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）」; a vertical module nav of 4 items 「倉儲總覽」「入庫上架」「揀貨出貨」「盤點/儲位」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生波次」 button.
- TOP BAR of the workspace: eyebrow 「WMS 倉儲作業 · Case 1296」, H1 「庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）」, subtitle 「倉儲物流｜庫齡呆滯料分析系統（Aging & Obsolete Inventory Analysis）提供庫齡區間自動分類、呆滯料預警與清單產出、呆滯料處置建議(調撥/促銷/報廢)。倉儲部依「庫齡自動計算→呆滯門檻判定→預警通報→處置方案評估→執行處置→效益追蹤」推進作業，優先解決「呆滯料長期積壓占用資金」，財務部則以呆滯料金額占比與庫齡結構分布確認成果。」, and a global search 「搜尋揀貨／出貨單、負責人或編號」.
- KPI ROW: 4 stat cards → 「呆滯料金額占比」, 「庫齡結構分布」, 「呆滯料處置率」, 「資產減損降低幅度」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「庫齡自動計算 → 預警通報 → 效益追蹤」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): a trend mini-dashboard — one sparkline KPI card stack and a small composition donut, plus an AI note.
- LOWER-LEFT: a 「新增揀貨／出貨單」 form panel with fields 「庫齡區間自動分類／呆滯料預警與清單產出」「呆滯料處置建議(調撥/促銷/報廢)／庫齡趨勢儀表板」 and a primary submit button 「產生波次」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

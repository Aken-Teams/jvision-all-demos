<!-- 1268 · jvision-smart-mfg-168-system-168 · type=warehouse-wms -->
# Stitch Prompt — 「關鍵零組件庫存協同平台」
> 系統定位：WMS 倉儲作業　｜　產業：採購供應鏈　｜　Case 1268
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

1. HERO: eyebrow "WMS 倉儲作業 · Case 1268"; H1 「關鍵零組件庫存協同平台」; one-line subtitle 「關鍵零組件庫存協同平台提供關鍵料件庫存可視化、供應商產能與交期共享、需求預測協同調整。採購部依「需求預測共享 → 供應商產能回饋 → 庫存協同調整 → 缺料情境模擬 → 動態調度」推進作業，優先解決「晶片荒期間供需資訊不對稱」，供應鏈規劃部則以關鍵料件庫存可視覆蓋率與協同預測準確度確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「晶片荒期間供需資訊不對稱」發生時，採購部可在關鍵零組件庫存協同平台依序完成需求預測共享、供應商產能回饋、庫存協同調整、缺料情境模擬、動態調度；供應鏈規劃部再依關鍵料件庫存可視覆蓋率與協同預測準確度判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購部、供應鏈規劃部、生產計畫部」. Include 「日常怎麼用」: 「採購部日常使用關鍵料件庫存可視化、供應商產能與交期共享、需求預測協同調整；案件依「需求預測共享 → 供應商產能回饋 → 庫存協同調整 → 缺料情境模擬 → 動態調度」流轉，並與ERP、APS、SRM同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a WMS 倉儲作業 system (e.g. warehouse inbound/outbound waves, bin locations and stock levels).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「需求預測共享」→「庫存協同調整」→「動態調度」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「關鍵料件庫存可視覆蓋率」, 「協同預測準確度」, 「跨點調度反應時間」, 「晶片荒期間供需資訊不對稱」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live WMS 倉儲作業 workspace)
Generate the actual working application screen for 「關鍵零組件庫存協同平台」, a WMS 倉儲作業 system (warehouse inbound/outbound waves, bin locations and stock levels). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「關鍵零組件庫存協同平台」; a vertical module nav of 4 items 「倉儲總覽」「入庫上架」「揀貨出貨」「盤點/儲位」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生波次」 button.
- TOP BAR of the workspace: eyebrow 「WMS 倉儲作業 · Case 1268」, H1 「關鍵零組件庫存協同平台」, subtitle 「採購供應鏈｜關鍵零組件庫存協同平台提供關鍵料件庫存可視化、供應商產能與交期共享、需求預測協同調整。採購部依「需求預測共享 → 供應商產能回饋 → 庫存協同調整 → 缺料情境模擬 → 動態調度」推進作業，優先解決「晶片荒期間供需資訊不對稱」，供應鏈規劃部則以關鍵料件庫存可視覆蓋率與協同預測準確度確認成果。」, and a global search 「搜尋揀貨／出貨單、負責人或編號」.
- KPI ROW: 4 stat cards → 「關鍵料件庫存可視覆蓋率」, 「協同預測準確度」, 「跨點調度反應時間」, 「晶片荒期間供需資訊不對稱」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「需求預測共享 → 庫存協同調整 → 動態調度」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): a trend mini-dashboard — one sparkline KPI card stack and a small composition donut, plus an AI note.
- LOWER-LEFT: a 「新增揀貨／出貨單」 form panel with fields 「關鍵料件庫存可視化／供應商產能與交期共享」「需求預測協同調整／缺料情境模擬與應變」 and a primary submit button 「產生波次」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

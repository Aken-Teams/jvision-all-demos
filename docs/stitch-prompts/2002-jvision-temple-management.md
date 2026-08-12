<!-- 2002 · jvision-temple-management · type=operations-console -->
# Stitch Prompt — 「宮廟信眾與服務管理」
> 系統定位：營運管理主控台　｜　產業：宗教服務　｜　Case 2002
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

1. HERO: eyebrow "營運管理主控台 · Case 2002"; H1 「宮廟信眾與服務管理」; one-line subtitle 「信徒名冊、點燈登記、法會活動與捐獻收據的互動式廟務管理 Demo」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「信徒名冊、點燈登記、法會活動與捐獻收據的互動式廟務管理 Demo」時，行政人員可使用宮廟信眾與服務管理集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「行政人員、活動總幹事、管理委員」. Include 「日常怎麼用」: 「行政人員每天在宮廟信眾與服務管理更新宮廟信眾與服務管理資料、處理例外並保存結果；活動總幹事只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 營運管理主控台 system (e.g. operational console with records, workflow stages and daily summary).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立宮廟信眾與服務管…」→「信徒名冊、點燈登記、…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待辦服務」, 「志工缺口」, 「待核名冊」, 「物資待補」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 營運管理主控台 workspace)
Generate the actual working application screen for 「宮廟信眾與服務管理」, a 營運管理主控台 system (operational console with records, workflow stages and daily summary). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「宮廟信眾與服務管理」; a vertical module nav of 4 items 「營運總覽」「作業看板」「例外處理」「營運洞察」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「新增作業」 button.
- TOP BAR of the workspace: eyebrow 「營運管理主控台 · Case 2002」, H1 「宮廟信眾與服務管理」, subtitle 「宗教服務｜信徒名冊、點燈登記、法會活動與捐獻收據的互動式廟務管理 Demo」, and a global search 「搜尋作業、負責人或編號」.
- KPI ROW: 4 stat cards → 「待辦服務」, 「志工缺口」, 「待核名冊」, 「物資待補」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「建立宮廟信眾與服務管… → 信徒名冊、點燈登記、… → 確認結果並完成留存」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.
- LOWER-LEFT: a 「新增作業」 form panel with fields 「宮廟信眾與服務管理名稱／編號」「宮廟信眾與服務管理條件／負責人／期限」 and a primary submit button 「新增作業」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

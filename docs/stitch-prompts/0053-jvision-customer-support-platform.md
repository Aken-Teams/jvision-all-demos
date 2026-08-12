<!-- 53 · jvision-customer-support-platform · type=service-desk -->
# Stitch Prompt — 「客戶服務平台」
> 系統定位：客服 / 服務台　｜　產業：客服管理　｜　Case 53
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

1. HERO: eyebrow "客服 / 服務台 · Case 53"; H1 「客戶服務平台」; one-line subtitle 「Jvision 客服支援平台，展示共享收件箱、AI 摘要與回覆、知識庫、支援入口、工作流程、主動訊息與客服報表流程。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「Jvision 客服支援平台，展示共享收件箱、AI 摘要與回覆、知識庫、支援入口、工作流程、主動訊息與客服報表流程」時，客服專員可使用客戶服務平台集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「客服專員、客服主管、營運經理」. Include 「日常怎麼用」: 「客服專員每天在客戶服務平台更新客戶服務平台資料、處理例外並保存結果；客服主管只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 客服 / 服務台 system (e.g. customer service desk: tickets, SLA timers and compensation).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立客戶服務平台資料」→「Jvision 客服…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待處理案件」, 「即將逾時」, 「今日結案」, 「待客戶回覆」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 客服 / 服務台 workspace)
Generate the actual working application screen for 「客戶服務平台」, a 客服 / 服務台 system (customer service desk: tickets, SLA timers and compensation). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「客戶服務平台」; a vertical module nav of 4 items 「服務總覽」「服務工單」「SLA 追蹤」「客訴補償」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「受理服務單」 button.
- TOP BAR of the workspace: eyebrow 「客服 / 服務台 · Case 53」, H1 「客戶服務平台」, subtitle 「客服管理｜Jvision 客服支援平台，展示共享收件箱、AI 摘要與回覆、知識庫、支援入口、工作流程、主動訊息與客服報表流程。」, and a global search 「搜尋服務單、負責人或編號」.
- KPI ROW: 4 stat cards → 「待處理案件」, 「即將逾時」, 「今日結案」, 「待客戶回覆」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「建立客戶服務平台資料 → Jvision 客服… → 確認結果並完成留存」 counts) sits above the stream.
- RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.
- LOWER-LEFT: a 「新增服務單」 form panel with fields 「客戶服務平台名稱／編號」「客戶服務平台條件／負責人／期限」 and a primary submit button 「受理服務單」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

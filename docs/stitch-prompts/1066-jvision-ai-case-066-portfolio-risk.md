<!-- 1066 · jvision-ai-case-066-portfolio-risk · type=finance-case -->
# Stitch Prompt — 「投資風險羅盤」
> 系統定位：金融保險 / 案件審核　｜　產業：金融保險　｜　Case 1066
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

1. HERO: eyebrow "金融保險 / 案件審核 · Case 1066"; H1 「投資風險羅盤」; one-line subtitle 「彙整資產配置、風險曝險與情境模擬。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當現場需要「彙整資產配置、風險曝險與情境模擬」時，理專專員可使用投資風險羅盤集中處理，不必再以試算表或訊息往返確認。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「理專專員、理專主管、金融保險主管」. Include 「日常怎麼用」: 「理專專員每天在投資風險羅盤更新投資風險羅盤資料、處理例外並保存結果；理專主管只需查看逾期、衝突或待確認項目。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 金融保險 / 案件審核 system (e.g. claim/loan case review pipeline with risk scoring and approval).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「建立投資風險羅盤資料」→「彙整資產配置、風險曝…」→「確認結果並完成留存」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「待聯絡客戶」, 「文件缺漏」, 「本月續約」, 「待覆核」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 金融保險 / 案件審核 workspace)
Generate the actual working application screen for 「投資風險羅盤」, a 金融保險 / 案件審核 system (claim/loan case review pipeline with risk scoring and approval). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「投資風險羅盤」; a vertical module nav of 4 items 「案件總覽」「受理/初審」「風險評分」「覆核/核准」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「送出審核」 button.
- TOP BAR of the workspace: eyebrow 「金融保險 / 案件審核 · Case 1066」, H1 「投資風險羅盤」, subtitle 「金融保險｜彙整資產配置、風險曝險與情境模擬。」, and a global search 「搜尋案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「待聯絡客戶」, 「文件缺漏」, 「本月續約」, 「待覆核」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a horizontal deal PIPELINE with the stage columns 「建立投資風險羅盤資料 → 彙整資產配置、風險曝… → 確認結果並完成留存」. Each column is a droppable lane holding 2–4 opportunity cards; every card shows a customer name (擬真中文人名/公司), amount, owner avatar, and a colored win-probability chip. A slim conversion funnel bar sits above the columns.
- RIGHT RAIL (~26%): a RISK RADAR — a ranked list of the highest-risk 案件 with red/amber/green severity chips and an impact estimate, plus an AI mitigation note.
- LOWER-LEFT: a 「新增案件」 form panel with fields 「投資風險羅盤名稱／編號」「投資風險羅盤條件／負責人／期限」 and a primary submit button 「送出審核」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

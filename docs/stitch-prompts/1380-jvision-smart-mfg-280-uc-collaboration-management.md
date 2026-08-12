<!-- 1380 · jvision-smart-mfg-280-uc-collaboration-management · type=collaboration-pm -->
# Stitch Prompt — 「統一通訊與協作平台管理（UC & Collaboration Management）」
> 系統定位：協作 / 專案任務　｜　產業：企業協作　｜　Case 1380
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

1. HERO: eyebrow "協作 / 專案任務 · Case 1380"; H1 「統一通訊與協作平台管理（UC & Collaboration Management）」; one-line subtitle 「統一通訊與協作平台管理（UC & Collaboration Management）提供通訊/會議帳號與授權管理、使用政策與資料外洩防護整合、通話品質與可用性監控。資訊部依「帳號開通與授權指派→使用政策設定(DLP整合)→平台可用性監控→異常使用告警→授權使用量檢視→定期成本優化」推進作業，優先解決「多套通訊工具帳號混亂」，行政部則以平台可用率與授權使用率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「多套通訊工具帳號混亂」發生時，資訊部可在統一通訊與協作平台管理（UC & Collaboration Management）依序完成帳號開通與授權指派、使用政策設定(DLP整合)、平台可用性監控、異常使用告警、授權使用量檢視、定期成本優化；行政部再依平台可用率與授權使用率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「資訊部、行政部、人資部」. Include 「日常怎麼用」: 「資訊部日常使用通訊/會議帳號與授權管理、使用政策與資料外洩防護整合、通話品質與可用性監控；案件依「帳號開通與授權指派→使用政策設定(DLP整合)→平台可用性監控→異常使用告警→授權使用量檢視→定期成本優化」流轉，並與IAM、SIEM、ITSM同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 協作 / 專案任務 system (e.g. team collaboration board with tasks, owners and automation).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「帳號開通與授權指派」→「平台可用性監控」→「定期成本優化」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「平台可用率」, 「授權使用率」, 「資料外洩事件數」, 「使用者滿意度」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 協作 / 專案任務 workspace)
Generate the actual working application screen for 「統一通訊與協作平台管理（UC & Collaboration Management）」, a 協作 / 專案任務 system (team collaboration board with tasks, owners and automation). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「統一通訊與協作平台管理（UC & Collaboration Management）」; a vertical module nav of 4 items 「工作總覽」「任務看板」「專案協作」「流程自動化」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派任務」 button.
- TOP BAR of the workspace: eyebrow 「協作 / 專案任務 · Case 1380」, H1 「統一通訊與協作平台管理（UC & Collaboration Management）」, subtitle 「企業協作｜統一通訊與協作平台管理（UC & Collaboration Management）提供通訊/會議帳號與授權管理、使用政策與資料外洩防護整合、通話品質與可用性監控。資訊部依「帳號開通與授權指派→使用政策設定(DLP整合)→平台可用性監控→異常使用告警→授權使用量檢視→定期成本優化」推進作業，優先解決「多套通訊工具帳號混亂」，行政部則以平台可用率與授權使用率確認成果。」, and a global search 「搜尋任務、負責人或編號」.
- KPI ROW: 4 stat cards → 「平台可用率」, 「授權使用率」, 「資料外洩事件數」, 「使用者滿意度」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「帳號開通與授權指派 → 平台可用性監控 → 定期成本優化」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an "AI 賦能情境" panel showing the pain point, an AI insight paragraph, and 3 horizontal risk bars; a "AI 重新分析" button at the bottom.
- LOWER-LEFT: a 「新增任務」 form panel with fields 「通訊/會議帳號與授權管理／使用政策與資料外洩防護整合」「通話品質與可用性監控／跨廠區/跨國會議排程整合」 and a primary submit button 「指派任務」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

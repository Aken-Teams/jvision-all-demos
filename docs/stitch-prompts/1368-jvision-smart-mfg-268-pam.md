<!-- 1368 · jvision-smart-mfg-268-pam · type=security-soc -->
# Stitch Prompt — 「特權帳號管理系統（PAM）」
> 系統定位：資安 SOC / 事件應變　｜　產業：資訊安全　｜　Case 1368
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

1. HERO: eyebrow "資安 SOC / 事件應變 · Case 1368"; H1 「特權帳號管理系統（PAM）」; one-line subtitle 「特權帳號管理系統（PAM）提供特權帳號密碼保險箱管理、工作階段錄影與側錄、臨時授權與到期自動收回。資訊部依「特權帳號納管→密碼保險箱化→申請臨時授權→審核通過開通→操作側錄→到期自動收回」推進作業，優先解決「設備商工程師擁有長期高權限」，資訊安全部則以特權帳號覆蓋率與密碼輪替合規率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「設備商工程師擁有長期高權限」發生時，資訊部可在特權帳號管理系統（PAM）依序完成特權帳號納管、密碼保險箱化、申請臨時授權、審核通過開通、操作側錄、到期自動收回；資訊安全部再依特權帳號覆蓋率與密碼輪替合規率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「資訊部、資訊安全部、產線設備維護部」. Include 「日常怎麼用」: 「資訊部日常使用特權帳號密碼保險箱管理、工作階段錄影與側錄、臨時授權與到期自動收回；案件依「特權帳號納管→密碼保險箱化→申請臨時授權→審核通過開通→操作側錄→到期自動收回」流轉，並與IAM、SIEM、OT資安管理系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 資安 SOC / 事件應變 system (e.g. security event console: alerts, severity triage and response).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「特權帳號納管」→「申請臨時授權」→「到期自動收回」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「特權帳號覆蓋率」, 「密碼輪替合規率」, 「異常操作攔截數」, 「第三方存取稽核完成率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 資安 SOC / 事件應變 workspace)
Generate the actual working application screen for 「特權帳號管理系統（PAM）」, a 資安 SOC / 事件應變 system (security event console: alerts, severity triage and response). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「特權帳號管理系統（PAM）」; a vertical module nav of 4 items 「SOC 總覽」「告警分流」「事件應變」「弱點/合規」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派處理」 button.
- TOP BAR of the workspace: eyebrow 「資安 SOC / 事件應變 · Case 1368」, H1 「特權帳號管理系統（PAM）」, subtitle 「資訊安全｜特權帳號管理系統（PAM）提供特權帳號密碼保險箱管理、工作階段錄影與側錄、臨時授權與到期自動收回。資訊部依「特權帳號納管→密碼保險箱化→申請臨時授權→審核通過開通→操作側錄→到期自動收回」推進作業，優先解決「設備商工程師擁有長期高權限」，資訊安全部則以特權帳號覆蓋率與密碼輪替合規率確認成果。」, and a global search 「搜尋資安事件、負責人或編號」.
- KPI ROW: 4 stat cards → 「特權帳號覆蓋率」, 「密碼輪替合規率」, 「異常操作攔截數」, 「第三方存取稽核完成率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「特權帳號納管 → 申請臨時授權 → 到期自動收回」 counts) sits above the stream.
- RIGHT RAIL (~26%): an ALERT TRIAGE panel — top severities with counts, MTTR gauge, and a "指派處理" button.
- LOWER-LEFT: a 「新增資安事件」 form panel with fields 「特權帳號密碼保險箱管理／工作階段錄影與側錄」「臨時授權與到期自動收回／第三方廠商遠端存取控管」 and a primary submit button 「指派處理」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

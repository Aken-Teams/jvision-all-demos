<!-- 1379 · jvision-smart-mfg-279-grc · type=security-soc -->
# Stitch Prompt — 「IT治理、風險與法規遵循平台（GRC）」
> 系統定位：資安 SOC / 事件應變　｜　產業：資訊安全　｜　Case 1379
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

1. HERO: eyebrow "資安 SOC / 事件應變 · Case 1379"; H1 「IT治理、風險與法規遵循平台（GRC）」; one-line subtitle 「IT治理、風險與法規遵循平台（GRC）提供資安政策與制度文件管理、風險評估與風險登記冊、合規基準檢核清單。資訊安全部依「制定資安政策與控制項→定期風險評估→稽核排程執行→發現事項開立改善單→追蹤改善完成→管理層報告」推進作業，優先解決「資安制度文件版本混亂」，稽核室則以稽核發現改善完成率與風險降低率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「資安制度文件版本混亂」發生時，資訊安全部可在IT治理、風險與法規遵循平台（GRC）依序完成制定資安政策與控制項、定期風險評估、稽核排程執行、發現事項開立改善單、追蹤改善完成、管理層報告；稽核室再依稽核發現改善完成率與風險降低率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「資訊安全部、稽核室、法遵部」. Include 「日常怎麼用」: 「資訊安全部日常使用資安政策與制度文件管理、風險評估與風險登記冊、合規基準檢核清單；案件依「制定資安政策與控制項→定期風險評估→稽核排程執行→發現事項開立改善單→追蹤改善完成→管理層報告」流轉，並與SIEM、弱點管理平台、ITSM同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 資安 SOC / 事件應變 system (e.g. security event console: alerts, severity triage and response).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「制定資安政策與控制項」→「稽核排程執行」→「管理層報告」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「稽核發現改善完成率」, 「風險降低率」, 「合規達成率」, 「政策覆蓋率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 資安 SOC / 事件應變 workspace)
Generate the actual working application screen for 「IT治理、風險與法規遵循平台（GRC）」, a 資安 SOC / 事件應變 system (security event console: alerts, severity triage and response). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「IT治理、風險與法規遵循平台（GRC）」; a vertical module nav of 4 items 「SOC 總覽」「告警分流」「事件應變」「弱點/合規」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派處理」 button.
- TOP BAR of the workspace: eyebrow 「資安 SOC / 事件應變 · Case 1379」, H1 「IT治理、風險與法規遵循平台（GRC）」, subtitle 「資訊安全｜IT治理、風險與法規遵循平台（GRC）提供資安政策與制度文件管理、風險評估與風險登記冊、合規基準檢核清單。資訊安全部依「制定資安政策與控制項→定期風險評估→稽核排程執行→發現事項開立改善單→追蹤改善完成→管理層報告」推進作業，優先解決「資安制度文件版本混亂」，稽核室則以稽核發現改善完成率與風險降低率確認成果。」, and a global search 「搜尋資安事件、負責人或編號」.
- KPI ROW: 4 stat cards → 「稽核發現改善完成率」, 「風險降低率」, 「合規達成率」, 「政策覆蓋率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「制定資安政策與控制項 → 稽核排程執行 → 管理層報告」 counts) sits above the stream.
- RIGHT RAIL (~26%): an ALERT TRIAGE panel — top severities with counts, MTTR gauge, and a "指派處理" button.
- LOWER-LEFT: a 「新增資安事件」 form panel with fields 「資安政策與制度文件管理／風險評估與風險登記冊」「合規基準檢核清單／稽核任務排程與追蹤」 and a primary submit button 「指派處理」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

<!-- 1365 · jvision-smart-mfg-265-cloud-management-platform-cmp · type=it-ops -->
# Stitch Prompt — 「雲端資源管理平台（Cloud Management Platform, CMP）」
> 系統定位：IT 維運 / 監控　｜　產業：資訊科技　｜　Case 1365
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

1. HERO: eyebrow "IT 維運 / 監控 · Case 1365"; H1 「雲端資源管理平台（Cloud Management Platform, CMP）」; one-line subtitle 「雲端資源管理平台（Cloud Management Platform, CMP）提供多雲資源盤點與可視化、成本分析與預算控管(FinOps)、資源自動擴縮與排程。資訊部依「雲端資源上架→標籤與權限設定→用量與成本監控→異常/超支告警→優化建議執行→月度報表」推進作業，優先解決「雲端費用失控超支」，財務部則以雲端成本節省率與資源使用率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「雲端費用失控超支」發生時，資訊部可在雲端資源管理平台（Cloud Management Platform, CMP）依序完成雲端資源上架、標籤與權限設定、用量與成本監控、異常/超支告警、優化建議執行、月度報表；財務部再依雲端成本節省率與資源使用率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「資訊部、財務部、雲端維運團隊」. Include 「日常怎麼用」: 「資訊部日常使用多雲資源盤點與可視化、成本分析與預算控管(FinOps)、資源自動擴縮與排程；案件依「雲端資源上架→標籤與權限設定→用量與成本監控→異常/超支告警→優化建議執行→月度報表」流轉，並與IAM、SIEM、ITSM同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a IT 維運 / 監控 system (e.g. IT service tickets, asset inventory and live monitoring).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「雲端資源上架」→「用量與成本監控」→「月度報表」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「雲端成本節省率」, 「資源使用率」, 「預算達成率」, 「安全合規率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live IT 維運 / 監控 workspace)
Generate the actual working application screen for 「雲端資源管理平台（Cloud Management Platform, CMP）」, a IT 維運 / 監控 system (IT service tickets, asset inventory and live monitoring). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「雲端資源管理平台（Cloud Management Platform, CMP）」; a vertical module nav of 4 items 「維運總覽」「服務工單」「資產管理」「即時監控」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派工單」 button.
- TOP BAR of the workspace: eyebrow 「IT 維運 / 監控 · Case 1365」, H1 「雲端資源管理平台（Cloud Management Platform, CMP）」, subtitle 「資訊科技｜雲端資源管理平台（Cloud Management Platform, CMP）提供多雲資源盤點與可視化、成本分析與預算控管(FinOps)、資源自動擴縮與排程。資訊部依「雲端資源上架→標籤與權限設定→用量與成本監控→異常/超支告警→優化建議執行→月度報表」推進作業，優先解決「雲端費用失控超支」，財務部則以雲端成本節省率與資源使用率確認成果。」, and a global search 「搜尋工單／資產、負責人或編號」.
- KPI ROW: 4 stat cards → 「雲端成本節省率」, 「資源使用率」, 「預算達成率」, 「安全合規率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a live OPERATIONS CONSOLE — a real-time event/ticket stream list where each row has a severity dot (綠/黃/紅), a timestamp, a source, a short message, and an assignee; a compact status summary strip (「雲端資源上架 → 用量與成本監控 → 月度報表」 counts) sits above the stream.
- RIGHT RAIL (~26%): a NETWORK/ASSET health panel — small topology or asset list with green/red status and uptime %.
- LOWER-LEFT: a 「新增工單／資產」 form panel with fields 「多雲資源盤點與可視化／成本分析與預算控管(FinOps)」「資源自動擴縮與排程／雲端安全設定稽核」 and a primary submit button 「指派工單」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

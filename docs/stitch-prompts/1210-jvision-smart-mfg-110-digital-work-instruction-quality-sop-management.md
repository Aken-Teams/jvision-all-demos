<!-- 1210 · jvision-smart-mfg-110-digital-work-instruction-quality-sop-management · type=quality-qms -->
# Stitch Prompt — 「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）」
> 系統定位：QMS 品質管理　｜　產業：品質管理　｜　Case 1210
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

1. HERO: eyebrow "QMS 品質管理 · Case 1210"; H1 「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）」; one-line subtitle 「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）提供SOP數位化編輯、多媒體圖文/影片指導、版本自動更新推播。製程工程部依「SOP編寫審核→發行推播→現場掃碼查閱→閱讀簽核→定期複審更新」推進作業，優先解決「紙本指導書更新不同步」，品保部則以SOP更新推播時效與現場閱讀簽核完成率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「紙本指導書更新不同步」發生時，製程工程部可在Digital Work Instruction/Quality SOP Management（數位作業指導書管理）依序完成SOP編寫審核、發行推播、現場掃碼查閱、閱讀簽核、定期複審更新；品保部再依SOP更新推播時效與現場閱讀簽核完成率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「製程工程部、品保部、生產部」. Include 「日常怎麼用」: 「製程工程部日常使用SOP數位化編輯、多媒體圖文/影片指導、版本自動更新推播；案件依「SOP編寫審核→發行推播→現場掃碼查閱→閱讀簽核→定期複審更新」流轉，並與文件管制系統、訓練管理、QMS同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a QMS 品質管理 system (e.g. quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「SOP編寫審核」→「現場掃碼查閱」→「定期複審更新」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「SOP更新推播時效」, 「現場閱讀簽核完成率」, 「因SOP未依循造成異常次數」, 「紙本指導書更新不同步」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live QMS 品質管理 workspace)
Generate the actual working application screen for 「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）」, a QMS 品質管理 system (quality cases: NCR/CAPA/8D, SPC control charts and defect Pareto). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）」; a vertical module nav of 4 items 「品質總覽」「異常/NCR」「CAPA/8D」「SPC 管制圖」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「開立品質案件」 button.
- TOP BAR of the workspace: eyebrow 「QMS 品質管理 · Case 1210」, H1 「Digital Work Instruction/Quality SOP Management（數位作業指導書管理）」, subtitle 「品質管理｜Digital Work Instruction/Quality SOP Management（數位作業指導書管理）提供SOP數位化編輯、多媒體圖文/影片指導、版本自動更新推播。製程工程部依「SOP編寫審核→發行推播→現場掃碼查閱→閱讀簽核→定期複審更新」推進作業，優先解決「紙本指導書更新不同步」，品保部則以SOP更新推播時效與現場閱讀簽核完成率確認成果。」, and a global search 「搜尋品質案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「SOP更新推播時效」, 「現場閱讀簽核完成率」, 「因SOP未依循造成異常次數」, 「紙本指導書更新不同步」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a status KANBAN board with columns 「SOP編寫審核 → 現場掃碼查閱 → 定期複審更新」. Each column header shows a count badge; each card shows an ID (擬真編號), a short title, an owner chip, a due tag (D+n), and a small colored risk/priority dot. Cards are draggable between columns.
- RIGHT RAIL (~26%): an SPC CONTROL CHART (points with UCL/LCL lines, one out-of-control point highlighted red) above a defect Pareto bar list.
- LOWER-LEFT: a 「新增品質案件」 form panel with fields 「SOP數位化編輯／多媒體圖文/影片指導」「版本自動更新推播／現場掃碼查閱」 and a primary submit button 「開立品質案件」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

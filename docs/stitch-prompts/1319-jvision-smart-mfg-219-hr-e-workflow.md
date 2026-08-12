<!-- 1319 · jvision-smart-mfg-219-hr-e-workflow · type=hr-hris -->
# Stitch Prompt — 「人事電子簽核系統（HR e-Workflow）」
> 系統定位：HRIS 人力資源　｜　產業：人力資源　｜　Case 1319
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

1. HERO: eyebrow "HRIS 人力資源 · Case 1319"; H1 「人事電子簽核系統（HR e-Workflow）」; one-line subtitle 「人事電子簽核系統（HR e-Workflow）提供表單流程設計器（可視化簽核路徑）、多層級簽核與代理人設定、行動裝置簽核推播。人資部依「員工提出申請 → 系統依規則轉送簽核 → 主管/HR逐層審核 → 簽核完成通知 → 資料同步至相關系統」推進作業，優先解決「紙本簽呈流程冗長且易遺失」，全體主管與員工則以平均簽核時效與逾期簽核件數確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「紙本簽呈流程冗長且易遺失」發生時，人資部可在人事電子簽核系統（HR e-Workflow）依序完成員工提出申請、系統依規則轉送簽核、主管/HR逐層審核、簽核完成通知、資料同步至相關系統；全體主管與員工再依平均簽核時效與逾期簽核件數判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「人資部、全體主管與員工、稽核部」. Include 「日常怎麼用」: 「人資部日常使用表單流程設計器（可視化簽核路徑）、多層級簽核與代理人設定、行動裝置簽核推播；案件依「員工提出申請 → 系統依規則轉送簽核 → 主管/HR逐層審核 → 簽核完成通知 → 資料同步至相關系統」流轉，並與HRIS、ESS、薪資系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a HRIS 人力資源 system (e.g. HR records: attendance, payroll, leave and recruiting pipeline).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「員工提出申請」→「主管/HR逐層審核」→「資料同步至相關系統」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「平均簽核時效」, 「逾期簽核件數」, 「電子化比率」, 「系統使用率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live HRIS 人力資源 workspace)
Generate the actual working application screen for 「人事電子簽核系統（HR e-Workflow）」, a HRIS 人力資源 system (HR records: attendance, payroll, leave and recruiting pipeline). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「人事電子簽核系統（HR e-Workflow）」; a vertical module nav of 4 items 「人資總覽」「出勤差勤」「薪資計算」「招募派遣」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「產生班表」 button.
- TOP BAR of the workspace: eyebrow 「HRIS 人力資源 · Case 1319」, H1 「人事電子簽核系統（HR e-Workflow）」, subtitle 「人力資源｜人事電子簽核系統（HR e-Workflow）提供表單流程設計器（可視化簽核路徑）、多層級簽核與代理人設定、行動裝置簽核推播。人資部依「員工提出申請 → 系統依規則轉送簽核 → 主管/HR逐層審核 → 簽核完成通知 → 資料同步至相關系統」推進作業，優先解決「紙本簽呈流程冗長且易遺失」，全體主管與員工則以平均簽核時效與逾期簽核件數確認成果。」, and a global search 「搜尋員工／班表、負責人或編號」.
- KPI ROW: 4 stat cards → 「平均簽核時效」, 「逾期簽核件數」, 「電子化比率」, 「系統使用率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「人事電子簽核系統（HR e-Workflow）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 員工提出申請 → 主管/HR逐層審核 → 資料同步至相關系統) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a mini MONTH CALENDAR with shift/leave markers and a list of today's exceptions to approve.
- LOWER-LEFT: a 「新增員工／班表」 form panel with fields 「表單流程設計器（可視化簽核路徑）／多層級簽核與代理人設定」「行動裝置簽核推播／簽核歷程與時間戳記存證」 and a primary submit button 「產生班表」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

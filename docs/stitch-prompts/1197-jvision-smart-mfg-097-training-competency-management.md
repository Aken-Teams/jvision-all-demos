<!-- 1197 · jvision-smart-mfg-097-training-competency-management · type=education-lms -->
# Stitch Prompt — 「Training & Competency Management（人員訓練資格管理）」
> 系統定位：教育 / 學習平台　｜　產業：教育　｜　Case 1197
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

1. HERO: eyebrow "教育 / 學習平台 · Case 1197"; H1 「Training & Competency Management（人員訓練資格管理）」; one-line subtitle 「Training & Competency Management（人員訓練資格管理）提供訓練課程管理、能力矩陣建置、資格到期提醒。人力資源部依「訓練需求分析→課程安排→訓練執行→測驗評核→資格認證歸檔」推進作業，優先解決「訓練紀錄紙本化」，品保部則以訓練完成率與資格逾期比例確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「訓練紀錄紙本化」發生時，人力資源部可在Training & Competency Management（人員訓練資格管理）依序完成訓練需求分析、課程安排、訓練執行、測驗評核、資格認證歸檔；品保部再依訓練完成率與資格逾期比例判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「人力資源部、品保部、生產部」. Include 「日常怎麼用」: 「人力資源部日常使用訓練課程管理、能力矩陣建置、資格到期提醒；案件依「訓練需求分析→課程安排→訓練執行→測驗評核→資格認證歸檔」流轉，並與HR系統、QMS、稽核管理同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 教育 / 學習平台 system (e.g. learning platform: course catalog, learner progress and assignments).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「訓練需求分析」→「訓練執行」→「資格認證歸檔」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「訓練完成率」, 「資格逾期比例」, 「崗位資格符合率」, 「訓練紀錄紙本化」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 教育 / 學習平台 workspace)
Generate the actual working application screen for 「Training & Competency Management（人員訓練資格管理）」, a 教育 / 學習平台 system (learning platform: course catalog, learner progress and assignments). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「Training & Competency Management（人員訓練資格管理）」; a vertical module nav of 4 items 「學習總覽」「課程管理」「學員進度」「作業/測驗」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「指派作業」 button.
- TOP BAR of the workspace: eyebrow 「教育 / 學習平台 · Case 1197」, H1 「Training & Competency Management（人員訓練資格管理）」, subtitle 「教育｜Training & Competency Management（人員訓練資格管理）提供訓練課程管理、能力矩陣建置、資格到期提醒。人力資源部依「訓練需求分析→課程安排→訓練執行→測驗評核→資格認證歸檔」推進作業，優先解決「訓練紀錄紙本化」，品保部則以訓練完成率與資格逾期比例確認成果。」, and a global search 「搜尋課程／學員、負責人或編號」.
- KPI ROW: 4 stat cards → 「訓練完成率」, 「資格逾期比例」, 「崗位資格符合率」, 「訓練紀錄紙本化」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a responsive CARD GRID (3 across) of 「Training & Competency Management（人員訓練資格管理）」 items (課程/學員/單元). Each card has a cover block, a title, a progress bar, a meta row and a primary action. A segmented filter (「訓練需求分析 → 訓練執行 → 資格認證歸檔」) sits above the grid.
- RIGHT RAIL (~26%): a LEARNER PROGRESS panel — completion ring, at-risk students list and next assignment.
- LOWER-LEFT: a 「新增課程／學員」 form panel with fields 「訓練課程管理／能力矩陣建置」「資格到期提醒／線上測驗」 and a primary submit button 「指派作業」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

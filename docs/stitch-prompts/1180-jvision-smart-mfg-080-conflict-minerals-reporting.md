<!-- 1180 · jvision-smart-mfg-080-conflict-minerals-reporting · type=healthcare-clinic -->
# Stitch Prompt — 「Conflict Minerals Reporting（衝突礦產申報管理）」
> 系統定位：醫療 / 診所照護　｜　產業：品質管理　｜　Case 1180
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

1. HERO: eyebrow "醫療 / 診所照護 · Case 1180"; H1 「Conflict Minerals Reporting（衝突礦產申報管理）」; one-line subtitle 「Conflict Minerals Reporting（衝突礦產申報管理）提供CMRT/EMRT範本管理、供應商調查問卷發送、冶煉廠清單比對。採購部依「問卷發送→供應商填報→數據驗證→冶煉廠比對→報告彙總提交」推進作業，優先解決「供應商回覆率低」，法規事務部則以供應商回覆率與合規冶煉廠比例確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「供應商回覆率低」發生時，採購部可在Conflict Minerals Reporting（衝突礦產申報管理）依序完成問卷發送、供應商填報、數據驗證、冶煉廠比對、報告彙總提交；法規事務部再依供應商回覆率與合規冶煉廠比例判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「採購部、法規事務部、品保部」. Include 「日常怎麼用」: 「採購部日常使用CMRT/EMRT範本管理、供應商調查問卷發送、冶煉廠清單比對；案件依「問卷發送→供應商填報→數據驗證→冶煉廠比對→報告彙總提交」流轉，並與SQM、RoHS/REACH管理、ERP同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 醫療 / 診所照護 system (e.g. clinic operations: appointments, patient records and follow-up).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「問卷發送」→「數據驗證」→「報告彙總提交」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「供應商回覆率」, 「合規冶煉廠比例」, 「申報準時率」, 「供應商回覆率低」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 醫療 / 診所照護 workspace)
Generate the actual working application screen for 「Conflict Minerals Reporting（衝突礦產申報管理）」, a 醫療 / 診所照護 system (clinic operations: appointments, patient records and follow-up). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「Conflict Minerals Reporting（衝突礦產申報管理）」; a vertical module nav of 4 items 「診所總覽」「預約掛號」「病患照護」「申報作業」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「安排回診」 button.
- TOP BAR of the workspace: eyebrow 「醫療 / 診所照護 · Case 1180」, H1 「Conflict Minerals Reporting（衝突礦產申報管理）」, subtitle 「品質管理｜Conflict Minerals Reporting（衝突礦產申報管理）提供CMRT/EMRT範本管理、供應商調查問卷發送、冶煉廠清單比對。採購部依「問卷發送→供應商填報→數據驗證→冶煉廠比對→報告彙總提交」推進作業，優先解決「供應商回覆率低」，法規事務部則以供應商回覆率與合規冶煉廠比例確認成果。」, and a global search 「搜尋病患／預約、負責人或編號」.
- KPI ROW: 4 stat cards → 「供應商回覆率」, 「合規冶煉廠比例」, 「申報準時率」, 「供應商回覆率低」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「Conflict Minerals Reporting（衝突礦產申報管理）」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 問卷發送 → 數據驗證 → 報告彙總提交) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a vertical TIMELINE of the record's activity/appointments with time stamps and status dots.
- LOWER-LEFT: a 「新增病患／預約」 form panel with fields 「CMRT/EMRT範本管理／供應商調查問卷發送」「冶煉廠清單比對／申報結果彙整」 and a primary submit button 「安排回診」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

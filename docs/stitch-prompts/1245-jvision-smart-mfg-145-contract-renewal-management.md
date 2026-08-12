<!-- 1245 · jvision-smart-mfg-145-contract-renewal-management · type=legal-case -->
# Stitch Prompt — 「合約續約管理 Contract Renewal Management」
> 系統定位：法務 / 案件管理　｜　產業：業務銷售　｜　Case 1245
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

1. HERO: eyebrow "法務 / 案件管理 · Case 1245"; H1 「合約續約管理 Contract Renewal Management」; one-line subtitle 「合約續約管理 Contract Renewal Management提供合約到期日曆與提醒、續約談判進度追蹤、歷史條款與價格比對。業務部依「合約到期預警→啟動續約評估→談判新條件→內部核准→簽署新合約→更新合約主檔」推進作業，優先解決「合約到期未察覺自動失效」，法務部則以續約率與提前預警達成率確認成果。」; two buttons 「開啟互動 Demo」(primary blue) and 「觀看 3 分鐘導覽」(ghost). A soft blue abstract system illustration on the right.
2. 要解決的問題 (The problem): a 2–3 card row describing the pain. Seed copy: 「當「合約到期未察覺自動失效」發生時，業務部可在合約續約管理 Contract Renewal Management依序完成合約到期預警、啟動續約評估、談判新條件、內部核准、簽署新合約、更新合約主檔；法務部再依續約率與提前預警達成率判斷是否需要介入。」 Frame the old way (試算表往返、人工追蹤、異常太晚發現) vs. why it hurts.
3. 這套系統做什麼 (What the system does): a short paragraph + a 「適合誰」chip row → 「業務部、法務部、業務主管」. Include 「日常怎麼用」: 「業務部日常使用合約到期日曆與提醒、續約談判進度追蹤、歷史條款與價格比對；案件依「合約到期預警→啟動續約評估→談判新條件→內部核准→簽署新合約→更新合約主檔」流轉，並與Contract Management、CRM、E-Signature系統同步。」
4. 核心功能 (Key features): a 3×2 grid of 6 feature tiles with a small blue line-icon each, derived from a 法務 / 案件管理 system (e.g. legal matter management: cases, hearings, contracts and time tracking).
5. 運作流程 (How it works): a horizontal numbered STEP FLOW with these stages 「合約到期預警」→「談判新條件」→「更新合約主檔」 — each step a node with icon, title and one line of helper text.
6. 帶來的效益 (Benefits): a KPI strip of 4 outcome stats built around 「續約率」, 「提前預警達成率」, 「續約談判週期」, 「流失客戶挽回率」 (show as before→after or ▲/▼ deltas), then 2–3 bullet benefits.
7. CTA band: 「準備好看它實際運作了嗎？」 with a big 「進入 Demo」 button.
Footer: JVision wordmark + 「擬真示範資料」 note.

## SCREEN 2 — Demo 操作畫面 (the live 法務 / 案件管理 workspace)
Generate the actual working application screen for 「合約續約管理 Contract Renewal Management」, a 法務 / 案件管理 system (legal matter management: cases, hearings, contracts and time tracking). Use the STYLE SYSTEM. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision」/「合約續約管理 Contract Renewal Management」; a vertical module nav of 4 items 「案件總覽」「案件進度」「庭期/合約」「工時計費」 with the first active; and a bottom "今日摘要" mini-card with a big number and a 「新增案件」 button.
- TOP BAR of the workspace: eyebrow 「法務 / 案件管理 · Case 1245」, H1 「合約續約管理 Contract Renewal Management」, subtitle 「業務銷售｜合約續約管理 Contract Renewal Management提供合約到期日曆與提醒、續約談判進度追蹤、歷史條款與價格比對。業務部依「合約到期預警→啟動續約評估→談判新條件→內部核准→簽署新合約→更新合約主檔」推進作業，優先解決「合約到期未察覺自動失效」，法務部則以續約率與提前預警達成率確認成果。」, and a global search 「搜尋案件、負責人或編號」.
- KPI ROW: 4 stat cards → 「續約率」, 「提前預警達成率」, 「續約談判週期」, 「流失客戶挽回率」. Big blue numbers, tiny caption, a ▲/▼ delta on each.
- PRIMARY (center, ~62% width): a dense but clean DATA TABLE of 「合約續約管理 Contract Renewal Management」 records. Columns include 編號 / 名稱 / 負責人 / 狀態(coloured status pills e.g. 合約到期預警 → 談判新條件 → 更新合約主檔) / 期限 / 金額或數量. Sticky header, zebra rows, a status filter chip row above it, and row hover with a quick-action button.
- RIGHT RAIL (~26%): a vertical TIMELINE of the record's activity/appointments with time stamps and status dots.
- LOWER-LEFT: a 「新增案件」 form panel with fields 「合約到期日曆與提醒／續約談判進度追蹤」「歷史條款與價格比對／自動續約條款判定」 and a primary submit button 「新增案件」, plus quick actions 「AI 重新分析」「模擬主管審核」「還原範例資料」.
- LOWER-RIGHT / BOTTOM: an "操作紀錄 (Audit Trail)" log list with time-stamped entries.
All names, companies, order numbers and figures are realistic Traditional-Chinese SAMPLE data. Make it look like a system a customer already paid for.

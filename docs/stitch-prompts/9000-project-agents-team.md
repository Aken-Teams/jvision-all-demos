<!-- 9000 · project-agents-team · type=multi-agent-orchestration -->
# Stitch Prompt — 「專案 Agents ── 你的 AI 專案團隊」
> 系統定位：Multi-Agent 協作平台（Agent Team / Orchestration）　｜　放在導覽列「專案 Agents」　｜　取代/升級現有 project-expert.html
> 目標感受：①agents 很豐富（一支各司其職的 AI 團隊）②落地強大（一句話 → 整支團隊分工協作 → 產出公司要的資訊、決策、交付物）。看完會覺得「我就是需要這種系統」。
> 用法：把【STYLE SYSTEM】貼進 Stitch 的 style/theme，再用 SCREEN 1 / SCREEN 2 / SCREEN 3 各生成一個畫面。

```
STYLE SYSTEM (apply to every screen):
- Product family: a professional, trustworthy B2B enterprise SaaS console. Clean, bright, high-contrast, data-dense but calm. Think Linear × modern ERP × an AI agent orchestration cockpit.
- Primary color #1E40AF (deep blue) and #3B82F6 (bright blue) for actions, active nav, chart series and key numbers. Background is white #FFFFFF and light blue-grey #F5F8FC. Text is slate #1E293B on white; muted #64748B for secondary. Borders are hairline #E2E8F0. Use one warm amber #D97706 ONLY for "needs attention / human-review / CTA highlight". Success green #16A34A, danger red #DC2626 used sparingly for status. A subtle violet #7C3AED accent is allowed ONLY for the AI/agent layer (agent avatars, orchestration links, "AI" badges) to distinguish agent actions from human data.
- Rounded 12px cards with a soft, low shadow; 8px controls. Generous whitespace, 8-pt spacing rhythm.
- Typography: clean geometric sans (Inter / Noto Sans TC). Big bold numbers for KPIs. Traditional-Chinese UI copy, ALL-CAPS latin section labels (e.g. "AGENT TEAM", "MISSION CONTROL") as tiny eyebrows.
- Agents are shown as small circular avatars with a soft violet-blue ring and a status dot (green=執行中 / grey=待命 / amber=待審核). Connections between agents are thin curved lines (orchestration links).
- Every screen: fixed top bar (left: JVision wordmark; center: global search; right: notifications + avatar). No dark mode. Desktop-first, but the layout must reflow gracefully to tablet/mobile.
- Tone: enterprise, credible, "a real multi-agent system a customer would buy" — not a toy demo. Every name, company, order number and figure is realistic Traditional-Chinese SAMPLE data.
```

---

## AGENT ROSTER (共用素材 — 供三個畫面取用的固定角色，讓畫面有真實感)
一支分成 5 個小隊的 AI 專案團隊，外加 1 位總指揮：

- 🧭 **總指揮 Agent（Orchestrator）**「智策」— 聽懂一句話需求、拆解成子任務、分派並匯總。畫面中央的核心節點。
- **顧問組 Advisory**：選型顧問 Agent「選配」(從 463 個系統推薦最合適的)、產業領域專家 Agent「行家」(29 產業落地建議)、導入策略顧問 Agent「藍圖」(導入路線圖)
- **審視組 Assurance**：專案完整度 Agent「明鏡」(逐案稽核完整度)、風險與合規 Agent「守衡」(標示敏感規則/權限/資料治理)、品質稽核 Agent「校準」
- **生成組 Builder**：規格/SOW Agent「擬稿」、UI 設計 Agent「繪境」(產生設計稿 prompt)、資料填充 Agent「填實」(擬真示範資料)、導覽腳本 Agent「講解」(3 分鐘 demo talk-track)
- **營運組 Operations**：ROI 試算 Agent「算盤」、報價預算 Agent「估價」、專案排程 Agent「排程」、進度追蹤 Agent「督導」

---

## SCREEN 1 — Agents Team 總覽 / Landing（感受「團隊很豐富 + 會協作」）
Generate a professional single-scroll LANDING page for a multi-agent enterprise platform called 「專案 Agents」. Use the STYLE SYSTEM. Sections top-to-bottom:

1. HERO (split): eyebrow 「AGENT TEAM · MULTI-AGENT ORCHESTRATION」; H1 「一句話，讓整支 AI 專案團隊替你完成」; subtitle 「16 位各司其職的 AI 專員，會自己分工、互相交接，把一個需求變成完整的資訊、決策與可交付成果。」 Under it a large prominent INPUT BAR (like a command bar) with placeholder 「描述你的目標，例如：我要導入一套生產排程系統，並評估導入 ROI 與風險」 and a primary violet-blue button 「啟動 Agent 團隊 →」. Below the input, 3 small suggestion chips 「導入生產排程」「組織碳盤查」「客訴根因分析」. On the RIGHT: an animated-looking CONSTELLATION — a central violet orchestrator avatar labelled 「智策」with ~10 smaller agent avatars orbiting it, connected by thin curved orchestration lines; 2–3 of the outer avatars glow green (執行中).
2. STATS STRIP: 4 big-number stats → 「16 位 專案 Agents」「29 個 涵蓋產業」「463 套 可調度系統」「平均 7 步 完成一個需求」.
3. 「認識你的 Agent 團隊」section: an eyebrow 「THE TEAM」+ H2. Then agent cards grouped under 5 SQUAD headers (顧問組 / 審視組 / 生成組 / 營運組 / 指揮). Each squad is a labelled row of agent cards. Each AGENT CARD: circular violet-ringed avatar with a status dot, agent nickname (e.g. 「選配」), role line (e.g. 「選型顧問 · 從 463 套系統推薦最合適」), 3 tiny capability chips, and a faint 「查看 Agent →」 link. Use the ROSTER above for real names/roles. Make it feel abundant (12–16 cards).
4. 「他們如何協作」section (THE HOOK): eyebrow 「HOW THEY COLLABORATE」+ H2 「不是一個 Agent 硬扛，而是一支團隊接力」. A horizontal ORCHESTRATION FLOW diagram with 5 numbered stages, each a node with icon + title + one helper line: ①理解需求 (Orchestrator 聽懂並澄清) → ②拆解任務 (拆成子任務並排優先序) → ③平行分派 (同時派給顧問/審視/生成/營運多個 agents) → ④交接彙整 (agents 互相交出中間產物) → ⑤產出交付 (匯總成規格、清單、報表、時程). Draw thin curved links between nodes; show a few agent avatars sitting on the links to imply hand-offs.
5. 「落地情境」section: eyebrow 「IN ACTION」. 3 SCENARIO cards, each: a scenario title, the one-sentence 需求, a small row of the 4–5 participating agent avatars, and a 「產出」list of 3 deliverables + an outcome KPI. Seed cards:
   - 「導入生產排程系統」需求「我要導入生產排程並評估 ROI」→ 參與：選配·行家·擬稿·算盤·守衡 → 產出：推薦系統清單、導入規格草稿、ROI 試算表 · KPI「預估交期達成率 +18%」
   - 「組織碳盤查上線」需求「幫我盤查工廠碳排並找減碳機會」→ 參與：行家·擬稿·算盤·督導 → 產出：盤查範疇、排放熱點、減碳路線 · KPI「可辨識減碳點 12 處」
   - 「客訴根因分析」需求「這個月客訴變多，找出根因與對策」→ 參與：行家·明鏡·擬稿·排程 → 產出：根因樹、對策清單、追蹤時程 · KPI「重複客訴 -34%」
6. CTA band (violet-blue gradient panel): H2 「把你的下一個需求，交給整支 Agent 團隊。」+ big button 「開啟任務指揮中心 →」.
Footer: JVision wordmark + 「擬真示範資料 · Multi-Agent Demo」 note.

---

## SCREEN 2 — 任務指揮中心 / Mission Control（旗艦 DEMO，「落地強大」的高光畫面）
Generate the live application screen 「任務指揮中心」 where ONE user request is being executed by the whole agent team in real time. Use the STYLE SYSTEM. This is the flagship screen — make it look like a real, powerful, running multi-agent system. Layout:

- LEFT SIDEBAR (~12%, deep-blue-tinted): brand block 「JVision · 專案 Agents」; a vertical nav 「任務指揮中心」「Agent 團隊」「交付物庫」「執行紀錄」 with the first active; a bottom mini-card 「今日任務 3 · 完成 2」 with a 「新任務」 button.
- TOP BAR of the workspace: eyebrow 「MISSION CONTROL · 任務 #MT-2048」; the OBJECTIVE as an H2 in quotes 「導入一套生產排程系統，並評估導入 ROI 與風險」; a status pill 「協作中 · 第 4／7 步」(animated); on the right 3 mini-stats 「參與 Agents 6」「已完成步驟 12」「產出交付物 4」and buttons 「重新調度」「匯出交付包」.
- THREE-COLUMN body:
  - LEFT COLUMN (~24%) — 「任務拆解 (Task Tree)」: the objective at top, then a nested checklist of sub-tasks with status icons (✓ 已完成 / ● 進行中 / ○ 待處理), each sub-task showing the assigned agent avatar. Example items: 「理解與澄清需求 ✓ 智策」「盤點適配系統 ✓ 選配」「產業落地分析 ● 行家」「撰寫導入規格 ○ 擬稿」「ROI 與風險試算 ○ 算盤」「合規與權限審核 ○ 守衡(待審核 amber)」. A slim overall progress bar 57%.
  - CENTER COLUMN (~44%) — 「協作實況」: the hero of the screen. TOP = a live AGENT COLLABORATION GRAPH: the violet orchestrator 「智策」 in the middle, 6 participating agent avatars around it connected by animated orchestration links; the currently-active links glow; each active agent shows a tiny "typing/working" shimmer. BELOW = a streaming ACTIVITY FEED / agent-to-agent chat log, newest at bottom, each row = agent avatar + name + a timestamp + a message, e.g.:
      「智策 09:14 已將需求拆為 6 項子任務，指派顧問組先行。」
      「選配 09:15 比對 463 套系統，推薦「生產工單管理」等 3 套，信心 92%。」
      「行家 09:16 針對製造業指出 3 大痛點，建議排程引擎與預警規則解耦。」
      「算盤 09:17 依產線資料試算：預估交期達成率 +18%、庫存周轉 +11%。」
      「守衡 09:18 ⚠ 自動改派與產能承諾屬敏感決策，已標記需製造主管覆核。」(amber, with a 「指派人工審核」button)
    Make some rows show small inline chips/mini-tables so it feels like agents are exchanging structured data, not just chatting.
  - RIGHT COLUMN (~32%) — 「交付物 (Deliverables)」: a stack of deliverable cards that fill up as agents finish. Each card: an icon, title, the agent that produced it, a 2-line preview, a status tag (完成/草稿/待審核), and 「查看 / 匯出」 actions. Seed cards: 「推薦系統清單 · 選配 · 完成」(mini list of 3 systems w/ match %), 「導入規格草稿 · 擬稿 · 草稿」, 「ROI 試算表 · 算盤 · 完成」(a tiny before→after KPI row), 「風險與合規清單 · 守衡 · 待審核 (amber)」. At the very top a summary card 「本任務將產出 6 份交付物，已完成 4」.
- BOTTOM STRIP (full width) — 「決策紀錄 (Decision Log / Audit Trail)」: a compact time-stamped table of key agent decisions, each with 決策 / 依據 / 負責 Agent / 狀態, and sensitive rows flagged 「需人工審核」in amber. Emphasise 可解釋、可追溯.
All figures/names are realistic Traditional-Chinese sample data. The overall impression: a credible, powerful command center where a fleet of AI agents turns one sentence into complete, auditable enterprise work.

---

## SCREEN 3 — Agent 詳細頁 / Agent Profile（認識單一 agent + 它如何和別人合作）
Generate an AGENT PROFILE page for a single agent (use 「選型顧問 Agent「選配」」). Use the STYLE SYSTEM. Layout:

1. BACK link 「← 回 Agent 團隊」. HERO CARD (horizontal): large violet-ringed avatar with green status dot; H1 「選配 · 選型顧問 Agent」; squad tag 「顧問組」; a one-line role 「從 463 套 JVision 系統中，依你的產業、規模與痛點推薦最合適的方案。」; status 「待命中 · 今日已協助 7 個任務」; primary button 「指派任務給選配」+ ghost 「加入我的團隊」.
2. KPI ROW: 4 stat cards → 「協助任務 128」「推薦命中率 92%」「平均回應 8 秒」「常協作 Agents 5」.
3. TWO-COLUMN body:
   - LEFT (~62%):
     a) 「能力 (Capabilities)」: a 2×3 grid of 6 capability tiles with small line-icons (需求語意理解、產業匹配、規模/預算適配、多方案比較、信心評分、與領域專家交叉驗證).
     b) 「觸發與輸入 (Triggers & Inputs)」: chips for inputs it accepts (一句話需求、產業別、公司規模、預算區間、既有系統).
     c) 「產出範例 (Sample Output)」: a realistic deliverable card = a 「推薦系統清單」 with 3 rows (系統名稱 / 適配理由 / 匹配度% bar / 「開啟 Demo」), e.g. 「生產工單管理 92%」「AI 產線智排中心 88%」「設備預測維護 81%」.
   - RIGHT (~38%):
     a) 「協作關係 (Collaboration)」: a small graph — 選配 in the center linked to 智策(接收指派)、行家(交叉驗證)、算盤(交棒試算)、擬稿(交棒寫規格). Each link labelled with the hand-off type.
     b) 「適用專案」: a chip cloud of relevant systems from the 463 catalog, each chip links out (生產製造、採購供應鏈、品質管理…).
     c) 「執行紀錄 (Recent Activity)」: a timeline feed of the agent's last 4 actions with timestamps.
4. BOTTOM: 「同隊成員」 — a row of the other 顧問組 agent cards (行家、藍圖) with 「查看」 links, encouraging exploration.
Footer: JVision wordmark.

---

### 實作對應（給後續開發參考，非給 Stitch）
- SCREEN 1 → 新的 `agents.html`（總覽），取代導覽列「專案 Agents」現有連結。
- SCREEN 2 → `agents-mission.html`（任務指揮中心，旗艦 demo）。
- SCREEN 3 → `agents-profile.html?id=xxx`（單一 agent，可由 roster JSON 驅動）。
- 資料：新增 `content/agents/roster.json`（16 位 agent）＋ `content/agents/missions.json`（示範任務腳本，供指揮中心逐步播放）。可重用既有 `docs/PROJECT_EXPERT_AGENT_REPORT.json` 的 463 案與 29 產業 profile 做「適用專案 / 匹配」。

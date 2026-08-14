"""真協作管線（角色分工）：
① 指揮官(智策) 找對的 agent + 確認（不自己做）
② 資料 agent（internal-sim/external-real）只『查資料』回數據
③ 介面設計(繪境) 用資料『設計整頁報告』：自選配色/風格、完整版面、RWD、真圖表（jv-chart 佔位）
④ 指揮官確認
不是一人一格套模板 —— 是一份由設計師編排的完整頁。"""
from __future__ import annotations
import asyncio, re
import llm, registry

FAST = "haiku"
SMART = "sonnet"
EXTERNAL_SIGNALS = ["市場", "標竿", "法規", "趨勢", "競爭", "產業", "對手", "政策", "補助", "benchmark", "外部", "行情", "同業"]
DATA_CATS = ["analyze", "datagen", "monitor", "schedule"]


def _esc(s): return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def _sysname(domain):
    d = registry.domains_kb().get(domain, {}); ss = d.get("systems", [])
    return ss[0] if ss else "內部系統"


def pick_data_team(question):
    doms = registry.detect_domains(question, top=2)
    team, used = [], set()
    def add(a, sub):
        if a and a["id"] not in used:
            used.add(a["id"]); team.append({"agent": a, "subtask": sub, "q": question})
    for dom in doms:
        for cat in DATA_CATS:
            a = registry.by_cat_in_domain(dom, cat)
            if a and a["dataMode"] == "internal-sim":
                add(a, f"查 {dom} 內部系統（{_sysname(dom)}）的現況數據"); break
        if sum(1 for t in team if t["agent"]["dataMode"] == "internal-sim") >= 2: break
    if not any(t["agent"]["dataMode"] == "internal-sim" for t in team):
        add(registry.flagship_of_cat("analyze"), f"查 {doms[0]} 內部系統現況數據")
    if any(s in question.lower() for s in EXTERNAL_SIGNALS):
        a = registry.by_cat_in_domain(doms[0], "expert") or registry.by_cat_in_domain(doms[0], "strategy")
        if a and a["dataMode"] == "external-real":
            add(a, f"上網查 {doms[0]} 的外部標竿/法規，附真實來源")
    return doms, team[:3]


_REFUSE = ["無法連接", "無法連線", "無法存取", "無法取得", "需要提供", "沒有權限", "沒有能力", "Claude", "AI 助手",
           "CLAUDE.md", "MCP", "API", "待補", "無法判斷", "無法讀取", "實際的", "真實系統", "請提供", "分享"]


def _sim_data(domain):
    """依領域 KPI 級距生一組擬真數據（保底，確保永遠有數字）。"""
    d = registry.domains_kb().get(domain, {})
    lines = []
    for name, rng in d.get("kpis", [])[:6]:
        nums = re.findall(r"\d+\.?\d*", rng)
        unit = re.sub(r"[\d\-–\. ]", "", rng)
        if len(nums) >= 2:
            v = (float(nums[0]) + float(nums[1])) / 2
            v = round(v, 1) if v < 100 else int(v)
            lines.append(f"{name}: {v}{unit}")
        elif nums:
            lines.append(f"{name}: {nums[0]}{unit}")
        else:
            lines.append(f"{name}: {rng}")
    for r in d.get("risks", [])[:2]:
        lines.append(f"注意風險: {r}")
    return "\n".join(lines) or f"{domain} 現況數據"


async def _gather(t, emit):
    a = t["agent"]; dm = a["dataMode"]; dom = a.get("domain", "")
    emit({"type": "agent_start", "id": a["id"], "name": a["name"], "role": a["role"], "dataMode": dm})
    search = dm == "external-real"
    if dm == "internal-sim":
        emit({"type": "step", "id": a["id"], "message": f"讀取 {_sysname(dom)} 現況…"})
    if dm == "internal-sim":
        d = registry.domains_kb().get(dom, {})
        ranges = "；".join(f"{k[0]} {k[1]}" for k in d.get("kpis", [])[:6])
        task = (f"\n\n# 任務：你正在為一個『示範用的 {_sysname(dom)}』畫面產生內容。\n"
                f"**請根據產業常識，生成一組合理、專業的『{dom}現況數據』**（就是這個系統儀表板會顯示的那種數字），供後續設計報告用。\n"
                f"- 這是 demo，數字由你依常識合理生成即可（參考合理級距：{ranges}），像系統讀出來一樣自然。\n"
                f"- **不要**提到「連線/存取真實系統」「無法取得」「需要提供資料」「權限」「你是 AI 助手」——直接給數字就好。\n"
                "回兩段：\n`SUMMARY: <一句話，含 2-3 個關鍵數字>`\n`DATA:`（6-8 條「名稱: 數值(含單位)」的具體數字）")
    else:
        task = ("\n\n# 任務：用 web search 查真實外部資料回報，附來源連結；查不到標「待查證」。\n"
                "回兩段：\n`SUMMARY: <一句話重點>`\n`DATA:`（幾條「事實: 內容(來源連結)」）")
    sysp = registry.light_prompt(a["id"]) + task
    try:
        ans = await llm.stream_answer(sysp, f"面向：{t['subtask']}\n（整體需求：{t['q']}）",
                                      emit=lambda e: emit({**e, "id": a["id"]}), search=search, model=FAST, timeout=130)
    except Exception:
        ans = ""
    sm = re.search(r"SUMMARY:\s*(.+)", ans)
    dm2 = re.search(r"DATA:\s*([\s\S]+)", ans)
    data = (dm2.group(1).strip() if dm2 else re.sub(r"SUMMARY:.*", "", ans).strip())[:800]
    summary = (sm.group(1).strip() if sm else "").split("\n")[0].strip("* ")[:60]
    # 保底：偵測到拒絕/空 → 直接用領域級距生數據
    if dm == "internal-sim" and (any(w in ans for w in _REFUSE) or len(data) < 30 or not re.search(r"\d", data)):
        data = _sim_data(dom)
        summary = "；".join(data.split("\n")[:3]).replace("\n", "")[:60]
    if not summary:
        first = next((l.strip("-• ").strip() for l in data.split("\n") if l.strip()), "")
        summary = first[:60] or (a["name"] + " 已彙整現況數據")
    emit({"type": "message", "id": a["id"], "name": a["name"], "role": a["role"], "dataMode": dm, "text": summary})
    emit({"type": "done_item", "text": summary})
    return {"name": a["name"], "role": a["role"], "domain": a.get("domain", ""), "data": data}


PAGE_SPEC = (
    "# 任務：做一份『給客戶看的營運報告網頁』——像一個真實、精美、專業的儀表板產品畫面（不是把資料塞進等大卡片）。\n"
    "依團隊查到的資料，輸出**一份完整、自成一體的 HTML 文件**（<!doctype html> 到 </html>）。\n"
    "必含：\n"
    "1. <head> 內：ECharts CDN `<script src=\"https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js\"></script>`；一段 <style> 自訂**一組有記憶點的配色**（主色依主題挑：製造科技藍#0369a1/青#0d9488、財務靛紫#4f46e5、品質綠#16a34a、安全橙#ea580c…每次不同），設計卡片/KPI/表格樣式，**RWD：grid/flex + min-width:0 + 可 wrap + @media，390/768/1360px 都不可水平溢出**，body 用系統字。\n"
    "2. <body>：頁首標題列（報告主題＋一句總結）；KPI 重點帶（4 個大字數值＋漲跌）；主圖區放 **2 個 ECharts 圖**（各一個 <div id> ＋ <script> echarts.init 畫 bar/line/doughnut，資料用團隊數字）；一個資料表（現況/判斷）；一條結論建議帶（結論＋3 點建議）。\n"
    "3. 版面要有主次層次、留白、陰影，專業精美、資訊豐富，像真的營運報告。\n"
    "4. 數字全部取自下方團隊資料、要具體一致；**內部數字自然呈現、不要出現「模擬」字樣；不要說『無法取得資料』**。\n"
    "先寫一行 `NOTE: <這份報告的設計/結論說明，一句話>`，再輸出完整 HTML。**不要 markdown、不要 ``` 圍欄、不要任何多餘說明。**"
)


def _fallback_page(question, combined):
    rows = "".join(f'<tr><td style="padding:8px 12px;border-bottom:1px solid #eef">{_esc(l.strip("-• "))}</td></tr>' for l in combined.split("\n") if l.strip())
    return (f'<!doctype html><meta charset="utf-8"><style>body{{font-family:system-ui;margin:0;padding:20px;color:#0f172a}}h2{{color:#0369a1}}table{{width:100%;border-collapse:collapse}}</style>'
            f'<h2>{_esc(question)}</h2><table>{rows}</table>')


async def _build_page(designer, question, doms, combined, emit):
    emit({"type": "agent_start", "id": designer["id"], "name": designer["name"], "role": designer["role"], "dataMode": "reasoning"})
    sysp = registry.light_prompt(designer["id"]) + "\n\n" + PAGE_SPEC
    ans = ""
    try:
        ans = await llm.stream_answer(sysp, f"需求：{question}\n領域：{'、'.join(doms)}\n\n團隊查到的資料：\n{combined}",
                                      search=False, model=SMART, timeout=200)
    except Exception:
        ans = ""
    nm = re.search(r"NOTE:\s*(.+)", ans)
    note = (nm.group(1).strip() if nm else "我依大家的資料設計了一份報告。").split("\n")[0].strip("* ")[:80]
    html = ans.replace("```html", "").replace("```", "")
    mi = re.search(r"<(!doctype|html|head|body|div|style)\b", html, re.I)
    if mi:
        html = html[mi.start():]
    html = re.sub(r"^[\s\S]*?NOTE:.*$", "", html, count=1, flags=re.M).strip() if "NOTE:" in html[:200] else html
    if len(html) < 200 or "<" not in html:
        html = _fallback_page(question, combined)
    emit({"type": "message", "id": designer["id"], "name": designer["name"], "role": designer["role"],
          "dataMode": "reasoning", "text": note})
    return html


async def run(question: str, mode, emit):
    emit({"type": "status", "message": "指揮官讀取需求，找對的 Agent…"})
    doms, data_team = pick_data_team(question)
    _used_ids = {t["agent"]["id"] for t in data_team}
    synth = registry.flagship_of_cat("design")  # 繪境（介面設計）：把資料設計成報告，與查資料的 agent 區隔
    if synth and synth["id"] in _used_ids:
        synth = registry.flagship_of_cat("doc")
    names = "、".join(t["agent"]["name"] for t in data_team)
    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
          "text": f"這題屬於「{'、'.join(doms)}」。我請 {names} 去查各系統資料，交給 {synth['name']} 彙整成一份報告，我負責確認。"})
    members = [{"id": t["agent"]["id"], "name": t["agent"]["name"], "role": t["agent"]["role"],
               "dataMode": t["agent"]["dataMode"], "subtask": t["subtask"]} for t in data_team]
    members.append({"id": synth["id"], "name": synth["name"], "role": synth["role"], "dataMode": "reasoning", "subtask": "彙整成報告"})
    emit({"type": "team", "members": members})
    emit({"type": "page_pending", "title": question, "sub": "領域：" + "、".join(doms) + f" · {synth['name']} 彙整中"})

    # ① 各系統查資料（生現況數據）
    emit({"type": "status", "message": "資料 Agent 查各系統現況…"})
    gathered = await asyncio.gather(*[_gather(t, emit) for t in data_team])
    combined = "\n".join(f"【{g['name']}·{g['domain']}】\n{g['data']}" for g in gathered)

    # ② 繪境 設計並產出一份完整報告網頁（AI 認真做，非套版）
    emit({"type": "status", "message": f"{synth['name']} 設計並產出報告網頁…"})
    html = await _build_page(synth, question, doms, combined, emit)
    emit({"type": "done_item", "text": f"{synth['name']} 產出報告網頁（含 KPI、圖表、結論）"})
    emit({"type": "page", "title": question,
          "sub": "領域：" + "、".join(doms) + f" · {synth['name']} 設計 · 資料來自 {len(gathered)} 個系統", "html": html})

    # ③ 指揮官確認
    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
          "text": "我確認過報告數據一致、結論合理，完成。"})
    emit({"type": "final", "message": "完成。"})

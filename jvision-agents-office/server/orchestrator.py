"""真協作管線（角色分工）：
① 指揮官(智策) 找對的 agent + 確認（不自己做）
② 資料 agent（internal-sim/external-real）只『查資料』回數據
③ 介面設計(繪境) 用資料『設計整頁報告』：自選配色/風格、完整版面、RWD、真圖表（jv-chart 佔位）
④ 指揮官確認
不是一人一格套模板 —— 是一份由設計師編排的完整頁。"""
from __future__ import annotations
import asyncio, re
import llm, registry, systems

FAST = "haiku"
SMART = "sonnet"
EXTERNAL_SIGNALS = ["市場", "標竿", "法規", "趨勢", "競爭", "產業", "對手", "政策", "補助", "benchmark", "外部", "行情", "同業",
                    "網路", "上網", "搜尋", "查詢網", "新聞", "最新", "google", "國際", "全球", "報導", "消息", "現況趨勢", "研究"]
DATA_CATS = ["analyze", "datagen", "monitor", "schedule"]

# 明確的寒暄/自我介紹類問句:直接走聊天分支,不開產線也不用 LLM 判斷
_SMALLTALK_RE = re.compile(
    r"^(你好|您好|哈囉|嗨+|hi|hello|hey|早安|午安|晚安|在嗎|你是誰|你叫什麼|"
    r"你會什麼|你能做什麼|你可以幫我做什麼|可以幫我做什麼|你能幹嘛|謝謝|感謝|辛苦了)"
    r"[!！?？。~\s]*$", re.I)
_HELP_RE = re.compile(r"幫助|幫我什麼|協助|功能|怎麼用|如何使用|使用方式|介紹一下|自我介紹")
_ASK_RE = re.compile(r"什麼|啥|嗎|如何|怎麼")
_TASK_HINT_RE = re.compile(
    r"報告|儀表|摘要|分析|彙整|查|現況|狀況|數據|資料|趨勢|比較|列出|統計|操作|標記|改成|設為|更新為|kpi", re.I)


def _is_smalltalk(question):
    qs = question.strip()
    if _SMALLTALK_RE.match(qs):
        return True
    # 「你能幫助我什麼」這類求助/功能詢問:有求助詞+疑問詞、短、無任務訊號
    if len(qs) <= 16 and _HELP_RE.search(qs) and _ASK_RE.search(qs) and not _TASK_HINT_RE.search(qs):
        return True
    # 短句、無任務訊號、站上也配不到任何系統 → 口語回覆(必要時反問釐清),
    # 比硬掰一份不相干領域的報告好
    if len(qs) <= 14 and not _TASK_HINT_RE.search(qs) and not systems.pick_systems(qs, top=1):
        return True
    return False


try:
    import opencc as _opencc
    _S2T = _opencc.OpenCC("s2twp")  # 簡體 → 繁體（台灣正體＋慣用詞）
    def _zh(s):
        try: return _S2T.convert(s) if s else s
        except Exception: return s
except Exception:
    def _zh(s): return s


def _esc(s): return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def _clean_line(s):
    s = (s or "").split("\n")[0]
    s = re.sub(r"^\**\s*(SUMMARY|NOTE)\s*[:：]\s*", "", s, flags=re.I)
    s = re.sub(r"[*`#]+", "", s)
    return s.strip()[:72]
def _sysname(domain):
    d = registry.domains_kb().get(domain, {}); ss = d.get("systems", [])
    return ss[0] if ss else "內部系統"


import json as _json
def _extract_json(text):
    text = (text or "").replace("```json", "").replace("```", "")
    depth = 0; start = -1
    for i, ch in enumerate(text):
        if ch == "{":
            if depth == 0: start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start >= 0:
                try: return _json.loads(text[start:i+1])
                except Exception: pass
    return None


async def plan(question):
    """指揮官(sonnet)智能判斷：領域、要不要內部資料、要不要上網查外部。"""
    doms_list = "、".join(registry.domains_kb().keys())
    sysp = ("你是 AI 團隊總指揮。判斷這個需求要找哪些資料、以及要用哪種呈現。全程繁體中文（台灣正體）。\n"
            f"企業功能領域（擇 1-2 個最相關）：{doms_list}。\n"
            "先判斷 kind（最重要）：純聊天/打招呼/問你是誰或你會什麼/與數據無關的簡短對話→\"chat\"；"
            "要查數據、看現況、做報告或儀表板→\"task\"。例:「你好」→chat;「最近怎樣」→chat;「摘要 CRM 商機現況」→task。\n"
            "接著判斷三個項目：\n"
            "- internal（要不要查公司內部系統數據）：問公司內部現況/營運數據/系統狀態→true；純粹問外部市場/新聞/推薦/趨勢、跟公司內部無關→false。\n"
            "- external（要不要上網查外部公開資料）：問市場/趨勢/新聞/網路/競品/標竿/最新/推薦→true；只問內部現況→false。\n"
            "- output（呈現方式）：\"html\"=做成一頁精美的視覺化報告網頁（有版面/圖表/儀表板）；\"text\"=一份圖文並茂的文字報告（Markdown、重點標色、內嵌圖表）。\n"
            "  規則：需求有提到『做成報告/產生報告/儀表板/視覺化/簡報/網頁/dashboard』等 → \"html\"；\n"
            "  明顯只是想『快速了解/簡短說明/摘要/口語問一個數字/給我建議』→ \"text\"；不確定時預設 \"html\"（示範時 html 較有感）。\n"
            "若需求跟企業營運無關（如美食、旅遊、生活推薦），選最接近領域（美食→零售電商）、internal=false、external=true。\n"
            "只輸出 JSON：{\"kind\":\"chat\"或\"task\",\"domains\":[\"領域1\"],\"internal\":true/false,\"external\":true/false,\"external_query\":\"要上網查什麼\",\"output\":\"html\"或\"text\"}")
    try:
        # 規劃只是分類判斷(領域/內外部/呈現方式),用快模型省掉開頭十幾秒;解析失敗有預設值兜底
        ans = await llm.stream_answer(sysp, f"需求：{question}", search=False, model=FAST, timeout=30)
    except llm.LLMBusy:
        raise
    except Exception:
        ans = ""
    data = _extract_json(ans) or {}
    kb = set(registry.domains_kb().keys())
    doms = [d for d in (data.get("domains") or []) if d in kb][:2] or registry.detect_domains(question, top=2)
    internal = data.get("internal", True) is not False
    external = bool(data.get("external"))
    if not internal and not external:  # 至少要有一種資料來源
        internal = True
    exq = (data.get("external_query") or question)[:40]
    output = "text" if str(data.get("output", "")).lower() == "text" else "html"
    kind = "chat" if str(data.get("kind", "")).lower() == "chat" else "task"
    return doms, internal, external, exq, output, kind


def pick_data_team(question, doms, internal, external, exq):
    team, used = [], set()
    def add(a, sub):
        if a and a["id"] not in used:
            used.add(a["id"]); team.append({"agent": a, "subtask": sub, "q": question})
    if internal:
        for dom in doms:
            for cat in DATA_CATS:
                a = registry.by_cat_in_domain(dom, cat)
                if a and a["dataMode"] == "internal-sim":
                    add(a, f"查 {dom} 內部系統（{_sysname(dom)}）的現況數據"); break
            if sum(1 for t in team if t["agent"]["dataMode"] == "internal-sim") >= 2: break
        if not any(t["agent"]["dataMode"] == "internal-sim" for t in team):
            add(registry.flagship_of_cat("analyze"), f"查 {doms[0]} 內部系統現況數據")
    if external:
        a = (registry.by_cat_in_domain(doms[0], "expert") or registry.by_cat_in_domain(doms[0], "strategy")
             or registry.flagship_of_cat("expert"))
        if a and a["dataMode"] == "external-real":
            add(a, f"上網查『{exq}』的最新資料/趨勢/推薦/標竿，附真實來源連結")
    if not team:  # 保底一定有人
        add(registry.flagship_of_cat("analyze"), f"查 {doms[0]} 現況數據")
    return team[:3]


_REFUSE = ["無法連接", "無法連線", "無法存取", "無法取得", "需要提供", "沒有權限", "沒有能力", "Claude", "AI 助手",
           "CLAUDE.md", "MCP", "API", "待補", "無法判斷", "無法讀取", "實際的", "真實系統", "請提供", "分享",
           "澄清", "超出", "角色範圍", "我的角色", "無法完成", "你好", "我注意到", "兩部分", "幾種解讀",
           "優先順序", "不是我的專長", "找錯", "不太相關", "請問", "請告訴我", "您好", "抱歉"]
# 繪境（設計師）輸出若含這些 → 視為沒認真設計、echo/反問，改用結構化保底頁
_PAGE_BAD = ["澄清", "超出", "我的角色", "無法完成", "我注意到", "兩部分", "需要更多", "請告訴我", "請提供", "抱歉", "無法取得"]


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
                "- **不要打招呼、不要反問、不要說『需要澄清/超出角色/兩部分/找錯人』。** 全程繁體中文（台灣正體）。\n"
                "- 你的任務就是給數字，沒有做不到的問題，直接開始寫 SUMMARY。\n"
                "回兩段：\n`SUMMARY: <一句話，含 2-3 個關鍵數字>`\n`DATA:`（6-8 條「名稱: 數值(含單位)」的具體數字）")
    else:
        task = ("\n\n# 任務：直接針對下面這個主題『上網查最新的真實公開資料』並回報。\n"
                "**不要管你的人設是什麼領域、不要反問、不要打招呼、不要說『超出專長/需要澄清/找錯人』——就去查、附來源連結。** 查不到的標「待查證」。\n"
                "- **全程繁體中文（台灣正體）；查到的內容若是簡體字，務必改寫成繁體中文再輸出。**\n"
                "回兩段：\n`SUMMARY: <一句話重點>`\n`DATA:`（幾條「事實: 內容(來源連結 http)」）")
    sysp = registry.light_prompt(a["id"]) + task
    searches = []
    def _e(ev):
        if ev.get("type") == "step" and "搜尋" in (ev.get("message") or ""):
            q = ev["message"].split("：", 1)[-1].strip()
            if q and q not in searches:
                searches.append(q)
        emit({**ev, "id": a["id"]})
    try:
        ans = await llm.stream_answer(sysp, f"面向：{t['subtask']}\n（整體需求：{t['q']}）",
                                      emit=_e, search=search, model=FAST, timeout=130)
    except llm.LLMBusy:
        raise
    except Exception:
        ans = ""
    sm = re.search(r"SUMMARY\s*[:：]\s*(.+)", ans)
    dm2 = re.search(r"DATA\s*[:：]\s*([\s\S]+)", ans)
    data = (dm2.group(1).strip() if dm2 else re.sub(r"[\s\S]*SUMMARY.*", "", ans).strip())[:800]
    summary = _clean_line(sm.group(1) if sm else "")
    # 保底：偵測到拒絕/空 → 直接用領域級距生數據
    if dm == "internal-sim" and (any(w in ans for w in _REFUSE) or len(data) < 30 or not re.search(r"\d", data)):
        data = _sim_data(dom)
        summary = "；".join(data.split("\n")[:3]).replace("\n", "")[:60]
    if not summary:
        first = next((l.strip("-• ").strip() for l in data.split("\n") if l.strip()), "")
        summary = first[:60] or (a["name"] + " 已彙整現況數據")
    data = _zh(data); summary = _zh(summary)  # 繁體安全網（web 搜尋可能吐簡體）
    if search and searches:  # 外部真查：對話列出查了什麼
        searches = [_zh(s) for s in searches]
        summary = summary + f"（上網查了：{'、'.join(searches[:3])}）"
        emit({"type": "done_item", "text": "上網查了：" + "、".join(searches[:4])})
    emit({"type": "message", "id": a["id"], "name": a["name"], "role": a["role"], "dataMode": dm, "text": summary})
    emit({"type": "done_item", "text": summary})
    return {"name": a["name"], "role": a["role"], "domain": a.get("domain", ""), "data": data, "external": search}


async def _gather_system(hit, emit):
    """系統代理(Phase 2):讀取站上系統「抽取自實際畫面」的數據。
    純檔案查詢、零 LLM——查詢本身不該燒算力,也保證數字與畫面一致。"""
    _score, s = hit
    repo = s["name"]; title = s.get("displayName") or repo
    aid = f"sys:{repo}"
    emit({"type": "agent_start", "id": aid, "name": title, "role": "系統代理", "dataMode": "system-live"})
    emit({"type": "step", "id": aid, "message": f"開啟《{title}》讀取各畫面數據…"})
    d = systems.data(repo) or {}
    block = systems.data_block(repo)
    # 導覽腳本:前端(頭像/任務頁)拿去「實際打開這套系統、切畫面、逐項框出正在讀的數字」
    # ——WebMCP 的展演面。步驟取自抽取資料,演的就是真的讀了什麼。
    tour_steps = []
    for sc in d.get("screens", []):
        items = [{"term": k["label"], "text": f"{k['label']}:{k['value']}"} for k in sc.get("kpis", [])[:3]]
        items += [{"term": t["title"], "text": f"明細表「{t['title']}」{len(t.get('rows', []))} 筆"}
                  for t in sc.get("tables", [])[:2] if t.get("title")]
        if items:
            tour_steps.append({"screen": sc.get("index", 0),
                               "title": (sc.get("stage") or {}).get("title") or sc.get("heading") or "",
                               "items": items[:4]})
    if tour_steps:
        emit({"type": "sys_tour", "id": aid, "repo": repo, "title": title,
              "url": f"/demos/{repo}/", "steps": tour_steps[:6]})
    sm = d.get("summary", {})
    kp = [k for sc in d.get("screens", []) for k in sc.get("kpis", [])][:2]
    summary = f"《{title}》讀到 {sm.get('kpis', 0)} 項 KPI、{sm.get('tables', 0)} 張明細表、{sm.get('charts', 0)} 張圖表"
    if kp:
        summary += ";如 " + "、".join(f"{k['label']} {k['value']}" for k in kp)
    emit({"type": "message", "id": aid, "name": title, "role": "系統代理", "dataMode": "system-live", "text": summary})
    emit({"type": "done_item", "text": summary})
    return {"name": title, "role": "系統代理", "domain": s.get("category", ""), "data": block, "external": False, "repo": repo}


PAGE_SPEC = (
    "# 任務：做一份『給客戶看的營運報告網頁』——精美、專業、資訊豐富，像真實產品的儀表板畫面。\n"
    "依團隊查到的資料，輸出**一份完整、自成一體的 HTML 文件**（<!doctype html> 到 </html>）。\n"
    "## 硬性要求\n"
    "- <head> 放 ECharts CDN `<script src=\"https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js\"></script>` 與一段 <style>。\n"
    "- **RWD**：grid/flex 子項加 min-width:0、可 wrap、含 @media；390/768/1360px 都不可水平溢出；圖表容器 width:100%,且**一律以行內 style 給定 height(如 style=\"height:300px\")、初始保持空容器**(載入提示由系統自動顯示)。\n"
    "- 數字全部取自下方團隊資料、具體一致；**內部數字自然呈現、不要出現「模擬」；不要說『無法取得資料』**。全程繁體中文（台灣用語）。\n"
    "- **若團隊資料含外部來源連結（http…），報告底部必附一個『資料來源』區塊，用可點的 <a href target=_blank> 列出這些真實連結。**\n"
    "- **若團隊資料行內含「(來源 /demos/…#go=n …)」標記，代表數字讀自站上實際系統畫面：報告底部必附『資料來源』區塊，"
    "每筆用 <a href=\"/demos/…#go=n\" target=\"_blank\">系統名·畫面名</a> 可點連結列出；引用的數字必須與來源資料完全一致，不可改寫或另編。**\n"
    "## 要豐富、每次都要不一樣（重點！）\n"
    "- **版面不要每次都長一樣**：從這些版型擇一或混搭，依主題選最合適的 —— 儀表板網格 / 左欄指標+右側主圖 / 上方 KPI 帶+下方雙欄 / 卡片瀑布 / 雜誌式分欄 / 左側敘事+右側數據。\n"
    "- **配色每次不同**：依主題挑一組有記憶點的色系（製造科技藍/青、財務靛紫、品質綠、安全橙、能源黃綠、人資粉紫…），可用漸層 header。\n"
    "- **圖表要多元**（2 個不同種即可,最多 3 個——張數多不如張張到位）：ECharts 支援 bar / line / pie/doughnut / **radar 雷達** / **gauge 儀表** / scatter / funnel 漏斗 / **stacked bar 堆疊** / **heatmap** / 折線面積圖，依資料選最貼切的。\n"
    "- **多元元件**：KPI 大字帶（含漲跌徽章）、進度條、狀態徽章（達標/警示）、時間軸、排名榜、比較表、警示框、迷你統計卡、圓環進度… **挑 3~4 種就好,精不在多**。\n"
    "- 版面要有主次層次、留白、陰影、圓角，專業精美；資訊密度優先、少而精。\n"
    "## 速度紀律(重要:客戶正在畫面前等這份報告即時長出來)\n"
    "- **整份 HTML 目標 8,000 字元內(硬上限 12,000)**:CSS 精簡(只寫會用到的樣式、善用共用 class)、不重複樣板、不寫註解。\n"
    "- 寫得快比寫得多重要:同樣的資訊,選更精煉的排版表達。\n"
    "## 絕對規則\n"
    "- **無論團隊資料多寡，你一定要產出結構化的設計頁**（含 KPI 大字帶、至少 2 個圖表、表格、結論帶）。\n"
    "- **絕對不要只輸出純文字段落、不要反問使用者、不要說『需要澄清/需要更多資訊』**。資料不足就用手上的數字合理呈現。\n"
    "先寫一行 `NOTE: <這份報告的設計重點/結論，一句話>`，再輸出完整 HTML。**不要 markdown、不要 ``` 圍欄、不要多餘說明。**\n"
    "**輸出 `</html>` 後就立刻停止，絕對不要再加任何文字**（不要「補充說明」「結論速覽」「另存為 .html」「檔案寫入工具」等旁白，也不要 ** 粗體符號）。"
)


def _parse_kpis(combined):
    """從 combined 抓「名稱: 數值(單位)」配對，回 [(label, num, unit, raw)]。"""
    out = []
    for l in combined.split("\n"):
        l = l.strip("-•*# ").strip()
        m = re.match(r"^([^:：]{2,20})[:：]\s*([-+]?\d[\d,\.]*)\s*([%A-Za-z一-鿿/]{0,6})", l)
        if m and "【" not in l:
            label = m.group(1).strip()
            if any(k in label for k in ("http", "來源", "連結", "事實", "注意風險")):
                continue
            try:
                num = float(m.group(2).replace(",", ""))
            except Exception:
                continue
            out.append((label, num, m.group(3).strip(), l))
    return out[:8]


def _fallback_page(question, combined):
    """結構化保底頁（KPI 大字帶 + ECharts 長條 + 明細表），永遠不是純文字。"""
    kpis = _parse_kpis(combined)
    acc = "#0369a1"
    cards = "".join(
        f'<div class="c"><div class="cl">{_esc(k[0])}</div><div class="cv">{_esc(str(int(k[1]) if k[1]==int(k[1]) else k[1]))}<span>{_esc(k[2])}</span></div></div>'
        for k in kpis) or f'<div class="c"><div class="cl">項目</div><div class="cv">—</div></div>'
    labels = _json.dumps([k[0] for k in kpis], ensure_ascii=False)
    values = _json.dumps([k[1] for k in kpis])
    rows = "".join(
        f'<tr><td>{_esc(l.strip("-•* "))}</td></tr>'
        for l in combined.split("\n") if l.strip() and "【" not in l and not l.strip().startswith("SUMMARY"))
    chart = ("" if not kpis else
             f'<div class="card"><h3>指標概覽</h3><div id="ch" style="height:320px"></div></div>'
             '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>'
             '<script>var c=echarts.init(document.getElementById("ch"));c.setOption({grid:{left:60,right:20,top:20,bottom:60},'
             f'xAxis:{{type:"category",data:{labels},axisLabel:{{interval:0,rotate:20}}}},yAxis:{{type:"value"}},'
             f'series:[{{type:"bar",data:{values},itemStyle:{{color:"{acc}",borderRadius:[6,6,0,0]}},barMaxWidth:46}}]}});'
             'addEventListener("resize",function(){c.resize()});</script>')
    return (f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<style>*{{box-sizing:border-box}}body{{font-family:system-ui,"Noto Sans TC";margin:0;padding:24px;background:#f6f8fb;color:#0f172a}}'
            f'h2{{margin:0 0 4px;color:{acc}}}.sub{{color:#64748b;margin:0 0 20px}}'
            f'.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-bottom:20px}}'
            f'.c{{background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 2px 10px rgba(2,32,71,.06);min-width:0}}'
            f'.cl{{color:#64748b;font-size:13px;margin-bottom:6px}}.cv{{font-size:26px;font-weight:800;color:{acc}}}.cv span{{font-size:14px;margin-left:2px;color:#94a3b8}}'
            f'.card{{background:#fff;border-radius:14px;padding:18px 20px;box-shadow:0 2px 10px rgba(2,32,71,.06);margin-bottom:20px}}'
            f'.card h3{{margin:0 0 12px;font-size:16px}}table{{width:100%;border-collapse:collapse}}td{{padding:9px 12px;border-bottom:1px solid #eef2f7;font-size:14px}}</style>'
            f'<h2>{_esc(question)}</h2><p class="sub">AI 團隊彙整報告</p>'
            f'<div class="kpis">{cards}</div>{chart}'
            f'<div class="card"><h3>資料明細</h3><table>{rows}</table></div></html>')


async def _build_page(designer, question, doms, combined, emit):
    emit({"type": "agent_start", "id": designer["id"], "name": designer["name"], "role": designer["role"], "dataMode": "reasoning"})
    sysp = registry.light_prompt(designer["id"]) + "\n\n" + PAGE_SPEC
    ans = ""
    # 逐字串流：繪境一邊寫 HTML，一邊把片段吐到前端（pencils.dev 式即時渲染）
    buf = {"s": "", "started": False, "full": ""}
    def _on_delta(piece):
        buf["full"] += piece  # 全量累積：逾時被砍時可救回半成品，不丟掉真實作品
        buf["s"] += piece
        if not buf["started"]:
            mi = re.search(r"<(!doctype|html|head|body|div|style)", buf["s"], re.I)
            if mi is None:
                return  # 還在寫 NOTE 前言，先不吐
            buf["started"] = True
            buf["s"] = buf["s"][mi.start():]
        if len(buf["s"]) >= 200:
            emit({"type": "page_delta", "chunk": buf["s"]})
            buf["s"] = ""
    try:
        ans = await llm.stream_answer(sysp, f"需求：{question}\n領域：{'、'.join(doms)}\n\n團隊查到的資料：\n{combined}",
                                      search=False, model=SMART, timeout=280, on_delta=_on_delta)
    except llm.LLMBusy:
        raise
    except Exception:
        ans = ""
    if buf["started"] and buf["s"]:
        emit({"type": "page_delta", "chunk": buf["s"]})
    if not ans.strip() and buf["full"].strip():  # 逾時/中斷 → 用已串流的半成品，不要退回純文字 dump
        ans = buf["full"]
    nm = re.search(r"NOTE:\s*(.+)", ans)
    note = _clean_line(nm.group(1) if nm else "") or "我依大家的資料設計了一份報告。"
    html = ans.replace("```html", "").replace("```", "")
    mi = re.search(r"<(!doctype|html|head|body|div|style)\b", html, re.I)
    if mi:
        html = html[mi.start():]
    html = re.sub(r"^[\s\S]*?NOTE:.*$", "", html, count=1, flags=re.M).strip() if "NOTE:" in html[:200] else html
    # 砍掉 </html> 之後 AI 的閒聊/markdown 補充（「--- 補充說明…**結論速覽**…另存為 .html」等）
    em = list(re.finditer(r"</html\s*>", html, re.I))
    if em:
        html = html[:em[-1].end()]
    else:
        eb = list(re.finditer(r"</body\s*>", html, re.I))
        if eb:
            html = html[:eb[-1].end()]
    # 判定繪境是否真的做出設計頁；否則（反問/echo/太短/沒圖表結構）→ 結構化保底頁，絕不吐純文字
    head = html[:600]
    bad = (len(html) < 800 or "<" not in html or html.count("<div") < 2
           or any(w in head for w in _PAGE_BAD) or "【" in head)
    if bad:
        html = _fallback_page(question, combined)
        note = "我把大家查到的數據整理成一份結構化報告頁。"
    elif "</html>" not in html.lower():  # 半成品（逾時被砍）→ 補上收尾標籤讓它能正常呈現
        html = html.rstrip() + "\n</body></html>"
        note = note + "（已依現有進度呈現）"
    html = _zh(html); note = _zh(note)  # 繁體安全網
    emit({"type": "message", "id": designer["id"], "name": designer["name"], "role": designer["role"],
          "dataMode": "reasoning", "text": note})
    return html


TEXT_SPEC = (
    "# 任務：把團隊查到的資料，寫成一份『圖文並茂的文字報告』（給客戶看、專業有洞見）。\n"
    "輸出**繁體中文 Markdown**，約 450–700 字(精煉優先,不要灌水)，**不要**用 HTML、不要 ``` 圍住整篇。\n"
    "## 結構（用 ## 小標）\n"
    "- 直接從 `## 結論` 開始（不要把使用者的問題原句當標題重複）。\n"
    "- 接著針對重點面向逐一分析（每個當一個 ## 小標），每段要有具體數字與判斷。\n"
    "- 若有外部真實來源連結，文末用 `## 參考資料` 列出（Markdown 連結 `[標題](http…)`）。\n"
    "- 若團隊資料行內含「(來源 /demos/…#go=n …)」標記（數字讀自站上實際系統畫面）：文末加 `## 資料來源`，"
    "以 `[系統·畫面](/demos/…#go=n)` 逐條列出；引用數字必須與來源完全一致，不可改寫或另編。\n"
    "## 視覺化（必須，至少 2–3 個『不同類型』的圖，實際輸出圍欄，不可只用文字，JSON 一定要合法可解析）\n"
    "**請依資料性質挑最貼切、且盡量多元的圖種（不要都用長條），可從下列三種圍欄挑選：**\n"
    "一、```chart（基本圖，單行合法 JSON，title 必填）：\n"
    "  bar 類別比較 {\"type\":\"bar\",\"title\":\"標題\",\"data\":[{\"name\":\"A\",\"value\":10}]}；line 趨勢同結構；pie 佔比(≤6項)同結構；"
    "radar 多維評分 {\"type\":\"radar\",\"title\":\"標題\",\"axes\":[\"成本\",\"品質\",\"速度\"],\"series\":[{\"name\":\"現況\",\"values\":[8,6,7]}]}。\n"
    "二、```echart（進階 ECharts option JSON，直接給完整 option）：\n"
    "  gauge 儀表 {\"series\":[{\"type\":\"gauge\",\"data\":[{\"value\":78}]}]}；funnel 漏斗；treemap 階層佔比；heatmap 熱力；scatter 散點；"
    "  sankey 流向/流程 {\"series\":[{\"type\":\"sankey\",\"data\":[{\"name\":\"進料\"},{\"name\":\"加工\"},{\"name\":\"出貨\"}],\"links\":[{\"source\":\"進料\",\"target\":\"加工\",\"value\":10},{\"source\":\"加工\",\"target\":\"出貨\",\"value\":8}]}]}；"
    "  graph 關係網/節點路徑（像路線圖）{\"series\":[{\"type\":\"graph\",\"layout\":\"force\",\"data\":[{\"name\":\"A\"},{\"name\":\"B\"}],\"links\":[{\"source\":\"A\",\"target\":\"B\"}]}]}。\n"
    "  地圖（僅在題目跟地理/區域/分布有關時用）：{\"geo\":{\"map\":\"taiwan\",\"roam\":true},\"series\":[{\"type\":\"scatter\",\"coordinateSystem\":\"geo\",\"data\":[[121.5,25.0,80]]}]}（map 可用 taiwan / world / china）。\n"
    "三、```mermaid（流程圖/心智圖/循序圖，畫關係與結構最好用）：\n"
    "  流程/路徑用 `flowchart LR`（節點文字≤8字）：例 `flowchart LR\\n A[需求]-->B[生產]-->C[出貨]`；\n"
    "  心智圖用 `mindmap`：例 `mindmap\\n root((主題))\\n  面向一\\n   要點\\n  面向二`；也可用 sequenceDiagram。**禁用 gantt/timeline**。\n"
    "- 數字一律取自下方團隊資料，不可捏造；圍欄內只放圖表定義、不要多餘文字。搭配情境挑不同種，讓報告有變化。\n"
    "## 排版（重點：多用條列與表格，不要整頁都是長段落）\n"
    "- **盡量用條列（- ）呈現重點、步驟、建議**；有可比較的多筆資料**一律用 Markdown 表格**（`| 欄 | 欄 |` 加分隔列）。\n"
    "- 每個 ## 段落先一兩句敘述帶出重點，再用條列或表格把細節攤開；避免一大段沒有斷點的文字。\n"
    "## 標記與語言\n"
    "- 只把 3–5 個**短關鍵詞**（每個 2–6 字，如 `==稼動率==`、`==可投產==`）用 `==重點==` 標色，分散在不同段落；**不要**標整句。\n"
    "- 全文**不要**任何 emoji。內部數字自然呈現、不要說『模擬/無法取得』。全程繁體中文（台灣正體）。\n"
    "先寫一行 `NOTE: <這份報告的一句話重點>`，再輸出報告 Markdown 本文。"
)


async def _build_text_report(writer, question, doms, combined, emit):
    """文書 agent（擬稿）產出圖文並茂的 Markdown 報告，逐段串流。"""
    emit({"type": "agent_start", "id": writer["id"], "name": writer["name"], "role": writer["role"], "dataMode": "reasoning"})
    sysp = registry.light_prompt(writer["id"]) + "\n\n" + TEXT_SPEC
    buf = {"s": "", "started": False}
    def _on_delta(piece):
        buf["s"] += piece
        # 跳過開頭 NOTE 行，之後才開始吐報告本文
        if not buf["started"]:
            m = re.search(r"(?:^|\n)\s*##\s", buf["s"])
            if m is None:
                return
            buf["started"] = True
            buf["s"] = buf["s"][m.start():].lstrip("\n")
        if len(buf["s"]) >= 90:
            emit({"type": "report_delta", "chunk": buf["s"]})
            buf["s"] = ""
    ans = ""
    for _attempt in range(2):  # 偶發空回應(逾時/拒答)先重試一次,別急著掉進保底
        try:
            ans = await llm.stream_answer(sysp, f"需求：{question}\n領域：{'、'.join(doms)}\n\n團隊查到的資料：\n{combined}",
                                          search=False, model=SMART, timeout=200, on_delta=_on_delta)
        except llm.LLMBusy:
            raise
        except Exception:
            ans = ""
        if ans.strip() or buf["started"]:
            break
        emit({"type": "status", "message": f"{writer['name']} 重新整理稿件…"})
    if buf["started"] and buf["s"]:
        emit({"type": "report_delta", "chunk": buf["s"]})
    nm = re.search(r"NOTE:\s*(.+)", ans)
    note = _clean_line(nm.group(1) if nm else "") or "我把大家查到的資料寫成一份文字報告。"
    md = re.sub(r"^[\s\S]*?NOTE:.*$", "", ans, count=1, flags=re.M) if "NOTE:" in ans[:200] else ans
    md = md.strip()
    # 去掉可能殘留的整篇 ``` 圍欄
    md = re.sub(r"^```(?:markdown|md)?\s*", "", md).strip()
    if md.endswith("```"):
        md = md[:-3].strip()
    if len(md) < 80 or "##" not in md:  # 保底：至少有結論 + 明細
        # 來源標記從行內拔掉(讀者看到一串 URL 只是雜訊),整理成文末的資料來源連結
        rows, urls = [], []
        for l in combined.split("\n"):
            s = l.strip()
            if not s or s.startswith("【"):
                continue
            m = re.search(r"\(來源 (/demos/[^\s)]+)", s)
            if m:
                u = m.group(1)
                if u not in urls:
                    urls.append(u)
            s = re.sub(r"\(來源 [^)]*\)", "", s).strip("-•* ").strip()
            if s:
                rows.append("- " + s)
        md = "## 結論\n\n依據團隊查到的資料，重點整理如下。\n\n## 重點數據\n\n" + "\n".join(rows)
        if urls:
            links = "\n".join(f"- [{u.split('/')[2]}·畫面{(u.split('#go=')[-1].split('&')[0])}]({u})" for u in urls[:12])
            md += f"\n\n## 資料來源\n\n{links}"
    md = _zh(md); note = _zh(note)
    emit({"type": "message", "id": writer["id"], "name": writer["name"], "role": writer["role"], "dataMode": "reasoning", "text": note})
    return md


# 操作指令:「把/將 <目標> 標記為/改成/填為 <值>」。走零 LLM 的即時路徑——
# 前端(頭像)收到 sys_op 後開舞台,由 demo 內的 bridge 跨畫面找到目標、當場改狀態。
# 展示級寫入:只改畫面、不落地,重新整理即復原(demo 是靜態頁,本來就無資料庫)。
_OP_RE = re.compile(
    r"[把將]\s*(.{1,24}?)\s*(標記為|標記成|標記|改成|改為|設為|設定為|更新為|填為|填成)\s*([^,，。;；]{1,20})")


def _try_operation(question, emit):
    """支援複合指令:一句話裡多個「把 X …為 Y」,逐項定位、按系統分組發派。
    每個目標先查好在哪套系統的第幾個畫面(抽取資料反查),前端直接開在正確畫面。"""
    matches = list(_OP_RE.finditer(question))
    if not matches:
        return False
    hits = systems.pick_systems(question, top=1)
    groups = {}   # repo -> {"info", "steps"}
    missing = []
    for m in matches:
        target = m.group(1).strip(" 「」『』\"'")
        verb = m.group(2)
        value = m.group(3).strip(" 「」『』\"'。")
        if not target or not value:
            continue
        found = systems.find_system_with(target, repo=hits[0][1]["name"]) if hits else None
        if not found:
            found = systems.find_system_with(target)
        if not found and hits:
            found = (hits[0][1], 0)
        if not found:
            missing.append(target)
            continue
        info, screen = found
        g = groups.setdefault(info["name"], {"info": info, "steps": []})
        g["steps"].append({"target": target, "verb": verb, "value": value, "screen": screen})
    if not groups and not missing:
        return False
    if not groups:
        emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
              "text": f"我在站上系統的資料裡找不到「{'、'.join(missing)}」,先確認一下名稱或單號?"})
        emit({"type": "final", "message": "找不到操作目標。"})
        return True
    total = sum(len(g["steps"]) for g in groups.values())
    titles = "、".join(f"《{g['info'].get('displayName') or r}》" for r, g in groups.items())
    emit({"type": "status", "message": "辨識為操作指令,定位目標系統…"})
    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
          "text": f"收到操作指令,共 {total} 項變更。我請系統代理依序開啟 {titles} 逐項執行——展示操作,重新整理即復原。"})
    for repo, g in groups.items():
        title = g["info"].get("displayName") or repo
        emit({"type": "sys_op", "repo": repo, "title": title, "url": f"/demos/{repo}/",
              "steps": g["steps"]})
        emit({"type": "done_item", "text": f"操作:《{title}》" + "、".join(
            f"{s['target']} {s['verb']} {s['value']}" for s in g["steps"])})
    if missing:
        emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
              "text": f"另外「{'、'.join(missing)}」在站上資料裡找不到,這幾項先略過。"})
    emit({"type": "final", "message": "操作已交派系統代理執行。"})
    return True


async def run(question: str, mode, emit):
    if _try_operation(question, emit):
        return
    emit({"type": "status", "message": "指揮官分析需求、判斷領域…"})
    if _is_smalltalk(question):
        kind = "chat"
        doms = []
    else:
        doms, internal, external, exq, output, kind = await plan(question)

    # 純聊天/簡單詢問:智策直接回答,不開產線(不分工、不做報告)
    if kind == "chat":
        sysp = ("你是 JVision AI 團隊的總指揮「智策」。用繁體中文(台灣正體)簡短友善地回覆,"
                "嚴格 60 字以內、單段純文字、禁用 Markdown 符號(**、列點、編號)。"
                "若對方只是打招呼或問你能做什麼,介紹兩件事:"
                "1) 查站上系統的實際數據並彙整成報告(網頁或圖文);"
                "2) 執行操作指令(例:把 WO-01 標記完成)。"
                "對方的問題若模糊,主動舉例並反問想了解哪套系統。不要生成報告、不要表格。")
        try:
            ans = await llm.stream_answer(sysp, question, search=False, model=FAST, timeout=40)
        except llm.LLMBusy:
            raise
        except Exception:
            ans = "你好!想了解站上哪套系統的現況,或要我執行什麼操作?直接說,我請團隊處理。"
        emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮",
              "dataMode": "reasoning", "text": _zh(ans.strip()[:200])})
        emit({"type": "final", "message": "完成。"})
        return
    # Phase 2:內部數據先找站上「已抽取實際畫面資料」的系統,由系統代理讀真資料;
    # 站上沒有相關系統才退回 internal-sim(LLM 依級距生數字)的舊路。
    sys_hits = systems.pick_systems(question, top=3) if internal else []
    need_sim = internal and not sys_hits
    data_team = pick_data_team(question, doms, need_sim, external, exq) if (need_sim or external) else []
    _used_ids = {t["agent"]["id"] for t in data_team}
    if output == "text":
        synth = registry.flagship_of_cat("doc")  # 擬稿（文書）：寫文字報告
        if synth and synth["id"] in _used_ids:
            synth = registry.flagship_of_cat("design")
        verb = "彙整成一份圖文報告"
    else:
        synth = registry.flagship_of_cat("design")  # 繪境（介面設計）：設計成報告網頁
        if synth and synth["id"] in _used_ids:
            synth = registry.flagship_of_cat("doc")
        verb = "設計成一頁報告網頁"
    # 配到系統時,「領域」直接講系統的實際分類;沒配到才用領域偵測的結果
    # (domains KB 缺檔時偵測一律回「生產製造」,拿它當開場白會講鬼話)
    doms_label = "、".join(dict.fromkeys(
        [s.get("category") or "站上系統" for _, s in sys_hits])) if sys_hits else "、".join(doms)
    sys_part = "、".join(f"《{s.get('displayName') or s['name']}》" for _, s in sys_hits)
    names = "、".join(t["agent"]["name"] for t in data_team)
    helpers = "；".join(x for x in [
        sys_part and f"系統代理直接讀取 {sys_part} 的實際數據", names and f"{names} 查資料"] if x)
    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
          "text": f"這題屬於「{doms_label}」。我請 {helpers}，交給 {synth['name']} {verb}，我負責確認。"})
    # 上方 agents 清單也放指揮官（排最前）
    members = [{"id": "orchestrator", "name": "智策", "role": "總指揮", "dataMode": "reasoning", "subtask": "分工協調與最終確認"}]
    members += [{"id": f"sys:{s['name']}", "name": s.get("displayName") or s["name"], "role": "系統代理",
                 "dataMode": "system-live", "subtask": f"讀取《{s.get('displayName') or s['name']}》實際畫面數據"} for _, s in sys_hits]
    members += [{"id": t["agent"]["id"], "name": t["agent"]["name"], "role": t["agent"]["role"],
                 "dataMode": t["agent"]["dataMode"], "subtask": t["subtask"]} for t in data_team]
    members.append({"id": synth["id"], "name": synth["name"], "role": synth["role"], "dataMode": "reasoning", "subtask": verb})
    emit({"type": "team", "members": members})
    emit({"type": "page_pending", "title": question, "sub": "領域：" + doms_label + f" · {synth['name']} 彙整中", "output": output})
    # 完成項目也放一則「指揮官分工摘要」（誰處理什麼）
    _assign = "；".join(
        [f"{s.get('displayName') or s['name']}→讀取實際畫面數據" for _, s in sys_hits]
        + [f"{t['agent']['name']}→{t['subtask']}" for t in data_team])
    emit({"type": "done_item", "text": f"智策 分工：{_assign}；{synth['name']}→{verb}"})

    # ① 各系統查資料（系統代理讀實機數據;無相關系統才由資料 agent 生現況數據）
    emit({"type": "status", "message": "查詢各系統實際數據…" if sys_hits else "資料 Agent 查各系統現況…"})
    gathered = await asyncio.gather(*([_gather_system(h, emit) for h in sys_hits]
                                      + [_gather(t, emit) for t in data_team]))
    combined = "\n".join(f"【{g['name']}·{g['domain']}】\n{g['data']}" for g in gathered)

    # ② 產出報告（text=文字報告 / html=報告網頁）
    if output == "text":
        emit({"type": "status", "message": f"{synth['name']} 撰寫圖文報告…"})
        md = await _build_text_report(synth, question, doms, combined, emit)
        emit({"type": "done_item", "text": f"{synth['name']} 產出圖文報告（含重點標記、內嵌圖表）"})
        emit({"type": "report", "title": question,
              "sub": "領域：" + doms_label + f" · {synth['name']} 撰寫 · 資料來自 {len(gathered)} 個系統", "markdown": md})
    else:
        emit({"type": "status", "message": f"{synth['name']} 設計並產出報告網頁…"})
        html = await _build_page(synth, question, doms, combined, emit)
        emit({"type": "done_item", "text": f"{synth['name']} 產出報告網頁（含 KPI、圖表、結論）"})
        emit({"type": "page", "title": question,
              "sub": "領域：" + doms_label + f" · {synth['name']} 設計 · 資料來自 {len(gathered)} 個系統", "html": html})

    # ③ 指揮官確認（用不同 id → 前端會新增一則泡泡在 繪境 下方，而不是覆蓋最上面的開場白）
    emit({"type": "message", "id": "orchestrator_done", "name": "智策", "role": "總指揮", "dataMode": "reasoning",
          "text": "我確認過報告數據一致、結論合理，完成。"})
    emit({"type": "final", "message": "完成。"})

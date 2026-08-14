"""總指揮調度管線。
選人：確定性（偵測領域 → 依角色補齊 internal-sim/external/reasoning），不靠 LLM 隨機挑，確保穩定。
流程：總指揮解釋為何選這些人 → Phase1 資料 agent 並行（內部查系統 / 外部真查）→ Phase2 推理 agent 拿資料再並行
→ 總指揮彙整成一個 HTML 結果畫面（失敗也用保底 HTML，右邊永不空白）。"""
from __future__ import annotations
import asyncio, re, json
import llm, registry

FAST = "haiku"
SMART = "sonnet"

EXTERNAL_SIGNALS = ["市場", "標竿", "法規", "趨勢", "競爭", "產業", "對手", "政策", "補助", "benchmark", "外部", "行情", "同業"]
# 問題意圖 → 需要的 reasoning 角色 cat
INTENT = [
    (["效益", "roi", "回收", "成本", "划算", "值得", "投資"], "finance"),
    (["報告", "文件", "計畫書", "評估報告", "sow", "規格書"], "doc"),
    (["品質", "良率", "客訴", "不良", "檢驗", "缺陷"], "quality"),
    (["合規", "風險", "法遵", "稽核"], "compliance"),
]
DATA_CATS = ["analyze", "datagen", "monitor", "schedule"]  # 皆 internal-sim


def _sysname(domain):
    d = registry.domains_kb().get(domain, {})
    ss = d.get("systems", [])
    return ss[0] if ss else "內部系統"


def pick_team(question: str):
    doms = registry.detect_domains(question, top=2)
    dom0 = doms[0]
    team, used = [], set()

    def add(a, sub):
        if a and a["id"] not in used:
            used.add(a["id"])
            team.append({"agent": a, "subtask": sub, "q": question})

    # 1-2 個 internal-sim 資料 agent（優先 analyze→datagen→monitor→schedule），跨偵測到的領域
    for dom in doms:
        for cat in DATA_CATS:
            a = registry.by_cat_in_domain(dom, cat)
            if a and a["dataMode"] == "internal-sim":
                add(a, f"查詢 {dom} 內部系統（{_sysname(dom)}）的現況數據，給出關鍵數字")
                break
        if sum(1 for t in team if t["agent"]["dataMode"] == "internal-sim") >= 2:
            break
    if not any(t["agent"]["dataMode"] == "internal-sim" for t in team):  # 保底：至少一個查數據的
        add(registry.flagship_of_cat("analyze"), f"查詢 {dom0} 內部系統現況數據")

    # external 只有問題明顯需要外部事實時才加 1 個
    if any(s in question.lower() for s in EXTERNAL_SIGNALS):
        a = registry.by_cat_in_domain(dom0, "expert") or registry.by_cat_in_domain(dom0, "strategy")
        if a and a["dataMode"] == "external-real":
            add(a, f"上網查證 {dom0} 的產業標竿或法規，附真實來源連結")

    # reasoning：依意圖挑 1-2 個做判斷／彙整
    ql = question.lower()
    reason_cats = [cat for kws, cat in INTENT if any(k in ql for k in kws)]
    if not reason_cats:
        reason_cats = ["doc"]  # 預設給文件/結論
    for cat in reason_cats[:2]:
        a = registry.by_cat_in_domain(dom0, cat) or registry.flagship_of_cat(cat)
        if a:
            role_tail = a["role"].split("·")[-1].strip()
            add(a, f"依查到的數據做「{role_tail}」判斷並給明確結論")
    if not any(t["agent"]["dataMode"] == "reasoning" for t in team):  # 保底：至少一個做結論
        add(registry.flagship_of_cat("doc"), "把各方數據彙整成明確結論與建議")

    return doms, team[:5]


def _esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _parse(ans, name):
    s = re.search(r"SUMMARY:\s*(.+)", ans)
    summary = (s.group(1).strip() if s else "").split("\n")[0].strip("* ").strip()[:60]
    m = re.search(r"<section[\s\S]*?</section>", ans, re.I)
    section = m.group(0) if m else ""
    section = re.sub(r"<(script|style)[\s\S]*?</\1>", "", section, flags=re.I)  # 安全
    if not section:
        body = re.sub(r"\n?SUMMARY:.*$", "", ans, flags=re.S | re.M).strip()
        section = (f'<section data-title="{_esc(name)}" style="margin:0 0 14px;padding:14px;'
                   f'border:1px solid #e2e8f0;border-radius:12px;background:#fff">'
                   f'<div style="color:#334155;font-size:13px;line-height:1.7">{_esc(body)[:500]}</div></section>')
    title = ""
    tm = re.search(r'data-title="([^"]*)"', section)
    if tm:
        title = tm.group(1)
    return summary or (name + " 完成"), section, title


async def _run_agent(t, emit, data_ctx=""):
    a, sub = t["agent"], t["subtask"]
    dm = a["dataMode"]
    emit({"type": "agent_start", "id": a["id"], "name": a["name"], "role": a["role"], "dataMode": dm})
    search = dm == "external-real"
    if dm == "internal-sim":
        emit({"type": "step", "id": a["id"], "message": f"存取 {_sysname(a.get('domain',''))} 資料…"})
    extra = f"\n\n可用的已查資料（其他 Agent 提供）：\n{data_ctx}" if data_ctx else ""
    speed = "（外部只查 1-2 個最關鍵來源、附連結即可）" if search else ""
    try:
        ans = await llm.stream_answer(
            registry.system_prompt(a["id"]),
            f"你負責的區塊：{sub}{speed}{extra}\n（整體需求：{t.get('q','')}）\n請畫出你這塊的 SECTION。",
            emit=lambda e: emit({**e, "id": a["id"]}), search=search, model=FAST, timeout=140)
    except Exception as ex:
        ans = f"SUMMARY: 此步未完成（{ex}）"
    summary, section, title = _parse(ans, a["name"])
    emit({"type": "message", "id": a["id"], "name": a["name"], "role": a["role"], "dataMode": dm, "text": summary})
    # 邊回答邊產出：這位 agent 畫好的 section 直接長在右邊
    emit({"type": "section", "id": a["id"], "name": a["name"], "role": a["role"],
          "dataMode": dm, "title": title or a["role"], "html": section})
    emit({"type": "done_item", "text": summary})
    return {"name": a["name"], "role": a["role"], "dataMode": dm, "summary": summary}


async def run(question: str, mode, emit):
    emit({"type": "status", "message": "總指揮讀取需求，判斷牽涉領域…"})
    doms, team = pick_team(question)

    dnames = [t for t in team if t["agent"]["dataMode"] == "internal-sim"]
    enames = [t for t in team if t["agent"]["dataMode"] == "external-real"]
    rnames = [t for t in team if t["agent"]["dataMode"] == "reasoning"]
    expl = f"這題屬於「{'、'.join(doms)}」領域，我來分配。請 " + \
        "、".join(t["agent"]["name"] for t in dnames) + f" 各查一個內部系統（{_sysname(doms[0])} 等）的現況數據"
    if enames:
        expl += "，請 " + "、".join(t["agent"]["name"] for t in enames) + " 上網查外部標竿"
    if rnames:
        expl += "，最後由 " + "、".join(t["agent"]["name"] for t in rnames) + " 依數據做判斷與收尾"
    expl += "。每位負責畫右邊一個區塊。"
    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮",
          "dataMode": "reasoning", "text": expl})
    emit({"type": "team", "members": [
        {"id": t["agent"]["id"], "name": t["agent"]["name"], "role": t["agent"]["role"],
         "dataMode": t["agent"]["dataMode"], "subtask": t["subtask"]} for t in team]})
    emit({"type": "result_start", "title": question, "sub": "領域：" + "、".join(doms) + f" · {len(team)} 位 Agent 協作"})

    data_team = [t for t in team if t["agent"]["dataMode"] in ("internal-sim", "external-real")]
    reason_team = [t for t in team if t["agent"]["dataMode"] == "reasoning"]

    # Phase1：資料 agent 並行，各自把 section 長在右邊（邊回答邊產出，不會逾時）
    emit({"type": "status", "message": "資料 Agent 查詢並繪製各自區塊…"})
    data_res = await asyncio.gather(*[_run_agent(t, emit) for t in data_team]) if data_team else []
    data_ctx = "\n".join(f"[{r['name']}] {r['summary']}" for r in data_res)

    # Phase2：推理 agent 拿到資料再畫自己的判斷/彙整區塊
    if reason_team:
        emit({"type": "status", "message": "推理 Agent 依數據繪製判斷區塊…"})
        await asyncio.gather(*[_run_agent(t, emit, data_ctx) for t in reason_team])

    emit({"type": "message", "id": "orchestrator", "name": "智策", "role": "總指揮",
          "dataMode": "reasoning", "text": "各區塊已完成，右側即為結果畫面。"})
    emit({"type": "final", "message": "完成。"})

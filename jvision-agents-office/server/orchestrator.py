"""總指揮調度管線（單一模式：指揮官自己判斷要產出什麼畫面）。
流程：讀需求 → 挑 4-5 位（內部資料題優先 internal-sim）→ 兩階段跑
  Phase1 資料 agent（internal 查公司系統 / external 真查外部）並行
  Phase2 推理 agent 拿到 Phase1 資料再並行
→ 總指揮把結果彙整成「一個自包含 HTML 畫面（含 KPI/圖表/清單）」呈現在右側。
左邊對話只顯示每位一句話 SUMMARY；右邊是詳細 HTML。"""
from __future__ import annotations
import asyncio, re
import llm, registry

FAST = "haiku"    # worker
SMART = "sonnet"  # 挑人 / 彙整 HTML


def _lines(ans):
    s = re.search(r"SUMMARY:\s*(.+)", ans)
    r = re.search(r"RESULT:\s*(.+)", ans, re.S)
    summary = (s.group(1).strip() if s else "").split("\n")[0][:60]
    result = (r.group(1).strip() if r else "")
    body = re.sub(r"\n?(SUMMARY|RESULT):.*$", "", ans, flags=re.S | re.M).strip()
    return summary, (result or body[:200]), body


async def _pick_team(question: str) -> list:
    cands = registry.candidates(question, top=14)
    roster = "\n".join(
        f'- {a["id"]} | {a["role"]} | dataMode={a["dataMode"]} | {a["tagline"]}' for a in cands)
    sysp = registry.system_prompt("orchestrator", worker_output=False) + (
        "\n\n# 本次任務：team_pick + task_split\n"
        "判斷這句需求需要哪些資料，挑 4-5 位最相關的 agent，每位給一句話子任務。\n"
        "**選人原則**：\n"
        "- 若問題是關於公司內部系統狀況（MES/ERP/工單/庫存/良率/產能/HR/財務分錄），"
        "主力挑 internal-sim 的 agent 去查各系統的公司內部資料（可挑 2-3 個不同系統）；\n"
        "- 只有真的需要外部市場/法規/產業標竿事實時，才挑『最多 1 個』external-real；\n"
        "- 再補 1-2 個 reasoning 角色（分析/彙整/ROI/文件）把資料變成結論。\n"
        "- 儘量同一領域，讓他們像同一個團隊。\n"
        '只輸出 JSON：{"team":[{"id":"候選id","subtask":"一句話子任務"}]}\n候選：\n' + roster
    )
    out = await llm.stream_answer(sysp, f"需求：{question}", search=False, model=SMART, timeout=70)
    m = re.search(r"\{.*\}", out, re.S)
    team = []
    if m:
        try:
            import json
            for t in (json.loads(m.group(0)).get("team") or [])[:5]:
                a = registry.get(t.get("id", ""))
                if a:
                    team.append({"agent": a, "subtask": t.get("subtask", "")})
        except Exception:
            pass
    if not team:
        team = [{"agent": a, "subtask": a["tagline"]} for a in cands[:4]]
    return team


async def _run_agent(t, emit, data_ctx=""):
    a, sub = t["agent"], t["subtask"]
    emit({"type": "agent_start", "id": a["id"], "name": a["name"], "role": a["role"]})
    dm = a["dataMode"]
    search = dm == "external-real"
    if dm == "internal-sim":  # 顯示「查詢公司系統」的感覺
        emit({"type": "step", "id": a["id"], "message": f"存取 {a.get('domain','')} 內部系統資料…"})
    extra = f"\n\n可用的已查資料（其他 Agent 提供）：\n{data_ctx}" if data_ctx else ""
    speed = "（外部只查 1-2 個最關鍵來源、附連結即可）" if search else ""
    try:
        ans = await llm.stream_answer(
            registry.system_prompt(a["id"]),
            f"你的子任務：{sub}{speed}{extra}\n（整體需求：{t.get('q','')}）",
            emit=lambda e: emit({**e, "id": a["id"]}), search=search, model=FAST, timeout=140)
    except Exception as ex:
        ans = f"SUMMARY: 此步未完成\nRESULT: {ex}"
    summary, result, body = _lines(ans)
    emit({"type": "message", "id": a["id"], "name": a["name"], "role": a["role"],
          "text": summary or (body[:50] + "…")})
    emit({"type": "done_item", "text": result})
    return {"name": a["name"], "role": a["role"], "dataMode": dm, "result": result, "body": body}


async def run(question: str, mode, emit):
    emit({"type": "status", "message": "總指揮讀取需求，判斷要查哪些資料…"})
    team = await _pick_team(question)
    for t in team:
        t["q"] = question
    emit({"type": "team", "members": [
        {"id": t["agent"]["id"], "name": t["agent"]["name"], "role": t["agent"]["role"],
         "dataMode": t["agent"]["dataMode"], "subtask": t["subtask"]} for t in team]})

    data_team = [t for t in team if t["agent"]["dataMode"] in ("internal-sim", "external-real")]
    reason_team = [t for t in team if t["agent"]["dataMode"] == "reasoning"]

    # Phase 1：資料 agent 並行（查內部系統 / 真查外部）
    emit({"type": "status", "message": "資料 Agent 查詢中（內部系統 + 外部查證）…"})
    data_res = await asyncio.gather(*[_run_agent(t, emit) for t in data_team]) if data_team else []
    data_ctx = "\n".join(f"[{r['name']}] {r['result']}" for r in data_res)

    # Phase 2：推理 agent 拿到資料再並行
    reason_res = []
    if reason_team:
        emit({"type": "status", "message": "推理 Agent 依查到的資料進行分析／彙整…"})
        reason_res = await asyncio.gather(*[_run_agent(t, emit, data_ctx) for t in reason_team])

    all_res = data_res + reason_res

    # 彙整成 HTML 畫面
    emit({"type": "status", "message": "總指揮彙整成結果畫面…"})
    synth_sys = registry.system_prompt("orchestrator", worker_output=False) + (
        "\n\n# 本次任務：把團隊產物彙整成『一個結果畫面』（HTML）\n"
        "輸出**一段自包含的 HTML 片段**（含 inline style，深淺自訂），像一個系統的儀表板/報表畫面，內容需包含：\n"
        "1) 一個標題列（含此需求的主題）；\n"
        "2) 3-4 個 KPI 卡（用各 Agent 提供的數字，合理一致）；\n"
        "3) 至少一個用 inline SVG 畫的圖表（長條或折線，資料來自各 Agent）；\n"
        "4) 一個資料表或重點清單；\n"
        "5) 若有外部查證，附一小塊『來源』含真實連結。\n"
        "規則：只輸出 HTML（不要 markdown、不要 ``` 圍欄、不要說明文字）。"
        "內部系統數字自然呈現、不要出現「模擬」字樣。寬度自適應（max-width:100%）、字體用系統字。"
    )
    synth_user = f"需求：{question}\n\n團隊產物：\n" + "\n".join(
        f"[{r['name']}·{r['role']}] {r['result']}\n{r['body'][:400]}" for r in all_res)
    try:
        html = await llm.stream_answer(synth_sys, synth_user, search=False, model=SMART, timeout=120)
        html = re.sub(r"^```html\s*|\s*```$", "", html.strip())
    except Exception as ex:
        html = f'<div style="padding:16px">彙整未完成：{ex}</div>'
    emit({"type": "html", "html": html})
    emit({"type": "final", "message": "完成，右側為結果畫面。"})

"""完成任務 / 數據報告 / 產出文件 —— 三模式共用管線。
總指揮讀需求 → 挑 4-5 個最相關 agent + 拆子任務 → 各 agent 做一步（internal 生數據 / external 真查）
→ 總指揮彙整 → 產出右側面板結構化 JSON。全程 emit 給 SSE。"""
from __future__ import annotations
import asyncio, json, re
import llm, registry

MODE_LABEL = {"task": "完成任務", "report": "數據報告", "doc": "產出文件"}
MODE_PANEL = {
    "task": '一個「工作台」JSON：{"title":標題,"kpis":[{"label","value","unit"}](3-4個),"items":[已完成事項字串](4-6個)}',
    "report": '一個「數據報告」JSON：{"title":標題,"kpis":[{"label","value","unit"}](3-4個),"series":{"labels":[...],"data":[...]},"insights":[洞察字串](2-3個)}',
    "doc": '一個「文件」JSON：{"title":標題,"sections":[{"heading","body"}](3-5節),"sources":[真實來源連結](有外部查證才放)}',
}


def _extract_json(text: str):
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


async def _pick_team(question: str, mode: str) -> list:
    cands = registry.candidates(question, top=12)
    roster = "\n".join(
        f'- {registry.compact(a)["id"]} | {a["role"]} | dataMode={a["dataMode"]} | {a["tagline"]}'
        for a in cands)
    # 用「總指揮 agent 本人」的 system_prompt（agents/orchestrator/）當大腦，套用它的 team_pick / task_split 技能
    sysp = registry.system_prompt("orchestrator", worker_output=False) + (
        "\n\n# 本次任務：team_pick + task_split\n"
        "從候選名單挑出**最相關的 4-5 位**（不要多、不要少），每位指派一句話子任務。"
        "要涵蓋抓資料的（internal-sim 生內部數據 / external-real 真查外部）＋做事的（分析/文件/ROI）。"
        "只輸出 JSON：{\"team\":[{\"id\":\"候選id\",\"subtask\":\"一句話子任務\"}]}\n候選名單：\n" + roster
    )
    out = await llm.stream_answer(sysp, f"需求（{MODE_LABEL.get(mode,mode)}）：{question}",
                                  search=False, timeout=90)
    data = _extract_json(out) or {}
    team = []
    for t in (data.get("team") or [])[:5]:
        a = registry.get(t.get("id", ""))
        if a:
            team.append({"agent": a, "subtask": t.get("subtask", "")})
    if not team:  # fallback：直接取候選前 4
        team = [{"agent": a, "subtask": a["tagline"]} for a in cands[:4]]
    return team


async def run(question: str, mode: str, emit):
    """主流程；emit(dict) 會被 app 轉成 SSE。"""
    emit({"type": "status", "message": "總指揮讀取需求，判斷牽涉領域…"})
    team = await _pick_team(question, mode)
    emit({"type": "team", "members": [
        {"id": t["agent"]["id"], "name": t["agent"]["name"], "role": t["agent"]["role"],
         "dataMode": t["agent"]["dataMode"], "subtask": t["subtask"]} for t in team]})

    # 各 agent「並行」跑（demo 要快：牆鐘 = 最慢那個，不是加總）
    async def _run_agent(t):
        a, sub = t["agent"], t["subtask"]
        emit({"type": "agent_start", "id": a["id"], "name": a["name"], "role": a["role"]})
        search = a["dataMode"] == "external-real"
        speed = "（外部查證挑 1-2 個最關鍵來源即可、不需窮盡，重點是快速給出附來源的結論）" if search else ""
        try:
            ans = await llm.stream_answer(
                registry.system_prompt(a["id"]),
                f"你的子任務：{sub}{speed}\n（整體需求：{question}）",
                emit=lambda e: emit({**e, "id": a["id"]}), search=search, timeout=150)
        except Exception as ex:
            ans = f"（此步驟未能完成：{ex}）"
        m = re.search(r"RESULT:\s*(.+)$", ans, re.S | re.M)
        result_line = m.group(1).strip() if m else ""
        body = re.sub(r"\n?RESULT:.*$", "", ans, flags=re.S | re.M).strip()
        emit({"type": "message", "id": a["id"], "name": a["name"], "role": a["role"], "text": body})
        emit({"type": "done_item", "text": result_line or f"{a['name']} 完成：{sub}"})
        return f"[{a['name']} · {a['role']}] {result_line or body[:200]}"

    results = await asyncio.gather(*[_run_agent(t) for t in team])

    # 彙整（同樣用總指揮 agent 本人的 prompt，套用它的 synthesize 技能）
    emit({"type": "status", "message": "總指揮彙整各 Agent 產出…"})
    synth_sys = registry.system_prompt("orchestrator", worker_output=False) + (
        "\n\n# 本次任務：synthesize（彙整）\n"
        "把各 Agent 的產物收斂成最終成果。內部系統數字自然呈現、不要出現「模擬」字樣；外部事實保留來源連結。"
        f"請只輸出{MODE_PANEL.get(mode, MODE_PANEL['task'])}。數字要與各 Agent 提供的一致、合理。"
    )
    synth_user = f"需求：{question}\n\n各 Agent 產出：\n" + "\n".join(results)
    try:
        synth = await llm.stream_answer(synth_sys, synth_user, search=False, timeout=120)
        panel = _extract_json(synth)
    except Exception:
        panel = None
    emit({"type": "panel", "mode": mode, "data": panel or {"title": "完成", "items": [r[:80] for r in results]}})
    emit({"type": "final", "message": "任務完成，已交付結果。"})

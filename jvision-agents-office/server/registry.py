"""載入 224 個 agent，組出每個 agent 的完整 system prompt（厚共用層 + agent 專屬），
並提供關鍵字選人（總指揮的候選名單）。"""
from __future__ import annotations
import json, os, re, functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # jvision-agents-office
DATA = os.path.join(ROOT, "agents.generated.json")


@functools.lru_cache(maxsize=1)
def _shared() -> dict:
    def rd(rel):
        p = os.path.join(ROOT, rel)
        return open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    return {
        "policy": rd("POLICY.md"),
        "internal-sim": rd("datamodes/internal-sim.md"),
        "external-real": rd("datamodes/external-real.md"),
        "reasoning": rd("datamodes/reasoning.md"),
    }


@functools.lru_cache(maxsize=1)
def load_agents() -> list:
    return json.load(open(DATA, encoding="utf-8"))


@functools.lru_cache(maxsize=1)
def _by_id() -> dict:
    return {a["id"]: a for a in load_agents()}


def get(aid: str) -> dict | None:
    return _by_id().get(aid)


def _read_agent_files(aid: str) -> tuple[str, str, str]:
    d = os.path.join(ROOT, "agents", aid)
    agent_md = os.path.join(d, "agent.md")
    skills_md = os.path.join(d, "skills.md")
    a = open(agent_md, encoding="utf-8").read() if os.path.exists(agent_md) else ""
    s = open(skills_md, encoding="utf-8").read() if os.path.exists(skills_md) else ""
    return a, s


def _knowledge(domain: str) -> str:
    p = os.path.join(ROOT, "knowledge", f"{domain}.md")
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


def system_prompt(aid: str, worker_output: bool = True) -> str:
    """厚共用鐵則 + 該 agent 的 dataMode 契約 + 領域知識 + agent.md + skills.md。
    worker_output=False 時省略「RESULT: 」那段（總指揮做 meta 任務如挑人/彙整時用）。"""
    a = get(aid)
    if not a:
        raise KeyError(aid)
    sh = _shared()
    dm = a.get("dataMode", "reasoning")
    agent_md, skills_md = _read_agent_files(aid)
    parts = [
        "你是 JVision AI 團隊裡的一位 Agent。嚴格遵守以下所有規則後再回答，全程使用繁體中文。",
        "# 全域鐵則\n" + sh["policy"],
        f"# 你的資料模式（{dm}）\n" + sh.get(dm, ""),
    ]
    if a.get("domain") and a["domain"] != "跨領域":
        parts.append("# 領域知識（用來約束數字級距與查證來源）\n" + _knowledge(a["domain"]))
    parts.append("# 你的身分\n" + agent_md)
    parts.append("# 你的技能 playbook\n" + skills_md)
    if worker_output:
        parts.append(
            "# 輸出要求\n- 只做被指派的那一步，精簡務實，不要長篇大論。\n"
            "- internal 數據自然呈現、不要出現「模擬」字樣；external 事實必附真實來源連結。\n"
            "- 正文最多 5 行重點。結尾固定兩行：\n"
            "  `SUMMARY: <一句話口語摘要，≤30字，給對話框顯示>`\n"
            "  `RESULT: <這一步的關鍵數據/結論，給總指揮彙整成畫面用，可含數字>`"
        )
    return "\n\n".join(p for p in parts if p.strip())


# ---- 關鍵字選人（CJK bigram，中文才對得上）----
def _tokens(text: str) -> list:
    toks = []
    for run in re.findall(r"[a-z0-9]+|[一-鿿]+", (text or "").lower()):
        if run.isascii():
            if len(run) >= 2:
                toks.append(run)
        elif len(run) == 1:
            toks.append(run)
        else:
            toks += [run[i:i+2] for i in range(len(run)-1)]
    return toks


def candidates(question: str, top: int = 12) -> list:
    """依問題關鍵字，回傳最相關的候選 agent（供總指揮挑最終 4-5 位）。"""
    qt = set(_tokens(question))
    scored = []
    for a in load_agents():
        if a["id"] == "orchestrator":
            continue
        strong = " ".join(str(a.get(k, "")) for k in ("domain", "role", "tagline"))
        weak = " ".join(a.get("projects", []) + a.get("inputs", []))
        s = len(qt & set(_tokens(strong))) * 3 + len(qt & set(_tokens(weak)))
        if s > 0:
            scored.append((s, a))
    scored.sort(key=lambda x: x[0], reverse=True)
    picked = [a for _, a in scored[:top]]
    if not picked:  # 問題沒對上任何關鍵字 → 給一組通用班底
        ids = ["insighter", "expert", "abacus", "drafter", "scheduler"]
        picked = [get(i) for i in ids if get(i)]
    return picked


def compact(a: dict) -> dict:
    return {"id": a["id"], "role": a.get("role"), "domain": a.get("domain"),
            "dataMode": a.get("dataMode"), "tagline": a.get("tagline")}


if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "幫我把今天的訂單排成生產工單並派工"
    print("候選 agent：")
    for a in candidates(q, 8):
        print(f"  {a['id']:>6}  {a['role']}  [{a['dataMode']}]")
    print("\n--- orchestrator system prompt 前 300 字 ---")
    print(system_prompt("g200")[:300])

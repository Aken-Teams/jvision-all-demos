"""載入 224 個 agent，組出每個 agent 的完整 system prompt（厚共用層 + agent 專屬），
並提供關鍵字選人（總指揮的候選名單）。"""
from __future__ import annotations
import json, os, re, functools

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # jvision-agents-office
DATA = os.path.join(ROOT, "agents.generated.json")
DOMAINS_JSON = os.path.join(ROOT, "build", "domains.json")


@functools.lru_cache(maxsize=1)
def domains_kb() -> dict:
    try:
        return json.load(open(DOMAINS_JSON, encoding="utf-8")).get("domains", {})
    except Exception:
        return {}


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
            "# 輸出格式（嚴格遵守，兩部分）\n"
            "第一行：`SUMMARY: <一句話口語摘要，≤30字，給左側對話顯示>`\n"
            "接著輸出**一塊你負責的 SECTION**（右側結果畫面用）。**只用以下設計系統 class，不要自己寫 style、不要 SVG、不要 <style>/<script>/markdown/``` 圍欄**。前端會套用漂亮樣式並把圖表資料渲染成真圖表：\n"
            "<section data-title=\"你負責的面向（例：MES 產能現況）\">\n"
            "  <h3 class=\"jv-h\">小標題</h3>\n"
            "  <div class=\"jv-kpis\">\n"
            "    <div class=\"jv-kpi\"><div class=\"v\">85%</div><div class=\"l\">OEE 稼動率</div></div>\n"
            "    <div class=\"jv-kpi\"><div class=\"v\">92%</div><div class=\"l\">達交率</div></div>\n"
            "    <div class=\"jv-kpi\"><div class=\"v\">98.2%</div><div class=\"l\">良率</div></div>\n"
            "  </div>\n"
            "  <div class=\"jv-chart\" data-type=\"bar\" data-title=\"各線產能\" data-cats=\"C線,D線,E線\" data-series=\"83,73,92\"></div>\n"
            "  <table class=\"jv-table\"><thead><tr><th>項目</th><th>數值</th><th>狀態</th></tr></thead><tbody>\n"
            "    <tr><td>研發達交</td><td>88%</td><td>良好</td></tr></tbody></table>\n"
            "  <div class=\"jv-note\">重點建議一句話。</div>\n"
            "</section>\n"
            "規則：\n"
            "- 必含：jv-h 標題、jv-kpis（2-4 個 jv-kpi 卡）、**一個 jv-chart**（type 可 bar/line/doughnut；data-cats 與 data-series 逗號分隔、數量相同、data-series 為純數字）。table 與 jv-note 視情況加。\n"
            "- 只畫你被指派的那一塊，精簡自成一塊。class 名稱與結構照抄，只換文字與數字。\n"
            "- internal 數字自然呈現、不要出現「模擬」；external 事實在 jv-note 或 table 內附真實來源 <a>。\n"
            "- 數字要合理、與 SUMMARY 一致。"
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


def detect_domains(question: str, top: int = 2) -> list:
    """從問題偵測最相關的功能領域（比對領域名 + 系統 + KPI + 風險關鍵字）。"""
    kb = domains_kb()
    qt = set(_tokens(question))
    scored = []
    for name, d in kb.items():
        bag = name + " " + " ".join(d.get("systems", [])) + " " + \
              " ".join(k[0] for k in d.get("kpis", [])) + " " + " ".join(d.get("risks", [])) + " " + d.get("dataFocus", "")
        score = len(qt & set(_tokens(bag)))
        # 系統名（MES/ERP/CRM…）命中加重
        for s in d.get("systems", []):
            for tok in _tokens(s):
                if tok in qt:
                    score += 2
        if score:
            scored.append((score, name))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return ["生產製造"]
    topscore = scored[0][0]
    # 只納入分數達第 1 名一半以上的領域，避免弱匹配硬湊不相干領域
    doms = [n for s, n in scored[:top] if s >= topscore * 0.5]
    return doms or [scored[0][1]]


def agents_in_domain(domain: str, data_mode: str = None) -> list:
    out = [a for a in load_agents() if a.get("domain") == domain and (data_mode is None or a.get("dataMode") == data_mode)]
    return out


def by_cat_in_domain(domain: str, cat: str):
    return next((a for a in load_agents() if a.get("domain") == domain and a.get("cat") == cat), None)


def flagship_of_cat(cat: str):
    """該領域沒有此角色時的後備：用該角色的跨領域旗艦，再不行用任一同角色。"""
    return next((a for a in load_agents() if a.get("cat") == cat and a.get("domain") == "跨領域"), None) \
        or next((a for a in load_agents() if a.get("cat") == cat), None)


if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "幫我把今天的訂單排成生產工單並派工"
    print("候選 agent：")
    for a in candidates(q, 8):
        print(f"  {a['id']:>6}  {a['role']}  [{a['dataMode']}]")
    print("\n--- orchestrator system prompt 前 300 字 ---")
    print(system_prompt("g200")[:300])

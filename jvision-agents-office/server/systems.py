"""系統資料層(Phase 2):讓資料 agent 查「真的抽取自 demo 畫面」的數據,而非現編。

資料來源是 tools/agent-data-extract.mjs 的產出:
  content/agent-cards/index.json   全站系統索引(list_systems 的來源)
  content/agent-cards/<repo>.json  單一系統的 agent card
  content/agent-data/<repo>.json   該系統每畫面的 KPI/表格/圖表(數字=畫面上的數字)

原則:抽取而非生成——這一層只讀檔,零 LLM、零成本、結果可重現。
抽取工具背景持續補檔,index 用 mtime 快取,新系統上架後這裡自動看得到。
"""
from __future__ import annotations
import json, os, re
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # jvision-agents-office
SITE = os.path.dirname(ROOT)                                        # caseShow 站台根目錄
CARDS = os.path.join(SITE, "content", "agent-cards")
DATA = os.path.join(SITE, "content", "agent-data")

_index_cache = {"mtime": None, "value": {"total": 0, "systems": []}}


def index() -> dict:
    p = os.path.join(CARDS, "index.json")
    try:
        m = os.path.getmtime(p)
        if m != _index_cache["mtime"]:
            _index_cache["value"] = json.load(open(p, encoding="utf-8"))
            _index_cache["mtime"] = m
    except Exception:
        pass
    return _index_cache["value"]


def _read(base: str, repo: str):
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,80}", repo or ""):
        return None
    p = os.path.join(base, f"{repo}.json")
    try:
        return json.load(open(p, encoding="utf-8"))
    except Exception:
        return None


def card(repo: str):
    return _read(CARDS, repo)


def data(repo: str):
    return _read(DATA, repo)


# ---- 關鍵字比對(CJK bigram,與 registry 同款) ----
def _tokens(text: str) -> list:
    toks = []
    for run in re.findall(r"[a-z0-9]+|[一-鿿]+", (text or "").lower()):
        if run.isascii():
            if len(run) >= 2:
                toks.append(run)
        elif len(run) == 1:
            toks.append(run)
        else:
            toks += [run[i:i + 2] for i in range(len(run) - 1)]
    return toks


def pick_systems(question: str, top: int = 3) -> list:
    """從站上已抽取的系統裡挑最相關的幾套。回 [(score, index_entry)]。
    門檻 3:單一 bigram 撞名就亂配(「管理」誰都有),寧可退回 internal-sim 也不要亂指系統。"""
    qt = set(_tokens(question))
    scored = []
    for s in index().get("systems", []):
        bag = " ".join([s.get("displayName", ""), s.get("category", ""),
                        s.get("systemType", ""), s.get("description", "")])
        bt = set(_tokens(bag))
        # 英文縮寫/術語(CRM、MES、ERP…)是強信號,命中一個抵三個中文 bigram
        sc = sum(3 if t.isascii() else 1 for t in qt & bt)
        # 系統名直接命中(去掉常見尾綴後整段出現在問題裡)→ 大幅加權
        name = (s.get("displayName") or "").replace("台", "").replace("平台", "")
        if name and len(name) >= 4 and name in question:
            sc += 10
        if sc:
            scored.append((sc, s))
    scored.sort(key=lambda x: (-x[0], x[1].get("name", "")))
    return [(sc, s) for sc, s in scored[:top] if sc >= 3]


# ---- 給 LLM 用的資料區塊(每行帶來源連結,報告才能溯源) ----
def data_block(repo: str, max_rows: int = 6, max_chars: int = 1800) -> str:
    d = data(repo)
    if not d:
        return ""
    lines = []
    for s in d.get("screens", []):
        stitle = (s.get("stage") or {}).get("title") or s.get("heading") or f"畫面{s.get('index', 0)}"
        src = f"/demos/{repo}/#go={s.get('index', 0)}"
        for k in s.get("kpis", []):
            # &hl=標籤:demo 內的 bridge 會把該區塊高亮並捲進視野(溯源看得見)
            lines.append(f"{k['label']}: {k['value']}(來源 {src}&hl={quote(k['label'])} 「{stitle}」)")
        for t in s.get("tables", []):
            tsrc = f"{src}&hl={quote(t['title'])}" if t.get("title") else src
            lines.append(f"表「{t.get('title') or stitle}」欄位:{' | '.join(t.get('columns', []))}(來源 {tsrc})")
            for r in t.get("rows", [])[:max_rows]:
                lines.append("  " + " | ".join(str(c) for c in r))
        for c in s.get("charts", []):
            series = ";".join(f"{sr.get('name') or c.get('type', '')}={sr.get('data')}" for sr in c.get("series", [])[:3])
            cats = ",".join(str(x) for x in c.get("categories", [])[:12])
            lines.append(f"圖「{c.get('title') or stitle}」類別[{cats}] {series}(來源 {src})")
    out = []
    total = 0
    for l in lines:
        total += len(l) + 1
        if total > max_chars:
            out.append(f"…(其餘略,完整資料 {len(lines)} 行)")
            break
        out.append(l)
    return "\n".join(out)


def get_metrics(repo: str) -> list:
    d = data(repo) or {}
    out = []
    for s in d.get("screens", []):
        stitle = (s.get("stage") or {}).get("title") or s.get("heading") or ""
        for k in s.get("kpis", []):
            out.append({"screen": s.get("index", 0), "screenTitle": stitle,
                        "label": k["label"], "value": k["value"]})
    return out


def query_data(repo: str, table: str = None) -> list:
    """回系統的明細表(可用表名關鍵字過濾)。"""
    d = data(repo) or {}
    out = []
    for s in d.get("screens", []):
        for t in s.get("tables", []):
            if table and table not in (t.get("title") or ""):
                continue
            out.append({"screen": s.get("index", 0), "title": t.get("title", ""),
                        "columns": t.get("columns", []), "rows": t.get("rows", [])})
    return out

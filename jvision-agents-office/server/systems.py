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


_df_cache = {"mtime": None, "docs": [], "common": set()}


def _corpus():
    """每套系統的 token 集,外加「爛大街詞」清單(出現在超過 5% 系統裡的詞)。
    「目前/現況/系統/管理」這類詞誰的描述都有,不歸零的話 493 套裡一定湊得出
    三個不相干的高分——實際發生過:問 CRM 配到會展報價+牙科聯繫+B2B 廣告。"""
    idx = index()
    if _index_cache["mtime"] == _df_cache["mtime"] and _df_cache["docs"]:
        return _df_cache["docs"], _df_cache["common"]
    docs = []
    df = {}
    for s in idx.get("systems", []):
        bag = " ".join([s.get("displayName", ""), s.get("category", ""),
                        s.get("systemType", ""), s.get("description", "")])
        bt = set(_tokens(bag))
        nt = set(_tokens(s.get("displayName", "")))
        docs.append((s, bt, nt))
        for t in bt:
            df[t] = df.get(t, 0) + 1
    n = max(len(docs), 1)
    common = {t for t, c in df.items() if c > max(3, n * 0.05)}
    _df_cache.update({"mtime": _index_cache["mtime"], "docs": docs, "common": common})
    return docs, common


def pick_systems(question: str, top: int = 3) -> list:
    """從站上已抽取的系統裡挑最相關的幾套。回 [(score, index_entry)]。
    計分:通用詞不算分;英文術語(CRM/MES…)命中系統名 5 分、命中內文 3 分;
    中文 bigram 命中系統名 2 分、內文 1 分。門檻 4,且次要系統要達第一名的一半
    ——寧可退回 internal-sim,也不要把不相干產業的系統湊成一份報告。"""
    qt = set(_tokens(question))
    docs, common = _corpus()
    scored = []
    for s, bt, nt in docs:
        sc = 0
        for t in qt & bt:
            if t in common and t not in nt:
                continue
            if t.isascii():
                sc += 5 if t in nt else 3
            else:
                sc += 2 if t in nt else 1
        name = (s.get("displayName") or "").replace("台", "").replace("平台", "")
        if name and len(name) >= 4 and name in question:
            sc += 10
        if sc:
            scored.append((sc, s))
    scored.sort(key=lambda x: (-x[0], x[1].get("name", "")))
    if not scored or scored[0][0] < 4:
        return []
    best_sc, best_sys = scored[0]
    # 次要系統要嘛跟第一名同產業分類,要嘛分數夠接近(七成)——
    # 不同產業又只是低空掠過門檻的,湊進報告只會讓客戶覺得資料亂配
    out = [(best_sc, best_sys)]
    for sc, s in scored[1:top]:
        if sc < 4 or sc * 2 < best_sc:
            continue
        if s.get("category") == best_sys.get("category") or sc >= best_sc * 0.7:
            out.append((sc, s))
    return out


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
            # &hl=標籤:demo 內的 bridge 會把該區塊高亮並捲進視野(溯源看得見)。
            # 中文不做 URL 編碼——瀏覽器接受原文,編碼後的長字串會吃掉 LLM 的資料額度
            lines.append(f"{k['label']}: {k['value']}(來源 {src}&hl={k['label']} 「{stitle}」)")
        for t in s.get("tables", []):
            tsrc = f"{src}&hl={t['title']}" if t.get("title") else src
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

"""每一次 LLM 呼叫用掉多少 token，記在誰頭上。

寫成獨立模組而不是塞進 llm.py，是因為「怎麼跑模型」和「用量記給誰」是兩件事：
之後換模型或改呼叫方式時，帳本的格式不該跟著動。

actor 用 contextvar 而不是逐層傳參數：orchestrator 裡有五個 stream_answer 呼叫點，
每一個都加一個參數，日後新增第六個一定會有人忘記加，而漏記的用量沒有任何跡象
可以事後發現。contextvar 在 asyncio 下每個請求各自獨立，不會互相汙染。

檔案格式是每行一筆 JSON，附加寫入。選它而不是資料庫：這是純附加的流水帳，
共用主機的 MySQL 連線會斷，而用量記不到不該讓使用者的請求失敗。
"""
import json
import os
import threading
from contextvars import ContextVar
from datetime import datetime, timezone

_actor: ContextVar[str] = ContextVar("jv_actor", default="")
_lock = threading.Lock()

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LEDGER = os.path.join(ROOT, "var", "token-usage.jsonl")


def set_actor(email: str) -> None:
    """由請求處理器在最前面呼叫一次。空字串代表匿名，照樣記，只是歸不到人身上。"""
    _actor.set((email or "").strip()[:190])


def current_actor() -> str:
    return _actor.get()


def record(kind: str, usage: dict, cost: float = 0.0, model: str = "") -> None:
    """記一筆。usage 直接吃 claude CLI result 事件裡的那個物件。

    永遠不可以往外丟例外：記帳失敗的代價是少一筆統計，
    讓使用者的分析因此中斷則是完全不成比例的代價。
    """
    try:
        u = usage or {}
        row = {
            "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "actor": _actor.get(),
            "kind": kind,
            "model": model or "",
            # 分開記而不是先加總：快取讀取的計價與新輸入差一個量級，
            # 加總之後就再也還原不回來了。
            "in": int(u.get("input_tokens") or 0),
            "out": int(u.get("output_tokens") or 0),
            "cacheWrite": int(u.get("cache_creation_input_tokens") or 0),
            "cacheRead": int(u.get("cache_read_input_tokens") or 0),
            "cost": round(float(cost or 0), 6),
        }
        os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
        with _lock, open(LEDGER, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception:
        pass

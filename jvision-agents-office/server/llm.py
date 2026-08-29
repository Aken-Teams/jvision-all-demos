"""Claude CLI 包裝層（沿用 nsysu 已驗證能真的觸發 WebSearch 的配方）。

配方要點：
- system prompt 寫進臨時 cwd 的 CLAUDE.md（CLI 會自動讀）
- user 訊息走 STDIN（不是 -p 參數）
- --permission-mode dontAsk（headless：允許清單內工具直接跑、其餘自動拒絕）
- --output-format stream-json --verbose（可解析真實工具呼叫）
- external-real 的 agent 才開 WebSearch,WebFetch；internal-sim / reasoning 不開（純文字）
"""
from __future__ import annotations
import asyncio, json, os, shutil, subprocess, tempfile
import token_ledger
from typing import Callable, Optional

_NO_WINDOW = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
DEFAULT_TIMEOUT = 150


class LLMBusy(RuntimeError):
    """CLI 回了用量上限/過載訊息。訊息文字直接給前端看,所以寫成使用者話術。"""
    def __init__(self):
        super().__init__("AI 團隊目前忙碌中,請稍後再試,謝謝!")


_BUSY_PATTERNS = ("hit your session limit", "usage limit", "rate limit",
                  "overloaded", "session limit", "resets at", "try again later")


def _is_busy(text: str) -> bool:
    t = (text or "").lower()
    return any(pat in t for pat in _BUSY_PATTERNS)


def claude_command() -> Optional[str]:
    return shutil.which("claude.cmd") or shutil.which("claude")


def available() -> bool:
    return claude_command() is not None


def _args(search: bool, model: Optional[str], partial: bool = False) -> list[str]:
    args = ["-p", "--output-format", "stream-json", "--verbose", "--permission-mode", "dontAsk"]
    if partial:
        args += ["--include-partial-messages"]  # 吐 stream_event / content_block_delta（逐字串流）
    if search:
        args += ["--allowedTools", "WebSearch,WebFetch", "--disallowedTools", "Bash,Edit,Write,Task"]
    else:
        args += ["--disallowedTools", "WebSearch,WebFetch,Bash,Edit,Write,Task,Read,Glob,Grep"]
    if model:
        args += ["--model", model]
    return args


def _tool_step(name: str, inp: dict) -> Optional[str]:
    inp = inp or {}
    if name == "WebSearch":
        q = str(inp.get("query") or "").strip()
        return f"上網搜尋：{q[:44]}" if q else "上網搜尋公開資料…"
    if name == "WebFetch":
        url = str(inp.get("url") or "").strip()
        return f"讀取網頁：{url[:44]}" if url else "讀取查到的網頁…"
    return None


async def stream_answer(system_prompt: str, user_message: str,
                        emit: Callable[[dict], None] = lambda e: None, *,
                        search: bool = False, model: Optional[str] = None,
                        timeout: int = DEFAULT_TIMEOUT,
                        on_delta: Optional[Callable[[str], None]] = None) -> str:
    """跑一次 Claude，串流真實搜尋步驟，回傳最終答案文字。
    on_delta 有給時，開 --include-partial-messages，逐 token 回吐（content_block_delta）。"""
    cmd = claude_command()
    if not cmd:
        raise RuntimeError("找不到 Claude CLI，請先安裝並登入 claude")
    workdir = tempfile.mkdtemp(prefix="jv_agent_")
    try:
        with open(os.path.join(workdir, "CLAUDE.md"), "w", encoding="utf-8") as fh:
            fh.write(system_prompt)
        # 關閉延伸思考:展示情境要的是即時開始輸出,不是深思 60~90 秒後的完美答案
        # (實測 thinking 讓報告首字延遲近百秒,關掉後體感差異巨大;品質由 spec 把關)
        env = {**os.environ, "MAX_THINKING_TOKENS": "0"}
        proc = await asyncio.create_subprocess_exec(
            cmd, *_args(search, model, partial=on_delta is not None), cwd=workdir,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            creationflags=_NO_WINDOW, env=env,
        )
        assert proc.stdin and proc.stdout
        proc.stdin.write(user_message.encode("utf-8"))
        await proc.stdin.drain()
        proc.stdin.close()

        answer, searches = "", 0
        loop = asyncio.get_event_loop()
        deadline = loop.time() + timeout
        try:
            while True:
                if loop.time() > deadline:
                    raise asyncio.TimeoutError
                try:
                    raw = await asyncio.wait_for(proc.stdout.readline(), timeout=6)
                except asyncio.TimeoutError:
                    emit({"type": "beat", "message": "分析中…"})
                    continue
                if not raw:
                    break
                line = raw.decode("utf-8", "replace").strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                etype = event.get("type")
                if etype == "stream_event" and on_delta is not None:
                    ev = event.get("event") or {}
                    if ev.get("type") == "content_block_delta":
                        d = ev.get("delta") or {}
                        if d.get("type") == "text_delta":
                            piece = d.get("text") or ""
                            if piece:
                                on_delta(piece)
                elif etype == "assistant":
                    for block in (event.get("message", {}).get("content") or []):
                        if block.get("type") == "tool_use":
                            step = _tool_step(block.get("name", ""), block.get("input") or {})
                            if step:
                                if block.get("name") == "WebSearch":
                                    searches += 1
                                emit({"type": "step", "message": step})
                elif etype == "result":
                    text = str(event.get("result") or "").strip()
                    if text:
                        answer = text
                    # 用量只有這個事件帶得出來，錯過就沒有第二次機會。
                    token_ledger.record("llm", event.get("usage") or {},
                                        event.get("total_cost_usd") or 0, model or "")
            await asyncio.wait_for(proc.wait(), timeout=5)
        finally:
            if proc.returncode is None:
                try:
                    proc.kill()
                except ProcessLookupError:
                    pass
        if not answer:
            raise RuntimeError("Claude CLI 未回傳答案")
        if _is_busy(answer):
            # 上限/過載訊息絕不能當成「資料」流進報告給使用者看
            raise LLMBusy()
        return answer
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


# ---- 自我測試：python llm.py "你的問題" ----
if __name__ == "__main__":
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else "用一句話說明什麼是 MES 製造執行系統。"
    async def _main():
        print("claude 可用:", available(), claude_command())
        out = await stream_answer(
            "你是製造業助理，回答精簡務實、只用繁體中文。",
            q, lambda e: print("  [step]", e.get("message")), search=False, timeout=60)
        print("--- 回答 ---")
        print(out)
    asyncio.run(_main())

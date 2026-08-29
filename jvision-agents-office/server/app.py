"""JVision Agents 後端：一支 /run SSE endpoint。
前端（agents-mission 頁）POST {question, mode} → 串流回總指揮調度 4-5 個 agent 的過程與結果。
啟動：python -m jvision-agents-office.server.app  或  python app.py
"""
from __future__ import annotations
import asyncio, json
from aiohttp import web
import llm, orchestrator, registry, systems
import wish
import token_ledger

PORT = 4610


def _cors(resp: web.StreamResponse):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"


async def handle_options(request):
    resp = web.Response()
    _cors(resp)
    return resp


async def handle_health(request):
    resp = web.json_response({"ok": True, "claude": llm.available(), "agents": len(registry.load_agents()),
                              "systems": systems.index().get("total", 0)})
    _cors(resp)
    return resp


# ---- 系統工具層(Phase 2):list_systems / get_system_card / query_data / get_metrics ----
async def handle_systems(request):
    q = (request.query.get("q") or "").strip()
    if q:
        hits = systems.pick_systems(q, top=int(request.query.get("top") or 5))
        body = {"total": len(hits), "systems": [{"score": sc, **s} for sc, s in hits]}
    else:
        body = systems.index()
    resp = web.json_response(body)
    _cors(resp)
    return resp


async def handle_system_card(request):
    c = systems.card(request.match_info["repo"])
    resp = web.json_response(c if c else {"error": "系統不存在或尚未抽取"}, status=200 if c else 404)
    _cors(resp)
    return resp


async def handle_system_data(request):
    repo = request.match_info["repo"]
    table = request.query.get("table")
    if request.query.get("metrics") is not None:
        body = {"repo": repo, "metrics": systems.get_metrics(repo)}
    else:
        body = {"repo": repo, "tables": systems.query_data(repo, table)}
    resp = web.json_response(body)
    _cors(resp)
    return resp


async def handle_run(request):
    # gateway 驗過身分後用標頭帶進來。這裡不自己解 cookie——驗證邏輯只該有一份。
    token_ledger.set_actor(request.headers.get("x-jv-actor", ""))
    try:
        body = await request.json()
    except Exception:
        body = {}
    question = (body.get("question") or "").strip()
    mode = body.get("mode") or "task"
    resp = web.StreamResponse(status=200, headers={
        "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive"})
    _cors(resp)
    await resp.prepare(request)

    if not question:
        await resp.write(b"data: " + json.dumps({"type": "error", "message": "請輸入需求"}).encode() + b"\n\n")
        return resp
    if not llm.available():
        await resp.write(b"data: " + json.dumps({"type": "error", "message": "找不到 Claude CLI，請先安裝並登入"}).encode() + b"\n\n")
        return resp

    queue: asyncio.Queue = asyncio.Queue()
    DONE = object()

    def emit(event: dict):
        queue.put_nowait(event)

    async def worker():
        try:
            await orchestrator.run(question, mode, emit)
        except llm.LLMBusy as ex:
            emit({"type": "error", "message": str(ex)})   # 已是使用者話術
        except Exception:
            # 原始錯誤(英文堆疊/上游訊息)不給使用者看
            emit({"type": "error", "message": "AI 團隊暫時無法回應,請稍後再試,謝謝!"})
        finally:
            queue.put_nowait(DONE)

    task = asyncio.ensure_future(worker())
    try:
        while True:
            event = await queue.get()
            if event is DONE:
                break
            await resp.write(b"data: " + json.dumps(event, ensure_ascii=False).encode("utf-8") + b"\n\n")
    finally:
        if not task.done():
            task.cancel()
    await resp.write_eof()
    return resp


async def handle_wish(request):
    # gateway 驗過身分後用標頭帶進來。這裡不自己解 cookie——驗證邏輯只該有一份。
    token_ledger.set_actor(request.headers.get("x-jv-actor", ""))
    """許願分析：{need} → gemma4 建議適合的 AI 技術 → 存 MySQL（匿名）。"""
    try:
        body = await request.json()
    except Exception:
        body = {}
    need = (body.get("need") or "").strip()[:1000]
    if not need:
        resp = web.json_response({"error": "請描述你的需求"}, status=400)
        _cors(resp); return resp
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, wish.analyze, need)
    except Exception as ex:
        resp = web.json_response({"error": f"AI 分析失敗：{type(ex).__name__}"}, status=502)
        _cors(resp); return resp
    try:
        await loop.run_in_executor(None, wish.save, need, result)
        result["saved"] = True
    except Exception:
        result["saved"] = False
    resp = web.json_response(result)
    _cors(resp); return resp


def make_app():
    app = web.Application()
    app.router.add_post("/run", handle_run)
    app.router.add_options("/run", handle_options)
    app.router.add_get("/health", handle_health)
    app.router.add_post("/wish", handle_wish)
    app.router.add_options("/wish", handle_options)
    app.router.add_get("/systems", handle_systems)
    app.router.add_get("/systems/{repo}/card", handle_system_card)
    app.router.add_get("/systems/{repo}/data", handle_system_data)
    return app


if __name__ == "__main__":
    try:
        wish.ensure_table()
        print("[wish] MySQL 資料表就緒（ai_wish_analysis）")
    except Exception as e:
        print(f"[wish] 警告：資料表建立/連線失敗：{type(e).__name__}: {e}")
    print(f"JVision Agents 後端啟動於 http://localhost:{PORT}  (claude={llm.available()})")
    web.run_app(make_app(), host="127.0.0.1", port=PORT, print=None)

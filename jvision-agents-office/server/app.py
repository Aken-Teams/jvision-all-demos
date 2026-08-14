"""JVision Agents 後端：一支 /run SSE endpoint。
前端（agents-mission 頁）POST {question, mode} → 串流回總指揮調度 4-5 個 agent 的過程與結果。
啟動：python -m jvision-agents-office.server.app  或  python app.py
"""
from __future__ import annotations
import asyncio, json
from aiohttp import web
import llm, orchestrator, registry

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
    resp = web.json_response({"ok": True, "claude": llm.available(), "agents": len(registry.load_agents())})
    _cors(resp)
    return resp


async def handle_run(request):
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
        except Exception as ex:
            emit({"type": "error", "message": str(ex)})
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


def make_app():
    app = web.Application()
    app.router.add_post("/run", handle_run)
    app.router.add_options("/run", handle_options)
    app.router.add_get("/health", handle_health)
    return app


if __name__ == "__main__":
    print(f"JVision Agents 後端啟動於 http://localhost:{PORT}  (claude={llm.available()})")
    web.run_app(make_app(), host="127.0.0.1", port=PORT, print=None)

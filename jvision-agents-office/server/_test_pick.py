import asyncio, sys
sys.path.insert(0, ".")
import orchestrator
async def main():
    team = await orchestrator._pick_team("幫我把今天進來的訂單排成生產工單並派工", "task")
    print("總指揮挑了", len(team), "位：")
    for t in team:
        a = t["agent"]
        print(f"  {a['id']:>5} {a['name']} · {a['role']} [{a['dataMode']}]")
        print(f"        子任務：{t['subtask']}")
asyncio.run(main())

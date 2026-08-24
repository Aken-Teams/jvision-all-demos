# 常駐服務

這些 unit 實際安裝在 `~/.config/systemd/user/`，這裡放一份副本方便查閱與重建。
`caseshow.service`（站台本體）已存在於該目錄，不在此重複。

| Unit | 做什麼 |
|---|---|
| `jvdemo-agent.service` | 每天自動產出 demo 並上架，額度定義在 `docs/_state/agent-quota` |
| `jvdemo-tunnel.service` | `jvdemo.jvision-ai.com` 的 Cloudflare 隧道 |
| `jvdemo-watchdog.timer` | 每 30 分鐘確認 Agent 還在推進 |

## 重建方式

```bash
cp docs/systemd/jvdemo-*.service docs/systemd/jvdemo-*.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now jvdemo-agent jvdemo-tunnel jvdemo-watchdog.timer
loginctl enable-linger "$USER"      # 登出後仍繼續執行
```

## 為什麼需要看門狗

`Restart=always` 只處理「程序死掉」。真正會吃掉一整天的是**卡住**——程序還在、
只是沒有進展。實測 codex 連續逾時六輪，Agent 停了四小時沒人發現，而 systemd
看起來一切正常。

看門狗的判斷刻意保守，只在「明明該動卻沒動」時才重啟：服務沒跑就啟動；今日
額度已滿就什麼都不做（休息中不寫 log 是正常的）；額度未滿而 log 停滯超過 90
分鐘才重啟。一套約 6 分鐘、每日收尾約 12 分鐘，90 分鐘是安全的門檻。

## 改每日額度

```bash
echo 10 > docs/_state/agent-quota
systemctl --user restart jvdemo-agent
```

額度只定義在這一個檔案。Agent 與看門狗都讀它——兩邊各寫一份的話，改一個地方
就會不一致，而不一致的後果是看門狗在額度已滿時仍判定「該動卻沒動」，每天固定
亂重啟一次。

## 隧道刻意不與 bm.nsysugaa.com 共用

`jvdemo-tunnel` 有自己的設定檔與 tunnel ID。共用同一條的話，每次調整 ingress
都得重啟該程序，`bm.nsysugaa.com` 會跟著中斷。

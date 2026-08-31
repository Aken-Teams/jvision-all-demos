# CONTEXT

JVision DEMO（`jvdemo.jvision-ai.com`）的領域模型與用語。

這份檔案給 agent 讀，用來對齊講法。命名不一致造成的誤解，比程式錯誤更難發現
——兩個人講「專案」指的是不同東西，討論會一路歪下去而沒有人察覺。

## 一句話

一個放了 1,944 套純 UI 展示系統的型錄站，客戶挑一套按「模板複製」，
就得到一份**真的能存資料**的副本，之後用講的持續修改它。

## 兩層：型錄 與 平台

這是最重要的分界，弄混會出事。

| | 型錄（展示） | 平台（客戶的） |
|---|---|---|
| 東西在哪 | `demos/<repo>/index.html` | `var/instances/<id>/public/index.html` |
| 誰看得到 | 所有人（匿名可瀏覽） | 只有那家客戶白名單裡的信箱 |
| 可不可以寫 | **永遠唯讀** | 客戶用講的一直在改 |
| 資料 | 硬編在 HTML 裡的假資料 | 自己的 MySQL 資料庫 |
| 網址 | `/demos/<repo>/` | `/-/i/<id>/` 或 `c-<slug>-<系統>.jvision-ai.com` |

**硬性規則**：live runtime 一律不得注入 `demos/`。那是目錄展示品，
一旦被寫壞，全站 1,944 張卡片的預覽就跟著壞。

## 用語

- **demo／專案（project）** — 型錄上的一套展示系統。`repoName` 形如
  `jvision-xxx-yyy`，那是它的身分證，出現在網址、schema 檔名、GitHub repo 名。
- **模板複製** — 客戶把一套 demo 複製成自己的副本。UI 上就叫這四個字，
  不要說「購買」或「加入購物車」（購物車已經拿掉了，`cart.html` 只剩轉址）。
- **實例（instance）** — 複製出來的那一份副本。有自己的資料庫、自己的網址、
  自己的修改歷史。`instanceId` 形如 `i_xxxxxxxx_xxxxxx`。
- **客戶（customer）** — 一家公司。一個客戶可以有多個實例、多個成員信箱。
  成員名單是**公司層級**的，分享一套等於分享全部，這件事要對使用者講清楚。
- **schema** — 一套 demo 的資料表定義（`content/schema/<repo>.json`），
  從 demo 的 HTML 表格反推出來。**沒有 schema 就不能被複製**——複製出來會是
  一個存不了東西的空殼。
- **綁定（binding）** — `shared/jv-live.js` 在實例頁面上，靠 **`<th>` 的文字**
  認出哪張表對應哪個資料表，然後接管它。所以表頭文字是契約，一個字都不能改。
- **換裝（restyle）** — 讓每套 demo 有自己的視覺風格的產線。
- **工作台（workspace）** — `workspace.html`，三欄：我的系統／對話／預覽·資料·程式碼·紀錄·交付。

## 執行時的分工

```
:3000  gateway（tools/dev.mjs）      唯一對外的入口
       ├── Host 是 c-*.jvision-ai.com  → 實例
       ├── 路徑是 /-/i/<id>/           → 實例（同源，工作台的預覽走這條）
       ├── /api/*                      → 站台自己的 API
       └── 其餘                        → 靜態站
:3100  npx serve       型錄站的靜態檔
:4610  python aiohttp  Agents 後端
:4700  app-server      實例的執行時（tools/app-server.mjs）
```

實例身分由 gateway 驗完身分與白名單後，用 `x-jv-instance` **標頭**傳給
app-server，**不從路徑或查詢參數取**——前端傳什麼都跨不到別人的系統。

## 資料放哪

- **控制面**（MySQL `jv_demo_case`，`tools/lib/control-db.mjs`）：
  客戶、成員、訂單、實例登錄、事件、對話。平台自己的中繼資料。
- **各實例**（MySQL `jv_<instanceId>`，`tools/lib/instance-db.mjs`）：
  客戶自己的業務資料。一個實例一個資料庫，隔離靠資料庫邊界而不是 `WHERE tenant_id`。
- **檔案**（`var/instances/<id>/`）：畫面檔、版本、上傳的截圖。
- **狀態檔**（`docs/_state/*.json`）：產線進度。這些**沒有鎖**，
  並發寫入會 lost update，所以只有單一擁有者能寫。

## 修改一套系統的三條路

客戶說一句話，`tools/lib/instance-chat.mjs` 把它翻成**一個**動作：

1. `add_column` / `rename_column` / `rename_system` — 當場生效，秒級。
2. `edit_page` — 動到程式與畫面，走 `tools/lib/instance-edit.mjs`，分鐘級的背景工作。
3. `none` — 做不到的收成待辦，寫進控制面的 events。

`edit_page` 先試**取代區塊**（模型只回「把這段換成那段」），套不進去才退回
整份重寫。理由是正確性不是速度：整份重寫時模型會在你沒看的地方打錯字
（實測過一次把 `&gt;` 打成 `&gt`，五道護欄全過、頁面照常顯示）。

每次成功的修改都留一個版本（`var/instances/<id>/versions/`），回得去。

## 五道護欄

任何對實例畫面的自動修改，過不了就整份還原：

1. 所有 `<table>` 的 `<th>` 文字指紋不變 —— 那是資料綁定的依據
2. `jv-live:start` / `jv-live:end` 標記還在 —— 拿掉客戶就再也改不了它
3. 畫面數（`data-i`）不減少
4. 本地腳本只允許 `./_jv/` 底下那三支
5. 不准 `setInterval`

## 已知的坑

- **Tailwind 的 display 工具類會壓過 `[hidden]`**。每個用 Tailwind CDN 的頁面
  都必須自己補 `[hidden]{display:none!important}`，否則所有隱藏區塊會同時顯示。
- **`appendCookie()` 是強制的**。用 `setHeader` 會蓋掉前一個 `Set-Cookie`。
- **`jv_visitor` 是 host-only + SameSite=Lax**。跨站 iframe 不會帶 cookie，
  所以工作台的預覽必須走同源的 `/-/i/<id>/`。
- **實例的 `_jv/` 是複製而不是連結 `shared/`**（交付出去要能獨立跑）。
  改了 `shared/jv-*.js` 之後要跑 `tools/instance-refresh-runtime.mjs`，
  否則已開通的實例還帶著舊的那份，而且不會有任何訊息告訴你。
- **codex 把整份 prompt 印到 stderr**，所以不能拿 `stderr.slice(-500)` 當錯誤訊息。
- **codex 併發下 bubblewrap 會開不出 user namespace**，那是環境問題不是內容問題。
- **前端資源改版要 bump `?v=`**，Cloudflare 曾送過舊的 `app.js`。

## 驗收

```bash
node tools/check-previews.mjs --render   # 全站預覽，要 1944/1944
node tools/scan-console-errors.mjs       # 要 0
node tools/instance-verify.mjs --count=20
curl -sI https://bm.nsysugaa.com         # 必須 200（獨立站，絕不能被影響）
```

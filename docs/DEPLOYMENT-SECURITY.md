# 從開發到部署：完整流程、資源影響與待處理事項

> 盤點日期 2026-09-03。每一項都附了檔案與行號，可以逐項打開對照。
>
> 這份文件回答三個問題：
> 1. 使用者按下一顆按鈕之後，**實際上在幾個地方留下了東西**
> 2. 那些東西分別**掛在誰的帳上**（我們的主機／Cloudflare／Vercel／GitHub／MySQL）
> 3. 因此**刪除功能要拆掉什麼**、**資源要怎麼規劃**、**哪些事情要先做**

---

## 目錄

- [一、全景：一套系統有四種存在形式](#一全景一套系統有四種存在形式)
- [二、流程 ①　模板複製（開通）](#二流程-模板複製開通)
- [三、流程 ②　在工作台修改](#三流程-在工作台修改)
- [四、流程 ③　分享給同事](#四流程-分享給同事)
- [五、流程 ④　部署到 Vercel](#五流程-部署到-vercel)
- [六、流程 ⑤　交付到 GitHub](#六流程-交付到-github)
- [七、資源總表：一個實例最多散落在 11 個地方](#七資源總表一個實例最多散落在-11-個地方)
- [八、資源規劃：MySQL／Cloudflare／Vercel／GitHub](#八資源規劃mysqlcloudflarevercelgithub)
- [九、待處理問題](#九待處理問題)
- [十、刪除功能該怎麼做](#十刪除功能該怎麼做)
- [十一、建議順序](#十一建議順序)

---

## 一、全景：一套系統有四種存在形式

同一套系統在不同階段是**四份不同的東西**，很容易混淆，先把它們分清楚：

| # | 名字 | 位置 | 資料 | 誰看得到 | 誰建立的 |
|---|---|---|---|---|---|
| 1 | **型錄 demo** | `demos/<repo>/index.html` | 無（寫死的假資料） | 全世界（型錄站） | agent 產線 |
| 2 | **實例** | `var/instances/<id>/` ＋ MySQL `jv_<id>` | 客戶的真實資料 | Google 登入 ＋ 該公司白名單 | 模板複製 |
| 3 | **公開版** | Vercel ＋ MySQL `jv_<id>_pub` | 真實資料的**複本** | **任何拿到連結的人** | 「部署到 Vercel」 |
| 4 | **交付版** | GitHub `JVision-pj/<repo>-<id6>` | 無（只有結構與種子） | 我們的 GitHub 組織成員 | 「交付到 GitHub」 |

**關鍵界線**：第 1 份是唯讀展示品，`instance-bind.mjs:56-63` 有一道硬性檢查，
任何寫入路徑落在 `demos/` 底下都會直接丟例外——不是靠註解自律。
第 2～4 份都是它的下游產物，改哪一份都不會回頭汙染型錄。

---

## 二、流程 ①　模板複製（開通）

> **這是使用者按「模板複製」時真正發生的事。**
> 很多人以為 DNS／子網域是部署階段才發生的——**不是，是這一步。**

### 觸發路徑

```
catalog.html 卡片上的「模板複製」
  → app.js:517         POST /api/templates/copy { repoName }
  → dev.mjs:415-446    建 customer + order，然後 execFileSync
  → tools/instance-provision.mjs --order=<單號>
```

### 逐步做了什麼

| 步驟 | 程式 | 建立的東西 | 在誰的帳上 | 可回收？ |
|---|---|---|---|---|
| 1 | `dev.mjs:428` | `customers` 一列（若首次） | 我們的 MySQL | 沒有程式 |
| 2 | `dev.mjs:429` | `orders` 一列（`note: 從目錄一鍵複製`） | 我們的 MySQL | 沒有程式 |
| 3 | `instance-provision.mjs:37-44` | 決定子網域 `c-<公司>-<系統>.jvision-ai.com` | — | — |
| 4 | `instance-provision.mjs:85` | **`instances` 一列**（含 `host`、`db_name`、`dir`） | 我們的 MySQL | ✅ `destroyInstance()` |
| 5 | `instance-bind.mjs:76-105` | **檔案目錄 `var/instances/<id>/`** | 我們的主機磁碟 | ❌ 只有 `instance-verify` 自己清測試用的 |
| 6 | `instance-db.mjs:35` | **專屬資料庫 `jv_<id>`** ＋ 建表 ＋ 灌種子資料 | 我們的 MySQL | ✅ `destroyInstance()` → `DROP DATABASE` |
| 7 | `instance-provision.mjs:55-66` | **Cloudflare DNS 記錄**（`cloudflared tunnel route dns`） | **Cloudflare 公司帳號** | ❌ **完全沒有** |
| 8 | `instance-provision.mjs:95` | `events` 一列 `instance.live` | 我們的 MySQL | ❌ 沒有級聯刪除 |

### `var/instances/<id>/` 裡面到底是什麼

你問的這一點——它**不是**資料庫的 ID 資訊，是**這套系統的網頁本體**：

```
var/instances/i_mtegnuqu_db3c75/
├── public/
│   ├── index.html          ← demo 的 HTML 複本，尾端注入了三支 runtime script
│   └── _jv/
│       ├── live.js         ← 把畫面上的 <table> 接到真資料庫（shared/jv-live.js 的複本）
│       ├── assist.js       ← 右下角的修改助理
│       ├── tour.js         ← 第一次進來的導覽
│       ├── tour.json       ← 導覽要講的內容（標題、欄位名）
│       ├── schema.json     ← 資料表定義的複本，交付時客戶要看得懂自己的結構
│       └── favicon.svg
├── uploads/                ← 客戶在系統裡上傳的檔案（25 個實例中有 5 個有東西）
└── README.md
```

三支 runtime 是**複製**進去而不是連回站台，因為實例交付出去之後是獨立部署的
（`instance-bind.mjs:79-81` 的註解寫得很清楚）。

目前 25 個實例共 5.7MB。**磁碟不是瓶頸，`uploads/` 裡的客戶檔案才是刪除時要注意的**——
那是唯一一份，資料庫裡沒有副本。

### Cloudflare 那一段：你的理解要修正

你問「這是佈署以後他會放到公司 CLOUDFLARE 的 TUNNEL 上？」——

**不是部署以後，是模板複製的當下就建了。** 而且 tunnel 本身不用動，
因為 `~/.cloudflared/jvdemo.yml` 的 ingress 已經有一條萬用規則：

```yaml
- hostname: "*.jvision-ai.com"
  service: http://127.0.0.1:3000
```

所以新增客戶是**零基礎設施動作**——tunnel 不必改、不必重啟。
`instance-provision.mjs` 那一步建的是 **Cloudflare 的 DNS 記錄**（CNAME 指向 tunnel），
只是讓那個子網域「解析得到」。

刻意不用萬用 DNS（`*.jvision-ai.com`）的理由寫在 `instance-provision.mjs:46-52`：
萬用 DNS 會把整個公司網域的任何子網域都指到這條 tunnel，`www` 與 `app`
那些真正的服務只要哪天記錄出問題就會被接管。

**後果**：現在 25 個實例 = Cloudflare 上 25 筆 DNS 記錄，**一筆都沒被回收過**。
而且 `pickHost()` 撞名會加序號（`-2`、`-3`），所以刪掉再重建同一套系統，
網址會變成 `c-xxx-2.jvision-ai.com`，舊那筆繼續留著。

---

## 三、流程 ②　在工作台修改

這一步**不建立任何外部資源**，全部落在我們自己的 MySQL 裡。

| 動作 | 落在哪 |
|---|---|
| 對話 | `jv_demo_case.chat_sessions` / `chat_messages` |
| 改欄位、改名稱 | `jv_<id>` 的實際資料表 ＋ `jv_<id>.jv_audit` |
| 版本快照 | `instance-versions.mjs` |
| 貼截圖 | `var/instances/<id>/uploads/` |

請求怎麼進來（兩個入口共用同一套把關，`dev.mjs:308-330`）：

```
①  https://jvdemo.jvision-ai.com/-/i/<id>/...      內部備援，不必動 DNS
②  https://c-<公司>-<系統>.jvision-ai.com/...      客戶對外用的網址
        ↓  gateway（dev.mjs）驗 Google 身分 ＋ 公司白名單
        ↓  用標頭 x-jv-instance 傳實例身分（不從路徑或 query 取）
   app-server.mjs（綁 127.0.0.1:4700）
```

**這裡的隔離設計是好的**：實例身分只從標頭來，前端傳什麼都跨不到別的實例；
`app-server` 綁 127.0.0.1 且自己再擋一次（縱深防禦）。
兩層都已經認得 `state === "archived"` 並回 410（`dev.mjs:276`、`app-server.mjs:101`）——
這一點對後面的刪除功能很重要。

---

## 四、流程 ③　分享給同事

`dev.mjs:700-708`。只寫一列 `members`，沒有外部資源。

**但有一個要注意的語意**：名單是**公司層級**的，不是單套系統。
加一個人進來，他會看到你們公司底下**所有**的系統。UI 上已經寫了這句話，
但它是產品決策，未來要做「只分享一套」得改資料模型。

---

## 五、流程 ④　部署到 Vercel

> **這是唯一產生「公開、免登入網址」的路徑，也是所有資安問題的集中處。**

### 觸發路徑

```
workspace.html 交付分頁的「部署到 Vercel」
  → POST /api/me/instances/<id>/vercel
  → dev.mjs:712-721   驗 owner 身分，然後 execFileSync（同步等，最多 15 分鐘）
  → tools/instance-deploy-vercel.mjs --instance=<id>
```

### 逐步做了什麼

| 步驟 | 程式 | 建立的東西 | 在誰的帳上 |
|---|---|---|---|
| 1 | `instance-deploy-vercel.mjs:118` | **第二個資料庫 `jv_<id>_pub`**，`CREATE TABLE LIKE` ＋ `INSERT SELECT` 整份複製 | 我們的 MySQL |
| 2 | `nextjs-bundle.mjs` | 把單檔 HTML 組成一個真的 Next.js 專案（App Router、`/api/t/[table]` 真路由） | 暫存目錄，用完即刪 |
| 3 | `:159` | **Vercel 專案**（`vercel link --project <name>`） | **Vercel 公司帳號** |
| 4 | `:167-175` | **production 環境變數**：`MYSQL_HOST/PORT/USER/PASSWORD` ＋ `MYSQL_DB=<pub>` | **Vercel 公司帳號** |
| 5 | `:181` | 部署（`vercel deploy --prod`） | Vercel |
| 6 | `:194` | 關掉 Vercel 的 SSO 保護（不關的話連擁有者自己都會被 302 到 vercel.com） | Vercel |
| 7 | `:219` | `events` 一列 `instance.vercel_deployed`，`detail_json` 裡才有 `url` 與 `project` | 我們的 MySQL |

### ⚠️ Vercel 專案名會跨客戶撞名

`instance-deploy-vercel.mjs:105`：

```js
const project = `jv-${inst.repo_name.replace(/^jvision-/, "").replace(/[^a-z0-9-]/g, "-")}`
  .slice(0, 52).replace(/-+$/, "");
```

專案名是從 **`repo_name`** 推的，**不含 instance id**。

後果：
- 兩個客戶都複製了同一套 demo → **同一個 Vercel 專案名**
- B 客戶按部署 → **覆蓋掉 A 客戶的線上站**（連 env 裡的 `MYSQL_DB` 都被改成 B 的）
- 未來加上刪除功能 → 刪 A 會**刪掉 B 正在用的站**

對照組：GitHub 交付的 repo 名是 `<repo>-<id 後 6 碼>`（`instance-deliver.mjs:151`），
**有帶 id**，所以不會撞。Vercel 這條是漏掉了。

### 資料的流向

```
jv_<id>（客戶真實資料）
   │  CREATE TABLE LIKE + INSERT SELECT   ← 單向，每次部署整份重來
   ↓
jv_<id>_pub  ←─ Vercel 上的公開站讀寫這一份
```

單向是對的（公開版寫入碰不到真資料）。
**但內容就是客戶的真實業務資料**，只是換了個 schema——公開讀取等於資料揭露。
詳見[問題 3](#3-公開的是真實資料的複本)。

---

## 六、流程 ⑤　交付到 GitHub

### ⚠️ 你的理解要修正：repo **不是**建在客戶自己的 GitHub

`instance-deliver.mjs:40`：

```js
const OWNER = args.owner || process.env.GITHUB_DELIVER_OWNER || "JVision-pj";
```

repo 建在 **`JVision-pj`——我們自己的 GitHub 組織**（`:202` 打的是 `/orgs/<OWNER>/repos`），
預設 **private**（`:35`，要公開得明講 `--public`，這個預設是對的）。

**所以工作台上「把這套系統推成一個你自己的 repo」這句文案是誤導的**——
客戶對那個 repo 沒有任何權限，除非有人手動把他加進組織。要嘛改文案，
要嘛做成「填入你的 GitHub 帳號 → 用 `--owner` 推到你那邊 ／ 建完自動邀請你當 collaborator」。

### 交付的內容

不是原始碼快照，是**可以自己跑起來的東西**：畫面、後端、資料表定義、
Docker 設定、CI。客戶 `docker compose up -d` 就能用，我們的主機關掉也不影響他。

**沒有推任何密碼上去**——`tools/templates/deliver/` 的樣板連線資訊全走環境變數，
README 教他 `cp .env.example .env` 自己填。這一點做得對。

| 建立的東西 | 在誰的帳上 | 可回收？ |
|---|---|---|
| GitHub repo `JVision-pj/<repo>-<id6>` | **我們的 GitHub 組織** | ❌ 沒有 |
| `instances.repo_url` 欄位 | 我們的 MySQL | ✅ 跟著實例走 |

---

## 七、資源總表：一個實例最多散落在 11 個地方

| # | 資源 | 何時建立 | 在誰的帳上 | 現有回收程式 |
|---|---|---|---|---|
| 1 | `instances` 一列 | 模板複製 | 我們 MySQL | ✅ `destroyInstance()` |
| 2 | 資料庫 `jv_<id>` | 模板複製 | 我們 MySQL | ✅ `destroyInstance()` |
| 3 | 檔案 `var/instances/<id>/` | 模板複製 | 我們磁碟 | ❌ |
| 4 | └ `uploads/` 客戶上傳的檔 | 使用中 | 我們磁碟 | ❌ **唯一一份** |
| 5 | **Cloudflare DNS 記錄** | 模板複製 | **Cloudflare** | ❌ |
| 6 | `orders` 一列 | 模板複製 | 我們 MySQL | ❌ |
| 7 | `events` 多列 | 全程 | 我們 MySQL | ❌ |
| 8 | `chat_sessions` / `chat_messages` | 使用中 | 我們 MySQL | ❌ **含使用者輸入** |
| 9 | 資料庫 `jv_<id>_pub` | 部署 Vercel | 我們 MySQL | ❌ |
| 10 | **Vercel 專案 ＋ production env（含 DB 密碼）** | 部署 Vercel | **Vercel** | ❌ |
| 11 | **GitHub repo** | 交付 GitHub | **我們的 GitHub 組織** | ❌ |

**現況：`destroyInstance()` 只處理了 11 項裡的 2 項。**

```js
// tools/lib/control-db.mjs:576
export async function destroyInstance(id) {
  const inst = await getInstance(id);
  if (!inst) return false;
  await dropDatabase(inst.db_name);            // ← 第 2 項
  await q("DELETE FROM instances WHERE id = ?", [id]);   // ← 第 1 項
  return true;
}
```

它原本只是給 `instance-verify.mjs` 清自己造的測試實例用的（`:187`），
**不是為使用者的「刪除」設計的**。今天照原樣接上去，結果會是：

> 主資料庫沒了，但 **Vercel 上那個站還活著、還對外公開、env 裡還握著完整的
> MySQL 帳密**，而且它讀的 `jv_<id>_pub` 也還在。DNS 記錄、GitHub repo、
> 客戶上傳的檔案、對話紀錄全部留著。

**這比不做刪除更糟。**

---

## 八、資源規劃：MySQL／Cloudflare／Vercel／GitHub

### MySQL

現況（全部住在 `sharemysql.theaken.com` 同一台）：

```
sharemysql.theaken.com
├── db_Survey            許願池（.env 的 MYSQL_*）
├── jv_demo_case         控制面：customers / members / orders / instances /
│                        events / quotas / chat_sessions / chat_messages / profiles
├── jv_<id> × 25         每個實例的業務資料
└── jv_<id>_pub × N      部署到 Vercel 的公開副本
```

每複製一套系統 **+1 個資料庫**；每部署一次 **再 +1**。這個成長是線性的，
共用主機遲早會撞到 schema 數或連線數上限。

**規劃建議**：

| 何時 | 做什麼 | 程式碼要改什麼 |
|---|---|---|
| 現在 | 建 `jv_pub` 專用帳號，只授權 `jv_%_pub` | `instance-deploy-vercel.mjs` 那 5 行 |
| 現在 | 許願池 `db_Survey` 搬走 | **只改 `MYSQL_HOST`**，零程式改動 |
| 定案時 | `JV_MYSQL_*` 整組搬到專用主機 | 改變數 ＋ 資料遷移，零程式改動 |
| 徹底隔離 | 控制面與實例再拆成兩台 | 要改 `tools/lib/mysql.mjs`——它現在只有一個連線池 |

`.env` 本來就是 `MYSQL_*` 與 `JV_MYSQL_*` 兩組獨立變數，前兩項幾乎是免費的。

### Cloudflare

- tunnel 只有一條（`1909ee29-...`），ingress 是萬用規則，**新增客戶不必動它**
- 每個實例一筆 DNS 記錄，目前 25 筆，**零回收**
- `~/.cloudflared/jvdemo.yml` 裡還留著舊的第四層命名 `*.c.jvdemo.jvision-ai.com`，
  註解說「等全部搬完再拿掉」——這是一筆待清的技術債
- 只能三層（`c-xxx.jvision-ai.com`），因為免費 Universal SSL 只簽一層萬用，
  四層沒憑證、瀏覽器 TLS 直接握手失敗

**規劃建議**：把 `routeDns()` 的反向操作補起來（`cloudflared tunnel route dns --overwrite-dns`
沒有刪除子命令，要走 Cloudflare API 的 `DELETE /zones/<zone>/dns_records/<id>`），
並在 `instances` 記下 DNS record id，否則刪除時要靠 host 反查。

### Vercel

- 一個公司帳號，專案名目前**會跨客戶撞名**（見上）
- 每個專案的 production env 裡有一份完整的 MySQL 憑證
- 部署是同步執行、最多等 15 分鐘（`dev.mjs:715`），一次只能跑一個

**規劃建議**：
1. 專案名改成 `jv-<repo>-<id 後 6 碼>`（跟 GitHub 一致）
2. `vercel_project` / `vercel_url` 存進 `instances` 表——現在只躺在 `events.detail_json` 裡，
   刪除時撈不到
3. 換成部署專用的 MySQL 帳號

### GitHub

- repo 建在 `JVision-pj` 組織下，private，名稱含 instance id（**不會撞名**）
- 沒有推任何密碼
- **但客戶對它沒有權限**——文案要改，或要做真正的「推到客戶自己的帳號」

---

## 九、待處理問題

排序依「不修的後果」而不是「修起來多快」。

### 1. 公開部署的憑證可以觸及整個平台

**嚴重度：最高。這是唯一一項「單點失守會波及所有客戶」的。**

`tools/instance-deploy-vercel.mjs:167-171`：

```js
["MYSQL_HOST", env("MYSQL_HOST")], ["MYSQL_PORT", env("MYSQL_PORT")],
["MYSQL_USER", env("MYSQL_USER")], ["MYSQL_PASSWORD", env("MYSQL_PASSWORD")],
["MYSQL_DB", pubDb],
```

帳號密碼是從 `.env` **原封不動**送過去的，只有「預設資料庫」被縮小到 `<實例>_pub`。

問題在於 **MySQL 的權限綁在帳號上，不是綁在預設資料庫上**。同一個帳號連進去之後
`USE` 別的資料庫是擋不住的。而且那組帳號確定權限很大——部署流程自己會呼叫
`createDatabase()` 建立 `_pub` 資料庫，也就是它有 `CREATE DATABASE`。

實際核對過資料庫的使用者清單，非系統帳號只有 `A999@%` 與 `aken@%`，
而 `.env` 裡 `MYSQL_*`（許願池）與 `JV_MYSQL_*`（控制面＋所有實例）**用的都是 A999**。
沒有任何分權。

**結論**：現在有一個公開、無身分驗證的 Vercel 應用，持有可以讀寫
`jv_demo_case`（客戶、成員、訂單、對話）與每一個 `jv_<實例>` 的憑證。

#### 怎麼修

```sql
CREATE USER 'jv_pub'@'%' IDENTIFIED BY '<夠長的隨機密碼>';
GRANT SELECT, INSERT, UPDATE, DELETE ON `jv\_%\_pub`.* TO 'jv_pub'@'%';
```

然後在 `.env` 加 `PUB_MYSQL_USER` / `PUB_MYSQL_PASSWORD`，把那五行改成讀這一組。
注意 `mirrorDatabase()` 需要 `CREATE DATABASE`，所以**建庫仍用管理帳號、部署出去的用 `jv_pub`**。

**成本**：約半小時，零應用程式邏輯改動。
**擋掉的**：把「平台級外洩」降成「單一 demo 外洩」。

### 2. 公開網址可以刪光資料，沒有任何身分驗證

`tools/lib/nextjs-bundle.mjs` 產生的 API：

| 端點 | 行號 | 作用 |
|---|---|---|
| `GET /api/t/<表>` | 199 | 讀任何一張表 |
| `POST /api/t/<表>` | 212 | 新增 |
| `PATCH /api/t/<表>/<id>` | 230 | 修改 |
| `DELETE /api/t/<表>/<id>` | 245 | 刪除 |

四個都沒有身分檢查，也沒有限流——整份檔案裡沒有出現過 `authorization`。
任何人拿到那個網址，就能把整套系統的資料刪光；而那是客戶要拿去給人看的東西。

#### 怎麼修（兩選一）

- **公開版唯讀**：`nextjs-bundle.mjs` 不產生 `POST`/`PATCH`/`DELETE` 三個 handler。
  要給人看的 demo，多半不需要對方能寫。
- **寫入端加 token**：部署時產生一組，寫進環境變數，前端帶在標頭上。

另外建議加上限流，避免有人反覆呼叫把資料庫打滿。

### 3. 公開的是真實資料的複本

`instance-deploy-vercel.mjs` 的註解寫著「公開的那份完全能用，但碰不到客戶真正的資料」——
這句話**只保護了寫入方向**。`mirrorDatabase()`（`:46-58`）是
`CREATE TABLE LIKE` ＋ `INSERT SELECT` 整份複製，**內容就是客戶的真實業務資料**
（名單、訂單、報價），只是放在另一個 schema。公開讀取等於資料揭露。

#### 怎麼修

在按下部署之前明確告訴客戶「這會把目前的資料複製到一個公開網址」，
並提供「只帶結構不帶資料」的選項（`CREATE TABLE LIKE` 之後不做 `INSERT SELECT`）。

這是產品決定，不只是技術決定。

### 4. Vercel 專案名跨客戶撞名

見[第五節](#-vercel-專案名會跨客戶撞名)。

**現在的後果**：B 客戶部署會覆蓋 A 客戶的線上站。
**加上刪除之後的後果**：刪 A 會刪掉 B 正在用的站。

#### 怎麼修

`instance-deploy-vercel.mjs:105` 改成含 instance id：

```js
const project = `jv-${inst.repo_name.replace(/^jvision-/, "")}-${inst.id.slice(-6)}`
  .replace(/[^a-z0-9-]/g, "-").slice(0, 52).replace(/-+$/, "");
```

**注意**：改了之後既有的部署會變成孤兒專案（舊名字的專案還在 Vercel 上、還公開、
env 還有密碼）。改名的同時要人工去 Vercel 後台清掉舊的，或寫一支一次性的搬遷腳本。

**成本**：程式一行，但要配一次人工清理。**必須在做刪除功能之前完成。**

### 5. 沒有任何外部資源的回收路徑

見[第七節](#七資源總表一個實例最多散落在-11-個地方)。11 項資源只有 2 項有回收程式。

### 6. 「交付到 GitHub」的文案與實際行為不符

見[第六節](#-你的理解要修正repo-不是建在客戶自己的-github)。
repo 建在我們的組織下，客戶沒有權限，但 UI 說「你自己的 repo」。

### 7. 所有資料庫住在同一台伺服器

見[第八節](#mysql)。加上問題 1，等於「公開應用的憑證」與「公司其他重要資料」在同一台機器上。

### 附帶：`.env` 裡該輪替的憑證

以下曾出現在截圖中，建議直接換發：

- `VERCEL_TOKEN`
- `GITHUB_TOKEN`
- `OLLAMA_API_KEY`
- `MYSQL_PASSWORD` / `JV_MYSQL_PASSWORD`（同一組 A999，現值只有四位數）

`.env` 不在版控裡，換完不需要改任何程式碼。

---

## 十、刪除功能該怎麼做

### 分成兩段，不要一步到位

#### 第一段：封存（現在就能做，可逆，不碰任何外部資源）

**基礎建設已經全部就緒，只差有人去設定那個狀態：**

| 已經有的 | 位置 |
|---|---|
| `instances.state` 欄位 | `control-db.mjs:65` |
| `instances.archived_at` 欄位 | `control-db.mjs:69` |
| 所有查詢都已經 `WHERE state <> 'archived'` | `control-db.mjs:478, 541, 563, 573` |
| gateway 認得並回 410 | `dev.mjs:276` |
| app-server 認得並回 410 | `app-server.mjs:101` |

**要寫的只有**：一支 `POST /api/me/instances/<id>/archive`（驗 owner）
呼叫 `setInstanceState(id, "archived", { archived_at: now })`，
以及工作台上的一顆按鈕 ＋ 一個確認對話框。

效果：從「我的專案」消失、對外網址回 410、資料一個位元組都沒動、隨時可以還原。

**這一段不依賴部署流程定案，可以馬上做。**

#### 第二段：硬回收（要等部署定案）

真正的 `DELETE` 要按這個順序拆（**由外而內，先斷對外暴露再刪資料**）：

```
1. Vercel 專案      ← 先斷。最公開、風險最高、還握著密碼
   （前提：專案名要能唯一對應到這個實例 → 問題 4 必須先修）
2. Cloudflare DNS   ← 斷對外解析
3. jv_<id>_pub      ← DROP，公開副本
4. GitHub repo      ← 要不要刪是產品決定（客戶可能還要）
5. var/instances/<id>/  ← 含 uploads/，客戶上傳的檔案是唯一一份，
                          建議先打包成一個 zip 交給客戶再刪
6. chat_sessions / chat_messages / events   ← 級聯刪除
7. jv_<id>          ← DROP，主資料庫
8. instances / orders 那幾列
```

**每一步都要冪等**，中間失敗可以重跑——這是整個 codebase 一致的原則
（`instance-provision.mjs` 開頭就寫了「共用主機的連線會斷，重跑比回滾實際」）。

#### 解鎖第二段所需的最小改動

| # | 改什麼 | 為什麼是刪除的前置條件 |
|---|---|---|
| 1 | Vercel 專案名加 instance id | 不改的話刪 A 會刪到 B |
| 2 | `instances` 加 `vercel_project` / `vercel_url` 欄位 | 現在只在 `events.detail_json` 裡，撈不到 |
| 3 | `instances` 加 `dns_record_id` 欄位 | 不然要靠 host 去 Cloudflare API 反查 |

三件都是小改動，但**都必須在刪除功能上線前完成**。

---

## 十一、建議順序

| 順位 | 做什麼 | 為什麼 | 大約成本 |
|---|---|---|---|
| 1 | **封存功能** | 使用者現在就要，可逆，零外部依賴，後端幾乎已經寫好 | 半天 |
| 2 | **問題 1**：建 `jv_pub` 專用 MySQL 帳號 | 不搬家、不停機，只換一組憑證，卻擋掉最嚴重的路徑 | 半小時 |
| 3 | **問題 4**：Vercel 專案名加 id ＋ 人工清舊專案 | 現在就在覆蓋客戶的站；也是刪除的前置條件 | 一小時 ＋ 人工清理 |
| 4 | **問題 2**：公開版唯讀 或 寫入加 token | 客戶拿去給人看的東西，不該能被路人刪光 | 半天 |
| 5 | 補 `vercel_project` / `dns_record_id` 欄位 | 刪除的前置條件 | 一小時 |
| 6 | **硬刪除功能** | 前面五項的總和 | 一到兩天 |
| 7 | **問題 3**：部署前的資料揭露告知 ＋「不帶資料」選項 | 產品決定，要跟客戶對齊預期 | 討論為主 |
| 8 | **問題 6**：GitHub 交付的文案或行為 | 現在是誤導，但沒有立即風險 | 看選哪條路 |
| 9 | **問題 7**：資料庫搬遷 | 等部署架構定案一起規劃 | 依範圍 |

**第 1 項與第 2 項互不相干，可以同時做。**
第 6 項（硬刪除）在第 3、5 項完成前不要動——那會把「刪自己的東西」變成「刪到別人的東西」。

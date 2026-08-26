# 用 Google 帳號登入後台

程式已經寫好，缺的只有 Google 那邊的用戶端憑證——那個只能由帳號持有人申請。

## 一、建立 OAuth 用戶端

1. 開 <https://console.cloud.google.com/apis/credentials>
2. 若還沒有專案，先建一個（名稱隨意，例如 `jvdemo`）
3. 左側「OAuth 同意畫面」→ User Type 選 **外部** → 填應用程式名稱與聯絡信箱 → 儲存
   （只有白名單內的人能真正進後台，所以不必送審發布，維持「測試」狀態即可；
   測試狀態下要把自己的帳號加進「測試使用者」）
4. 「憑證」→ 建立憑證 → **OAuth 用戶端 ID** → 應用程式類型選 **網頁應用程式**
5. **已授權的重新導向 URI** 填這一行，一個字都不能差：

   ```
   https://jvdemo.jvision-ai.com/api/admin/google/callback
   ```

6. 建立完成後會拿到 **用戶端 ID** 與 **用戶端密鑰**

## 二、填進設定檔

`var/admin.json`（已 gitignore、權限 600）：

```json
{
  "google": {
    "clientId": "…….apps.googleusercontent.com",
    "clientSecret": "……",
    "allowedEmails": ["jasmine149131@gmail.com"]
  }
}
```

```bash
systemctl --user restart caseshow
```

重啟後登入頁就會出現「使用 Google 帳號登入」。

## 白名單是這件事最重要的部分

OAuth 只證明「這個人是某個 Google 使用者」，**不代表這個人可以管理這個站**。
沒有白名單的話，地球上任何一個 Google 帳號都能登入你的後台。

所以 `allowedEmails` 空的時候一律拒絕——寧可沒人進得來，也不要誰都進得來。
要多開放給同事，就把信箱加進陣列再重啟。

## 兩個地方會用到 Google 登入

同一組 OAuth 用戶端服務兩種流程，回呼網址只需要註冊上面那一個。

| 進入點 | 誰能通過 | 換到什麼 |
|---|---|---|
| 站台入口（`/welcome`） | **任何 Google 帳號**，或直接選訪客 | 進站身分 `jv_visitor` |
| 後台登入（`/admin-login`） | 只有 `allowedEmails` 名單內的信箱 | 後台身分 `jv_admin` |

兩者刻意分開：**用 Google 登入只證明「你是誰」，不代表你能管理這個站**。
若某個信箱同時在白名單內，從站台入口登入時會一併發後台身分——反正他走後台
登入也會過，讓他多按一次並沒有多換到任何安全性。

站台入口的訪客身分是刻意放行的：這是對外的展示站，把潛在客戶擋在門外就本末
倒置了。具名登入的意義在於「願意留下身分的人，後台看得到他看了哪些系統」。

## 密碼登入保留

兩種方式並存，換到的是同一組 session cookie，後台其他地方不必分辨你是怎麼進來的。

保留密碼的理由不只是備援：Google 不接受私有 IP 當重新導向位址，所以
**區網直連 `http://192.168.21.52:3000` 時只能用密碼**，Google 登入必須走
`https://jvdemo.jvision-ai.com`。

## 已經驗過的行為

| 情況 | 結果 |
|---|---|
| 沒設定憑證 | 登入頁不顯示按鈕；直接打 `/api/admin/google/start` 回 503 |
| 設定後按登入 | 302 導向 Google，帶 state、nonce、`prompt=select_account` |
| 偽造 state 的回呼 | 擋下，退回登入頁並顯示「登入連結已失效」 |
| 使用者在 Google 按取消 | 退回登入頁並顯示 `Google 回報：access_denied` |
| 信箱不在白名單 | 擋下，訊息寫明是哪個信箱被拒 |
| 白名單為空 / 缺欄位 / 空信箱 | 一律拒絕 |

`state` 用過即丟，10 分鐘未使用自動失效；`nonce` 與 `aud`、`iss` 都會比對。

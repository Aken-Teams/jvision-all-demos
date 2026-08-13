# 專案詳細頁內容稽核報告（Detail Content Audit）

產出日期：2026-08-13
稽核對象：463 個目錄專案於「專案詳細頁」([project.html](../project.html)) 的呈現內容
資料來源：[projects-index.json](../projects-index.json)、[content/practical-scenarios.json](../content/practical-scenarios.json)、[shared/system-content.js](../shared/system-content.js)

---

## 結論摘要

| 項目 | 結果 |
|------|------|
| 是否有精確重複專案 | **無**。463 個專案的 `title / description / businessSituation / dailyUse` 全部唯一 |
| 是否有近似重複 | **無**。同型別 description 最高 cosine 相似度僅 **0.619**，0 對達到 0.72 門檻 |
| 真正的問題 | **呈現層公版化**：欄位數量固定、功能模組多案共用、整段內容寫死在 HTML |
| 已有卻未使用的豐富資料 | **400 個專案**的真實 records/例外/決策規則躺在 `practical-scenarios.json`，詳細頁完全沒讀取 |

→ **不需刪任何專案**。工作重點是「去公版化 + 深化資料 + 豐富呈現」。

---

## 1. 重複稽核（回答「有沒有重複」）

以正規化後字串比對：

| 欄位 | 重複群組數 | 冗餘紀錄數 |
|------|-----------|-----------|
| title | 0 | 0 |
| description | 0 | 0 |
| businessSituation | 0 | 0 |
| dailyUse | 0 | 0 |

同型別 description bi-gram cosine 相似度前五名（皆低於 0.72，屬正常同領域用語相近，非重複）：

| 相似度 | 型別 | 專案 A | 專案 B |
|--------|------|--------|--------|
| 0.619 | 採購供應鏈 | #1257 供應商寄售與入廠庫存 | #1297 VMI 供應商管理庫存 |
| 0.583 | 業務銷售 | #1217 Contract Management | #1245 合約續約管理 |
| 0.568 | 採購供應鏈 | #1251 供應商關係管理 SRM | #1269 供應商入口網站 |
| 0.565 | 品質管理 | #1166 IQC 進料檢驗 | #1167 OQC 出貨檢驗 |
| 0.561 | 倉儲物流 | #1124 AMHS 自動化搬運 | #1299 AGV/AMR 智慧搬運 |

**判定：無重複可刪。** 使用者感覺到的「重複」來自下方的呈現層公版化，而非資料本身。

---

## 2. 呈現層公版化（真正待深化的點）

### 2.1 欄位數量全被寫死
`projects-index.json` 中所有專案的關鍵陣列長度完全一致：

| 欄位 | 每案數量 | 覆蓋 |
|------|---------|------|
| `customerWorkflow.steps`（流程步驟） | 固定 **3** | 463/463 |
| `customerWorkflow.choices`（決策點） | 固定 **3** | 463/463 |
| `customerWorkflow.fields`（輸入欄位） | 固定 **2** | 463/463 |
| `operationalMetrics`（關鍵指標） | 固定 **4** | 463/463 |

→ 沒有任何專案是 4 步或 5 個指標，因此每頁「運作流程／帶來效益」的骨架長得一模一樣。**深化目標：讓數量依專案實際複雜度變動（如 3–5）。**

### 2.2 功能模組只有 23 組、多案共用
`system-content.js` 以關鍵字/分類把 463 專案歸成 **23 種系統型別**，同型別共用同一組 6 個模組：

| 專案數 | 系統型別 |
|--------|---------|
| 72 | manufacturing-mes |
| 46 | quality-qms |
| 39 | sales-crm |
| 38 | procurement-srm |
| 32 | finance-ledger |
| …（其餘 18 型別） | … |

→ 例如 72 個製造專案的「功能模組」六張卡字字相同。**深化目標：模組改為專案專屬（4–8 個），並用架構圖呈現關係。**

### 2.3 整段內容寫死在 HTML（463 案完全相同）
[project.html](../project.html) 內以下區塊為硬編碼，與專案無關：

- **要解決的問題**：三張困境卡（試算表往返／人工追蹤／異常太晚發現）—— 每案相同。
- **帶來效益**：三張效益卡 + KPI 數字以 `project.id` 假算（如 `(id*4)%30+25`）—— 非真實、每案樣式相同。

→ **深化目標：改由專案資料驅動，數量可變、數字有依據。**

---

## 3. 被浪費的豐富資料

[content/practical-scenarios.json](../content/practical-scenarios.json) 已含 **400 個 AI 專案**的高價值資料，但詳細頁 [project.html:150](../project.html#L150) 只讀 `projects-index.json`，完全未使用：

| 欄位 | 覆蓋 | 內容 |
|------|------|------|
| `records` | 400/400（平均 8 筆） | 真實樣本：單號、負責人、日期、金額、風險、階段、決策理由 |
| `exceptions` | 400/400 | 例外事件與必要處置 |
| `metrics` | 400/400 | 帶單位與說明的指標值 |
| `decisionRules` | 400/400 | 真實業務規則 + 佐證 |
| `guidedSteps` | 400/400 | 引導式操作步驟 |
| `profile` | 400/400 | object / owner / stages / risks / fields |

→ 另 **63 個 legacy 專案**無此資料，需以型別模板生成並標記待人工加強。

---

## 4. 建議行動（對應執行計畫）

1. 新增 `content/details/<repo>.json` 深化內容層，欄位長度可變、內容專案化。
2. 400 案由 `practical-scenarios.json` 帶入真實 records/規則；63 legacy 生成 + 標 `needs-review`。
3. `project.html` 改資料驅動，並以 Mermaid 流程圖/架構圖、ECharts 數據圖取代硬編碼卡片與假數字。
4. 先做 5 個試點（#1001 / #1211 / #1006 / #1070 / #2）確認質感，再全量推 463。

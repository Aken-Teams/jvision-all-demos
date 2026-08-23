## 摘要

站上系統數 **463 → 1011**。新增兩支 CLI agent 組成的產線：`topic-scout` 找出不重複的題目，`demo-forge` 透過 codex CLI 建置成符合既有單檔架構的 demo，`demo-publish` 則是寫入 `projects-index.json` 的唯一入口。

- 匯入 `jvision-expansion` 擴充包 75 套（id 3001–3075）
- 新建 473 套 demo，全部上架
- **473 / 473 通過瀏覽器驗收**

## 驗收結果

| 檢查項 | 結果 |
|---|---|
| 六個畫面互異 | 473 / 473 |
| 圖表畫得出像素 | 473 / 473 |
| 390 / 768 / 1360px 無水平溢出 | 473 / 473 |
| console 無錯誤 | 473 / 473 |
| 結構稽核、描述相似度稽核 | 通過 |
| 標題 / repoName / id 重複 | 0 |

## 這批工作最值得看的部分：驗收工具本身有三個量測錯誤

過程中一度回報「250 套未過、通過率 47%」。那個數字是假的，問題出在量測而非 demo。三個錯誤都已修正並記錄在 `38360305`：

1. **圖表在 `setViewportSize` 之後才量。** 改變視窗會讓 ECharts 清掉並重畫 canvas，量測落在清掉、還沒畫回來的空檔 —— 同一個 demo 連跑三次只有一次量得到。改為在任何 resize 之前先把六個畫面量完。
2. **曾試圖用「等兩個 animation frame」解決，結果完全相反** —— 加了之後每次都量成 0，不加是 1。已移除並記錄原因，避免日後有人再踩。
3. **溢出用 `setViewportSize` 把 1360 縮到 390。** ECharts 的 canvas 建好之後不會自己縮，於是報出手機根本不會發生的溢出（56 個「溢出」裡有 45 個是這樣來的）。改為每個寬度各自重新載入，比照真實手機使用者的情境。

修正後的真實通過率是 **97.3%**，剩下 13 套逐一修完。

## 修好的 13 套

- **10 套水平溢出**：它們自己寫了 `body{overflow-x:hidden}`，把過寬內容藏起來 —— 畫面不歪，但右側 240～380px 既看不到也捲不到。修正器的 `clipped()` 原本把 `body` 當成有效裁切祖先，導致掃描永遠回傳空陣列、完全使不上力。改為不採計 `body`/`html` 上的裁切後全部可修。
- **3 套 console 錯誤**：同一個 ApexCharts 設定衝突 —— `tooltip.shared` 與該圖表型別預設的 `tooltip.intersect: true` 不相容。原始碼裡根本沒寫 `intersect`，是預設值撞上的。

## 新增工具

| 工具 | 用途 |
|---|---|
| `tools/topic-scout.mjs` | 缺口分析 + codex 產題 + 五道閘去重 |
| `tools/topic-import.mjs` | Master List 匯入與欄位補完 |
| `tools/demo-forge.mjs` | codex 產 `index.html`，腳本產 details / README |
| `tools/demo-verify.mjs` | 靜態與瀏覽器驗收 |
| `tools/demo-publish.mjs` | 寫入 `projects-index.json` 的唯一入口 |
| `tools/fix-demo-overflow.mjs` | 量測式溢出修正 |
| `tools/build-import-timeline.mjs` | 產生專案導入時間軸 |
| `./progress` | 產線進度儀表 |

`admin-insight.html` 為新的管理頁，顯示專案導入時間與使用者實際開啟哪些 demo。

## 設計取捨

- **codex 無法在本環境寫檔**（`bwrap` loopback 受限），故以 `-s read-only` 執行、回傳完整 HTML 由腳本落檔，**不使用 bypass-sandbox**。git diff 白名單護欄會還原任何越界寫入。
- **details 與 README 由模板決定論產生**，只有 `index.html` 交給模型 —— schema 正確性由建構保證，模型輸出長度也大幅縮短。
- **溢出不用共用 CSS 修**：實測一段 `!important` 的 grid 覆寫會連 `.shell` 導軌一起壓掉、並贏過 demo 自己正確的 mobile 規則，12 個樣本修好 4 個卻弄壞 4 個。改為量測式。
- **使用統計不存 IP**：`AGENTS.md` 禁止把內網位址寫進專案，故只存「IP + 每次啟動的隨機鹽」的雜湊前 8 碼，紀錄檔置於已 gitignore 的 `var/`。

## 驗證方式

```bash
node tools/dev.mjs                    # :3000，首頁顯示 1011
./progress                            # 產線進度
node tools/demo-verify.mjs <repo...>  # 重跑驗收
```

## 已知未處理

- `index.legacy.html` 與 `catalog.old.html` 的硬編數字仍是舊值。站上沒有任何引用，未動。
- 原有的 538 套未用修正後的驗收器重掃。考慮到上述三個量測錯誤，它們過去的「全數通過」紀錄同樣值得重驗。

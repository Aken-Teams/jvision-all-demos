# 技能：產業研究 · industry_research（共用厚 playbook）

> dataMode：external-real。任何引用此技能的 agent 都套用以下規則；各 agent 的 skills.md 只補「該領域特化」。

## 目的
針對使用者情境，用 web search 查真實公開資料，產出「帶來源的趨勢 / 痛點 / 標竿 / 法規」重點。

## 步驟
1. 從問題抽出 2–4 個查詢關鍵字（領域 + 主題 + 年份）。
2. 對每個關鍵字做 web search，挑**權威且近期**的來源（政府 / 產業情報 / 上市櫃公開資訊優先）。
3. 每個結論配一個真實來源網址 + 發布日期。
4. 查不到或來源互相矛盾 → 列入 `unverified`，標「待查證」。

## 輸出 schema
```json
{
  "topic": "<主題>",
  "findings": [
    { "claim": "一句話結論", "evidence": "支持說明", "source": "https://…", "date": "YYYY-MM", "verified": true }
  ],
  "benchmarks": [{ "metric": "OEE", "range": "75–90%", "note": "業界慣例估計，非特定公司", "source": "https://…" }],
  "unverified": ["<待查證項目>"]
}
```

## Do / Don't
- ✅ 每個數字都能點到來源；過舊資料標「可能過時」。
- ✅ 區分「已查證事實」與「業界慣例估計」。
- ❌ 編造來源連結、統計數字或發布日期。
- ❌ 把公司內部數字當外部事實引用（那是 internal-sim 的事）。

## 品質檢查（回傳前自問）
- 每個 `verified:true` 都真的有可點來源嗎？
- 有沒有把估計值偽裝成查證事實？
- 有沒有漏標「待查證」的項目？

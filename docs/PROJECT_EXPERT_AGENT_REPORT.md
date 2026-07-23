# JVision Domain Expert Agent 審視報告

- 產生時間：2026-07-22T14:11:38.920Z
- Agent 版本：2.0.0
- Agent 模式：analyze-and-apply-safe
- 專案數：464；領域分類：29
- 平均完整度：100/100
- 完整：464；可強化：0；優先改善：0
- 已產出內部領域專家審視：464/464（不顯示前台）
- 已套用按鍵回饋：464/464
- 自動稽核缺口：Critical 0 / High 0 / Medium 0 / Low 0

## 執行方式

```powershell
npm run agent:project-expert
npm run agent:project-expert:apply-safe
npm run apply:domain-expert
```

## 原則

每個專案都取得一位依產業分類設定的領域專家。審視結果僅作為系統改善依據並保留於內部文件，不會出現在 Demo 前台；領域架構、業務規則、權限與敏感資料變更會列為『需領域審核』。

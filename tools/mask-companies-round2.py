# -*- coding: utf-8 -*-
"""第二輪：補遮第一輪漏掉的四字公司名（2 字商號 + 2 字業別）。
第一輪只認 cust:"…" 這種欄位寫法，像 "青田食品"、"禾豐貿易" 這種放在陣列或 JSON 其他欄位的就漏了。

刻意用「嚴格結構 + 完整引號值」而不是寬鬆的字尾比對，
否則會把「訂單與金物流」「不鏽鋼螺絲」「直流無刷馬達」這種產品／製程描述也遮掉。
用法：python tools/mask-companies-round2.py [--dry-run]
"""
import re, sys, glob, io, collections

DRY = "--dry-run" in sys.argv
SUF2 = ("科技|電子|精密|精機|工業|實業|機械|機電|塑膠|金屬|物流|運輸|貨運|材料|化工|貿易|食品|營造|建設|"
        "模具|五金|光電|紡織|印刷|包裝|生技|製藥|電機|百貨|量販|診所|牙醫|扣件|線材|軸承|沖壓|射出|封裝|"
        "馬達|重工|電路|通訊|飯店|保全|航太|油品|紙業|生鮮|茶飲|咖啡|眼鏡|建材|刀具|傢俱|照明|地產")
VAL = re.compile(r'"([\u4e00-\u9fff]{2})(' + SUF2 + r')"')

# 這些「字根」不是商號，是產業／產品／製程／狀態描述
BAD = set("""倉儲 資訊 交通 物流 資料 精密 車用 流程 直接 間接 上游 下游 品檢 塑膠 檢驗 研發 工程 半導 固定
電子 機械 材料 包裝 自動 高密 電池 生產 製造 品質 供應 客戶 銷售 財務 人力 設備 能源 環境 安全 教育 醫療
金融 零售 餐飲 營建 化工 紡織 印刷 食品 農業 漁業 出貨 進貨 委外 外購 自製 標準 特殊 一般 其他 國內 國外
海外 本地 區域 全球 專業 綜合 整合 智慧 數位 綠色 循環 精實 先進 傳統 核心 關鍵 主要 次要 原物 半成 成品
在製 庫存 現場 產線 工廠 廠務 製程 良率 效率 成本 售後 前端 後端 中游 訂單 表單 消費 錫膏 隱形 不良 工業
美式 退回 伺服 公路 冷萃 廠區 整燙 模具 流動 焊接 結構 資產 關聯 高頻 冷凍 切削 功率 另類 圖片 在庫 在途
基板 外包 外殼 密封 射頻 導電 屋頂 建置 恆壓 批發 持有 控制 止推 水電 汽車 清潔 滾珠 無線 營運 禮盒 空調
納管 紙材 終測 螺絲 設計 變頻 貨運 退件 退廠 防潮 降低 零件 預警 風扇 未結 已結 待處 委託 內部 外部 通用
混合 複合 單一 多重 大型 小型 中型 微型 高階 低階 中階 新增 汰換 報廢 閒置 借用 受影 中風 二廠 不鏽 陶瓷
軍規 貼片 磨耗 直流 漏鎖 樣品 本月 插件 建議 容器 原料 共同 偏光 低鹵 辦公 石英 未納 晶圓 揀貨 排程 打樣
帳戶 對帳 低介 仁德 簽核 寵物 寫入 卡拉 連結 首件 負荷 特權""".split())

FILES = sorted(set(
    glob.glob("demos/**/*.html", recursive=True)
    + glob.glob("demos/**/*.json", recursive=True)
    + glob.glob("content/**/*.json", recursive=True)
    + ["projects-index.json"]
))

cnt = collections.Counter(); existing = set()
for f in FILES:
    t = io.open(f, encoding="utf-8", errors="ignore").read()
    existing.update(re.findall(r"[\u4e00-\u9fff]?O[\u4e00-\u9fff]{1,8}", t))
    for stem, suf in VAL.findall(t):
        if stem in BAD or "O" in stem: continue
        cnt[stem + suf] += 1

def mask_at(s, i): return s[:i] + "O" + s[i + 1:]
taken, rules = set(existing), []
for n in sorted(cnt):
    for i in (0, 1, 2):
        if i >= len(n) - 1: break
        m = mask_at(n, i)
        if m not in taken:
            taken.add(m); rules.append((n, m)); break
    else:
        raise SystemExit(f"無法配置遮罩：{n}")
rules.sort(key=lambda kv: len(kv[0]), reverse=True)

hits = collections.Counter(); changed = 0
for f in FILES:
    try: t0 = io.open(f, encoding="utf-8").read()
    except Exception: continue
    t = t0
    for src, dst in rules:
        t, c = re.subn('"' + re.escape(src) + '"', '"' + dst + '"', t)   # 只換完整引號值
        if c: hits[src] += c
    if t != t0:
        changed += 1
        if not DRY: io.open(f, "w", encoding="utf-8", newline="").write(t)

out = [f"{'[dry-run] ' if DRY else ''}公司名 {len(rules)} 個，異動 {changed} 檔，遮罩 {sum(hits.values())} 處", ""]
out += [f"{hits[s]:4d}  {s} → {d}" for s, d in rules if hits[s]]
io.open(r"C:\Users\petty\AppData\Local\Temp\claude\d--github-jvision-all-demos\40ce6864-c018-4ab8-b6a2-f1774a03adc0\scratchpad\r2final.txt", "w", encoding="utf-8").write("\n".join(out))
print("names:", len(rules), "| changed:", changed, "| masked:", sum(hits.values()))

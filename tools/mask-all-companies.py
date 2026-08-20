# -*- coding: utf-8 -*-
"""把 demo 裡「所有」公司名都遮成 O 開頭（O晶電、O川科技…）。
只遮一部分會反而凸顯哪幾家原本是真的，所以連原本就虛構的名字一起遮，全站一致。

規則：優先圈第一個字；圈完會跟別家撞名就改圈第二個字。
名單來源：cust/sup/vendor… 等欄位值，以及「⋯有限公司／企業社／工業社／實業社」字樣。
用法：python tools/mask-all-companies.py [--dry-run]
"""
import re, sys, glob, io, collections

DRY = "--dry-run" in sys.argv
FIELD = re.compile(r'\b(?:cust|sup|supplier|party|vendor|cli|client|customer|buyer|shipper|carrier|comp|corp)\s*:\s*"([^"]{2,16})"')
CORP  = re.compile(r'[\u4e00-\u9fff]{2,6}(?:股份有限公司|有限公司|企業社|工業社|實業社)')

# 不是公司名：數量詞、片段、佔位符、人名
EXCLUDE = set("""1 家|2 家|3 家|38 客戶|22 客戶|17 客戶|29 客戶|14 客戶|41 客戶|個人會員|未知匯入|電商倉配|
金屬表面處理廠|營造股份有限公司|科技股份有限公司|智慧材料股份有限公司|昀電腦股份有限公司|
曜金屬股份有限公司|茂精機股份有限公司|精機製造股份有限公司|甲工業股份|內部製程|影響上線|企業合約|
名片快印|周氏家族|AA 集團|BB 電機|CC 汽車|DD 重工|Aureus 工業|Marlin 精密|Vertex 貿易|Nexon 電子|
劉政宏|劉冠廷|日商 精密電子 (東京)|12 張訂單 · 3.2t|9 張訂單 · 2.1t|8 張訂單 · 1.8t|下批 10:30 大榮""".replace("\n", "").split("|"))
EXCLUDE = {x.strip() for x in EXCLUDE if x.strip()}
SURNAME = "趙錢孫李周吳鄭王馮陳蔣沈韓楊朱秦許何呂施張孔曹嚴華金魏姜謝鄒章蘇潘范彭郎韋馬苗方俞任袁柳史唐費岑薛雷賀倪湯殷羅畢安常樂傅卞齊康伍余元顧孟平黃穆蕭尹姚邵汪毛紀董梁杜阮藍季賈路江童顏郭梅盛林鍾徐邱駱高夏蔡田樊胡凌霍萬柯管盧莫房裘應宗丁鄧郁單洪包左石崔吉龔程邢裴陸榮翁羊惠曲桂牛邊燕溫莊晏柴閻連向古易廖居衡步耿滿匡文歐聶簡饒曾豐關游權蓋"
BIZ = re.compile("(科技|精機|精密|電子|工業|實業|機械|機電|塑膠|金屬|物流|運輸|貨運|食品|材料|化工|化學|工程|營造|建設|貿易|企業|集團|公司|模具|扣件|螺絲|線材|軸承|沖壓|鑄造|射出|光電|半導體|儀器|設備|自動化|資訊|系統|數位|顧問|管理|服務|事業|商行|超商|超市|量販|百貨|診所|學苑|保經|產險|人壽|銀行|證券|投信|信託|金控|控股|生技|製藥|紡織|印刷|包裝|馬達|封裝|動力|零件|配件|能源|環保|餐旅|美學|法務|數據|協作|會計|交通|倉儲|建材|刀具|重工|緊固|被動|通訊|電通|電路|地產|汽車|文創|火鍋|會展|工具|五金|橡塑|橡膠|製冷|檯面|世家|醫療|生醫|工坊|快印|物產|保全|航太|飯店|電機|不動產|資產|眼鏡|牙醫|茶飲|咖啡|生鮮|油品|紙器|紙業|上光|燙金|模切|訂本社|設計|出版|教室|教育|培訓|理財|金融|營運|研發|人力|客服|家品|財務|供應|配送|接駁|永續|選物|方案|生活|商務|品牌|電腦|國際|複合材料)")

FILES = sorted(set(
    glob.glob("demos/**/*.html", recursive=True)
    + glob.glob("demos/**/*.json", recursive=True)
    + glob.glob("content/**/*.json", recursive=True)
    + ["projects-index.json"]
))

cnt = collections.Counter()
for f in FILES:
    t = io.open(f, encoding="utf-8", errors="ignore").read()
    for m in FIELD.findall(t):
        m = m.strip()
        if re.search(r"[\u4e00-\u9fff]", m): cnt[m] += 1
    for m in CORP.findall(t): cnt[m] += 1

def is_company(n):
    if n in EXCLUDE or "O" in n or len(n) < 3: return False
    if re.search(r"\d\s*(家|張|筆|件|人|台|批|客戶)", n): return False
    base = re.split(r"\s*·\s*", n)[0].strip()
    if BIZ.search(n): return True
    # 沒有業別字尾又像姓名 → 不是公司
    if len(base) <= 3 and base[0] in SURNAME: return False
    return True

# 英文開頭的名字圈第一個字母會變亂碼，手動指定
OVERRIDE = {
    "Fuyao 福耀": "O耀玻璃",
    "AGC 旭硝子": "O硝子玻璃",
    "SGS台灣": "O證台灣",
    "7-11 永康": "O商永康",
    # 台灣開頭圈第一字會變成「O灣」像錯字，改圈第二字
    "台灣扣件": "台O扣件", "台灣扣件工業": "台O扣件工業",
    "台灣電控科技": "台O電控科技", "台灣捷特科技": "台O捷特科技",
}
names = sorted([n for n in cnt if is_company(n)], key=len, reverse=True)

# 圈第一字；撞名改圈第二字
def mask_at(s, i):
    return s[:i] + "O" + s[i + 1:] if len(s) > i else s
taken, rules = set(), []
for n, m in OVERRIDE.items():
    if n in cnt: taken.add(m); rules.append((n, m))
for n in sorted(names):                       # 固定順序，結果可重現
    if n in OVERRIDE: continue
    for i in (0, 1):
        m = mask_at(n, i)
        if m != n and m not in taken:
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
        t, c = re.subn(re.escape(src), dst, t)
        if c: hits[src] += c
    if t != t0:
        changed += 1
        if not DRY: io.open(f, "w", encoding="utf-8", newline="").write(t)

out = [f"{'[dry-run] ' if DRY else ''}公司名 {len(rules)} 個，異動 {changed} 檔，遮罩 {sum(hits.values())} 處", ""]
out += [f"{hits[s]:4d}  {s} → {d}" for s, d in rules if hits[s]]
io.open(r"C:\Users\petty\AppData\Local\Temp\claude\d--github-jvision-all-demos\40ce6864-c018-4ab8-b6a2-f1774a03adc0\scratchpad\maskall.txt", "w", encoding="utf-8").write("\n".join(out))
print("names:", len(rules), "| changed:", changed, "| masked:", sum(hits.values()))

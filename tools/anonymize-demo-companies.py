# -*- coding: utf-8 -*-
"""把 demo 資料裡的真實公司名稱換成虛構名稱。
示範資料本來就不是真的，但出現真實企業名容易讓訪客誤會，因此一律去識別化。

用法：
  python tools/anonymize-demo-companies.py --dry-run   # 只報告命中數
  python tools/anonymize-demo-companies.py             # 實際替換

規則刻意寫成「完整實體字串 / 帶排除條件的詞幹」，避免誤傷：
  東南亞、黃長春、王品瑄(人名)、中信賴/中信心、最大同比、大同區/大同路、
  統一格式/統一編號(動詞用法)、WO-2607-118(不是 7-11)
"""
import re, sys, glob, io, collections

DRY = "--dry-run" in sys.argv

# (正規表示式, 取代字串, 說明)
RULES = [
    # ---- 半導體 / 電子製造 ----
    (r"台積電", "昱晶電", "台積電"),
    (r"鴻海", "鴻宇", "鴻海"),
    (r"廣達", "廣宸", "廣達"),
    (r"和碩", "和翊", "和碩"),
    (r"緯創", "緯昌", "緯創"),
    (r"仁寶", "仁昱", "仁寶"),
    (r"英業達", "英昇達", "英業達"),
    (r"研華", "研宸", "研華"),
    (r"華碩", "華昀", "華碩"),
    (r"宏碁", "宏翊", "宏碁"),
    (r"技嘉", "奕嘉", "技嘉"),
    (r"華邦", "邦宸", "華邦"),
    (r"聯發科", "聯昕科", "聯發科"),
    (r"日月光", "曜辰光", "日月光"),
    (r"友達", "友暘", "友達"),
    (r"大立光", "昱立光", "大立光"),
    (r"上銀", "上偉", "上銀"),
    (r"台中精機", "中都精機", "台中精機"),
    # ---- 鋼鐵 / 石化 / 傳產 ----
    (r"中鋼", "鋐鋼", "中鋼"),
    (r"台鋼", "昇鋼", "台鋼"),
    (r"台塑", "昱塑", "台塑"),
    (r"南亞化材", "昇亞化材", "南亞化材"),
    (r"南亞科", "昇亞科", "南亞科"),
    (r"台達", "達昇", "台達(電)"),
    (r"大同(?![區路比])", "同茂", "大同(排除 區/路/比)"),
    (r"東元", "東晟", "東元"),
    (r"友嘉", "友宸", "友嘉"),
    (r"聯華", "聯昌", "聯華"),
    (r"永豐", "永昌", "永豐"),
    (r"新光", "新曜", "新光"),
    (r"和泰汽車", "和昌汽車", "和泰汽車"),
    # ---- 零售 / 電商 / 物流 ----
    (r"統一超商", "常昇超商", "統一超商"),
    (r"統一超市", "常昇超市", "統一超市"),
    (r"全家便利商店", "樂家便利商店", "全家便利商店"),
    (r"家樂福", "家豐量販", "家樂福"),
    (r"大潤發", "潤豐量販", "大潤發"),
    (r"好市多", "倉利量販", "好市多"),
    (r"全聯", "聯佳超市", "全聯"),
    (r"蝦皮", "星購", "蝦皮"),
    (r"PChome", "NetMall", "PChome"),
    (r"MOMO", "MoShop", "MOMO"),
    (r"momo", "MoShop", "momo"),
    (r"新竹物流", "竹光物流", "新竹物流"),
    (r"新竹貨運", "竹光貨運", "新竹貨運"),
    (r"黑貓宅急便", "銀貓宅配", "黑貓宅急便"),
    (r"黑貓", "銀貓", "黑貓"),
    (r"宅配通", "配速通", "宅配通"),
    (r"嘉里大榮", "嘉宏大運", "嘉里大榮"),
    (r"順豐", "順捷", "順豐"),
    (r"長榮", "長昇", "長榮"),
    (r"星宇", "宸宇", "星宇"),
    (r"台灣高鐵", "西岸高鐵", "台灣高鐵"),
    (r"星巴克", "星丘咖啡", "星巴克"),
    (r"UNIQLO", "UNIWEAR", "UNIQLO"),
    # ---- 金融 ----
    (r"中華電信", "華通電信", "中華電信"),
    (r"國泰", "泰宏", "國泰"),
    (r"富邦", "富晟", "富邦"),
    (r"中國信託", "昌華信託", "中國信託"),
    (r"中信金", "昌華金", "中信金"),
    (r"中信(?=\s*\*)", "昌信", "中信 ****（帳號）"),
    (r"中信(?=CTBC)", "昌信", "中信CTBC"),
    (r"玉山", "岳山", "玉山"),
    (r"兆豐", "兆晟", "兆豐"),
    (r"第一銀行", "首信銀行", "第一銀行"),
    (r"一銀(?=FCB)", "首信", "一銀FCB"),
    (r"台新(?!增)", "昇新", "台新(排除 台新增)"),
    (r"元大", "元晟", "元大"),
    (r"合作金庫", "合利金庫", "合作金庫"),
    # 銀行英文代碼（真實 SWIFT 代碼）
    (r"\bCUB\b", "THX", "CUB"),
    (r"\bTPB\b", "FSX", "TPB"),
    (r"\bESUN\b", "YSX", "ESUN"),
    (r"\bCTBC\b", "CHX", "CTBC"),
    (r"\bFCB\b", "SSX", "FCB"),
    # ---- 資訊服務 ----
    (r"鼎新", "鼎宸", "鼎新"),
    (r"叡揚", "昱揚", "叡揚"),
    (r"神通資科", "宏通資科", "神通資科"),
    # ---- 國際品牌 ----
    (r"\bToyota\b", "Aurion", "Toyota"),
    (r"\bNissan\b", "Nordis", "Nissan"),
    (r"\bHonda\b", "Haruna", "Honda"),
    (r"\bTesla\b", "Voltra", "Tesla"),
    (r"\bSamsung\b", "Sunmax", "Samsung"),
    (r"\bFoxconn\b", "Fortech", "Foxconn"),
    (r"\bQuanta\b", "Quantek", "Quanta"),
    (r"\bPegatron\b", "Pegatek", "Pegatron"),
    (r"\bAdvantech\b", "Advantek", "Advantech"),
]

FILES = sorted(set(
    glob.glob("demos/**/*.html", recursive=True)
    + glob.glob("demos/**/*.json", recursive=True)
    + glob.glob("content/**/*.json", recursive=True)
    + ["projects-index.json"]
))

hits = collections.Counter(); files_touched = collections.Counter(); changed = 0
for f in FILES:
    try:
        t0 = io.open(f, encoding="utf-8").read()
    except Exception:
        continue
    t = t0
    for pat, rep, name in RULES:
        t, n = re.subn(pat, rep, t)
        if n:
            hits[name] += n; files_touched[name] += 1
    if t != t0:
        changed += 1
        if not DRY:
            io.open(f, "w", encoding="utf-8", newline="").write(t)

out = [f"{'[dry-run] ' if DRY else ''}掃描 {len(FILES)} 檔，異動 {changed} 檔，總替換 {sum(hits.values())} 處", ""]
for name, _, _ in [(r[2], 0, 0) for r in RULES]:
    if hits[name]:
        out.append(f"{hits[name]:5d} 處 / {files_touched[name]:3d} 檔   {name}")
io.open(r"C:\Users\petty\AppData\Local\Temp\claude\d--github-jvision-all-demos\40ce6864-c018-4ab8-b6a2-f1774a03adc0\scratchpad\anon.txt", "w", encoding="utf-8").write("\n".join(out))
print("changed files:", changed, "| replacements:", sum(hits.values()))

# --- 第二輪：短稱與真實股票代號（第一輪只比對完整名稱時漏掉的） ---
RULES2 = [
    (r"和泰", "和昌", "和泰(短稱)"),
    (r"台積", "昱晶", "台積(短稱)"),
    (r"中華電(?!信)", "華通電", "中華電(短稱)"),
    # 真實上市代號：公司名已虛構，代號留著等於還原身分
    (r'"2330"', '"9301"', "代號 2330"),
    (r'"2454"', '"9302"', "代號 2454"),
    (r'"2603"', '"9303"', "代號 2603"),
    (r'"2412"', '"9304"', "代號 2412"),
    (r'"0056"', '"0091"', "代號 0056"),
]
if "--pass2" in sys.argv:
    hits2 = collections.Counter(); changed2 = 0
    for f in FILES:
        try: t0 = io.open(f, encoding="utf-8").read()
        except Exception: continue
        t = t0
        for pat, rep, name in RULES2:
            t, n = re.subn(pat, rep, t)
            if n: hits2[name] += n
        if t != t0:
            changed2 += 1
            if not DRY: io.open(f, "w", encoding="utf-8", newline="").write(t)
    print("pass2 changed:", changed2, "| replacements:", sum(hits2.values()))
    for k, v in hits2.most_common(): print(f"   {v:4d}  {k}")

# -*- coding: utf-8 -*-
"""把 demo 裡的公司名遮成「O晶電」這種一看就知道是去識別化的寫法。
規則：優先圈第一個字；若圈完會跟另一家撞名，該家改圈第二個字（例如 昇鋼→昇O）。
同一個字根的長短稱共用同一個遮罩位置（昱晶／昱晶電 → O晶／O晶電）。

用法：python tools/mask-demo-companies.py [--dry-run]
"""
import re, sys, glob, io, collections

DRY = "--dry-run" in sys.argv

# 字根 → 該字根底下的所有寫法（長的排前面，才不會被短的先吃掉）
STEMS = [
    ("昱晶", ["昱晶電", "昱晶"]), ("鴻宇", ["鴻宇"]), ("廣宸", ["廣宸"]), ("和翊", ["和翊"]),
    ("緯昌", ["緯昌"]), ("仁昱", ["仁昱"]), ("英昇達", ["英昇達"]), ("研宸", ["研宸"]),
    ("華昀", ["華昀"]), ("宏翊", ["宏翊"]), ("奕嘉", ["奕嘉"]), ("邦宸", ["邦宸"]),
    ("聯昕科", ["聯昕科"]), ("曜辰光", ["曜辰光"]), ("友暘", ["友暘"]), ("昱立光", ["昱立光"]),
    ("上偉", ["上偉"]), ("中都精機", ["中都精機"]),
    ("鋐鋼", ["鋐鋼"]), ("昇鋼", ["昇鋼"]), ("昱塑", ["昱塑"]),
    ("昇亞", ["昇亞化材", "昇亞科"]), ("達昇", ["達昇"]), ("同茂", ["同茂"]), ("東晟", ["東晟"]),
    ("友宸", ["友宸"]), ("聯昌", ["聯昌"]), ("永昌", ["永昌"]), ("新曜", ["新曜"]),
    ("和昌", ["和昌汽車", "和昌"]),
    ("常昇", ["常昇超商", "常昇超市"]), ("樂家便利商店", ["樂家便利商店"]),
    ("家豐量販", ["家豐量販"]), ("潤豐量販", ["潤豐量販"]), ("倉利量販", ["倉利量販"]),
    ("聯佳超市", ["聯佳超市"]), ("星購", ["星購"]),
    ("竹光", ["竹光物流", "竹光貨運"]), ("銀貓", ["銀貓宅配", "銀貓"]), ("配速通", ["配速通"]),
    ("嘉宏大運", ["嘉宏大運"]), ("順捷", ["順捷"]), ("長昇", ["長昇"]), ("宸宇", ["宸宇"]),
    ("西岸高鐵", ["西岸高鐵"]), ("星丘咖啡", ["星丘咖啡"]),
    ("華通電", ["華通電信", "華通電"]), ("泰宏", ["泰宏"]), ("富晟", ["富晟"]),
    ("昌華", ["昌華信託", "昌華金"]), ("昌信", ["昌信"]), ("岳山", ["岳山"]), ("兆晟", ["兆晟"]),
    ("首信", ["首信銀行", "首信"]), ("昇新", ["昇新"]), ("元晟", ["元晟"]),
    ("合利金庫", ["合利金庫"]),
    ("鼎宸", ["鼎宸"]), ("昱揚", ["昱揚"]), ("宏通資科", ["宏通資科"]),
]

# 決定每個字根圈第幾個字：先試第 1 字，撞名就改第 2 字
def mask_at(s, i):
    return s[:i] + "O" + s[i + 1:]

taken, pos = set(), {}
for stem, _ in STEMS:
    for i in (0, 1):
        if mask_at(stem, i) not in taken:
            pos[stem] = i; taken.add(mask_at(stem, i)); break
    else:
        raise SystemExit(f"無法配置遮罩位置：{stem}")

# 展開成實際替換表（長字串優先）
RULES = []
for stem, variants in STEMS:
    for v in variants:
        RULES.append((v, mask_at(v, pos[stem])))
RULES.sort(key=lambda kv: len(kv[0]), reverse=True)

dup = [v for v, c in collections.Counter(v for _, v in RULES).items() if c > 1]
assert not dup, f"遮罩名重複：{dup}"

FILES = sorted(set(
    glob.glob("demos/**/*.html", recursive=True)
    + glob.glob("demos/**/*.json", recursive=True)
    + glob.glob("content/**/*.json", recursive=True)
    + ["projects-index.json"]
))

hits = collections.Counter(); changed = 0
for f in FILES:
    try: t0 = io.open(f, encoding="utf-8").read()
    except Exception: continue
    t = t0
    for src, dst in RULES:
        t, c = re.subn(re.escape(src), dst, t)
        if c: hits[src] += c
    if t != t0:
        changed += 1
        if not DRY: io.open(f, "w", encoding="utf-8", newline="").write(t)

out = [f"{'[dry-run] ' if DRY else ''}異動 {changed} 檔，遮罩 {sum(hits.values())} 處", ""]
out.append("圈第二字（因為圈第一字會撞名）：")
out += [f"   {s} → {mask_at(s, 1)}" for s, i in pos.items() if i == 1]
out.append("")
for s, d in RULES:
    if hits[s]: out.append(f"{hits[s]:5d}  {s} → {d}")
io.open(r"C:\Users\petty\AppData\Local\Temp\claude\d--github-jvision-all-demos\40ce6864-c018-4ab8-b6a2-f1774a03adc0\scratchpad\mask.txt", "w", encoding="utf-8").write("\n".join(out))
print("changed:", changed, "| masked:", sum(hits.values()), "| second-char:", sum(1 for i in pos.values() if i == 1))

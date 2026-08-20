# -*- coding: utf-8 -*-
"""把「被當成採購品／供應商／授權」的商業品牌換成通用代稱。
保留純技術棧名稱（PostgreSQL、MySQL、Redis、Kafka、MQTT…開源／協定），它們不會讓人聯想到特定客戶。

刻意用「精確字串」而不是品牌關鍵字，因為：
  Intel → 其實是 Intelligent Parking System
  HP    → 其實是 DEHP 鄰苯二甲酸酯 / 75HP 馬力
  Zoom  → 其實是 Leaflet 的 zoomControl / maxZoom
用法：python tools/mask-vendor-brands.py [--dry-run]
"""
import re, sys, glob, io, collections

DRY = "--dry-run" in sys.argv
M = [
    # --- AOI／檢測設備廠牌 ---
    ('"Koh Young"', '"A 廠牌"'), ('"CyberOptics"', '"D 廠牌"'),
    ('"Keyence"', '"C 廠牌"'), ('"Omron"', '"B 廠牌"'),
    ('"Keyence.X / Y"', '"C 廠牌.X / Y"'), ('"CyberOptics.comp"', '"D 廠牌.comp"'),
    ('brand":"Koh Young"', 'brand":"A 廠牌"'), ('brand":"Omron"', 'brand":"B 廠牌"'),
    ('brand":"Keyence"', 'brand":"C 廠牌"'), ('brand":"CyberOptics"', 'brand":"D 廠牌"'),
    ('name:"Keyence"', 'name:"C 廠牌"'),
    # --- 設備零件廠牌 ---
    ('"Schneider"', '"E 廠牌"'), ('"Fanuc"', '"F 廠牌"'), ('"MANN"', '"H 廠牌"'), ('"NOK"', '"I 廠牌"'),
    ('"FANUC 31i-B5 五軸聯動"', '"A 牌控制器 31i-B5 五軸聯動"'), ('"Siemens 840D sl"', '"B 牌控制器 840D sl"'),
    ('vendor:"Siemens S7-1500"', 'vendor:"A 牌 PLC S7-1500"'), ('vendor:"Schneider"', 'vendor:"E 廠牌"'),
    ('"Cisco IOS"', '"交換器 OS"'), ('"VMware ESXi"', '"虛擬化平台"'),
    # --- IT 資產 ---
    ('"Dell Latitude 5540"', '"A 牌筆電 L5540"'), ('"Dell PowerEdge R750"', '"A 牌伺服器 R750"'),
    ('"Dell Latitude 5540 ×20"', '"A 牌筆電 L5540 ×20"'), ('"Dell 伺服器 R760 x2 · 交換器 x1"', '"A 牌伺服器 R760 x2 · 交換器 x1"'),
    ('"HP EliteDesk 800 G9"', '"B 牌桌機 800 G9"'), ('"HP EliteDesk 800 ×15"', '"B 牌桌機 800 ×15"'),
    ('"HP-77QW3E"', '"BX-77QW3E"'),
    ('"Lenovo ThinkPad T14"', '"C 牌筆電 T14"'), ('"LN-T14G2X"', '"CX-T14G2X"'),
    ('"Cisco C9300-48P"', '"D 牌交換器 C9300-48P"'), ('"CS-9300X8"', '"DX-9300X8"'),
    ('"Fortinet FG-100F"', '"E 牌防火牆 FG-100F"'), ('"Fortinet FG-100F ×2"', '"E 牌防火牆 FG-100F ×2"'),
    ('"FG-100F71"', '"EX-100F71"'),
    # --- 軟體授權 ---
    ('"Microsoft 365 E3"', '"辦公套裝 E3"'), ('"Microsoft 365 E5"', '"辦公套裝 E5"'),
    ('n:"Microsoft 365"', 'n:"辦公套裝"'), ('nm:"Microsoft 365"', 'nm:"辦公套裝"'),
    ('"Adobe Creative Cloud"', '"設計軟體套裝"'), ('nm:"Adobe CC 授權"', 'nm:"設計軟體授權"'),
    ('"軟體授權擴充 - Adobe 5 席"', '"軟體授權擴充 - 設計軟體 5 席"'),
    ('"Autodesk AutoCAD"', '"CAD 軟體"'), ('"JetBrains All Products"', '"開發工具套裝"'),
    ('"VMware vSphere"', '"虛擬化平台授權"'), ('"Zoom Business"', '"視訊會議平台"'),
    ('["vSphere","AutoCAD","JetBrains","Adobe CC","M365 E3","Zoom"]',
     '["虛擬化","CAD","開發工具","設計軟體","辦公套裝","視訊會議"]'),
    ('"Teams + Zoom Pro"', '"協作平台 + 視訊平台"'), ('"Teams 標準"', '"協作平台 標準"'),
    ('name:"Teams"', 'name:"協作平台"'), ('"Teams 語音閘道自動切換備援節點，通話零中斷"', '"協作平台語音閘道自動切換備援節點，通話零中斷"'),
    ('批次回收 42 席閒置 Zoom Pro 授權', '批次回收 42 席閒置視訊平台授權'),
    # --- ERP / 資料庫 / BI（開源的 PostgreSQL、MySQL、Redis、Kafka 保留）---
    ('"集團 ERP（SAP）"', '"集團 ERP（A 牌）"'),
    ('"對接 ERP 為 SAP，需確認介接方式。"', '"對接 ERP 為 A 牌，需確認介接方式。"'),
    ('"同步 ERP (SAP) 料件主檔 / 採購資訊記錄"', '"同步 ERP (A 牌) 料件主檔 / 採購資訊記錄"'),
    ('t:"SAP · 每 15 分鐘"', 't:"A 牌 ERP · 每 15 分鐘"'),
    ('t:"Oracle · 財務／訂單"', 't:"商用資料庫 A · 財務／訂單"'),
    ('e:"Oracle 19c"', 'e:"商用資料庫 A 19c"'), ('"Oracle 19.23 RU"', '"商用資料庫 A 19.23 RU"'),
    ('e:"SQL Server 2022"', 'e:"商用資料庫 B 2022"'), ('t:"SQL Server"', 't:"商用資料庫 B"'),
    ('"SQL Server 2022 CU12"', '"商用資料庫 B 2022 CU12"'),
    ('["SQL Server","Oracle","PostgreSQL","MySQL","Redis"]', '["商用資料庫 B","商用資料庫 A","PostgreSQL","MySQL","Redis"]'),
    ('"MSSQL ERP"', '"ERP 資料庫"'),
    ('t:"Salesforce API"', 't:"CRM API"'), ("stk:'Salesforce'", "stk:'商用 CRM'"),
    ("stk:'Power BI'", "stk:'商用 BI'"), ("s:'Snowflake'", "s:'雲端資料倉儲'"),
    # --- CAE 求解器 ---
    ('solver:"Ansys"', 'solver:"求解器 A"'), ('"Ansys 求解席"', '"求解器 A 席次"'),
    ('"Abaqus 求解席"', '"求解器 B 席次"'), ('"Fluent 求解席"', '"求解器 C 席次"'),
]

FILES = sorted(set(glob.glob("demos/**/*.html", recursive=True) + glob.glob("demos/**/*.json", recursive=True)))
hits = collections.Counter(); changed = 0
for f in FILES:
    try: t0 = io.open(f, encoding="utf-8").read()
    except Exception: continue
    t = t0
    for src, dst in M:
        if src in t:
            n = t.count(src); t = t.replace(src, dst); hits[src] += n
    if t != t0:
        changed += 1
        if not DRY: io.open(f, "w", encoding="utf-8", newline="").write(t)

out = [f"{'[dry-run] ' if DRY else ''}異動 {changed} 檔，替換 {sum(hits.values())} 處", ""]
out += [f"{hits[s]:4d}  {s} → {d}" for s, d in M if hits[s]]
out += ["", "未命中的規則（可能已替換過或字串有變動）："]
out += [f"   {s}" for s, d in M if not hits[s]]
io.open(r"C:\Users\petty\AppData\Local\Temp\claude\d--github-jvision-all-demos\40ce6864-c018-4ab8-b6a2-f1774a03adc0\scratchpad\vendmask.txt", "w", encoding="utf-8").write("\n".join(out))
print("changed:", changed, "| replaced:", sum(hits.values()), "| unmatched rules:", sum(1 for s, d in M if not hits[s]))

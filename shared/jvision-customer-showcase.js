const showcases = {
  "jvision-ai-case-068-tax-filing-organizer": {
    eyebrow:"營業稅申報與憑證整理情境",
    title:"完成一期營業稅申報前的資料檢核與歸檔",
    story:"記帳人員收到客戶本期銷項、進項發票與費用憑證後，發現部分憑證缺少統編、重複入帳，另有不可扣抵項目。本次示範從匯入分類、異常補件、稅額試算到主管覆核與申報歸檔的完整流程。",
    subject:"2026 年 7–8 月營業稅申報案件",
    steps:[
      {
        title:"匯入並分類本期憑證",
        task:"確認申報期別、公司資料及本期憑證來源",
        fields:[["公司統編／申報期別","24568031／2026 年 7–8 月"],["資料來源／憑證數","電子發票平台、銀行與紙本掃描／186 筆"]],
        action:"完成憑證匯入與分類",
        result:"系統已匯入 186 筆憑證，依銷項、進項、費用及固定資產完成分類，並建立申報工作底稿。"
      },
      {
        title:"檢查異常並建立補件清單",
        task:"逐筆處理缺漏、重複及不可扣抵的憑證",
        choices:["缺少統編或品名，通知客戶補件","疑似重複入帳，暫停列入申報","交際費或自用乘人小客車，改列不可扣抵"],
        action:"確認異常處理方式",
        result:"已建立 5 筆補件、2 筆重複憑證待確認及 3 筆不可扣抵調整，異常項目均有負責人與期限。"
      },
      {
        title:"試算稅額並完成覆核",
        task:"核對銷售額、銷項稅額、可扣抵進項稅額與留抵資料",
        fields:[["銷售額／銷項稅額","NT$ 3,820,000／NT$ 191,000"],["可扣抵進項／上期留抵","NT$ 142,600／NT$ 18,000"]],
        action:"送交主管覆核試算結果",
        result:"本期應納稅額試算為 NT$ 30,400，差異檢核通過，已送交稅務主管覆核。"
      },
      {
        title:"完成申報與憑證歸檔",
        task:"確認繳款狀態、申報回執與電子工作底稿保存位置",
        choices:["完成線上申報並建立繳款單","保留留抵稅額至下期","退回補件後重新產生申報檔"],
        action:"確認申報完成並歸檔",
        result:"申報回執、繳款資料、異常處理紀錄與憑證索引已歸檔，可依統編、期別與憑證號碼追溯。"
      }
    ],
    output:"營業稅申報回執、稅額試算表、補件清單與憑證歸檔索引 TAX-2026-0805"
  },
  "jvision-smart-mfg-154-e-auction": {
    eyebrow:"採購現場情境",
    title:"完成一場供應商線上競價",
    story:"馬達控制器本週必須決標。三家合格供應商已完成出價，請比較總成本與交期，選擇得標方案並送出核准。",
    subject:"馬達控制器 1,200 組",
    steps:[
      { title:"確認競標條件", task:"底價與交期門檻", fields:[["預算上限","NT$ 2,400,000"],["最晚交期","2026/08/18"]], action:"鎖定競標條件", result:"競標條件已鎖定，三家供應商可進入比較。" },
      { title:"比較供應商出價", task:"價格、交期與履約風險", choices:["新達科技｜NT$ 2.18M｜18 天","宏信工業｜NT$ 2.22M｜12 天","鉅盛電子｜NT$ 2.09M｜27 天"], action:"選擇建議得標者", result:"已選擇宏信工業：不是最低價，但交期最符合本週缺料風險。" },
      { title:"送出決標核准", task:"留下選商依據與核准結果", fields:[["選商理由","交期優先，避免停線成本"],["核准人","採購經理 王怡君"]], action:"核准並產生決標紀錄", result:"決標完成，已產生決標紀錄並通知供應商與需求單位。" }
    ],
    output:"電子競標決標紀錄 EA-2026-154"
  },
  "jvision-ai-case-033-hospitality-booking": {
    eyebrow:"旅宿櫃台情境",
    title:"處理週末超額訂房",
    story:"週六晚間標準雙人房超賣一間。請找出可替代房型、確認旅客方案，並同步房務與帳務。",
    subject:"訂房 BK-0729-018",
    steps:[
      { title:"確認訂房衝突", task:"旅客、房型與入住條件", fields:[["原訂房型","標準雙人房"],["入住日期","2026/08/01"]], action:"確認衝突", result:"已確認超賣 1 間，旅客為會員且有延遲入住需求。" },
      { title:"安排替代方案", task:"升等、換館或退款", choices:["免費升等豪華雙人房","協調鄰近合作旅館","取消並全額退款"], action:"套用旅客方案", result:"已免費升等豪華雙人房，房差由飯店吸收。" },
      { title:"完成入住交接", task:"同步房務、櫃台與帳務", fields:[["房號","1208"],["交接備註","22:30 前保留房間"]], action:"確認並完成交接", result:"房間已保留，房務與夜班櫃台收到通知，帳務已註記免收房差。" }
    ],
    output:"入住異動與房務交接單 BK-0729-018"
  },
  "jvision-smart-mfg-203-attendance-management": {
    eyebrow:"人資出勤情境",
    title:"處理一筆加班打卡異常",
    story:"員工完成夜間加班，但下班卡缺漏。請核對班表與門禁資料，送主管確認並更新出勤。",
    subject:"林志豪｜7/29 加班紀錄",
    steps:[
      { title:"核對異常紀錄", task:"班表、打卡與門禁時間", fields:[["排定班別","晚班 14:00–23:00"],["門禁離場","23:18"]], action:"確認資料來源", result:"門禁與加班申請一致，僅下班卡缺漏。" },
      { title:"提出補登申請", task:"補登時間與原因", fields:[["補登下班時間","23:18"],["原因","設備未成功寫入"]], action:"送主管確認", result:"補登申請已送交製造部主管。" },
      { title:"更新出勤結果", task:"主管決定與薪資影響", choices:["核准補登並計入加班","退回補充證明","不核准補登"], action:"確認出勤結果", result:"已核准補登，3 小時加班將進入本月薪資計算。" }
    ],
    output:"出勤補登核准紀錄 AT-0729-203"
  },
  "jvision-smart-mfg-223-accounts-receivable-ar-system": {
    eyebrow:"應收帳款催收與核銷情境",
    title:"完成一筆逾期應收款的催收、收款與沖帳",
    story:"客戶「東岳零售」的發票已逾期 18 天，尚有 NT$ 286,000 未收。會計人員需先確認應收與爭議原因，留下催收及承諾付款紀錄，再登錄銀行入款並完成核銷；帳齡報表會由系統隨結果自動更新。",
    subject:"AR-2026-0724・東岳零售逾期應收",
    steps:[
      { title:"確認逾期應收", task:"核對發票、到期日、未收金額與客戶爭議", fields:[["發票／到期日","INV-202606-184／2026-07-12"],["未收金額／付款條件","NT$ 286,000／月結 30 天"]], action:"確認應收與逾期原因", result:"發票與出貨驗收相符；客戶因折讓單尚未收到而暫緩付款，已標記逾期 18 天。" },
      { title:"記錄催收與付款承諾", task:"選擇聯繫方式、處理爭議並留下承諾付款日", choices:["補寄折讓單並取得 8/05 全額付款承諾","要求先付無爭議款，折讓差額後續沖銷","暫停信用額度並交由財務主管處理"], action:"保存催收紀錄", result:"已補寄折讓單，客戶承諾 8/05 全額付款；系統建立追蹤提醒並保留聯繫紀錄。" },
      { title:"登錄銀行收款", task:"比對入款人、金額、日期與銀行交易序號", fields:[["實收金額／入款日","NT$ 286,000／2026-08-05"],["銀行交易序號","CTBC-0805-932781"]], action:"登錄收款並自動配對", result:"銀行入款已與東岳零售及發票 INV-202606-184 配對，等待會計核銷。" },
      { title:"完成核銷與信用更新", task:"確認核銷方式、差異及客戶信用額度影響", choices:["全額核銷並恢復信用額度","部分核銷，餘額續列逾期","入款資訊不明，轉暫收款待查"], action:"確認核銷並完成入帳", result:"應收款已全額沖銷，帳齡與客戶對帳單同步更新，信用額度恢復可用。" }
    ],
    output:"收款核銷傳票、催收歷程與客戶對帳更新紀錄 AR-2026-0724"
  },
  "jvision-ai-case-001-production-scheduler": {
    eyebrow:"生產排程情境",
    title:"處理缺料造成的排程衝突",
    story:"關鍵鋁料不足，兩張本週出貨工單受到影響。請確認缺口、調整工單順序並發布新排程。",
    subject:"醫療支架工單 MO-5801",
    steps:[
      { title:"確認物料缺口", task:"可用量與需求量", fields:[["需求量","680 件"],["可用量","420 件"]], action:"確認缺口", result:"缺口 260 件，原排程無法完整生產。" },
      { title:"重排生產順序", task:"交期、換線與可生產數量", choices:["先完成 420 件並分批交貨","延後整張工單","挪用其他工單物料"], action:"套用排程方案", result:"採分批交貨，先排 420 件並保留後續補料時段。" },
      { title:"發布新排程", task:"通知產線、採購與業務", fields:[["首批完成日","2026/08/02"],["補料到廠日","2026/08/05"]], action:"發布並通知", result:"新排程已發布，產線、採購與業務收到交付變更。" }
    ],
    output:"生產排程變更單 PS-5801"
  },
  "jvision-ai-case-006-quality-root-cause": {
    eyebrow:"品質異常情境",
    title:"完成一筆不良批次原因分析",
    story:"出貨前抽驗發現孔徑超差。請隔離批次、確認原因並決定放行或重工。",
    subject:"檢驗批 LOT-QC-2407",
    steps:[
      { title:"確認不良範圍", task:"抽樣、規格與缺陷數", fields:[["抽樣數","50 件"],["超差數","7 件"]], action:"隔離受影響批次", result:"批次 1,200 件已隔離，暫停出貨。" },
      { title:"分析可能原因", task:"人、機、料、法與量測", choices:["刀具磨耗造成孔徑偏大","材料批次硬度異常","量測治具校正失效"], action:"記錄原因與證據", result:"刀具壽命已超出管制值，與不良發生時間一致。" },
      { title:"確認處置結果", task:"重工、報廢或有條件放行", fields:[["處置決定","全批篩選後重工"],["完成期限","2026/08/01"]], action:"核准處置並追蹤", result:"處置已核准，重工工單與矯正措施已建立。" }
    ],
    output:"品質異常分析與處置報告 NCR-2407"
  },
  "jvision-smart-mfg-266-backup-dr": {
    eyebrow:"災難復原演練",
    title:"讓 ERP 在勒索軟體事件後恢復到可營運狀態",
    story:"凌晨 02:14，ERP 應用伺服器出現大量檔案加密行為。正式環境已隔離，資訊團隊必須選擇未受污染的復原點，在隔離區完成還原與驗證，並於核准後切回服務。",
    subject:"DR-2026-0730・ERP 勒索軟體復原演練",
    steps:[
      { title:"界定影響與復原目標", task:"確認受影響服務、最後正常時間及允許的資料損失與停機時間。", fields:[["受影響服務／事件時間","ERP Production／02:14"],["復原目標","RPO 15 分鐘・RTO 2 小時"]], action:"鎖定復原範圍", result:"已將 ERP、資料庫與檔案服務納入復原範圍，復原目標為 RPO 15 分鐘、RTO 2 小時。" },
      { title:"選擇復原點並隔離還原", task:"比較備份完整性、時間與惡意程式掃描結果，選擇可用復原點。", choices:["01:55 不可變快照・完整・掃描通過","02:10 增量備份・接近事件時間・待掃描","前日 23:00 完整備份・安全但資料落差較大"], action:"啟動隔離區還原", result:"已選擇 01:55 不可變快照，於隔離復原網段建立 ERP 與資料庫驗證環境。" },
      { title:"驗證服務並核准切回", task:"完成資料一致性、登入、訂單與介接測試，再由資訊主管核准正式切回。", fields:[["驗證負責人","應用系統組 林志豪"],["預計切回時間","2026/07/30 04:00"]], action:"核准切回並產生報告", result:"ERP 核心交易與介接測試通過，已核准切回並保留完整復原證據。" }
    ],
    output:"DR-2026-0730 災難復原演練報告與切回核准紀錄"
  },
  "jvision-smart-parking": {
    eyebrow:"智慧停車尖峰情境",
    title:"完成一輛異常車輛從辨識到核准出場",
    story:"晚間尖峰，B2 車位接近滿位，一輛訪客車在出口找不到入場紀錄。請核對車牌影像、補登入場資訊、重新計算費用並核准放行，避免出口持續回堵。",
    subject:"P-0729-041・RDX-9135 無入場紀錄",
    steps:[
      { title:"核對車牌與入場影像", task:"比對入口攝影機、車牌候選值與訪客預約。", fields:[["辨識車牌／信心度","RDX-9135／82%"],["入口／影像時間","入口 B／18:42"]], action:"確認車牌與入場紀錄", result:"已由入口影像確認 RDX-9135，並找到 18:42 的訪客入場影像。" },
      { title:"補登停車與計費資料", task:"確認停放區域、優惠資格與應收費用。", choices:["補登入場 18:42・訪客折抵 2 小時・應收 NT$ 80","以遺失票卡計費 NT$ 500","轉交客服櫃台人工查驗"], action:"套用補登與計費方案", result:"已補登入場時間並套用訪客折抵，重新計算應收費用 NT$ 80。" },
      { title:"覆核付款並核准出場", task:"確認付款、出口柵欄及例外處理紀錄。", fields:[["付款方式／狀態","信用卡／已付款"],["核准人","值班主管 王雅婷"]], action:"核准放行並結案", result:"付款已核對，出口 C 柵欄已放行，無入場紀錄事件完成結案。" }
    ],
    output:"停車異常覆核單、補登計費紀錄與電子放行證明"
  },
  "jvision-fashion-plm": {
    eyebrow:"服裝商品上市情境",
    title:"完成一款新品從打樣到核准量產",
    story:"SS26 機能短版外套試穿後需要修正版型，原防潑水布料又面臨缺料。請完成商品資料確認、選擇物料與打樣方案，最後核准量產上市。",
    subject:"SS26-TP-044｜機能短版外套",
    steps:[
      { title:"確認商品企劃資料", task:"商品定位、成本目標與上市時程", fields:[["商品／款式編號","SS26-TP-044"],["目標成本與上市日","NT$ 1,260｜2026/09/15"]], action:"確認商品開發任務", result:"商品資料已確認，版師、採購與商品企劃收到本次打樣任務。" },
      { title:"決定打樣與物料方案", task:"試穿修正、替代布料與成本影響", choices:["修正版型並採替代布料｜成本 +4%｜準時上市","維持原布料等待到貨｜延後 14 天","取消本款並調整系列組合"], action:"採用商品開發方案", result:"已採修正版型與替代布料；成本仍在授權範圍，預計上市日不變。" },
      { title:"核准量產與上市", task:"確認核准樣、量產數量與上市交接", fields:[["首批量產數量","1,800 件"],["商品核准人","商品總監 陳怡君"]], action:"核准量產並產生技術包", result:"商品已核准量產，技術包、BOM 與採購需求同步發布給供應商及生產單位。" }
    ],
    output:"SS26-TP-044 商品量產核准單與最終技術包"
  }
};

showcases["jvision-ai-case-075-smart-parking-lpr"] = {
  ...showcases["jvision-smart-parking"],
  eyebrow:"車牌辨識異常情境",
  title:"處理一輛無入場紀錄的出口車輛",
  story:"出口 C 的 RDX-9135 無法取得入場資料，後方已有三輛車等待。值班人員必須從多組辨識候選值中確認正確車牌、回查入口影像、補登停車紀錄並完成例外放行。",
  subject:"LPR-EXC-075・出口 C 車牌覆核",
  output:"車牌辨識覆核紀錄、補登計費單與出口放行證明"
};

const categoryProfiles = {
  "生產製造": ["製造現場情境",["確認工單與資源","選擇生產處置","發布現場指令"],["依原排程執行","調整順序或分批生產","暫停並排除異常"],["工單／產品版本","可用物料與設備"],"生產執行與交接紀錄"],
  "品質管理": ["品質判定情境",["確認檢驗與缺陷","選擇品質處置","核准並追蹤改善"],["允收並放行","隔離後重工","退貨或報廢"],["檢驗批次／規格","缺陷數量與證據"],"品質判定與改善報告"],
  "業務銷售": ["業務成交情境",["確認客戶商機","選擇報價策略","完成客戶交接"],["維持標準報價","調整組合與折扣","升級主管議價"],["客戶／商機金額","預計成交日期"],"商機決策與成交交接紀錄"],
  "採購供應鏈": ["採購決策情境",["確認採購需求","比較供應方案","完成採購核准"],["最低總成本方案","最短交期方案","最低供應風險方案"],["需求數量／預算","交期與供應商"],"採購選商與核准紀錄"],
  "人力資源": ["人事服務情境",["確認人事資料","選擇處理方案","更新員工紀錄"],["核准並生效","退回補充資料","轉交主管確認"],["員工／職缺資料","生效日期／部門"],"人事處理與生效紀錄"],
  "倉儲物流": ["倉儲作業情境",["核對庫存與儲位","選擇搬運處置","完成庫存異動"],["正常揀取或入庫","改派替代儲位","隔離差異庫存"],["料號／批號","數量／來源儲位"],"庫存異動與交接單"],
  "研發管理": ["研發驗證情境",["確認需求與版本","執行驗證決策","發布或退回版本"],["驗證通過","有條件通過","退回修正再測"],["產品／版本","驗收條件／測試範圍"],"研發驗證與版本決議"],
  "經營管理": ["經營決策情境",["釐清經營議題","比較決策方案","指派行動與追蹤"],["立即執行","小規模試行","補充資料後再議"],["決策目標／指標","責任單位／期限"],"經營決策與行動追蹤表"],
  "ESG 永續": ["永續管理情境",["確認數據邊界","處理缺漏與異常","覆核並產生揭露"],["採用原始佐證","要求單位補件","使用估算並揭露"],["據點／申報期間","排放源／佐證文件"],"永續數據覆核與揭露底稿"],
  "零售電商": ["訂單履約情境",["確認顧客訂單","選擇履約方案","完成出貨或售後"],["正常出貨","拆單或替代商品","取消並退款"],["訂單／商品","庫存／付款狀態"],"訂單履約與顧客通知紀錄"],
  "教育": ["教學服務情境",["確認課程與學員","安排教學處置","完成評量追蹤"],["正常授課","補課或個別輔導","調整教材與進度"],["課程／班級","教師／授課日期"],"教學執行與評量紀錄"],
  "營建工程": ["工地執行情境",["確認圖說與工項","執行查驗處置","完成簽認與交接"],["查驗合格","限期改善後複驗","停工釐清"],["工項／施工區域","圖說版本／數量"],"施工查驗與簽認紀錄"],
  "醫療照護": ["照護服務情境",["確認服務對象","執行專業處置","安排後續追蹤"],["完成服務","持續追蹤","轉介專業人員"],["服務對象／需求","預約或處置日期"],"服務處置與追蹤紀錄"],
  "企業協作": ["跨部門協作情境",["確認任務與責任","協調執行方案","完成交付與歸檔"],["依原分工執行","調整負責人與期限","升級主管協調"],["任務／提案人","部門／完成期限"],"協作決議與交付紀錄"],
  "財務會計": ["財務覆核情境",["核對單據與金額","處理差異與權限","完成入帳或付款"],["核准入帳／付款","退回補齊憑證","暫停並調查差異"],["單據／交易對象","金額／會計期間"],"財務覆核與入帳憑證"],
  "金融保險": ["金融審查情境",["確認申請與身分","完成風險審查","核定契約條件"],["核准承作","附條件核准","婉拒或退回補件"],["申請人／商品","金額／風險資料"],"審查決議與契約紀錄"],
  "資訊科技": ["IT 服務情境",["確認服務影響","執行技術處理","完成驗收與關閉"],["依標準程序處理","安排變更時段","回復原設定"],["系統／使用者","影響範圍／服務等級"],"IT 服務處理與驗收單"],
  "交通運輸": ["交通營運情境",["確認班次與車況","調整調度方案","完成行程交接"],["按原班次執行","更換車輛或駕駛","取消並通知旅客"],["車輛／班次","路線／服務時段"],"班次執行與到站紀錄"],
  "資訊安全": ["資安事件情境",["確認告警與資產","選擇隔離處置","驗證復原並結案"],["隔離受影響資產","停權可疑帳號","持續監控與蒐證"],["告警／受影響資產","風險等級／事件時間"],"資安處置與事件結案報告"],
  "設備維護": ["設備維修情境",["確認故障與影響","執行維修方案","試車復機與追蹤"],["立即修復","更換備品","停機等待原廠"],["設備／故障代碼","停機時間／備品"],"維修復機與保養履歷"],
  "物流運輸": ["運送履約情境",["確認貨物與時窗","調整派車路線","完成簽收與計費"],["依原路線配送","改派車輛或站點","延後並通知收貨人"],["貨物／取送地點","車輛／到貨時窗"],"運送簽收與費用紀錄"],
  "專業服務": ["專業案件情境",["確認委託範圍","執行專業判斷","交付並取得驗收"],["依原方案交付","調整範圍與時程","補充資料後再執行"],["客戶／委託事項","交付物／完成期限"],"專業服務交付與驗收紀錄"],
  "餐飲旅宿": ["現場服務情境",["確認顧客與預約","安排現場方案","完成結帳與回饋"],["依原預約服務","升等或更換資源","取消並退款"],["顧客／日期","桌房／服務需求"],"服務履約與結帳紀錄"],
  "生活服務": ["顧客服務情境",["確認預約需求","安排服務資源","完成收款與回訪"],["按預約執行","更換人員或時段","取消並退款"],["顧客／服務項目","人員／預約時段"],"顧客服務與收款紀錄"],
  "數據分析": ["分析決策情境",["定義分析問題","驗證資料與模型","發布洞察與行動"],["採用目前分析結果","補充資料後重算","交由專家覆核"],["分析主題／使用者","資料來源／期間"],"分析結論與決策建議"],
  "客服管理": ["客戶服務情境",["確認客訴與影響","選擇回覆方案","完成回訪與結案"],["提供標準解法","升級二線處理","提供補償方案"],["客戶／問題","管道／承諾時限"],"客戶回覆與案件結案紀錄"],
  "宗教服務": ["信眾服務情境",["確認信眾登記","安排服務與名額","完成收款與通知"],["依登記內容辦理","調整日期或項目","退費並取消"],["信眾／服務項目","日期／燈位或名額"],"信眾服務登記與收據"],
  "企業營運": ["營運執行情境",["確認營運目標","協調資源與風險","發布行動並追蹤"],["立即執行","試行後擴大","暫緩並補充評估"],["營運議題／據點","責任單位／期限"],"營運決議與成效追蹤紀錄"]
};

const manufacturingProfiles = {
  planning: ["生產規劃情境",["匯入訂單與產能","試排並處理衝突","發布可執行排程"],["優先滿足承諾交期","降低換線並合併批量","拆批生產並協調交貨"],["訂單／工單","產能日曆／物料到料日"],"產能負荷表、缺料清單與正式排程版本"],
  dispatch: ["現場派工情境",["確認待派工單","指派機台與人員","回報完工與交接"],["依優先級派工","改派可用工作中心","暫停工單並回報異常"],["工單／批號","機台／班別／作業員"],"派工單、報工紀錄與在製品狀態"],
  maintenance: ["設備維護情境",["受理設備異常","診斷並安排維修","驗收復機與保養"],["立即停機搶修","切換備援設備","排入預防保養窗口"],["設備編號／異常碼","維修人員／備品"],"維修工單、停機原因與復機驗收紀錄"],
  tooling: ["生產資源履歷情境",["確認資源狀態","執行領用或校驗","歸還並更新履歷"],["核准領用","送外校驗或保養","停用並更換"],["模具／刀治具／量具","壽命次數／校驗期限"],"資源履歷、領用紀錄與下次保養日期"],
  integration: ["設備連線情境",["註冊設備與訊號","驗證通訊與資料","發布連線並監控"],["套用標準通訊參數","隔離異常設備","切換備援資料來源"],["設備／通訊協定","資料標籤／採樣頻率"],"設備連線清單、資料品質報告與告警規則"],
  material: ["物料供應情境",["核對需求與庫存","執行備料或補料","上線核料與追蹤"],["由安全庫存補料","跨庫調撥","建立緊急採購需求"],["料號／批號","需求量／儲位／替代料"],"備料單、補料指令與批次使用紀錄"],
  process: ["製程控制情境",["擷取製程數據","判讀偏移與風險","調整參數並驗證"],["沿用核准參數","微調至管制中心線","停機隔離並通知工程師"],["站點／機台／配方","參數值／上下管制界線"],"參數變更紀錄、製程判定與驗證結果"],
  traceability: ["批次追溯情境",["鎖定產品批次","展開物料與製程系譜","界定影響並發布處置"],["隔離同批在製品","追查上游物料批號","鎖定出貨客戶與召回範圍"],["成品序號／批號","工單／物料批號／站點"],"正反向追溯報告與影響批次清單"],
  lean: ["精實改善情境",["記錄現況與浪費","比較改善方案","執行改善並追蹤"],["消除等待與搬運","平衡站點工時","縮短換線與在製品"],["產線／改善主題","現況工時／目標值"],"改善前後對照、責任清單與效益追蹤"],
  analytics: ["製造分析情境",["選定分析範圍","找出損失與根因","建立改善追蹤"],["依設備比較","依產品與班別比較","下鑽至停機或不良明細"],["廠區／產線／期間","指標／比較基準"],"分析快照、根因排行與改善任務"],
  utilities: ["廠務監控情境",["監測環境與用量","判讀超限事件","派工處置並確認復原"],["調整運轉設定","檢查洩漏或異常耗用","啟動備援並通知值班人員"],["區域／錶點／感測器","警戒值／持續時間"],"超限事件、處置工單與復原趨勢"],
  engineering: ["工程與成本變更情境",["建立變更或試算基準","評估影響與成本","核准版本並發布"],["採用新版 BOM","保留舊版至批次用罄","分階段切換並管控庫存"],["產品／BOM／版本","生效日／成本／影響工單"],"版本差異、成本影響與生效通知"]
};

const integratedDemoProfiles = {
  "jvision-carbon-inventory": {
    label:"排放資料工作台", record:"台北總部 2026/07 外購電力", fields:[["用電量（kWh）","128,600"],["電力排放係數","0.474"],["盤查負責人","永續管理師 林怡君"]],
    actions:["確認活動數據與憑證","送交單位主管覆核","納入範疇二盤查"], checks:["台電帳單已附檔","據點與期間正確","排放係數版本有效"], output:"範疇二排放量試算與查核底稿"
  },
  "jvision-inventory": {
    label:"庫存異動工作台", record:"PK-BOX-042 外箱安全庫存異常", fields:[["目前庫存","86"],["安全庫存","120"],["來源／目的儲位","A-03 → B-12"]],
    actions:["建立跨庫調撥","產生補貨建議","執行循環盤點"], checks:["批號與效期可用","目的儲位容量足夠","異動數量已複核"], output:"庫存調撥單與異動履歷"
  },
  "jvision-hris": {
    label:"招募甄選工作台", record:"張凱翔・資料分析師", fields:[["應徵職缺","資料分析師"],["面試時間","2026/07/29 14:00"],["招募負責人","王怡君"]],
    actions:["安排面試並寄送通知","送主管複試","建立錄取簽核"], checks:["履歷與作品集完整","面談評分已填寫","薪資區間符合編制"], output:"候選人評估表與錄取簽核單"
  },
  "jvision-event-wedding": {
    label:"活動籌備工作台", record:"林小姐婚宴・2026/09/18", fields:[["預估桌數","32"],["場地","晶華宴會廳 A"],["專案企劃","Mia"]],
    actions:["建立報價與方案","送出合約簽核","發布活動執行表"], checks:["場地檔期已保留","菜單與設備需求確認","訂金條件已載明"], output:"婚宴報價、合約與當日流程表"
  },
  "jvision-production-order": {
    label:"生產派工工作台", record:"MO-0724 醫療支架 680 件", fields:[["可用物料","560 件"],["工作中心","CNC-03"],["承諾交期","2026/08/05"]],
    actions:["拆批並建立排程","指派機台與作業員","回報首批完工"], checks:["圖面版本已核准","缺料 120 件已有到料日","機台與人員可用"], output:"正式派工單、缺料追蹤與報工紀錄"
  },
  "jvision-srm": {
    label:"供應商採購工作台", record:"鋁合金外殼年度採購", fields:[["需求數量","12,000 件"],["目標單價","NT$ 86"],["需求日期","2026/08/20"]],
    actions:["邀請合格供應商報價","執行價格與交期比較","送出採購核准"], checks:["供應商資格有效","報價條件可比較","品質與交期風險已評分"], output:"比價表、供應商建議與採購核准單"
  },
  "jvision-equipment-maintenance-suite": {
    label:"設備維護工作台", record:"CNC-07 主軸溫度異常", fields:[["異常代碼","TEMP-HIGH-07"],["停機影響","產線二・每小時 48 件"],["維修技師","陳志明"]],
    actions:["隔離設備並建立通報","領用備品並執行維修","試運轉後核准復機"], checks:["能源已安全隔離","故障原因已記錄","試運轉參數正常"], output:"故障維修單、備品耗用與復機驗收"
  },
  "jvision-maintenance": {
    label:"預防保養工作台", record:"空壓機 AC-02 月保養", fields:[["保養週期","每 30 日"],["本次到期日","2026/07/31"],["保養負責人","廠務組 林冠宇"]],
    actions:["建立保養工單","完成點檢與耗材更換","主管驗收並排下次保養"], checks:["點檢表已逐項完成","耗材批號已登錄","異常讀值已有處置"], output:"預防保養紀錄與下次排程"
  },
  "jvision-office-automation": {
    label:"電子簽核工作台", record:"研發部設備請購 NT$ 286,000", fields:[["申請單位","研發部"],["預算科目","研發設備費"],["申請人","陳怡君"]],
    actions:["檢查附件並送簽","執行主管與財務會簽","核准後建立採購需求"], checks:["報價單已附檔","預算餘額足夠","簽核層級符合金額"], output:"電子簽核歷程與核准請購單"
  },
  "jvision-pharmacy-claim": {
    label:"處方申報工作台", record:"RX-0729-018 慢性處方箋", fields:[["患者","王○明"],["給藥天數","28 日"],["申報類別","一般健保"]],
    actions:["完成調劑與交互作用檢核","產生申報費用明細","批次送出健保申報"], checks:["醫令與藥品碼相符","給藥量與天數合理","部分負擔已計算"], output:"藥袋、收據與健保申報檔"
  },
  "jvision-auto-glass-ops": {
    label:"汽車玻璃工單", record:"RDX-9135 前擋更換與 ADAS 校正", fields:[["車型／VIN","Toyota RAV4／VIN 8D27"],["玻璃料號","FW04873"],["保險案件","CLM-2026-183"]],
    actions:["確認玻璃庫存與訂購","完成安裝與 ADAS 校正","交車並送出理賠文件"], checks:["玻璃規格符合 VIN","膠體固化時間完成","校正報告數值正常"], output:"施工工單、ADAS 校正報告與理賠附件"
  },
  "jvision-dental-assistant": {
    label:"牙科約診工作台", record:"陳○怡・根管治療回診", fields:[["看診醫師","林醫師"],["預約時間","2026/07/30 10:30"],["療程階段","第二次根管治療"]],
    actions:["確認病歷與術前提醒","完成看診與處置紀錄","安排回診並產生費用"], checks:["過敏史已確認","影像與病歷可供醫師查看","術後注意事項已交付"], output:"本次看診紀錄、費用與回診通知"
  },
  "jvision-optical-saas": {
    label:"驗光配鏡工作台", record:"李○蓁・漸進多焦配鏡", fields:[["驗光結果","R -3.25／L -3.00"],["鏡框","Urban 218 黑"],["驗光師","許哲維"]],
    actions:["確認驗光與瞳距資料","選配鏡片並建立加工單","品質檢查後通知取件"], checks:["處方與瞳距完整","鏡片規格及鍍膜確認","成鏡度數與外觀合格"], output:"驗光處方、加工單與取件通知"
  },
  "jvision-sign-shop-management": {
    label:"招牌工程工作台", record:"晨光診所立體字招牌", fields:[["現勘尺寸","寬 420 × 高 95 cm"],["材質與光源","不鏽鋼烤漆字／LED"],["專案負責人","Leo"]],
    actions:["依現勘建立正式報價","核准設計稿並排入製作","完成安裝與客戶驗收"], checks:["現場尺寸與電源確認","招牌許可需求已確認","安裝安全計畫已備妥"], output:"正式報價、製作單與安裝驗收單"
  },
  "jvision-towing-dispatch": {
    label:"道路救援派遣台", record:"國道三號 42K 爆胎救援", fields:[["客戶／車牌","林先生／BFE-7281"],["定位","北上 42.3K 外側路肩"],["安全風險","車輛占用部分車道"]],
    actions:["確認位置與救援需求","指派最近車輛並導航","完成簽收與費用結算"], checks:["人員已移至安全處","拖吊車型與設備符合","抵達及完工時間已記錄"], output:"派車紀錄、電子簽收與救援結算單"
  },
  "jvision-claims-management": {
    label:"理賠案件工作台", record:"CLM-2026-0183 車體險理賠", fields:[["被保險人","陳○豪"],["估損金額","NT$ 86,500"],["承辦理賠員","王怡君"]],
    actions:["受理案件並檢核文件","完成估損與責任審核","核准賠付並通知客戶"], checks:["事故與保單資料相符","維修估價及照片完整","賠付權限符合核決層級"], output:"理賠審核紀錄、核賠通知與付款指示"
  },
  "jvision-smart-mfg-266-backup-dr": {
    label:"災難復原控制台", record:"ERP Production・勒索軟體復原演練", fields:[["復原點","2026/07/30 01:55 不可變快照"],["復原目標","RPO 15 分鐘／RTO 2 小時"],["隔離復原區","DR-VLAN-220"]],
    actions:["掛載快照並執行惡意程式掃描","啟動 ERP 與資料庫隔離還原","完成驗證後申請正式切回"], checks:["備份雜湊與不可變狀態驗證通過","ERP 登入、訂單與資料庫一致性正常","DNS、介接與使用者驗收已完成"], output:"災難復原演練報告、RPO/RTO 實績與切回核准單"
  },
  "jvision-smart-parking": {
    label:"停車場異常處理台", record:"RDX-9135・出口無入場紀錄", fields:[["目前位置","出口 C"],["入場影像","入口 B・18:42"],["應收費用","NT$ 80"]],
    actions:["覆核車牌辨識候選值","補登入場與訪客折抵","確認付款並核准放行"], checks:["入口影像與車牌已比對","訪客折抵及停車費計算正確","付款完成且柵欄設備可用"], output:"停車異常覆核單、補登計費紀錄與電子放行證明"
  },
  "jvision-ai-case-075-smart-parking-lpr": {
    label:"車牌辨識覆核台", record:"RDX-9135・無入場紀錄待覆核", fields:[["辨識候選值","RDX-9135・82%"],["入口影像","入口 B・18:42"],["出口車道","出口 C"]],
    actions:["比對入口影像與訪客預約","補登入場時間並重新計費","覆核付款並開啟柵欄"], checks:["車牌與車型影像一致","入場時間及費率計算正確","例外放行原因與核准人已記錄"], output:"車牌辨識覆核紀錄、補登計費單與出口放行證明"
  }
};

const addonCheckProfiles = {
  operations:["主檔與作業資料已確認","負責人與完成期限已指派","例外與退回條件已說明"],
  manufacturing:["工單、版本與批號資料一致","物料、設備與人員資源可用","品質與交期風險已有處置"],
  quality:["檢驗規格與抽樣基準正確","受影響批次已隔離或標示","原因證據與放行條件已記錄"],
  maintenance:["設備已安全隔離並完成通報","技師、備品與維修窗口已確認","試運轉及復機標準已建立"],
  security:["事件範圍與受影響資產已確認","隔離、備份與證據保存措施完成","復原驗證與主管核准條件明確"],
  technology:["服務、環境與變更範圍已確認","測試、回復與監控方式已準備","上線驗收與操作文件已完成"],
  procurement:["需求規格、數量與預算已確認","供應商資格與報價條件可比較","核准權限及交付驗收條件完整"],
  finance:["憑證、金額與會計期間正確","預算、稅務與付款條件已核對","覆核與入帳軌跡可追溯"],
  people:["人員資料與申請原因完整","資格、工時或薪資規則已檢核","主管核准與通知對象已確認"],
  sales:["客戶需求、預算與決策角色明確","報價、毛利與交付能力已確認","跟進節點與成交條件已記錄"],
  service:["顧客資料、預約與服務需求完整","資源、時段與費用已確認","完成驗收與後續通知方式明確"],
  healthcare:["個案身分、紀錄與專業評估完整","醫囑、處置與風險提醒已確認","費用、追蹤與隱私要求已完成"],
  education:["課程對象、目標與素材完整","審查、排程與授課資源已確認","發布、通知與學習成果可追蹤"],
  logistics:["貨物、地址與時效需求完整","車輛、人員與路線資源可用","簽收、異常與費用證據可追溯"],
  construction:["圖說、範圍與現場條件已確認","工班、材料與安全措施已到位","查驗、計價與變更紀錄可追溯"],
  sustainability:["活動數據、期間與場域正確","係數、來源與查核證據完整","改善責任與成效追蹤方式明確"],
  analytics:["分析口徑、期間與資料來源一致","異常值與資料品質問題已處理","結論、門檻與後續行動可驗證"]
};

const categoryAddonGroups = {
  "生產製造":"manufacturing","品質管理":"quality","設備維護":"maintenance",
  "資訊安全":"security","資訊科技":"technology","內容管理":"technology","數據分析":"analytics",
  "採購供應鏈":"procurement","財務會計":"finance","金融保險":"finance",
  "人力資源":"people","業務銷售":"sales","客服管理":"service","生活服務":"service",
  "專業服務":"service","宗教服務":"service","餐飲旅宿":"service","零售電商":"service",
  "醫療照護":"healthcare","教育":"education","物流運輸":"logistics","交通運輸":"logistics","倉儲物流":"logistics",
  "營建工程":"construction","ESG 永續":"sustainability","企業協作":"operations","企業營運":"operations",
  "經營管理":"analytics"
};

function sampleMetricValue(label, index) {
  const text = String(label || "");
  if (/率|完成|達成|可用|準時/.test(text)) return ["92.4%","88.6%","96.1%"][index % 3];
  if (/金額|成本|收入|費用|預算/.test(text)) return ["NT$ 286,000","NT$ 1,260,000","NT$ 86,500"][index % 3];
  if (/時間|工時|RTO|天數|期限/.test(text)) return ["2 小時","D+3","28 分鐘"][index % 3];
  if (/風險|異常|告警|缺|待|事件/.test(text)) return ["2 項","3 項","1 項"][index % 3];
  return ["8 筆","12 筆","6 筆"][index % 3];
}

function buildIntegratedAddonProfile(project, config) {
  if (!project || project.repoName === "jvision-fashion-plm") return null;
  const group = categoryAddonGroups[project.category] || "operations";
  const metrics = Array.isArray(project.operationalMetrics) && project.operationalMetrics.length
    ? project.operationalMetrics.slice(0,3)
    : ["待處理項目","本週完成率","高風險項目"];
  const roles = String(project.primaryUser || "專案負責人").split(/[、，/]/).filter(Boolean);
  return {
    label:`${project.category || "業務"}即時操作台`,
    record:config.subject || `${project.title} 展示案件`,
    fields:[
      [metrics[0],sampleMetricValue(metrics[0],0)],
      [metrics[1] || "處理進度",sampleMetricValue(metrics[1],1)],
      ["本階段負責人",roles[0] || "專案負責人"]
    ],
    actions:config.steps.map(step => step.action),
    checks:addonCheckProfiles[group],
    output:config.output
  };
}

const transportProfiles = {
  vehicleService:["車輛服務與維修流程",["接收車輛並確認需求","檢查估價與客戶核價","完工驗收並交車"],["核准原估價施工","追加項目後重新核價","暫停工單等待零件"],["車牌／維修工單","車型／服務顧問"],"維修工單、用料與交車紀錄"],
  coldChain:["冷鏈運輸異常處置",["確認超溫事件","決定轉運或貨品處置","完成品質判定"],["啟動備援冷凍機","轉運至鄰近冷鏈車","隔離貨品送品質判定"],["車次／運送貨品","溫度／持續時間"],"溫控異常、處置與品質判定紀錄"],
  rental:["租賃車取還車檢查",["建立取還車檢查","比對損傷與追加費用","完成結算並更新車況"],["收取損傷與油料費","轉送保險理賠","判定為既有損傷"],["租約／車牌","里程／油量／車況照片"],"車況檢查、損傷判定與結算紀錄"],
  driverRoster:["駕駛排班與工時管理",["匯入班次與可用駕駛","檢核資格工時並排班","主管覆核並發布"],["改派合格備勤駕駛","調整前後班次","申請例外並增加休息"],["班次／需求車型","駕駛資格／累計工時"],"駕駛班表、工時檢核與發布紀錄"]
};

function getTransportProfile(project) {
  const repo = project.repoName || "";
  if (repo.includes("cold-chain")) return transportProfiles.coldChain;
  if (repo.includes("rental-car")) return transportProfiles.rental;
  if (repo.includes("driver-roster")) return transportProfiles.driverRoster;
  return transportProfiles.vehicleService;
}

function getManufacturingProfile(project) {
  const text = `${project.repoName || ""} ${project.title || ""}`.toLowerCase();
  const rules = [
    ["planning", /schedul|planning|capacity|crp|fcs|aps|simulation|forecast/],
    ["maintenance", /maintenance|asset.performance|downtime|停機|維修|設備績效|備品/],
    ["tooling", /calibration|mold|die-management|tool-fixture|校驗|模具|刀治具/],
    ["integration", /iot|gateway|digital-twin|secs[/-]?gem|\bgem\b|\bdnc\b|operations-center|uns-platform|設備通訊|數位分身/],
    ["material", /material-control|feeder|kanban|物料|餵料|庫存|備料/],
    ["traceability", /traceability|genealogy|lot-batch|批次|批號|追溯|系譜/],
    ["process", /spc|run-to-run|r2r|fault-detection|fdc|recipe|parameter|poka|yield|製程|配方|防呆|良率/],
    ["lean", /\blean\b|kaizen|\b5s\b|line-balanc|takt|smed|value-stream|visual-management|andon|精實|改善|節拍|換線|安燈/],
    ["utilities", /utility|cleanroom|environmental|energy|用水|公用|無塵室|環境監控/],
    ["analytics", /oee|dashboard|reporting|intelligence|analytics|copilot|margin|daily|大數據|報表|洞察|營運中心/],
    ["engineering", /ecn|bom|cost|plm|fashion|工程變更|成本|產品生命週期/],
    ["dispatch", /dispatch|work-order|manufacturing-execution|shop-floor|production-order|smt-line|派工|工單|mes|sfc/]
  ];
  const key = rules.find(([, pattern]) => pattern.test(text))?.[0] || "dispatch";
  return manufacturingProfiles[key];
}

function buildGenericProjectShowcase(project, forcedProfile) {
  const profile = forcedProfile || (project.category === "生產製造"
    ? getManufacturingProfile(project)
    : categoryProfiles[project.category] || ["業務操作情境",["確認案件資料","選擇處理方案","完成交付與紀錄"],["依標準流程執行","調整條件後執行","退回補充資料"],["案件／負責人","需求／完成期限"],"業務處理與交付紀錄"]);
  const [eyebrow, stepTitles, choices, fieldLabels, outputLabel] = profile;
  const metrics = Array.isArray(project.operationalMetrics) && project.operationalMetrics.length ? project.operationalMetrics : ["待處理","異常項目","完成率","待核准"];
  const quoted = [...String(project.description || "").matchAll(/「([^」]+)」/g)].map(match => match[1]);
  const subject = quoted[1] || quoted[0] || `${project.title} 示範案件`;
  const roles = String(project.primaryUser || "承辦人、主管").split(/[、，]/).filter(Boolean);
  return {
    eyebrow,
    title:`用「${project.title}」完成一筆現場任務`,
    story:`${project.businessSituation || project.description || "今天有一筆需要判斷與交辦的現場案件。"} 本次將使用「${project.title}」完成處理並產生可追蹤的結果。`,
    subject,
    steps:[
      {
        title:stepTitles[0], task:`先掌握「${metrics[0]}」與本次案件條件`,
        fields:[[fieldLabels[0],subject],[fieldLabels[1],project.dailyUse || "今日完成確認"]], action:`完成${stepTitles[0]}`,
        result:`已確認「${subject}」的必要資料，${roles[0] || "承辦人"}可以進入下一步。`
      },
      {
        title:stepTitles[1], task:`針對「${metrics[1] || metrics[0]}」選擇可執行方案`,
        choices, action:`套用${stepTitles[1]}結果`,
        result:`已記錄處理方案，並同步「${metrics[1] || "異常與待辦"}」的影響與責任。`
      },
      {
        title:stepTitles[2], task:`確認責任人、完成期限與「${metrics[3] || "核准狀態"}」`,
        fields:[["執行／核准人",roles[1] || roles[0] || "部門主管"],["完成與生效日期","2026/08/01"]], action:`確認${stepTitles[2]}`,
        result:`案件已完成，相關人員收到通知，並留下可供客戶驗收與追蹤的紀錄。`
      }
    ],
    output:`${project.title}｜${outputLabel} #${project.id}`
  };
}

function getFinanceProfile(project) {
  const text = `${project.repoName} ${project.title}`.toLowerCase();
  const profiles = {
    payable:["應付帳款付款情境",["核對請款與驗收","處理差異並排入付款","執行付款與供應商沖帳"],["三方核對一致，排入正常付款","數量或價格有差異，退回採購確認","付款條件例外，送財務主管核准"],["供應商／發票號碼","未稅金額／付款條件"],"應付核准、付款批次與供應商沖帳紀錄"],
    receivable:["應收帳款催收情境",["確認逾期與爭議","記錄催收與付款承諾","登錄收款並完成核銷"],["取得全額付款承諾","先收無爭議款項","暫停信用額度並升級處理"],["客戶／發票號碼","未收金額／到期日"],"催收歷程、收款核銷與客戶對帳更新"],
    ledger:["總帳過帳與關帳情境",["彙整來源單據與會計期間","編製並覆核傳票","過帳、調節並鎖定期間"],["正常過帳","退回補齊憑證或科目","建立調整分錄後過帳"],["來源單據／公司別","會計期間／借貸金額"],"核准傳票、總帳過帳與期間調節紀錄"],
    costing:["製造成本結算情境",["確認工單實績與成本來源","計算分攤並分析差異","核准成本並完成結轉"],["接受差異並結轉","修正工時或用料後重算","重大差異轉主管覆核"],["工單／產品","料工費／結算期間"],"產品實際成本、差異說明與成本結轉傳票"],
    planning:["預算與投資決策情境",["建立假設、額度與申請資料","比較情境及財務效益","核准額度並追蹤執行"],["核准原方案","調整範圍或分期執行","退回補充效益與風險資料"],["部門／投資專案","申請金額／效益假設"],"預算核定、決策依據與執行追蹤紀錄"],
    treasury:["資金與避險執行情境",["彙總帳戶餘額與曝險","選擇調撥或避險方案","執行交易並完成銀行確認"],["內部資金調撥","承作遠期外匯或避險交易","保留部位並設定預警"],["公司／幣別部位","金額／到期日"],"資金調撥或避險成交確認與部位更新"],
    asset:["資產與存貨評價情境",["建立資產或存貨評價基礎","執行盤點、折舊或減損試算","覆核差異並完成入帳"],["依原帳面資料入帳","調整耐用年限或備抵率","差異重大，轉主管覆核"],["資產／存貨編號","成本／評價日期"],"盤點差異、評價結果與會計調整傳票"],
    close:["財務關帳與合併情境",["確認關帳清單與子公司回報","完成調節、換算與內部沖銷","覆核報表並核准發布"],["完成正常關帳","退回補正未平衡項目","以調整分錄處理後關帳"],["公司／報表期間","調節項目／差異金額"],"關帳核准、合併調整與正式財務報表"],
    tax:["稅務申報與法遵情境",["彙整交易與申報憑證","計算稅額並檢查適用規則","覆核申報並保存查核底稿"],["依計算結果申報","補正憑證或稅則分類","重大差異送稅務主管判斷"],["申報類型／期間","課稅基礎／稅額"],"稅務申報檔、繳款資料與查核底稿"],
    audit:["財務稽核改善情境",["設定查核範圍與抽樣","執行測試並記錄例外","確認改善責任並追蹤結案"],["控制有效，完成查核","發現缺失，建立改善計畫","重大異常，升級稽核主管"],["查核流程／樣本","控制目標／責任單位"],"稽核工作底稿、缺失改善與結案紀錄"],
    invoice:["電子發票開立情境",["核對交易、買受人與字軌","開立上傳並處理平台回應","處理作廢折讓並完成歸檔"],["正常開立並上傳","資料錯誤，退回修正","開立折讓或作廢重開"],["訂單／買受人統編","發票金額／課稅別"],"電子發票、平台回應與作廢折讓履歷"],
    expense:["差旅費用報銷情境",["核對申請、預算與單據","檢查政策並完成主管核准","付款報銷並過帳結案"],["符合政策，核准報銷","超標但具事由，送例外核准","單據不足，退回補件"],["員工／出差單號","費用金額／成本中心"],"費用核准、付款與會計過帳紀錄"],
    reconciliation:["銀行對帳與金流核銷情境",["匯入銀行交易並自動配對","調查未明款與差異","覆核核銷並完成入帳"],["自動配對成功，直接核銷","轉暫收款並追查來源","手續費或匯差建立調整分錄"],["銀行帳戶／交易序號","入款金額／交易日期"],"銀行調節表、未明款追蹤與核銷傳票"]
  };
  if (/accounts-payable|ap-system|應付帳款/.test(text)) return profiles.payable;
  if (/accounts-receivable|collections|應收帳款|催收/.test(text)) return profiles.receivable;
  if (/manufacturing-cost|成本會計/.test(text)) return profiles.costing;
  if (/budget|fp-a|capex|預算|資本支出|財務分析/.test(text)) return profiles.planning;
  if (/treasury|cash-flow|fx-hedging|資金|現金流|避險/.test(text)) return profiles.treasury;
  if (/fixed-asset|inventory-costing|固定資產|存貨成本/.test(text)) return profiles.asset;
  if (/consolidation|financial-reporting|close-system|合併報表|關帳/.test(text)) return profiles.close;
  if (/customs|tax|transfer-pricing|關稅|稅務|移轉訂價/.test(text)) return profiles.tax;
  if (/audit|稽核/.test(text)) return profiles.audit;
  if (/e-invoice|電子發票/.test(text)) return profiles.invoice;
  if (/travel-expense|差旅|費用報銷/.test(text)) return profiles.expense;
  if (/bank-reconciliation|cash-application|銀行對帳|金流核銷/.test(text)) return profiles.reconciliation;
  return profiles.ledger;
}

function buildProjectShowcase(project) {
  const isFinanceWorkflow = project.category === "財務會計"
    || /^jvision-smart-mfg-2(?:2[1-9]|3\d|40)-/.test(project.repoName);
  if (isFinanceWorkflow) {
    return buildGenericProjectShowcase(project, getFinanceProfile(project));
  }
  if (project.customerWorkflow) {
    const originalProfile = categoryProfiles[project.category];
    const workflow = project.customerWorkflow;
    categoryProfiles[project.category] = [
      workflow.eyebrow,
      workflow.steps,
      workflow.choices,
      workflow.fields,
      workflow.output
    ];
    const showcase = buildGenericProjectShowcase(project);
    if (originalProfile) categoryProfiles[project.category] = originalProfile;
    else delete categoryProfiles[project.category];
    return showcase;
  }
  if (project.category !== "\u4ea4\u901a\u904b\u8f38") return buildGenericProjectShowcase(project);
  const originalProfile = categoryProfiles[project.category];
  categoryProfiles[project.category] = getTransportProfile(project);
  const showcase = buildGenericProjectShowcase(project);
  if (originalProfile) categoryProfiles[project.category] = originalProfile;
  else delete categoryProfiles[project.category];
  return showcase;
}

export function getCustomerShowcaseConfig(project, slug = project.repoName) {
  return showcases[slug] || buildProjectShowcase(project);
}

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

export function mountCustomerShowcase({ project, slug }) {
  const config = getCustomerShowcaseConfig(project, slug);
  const traceStorageKey = `jvision-showcase-trace:${slug}`;
  const tracePrefixByCategory = {
    "\u751f\u7522\u88fd\u9020":"MO",
    "\u63a1\u8cfc\u4f9b\u61c9\u93c8":"PO",
    "\u54c1\u8cea\u7ba1\u7406":"QA",
    "\u4eba\u529b\u8cc7\u6e90":"HR",
    "\u696d\u52d9\u92b7\u552e":"CRM",
    "\u8ca1\u52d9\u6703\u8a08":"FIN",
    "\u91ab\u7642\u7167\u8b77":"MED",
    "\u4ea4\u901a\u904b\u8f38":"TRN",
    "\u8cc7\u8a0a\u5b89\u5168":"SEC",
    "\u6559\u80b2":"EDU",
    "\u4f01\u696d\u71df\u904b":"OPS"
  };
  const tracePrefix = tracePrefixByCategory[project.category] || "JV";
  const defaultTrace = {
    id: `${tracePrefix}-${String(project.id || "000").padStart(3, "0")}-001`,
    status: config.steps[0]?.title || "\u5f85\u8655\u7406",
    location: `${project.title}\uff0f${config.eyebrow}`,
    updatedAt: "",
    activities: []
  };
  let traceState = defaultTrace;
  try {
    const savedTrace = JSON.parse(localStorage.getItem(traceStorageKey) || "null");
    if (savedTrace && savedTrace.id) traceState = { ...defaultTrace, ...savedTrace };
  } catch {}
  const saveTrace = () => {
    try { localStorage.setItem(traceStorageKey, JSON.stringify(traceState)); } catch {}
  };
  const timeLabel = () => new Intl.DateTimeFormat("zh-TW", {
    month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit"
  }).format(new Date());
  const host = document.querySelector(".workspace") || document.querySelector("#demo") || document.querySelector("main") || document.body;
  const previous = host.querySelector(".jv-domain-demo");
  if (previous) previous.remove();
  const root = document.createElement("section");
  root.className = "jv-customer-showcase";
  const originalFashionWorkspace = slug === "jvision-fashion-plm" ? document.querySelector("#demo .demo-shell") : null;
  if (originalFashionWorkspace) {
    const switcher = document.createElement("nav");
    switcher.className = "jv-showcase-mode-switch";
    switcher.setAttribute("aria-label", "服裝 PLM 展示模式");
    switcher.innerHTML = '<button class="active" data-showcase-mode="story">商品上市任務</button><button data-showcase-mode="workspace">自由工作台</button>';
    originalFashionWorkspace.before(switcher);
    switcher.after(root);
    originalFashionWorkspace.hidden = true;
    switcher.querySelectorAll("[data-showcase-mode]").forEach(button => button.addEventListener("click", () => {
      const storyMode = button.dataset.showcaseMode === "story";
      root.hidden = !storyMode;
      originalFashionWorkspace.hidden = storyMode;
      switcher.querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button));
    }));
  } else {
    host.append(root);
  }
  let current = 0;
  let selectedChoice = -1;
  const completed = [];
  const workStorageKey = `jvision-showcase-work:${slug}`;
  const defaultWorkState = {
    fields: config.steps.map(step => Object.fromEntries((step.fields || []).map(([label, value]) => [label, value]))),
    choices: config.steps.map(() => -1),
    notes: config.steps.map(() => ""),
    attachments: config.steps.map(() => []),
    records: [],
    message: ""
  };
  let workState = defaultWorkState;
  try {
    const savedWork = JSON.parse(localStorage.getItem(workStorageKey) || "null");
    if (savedWork) workState = {
      ...defaultWorkState,
      ...savedWork,
      fields: defaultWorkState.fields.map((fields, index) => ({ ...fields, ...(savedWork.fields?.[index] || {}) })),
      choices: defaultWorkState.choices.map((choice, index) => savedWork.choices?.[index] ?? choice),
      notes: defaultWorkState.notes.map((note, index) => savedWork.notes?.[index] ?? note),
      attachments: defaultWorkState.attachments.map((items, index) => savedWork.attachments?.[index] || items)
    };
  } catch {}
  const saveWork = () => {
    try { localStorage.setItem(workStorageKey, JSON.stringify(workState)); } catch {}
  };
  const fashionState = {
    stage: "試穿修正",
    materials: [
      { name:"防潑水尼龍", supplier:"Future Fabric", cost:"NT$ 520", status:"需替代" },
      { name:"霧面防水拉鍊", supplier:"YKK Taiwan", cost:"NT$ 138", status:"已核准" },
      { name:"再生聚酯裡布", supplier:"Green Textile", cost:"NT$ 186", status:"已詢價" }
    ],
    files:["SS26-TP-044 技術包 v3.pdf","外套第二次試穿修正.xlsx"],
    aiSummary:"尚未產生上市風險摘要。"
  };
  const integratedProfile = integratedDemoProfiles[slug] || buildIntegratedAddonProfile(project, config);
  const integratedState = {
    fields: integratedProfile ? Object.fromEntries(integratedProfile.fields) : {},
    action: integratedProfile?.actions[0] || "",
    checks: integratedProfile ? integratedProfile.checks.map(() => false) : [],
    generated: false,
    log:"尚未執行本階段操作。"
  };

  const renderIntegratedTools = () => {
    if (!integratedProfile) return "";
    if (current === 0) return `
      <section class="jv-integrated-tool">
        <header><div><small>原 Demo・${escapeHtml(integratedProfile.label)}</small><strong>${escapeHtml(integratedProfile.record)}</strong></div><span>資料建立</span></header>
        <div class="jv-integrated-fields">${integratedProfile.fields.map(([label])=>`
          <label>${escapeHtml(label)}<input data-integrated-field="${escapeHtml(label)}" value="${escapeHtml(integratedState.fields[label])}"></label>`).join("")}</div>
        <p class="jv-integrated-feedback">${escapeHtml(integratedState.log)}</p>
      </section>`;
    if (current === 1) return `
      <section class="jv-integrated-tool">
        <header><div><small>原 Demo・流程操作</small><strong>${escapeHtml(integratedProfile.record)}</strong></div><span>處理中</span></header>
        <label>選擇本次執行動作
          <select data-integrated-action>${integratedProfile.actions.map(action=>`<option ${action===integratedState.action?"selected":""}>${escapeHtml(action)}</option>`).join("")}</select>
        </label>
        <fieldset class="jv-integrated-checks"><legend>執行前確認</legend>${integratedProfile.checks.map((item,index)=>`
          <label><input type="checkbox" data-integrated-check="${index}" ${integratedState.checks[index]?"checked":""}><span>${escapeHtml(item)}</span></label>`).join("")}</fieldset>
        <p class="jv-integrated-feedback">${escapeHtml(integratedState.log)}</p>
      </section>`;
    return `
      <section class="jv-integrated-tool">
        <header><div><small>原 Demo・結果與文件</small><strong>${escapeHtml(integratedProfile.output)}</strong></div><span>${integratedState.generated?"已產生":"待產生"}</span></header>
        <dl class="jv-integrated-summary">
          <div><dt>案件／作業</dt><dd>${escapeHtml(integratedProfile.record)}</dd></div>
          <div><dt>本次動作</dt><dd>${escapeHtml(integratedState.action)}</dd></div>
          <div><dt>檢核結果</dt><dd>${integratedState.checks.filter(Boolean).length} / ${integratedState.checks.length} 項完成</dd></div>
          <div><dt>輸出結果</dt><dd>${escapeHtml(integratedProfile.output)}</dd></div>
        </dl>
        <div class="jv-integrated-actions">
          <button type="button" data-integrated-generate>${integratedState.generated?"重新產生文件":"產生結果文件"}</button>
          <button type="button" data-integrated-preview ${integratedState.generated?"":"disabled"}>查看文件摘要</button>
        </div>
        <p class="jv-integrated-feedback">${escapeHtml(integratedState.log)}</p>
      </section>`;
  };

  const renderFashionTools = () => {
    if (slug !== "jvision-fashion-plm") return "";
    if (current === 0) return `
      <section class="jv-fashion-tool">
        <header><div><small>原 Demo・款式開發卡</small><strong>SS26-TP-044　機能短版外套</strong></div><span>${escapeHtml(fashionState.stage)}</span></header>
        <div class="jv-fashion-facts"><b>外套</b><b>負責人 Leo</b><b>目標成本 NT$ 1,260</b><b>上市日 2026/09/15</b></div>
        <label>目前開發階段
          <select data-fashion-stage>${["企劃中","打樣中","試穿修正","核准量產"].map(stage=>`<option ${stage===fashionState.stage?"selected":""}>${stage}</option>`).join("")}</select>
        </label>
      </section>`;
    if (current === 1) return `
      <section class="jv-fashion-tool">
        <header><div><small>原 Demo・BOM 物料追蹤</small><strong>選定替代布料前，先確認成本與核准狀態</strong></div></header>
        <div class="jv-fashion-materials">${fashionState.materials.map((item,index)=>`
          <article><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.supplier)}・${escapeHtml(item.cost)}</span></div>
          <select data-fashion-material="${index}">${["待詢價","已詢價","已核准","需替代"].map(status=>`<option ${status===item.status?"selected":""}>${status}</option>`).join("")}</select></article>`).join("")}
        </div>
      </section>`;
    return `
      <section class="jv-fashion-tool">
        <header><div><small>原 Demo・技術文件與 AI 摘要</small><strong>量產核准附件</strong></div></header>
        <div class="jv-fashion-files">${fashionState.files.map(file=>`<span>✓ ${escapeHtml(file)}</span>`).join("")}</div>
        <div class="jv-fashion-tool-actions">
          <button type="button" data-fashion-upload>＋ 上傳最新版技術包</button>
          <button type="button" data-fashion-ai>生成 AI 上市摘要</button>
        </div>
        <p class="jv-fashion-ai">${escapeHtml(fashionState.aiSummary)}</p>
      </section>`;
  };

  const render = () => {
    const step = config.steps[current];
    selectedChoice = workState.choices[current] ?? -1;
    const stepFields = workState.fields[current] || {};
    const stepAttachments = workState.attachments[current] || [];
    root.innerHTML = `
      <header class="jv-showcase-hero">
        <div><p>${escapeHtml(config.eyebrow)}</p><h2>${escapeHtml(config.title)}</h2><span>${escapeHtml(config.story)}</span></div>
        <aside><small>本次示範案件</small><strong>${escapeHtml(config.subject)}</strong><b>${current + 1} / ${config.steps.length}</b></aside>
      </header>
      <nav class="jv-showcase-steps" aria-label="展示進度">${config.steps.map((item,index)=>`
        <button class="${index===current?"active":""} ${index<current?"done":""}" data-showcase-step="${index}" ${index>completed.length?"disabled":""}>
          <b>${index < current ? "✓" : String(index+1).padStart(2,"0")}</b><span>${escapeHtml(item.title)}</span>
        </button>`).join("")}</nav>
      <div class="jv-showcase-workspace">
        <section class="jv-showcase-task">
          <p>現在請客戶操作</p><h3>${escapeHtml(step.title)}</h3><span>${escapeHtml(step.task)}</span>
          ${step.choices ? `<div class="jv-showcase-choices">${step.choices.map((choice,index)=>`<button class="${selectedChoice===index?"selected":""}" data-showcase-choice="${index}"><span>${escapeHtml(choice)}</span><b>${selectedChoice===index?"已選擇":"選擇"}</b></button>`).join("")}</div>` : `
          <div class="jv-showcase-fields">${step.fields.map(([label])=>`<label>${escapeHtml(label)}<input data-showcase-field="${escapeHtml(label)}" value="${escapeHtml(stepFields[label] || "")}"></label>`).join("")}</div>`}
          <section class="jv-showcase-evidence">
            <header><div><small>本階段工作資料</small><strong>補充說明與佐證</strong></div><span>${stepAttachments.length} 份附件</span></header>
            <label>處理說明<textarea data-showcase-note placeholder="輸入判斷依據、異常原因或交接事項">${escapeHtml(workState.notes[current] || "")}</textarea></label>
            <div class="jv-showcase-evidence-actions">
              <button type="button" data-showcase-attach>＋ 加入示範附件</button>
              <button type="button" data-showcase-save>儲存草稿</button>
            </div>
            ${stepAttachments.length ? `<div class="jv-showcase-attachment-list">${stepAttachments.map(file => `<span>✓ ${escapeHtml(file)}</span>`).join("")}</div>` : `<p>尚未加入附件；可模擬加入報表、照片、憑證或簽核文件。</p>`}
            ${workState.message ? `<div class="jv-showcase-work-message">${escapeHtml(workState.message)}</div>` : ""}
          </section>
          ${renderFashionTools()}
          ${renderIntegratedTools()}
          <button class="jv-showcase-primary" data-showcase-submit>${escapeHtml(step.action)}</button>
        </section>
        <aside class="jv-showcase-result">
          <p>操作後會發生什麼</p>
          <section class="jv-showcase-trace" aria-label="資料去向與處理軌跡">
            <header><div><small>案件編號</small><strong>${escapeHtml(traceState.id)}</strong></div><b>${escapeHtml(traceState.status)}</b></header>
            <dl>
              <div><dt>資料位置</dt><dd>${escapeHtml(traceState.location)}</dd></div>
              <div><dt>最後異動</dt><dd>${escapeHtml(traceState.updatedAt || "尚未送出")}</dd></div>
            </dl>
            ${traceState.activities.length ? `<ol>${traceState.activities.slice(0, 4).map(item => `<li><time>${escapeHtml(item.time)}</time><span>${escapeHtml(item.text)}</span></li>`).join("")}</ol>` : `<div class="jv-showcase-trace-empty">完成左側操作後，這裡會顯示資料去向與處理紀錄。</div>`}
          </section>
          <section class="jv-showcase-record-preview">
            <header><small>目前工作資料</small><b>${workState.records.length} 筆階段紀錄</b></header>
            <dl>
              ${Object.entries(stepFields).map(([label,value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "尚未填寫")}</dd></div>`).join("")}
              ${step.choices ? `<div><dt>處理方案</dt><dd>${selectedChoice >= 0 ? escapeHtml(step.choices[selectedChoice]) : "尚未選擇"}</dd></div>` : ""}
              <div><dt>處理說明</dt><dd>${escapeHtml(workState.notes[current] || "尚未填寫")}</dd></div>
            </dl>
            ${workState.records.length ? `<ol class="jv-showcase-record-list">${workState.records.slice(0, 4).map(record => `
              <li>
                <header><strong>${escapeHtml(record.step)}</strong><time>${escapeHtml(record.time)}</time></header>
                <p>${escapeHtml(record.data || "已完成階段處理")}</p>
                ${record.note ? `<span>說明：${escapeHtml(record.note)}</span>` : ""}
                ${record.attachments?.length ? `<span>附件：${record.attachments.map(escapeHtml).join("、")}</span>` : ""}
              </li>`).join("")}</ol>` : ""}
          </section>
          ${completed.length ? completed.map((result,index)=>`<article><b>步驟 ${index+1} 已完成</b><span>${escapeHtml(result)}</span></article>`).join("") : `<div class="jv-showcase-empty">完成左側操作後，這裡會立即顯示系統結果與跨部門影響。</div>`}
          ${completed.length===config.steps.length?`<section class="jv-showcase-output"><small>已產生業務成果</small><strong>${escapeHtml(config.output)}</strong><button data-showcase-reset>重新展示</button></section>`:""}
        </aside>
      </div>`;
    bind();
  };
  const bind = () => {
    root.querySelector("[data-fashion-stage]")?.addEventListener("change", event => {
      fashionState.stage = event.target.value;
      render();
    });
    root.querySelectorAll("[data-fashion-material]").forEach(select => select.addEventListener("change", event => {
      fashionState.materials[Number(select.dataset.fashionMaterial)].status = event.target.value;
      render();
    }));
    root.querySelector("[data-fashion-upload]")?.addEventListener("click", () => {
      if (!fashionState.files.includes("SS26-TP-044 最終技術包 v4.pdf")) {
        fashionState.files.push("SS26-TP-044 最終技術包 v4.pdf");
      }
      render();
    });
    root.querySelector("[data-fashion-ai]")?.addEventListener("click", () => {
      const openRisks = fashionState.materials.filter(item => item.status !== "已核准");
      fashionState.aiSummary = openRisks.length
        ? `目前仍有 ${openRisks.length} 項物料未核准：${openRisks.map(item=>item.name).join("、")}。建議完成替代料確認後再發布量產版本。`
        : "所有 BOM 物料均已核准，技術文件齊備，可進入首批量產與上市交接。";
      render();
    });
    root.querySelectorAll("[data-integrated-field]").forEach(input => input.addEventListener("change", event => {
      integratedState.fields[input.dataset.integratedField] = event.target.value;
      integratedState.log = `已更新「${input.dataset.integratedField}」，資料保留在本次展示案件。`;
      render();
    }));
    root.querySelector("[data-integrated-action]")?.addEventListener("change", event => {
      integratedState.action = event.target.value;
      integratedState.log = `已選擇「${event.target.value}」，請完成執行前確認。`;
      render();
    });
    root.querySelectorAll("[data-integrated-check]").forEach(input => input.addEventListener("change", () => {
      integratedState.checks[Number(input.dataset.integratedCheck)] = input.checked;
      const done = integratedState.checks.filter(Boolean).length;
      integratedState.log = `已完成 ${done} / ${integratedState.checks.length} 項執行前確認。`;
      render();
    }));
    root.querySelector("[data-integrated-generate]")?.addEventListener("click", () => {
      integratedState.generated = true;
      integratedState.log = `已產生「${integratedProfile.output}」，可查看摘要並於完成任務後歸檔。`;
      render();
    });
    root.querySelector("[data-integrated-preview]")?.addEventListener("click", () => {
      integratedState.log = `${integratedProfile.output}：${integratedProfile.record} 已完成「${integratedState.action}」，檢核 ${integratedState.checks.filter(Boolean).length} 項。`;
      render();
    });
    root.querySelectorAll("[data-showcase-choice]").forEach(button => button.addEventListener("click", () => {
      selectedChoice = Number(button.dataset.showcaseChoice);
      workState.choices[current] = selectedChoice;
      workState.message = "";
      saveWork();
      render();
    }));
    root.querySelectorAll("[data-showcase-field]").forEach(input => input.addEventListener("input", event => {
      workState.fields[current][input.dataset.showcaseField] = event.target.value;
      workState.message = "";
      saveWork();
    }));
    root.querySelector("[data-showcase-note]")?.addEventListener("input", event => {
      workState.notes[current] = event.target.value;
      saveWork();
    });
    root.querySelector("[data-showcase-attach]")?.addEventListener("click", () => {
      const step = config.steps[current];
      const extension = /照片|巡檢|現場|品質|安衛/.test(`${config.title}${step.title}`) ? "jpg" : "pdf";
      const fileName = `${step.title}-${String(workState.attachments[current].length + 1).padStart(2, "0")}.${extension}`;
      workState.attachments[current].push(fileName);
      workState.message = `已加入佐證附件：${fileName}`;
      saveWork();
      render();
    });
    root.querySelector("[data-showcase-save]")?.addEventListener("click", () => {
      workState.message = `草稿已儲存；資料仍保留在「${config.steps[current].title}」階段。`;
      traceState.updatedAt = timeLabel();
      traceState.activities.unshift({
        time: traceState.updatedAt,
        text: `儲存草稿：${config.steps[current].title}`
      });
      saveWork();
      saveTrace();
      render();
    });
    root.querySelector("[data-showcase-submit]")?.addEventListener("click", () => {
      const finishedStep = config.steps[current];
      const missingFields = (finishedStep.fields || [])
        .map(([label]) => label)
        .filter(label => !String(workState.fields[current]?.[label] || "").trim());
      if (missingFields.length) {
        workState.message = `請先填寫：${missingFields.join("、")}。`;
        saveWork();
        render();
        return;
      }
      if (finishedStep.choices && selectedChoice < 0) {
        workState.message = "請先選擇一個處理方案，再推進流程。";
        saveWork();
        render();
        return;
      }
      completed[current] = finishedStep.result;
      const fieldSummary = Object.entries(workState.fields[current] || {})
        .map(([label, value]) => `${label}：${value}`)
        .join("；");
      const choiceSummary = finishedStep.choices ? finishedStep.choices[selectedChoice] : "";
      workState.records = [
        {
          step: finishedStep.title,
          data: choiceSummary || fieldSummary,
          note: workState.notes[current] || "",
          attachments: [...(workState.attachments[current] || [])],
          time: timeLabel()
        },
        ...workState.records.filter(record => record.step !== finishedStep.title)
      ];
      workState.message = "";
      saveWork();
      const nextStep = config.steps[current + 1];
      traceState.status = nextStep?.title || "已完成";
      traceState.updatedAt = timeLabel();
      traceState.activities.unshift({
        time: traceState.updatedAt,
        text: `${finishedStep.title}：${choiceSummary || fieldSummary || finishedStep.result}`
      });
      saveTrace();
      if (current < config.steps.length - 1) {
        current += 1;
      }
      render();
    });
    root.querySelectorAll("[data-showcase-step]").forEach(button => button.addEventListener("click", () => {
      current = Number(button.dataset.showcaseStep);
      render();
    }));
    root.querySelector("[data-showcase-reset]")?.addEventListener("click", () => {
      current = 0;
      completed.length = 0;
      selectedChoice = -1;
      workState = {
        ...defaultWorkState,
        fields: defaultWorkState.fields.map(fields => ({ ...fields })),
        choices: [...defaultWorkState.choices],
        notes: [...defaultWorkState.notes],
        attachments: defaultWorkState.attachments.map(() => []),
        records: [],
        message: ""
      };
      traceState = { ...defaultTrace, activities: [] };
      try { localStorage.removeItem(traceStorageKey); } catch {}
      try { localStorage.removeItem(workStorageKey); } catch {}
      render();
    });
  };
  render();
  return true;
}

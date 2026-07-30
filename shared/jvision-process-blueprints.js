const categoryGovernance = {
  "人力資源": ["人資承辦人", "用人主管", "人資主管", "員工／薪勤系統", "人事核准與生效紀錄"],
  "財務會計": ["會計承辦人", "財務覆核人", "財務主管", "總帳／資金系統", "覆核憑證與入帳紀錄"],
  "採購供應鏈": ["採購承辦人", "需求單位主管", "採購主管", "供應商／倉儲", "採購核准與驗收紀錄"],
  "業務銷售": ["業務負責人", "售前／財務覆核人", "業務主管", "客戶／交付團隊", "報價核准與成交交接紀錄"],
  "生產製造": ["生管／現場人員", "班長／品管", "製造主管", "倉儲／下一製程", "工單實績與完工入庫紀錄"],
  "品質管理": ["品保工程師", "製程／責任單位", "品質主管", "倉儲／客戶品質", "品質判定與放行紀錄"],
  "倉儲物流": ["倉儲作業員", "複核人員", "倉儲主管", "承運商／庫存系統", "庫存異動與出庫交接紀錄"],
  "物流運輸": ["物流調度員", "車隊／站點覆核人", "運輸主管", "收貨人／計費系統", "運送簽收與費用結算紀錄"],
  "交通運輸": ["車隊調度員", "場站覆核人", "營運主管", "駕駛／營運系統", "班次執行與到站紀錄"],
  "營建工程": ["工務工程師", "監造／品管", "工地主任", "業主／估驗計價", "施工查驗與估驗紀錄"],
  "設備維護": ["設備工程師", "使用單位／工安", "設備主管", "設備履歷／備品系統", "維修復機與保養履歷"],
  "研發管理": ["研發工程師", "產品／測試覆核人", "研發主管", "版本／文件管理", "驗證結論與版本發布紀錄"],
  "資訊科技": ["IT 維運人員", "服務申請人／變更覆核人", "IT 主管", "ITSM／資產系統", "服務驗收與關閉紀錄"],
  "資訊安全": ["資安分析師", "系統負責人／SOC 覆核人", "資安主管", "SIEM／稽核系統", "處置驗證與事件結案報告"],
  "教育": ["教師／教務承辦", "課程審閱人", "教務主管", "學員／課程平台", "課程審閱與發布紀錄"],
  "醫療照護": ["醫事／照護人員", "專業覆核人", "醫療主管", "病歷／照護系統", "處置結果與照護紀錄"],
  "金融保險": ["金融服務承辦人", "風控／法遵覆核人", "授權主管", "契約／核心系統", "審查決議與契約生效紀錄"],
  "零售電商": ["門市／電商人員", "庫存／金流覆核人", "營運主管", "顧客／物流系統", "訂單履約與售後紀錄"],
  "餐飲旅宿": ["接待／服務人員", "現場覆核人", "值班主管", "顧客／帳務系統", "服務履約與結帳紀錄"],
  "宗教服務": ["廟務服務人員", "收款／名冊覆核人", "廟務主管", "信眾／帳務系統", "服務登記與功德金入帳紀錄"],
  "ESG 永續": ["永續管理人員", "數據提供／查證人", "永續主管", "揭露／稽核系統", "查證底稿與揭露報告"],
  "數據分析": ["資料分析師", "資料擁有者／驗證人", "決策主管", "報表／決策平台", "分析結論與發布紀錄"],
  "客服管理": ["客服專員", "二線／責任單位", "客服主管", "客戶／知識庫", "回覆確認與案件結案紀錄"],
  "專業服務": ["顧問／案件承辦人", "專業覆核人", "專案主管", "客戶／計費系統", "交付物與客戶驗收紀錄"],
  "企業協作": ["任務負責人", "協作單位覆核人", "專案主管", "相關部門／文件庫", "決議、交付物與歸檔紀錄"],
  "企業營運": ["營運承辦人", "責任單位覆核人", "營運主管", "據點／管理報表", "營運決議與成效追蹤紀錄"],
  "經營管理": ["議題承辦人", "資料覆核人", "決策主管", "執行單位／管理報表", "決策核定與行動追蹤紀錄"],
  "生活服務": ["服務專員", "現場覆核人", "營運主管", "顧客／收款系統", "服務確認與結帳紀錄"],
  "內容管理": ["內容編輯", "審稿／法遵人員", "內容主管", "發布渠道／素材庫", "審稿決議與發布紀錄"]
};

const categoryCriteria = {
  "人力資源": ["員工或職缺資料完整且符合人事規章", "主管權責與生效日期已確認", "退回時必須註明缺件或規章依據"],
  "財務會計": ["金額、稅額、科目與會計期間一致", "憑證附件及收付款對象可追溯", "差異未釐清或期間關帳時不得核准"],
  "採購供應鏈": ["需求、預算、規格與供應商資格完整", "詢比議價及授權額度符合採購規範", "交期或資格不符時退回補件或改詢"],
  "業務銷售": ["需求、價格、毛利與交易條件已確認", "折扣或例外條款在授權範圍內", "低毛利或特殊條款須升級主管核准"],
  "生產製造": ["工單版本、物料、設備與人員皆可用", "數量、品質與停機實績已回報", "缺料、設備異常或品質未放行時不得完工"],
  "品質管理": ["抽樣、量測與缺陷證據符合檢驗規範", "圍堵、原因與改善效果均可驗證", "未完成隔離或驗證時不得放行"],
  "資訊安全": ["事件證據、影響資產與風險等級完整", "隔離、停權或修補結果已驗證", "重大風險須由資安主管核准後關閉"],
  "資訊科技": ["影響範圍、處理紀錄與測試結果完整", "申請人已完成驗收或留下例外說明", "驗收失敗時退回技術處理"],
  "研發管理": ["規格、版本、測試條件及影響範圍完整", "驗證結果達到事先定義的允收標準", "失敗或影響未釐清時不得發布"],
  "金融保險": ["身分、風險與法遵文件完成審查", "核准條件符合商品及授權規範", "資料矛盾或超出風險胃納時退回或拒絕"],
  "醫療照護": ["身分、專業評估與必要同意紀錄完整", "處置由合適專業角色執行並覆核", "異常結果必須安排追蹤、轉介或升級"],
  "教育": ["學習目標、教材版本與適用對象一致", "審閱意見及課綱對應已完成", "教材缺漏或不符課綱時退回修訂"]
};

function stageOwner(index, lastIndex, governance) {
  if (index === 0) return governance.operator;
  if (index === lastIndex) return governance.recipient;
  if (index >= Math.max(2, lastIndex - 1)) return governance.approver;
  return governance.reviewer;
}

function requiredInputs(definition, index) {
  if (index === 0) return definition.fields.map((field) => field[1]);
  const common = [`${definition.stages[index]}處理結果`, "執行人與完成時間", "備註或佐證附件"];
  if (index === definition.stages.length - 1) {
    return ["前階段核准／驗證結果", "完成或生效日期", "歸檔編號與通知對象"];
  }
  return common;
}

export function buildProjectProcessBlueprint(project, definition) {
  const base = categoryGovernance[project.category] || [
    `${definition.fields[1]?.[1] || "業務承辦人"}`,
    "流程覆核人",
    "授權主管",
    "相關單位／業務系統",
    `${definition.primary}核准與歸檔紀錄`
  ];
  const governance = {
    operator: base[0],
    reviewer: base[1],
    approver: base[2],
    recipient: base[3],
    finalOutput: base[4]
  };
  const approvalIndex = Math.max(1, Math.min(
    definition.stages.length - 2,
    definition.stages.findIndex((stage) => /核准|簽核|覆核|審核|驗證|確認|查驗|評審|判定/.test(stage))
  ));
  const criteria = categoryCriteria[project.category] || [
    `${definition.fields.map((field) => field[1]).join("、")}皆已填寫且可追溯`,
    `執行結果符合「${project.title}」的作業規範與授權條件`,
    "資料不足、結果異常或超出授權時必須退回並說明原因"
  ];
  const stages = definition.stages.map((stage, index) => {
    const action = definition.actions[index] || `完成${stage}`;
    const requiresApproval = index === approvalIndex;
    return {
      stage,
      action,
      owner: stageOwner(index, definition.stages.length - 1, governance),
      inputs: requiredInputs(definition, index),
      requiresApproval,
      approver: requiresApproval ? governance.approver : "",
      passCondition: requiresApproval ? criteria[0] : `必要資料完成，且「${action}」已有可追溯結果`,
      rejectCondition: requiresApproval ? criteria[2] : "資料不完整、執行異常或前置條件尚未完成",
      output: index === definition.stages.length - 1
        ? governance.finalOutput
        : `${project.title}｜${stage}處理紀錄`
    };
  });
  return {
    project: project.title,
    category: project.category,
    governance,
    criteria,
    approvalIndex,
    stages,
    finalOutput: governance.finalOutput
  };
}

export function listSupportedGovernanceCategories() {
  return Object.keys(categoryGovernance);
}

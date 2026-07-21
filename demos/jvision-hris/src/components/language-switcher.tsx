"use client";

import { useEffect, useState } from "react";
import enSentences from "./translations.en.json";
import zhCNSentences from "./translations.zh-CN.json";
import viSentences from "./translations.vi.json";

type Locale = "zh-TW" | "zh-CN" | "en" | "vi";

const dictionaries: Record<Exclude<Locale, "zh-TW">, Record<string, string>> = {
  "zh-CN": { "員工":"员工", "人資":"人资", "薪資":"薪资", "請假":"请假", "招募":"招聘", "資料":"资料", "報表":"报表", "簽核":"审批", "工時":"工时", "結算":"结算", "清冊":"清册", "開始測試":"开始测试", "互動":"互动", "部門":"部门", "職稱":"职称", "在職":"在职", "待審核":"待审核", "已核准":"已批准" },
  en: {
    "員工名冊":"Employee Directory", "招募流程":"Recruitment Pipeline", "薪資試算":"Payroll Calculator", "請假簽核":"Leave Approval", "請假核准":"Leave Approval", "新增員工":"Add Employee", "員工姓名":"Employee Name", "開始測試":"Start Demo", "開始派工":"Start Dispatch", "操作 Demo":"Try Demo", "進入 Demo":"Enter Demo", "查看功能":"View Features", "查看招募":"View Recruitment", "系統模組":"Modules", "功能架構":"Features", "互動 Demo":"Interactive Demo", "新增":"Add", "確認":"Confirm", "取消":"Cancel", "姓名":"Name", "部門":"Department", "職稱":"Job Title", "職務":"Role", "狀態":"Status", "在職":"Active", "待入職":"Pending Start", "試用期":"Probation", "待審核":"Pending", "已核准":"Approved", "退回":"Returned", "月薪":"Monthly Salary", "剩餘假別":"Leave Balance", "平均薪資":"Average Salary", "人資部":"HR", "研發部":"Engineering", "產品部":"Product", "行銷部":"Marketing", "客服部":"Customer Service", "業務部":"Sales", "營運部":"Operations", "薪資":"Payroll", "請假":"Leave", "招募":"Recruitment", "員工":"Employee", "人資":"HR", "資料":"Data", "報表":"Reports", "管理":"Management", "簽核":"Approval", "出勤":"Attendance", "派遣":"Dispatch", "工時":"Hours", "結算":"Settlement", "清冊":"Register", "平台":"Platform", "工作台":"Workspace", "功能":"Features", "天":" days", "人":" people", "位":" candidates", "筆":" items", "件":" cases", "小時":" hours"
  },
  vi: { "員工":"Nhân viên", "人資":"Nhân sự", "薪資":"Lương", "請假":"Nghỉ phép", "招募":"Tuyển dụng", "資料":"Dữ liệu", "報表":"Báo cáo", "簽核":"Phê duyệt", "工時":"Giờ công", "結算":"Quyết toán", "清冊":"Danh sách", "部門":"Phòng ban", "職稱":"Chức danh", "在職":"Đang làm", "待審核":"Chờ duyệt", "已核准":"Đã duyệt", "天":" ngày", "人":" người", "位":" ứng viên", "筆":" mục", "件":" trường hợp", "小時":" giờ" }
};

const originalText = new WeakMap<Node, string>();
const renderedText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function replaceAll(text: string, entries: Record<string, string>) {
  let output = text;
  for (const [source, target] of Object.entries(entries).sort((a, b) => b[0].length - a[0].length)) {
    output = output.split(source).join(target);
  }
  return output;
}

function translate(text: string, locale: Locale) {
  let output = text;
  if (locale === "en") output = replaceAll(output, enSentences);
  if (locale === "zh-CN") output = replaceAll(output, zhCNSentences);
  if (locale === "vi") output = replaceAll(output, viSentences);
  if (locale !== "zh-TW") output = replaceAll(output, dictionaries[locale]);
  if (locale === "vi") output = output.replace(/[\u3400-\u9fff]+/g, "");
  return output.replace(/Jvision|JVision(?! HR)/g, "JVision HR").replaceAll("JVision HR HR", "JVision HR");
}

function applyTranslations(root: Node, locale: Locale) {
  const textNodes: Node[] = [];
  if (root.nodeType === Node.TEXT_NODE) textNodes.push(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node);

  for (const node of textNodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest(".language-switcher") || ["SCRIPT", "STYLE"].includes(parent.tagName)) continue;
    const current = node.textContent || "";
    const previous = originalText.get(node);
    const lastRendered = renderedText.get(node);
    if (previous === undefined || (lastRendered !== undefined && current !== lastRendered)) originalText.set(node, current);
    const translated = translate(originalText.get(node) || "", locale);
    if (current !== translated) node.textContent = translated;
    renderedText.set(node, translated);
  }

  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...document.querySelectorAll("*")];
  for (const element of elements) {
    if (element.closest(".language-switcher")) continue;
    if (!originalAttributes.has(element)) {
      const values: Record<string, string> = {};
      for (const attribute of ["placeholder", "aria-label", "title", "alt"]) {
        const value = element.getAttribute(attribute);
        if (value) values[attribute] = value;
      }
      originalAttributes.set(element, values);
    }
    for (const [attribute, value] of Object.entries(originalAttributes.get(element) || {})) {
      element.setAttribute(attribute, translate(value, locale));
    }
  }
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>("zh-TW");

  useEffect(() => {
    document.documentElement.lang = locale;
    applyTranslations(document.body, locale);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") applyTranslations(mutation.target, locale);
        for (const node of mutation.addedNodes) applyTranslations(node, locale);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return (
    <div className="language-switcher" style={{ position:"fixed", right:16, bottom:16, zIndex:9999, display:"flex", gap:8, alignItems:"center", background:"white", padding:"8px 10px", border:"1px solid #d8e1ec", borderRadius:10, boxShadow:"0 8px 24px #10204022" }}>
      <b style={{ color:"#1769e0", fontSize:12 }}>JVision HR</b>
      <select aria-label="Language" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} style={{ padding:"6px", borderRadius:7, border:"1px solid #cdd8e5" }}>
        <option value="zh-TW">繁中</option><option value="zh-CN">简中</option><option value="en">English</option><option value="vi">Tiếng Việt</option>
      </select>
    </div>
  );
}

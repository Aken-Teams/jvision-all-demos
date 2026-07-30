import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const argument = (name) => process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const baseUrl = argument("base-url") || process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const allProjects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects || [];
const projectFilter = new Set(String(process.env.JVISION_OPERATION_PROJECTS || "").split(",").map((value) => value.trim()).filter(Boolean));
const categorySample = process.env.JVISION_OPERATION_CATEGORY_SAMPLE === "1";
const sampledProjects = categorySample
  ? [...new Map(allProjects.map((project) => [project.category, project])).values()]
  : allProjects;
const projects = projectFilter.size ? allProjects.filter((project) => projectFilter.has(project.repoName)) : sampledProjects;
const workers = Math.max(1, Math.min(8, Number(argument("workers") || process.env.JVISION_OPERATION_WORKERS || 4)));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.JVISION_BROWSER_EXECUTABLE ? { executablePath: process.env.JVISION_BROWSER_EXECUTABLE } : {}),
});
const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: "zh-TW" });
const results = new Array(projects.length);

async function verify(project, page) {
  try {
    await page.goto(`${baseUrl}${project.demoUrl}?operation-dialog-audit=1`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    if (project.repoName === "jvision-property-management") {
      await page.waitForSelector(".property-demo", { timeout: 7000 });
      return { repoName: project.repoName, variant: "property", passed: true, skipped: "專屬物業操作介面" };
    }
    await page.waitForSelector(".jv-client-demo", { timeout: 7000 });
    const variant = await page.locator(".jv-client-demo").evaluate((element) => {
      if (element.classList.contains("jv-domain-demo")) return "domain";
      if (element.classList.contains("jv-oee-demo")) return "oee";
      return "special";
    });
    if (variant !== "domain") {
      return { repoName: project.repoName, variant, passed: true, skipped: "專屬互動介面" };
    }

    const action = page.locator("[data-domain-advance]:not(:disabled)").first();
    if (!(await action.count())) throw new Error("找不到可執行的流程按鈕");
    const before = await action.locator("xpath=ancestor::article").innerText();
    await action.click();
    const dialog = page.locator(".jv-operation-dialog");
    await dialog.waitFor({ state: "visible", timeout: 4000 });
    const governance = dialog.locator(".jv-operation-governance");
    if ((await governance.count()) !== 1) throw new Error("操作面板缺少角色、簽核條件與輸出規則");
    const governanceText = await governance.innerText();
    for (const label of ["必要輸入", "推進條件", "退回條件", "完成後輸出"]) {
      if (!governanceText.includes(label)) throw new Error(`操作面板缺少「${label}」`);
    }
    if (!(await dialog.locator(".jv-operation-context").innerText()).includes("本階段負責")) {
      throw new Error("操作面板缺少本階段負責角色");
    }
    const checks = dialog.locator('input[type="checkbox"]');
    const checkCount = await checks.count();
    if (checkCount < 1) throw new Error("操作面板缺少執行前檢核");
    const checklist = await dialog.locator("fieldset label span").allTextContents();
    for (let index = 0; index < checkCount; index += 1) await checks.nth(index).check();
    const note = dialog.locator('textarea[name="operationNote"]');
    if ((await note.count()) !== 1) throw new Error("操作面板缺少處理紀錄");
    const operationInputs = dialog.locator(".jv-operation-fields input");
    for (let index = 0; index < await operationInputs.count(); index += 1) {
      const input = operationInputs.nth(index);
      const type = await input.getAttribute("type");
      await input.fill(type === "date" ? "2026-07-30" : type === "number" ? "10" : "自動測試資料");
    }
    const operationSelects = dialog.locator(".jv-operation-fields select");
    for (let index = 0; index < await operationSelects.count(); index += 1) {
      await operationSelects.nth(index).selectOption({ index: 1 });
    }
    await note.fill("自動測試：資料與現場條件已確認，執行結果正常。");
    const preview = await dialog.locator(".jv-operation-result").innerText();
    if (!preview.includes("推進至")) throw new Error("操作面板缺少結果預覽");
    if ((await dialog.getByRole("button", { name: "退回補件" }).count()) !== 1) throw new Error("缺少退回補件分支");
    if ((await dialog.getByRole("button", { name: "暫存" }).count()) !== 1) throw new Error("缺少暫存分支");
    await dialog.getByRole("button", { name: "核准並推進" }).click();
    await dialog.waitFor({ state: "detached", timeout: 4000 });
    const documentPreview = page.locator(".jv-document-preview");
    await documentPreview.waitFor({ state: "visible", timeout: 4000 });
    const documentText = await documentPreview.innerText();
    for (const label of ["承辦角色", "簽核角色", "輸出結果", "跨模組連動"]) {
      if (!documentText.includes(label)) throw new Error(`流程結果文件缺少「${label}」`);
    }
    await documentPreview.getByRole("button", { name: "關閉" }).click();
    const saveNotice = page.locator(".jv-domain-save-notice");
    if ((await saveNotice.count()) !== 1 || !(await saveNotice.innerText()).includes("目前位於")) throw new Error("送出後缺少明確的資料去向提示");
    if ((await page.locator(".jv-domain-items article.jv-just-updated").count()) !== 1) throw new Error("送出後未標示剛更新的資料");
    const latestOperation = page.locator(".jv-domain-latest-operation");
    if ((await latestOperation.count()) !== 1 || !(await latestOperation.innerText()).includes("最新處理紀錄")) throw new Error("右側缺少最新處理紀錄");
    const documentButton = page.locator("[data-document-view]");
    if (!(await documentButton.count())) throw new Error("右側明細沒有產出文件入口");
    await documentButton.first().click();
    await documentPreview.waitFor({ state: "visible", timeout: 4000 });
    await documentPreview.getByRole("button", { name: "關閉" }).click();
    const feedback = await page.locator(".jv-domain-feedback").innerText();
    if (!/推進至|完成全部流程/.test(feedback)) throw new Error("確認後沒有流程推進結果");
    if ((await page.locator("[data-scenario]").count()) !== 3) throw new Error("缺少三組 Demo 情境包");
    if ((await page.locator("[data-role-switch]").count()) !== 1) throw new Error("缺少角色切換");
    await page.locator('[data-scenario="exception"]').click();
    if (!(await page.locator(".jv-item-alert").count())) throw new Error("異常情境沒有顯示領域異常");
    await page.locator('[data-scenario="approval"]').click();
    const approvalRole = await page.locator("[data-role-switch]").evaluate((element) => element.value);
    if (approvalRole !== "manager") throw new Error("主管簽核情境沒有切換核准角色");
    if ((await page.locator(".jv-domain-insights article").count()) !== 3) throw new Error("缺少專屬儀表板指標");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    return {
      repoName: project.repoName,
      variant,
      passed: overflow <= 8,
      checkCount,
      checklist,
      before: before.slice(0, 120),
      feedback,
      overflow,
    };
  } catch (error) {
    return { repoName: project.repoName, passed: false, error: String(error) };
  }
}

await Promise.all(Array.from({ length: workers }, async (_, workerIndex) => {
  const page = await context.newPage();
  for (let index = workerIndex; index < projects.length; index += workers) {
    results[index] = await verify(projects[index], page);
  }
  await page.close();
}));

await context.close();
await browser.close();

const failed = results.filter((result) => !result.passed);
const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  domainDialogs: results.filter((result) => result.variant === "domain").length,
  specializedInterfaces: results.filter((result) => result.variant !== "domain" && result.passed).length,
  distinctChecklistSignatures: new Set(results.filter((result) => result.checklist).map((result) => result.checklist.join("|"))).size,
};
fs.writeFileSync(
  path.join(root, "docs", "ALL_OPERATION_DIALOGS_REPORT.json"),
  `${JSON.stringify({ summary, results }, null, 2)}\n`,
);
console.log(JSON.stringify(summary, null, 2));
if (failed.length) {
  console.log(JSON.stringify(failed.slice(0, 30), null, 2));
  process.exitCode = 1;
}

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects || [];
const browser = await chromium.launch({
  headless: true,
  ...(process.env.JVISION_BROWSER_EXECUTABLE ? { executablePath: process.env.JVISION_BROWSER_EXECUTABLE } : {}),
});
const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: "zh-TW" });
const workerCount = Math.max(1, Math.min(8, Number(process.env.JVISION_WORKFLOW_WORKERS || 4)));
const results = new Array(projects.length);

async function verifyProject(project, index, page) {
  try {
    await page.goto(`${baseUrl}${project.demoUrl}?workflow-button-audit=1`, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });
    if (project.repoName === "jvision-property-management") {
      await page.waitForSelector(".property-demo", { timeout: 6000 });
      const result = await page.evaluate(() => {
        const required = [
          ".contract-form",
          ".contract-center",
          ".billing-form",
          ".bill-list",
          ".unit-list",
        ];
        const missing = required.filter((selector) => !document.querySelector(selector));
        const labels = [...document.querySelectorAll("button")].map((button) => button.textContent?.trim());
        const requiredActions = ["產生合約草稿", "核准並送承租人", "建立應收帳單", "登錄入帳", "確認完成對帳"];
        const missingActions = requiredActions.filter((label) => !labels.includes(label));
        return {
          variant: "property",
          stageCount: 4,
          stagePassed: missing.length === 0,
          creationPassed: labels.includes("產生合約草稿") && labels.includes("建立應收帳單"),
          detailPassed: Boolean(document.querySelector(".contract-detail") && document.querySelector(".bill-detail")),
          domainPassed: missingActions.length === 0,
          passed: missing.length === 0 && missingActions.length === 0,
          missing: [...missing, ...missingActions],
        };
      });
      return { id: project.id, repoName: project.repoName, category: project.category, ...result };
    }
    await page.waitForSelector(".jv-client-demo", { timeout: 6000 });
    const result = await page.evaluate(() => {
      const root = document.querySelector(".jv-client-demo");
      const isOee = root?.classList.contains("jv-oee-demo");
      const isDomain = root?.classList.contains("jv-domain-demo");
      if (isOee) {
        const required = ["重設早班資料","重新計算 OEE","新增事件","建立改善措施"];
        const labels = [...root.querySelectorAll("button")].map(button => button.textContent.trim());
        return {
          variant: "oee",
          stageCount: 0,
          stagePassed: true,
          controlsPassed: required.every(label => labels.includes(label)),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
        };
      }
      const selector = isDomain ? "[data-stage-filter]" : "[data-generic-stage]";
      const recordSelector = isDomain ? ".jv-domain-items article" : ".jv-demo-records .jv-demo-record";
      root.querySelector(`${selector}[aria-pressed="true"]`)?.click();
      const stageCount = root.querySelectorAll(selector).length;
      const stageChecks = [];
      for (let index = 0; index < stageCount; index += 1) {
        const button = root.querySelectorAll(selector)[index];
        const expected = Number.parseInt(button.querySelector("small, span:last-child")?.textContent || "0", 10);
        button.click();
        const activeButton = root.querySelectorAll(selector)[index];
        const visible = root.querySelectorAll(recordSelector).length;
        const active = activeButton.getAttribute("aria-pressed") === "true";
        const empty = Boolean(root.querySelector(isDomain ? ".jv-domain-empty" : ".jv-demo-empty"));
        const contextualAction = !isDomain || index === 0
          ? true
          : !root.querySelector("[data-toggle-create]") &&
            Boolean(root.querySelector("[data-stage-primary], [data-stage-review]"));
        const passed = active && visible === expected && (expected > 0 || empty) && contextualAction;
        stageChecks.push(passed);
        activeButton.click();
      }
      const labels = [...root.querySelectorAll("button")].map(button => button.textContent.trim());
      return {
        variant: isDomain ? "domain" : "generic",
        stageCount,
        stagePassed: stageCount >= 4 && stageChecks.every(Boolean),
        controlsPassed: labels.some(label => /新增|建立/.test(label)) &&
          labels.some(label => /查看詳情|編輯明細|新增處理紀錄|補充處理紀錄/.test(label)) &&
          labels.some(label => /推進|確認|完成|提交|執行|登錄|送出|釋放|掃碼/.test(label)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    return {
      id: project.id,
      repoName: project.repoName,
      category: project.category,
      passed: result.stagePassed && result.controlsPassed && result.overflow <= 8,
      ...result
    };
  } catch (error) {
    return {
      id: project.id,
      repoName: project.repoName,
      category: project.category,
      passed: false,
      error: String(error)
    };
  }
}

await Promise.all(Array.from({ length: workerCount }, async (_, workerIndex) => {
  const page = await context.newPage();
  for (let index = workerIndex; index < projects.length; index += workerCount) {
    results[index] = await verifyProject(projects[index], index, page);
  }
  await page.close();
}));

await context.close();
await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.filter(result => result.passed).length,
  failed: results.filter(result => !result.passed).length,
  domain: results.filter(result => result.variant === "domain").length,
  generic: results.filter(result => result.variant === "generic").length,
  oee: results.filter(result => result.variant === "oee").length
};
fs.writeFileSync(
  path.join(root, "docs", "ALL_WORKFLOW_BUTTONS_REPORT.json"),
  `${JSON.stringify({ summary, results }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
if (summary.failed) {
  console.log(JSON.stringify(results.filter(result => !result.passed).slice(0, 20), null, 2));
  process.exitCode = 1;
}

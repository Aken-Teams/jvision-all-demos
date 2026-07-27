import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.JVISION_BASE_URL || "http://127.0.0.1:4191";
const catalog = JSON.parse(await fs.readFile(new URL("../projects-index.json", import.meta.url), "utf8"));
const projects = catalog.projects.filter((project) => project.sourceGroup === "legacy-jvision");
const workerCount = Math.max(1, Math.min(4, Number(process.env.JVISION_ORIGINAL_BUTTON_WORKERS || 2)));
const ignoredText = /返回專案首頁|分享專案|啟動操作導覽|結束|下一步|重設資料|更新圖表|顯示趨勢資料|隱藏趨勢資料|產生.*建議/i;
const ignoredSelector = [
  ".jv-client-demo",
  ".jv-demo-hub-bar",
  ".jv-project-share",
  ".jv-ai-advice",
  ".jv-dynamic-analytics",
  "[data-jv-guide]",
].join(",");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const findings = [];
let checked = 0;

async function auditProject(project, projectIndex) {
  const page = await context.newPage();
  const repo = project.repoName;
  const url = `${baseUrl}/demos/${repo}/`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12_000 });
    await page.waitForTimeout(350);
    const buttons = await page.locator("button").evaluateAll((nodes, ignoredSelector) =>
      nodes
        .map((node, index) => ({
          index,
          text: (node.innerText || node.getAttribute("aria-label") || "").trim().replace(/\s+/g, " "),
          disabled: node.disabled || node.getAttribute("aria-disabled") === "true",
          visible: Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length),
          ignored: Boolean(node.closest(ignoredSelector)),
        }))
        .filter((item) => item.visible && !item.disabled && !item.ignored),
      ignoredSelector,
    );

    for (const buttonInfo of buttons.slice(0, 20)) {
      if (!buttonInfo.text || ignoredText.test(buttonInfo.text)) continue;
      const locator = page.locator("button").nth(buttonInfo.index);
      if (!(await locator.isVisible().catch(() => false))) continue;
      const beforeUrl = page.url();
      await page.evaluate((ignoredSelector) => {
        window.__jvAuditMutations = 0;
        window.__jvAuditDialogs = 0;
        window.alert = window.confirm = window.prompt = () => {
          window.__jvAuditDialogs += 1;
          return true;
        };
        window.__jvAuditObserver?.disconnect();
        window.__jvAuditObserver = new MutationObserver((mutations) => {
          const relevant = mutations.some((mutation) => {
            const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
            return element && !element.closest(ignoredSelector);
          });
          if (relevant) window.__jvAuditMutations += 1;
        });
        window.__jvAuditObserver.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["class", "aria-selected", "aria-pressed", "aria-expanded", "disabled"],
        });
      }, ignoredSelector);

      let clickError = "";
      try {
        await locator.click({ timeout: 2500 });
        await page.waitForTimeout(150);
      } catch (error) {
        clickError = String(error.message || error).split("\n")[0];
      }
      const result = await page.evaluate(() => ({
        mutations: window.__jvAuditMutations || 0,
        dialogs: window.__jvAuditDialogs || 0,
      })).catch(() => ({ mutations: 0, dialogs: 0 }));
      checked += 1;
      if (clickError || (!result.mutations && !result.dialogs && page.url() === beforeUrl)) {
        findings.push({
          repo,
          title: project.title,
          button: buttonInfo.text,
          reason: clickError || "click produced no visible state/content response",
          url,
        });
      }
      if (page.url() !== beforeUrl) {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12_000 });
        await page.waitForTimeout(250);
      }
    }
    process.stdout.write(`\rAudited ${projectIndex + 1}/${projects.length} projects`);
  } catch (error) {
    findings.push({ repo, title: project.title, button: "(page)", reason: String(error.message || error), url });
  } finally {
    await page.close();
  }
}

let cursor = 0;
await Promise.all(
  Array.from({ length: workerCount }, async () => {
    while (cursor < projects.length) {
      const projectIndex = cursor++;
      await auditProject(projects[projectIndex], projectIndex);
    }
  }),
);

const firstPassFindings = [...findings];
findings.length = 0;
let retryCursor = 0;
await Promise.all(
  Array.from({ length: workerCount }, async () => {
    while (retryCursor < firstPassFindings.length) {
      const finding = firstPassFindings[retryCursor++];
      if (finding.button === "(page)") {
        findings.push(finding);
        continue;
      }
      const retryPage = await context.newPage();
      try {
        await retryPage.goto(finding.url, { waitUntil: "domcontentloaded", timeout: 12_000 });
        await retryPage.waitForTimeout(350);
        const button = retryPage.locator("button:not([disabled])").filter({ hasText: finding.button }).first();
        if (!(await button.isVisible({ timeout: 2500 }).catch(() => false))) {
          findings.push({ ...finding, reason: "button was not independently reachable" });
          continue;
        }
        const beforeUrl = retryPage.url();
        await retryPage.evaluate((ignoredSelector) => {
          window.__jvAuditMutations = 0;
          window.__jvAuditDialogs = 0;
          window.alert = window.confirm = window.prompt = () => {
            window.__jvAuditDialogs += 1;
            return true;
          };
          window.__jvAuditObserver = new MutationObserver((mutations) => {
            if (mutations.some((mutation) => {
              const element = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
              return element && !element.closest(ignoredSelector);
            })) window.__jvAuditMutations += 1;
          });
          window.__jvAuditObserver.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["class", "aria-selected", "aria-pressed", "aria-expanded", "disabled"],
          });
        }, ignoredSelector);
        await button.click({ timeout: 3000 });
        await retryPage.waitForTimeout(200);
        const response = await retryPage.evaluate(() => ({
          mutations: window.__jvAuditMutations || 0,
          dialogs: window.__jvAuditDialogs || 0,
        }));
        if (!response.mutations && !response.dialogs && retryPage.url() === beforeUrl) {
          findings.push({ ...finding, reason: "confirmed: click produced no visible state/content response" });
        }
      } catch (error) {
        findings.push({ ...finding, reason: `confirmed interaction failure: ${String(error.message || error).split("\n")[0]}` });
      } finally {
        await retryPage.close();
      }
    }
  }),
);

await browser.close();
const report = {
  generatedAt: new Date().toISOString(),
  projects: projects.length,
  buttonsChecked: checked,
  findings,
};
await fs.writeFile(
  new URL("../docs/ORIGINAL_BUTTON_RESPONSE_AUDIT.json", import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(`\nProjects: ${projects.length}`);
console.log(`Buttons checked: ${checked}`);
console.log(`Potential no-op findings: ${findings.length}`);
for (const finding of findings) console.log(`- ${finding.repo}: ${finding.button} (${finding.reason})`);
process.exitCode = findings.length ? 1 : 0;

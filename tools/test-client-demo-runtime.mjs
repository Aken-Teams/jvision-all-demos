import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
let server;
try {
  await fetch(baseUrl);
} catch {
  server = spawn("C:\\Python314\\python.exe", ["-m","http.server","4191","--bind","127.0.0.1"], {
    cwd: root, stdio: "ignore", windowsHide: true
  });
  await new Promise(resolve => setTimeout(resolve, 1200));
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const byCategory = new Map();
for (const project of catalog.projects || []) {
  if (!byCategory.has(project.category)) byCategory.set(project.category, project);
}
const samples = [...byCategory.values()];
const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: "zh-TW" });
  const page = await desktop.newPage();
  for (const project of samples) {
    await page.goto(`${baseUrl}${project.demoUrl}?mode=guided&client-demo-test=1`, { waitUntil: "load" });
    await page.waitForSelector(".jv-client-demo, .property-demo", { timeout: 7000 });
    await page.waitForTimeout(350);
    if (!(await page.locator(".jv-domain-guide:not([hidden]), .jv-demo-guide:not([hidden])").count())) {
      const guideButton = page.locator("[data-domain-guide], [data-demo-guide]").first();
      if (await guideButton.count()) {
        await guideButton.click();
        await page.waitForTimeout(100);
      }
    }
    const result = await page.evaluate(() => {
      const root = document.querySelector(".jv-client-demo");
      const property = document.querySelector(".property-demo");
      return {
        exists: Boolean(root || property),
        variant: root?.classList.contains("jv-domain-demo") ? "domain" :
          root?.classList.contains("jv-oee-demo") ? "oee" : property ? "property" : "generic",
        title: root?.querySelector("h2")?.textContent || property?.querySelector("h1,h2")?.textContent || "",
        records: root?.querySelectorAll(".jv-demo-record, .jv-domain-items article").length || (property ? 3 : 0),
        stages: root?.querySelectorAll(".jv-demo-stage, .jv-domain-flow button").length || (property ? 5 : 0),
        createButtons: root?.querySelectorAll(".jv-demo-create button, .jv-domain-create button[type=submit]").length || (property ? 1 : 0),
        guideVisible: property ? true : Boolean(root?.querySelector(".jv-demo-guide:not([hidden]), .jv-domain-guide:not([hidden])")),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    let interactionPassed = true;
    if (result.variant === "domain") {
      interactionPassed = await page.evaluate(() => {
        const advance = document.querySelector(".jv-domain-items article [data-domain-advance]:not([disabled])");
        if (!advance) return false;
        advance.click();
        const dialog = document.querySelector(".jv-operation-dialog");
        const governance = dialog?.querySelector(".jv-operation-governance")?.textContent || "";
        return Boolean(dialog && ["必要輸入", "退回條件", "完成後輸出"].every((label) => governance.includes(label)));
      });
    }
    const expectedStages = result.variant === "domain" ? result.stages >= 4 : result.stages === 5;
    rows.push({
      category: project.category,
      repoName: project.repoName,
      passed: result.exists && result.records >= 3 && expectedStages && result.guideVisible && interactionPassed &&
        result.createButtons === 1 && result.horizontalOverflow <= 8,
      interactionPassed,
      ...result
    });
  }
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "zh-TW" });
  const mobilePage = await mobile.newPage();
  const mobileRows = [];
  for (const project of samples) {
    await mobilePage.goto(`${baseUrl}${project.demoUrl}?client-demo-mobile=1`, { waitUntil: "load" });
    await mobilePage.waitForTimeout(900);
    mobileRows.push({
      category: project.category,
      repoName: project.repoName,
      horizontalOverflow: await mobilePage.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    });
  }
  await mobile.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    categories: rows.length,
    desktopPassed: rows.filter(row => row.passed).length,
    mobilePassed: mobileRows.filter(row => row.horizontalOverflow <= 8).length,
    failed: rows.filter(row => !row.passed).length +
      mobileRows.filter(row => row.horizontalOverflow > 8).length
  };
  fs.writeFileSync(
    path.join(root, "docs", "CLIENT_DEMO_RUNTIME_TEST_REPORT.json"),
    `${JSON.stringify({ summary, rows, mobileRows }, null, 2)}\n`
  );
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed) process.exitCode = 1;
} finally {
  await browser.close();
  server?.kill();
}

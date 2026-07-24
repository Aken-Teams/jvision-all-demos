import { chromium } from "playwright";

const baseUrl = process.env.DEMO_BASE_URL || "http://127.0.0.1:4191";
const url = `${baseUrl}/demos/jvision-smart-mfg-151-srm/?mode=free&srm-stage-test=1#module-1`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: "zh-TW" });

try {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector(".jv-domain-demo", { timeout: 5000 });
  const stageButtons = page.locator("[data-stage-filter]");
  const stageCount = await stageButtons.count();
  const stageResults = [];

  for (let index = 0; index < stageCount; index += 1) {
    const button = stageButtons.nth(index);
    const label = (await button.locator("span").textContent())?.trim();
    const expected = Number.parseInt((await button.locator("small").textContent()) || "0", 10);
    await button.click();
    const active = await button.getAttribute("aria-pressed");
    const visible = await page.locator(".jv-domain-items article").count();
    const emptyVisible = await page.locator(".jv-domain-empty").count();
    stageResults.push({
      label,
      expected,
      visible,
      active: active === "true",
      passed: active === "true" && visible === expected && (expected > 0 || emptyVisible === 1)
    });
    await button.click();
  }

  await page.getByRole("button", { name: /建立請購需求/ }).click();
  const createVisible = await page.locator(".jv-domain-create").isVisible();
  const beforeStage = (await page.locator(".jv-domain-items article").first().locator(".jv-domain-status").textContent())?.trim();
  await page.locator("[data-domain-advance]:not([disabled])").first().click();
  const afterStage = (await page.locator(".jv-domain-items article").first().locator(".jv-domain-status").textContent())?.trim();
  await page.getByRole("button", { name: "啟動情境導覽" }).click();
  const guideVisible = await page.locator(".jv-domain-guide").isVisible();
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  const overlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();

  const report = {
    url,
    stageCount,
    stages: stageResults,
    createVisible,
    advanceChangedStage: Boolean(beforeStage && afterStage && beforeStage !== afterStage),
    guideVisible,
    horizontalOverflow: overflow,
    errorOverlay: overlay,
    passed: stageCount === 5 && stageResults.every(result => result.passed) &&
      createVisible && beforeStage !== afterStage && guideVisible && overflow <= 8 && overlay === 0
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
} finally {
  await browser.close();
}

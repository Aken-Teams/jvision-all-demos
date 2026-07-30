import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = process.argv.find((value) => value.startsWith("--base-url="))?.split("=").slice(1).join("=") || "http://127.0.0.1:4191";
const projects = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8")).projects
  .filter((project) => fs.existsSync(path.join(root, "demos", project.repoName, "app.js")))
  .filter((project) => fs.readFileSync(path.join(root, "demos", project.repoName, "app.js"), "utf8").includes("JVISION_DISTINCT_FUNCTIONAL_MODULES"));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: "zh-TW" });
const results = new Array(projects.length);
const workers = 8;

async function verify(project, page) {
  try {
    await page.goto(`${baseUrl}${project.demoUrl}#module-2`, { waitUntil: "domcontentloaded", timeout: 20000 });
    const form = page.locator("[data-stage-action]").first();
    await form.waitFor({ state: "visible", timeout: 7000 });
    const nextStage = await form.getAttribute("data-stage");
    const text = await form.innerText();
    if (!text.includes("處理說明") || !text.includes("儲存紀錄並推進")) throw new Error("階段作業表單內容不完整");
    if (/回訪|追蹤|複核|驗收|確認/.test(nextStage) && !text.includes("回訪結果")) throw new Error("回訪／確認階段缺少結果欄位");
    if (/結案|歸檔|關閉|完成|結算/.test(nextStage) && !text.includes("結案結果")) throw new Error("結案階段缺少結案欄位");
    const before = await page.locator("#fmDetail").innerText();
    for (const select of await form.locator("select").all()) await select.selectOption({ index: 1 });
    for (const input of await form.locator("input").all()) {
      await input.fill((await input.getAttribute("type")) === "date" ? "2026-07-30" : "展示確認人");
    }
    await form.locator("textarea").fill("已完成本階段處理並確認相關資料。");
    await form.locator("button[type=submit]").click();
    const after = await page.locator("#fmDetail").innerText();
    if (before === after || !after.includes(`目前階段\n${nextStage}`)) throw new Error("送出後階段未更新");
    if (!(await page.locator(".fm-save-notice").innerText()).includes(`現在位於「${nextStage}」`)) throw new Error("缺少明確的資料去向提示");
    if ((await page.locator("#fmCaseRows tr.fm-just-updated").count()) !== 1) throw new Error("更新資料列未醒目標示");
    if (!after.includes("最新處理紀錄") || !after.includes("已完成本階段處理並確認相關資料")) throw new Error("右側未顯示最新處理紀錄");
    return { repoName: project.repoName, passed: true, nextStage };
  } catch (error) {
    return { repoName: project.repoName, passed: false, error: String(error) };
  }
}

await Promise.all(Array.from({ length: workers }, async (_, workerIndex) => {
  const page = await context.newPage();
  for (let index = workerIndex; index < projects.length; index += workers) results[index] = await verify(projects[index], page);
  await page.close();
}));

await context.close();
await browser.close();
const failed = results.filter((result) => !result.passed);
const report = { summary: { generatedAt: new Date().toISOString(), total: results.length, passed: results.length - failed.length, failed: failed.length }, results };
fs.writeFileSync(path.join(root, "docs", "STAGE_ACTION_FORMS_REPORT.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (failed.length) {
  console.log(JSON.stringify(failed.slice(0, 20), null, 2));
  process.exitCode = 1;
}

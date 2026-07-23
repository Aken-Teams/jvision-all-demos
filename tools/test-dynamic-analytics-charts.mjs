import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const runtime = fs.readFileSync(path.join(repoRoot, "shared", "jvision-dynamic-charts.js"), "utf8");
const styles = fs.readFileSync(path.join(repoRoot, "shared", "jvision-dynamic-charts.css"), "utf8");

assert.ok(runtime.includes("AI 評分趨勢"));
assert.ok(runtime.includes("顯示趨勢資料"));
assert.ok(runtime.includes("MutationObserver"));
assert.ok(styles.includes("jv-trend-svg"));
assert.ok(styles.includes("prefers-reduced-motion"));

let staticCount = 0;
let chartLayoutCount = 0;
for (const project of catalog.projects) {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
  assert.ok(html.includes("jvision-dynamic-charts.css"), project.repoName + " is missing dynamic chart CSS");
  assert.ok(html.includes("jvision-dynamic-charts.js"), project.repoName + " is missing dynamic chart runtime");
  staticCount += 1;

  const layouts = ["app/layout.js", "app/layout.jsx", "app/layout.tsx", "src/app/layout.js", "src/app/layout.jsx", "src/app/layout.tsx"];
  const layoutPath = layouts.map((file) => path.join(projectDir, file)).find(fs.existsSync);
  if (layoutPath) {
    const layout = fs.readFileSync(layoutPath, "utf8");
    assert.ok(layout.includes("jvision-dynamic-charts.js"), project.repoName + " Next layout is missing the chart runtime");
    assert.ok(fs.existsSync(path.join(path.dirname(layoutPath), "jvision-dynamic-charts.css")), project.repoName + " Next layout is missing chart CSS");
    assert.ok(fs.existsSync(path.join(projectDir, "public", "jvision-dynamic-charts.js")), project.repoName + " Next public runtime is missing");
    chartLayoutCount += 1;
  }
}

console.log(JSON.stringify({ total: catalog.projects.length, staticCount, chartLayoutCount, status: "passed" }, null, 2));

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolDir, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "shared", "jvision-client-demo.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "shared", "jvision-client-demo.css"), "utf8");
const cssVersion = "20260811-showcase-grid-1";
const runtimeVersion = "20260810-guided-4";
const productionPilot = "jvision-ai-case-001-production-scheduler";

assert.ok(runtime.includes("mountGuidedEntry"), "shared runtime is missing guided entry mounting");
assert.ok(runtime.includes("data-jv-guided-start"), "shared runtime is missing the guided start action");
assert.ok(runtime.includes("[data-domain-guide],[data-oee-guide],[data-guide]"), "guided entry is not connected to existing hands-on guides");
assert.ok(styles.includes(".jv-guided-entry"), "shared styles are missing the guided entry component");
assert.ok(styles.includes("grid-template-columns:repeat(2,minmax(0,1fr))"), "showcase fields can still overflow their grid track");
assert.ok(styles.includes(".jv-showcase-fields input{display:block;width:100%;min-width:0;max-width:100%}"), "showcase inputs are missing width containment");

const rows = [];
for (const project of catalog.projects) {
  const file = path.join(root, project.localPath, "index.html");
  const html = fs.readFileSync(file, "utf8");
  assert.ok(html.includes(`jvision-client-demo.css?v=${cssVersion}`), `${project.repoName} has a stale guided-entry stylesheet`);
  assert.ok(html.includes(`jvision-client-demo.js?v=${runtimeVersion}`), `${project.repoName} has a stale guided-entry runtime`);
  assert.ok(html.includes('id="jvision-client-demo-project"'), `${project.repoName} is missing embedded project metadata`);
  if (project.repoName === productionPilot) {
    assert.ok(html.includes("guided-scenario-20260810"), "production pilot is missing its dedicated guided scenario");
  } else {
    const workflow = project.customerWorkflow;
    assert.ok(workflow && Array.isArray(workflow.steps) && workflow.steps.length >= 3, `${project.repoName} is missing three workflow steps`);
    assert.ok(workflow.output, `${project.repoName} is missing a guided outcome`);
  }
  rows.push({ repoName: project.repoName, category: project.category });
}

const categories = new Set(rows.map((row) => row.category));
assert.equal(rows.length, catalog.projects.length);
assert.ok(categories.size >= 20, "guided coverage does not span the catalog industries");

console.log(JSON.stringify({
  total: rows.length,
  sharedGuidedEntries: rows.length - 1,
  dedicatedGuidedEntries: 1,
  categories: categories.size,
  status: "passed",
}, null, 2));

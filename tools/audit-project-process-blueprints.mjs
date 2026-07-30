import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSemanticWorkflow } from "../shared/jvision-semantic-workflows.js";
import { buildProjectProcessBlueprint } from "../shared/jvision-process-blueprints.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const projects = Array.isArray(catalog) ? catalog : catalog.projects;
const failures = [];

for (const project of projects) {
  const definition = resolveSemanticWorkflow(project);
  const blueprint = buildProjectProcessBlueprint(project, definition);
  const checks = {
    "roles": Object.values(blueprint.governance).filter(Boolean).length >= 5,
    "inputs": blueprint.stages.every((stage) => Array.isArray(stage.inputs) && stage.inputs.length >= 3),
    "actions": blueprint.stages.every((stage) => stage.action && stage.owner),
    "approval": blueprint.stages.some((stage) =>
      stage.requiresApproval && stage.approver && stage.passCondition && stage.rejectCondition
    ),
    "outputs": blueprint.stages.every((stage) => stage.output) && Boolean(blueprint.finalOutput),
    "project-specific": blueprint.stages.some((stage) => stage.output.includes(project.title))
  };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) failures.push({ repoName: project.repoName, title: project.title, failed });
}

const report = {
  generatedAt: new Date().toISOString(),
  total: projects.length,
  passed: projects.length - failures.length,
  failed: failures.length,
  failures
};

fs.writeFileSync(
  path.join(root, "docs", "PROJECT_PROCESS_BLUEPRINT_AUDIT.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(`Project process blueprints: ${report.passed}/${report.total} passed`);
if (failures.length) {
  console.error(JSON.stringify(failures.slice(0, 20), null, 2));
  process.exitCode = 1;
}

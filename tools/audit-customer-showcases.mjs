import fs from "node:fs";
import assert from "node:assert/strict";
import { getCustomerShowcaseConfig } from "../shared/jvision-customer-showcase.js";

const catalog = JSON.parse(fs.readFileSync("projects-index.json", "utf8"));
const rows = catalog.projects.map(project => {
  const config = getCustomerShowcaseConfig(project);
  assert.equal(config.steps.length, 3, `${project.repoName}: must have three customer actions`);
  assert.ok(config.story && config.subject && config.output, `${project.repoName}: missing customer story or output`);
  assert.ok(config.steps.every(step => step.title && step.task && step.action && step.result), `${project.repoName}: incomplete action`);
  assert.ok(config.steps.every(step => step.fields?.length || step.choices?.length), `${project.repoName}: action has no customer input`);
  return {
    repoName: project.repoName,
    category: project.category,
    title: config.title,
    story: config.story,
    output: config.output,
    steps: config.steps.map(step => step.title)
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  total: rows.length,
  categories: new Set(rows.map(row => row.category)).size,
  uniqueStories: new Set(rows.map(row => row.story)).size,
  uniqueOutputs: new Set(rows.map(row => row.output)).size,
  rows
};
fs.writeFileSync("docs/CUSTOMER_SHOWCASE_AUDIT.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  total: report.total,
  categories: report.categories,
  uniqueStories: report.uniqueStories,
  uniqueOutputs: report.uniqueOutputs,
  status: report.total === 463 && report.uniqueStories === 463 && report.uniqueOutputs === 463 ? "passed" : "review"
}, null, 2));

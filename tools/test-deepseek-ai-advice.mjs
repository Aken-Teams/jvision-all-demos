import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const require = createRequire(import.meta.url);
const handler = require(path.join(repoRoot, "api", "ai-advice.js"));
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jvision-ai-advice.js";
const pilotRepos = new Set([
  "jvision-ai-case-001-production-scheduler",
  "jvision-crm",
  "jvision-customer-support-platform",
]);

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function request(body, ip = "127.0.0.1") {
  return { method: "POST", headers: { "x-forwarded-for": ip }, body };
}

let injected = 0;
const missingRuntime = [];
for (const project of catalog.projects) {
  const indexPath = path.join(repoRoot, "demos", project.repoName, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  const hasRuntime = html.includes(marker) && html.includes("jvision-ai-advice.css");
  if (hasRuntime) injected += 1;
  else missingRuntime.push(project.repoName);
  if (pilotRepos.has(project.repoName)) {
    assert.ok(hasRuntime, `${project.repoName} is missing the AI advice runtime`);
    assert.ok(html.includes("20260810-context-pilot"), `${project.repoName} is missing the contextual AI cache version`);
  }
}

const oldKey = process.env.DEEPSEEK_API_KEY;
const oldFetch = global.fetch;
delete process.env.DEEPSEEK_API_KEY;
const unavailable = response();
await handler(request({ project: { title: "測試專案" } }, "10.0.0.1"), unavailable);
assert.equal(unavailable.statusCode, 503);

process.env.DEEPSEEK_API_KEY = "test-key";
let fetchRequest;
global.fetch = async (url, options) => {
  fetchRequest = { url, options };
  return {
    ok: true,
    status: 200,
    json: async () => ({
      model: "deepseek-v4-flash",
      choices: [{ message: { content: JSON.stringify({
        headline: "交期風險分析",
        summary: "兩筆工單需要優先檢查。",
        actions: ["檢查設備負載", "確認插單順序"],
        evidence: [{ label: "逾期工單", value: "2 筆", source: "排程總覽" }],
        risk: "high",
        confidence: 0.88,
        requiresConfirmation: true,
      }) } }],
    }),
  };
};

const success = response();
await handler(request({
  project: { title: "產線智排中心", description: "依照產能與交期產生排程建議", repoName: "jvision-ai-case-001-production-scheduler" },
  module: "排程總覽",
  action: "AI 情境分析",
  task: "找出交期與產能風險",
  role: "生管專員",
  evidence: [{ label: "逾期工單", value: "2 筆", source: "排程總覽" }],
  context: "目前設備負載偏高",
}, "10.0.0.2"), success);
assert.equal(success.statusCode, 200);
assert.equal(success.body.advice.risk, "high");
assert.equal(success.body.advice.actions.length, 2);
assert.equal(success.body.advice.evidence.length, 1);
assert.equal(success.body.advice.confidence, 0.88);
assert.equal(success.body.advice.requiresConfirmation, true);
assert.equal(fetchRequest.url, "https://api.deepseek.com/chat/completions");
const outbound = JSON.parse(fetchRequest.options.body);
assert.equal(outbound.model, "deepseek-v4-flash");
assert.equal(outbound.response_format.type, "json_object");
assert.ok(outbound.messages[1].content.includes("生管專員"));
assert.ok(outbound.messages[1].content.includes("逾期工單: 2 筆"));
assert.ok(!fetchRequest.options.body.includes("test-key"));

const normalised = handler._test.normalisePayload({
  project: { title: "CRM", repoName: "jvision-crm" },
  evidence: Array.from({ length: 20 }, (_, index) => ({ label: `欄位 ${index}`, value: `${index}` })),
});
assert.equal(normalised.evidence.length, 12);

const invalid = response();
await handler(request({ project: {} }, "10.0.0.3"), invalid);
assert.equal(invalid.statusCode, 400);

if (oldKey === undefined) delete process.env.DEEPSEEK_API_KEY;
else process.env.DEEPSEEK_API_KEY = oldKey;
global.fetch = oldFetch;

console.log(JSON.stringify({ total: catalog.projects.length, injected, missingRuntime, pilots: pilotRepos.size, api: "passed" }, null, 2));

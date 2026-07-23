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
const runtime = fs.readFileSync(path.join(repoRoot, "shared", marker), "utf8");

assert.ok(runtime.includes('"AI · 即時分析"'), "AI advice panel must use provider-neutral branding");
assert.ok(!runtime.includes('"DEEPSEEK ·'), "AI advice panel must not expose the provider name");

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
for (const project of catalog.projects) {
  const indexPath = path.join(repoRoot, "demos", project.repoName, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  assert.ok(html.includes(marker), `${project.repoName} is missing the AI advice runtime`);
  assert.ok(html.includes("jvision-ai-advice.css"), `${project.repoName} is missing the AI advice styles`);
  assert.ok(html.includes("jvision-ai-advice.js?v=20260723-3"), `${project.repoName} has a stale AI advice runtime`);
  injected += 1;
}

const oldKey = process.env.DEEPSEEK_API_KEY;
const oldFetch = global.fetch;
delete process.env.DEEPSEEK_API_KEY;
const unavailable = response();
await handler(request({ project: { title: "示範系統" } }, "10.0.0.1"), unavailable);
assert.equal(unavailable.statusCode, 503);

process.env.DEEPSEEK_API_KEY = "test-key";
let fetchRequest;
global.fetch = async (url, options) => {
  fetchRequest = { url, options };
  return {
    ok: true,
    status: 200,
    model: "deepseek-v4-flash",
    json: async () => ({
      model: "deepseek-v4-flash",
      choices: [{ message: { content: JSON.stringify({ headline: "優先處理出貨", summary: "先處理即將逾期的揀貨批次。", actions: ["確認缺料", "重排人力"], risk: "high" }) } }],
    }),
  };
};
const success = response();
await handler(request({ project: { title: "倉儲波次出貨艙", description: "管理揀貨波次" }, module: "AI 決策中心", action: "重新分析", context: "高風險 2 筆" }, "10.0.0.2"), success);
assert.equal(success.statusCode, 200);
assert.equal(success.body.advice.risk, "high");
assert.equal(success.body.advice.actions.length, 2);
assert.equal(fetchRequest.url, "https://api.deepseek.com/chat/completions");
const outbound = JSON.parse(fetchRequest.options.body);
assert.equal(outbound.model, "deepseek-v4-flash");
assert.equal(outbound.response_format.type, "json_object");
assert.ok(!fetchRequest.options.body.includes("test-key"));

const invalid = response();
await handler(request({ project: {} }, "10.0.0.3"), invalid);
assert.equal(invalid.statusCode, 400);

if (oldKey === undefined) delete process.env.DEEPSEEK_API_KEY;
else process.env.DEEPSEEK_API_KEY = oldKey;
global.fetch = oldFetch;

console.log(JSON.stringify({ total: catalog.projects.length, injected, api: "passed" }, null, 2));

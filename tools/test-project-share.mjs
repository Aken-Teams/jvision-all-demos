import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const toolDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolDir, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const scope = require(path.join(root, "api/share/_scope.js"));
const createShare = require(path.join(root, "api/share/create.js"));
const accessShare = require(path.join(root, "api/share/access.js"));

const oldSecret = process.env.SHARE_LINK_SECRET;
process.env.SHARE_LINK_SECRET = "project-share-test-secret-with-at-least-32-characters";

const generated = scope.createScope(catalog.projects[0].repoName, 90_000);
assert.ok(generated?.token, "a signed scope token should be generated");
assert.equal(scope.verifyScope(generated.token, catalog.projects[0].repoName)?.repoName, catalog.projects[0].repoName, "matching token should verify");
assert.equal(scope.verifyScope(generated.token, catalog.projects[1].repoName), null, "a token cannot be reused for another project");
assert.equal(scope.verifyScope(`${generated.token}tampered`, catalog.projects[0].repoName), null, "tampered token must fail");
assert.equal(scope.normaliseRepoName("../admin"), "", "unsafe repo path must fail");
assert.match(scope.cookieForScope(generated.token, generated.expiresAt), /HttpOnly; Secure; SameSite=Lax/, "scope cookie must be protected");

function responseMock() {
  return {
    headers: {}, statusCode: 200, payload: undefined, ended: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; },
    send(value) { this.payload = value; return this; },
    end() { this.ended = true; return this; },
  };
}

const createResponse = responseMock();
createShare({ method: "POST", headers: { "x-real-ip": "203.0.113.4" }, body: { repoName: catalog.projects[0].repoName } }, createResponse);
assert.equal(createResponse.statusCode, 200, "known project should create a share URL");
assert.match(createResponse.payload.url, new RegExp(`^/share/${catalog.projects[0].repoName}/\\?token=`), "share URL should point to the scoped access route");
const accessResponse = responseMock();
accessShare({ query: { repo: catalog.projects[0].repoName, token: createResponse.payload.url.split("token=")[1] } }, accessResponse);
assert.equal(accessResponse.statusCode, 302, "valid share URL should redirect into its Demo");
assert.equal(accessResponse.headers.location, `/demos/${catalog.projects[0].repoName}/?shared=1`, "share URL must only enter its own Demo");
assert.match(accessResponse.headers["set-cookie"], /HttpOnly; Secure; SameSite=Lax/, "access route must create a protected share session");
const rejectedResponse = responseMock();
accessShare({ query: { repo: catalog.projects[1].repoName, token: createResponse.payload.url.split("token=")[1] } }, rejectedResponse);
assert.equal(rejectedResponse.statusCode, 403, "a share URL cannot be rebound to another Demo");

let missing = [];
for (const project of catalog.projects) {
  const indexPath = path.join(root, "demos", project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(`${project.repoName}: missing index.html`);
    continue;
  }
  const html = fs.readFileSync(indexPath, "utf8");
  if (!html.includes("jvision-project-share.css") || !html.includes("jvision-project-share.js")) missing.push(project.repoName);
}
assert.deepEqual(missing, [], `share runtime missing from: ${missing.join(", ")}`);

if (oldSecret === undefined) delete process.env.SHARE_LINK_SECRET;
else process.env.SHARE_LINK_SECRET = oldSecret;

console.log(JSON.stringify({ checkedProjects: catalog.projects.length, token: "passed", runtime: "passed" }, null, 2));

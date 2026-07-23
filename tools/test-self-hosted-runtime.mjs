import assert from "node:assert/strict";

const oldSecret = process.env.SHARE_LINK_SECRET;
const oldRelease = process.env.JVISION_RELEASE_SHA;
const oldBranch = process.env.JVISION_DEPLOY_BRANCH;
process.env.SHARE_LINK_SECRET = "self-hosted-runtime-test-secret-with-32-characters";
process.env.JVISION_RELEASE_SHA = "0123456789abcdef0123456789abcdef01234567";
process.env.JVISION_DEPLOY_BRANCH = "feat/homepage-impact";
const { createJvisionServer } = await import("../server.mjs");
const server = createJvisionServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

try {
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;

  const homepage = await fetch(`${origin}/`);
  assert.equal(homepage.status, 200);
  assert.match(homepage.headers.get("content-type") || "", /^text\/html/);
  assert.equal((await fetch(`${origin}/.env`)).status, 404);
  assert.equal((await fetch(`${origin}/server.mjs`)).status, 404);

  const healthResponse = await fetch(`${origin}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.equal(healthResponse.headers.get("cache-control"), "no-store");
  const health = await healthResponse.json();
  assert.deepEqual({
    ok: health.ok,
    branch: health.branch,
    release: health.release,
  }, {
    ok: true,
    branch: "feat/homepage-impact",
    release: "0123456789abcdef0123456789abcdef01234567",
  });
  assert.match(health.startedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal((await fetch(`${origin}/api/health`, { method: "POST" })).status, 405);

  const createResponse = await fetch(`${origin}/api/share/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoName: "jvision-ai-case-001-production-scheduler" }),
  });
  assert.equal(createResponse.status, 200);
  const created = await createResponse.json();
  assert.match(created.url, /^\/share\/jvision-ai-case-001-production-scheduler\/\?token=/);

  const accessResponse = await fetch(`${origin}${created.url}`, { redirect: "manual" });
  assert.equal(accessResponse.status, 302);
  assert.equal(accessResponse.headers.get("location"), "/demos/jvision-ai-case-001-production-scheduler/?shared=1");
  const cookie = accessResponse.headers.get("set-cookie") || "";
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.doesNotMatch(cookie, /;\s*Secure/i, "LAN HTTP cookies must be accepted by the browser");

  const scopedDemo = await fetch(`${origin}/demos/jvision-ai-case-001-production-scheduler/?shared=1`, {
    headers: { Cookie: cookie.split(";")[0] },
  });
  assert.equal(scopedDemo.status, 200);

  const blockedHomepage = await fetch(`${origin}/`, {
    headers: { Cookie: cookie.split(";")[0] },
  });
  assert.equal(blockedHomepage.status, 403);
  assert.match(await blockedHomepage.text(), /此分享僅限指定專案/);

  const aiRoute = await fetch(`${origin}/api/ai-advice`);
  assert.equal(aiRoute.status, 405);

  console.log(JSON.stringify({ static: "passed", health: "passed", share: "passed", scope: "passed", aiRoute: "passed" }, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
  if (oldSecret === undefined) delete process.env.SHARE_LINK_SECRET;
  else process.env.SHARE_LINK_SECRET = oldSecret;
  if (oldRelease === undefined) delete process.env.JVISION_RELEASE_SHA;
  else process.env.JVISION_RELEASE_SHA = oldRelease;
  if (oldBranch === undefined) delete process.env.JVISION_DEPLOY_BRANCH;
  else process.env.JVISION_DEPLOY_BRANCH = oldBranch;
}

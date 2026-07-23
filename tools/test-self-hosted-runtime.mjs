import assert from "node:assert/strict";

const oldSecret = process.env.SHARE_LINK_SECRET;
process.env.SHARE_LINK_SECRET = "self-hosted-runtime-test-secret-with-32-characters";
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

  console.log(JSON.stringify({ static: "passed", share: "passed", scope: "passed", aiRoute: "passed" }, null, 2));
} finally {
  await new Promise((resolve) => server.close(resolve));
  if (oldSecret === undefined) delete process.env.SHARE_LINK_SECRET;
  else process.env.SHARE_LINK_SECRET = oldSecret;
}

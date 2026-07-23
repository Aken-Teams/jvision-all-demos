import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = fs.readFileSync(path.join(root, "tools", "self-host-sync.sh"), "utf8");

for (const required of [
  "flock -n",
  "git status --porcelain --untracked-files=no",
  "git worktree add",
  "node --check",
  "node tools/test-self-hosted-runtime.mjs",
  "JVISION_RELEASE_SHA",
  "/api/health",
  "rolling back",
  "git reset --hard --quiet \"$current_sha\"",
  "Skipping previously failed release",
]) {
  assert.ok(source.includes(required), `missing deployment safeguard: ${required}`);
}

assert.doesNotMatch(source, /\b(?:sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+)\b/, "deployment script must not contain credentials");
console.log(JSON.stringify({ deploymentSafeguards: "passed" }, null, 2));

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const projects = Array.isArray(catalog) ? catalog : catalog.projects;
let updated = 0;
let checked = 0;

for (const project of projects.filter((item) => item.sourceGroup === "legacy-jvision")) {
  const indexPath = path.join(root, "demos", project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) continue;
  checked += 1;
  const source = fs.readFileSync(indexPath, "utf8");
  const bodyClass = source.match(/<body\b[^>]*\bclass=["']([^"']+)["']/i)?.[1]?.trim();
  if (!bodyClass) continue;

  // Next's exported RSC payload is embedded as an escaped string. Some legacy
  // snapshots received a body class after their last build, so the DOM and RSC
  // tree disagree before React hydrates. Keep the compatibility snapshot in
  // sync without changing the independently runnable Next.js source.
  const marker = '\\"body\\",null,{\\"children\\"';
  const replacement = `\\"body\\",null,{\\"className\\":\\"${bodyClass.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}\\",\\"children\\"`;
  let next = source;
  if (next.includes(marker) && !next.includes(replacement)) {
    next = next.replace(marker, replacement);
  }
  next = next.replace(
    /\\"html\\",null,\{\\"lang\\":\\"([^"]+)\\",\\"children\\"/,
    '\\"html\\",null,{\\"lang\\":\\"$1\\",\\"suppressHydrationWarning\\":true,\\"children\\"'
  );
  if (next === source) continue;
  fs.writeFileSync(indexPath, next);
  updated += 1;
}

console.log(JSON.stringify({ checked, updated }, null, 2));

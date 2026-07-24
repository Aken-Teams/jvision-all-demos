import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jv-demo-hub-link";
const version = "20260724";
const runtimeMarker = "jvision-demo-hub-navigation.js";
const runtimeScript = `<script src="../../shared/jvision-demo-hub-navigation.js?v=${version}" defer></script>`;
const legacyStyle = /\s*<style\s+id=(['"])jv-demo-hub-navigation-[^'"]*\1[^>]*>[\s\S]*?<\/style>\s*/gi;
const legacyLink = /\s*<a\b[^>]*\bclass=(['"])[^'"]*jv-demo-hub-link[^'"]*\1[^>]*>[\s\S]*?<\/a>\s*/gi;
const oldRuntime = /\s*<script\b[^>]*\bsrc=(['"])[^'"]*jvision-demo-hub-navigation\.js[^'"]*\1[^>]*><\/script>\s*/gi;

let converted = 0;
let alreadyRuntime = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }

  let html = fs.readFileSync(indexPath, "utf8");
  const hadLegacyMarkup = html.includes(marker);
  const hadRuntime = html.includes(runtimeMarker);
  html = html.replace(legacyStyle, "\n").replace(legacyLink, "\n").replace(oldRuntime, "\n");
  if (!/<\/head>/i.test(html)) throw new Error(`Cannot add homepage runtime: missing head tag in ${project.repoName}`);
  html = html.replace(/<\/head>/i, `  ${runtimeScript}\n</head>`);
  fs.writeFileSync(indexPath, html.replaceAll("\r\n", "\n"), "utf8");
  if (hadLegacyMarkup || !hadRuntime) converted += 1;
  else alreadyRuntime += 1;
}

console.log(JSON.stringify({ total: catalog.projects.length, converted, alreadyRuntime, missing }, null, 2));
if (missing.length) process.exitCode = 1;

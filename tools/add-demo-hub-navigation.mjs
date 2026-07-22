import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const marker = "jv-demo-hub-link";
const version = "20260722";

const styles = `
  <style id="jv-demo-hub-navigation-${version}">
    .${marker}{position:fixed;z-index:9999;top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid rgba(37,99,235,.24);border-radius:999px;background:rgba(255,255,255,.94);color:#17326d!important;box-shadow:0 12px 28px rgba(15,23,42,.16);font:800 14px/1.1 Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif!important;letter-spacing:0!important;text-decoration:none!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .2s ease,box-shadow .2s ease,transform .2s ease}.${marker}:hover{background:#eff6ff;color:#1d4ed8!important;box-shadow:0 16px 34px rgba(37,99,235,.23);transform:translateY(-1px)}.${marker}:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}.${marker} svg{width:18px;height:18px;flex:0 0 auto}@media (max-width:640px){.${marker}{top:auto;bottom:max(14px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);white-space:nowrap}.${marker}:hover{transform:translateX(-50%) translateY(-1px)}}@media (prefers-reduced-motion:reduce){.${marker}{transition:none}}
  </style>`;

const link = `
  <a class="${marker}" href="../../" aria-label="回到 JV Demo 網站">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></svg>
    <span>返回專案首頁</span>
  </a>`;

let injected = 0;
let existing = 0;
const missing = [];

for (const project of catalog.projects) {
  const indexPath = path.join(demosRoot, project.repoName, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }

  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes(marker)) {
    existing += 1;
    continue;
  }

  if (!/<body\b[^>]*>/i.test(html)) {
    throw new Error(`Cannot add homepage link: missing body tag in ${project.repoName}`);
  }

  html = /<\/head>/i.test(html)
    ? html.replace(/<\/head>/i, `${styles}\n</head>`)
    : `${styles}\n${html}`;
  html = html.replace(/<body\b[^>]*>/i, (body) => `${body}${link}`);
  fs.writeFileSync(indexPath, html.replaceAll("\r\n", "\n"), "utf8");
  injected += 1;
}

console.log(JSON.stringify({ total: catalog.projects.length, injected, existing, missing }, null, 2));
if (missing.length) process.exitCode = 1;

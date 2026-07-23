import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const cssSource = fs.readFileSync(path.join(repoRoot, "shared", "jvision-dynamic-charts.css"), "utf8");
const runtimeSource = fs.readFileSync(path.join(repoRoot, "shared", "jvision-dynamic-charts.js"), "utf8");
const version = "20260723";

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents.replaceAll("\r\n", "\n"), "utf8");
}

function findLayout(projectDir) {
  return ["app/layout.js", "app/layout.jsx", "app/layout.tsx", "src/app/layout.js", "src/app/layout.jsx", "src/app/layout.tsx"]
    .map((candidate) => path.join(projectDir, candidate))
    .find(fs.existsSync);
}

function injectStatic(html) {
  let next = html
    .replace(/\s*<link\s+rel=["']stylesheet["']\s+href=["'][^"']*jvision-dynamic-charts\.css[^"']*["']\s*\/?>(?:\r?\n)?/gi, "\n")
    .replace(/\s*<script\s+src=["'][^"']*jvision-dynamic-charts\.js[^"']*["']\s+defer><\/script>(?:\r?\n)?/gi, "\n");
  const css = '<link rel="stylesheet" href="../../shared/jvision-dynamic-charts.css?v=' + version + '" />';
  const script = '<script src="../../shared/jvision-dynamic-charts.js?v=' + version + '" defer></script>';
  next = /<\/head>/i.test(next) ? next.replace(/<\/head>/i, "  " + css + "\n</head>") : css + "\n" + next;
  return /<\/body>/i.test(next) ? next.replace(/<\/body>/i, "  " + script + "\n</body>") : next + "\n" + script;
}

function injectNextLayout(source) {
  let next = source
    .replace(/^import\s+["']\.\/jvision-dynamic-charts\.css["'];\s*\r?\n/m, "")
    .replace(/\s*<script\s+src=["']\/jvision-dynamic-charts\.js[^"']*["']\s+defer\s*\/?>(?:<\/script>)?/gi, "");
  const importLine = 'import "./jvision-dynamic-charts.css";';
  const globalsImport = next.match(/^import\s+["']\.\/globals\.css["'];\s*$/m);
  next = globalsImport ? next.replace(globalsImport[0], globalsImport[0] + "\n" + importLine) : importLine + "\n" + next;
  return next.replace(/<\/body>/i, '        <script src="/jvision-dynamic-charts.js?v=' + version + '" defer />\n      </body>');
}

let staticCount = 0;
let nextCount = 0;
const missing = [];
for (const project of catalog.projects) {
  const projectDir = path.join(demosRoot, project.repoName);
  const indexPath = path.join(projectDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    missing.push(project.repoName);
    continue;
  }
  write(indexPath, injectStatic(fs.readFileSync(indexPath, "utf8")));
  staticCount += 1;

  const layoutPath = findLayout(projectDir);
  if (layoutPath) {
    const appDir = path.dirname(layoutPath);
    write(path.join(appDir, "jvision-dynamic-charts.css"), cssSource);
    write(path.join(projectDir, "public", "jvision-dynamic-charts.js"), runtimeSource);
    write(layoutPath, injectNextLayout(fs.readFileSync(layoutPath, "utf8")));
    nextCount += 1;
  }
}

console.log(JSON.stringify({ total: catalog.projects.length, staticCount, nextCount, missing }, null, 2));
if (missing.length) process.exitCode = 1;

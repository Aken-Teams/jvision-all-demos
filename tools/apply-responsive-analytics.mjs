import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const demosRoot = path.join(repoRoot, "demos");
const projectsIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const sharedCss = fs.readFileSync(path.join(repoRoot, "shared", "jvision-analytics.css"), "utf8");
const runtimeTemplate = fs.readFileSync(path.join(repoRoot, "shared", "jvision-analytics-runtime.js"), "utf8");
const requestedRepo = process.argv.find((argument) => argument.startsWith("--repo="))?.slice(7);
const version = "mobile-analytics-20260722";

const projects = requestedRepo
  ? projectsIndex.projects.filter((project) => project.repoName === requestedRepo)
  : projectsIndex.projects;

if (requestedRepo && projects.length !== 1) {
  throw new Error(`Unknown project: ${requestedRepo}`);
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents.replaceAll("\r\n", "\n"), "utf8");
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extract(html, expression) {
  return plainText(html.match(expression)?.[1]);
}

function createProfile(project, html) {
  const documentTitle = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const heading = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const description = project.description || extract(
    html,
    /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
  );
  return {
    id: Number(project.id) || project.repoName,
    repoName: project.repoName,
    name: heading || project.title || documentTitle || project.repoName,
    category: project.category || project.industry || "企業營運",
    description: description || "以統計資料掌握營運狀態、風險與改善進度。",
  };
}

function injectStaticAssets(indexHtml) {
  let html = indexHtml;
  if (!/<meta\s+name=["']viewport["']/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />`);
  }
  if (!html.includes("jvision-analytics.css")) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="./jvision-analytics.css?v=${version}" />\n</head>`);
  }
  if (!html.includes("jvision-analytics.js")) {
    html = html.replace(/<\/body>/i, `  <script src="./jvision-analytics.js?v=${version}" defer></script>\n</body>`);
  }
  return html;
}

function findLayout(projectDir) {
  const candidates = [
    "app/layout.js",
    "app/layout.jsx",
    "app/layout.tsx",
    "src/app/layout.js",
    "src/app/layout.jsx",
    "src/app/layout.tsx",
  ];
  return candidates.map((candidate) => path.join(projectDir, candidate)).find((candidate) => fs.existsSync(candidate));
}

function injectNextLayout(layoutSource, repoName) {
  let source = layoutSource.replace(/^import\s+["']\.\/jvision-analytics\.css["'];\s*\r?\n/m, "");
  const globalsImport = source.match(/^import\s+["']\.\/globals\.css["'];\s*$/m);
  source = globalsImport
    ? source.replace(globalsImport[0], `${globalsImport[0]}\nimport "./jvision-analytics.css";`)
    : `import "./jvision-analytics.css";\n${source}`;
  if (!source.includes("jvision-analytics.js")) {
    if (!/<\/body>/i.test(source)) {
      throw new Error(`Could not inject analytics runtime: ${repoName} layout has no </body>.`);
    }
    source = source.replace(/<\/body>/i, `        <script src="/jvision-analytics.js" defer />\n      </body>`);
  }
  return source;
}

function applyProject(project) {
  const projectDir = path.join(demosRoot, project.repoName);
  const indexPath = path.join(projectDir, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error(`Missing index.html: ${project.repoName}`);

  const originalHtml = fs.readFileSync(indexPath, "utf8");
  const profile = createProfile(project, originalHtml);
  const runtime = runtimeTemplate.replace("__JVISION_PROFILE__", JSON.stringify(profile).replaceAll("<", "\\u003c"));

  writeFile(path.join(projectDir, "jvision-analytics.css"), sharedCss);
  writeFile(path.join(projectDir, "jvision-analytics.js"), runtime);
  writeFile(indexPath, injectStaticAssets(originalHtml));

  const layoutPath = findLayout(projectDir);
  if (layoutPath) {
    const appDir = path.dirname(layoutPath);
    writeFile(path.join(appDir, "jvision-analytics.css"), sharedCss);
    writeFile(path.join(projectDir, "public", "jvision-analytics.js"), runtime);
    writeFile(layoutPath, injectNextLayout(fs.readFileSync(layoutPath, "utf8"), project.repoName));
  }

  return { repoName: project.repoName, runtime: layoutPath ? "next" : "static" };
}

const results = projects.map(applyProject);
const nextCount = results.filter((result) => result.runtime === "next").length;
const staticCount = results.length - nextCount;

console.log(`Applied mobile RWD and analytics to ${results.length} project(s).`);
console.log(`Next.js: ${nextCount}; static: ${staticCount}.`);
if (results.length <= 8) results.forEach((result) => console.log(`- ${result.repoName} (${result.runtime})`));

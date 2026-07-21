import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const projectsIndexPath = path.join(repoRoot, "projects-index.json");
const projectsIndex = JSON.parse(fs.readFileSync(projectsIndexPath, "utf8"));
const requestedRepo = process.argv.find((value) => value.startsWith("--repo="))?.slice(7);

const generatedProjects = projectsIndex.projects.filter(
  (project) => Number(project.id) >= 1001 && Number(project.id) <= 1400,
);

if (generatedProjects.length !== 400) {
  throw new Error(`Expected 400 generated projects (1001-1400), found ${generatedProjects.length}.`);
}

const selectedProjects = requestedRepo
  ? generatedProjects.filter((project) => project.repoName === requestedRepo)
  : generatedProjects;

if (requestedRepo && selectedProjects.length !== 1) {
  throw new Error(`Unknown generated project: ${requestedRepo}`);
}

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required source file: ${path.relative(repoRoot, filePath)}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function matchRequired(text, expression, label, repoName) {
  const match = text.match(expression);
  if (!match) {
    throw new Error(`Could not extract ${label} from ${repoName}/index.html.`);
  }
  return match[1];
}

function safeScriptJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function writeGenerated(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents.replaceAll("\r\n", "\n"), "utf8");
}

function convertProject(project) {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const indexHtml = readRequired(path.join(projectDir, "index.html"));
  const sourceCss = readRequired(path.join(projectDir, "styles.css"));
  const sourceRuntime = readRequired(path.join(projectDir, "app.js"));
  const originalPackage = JSON.parse(readRequired(path.join(projectDir, "package.json")));

  const title = matchRequired(indexHtml, /<title>([\s\S]*?)<\/title>/i, "title", project.repoName).trim();
  const description = matchRequired(
    indexHtml,
    /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i,
    "description",
    project.repoName,
  ).trim();
  const extractedBodyClass = matchRequired(indexHtml, /<body\s+class=["']([^"']+)["']/i, "body class", project.repoName).trim();
  const bodyClass = [...new Set([...extractedBodyClass.split(/\s+/), "jvision-bright-saas", "jvision-generated"])].join(" ");
  const mainMatch = indexHtml.match(/<main\s+class=["']([^"']+)["'][^>]*>([\s\S]*?)<\/main>/i);
  if (!mainMatch) {
    throw new Error(`Could not extract the main application shell from ${project.repoName}/index.html.`);
  }

  const configText = matchRequired(
    indexHtml,
    /window\.DEMO_CONFIG\s*=\s*([\s\S]*?);\s*window\.SYSTEM_PRESET\s*=/,
    "DEMO_CONFIG",
    project.repoName,
  ).trim();
  const presetText = matchRequired(
    indexHtml,
    /window\.SYSTEM_PRESET\s*=\s*([\s\S]*?);\s*<\/script>/,
    "SYSTEM_PRESET",
    project.repoName,
  ).trim();

  const demoConfig = JSON.parse(configText);
  const systemPreset = JSON.parse(presetText);
  const mainClass = mainMatch[1].trim();
  const mainContent = mainMatch[2].trim();

  const packageJson = {
    name: project.repoName,
    version: originalPackage.version || "1.0.0",
    private: true,
    scripts: {
      dev: "next dev --webpack",
      build: "next build --webpack",
      start: "next start",
    },
    dependencies: {
      next: "16.2.10",
      react: "18.3.1",
      "react-dom": "18.3.1",
    },
    engines: {
      node: ">=20.9.0",
    },
    jvision: {
      id: Number(project.id),
      type: "next-app-router",
      hubPath: `/demos/${project.repoName}/`,
    },
  };

  const demoData = `// Generated from the preserved standalone demo source.\n` +
    `export const pageMetadata = ${safeScriptJson({ title, description })};\n` +
    `export const bodyClass = ${safeScriptJson(bodyClass)};\n` +
    `export const mainClass = ${safeScriptJson(mainClass)};\n` +
    `export const mainContent = ${safeScriptJson(mainContent)};\n` +
    `export const demoConfig = ${safeScriptJson(demoConfig)};\n` +
    `export const systemPreset = ${safeScriptJson(systemPreset)};\n`;

  const layoutSource = `import "./globals.css";\n` +
    `import { bodyClass, pageMetadata } from "./demo-data";\n\n` +
    `export const metadata = pageMetadata;\n\n` +
    `export default function RootLayout({ children }) {\n` +
    `  return (\n` +
    `    <html lang="zh-Hant">\n` +
    `      <body className={bodyClass}>{children}</body>\n` +
    `    </html>\n` +
    `  );\n` +
    `}\n`;

  const pageSource = `import Script from "next/script";\n` +
    `import { demoConfig, mainClass, mainContent, systemPreset } from "./demo-data";\n\n` +
    `const bootstrapCode = \`window.DEMO_CONFIG = \${JSON.stringify(demoConfig)};\\nwindow.SYSTEM_PRESET = \${JSON.stringify(systemPreset)};\`;\n\n` +
    `export const dynamic = "force-static";\n\n` +
    `export default function DemoPage() {\n` +
    `  return (\n` +
    `    <>\n` +
    `      <script dangerouslySetInnerHTML={{ __html: bootstrapCode }} />\n` +
    `      <main className={mainClass} dangerouslySetInnerHTML={{ __html: mainContent }} />\n` +
    `      <Script src="./demo-app.js" strategy="afterInteractive" />\n` +
    `    </>\n` +
    `  );\n` +
    `}\n`;

  const nextConfig = `const hubBasePath = (process.env.JVISION_BASE_PATH || "").trim();\n` +
    `const isStaticExport = process.env.JVISION_STATIC_EXPORT === "1";\n\n` +
    `const nextConfig = {\n` +
    `  output: isStaticExport ? "export" : undefined,\n` +
    `  basePath: hubBasePath,\n` +
    `  assetPrefix: hubBasePath || undefined,\n` +
    `  trailingSlash: isStaticExport,\n` +
    `  images: { unoptimized: isStaticExport },\n` +
    `};\n\n` +
    `export default nextConfig;\n`;

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n` +
    `  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7dd3fc"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>\n` +
    `  <rect width="64" height="64" rx="16" fill="#071018"/>\n` +
    `  <path d="M17 15v22c0 9 5 13 14 13 10 0 16-5 16-16V15H37v20c0 5-2 7-6 7-3 0-5-2-5-6V15H17Z" fill="url(#g)"/>\n` +
    `</svg>\n`;

  writeGenerated(path.join(projectDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  writeGenerated(path.join(projectDir, "next.config.mjs"), nextConfig);
  writeGenerated(path.join(projectDir, "app", "layout.js"), layoutSource);
  writeGenerated(path.join(projectDir, "app", "page.js"), pageSource);
  writeGenerated(path.join(projectDir, "app", "demo-data.js"), demoData);
  writeGenerated(path.join(projectDir, "app", "globals.css"), sourceCss);
  writeGenerated(path.join(projectDir, "app", "icon.svg"), iconSvg);
  writeGenerated(path.join(projectDir, "public", "demo-app.js"), sourceRuntime);
  writeGenerated(
    path.join(projectDir, ".gitignore"),
    "node_modules/\n.next/\nout/\n.vercel/\n*.log\n",
  );

  return project.repoName;
}

const converted = selectedProjects.map(convertProject);
console.log(`Converted ${converted.length} generated demo project(s) to Next.js App Router.`);
if (converted.length <= 5) {
  converted.forEach((repoName) => console.log(`- ${repoName}`));
}

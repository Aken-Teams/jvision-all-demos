import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const sharedCss = fs.readFileSync(path.join(repoRoot, "bright-saas.css"), "utf8").trim();
const sharedIcon = fs.readFileSync(path.join(repoRoot, "favicon.svg"), "utf8").trim();
const sharedLogoPath = path.join(repoRoot, "demos", "jvision-event-wedding", "logo.png");
const sourceStart = "/* JVISION_PROFESSIONAL_LIGHT_START */";
const sourceEnd = "/* JVISION_PROFESSIONAL_LIGHT_END */";
const themeLink = '<link rel="stylesheet" href="./bright-saas.css?v=professional-light-20260721" />';
const iconLink = '<link rel="icon" href="./favicon.svg" type="image/svg+xml" />';

const projectLightOverrides = {
  "jvision-course-tools": `
:root {
  --ink: #10243e !important;
  --muted: #5b6f84 !important;
  --line: rgba(91, 126, 158, 0.24) !important;
  --paper: #ffffff !important;
  --soft: #edf5fb !important;
  --navy: #f4f8fc !important;
  --navy-2: #e8f1f8 !important;
  --surface: #ffffff !important;
  --surface-2: #edf6fa !important;
  --cyan: #087f8c !important;
  --pink: #c82367 !important;
}
body { color: var(--ink) !important; background: #f4f8fc !important; }
.site-header {
  color: var(--ink) !important;
  border-bottom: 1px solid var(--line) !important;
  background: rgba(255, 255, 255, 0.94) !important;
  box-shadow: 0 10px 30px rgba(31, 68, 104, 0.08) !important;
}
.site-header nav { color: var(--muted) !important; }
.hero {
  color: var(--ink) !important;
  background:
    radial-gradient(circle at 8% 4%, rgba(223, 52, 127, 0.13), transparent 34rem),
    radial-gradient(circle at 92% 18%, rgba(74, 203, 216, 0.18), transparent 32rem),
    linear-gradient(135deg, #fbfdff, #edf6fb 58%, #f9fcfe) !important;
}
.hero-text { color: var(--muted) !important; }
.secondary-button, .ghost-button {
  border-color: rgba(8, 127, 140, 0.34) !important;
  color: #075f68 !important;
  background: rgba(74, 203, 216, 0.12) !important;
}
.product-window {
  border-color: var(--line) !important;
  background: rgba(255, 255, 255, 0.97) !important;
  box-shadow: 0 28px 80px rgba(31, 68, 104, 0.16) !important;
}
.window-toolbar { background: #edf4f9 !important; }
.window-toolbar strong { color: var(--muted) !important; }
.course-preview aside, .preview-class {
  border-color: var(--line) !important;
  background: #f5f9fc !important;
}
.course-preview aside span { color: var(--muted) !important; }
.preview-class small { color: #075f68 !important; background: rgba(74, 203, 216, 0.16) !important; }
.features, .reserve, .demo-section { color: var(--ink) !important; }
.feature-card, .reserve-card, .demo-shell, .demo-panel, .contract-panel {
  border-color: var(--line) !important;
  background: #ffffff !important;
  box-shadow: 0 16px 42px rgba(31, 68, 104, 0.1) !important;
}
footer { color: var(--muted) !important; background: #ffffff !important; }
`,
  "jvision-car-cloud": `
:root {
  --ink: #10243e !important;
  --muted: #5b6f84 !important;
  --line: rgba(91, 126, 158, 0.25) !important;
  --paper: #ffffff !important;
  --soft: #edf5fb !important;
  --dark: #f4f8fc !important;
  --dark-2: #e9f2f8 !important;
  --surface: #ffffff !important;
  --surface-2: #edf5fa !important;
  --blue: #1268d6 !important;
  --green: #087f5b !important;
  --yellow: #9a6700 !important;
}
body { color: var(--ink) !important; background: #f4f8fc !important; }
.site-header {
  color: var(--ink) !important;
  border-bottom-color: var(--line) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 10px 30px rgba(31, 68, 104, 0.08) !important;
}
.site-header nav { color: var(--muted) !important; }
.hero {
  color: var(--ink) !important;
  background:
    radial-gradient(circle at 88% 15%, rgba(18, 104, 214, 0.18), transparent 28rem),
    radial-gradient(circle at 12% 8%, rgba(8, 127, 91, 0.12), transparent 30rem),
    linear-gradient(135deg, #fbfdff, #edf5fb 58%, #f8fcfa) !important;
}
.hero-overlay { background: linear-gradient(180deg, transparent, rgba(231, 241, 248, 0.65)) !important; }
.hero-lead { color: var(--muted) !important; }
.secondary-button, .workorder-actions button:first-child {
  border-color: rgba(18, 104, 214, 0.3) !important;
  color: #0d55ad !important;
  background: rgba(18, 104, 214, 0.08) !important;
}
.hero-card, .garage-shell, .garage-sidebar, .garage-panel, .garage-metric,
.module-card, .scenario-card, .contact {
  border-color: var(--line) !important;
  color: var(--ink) !important;
  background: #ffffff !important;
  box-shadow: 0 18px 48px rgba(31, 68, 104, 0.1) !important;
}
.hero-card strong { color: var(--ink) !important; }
.hero-card span { color: #0d55ad !important; }
.appointment-row, .job-row, .stock-row, .catalog-grid button, .report-grid div {
  border-color: var(--line) !important;
  color: var(--ink) !important;
  background: #f4f8fc !important;
}
.totals { color: var(--ink) !important; background: #eaf3f9 !important; }
.totals span, .demo-message { color: var(--muted) !important; }
.scenarios, footer { color: var(--muted) !important; background: #e9f2f8 !important; }
`,
};

function legacySourceCss(projectOverride = "") {
  return `${sourceStart}\n` +
  `:root { color-scheme: light !important; }\n` +
  `body {\n` +
  `  font-family: "Aptos", "Noto Sans TC", "Microsoft JhengHei", sans-serif !important;\n` +
  `  text-rendering: optimizeLegibility;\n` +
  `}\n` +
  `:is(input, select, textarea) { color: var(--ink, #10243e); background-color: #ffffff; }\n` +
  `:is(input, textarea)::placeholder { color: #8191a4; opacity: 1; }\n` +
  `:focus-visible { outline: 3px solid rgba(18, 104, 214, 0.32); outline-offset: 3px; }\n` +
  `:root { --muted: #52657a !important; }\n` +
  `:is(.eyebrow, .feature-card > span, .module-card > span) { color: #075f68 !important; }\n` +
  `.status { color: #075f58 !important; }\n` +
  `${projectOverride.trim()}\n` +
  `${sourceEnd}`;
}

function replaceGeneratedBlock(source, block) {
  const start = source.indexOf(sourceStart);
  const end = source.indexOf(sourceEnd);
  const clean = start >= 0 && end >= start
    ? `${source.slice(0, start).trimEnd()}${source.slice(end + sourceEnd.length)}`.trimEnd()
    : source.trimEnd();
  return `${clean}\n\n${block}\n`;
}

function addBodyClasses(html, classes) {
  return html.replace(/<body([^>]*)>/i, (full, attributes) => {
    const classMatch = attributes.match(/\sclass=(['"])(.*?)\1/i);
    const existing = classMatch ? classMatch[2].split(/\s+/).filter(Boolean) : [];
    const nextClasses = [...new Set([...existing, ...classes])].join(" ");
    if (classMatch) {
      const nextAttributes = attributes.replace(classMatch[0], ` class=${classMatch[1]}${nextClasses}${classMatch[1]}`);
      return `<body${nextAttributes}>`;
    }
    return `<body${attributes} class="${nextClasses}">`;
  });
}

function addThemeLink(html) {
  const withoutOldLink = html.replace(/\s*<link[^>]+href=["']\.\/bright-saas\.css[^"']*["'][^>]*\/?>/gi, "");
  const withoutOldIcon = withoutOldLink.replace(/\s*<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*\/?>/gi, "");
  return withoutOldIcon.replace(/<\/head>/i, `  ${iconLink}\n  ${themeLink}\n</head>`);
}

let generated = 0;
let legacyNext = 0;
let legacyStandalone = 0;

fs.copyFileSync(sharedLogoPath, path.join(repoRoot, "logo.png"));

for (const project of index.projects) {
  const projectDir = path.join(repoRoot, "demos", project.repoName);
  const indexPath = path.join(projectDir, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error(`Missing index.html: ${project.repoName}`);

  const isGenerated = Number(project.id) >= 1001 && Number(project.id) <= 1400;
  const isLegacyNext = project.sourceGroup === "legacy-jvision" && project.runtime === "nextjs";
  const runtimeClass = isGenerated
    ? "jvision-generated"
    : isLegacyNext
      ? "jvision-next-legacy"
      : "jvision-static-legacy";

  let html = fs.readFileSync(indexPath, "utf8");
  html = addBodyClasses(html, ["jvision-bright-saas", runtimeClass]);
  html = addThemeLink(html);
  fs.writeFileSync(indexPath, html, "utf8");
  const projectOverride = projectLightOverrides[project.repoName] || "";
  fs.writeFileSync(
    path.join(projectDir, "bright-saas.css"),
    `${sharedCss}\n${projectOverride.trim()}${projectOverride ? "\n" : ""}`,
    "utf8",
  );
  fs.writeFileSync(path.join(projectDir, "favicon.svg"), `${sharedIcon}\n`, "utf8");

  if (isGenerated) {
    const block = `${sourceStart}\n${sharedCss}\n${sourceEnd}`;
    for (const relativePath of ["styles.css", path.join("app", "globals.css")]) {
      const cssPath = path.join(projectDir, relativePath);
      const css = fs.readFileSync(cssPath, "utf8");
      fs.writeFileSync(cssPath, replaceGeneratedBlock(css, block), "utf8");
    }
    generated += 1;
  } else if (isLegacyNext) {
    const cssPath = path.join(projectDir, "src", "app", "globals.css");
    const css = fs.readFileSync(cssPath, "utf8");
    fs.writeFileSync(cssPath, replaceGeneratedBlock(css, legacySourceCss(projectOverride)), "utf8");
    legacyNext += 1;
  } else {
    legacyStandalone += 1;
  }
}

console.log(JSON.stringify({
  total: index.projects.length,
  generated,
  legacyNext,
  legacyStandalone,
}, null, 2));

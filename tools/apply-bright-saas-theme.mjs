import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8"));
const sharedCss = fs.readFileSync(path.join(repoRoot, "bright-saas.css"), "utf8").trim();
const sharedIcon = fs.readFileSync(path.join(repoRoot, "favicon.svg"), "utf8").trim();
const sourceStart = "/* JVISION_PROFESSIONAL_LIGHT_START */";
const sourceEnd = "/* JVISION_PROFESSIONAL_LIGHT_END */";
const themeLink = '<link rel="stylesheet" href="./bright-saas.css?v=professional-light-20260721" />';
const iconLink = '<link rel="icon" href="./favicon.svg" type="image/svg+xml" />';

const legacySourceCss = `${sourceStart}\n` +
  `:root { color-scheme: light !important; }\n` +
  `body {\n` +
  `  font-family: "Aptos", "Noto Sans TC", "Microsoft JhengHei", sans-serif !important;\n` +
  `  text-rendering: optimizeLegibility;\n` +
  `}\n` +
  `:is(input, select, textarea) { color: var(--ink, #10243e); background-color: #ffffff; }\n` +
  `:is(input, textarea)::placeholder { color: #8191a4; opacity: 1; }\n` +
  `:focus-visible { outline: 3px solid rgba(18, 104, 214, 0.32); outline-offset: 3px; }\n` +
  `${sourceEnd}`;

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
  fs.writeFileSync(path.join(projectDir, "bright-saas.css"), `${sharedCss}\n`, "utf8");
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
    fs.writeFileSync(cssPath, replaceGeneratedBlock(css, legacySourceCss), "utf8");
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

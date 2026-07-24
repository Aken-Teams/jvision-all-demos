import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const demosRoot = path.join(root, "demos");
const marker = "JVISION_COMPACT_STICKY_SIDEBAR";
const targetSignature = ".side-panel{position:sticky;top:22px;min-height:calc(100vh - 44px)";
const override = `

/* ${marker}_START */
/* Keep the navigation visible without stretching it to the full page height. */
@media (min-width: 1121px) {
  .system-shell > .side-panel {
    position: sticky;
    top: 18px;
    align-self: start;
    min-height: 0;
    height: fit-content;
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
  }

  .system-shell > .side-panel .ops-summary {
    margin-top: 4px;
  }
}

@media (max-width: 1120px) {
  .system-shell > .side-panel {
    max-height: none;
    overflow: visible;
  }
}
/* ${marker}_END */
`;

const rows = [];
for (const entry of fs.readdirSync(demosRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const projectRoot = path.join(demosRoot, entry.name);
  for (const relative of ["styles.css", path.join("app", "globals.css")]) {
    const file = path.join(projectRoot, relative);
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    if (!before.includes(targetSignature)) continue;
    const withoutOldOverride = before.replace(
      /\/\* JVISION_COMPACT_STICKY_SIDEBAR_START \*\/[\s\S]*?\/\* JVISION_COMPACT_STICKY_SIDEBAR_END \*\//g,
      ""
    );
    const after = `${withoutOldOverride.trimEnd()}${override}`;
    fs.writeFileSync(file, after);
    rows.push({
      repoName: entry.name,
      file: path.relative(root, file).replaceAll("\\", "/")
    });
  }
}

const projects = [...new Set(rows.map((row) => row.repoName))];
const summary = {
  generatedAt: new Date().toISOString(),
  projects: projects.length,
  files: rows.length,
  rule: "desktop sticky + content-height sidebar; responsive layouts remain in normal flow"
};
fs.writeFileSync(
  path.join(root, "docs", "COMPACT_STICKY_SIDEBAR_REPORT.json"),
  `${JSON.stringify({ summary, rows }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const marker = "JVISION_GENERATED_TITLE_LAYOUT_FIX";
const css = `

/* ${marker} */
body.jvision-generated .topbar {
  align-items: start;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 380px);
}
body.jvision-generated .topbar > div {
  min-width: 0;
}
body.jvision-generated .topbar h1 {
  max-width: 100%;
  font-size: clamp(2.25rem, 4.25vw, 4.65rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
  word-break: normal;
  text-wrap: balance;
}
body.jvision-generated .global-search {
  align-self: end;
  min-width: 0;
}
@media (max-width: 1120px) {
  body.jvision-generated .topbar {
    grid-template-columns: minmax(0, 1fr);
  }
  body.jvision-generated .topbar h1 {
    font-size: clamp(2.15rem, 7vw, 4.2rem);
  }
}
@media (max-width: 720px) {
  body.jvision-generated .topbar h1 {
    font-size: clamp(2rem, 11vw, 3rem);
    line-height: 1.12;
    letter-spacing: -0.035em;
    text-wrap: wrap;
  }
}
`;

let projects = 0;
let files = 0;
const failures = [];
for (const project of catalog.projects) {
  const directory = path.join(root, "demos", project.repoName);
  const indexFile = path.join(directory, "index.html");
  if (!fs.existsSync(indexFile) || !fs.readFileSync(indexFile, "utf8").includes("jvision-generated")) continue;
  const targets = [path.join(directory, "styles.css"), path.join(directory, "app", "globals.css")].filter(fs.existsSync);
  if (!targets.length) {
    failures.push(project.repoName);
    continue;
  }
  let changed = false;
  for (const target of targets) {
    const source = fs.readFileSync(target, "utf8");
    if (source.includes(marker)) continue;
    fs.writeFileSync(target, source.trimEnd() + css + "\n");
    files++;
    changed = true;
  }
  if (changed) projects++;
}

console.log(JSON.stringify({ projects, files, failures }, null, 2));
if (failures.length) process.exitCode = 1;

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "..");
const destinationRoot = path.join(repoRoot, "assets", "demo-screenshots");
const projects = JSON.parse(fs.readFileSync(path.join(repoRoot, "projects-index.json"), "utf8")).projects;
const auditRows = JSON.parse(fs.readFileSync(path.join(repoRoot, "docs", "FORMAL_SITE_AUDIT.json"), "utf8")).rows;

if (projects.length !== auditRows.length) throw new Error(`Catalog (${projects.length}) and audit (${auditRows.length}) counts do not match.`);
fs.mkdirSync(destinationRoot, { recursive: true });

const items = [];
for (let index = 0; index < projects.length; index += 1) {
  const project = projects[index];
  const audit = auditRows[index];
  if (project.id !== audit.id || project.repoName !== audit.repoName || !audit.screenshot) throw new Error(`Audit row ${index + 1} does not match ${project.repoName}.`);

  const sourcePath = path.join(repoRoot, audit.screenshot);
  const filename = `${String(index + 1).padStart(3, "0")}-${project.repoName}.jpg`;
  const destinationPath = path.join(destinationRoot, filename);
  if (!fs.existsSync(sourcePath)) throw new Error(`Screenshot source is missing: ${sourcePath}`);

  await sharp(sourcePath)
    .resize(720, 405, { fit: "cover", position: "top" })
    .jpeg({ quality: 72, progressive: true, mozjpeg: true })
    .toFile(destinationPath);
  items.push({ id: project.id, repoName: project.repoName, thumbnail: `assets/demo-screenshots/${filename}` });
}

fs.writeFileSync(path.join(destinationRoot, "manifest.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, items }, null, 2)}\n`);
const totalBytes = fs.readdirSync(destinationRoot).filter((file) => file.endsWith(".jpg")).reduce((total, file) => total + fs.statSync(path.join(destinationRoot, file)).size, 0);
console.log(JSON.stringify({ generated: items.length, destination: path.relative(repoRoot, destinationRoot), totalMB: Number((totalBytes / 1024 / 1024).toFixed(2)) }, null, 2));

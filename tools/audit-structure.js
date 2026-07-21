const fs = require('fs');
const path = require('path');
const index = require('../projects-index.json');
const missing = [];
for (const project of index.projects) {
  const dir = path.join(__dirname, '..', project.localPath);
  if (!fs.existsSync(dir)) missing.push(project.repoName);
}
console.log(JSON.stringify({
  total: index.projects.length,
  copied: index.projects.length - missing.length,
  missing
}, null, 2));
process.exitCode = missing.length ? 1 : 0;

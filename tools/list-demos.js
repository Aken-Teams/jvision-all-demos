const index = require('../projects-index.json');
for (const project of index.projects) {
  console.log(`${project.id}\t${project.repoName}\t${project.title || ''}`);
}

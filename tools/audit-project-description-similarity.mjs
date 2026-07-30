import fs from "node:fs";

const catalog = JSON.parse(fs.readFileSync("projects-index.json", "utf8"));
const projects = catalog.projects || [];
const threshold = 0.72;

const trigrams = (value) => {
  const text = String(value || "")
    .replace(/[A-Za-z0-9（）()／/、，。・·「」\s_-]/g, "");
  const result = new Set();
  for (let index = 0; index < text.length - 2; index += 1) {
    result.add(text.slice(index, index + 3));
  }
  return result;
};

const containment = (left, right) => {
  let shared = 0;
  for (const value of left) {
    if (right.has(value)) shared += 1;
  }
  return shared / Math.max(1, Math.min(left.size, right.size));
};

const failures = [];
for (const [category, categoryProjects] of Object.entries(Object.groupBy(projects, (project) => project.category))) {
  for (let left = 0; left < categoryProjects.length; left += 1) {
    for (let right = left + 1; right < categoryProjects.length; right += 1) {
      const first = categoryProjects[left];
      const second = categoryProjects[right];
      const firstText = String(first.description || "").replaceAll(first.title || "", "");
      const secondText = String(second.description || "").replaceAll(second.title || "", "");
      const score = containment(trigrams(firstText), trigrams(secondText));
      if (score >= threshold) {
        failures.push({
          category,
          first: first.repoName,
          second: second.repoName,
          score: Number(score.toFixed(3))
        });
      }
    }
  }
}

console.log(JSON.stringify({
  projects: projects.length,
  threshold,
  highSimilarityPairs: failures.length,
  status: failures.length ? "failed" : "passed",
  failures: failures.slice(0, 30)
}, null, 2));

if (failures.length) process.exitCode = 1;

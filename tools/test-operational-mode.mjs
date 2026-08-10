import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"projects-index.json"),"utf8"));
const runtime=fs.readFileSync(path.join(root,"shared","jvision-operational-mode.js"),"utf8");
const failures=[];
const categoryCounts=new Map();

for(const project of catalog.projects||[]){
  const file=path.join(root,project.localPath,"index.html");
  if(!fs.existsSync(file)){failures.push(`${project.repoName}: missing index`);continue}
  const html=fs.readFileSync(file,"utf8");
  const css=(html.match(/jvision-operational-mode\.css/g)||[]).length;
  const js=(html.match(/jvision-operational-mode\.js/g)||[]).length;
  const metadata=html.match(/<script type="application\/json" id="jvision-client-demo-project">([\s\S]*?)<\/script>/);
  if(css!==1||js!==1)failures.push(`${project.repoName}: assets css=${css} js=${js}`);
  if(!metadata)failures.push(`${project.repoName}: missing metadata`);
  else{
    try{const parsed=JSON.parse(metadata[1]);if(parsed.repoName!==project.repoName)failures.push(`${project.repoName}: metadata mismatch`)}
    catch{failures.push(`${project.repoName}: invalid metadata`)}
  }
  categoryCounts.set(project.category,(categoryCounts.get(project.category)||0)+1);
}

for(const category of categoryCounts.keys()){
  if(!runtime.includes(`"${category}"`))failures.push(`category missing runtime archetype: ${category}`);
}

const required=["data-create","data-search","data-filter","data-advance","data-confirm","data-export","localStorage","jv-ops-modal"];
for(const token of required)if(!runtime.includes(token))failures.push(`runtime capability missing: ${token}`);

const result={total:(catalog.projects||[]).length,categories:categoryCounts.size,failures:failures.length,passed:failures.length===0};
console.log(JSON.stringify(result,null,2));
if(failures.length){console.error(failures.slice(0,30).join("\n"));process.exitCode=1}

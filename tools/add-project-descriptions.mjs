import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const indexPath=path.join(root,"projects-index.json");
const catalog=JSON.parse(fs.readFileSync(indexPath,"utf8"));

function firstParagraph(markdown){
  const lines=markdown.replace(/^---[\s\S]*?---\s*/,"").split(/\r?\n/);
  const parts=[];
  let afterTitle=false;
  for(const raw of lines){
    const line=raw.trim();
    if(!afterTitle){if(/^#\s+/.test(line))afterTitle=true;continue}
    if(!line){if(parts.length)break;continue}
    if(/^#{1,6}\s|^[-*+]\s|^\d+\.\s|^```|^>|^!\[|^\|/.test(line)){if(parts.length)break;continue}
    parts.push(line.replace(/\[([^\]]+)\]\([^\)]+\)/g,"$1"));
  }
  return parts.join(" ").replace(/\s+/g," ").trim();
}

function fallback(project){
  const name=project.title||project.repoName.replace(/^jvision-/i,"").replace(/-/g," ");
  const category=project.category||"企業應用";
  return `${name} 是一套聚焦於${category}的操作展示，協助使用者掌握資料、任務與日常工作流程。`;
}

let extracted=0,fallbacks=0;
for(const project of catalog.projects){
  const readme=path.join(root,"demos",project.repoName,"README.md");
  const description=fs.existsSync(readme)?firstParagraph(fs.readFileSync(readme,"utf8")):"";
  if(description&&description.length>=12){project.description=description.slice(0,220);extracted++}
  else{project.description=fallback(project);fallbacks++}
}

for(const project of catalog.projects){
  if(project.repoName==="jvision-showcase-vercel")project.category="展示與內容管理";
  if(project.repoName==="jvision-temple-management")project.category="宗教與社區服務";
}

const duplicateGroups=new Map();
for(const project of catalog.projects){
  const group=duplicateGroups.get(project.description)||[];
  group.push(project);
  duplicateGroups.set(project.description,group);
}
for(const group of duplicateGroups.values()){
  if(group.length<2)continue;
  for(const project of group){
    project.description=`${project.description.replace(/[。.]$/,"")}；本案例以「${project.title}」的實際操作情境為主。`;
  }
}

catalog.generatedAt=new Date().toISOString();
fs.writeFileSync(indexPath,JSON.stringify(catalog,null,2)+"\n");
console.log(JSON.stringify({total:catalog.projects.length,extracted,fallbacks,unique:new Set(catalog.projects.map(x=>x.description)).size},null,2));

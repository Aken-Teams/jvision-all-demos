import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname,"..");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"projects-index.json"),"utf8"));
const marker="JVISION_FUNCTIONAL_MODULE_NAVIGATION";
const moduleCode=`

// ${marker}
function setupModuleNavigation() {
  const buttons = [...document.querySelectorAll(".module-nav button[data-module]")];
  const workspace = document.querySelector(".workspace");
  const topbar = workspace?.querySelector(":scope > .topbar");
  if (!buttons.length || !workspace || !topbar) return;

  const context = document.createElement("section");
  context.className = "panel module-context";
  context.setAttribute("aria-live", "polite");
  context.innerHTML = '<div class="panel-heading"><div><span>目前模組</span><h2></h2></div><b>MODULE</b></div><p></p>';
  context.style.cssText = "padding:20px 24px;min-width:0";
  topbar.insertAdjacentElement("afterend", context);

  const kpis = workspace.querySelector(":scope > .kpi-grid");
  const grids = workspace.querySelectorAll(":scope > .control-grid");
  const upper = grids[0];
  const lower = grids[1];
  const mainFlow = upper?.querySelector(".main-flow");
  const aiPanel = upper?.querySelector(".ai-panel");
  const formPanel = lower?.querySelector(".form-panel");
  const recordsPanel = lower?.querySelector(".records-panel");
  const logPanel = workspace.querySelector(":scope > .log-panel");
  const descriptions = [
    "集中查看關鍵指標、流程進度、案件資料與最新操作紀錄。",
    "集中檢視案件清單、處理狀態、負責人與待完成工作。",
    "維護系統所需的基本資料，並建立新的工作項目與分類。",
    "查看 AI 風險分析、決策建議與需要優先處理的異常。",
  ];

  const show = (element, visible) => {
    if (!element) return;
    element.hidden = !visible;
    element.style.display = visible ? "" : "none";
  };
  function activate(index, shouldFocus = false) {
    const selected = Math.max(0, Math.min(buttons.length - 1, index));
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    show(kpis, selected === 0 || selected === 3);
    show(upper, selected === 0 || selected === 3);
    show(lower, selected === 0 || selected === 1 || selected === 2);
    show(mainFlow, selected === 0);
    show(aiPanel, selected === 0 || selected === 3);
    show(formPanel, selected === 0 || selected === 2);
    show(recordsPanel, selected === 0 || selected === 1);
    show(logPanel, true);
    if (upper) upper.style.gridTemplateColumns = selected === 3 ? "minmax(0,1fr)" : "";
    if (lower) lower.style.gridTemplateColumns = selected === 1 || selected === 2 ? "minmax(0,1fr)" : "";

    const label = buttons[selected].dataset.module || buttons[selected].textContent.trim();
    context.querySelector("h2").textContent = label;
    context.querySelector("p").textContent = descriptions[selected] || "查看此模組的工作內容與即時狀態。";
    document.body.dataset.activeModuleIndex = String(selected);
    document.body.dataset.activeModule = label;
    history.replaceState(null, "", \`#module-\${selected + 1}\`);
    document.dispatchEvent(new CustomEvent("jvision:module-change", { detail: { index: selected, module: label } }));
    if (shouldFocus && matchMedia("(max-width: 1120px)").matches) context.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => activate(index, true)));
  const initial = Number(location.hash.match(/^#module-(\\d+)$/)?.[1] || 1) - 1;
  activate(initial);
}

setupModuleNavigation();
`;

let projects=0;
let files=0;
let removed=0;
let migrated=0;
let cacheBusted=0;
const failures=[];
for(const project of catalog.projects){
  const projectDir=path.join(root,"demos",project.repoName);
  const targets=[path.join(projectDir,"app.js"),path.join(projectDir,"public","demo-app.js")].filter(fs.existsSync);
  if(!targets.length)continue;
  const indexFile=path.join(projectDir,"index.html");
  const hasModuleNavigation=fs.existsSync(indexFile)&&fs.readFileSync(indexFile,"utf8").includes("data-module=");
  if(!hasModuleNavigation){
    for(const target of targets){
      const source=fs.readFileSync(target,"utf8");
      if(source.includes(marker)){fs.writeFileSync(target,source.replace(moduleCode,""));removed++}
    }
    continue;
  }
  const staticIndex=path.join(projectDir,"index.html");
  const staticSource=fs.readFileSync(staticIndex,"utf8");
  const staticUpdated=staticSource.replace(/app\.js\?v=[^"']+/g,"app.js?v=functional-modules-20260722");
  if(staticUpdated!==staticSource){fs.writeFileSync(staticIndex,staticUpdated);cacheBusted++}
  const nextPage=path.join(projectDir,"app","page.js");
  if(fs.existsSync(nextPage)){
    const pageSource=fs.readFileSync(nextPage,"utf8");
    const pageUpdated=pageSource.replace(/src="\.\/demo-app\.js(?:\?[^\"]*)?"/,'src="./demo-app.js?v=functional-modules-20260722"');
    if(pageUpdated!==pageSource){fs.writeFileSync(nextPage,pageUpdated);cacheBusted++}
  }
  let changed=false;
  for(const target of targets){
    let source=fs.readFileSync(target,"utf8");
    if(source.includes(marker)){
      const oldShow='  const show = (element, visible) => { if (element) element.hidden = !visible; };';
      const newShow='  const show = (element, visible) => {\n    if (!element) return;\n    element.hidden = !visible;\n    element.style.display = visible ? "" : "none";\n  };';
      const updated=source.replace(oldShow,newShow);
      if(updated!==source){fs.writeFileSync(target,updated);migrated++}
      continue;
    }
    const insertion=source.lastIndexOf("render();");
    if(insertion<0){failures.push(path.relative(root,target));continue}
    fs.writeFileSync(target,source.slice(0,insertion)+moduleCode+source.slice(insertion));
    files++;
    changed=true;
  }
  if(changed)projects++;
}

console.log(JSON.stringify({projects,files,removed,migrated,cacheBusted,failures},null,2));
if(failures.length)process.exitCode=1;

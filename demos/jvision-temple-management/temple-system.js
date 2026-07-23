const devotees=[
  {id:"T-02418",name:"林雅婷",phone:"0912-168-388",area:"北區",service:"光明燈、中元普渡",contact:"今天 09:42"},
  {id:"T-02417",name:"陳志明",phone:"0988-520-131",area:"中區",service:"太歲燈",contact:"昨天 16:20"},
  {id:"T-02416",name:"王秀蘭",phone:"0933-779-221",area:"南區",service:"建廟基金",contact:"07/21 11:05"},
  {id:"T-02415",name:"張家豪",phone:"0921-455-806",area:"北區",service:"文昌燈、祈安法會",contact:"07/19 14:32"},
  {id:"T-02414",name:"李淑芬",phone:"0975-208-413",area:"中區",service:"中元普渡",contact:"07/18 10:16"}
];
const donations=[
  {date:"07/23",name:"林雅婷",purpose:"光明燈",amount:1200,status:"已開立"},
  {date:"07/23",name:"陳志明",purpose:"中元普渡",amount:3600,status:"待開立"},
  {date:"07/23",name:"王秀蘭",purpose:"建廟基金",amount:10000,status:"已開立"},
  {date:"07/22",name:"張家豪",purpose:"一般捐獻",amount:2000,status:"待開立"}
];
const ceremonies=[
  {date:"07/28",title:"中元普渡法會",desc:"超薦祖先、冤親債主與地基主，提供個人及闔家報名。",signed:86,capacity:120,status:"報名中"},
  {date:"08/03",title:"祈安禮斗法會",desc:"為信眾消災解厄、延壽植福，登記斗首與祈福名單。",signed:42,capacity:80,status:"報名中"},
  {date:"08/15",title:"觀音佛祖成道紀念",desc:"祝壽誦經、供花供果與平安餐，開放志工登記。",signed:55,capacity:60,status:"即將額滿"}
];
const titles={
  dashboard:["今日廟務總覽","掌握信眾服務、點燈、法會與捐獻進度"],
  devotees:["信徒名冊","查詢與維護信徒及家庭聯絡資料"],
  lamps:["點燈事宜","辦理燈種登記、祈福資料與安燈進度"],
  ceremonies:["法會與活動","管理報名、供品、繳費及現場報到"],
  donations:["捐獻與收據","記錄功德金用途並追蹤收據開立狀態"]
};
const $=selector=>document.querySelector(selector);
const money=value=>`NT$ ${value.toLocaleString("zh-TW")}`;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400)}
function switchView(id){
  document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===id));
  document.querySelectorAll(".module-nav button").forEach(button=>button.classList.toggle("active",button.dataset.view===id));
  $("#pageTitle").textContent=titles[id][0];$("#pageSubtitle").textContent=titles[id][1];window.scrollTo({top:0,behavior:"smooth"});
}
function renderQueue(){
  $("#serviceQueue").innerHTML=devotees.slice(0,4).map((row,index)=>`<div class="queue-row"><span class="avatar">${row.name.slice(-1)}</span><div><strong>${row.name}</strong><span>${row.service}</span></div><span class="tag">${index<2?"辦理中":"已完成"}</span></div>`).join("");
}
function renderDevotees(){
  const query=$("#devoteeSearch").value.trim().toLowerCase(),area=$("#areaFilter").value;
  const rows=devotees.filter(row=>(!query||[row.id,row.name,row.phone].join(" ").toLowerCase().includes(query))&&(!area||row.area===area));
  $("#devoteeRows").innerHTML=rows.map(row=>`<tr><td>${row.id}</td><td><strong>${row.name}</strong></td><td>${row.phone}</td><td>${row.area}</td><td>${row.service}</td><td>${row.contact}</td><td><button class="table-action" data-detail="${row.id}">查看</button></td></tr>`).join("")||`<tr><td colspan="7">沒有符合的信徒資料</td></tr>`;
  $("#lampDevotee").innerHTML=devotees.map(row=>`<option value="${row.id}">${row.name}（${row.id}）</option>`).join("");
  $("#blessingName").value=devotees[0]?.name||"";
}
function renderCeremonies(){
  $("#ceremonyCards").innerHTML=ceremonies.map((item,index)=>`<article class="panel ceremony-card"><div class="ceremony-date"><strong>${item.date}</strong> · ${item.status}</div><div class="ceremony-body"><h3>${item.title}</h3><p>${item.desc}</p><div class="ceremony-meta"><span>已報名 ${item.signed} 人</span><b>名額 ${item.capacity} 人</b></div><button class="primary" data-ceremony="${index}">登記報名</button></div></article>`).join("");
}
function renderDonations(){
  $("#donationRows").innerHTML=donations.map((row,index)=>`<tr><td>${row.date}</td><td>${row.name}</td><td>${row.purpose}</td><td><strong>${money(row.amount)}</strong></td><td><span class="status">${row.status}</span></td><td>${row.status==="待開立"?`<button class="table-action" data-receipt="${index}">開立收據</button>`:"<span>已完成</span>"}</td></tr>`).join("");
  $("#receiptPending").textContent=donations.filter(row=>row.status==="待開立").length;
}
document.querySelectorAll(".module-nav button").forEach(button=>button.addEventListener("click",()=>switchView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>switchView(button.dataset.go)));
document.querySelectorAll("[data-open-devotee],#quickRegister").forEach(button=>button.addEventListener("click",()=>$("#devoteeDialog").showModal()));
$("#devoteeSearch").addEventListener("input",renderDevotees);$("#areaFilter").addEventListener("change",renderDevotees);
$("#devoteeForm").addEventListener("submit",event=>{
  const submitter=event.submitter;if(submitter?.value==="cancel")return;
  event.preventDefault();const data=new FormData(event.currentTarget);
  devotees.unshift({id:`T-${String(2419+devotees.length).padStart(5,"0")}`,name:data.get("name"),phone:data.get("phone"),area:data.get("area"),service:"尚無紀錄",contact:"剛剛"});
  event.currentTarget.reset();$("#devoteeDialog").close();renderQueue();renderDevotees();toast("信徒資料已建立");
});
$("#lampType").addEventListener("change",event=>{$("#lampFee").textContent=money({光明燈:1200,太歲燈:1000,文昌燈:800,財利燈:1600,姻緣燈:1200}[event.target.value])});
$("#lampDevotee").addEventListener("change",event=>{$("#blessingName").value=devotees.find(row=>row.id===event.target.value)?.name||""});
$("#lampForm").addEventListener("submit",event=>{event.preventDefault();const name=$("#blessingName").value,type=$("#lampType").value;$("#latestLamp").innerHTML=`<strong>${name}</strong><br>${type} · ${$("#lampWish").value||"祈求平安順遂"}<br><span class="status">繳費單已產生</span>`;$("#lampTotal").textContent=Number($("#lampTotal").textContent)+1;toast(`${name} 的${type}已完成登記`)});
$("#ceremonyCards").addEventListener("click",event=>{const button=event.target.closest("[data-ceremony]");if(!button)return;const item=ceremonies[Number(button.dataset.ceremony)];item.signed+=1;renderCeremonies();toast(`${item.title}報名已登記`)});
$("#donationRows").addEventListener("click",event=>{const button=event.target.closest("[data-receipt]");if(!button)return;donations[Number(button.dataset.receipt)].status="已開立";renderDonations();toast("電子收據已開立並存入紀錄")});
$("#newDonation").addEventListener("click",()=>{donations.unshift({date:"07/23",name:"新增善信",purpose:"一般捐獻",amount:1000,status:"待開立"});renderDonations();toast("已新增一筆捐獻草稿")});
$("#devoteeRows").addEventListener("click",event=>{const button=event.target.closest("[data-detail]");if(button)toast(`${button.dataset.detail}：已載入信徒服務紀錄`)});
renderQueue();renderDevotees();renderCeremonies();renderDonations();

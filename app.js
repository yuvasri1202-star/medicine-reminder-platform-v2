const $ = (id) => document.getElementById(id);
const DB_KEY = "medicare_demo_v1";
const TODAY = new Date().toISOString().slice(0,10);
let data = loadData();
let toastTimer;
function loadData(){
  try { const saved = JSON.parse(localStorage.getItem(DB_KEY)); if(saved) return saved; } catch(e){}
  return {medicines:[], logs:{}, caregiver:{name:"",email:"",phone:""}, settings:{escalation:true,refill:true}};
}
function save(){ localStorage.setItem(DB_KEY, JSON.stringify(data)); renderAll(); }
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),3000);}
function fmtTime(t){if(!t)return "09:00";const [h,m]=t.split(":").map(Number);return `${((h+11)%12)+1}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;}
function keyFor(date,id){return `${date}_${id}`;}
function doseStatus(date,med){return data.logs[keyFor(date,med.id)]?.status||"pending";}
function allDoses(date=TODAY){return data.medicines.map(m=>({med:m,status:doseStatus(date,m),date})).sort((a,b)=>a.med.time.localeCompare(b.med.time));}
function statusTag(s){return `<span class="status ${s}">${s==="pending"?"Upcoming":s[0].toUpperCase()+s.slice(1)}</span>`;}
function daysLeft(m){const daily=Number(m.dailyUse)||1;return daily>0?Math.floor(Number(m.stock)/daily):null;}
function renderAll(){renderDashboard();renderMedicines();renderSchedule();renderReports();renderCaregiver();}
function renderDashboard(){
 const doses=allDoses();const taken=doses.filter(x=>x.status==="taken"||x.status==="late").length;const low=data.medicines.filter(m=>Number(m.stock)<=Number(m.threshold)).length;
 const recorded=Object.values(data.logs).filter(x=>x.status!=="pending");const ontime=recorded.filter(x=>x.status==="taken").length;
 $("statDoses").textContent=doses.length;$("statTaken").textContent=taken;$("statLow").textContent=low;$("statScore").textContent=recorded.length?Math.round(ontime/recorded.length*100)+"%":"—";
 const list=$("todayList");
 if(!doses.length)list.innerHTML='<div class="empty">No medicines yet. Add a medicine to create your schedule.</div>';
 else list.innerHTML=doses.slice(0,5).map(({med,status})=>`<div class="dose-item"><span class="time">${fmtTime(med.time)}</span><div class="dose-info"><strong>${escapeHTML(med.name)}</strong><small>${escapeHTML(med.dosage||"As prescribed")} · ${escapeHTML(med.frequency)}</small></div>${statusTag(status)}${status==="pending"?`<button class="mini-btn" data-mark="taken" data-id="${med.id}">Taken</button>`:""}</div>`).join("");
 const refills=$("refillList");const meds=[...data.medicines].sort((a,b)=>daysLeft(a)-daysLeft(b)).slice(0,5);
 if(!meds.length)refills.innerHTML='<div class="empty">Your refill estimates will appear here.</div>';
 else refills.innerHTML=meds.map(m=>{let d=daysLeft(m),low=Number(m.stock)<=Number(m.threshold);return `<div class="refill-item"><div class="stat-icon ${low?"orange":"green"}">▣</div><div class="refill-info"><strong>${escapeHTML(m.name)}</strong><small>${m.stock} units · ${d===0?"May run out today":`Estimated ${d} day${d===1?"":"s"} left`}</small><div class="stock-bar"><span class="${low?"low":""}" style="width:${Math.min(100,Math.max(4,Number(m.stock)/Math.max(1,Number(m.stock)+10)*100))}%"></span></div></div>${low?'<span class="status pending">Low stock</span>':""}</div>`}).join("");
 if(data.settings.escalation){const repeated=Object.values(data.logs).filter(x=>x.status==="missed").length;if(repeated>=2)$("todayList").insertAdjacentHTML("beforeend",'<div class="notice">Smart escalation: repeated missed doses are recorded. Check your caregiver alert settings.</div>');}
}
function renderMedicines(){
 const root=$("medicineTable");
 if(!data.medicines.length){root.innerHTML='<div class="empty">No medicines added yet.<br><br><button class="primary" id="emptyAdd">＋ Add your first medicine</button></div>';const b=$("emptyAdd");if(b)b.onclick=openAdd;return;}
 root.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Medicine</th><th>Dosage</th><th>Schedule</th><th>Stock</th><th>Estimated run-out</th><th>Actions</th></tr></thead><tbody>${data.medicines.map(m=>`<tr><td><strong>${escapeHTML(m.name)}</strong><br><small>${escapeHTML(m.frequency)}</small></td><td>${escapeHTML(m.dosage||"—")}</td><td>${fmtTime(m.time)}</td><td>${m.stock} units ${Number(m.stock)<=Number(m.threshold)?'<span class="status pending">Low</span>':""}</td><td>${daysLeft(m)} day(s)</td><td><div class="table-actions"><button class="mini-btn" data-edit="${m.id}">Edit</button><button class="mini-btn" data-delete="${m.id}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
function renderSchedule(){
 const root=$("scheduleList"),doses=allDoses();
 if(!doses.length){root.innerHTML='<div class="empty">Add a medicine to see scheduled doses here.</div>';return;}
 root.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Time</th><th>Medicine</th><th>Dosage</th><th>Status</th><th>Update status</th></tr></thead><tbody>${doses.map(({med,status})=>`<tr><td>${fmtTime(med.time)}</td><td><strong>${escapeHTML(med.name)}</strong></td><td>${escapeHTML(med.dosage||"—")}</td><td>${statusTag(status)}</td><td><div class="table-actions"><button class="mini-btn" data-mark="taken" data-id="${med.id}">Taken</button><button class="mini-btn" data-mark="late" data-id="${med.id}">Late</button><button class="mini-btn" data-mark="missed" data-id="${med.id}">Missed</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
function renderReports(){
 const logs=Object.entries(data.logs).map(([key,v])=>({...v,key}));const rec=logs.filter(x=>x.status!=="pending");const taken=rec.filter(x=>x.status==="taken").length,missed=rec.filter(x=>x.status==="missed").length,score=rec.length?Math.round(taken/rec.length*100):null;
 $("reportTotal").textContent=rec.length;$("reportTaken").textContent=taken;$("reportMissed").textContent=missed;$("reportScore").textContent=score===null?"—":score+"%";
 const root=$("historyList");if(!rec.length){root.innerHTML='<div class="empty">No dose history yet. Update a dose in Dose Schedule to start your report.</div>';return;}
 root.innerHTML=rec.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,20).map(x=>`<div class="history-row"><div><strong>${escapeHTML(x.name)}</strong><small>${escapeHTML(x.date)} · ${escapeHTML(x.time)}</small></div>${statusTag(x.status)}</div>`).join("");
}
function renderCaregiver(){
 $("careName").value=data.caregiver.name||"";$("careEmail").value=data.caregiver.email||"";$("carePhone").value=data.caregiver.phone||"";
 $("escalationToggle").checked=!!data.settings.escalation;$("refillToggle").checked=!!data.settings.refill;
 $("caregiverStatus").textContent=data.caregiver.name?`Caregiver saved: ${data.caregiver.name}. Alerts are shown in this demo; real email/SMS delivery needs a connected service.`:"No caregiver configured yet. Add a trusted contact to set up the demo.";
}
function openAdd(){ $("medicineForm").reset();$("medicineId").value="";$("dialogTitle").textContent="Add medicine";$("medTime").value="09:00";$("medStock").value=30;$("medDailyUse").value=1;$("medThreshold").value=5;$("medStart").value=TODAY;$("medicineDialog").showModal();}
function openEdit(id){const m=data.medicines.find(x=>x.id===id);if(!m)return;$("medicineId").value=m.id;$("dialogTitle").textContent="Edit medicine";$("medName").value=m.name;$("medDosage").value=m.dosage;$("medTime").value=m.time;$("medFrequency").value=m.frequency;$("medStock").value=m.stock;$("medDailyUse").value=m.dailyUse;$("medThreshold").value=m.threshold;$("medStart").value=m.start||TODAY;$("medicineDialog").showModal();}
function markDose(id,status){const med=data.medicines.find(m=>m.id===id);if(!med)return;const k=keyFor(TODAY,id);data.logs[k]={status,name:med.name,date:TODAY,time:fmtTime(med.time),updatedAt:new Date().toISOString()};if(status==="taken"||status==="late"){med.stock=Math.max(0,Number(med.stock)-1);}save();toast(`${med.name} marked as ${status}.`);if(status==="missed"&&data.settings.escalation&&Object.values(data.logs).filter(x=>x.status==="missed").length>=2){toast("Smart escalation condition met. Check caregiver settings.");}}
function navigate(view){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const titles={dashboard:["Good day! 👋","Here is your medicine overview for today."],medicines:["My medicines","Manage your medicine details and stock."],schedule:["Dose schedule","Keep track of today's doses."],reports:["Adherence report","Review your recorded dose history."],caregiver:["Caregiver & alerts","Manage trusted contacts and alert preferences."]};$("pageTitle").textContent=titles[view][0];$("pageSubtitle").textContent=titles[view][1];}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("viewSchedule").addEventListener("click",()=>navigate("schedule"));$("addTop").addEventListener("click",openAdd);$("addMedicineBtn").addEventListener("click",openAdd);
$("closeDialog").addEventListener("click",()=>$("medicineDialog").close());$("cancelDialog").addEventListener("click",()=>$("medicineDialog").close());
$("medicineForm").addEventListener("submit",e=>{e.preventDefault();const id=$("medicineId").value||String(Date.now());const existing=data.medicines.find(m=>m.id===id);const m={id,name:$("medName").value.trim(),dosage:$("medDosage").value.trim(),time:$("medTime").value,frequency:$("medFrequency").value,stock:Number($("medStock").value),dailyUse:Number($("medDailyUse").value),threshold:Number($("medThreshold").value),start:$("medStart").value};if(existing){Object.assign(existing,m);}else{data.medicines.push(m);}save();$("medicineDialog").close();toast(existing?"Medicine updated.":"Medicine added to your schedule.");});
document.addEventListener("click",e=>{const mark=e.target.closest("[data-mark]");if(mark){markDose(mark.dataset.id,mark.dataset.mark);return;}const edit=e.target.closest("[data-edit]");if(edit){openEdit(edit.dataset.edit);return;}const del=e.target.closest("[data-delete]");if(del&&confirm("Delete this medicine and its details?")){data.medicines=data.medicines.filter(m=>m.id!==del.dataset.delete);save();toast("Medicine deleted.");}});
$("caregiverForm").addEventListener("submit",e=>{e.preventDefault();data.caregiver={name:$("careName").value.trim(),email:$("careEmail").value.trim(),phone:$("carePhone").value.trim()};save();toast("Caregiver details saved in this browser.");});
$("escalationToggle").addEventListener("change",e=>{data.settings.escalation=e.target.checked;save();toast("Escalation setting updated.");});
$("refillToggle").addEventListener("change",e=>{data.settings.refill=e.target.checked;save();toast("Refill reminder setting updated.");});
$("enableNotifications").addEventListener("click",async()=>{if(!("Notification" in window)){toast("This browser does not support notifications.");return;}const result=await Notification.requestPermission();toast(result==="granted"?"Browser notification permission enabled. Demo reminders are not scheduled in the background.":"Notification permission was not granted.");if(result==="granted")new Notification("MediCare notifications enabled",{body:"You can receive supported browser notifications from this website."});});
$("todayDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"});
renderAll();

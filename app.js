const $=id=>document.getElementById(id);
const KEY="turnoFacil_v1";
const emptyState={name:"compañero",rate:0,shifts:[],active:null,tips:[]};
let state={...emptyState,...JSON.parse(localStorage.getItem(KEY)||"{}")};
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function money(n){return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(n||0)}
function dateKey(d){return new Date(d).toLocaleDateString("sv-SE")}
function duration(ms){let s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return [h,m,sec].map(x=>String(x).padStart(2,"0")).join(":")}
function shiftHours(shift){return Math.max(0,(shift.end-shift.start-(shift.breakMinutes||0)*60000)/3600000)}
function currentMonth(){let now=new Date();return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")}
function render(){
  $("userName").textContent=state.name||"compañero";
  $("nameInput").value=state.name==="compañero"?"":state.name;
  $("rateInput").value=state.rate||"";
  const shifts=state.shifts.filter(s=>new Date(s.start).toISOString().slice(0,7)===currentMonth());
  const hours=shifts.reduce((a,s)=>a+shiftHours(s),0);
  $("monthHours").textContent=hours.toFixed(1).replace(".",",")+" h";
  $("monthPay").textContent=money(hours*Number(state.rate||0));
  const tips=state.tips.filter(t=>t.date.slice(0,7)===currentMonth()).reduce((a,t)=>a+t.amount,0);
  $("monthTips").textContent=money(tips);
  $("startBtn").disabled=!!state.active;$("stopBtn").disabled=!state.active;
  $("statusDot").classList.toggle("on",!!state.active);
  $("shiftStatus").textContent=state.active?"Jornada iniciada a las "+new Date(state.active.start).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}):"Todavía no has iniciado tu jornada.";
  if(!state.active)$("timer").textContent="00:00:00";
  $("history").innerHTML="";
  const recent=[...state.shifts].sort((a,b)=>b.start-a.start).slice(0,7);
  if(!recent.length){$("history").innerHTML='<p class="empty">Todavía no hay jornadas guardadas.</p>';return}
  recent.forEach(s=>{const row=document.createElement("div");row.className="history-row";const left=document.createElement("div");const right=document.createElement("strong");const d=new Date(s.start);left.innerHTML=`<b>${d.toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"})}</b><small>${d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})} – ${new Date(s.end).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</small>`;right.textContent=shiftHours(s).toFixed(2).replace(".",",")+" h";row.append(left,right);$("history").append(row)});
}
$("startBtn").addEventListener("click",()=>{state.active={start:Date.now()};save()});
$("stopBtn").addEventListener("click",()=>{if(!state.active)return;const end=Date.now();state.shifts.push({start:state.active.start,end,breakMinutes:0});state.active=null;save()});
$("tipsForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("tipsInput").value);if(!Number.isFinite(amount)||amount<0)return;state.tips.push({date:dateKey(new Date()),amount});$("tipsInput").value="";save()});
$("profileForm").addEventListener("submit",e=>{e.preventDefault();state.name=$("nameInput").value.trim()||"compañero";state.rate=Math.max(0,Number($("rateInput").value)||0);save();alert("Tus datos se han guardado.")});
$("settingsBtn").addEventListener("click",()=>$("settingsDialog").showModal());
setInterval(()=>{if(state.active)$("timer").textContent=duration(Date.now()-state.active.start)},1000);
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
$("todayLabel").textContent=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
render();
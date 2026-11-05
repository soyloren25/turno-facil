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
// ======================================
// TURNO FACIL 2.0 - NUEVAS FUNCIONES
// ======================================

// 1. CALCULADORA DE SUELDO
document.getElementById("salaryCalculate").addEventListener("click", () => {
  const base = Number(document.getElementById("salaryBase").value);
  const hours = Number(document.getElementById("salaryExtraHours").value);
  const rate = Number(document.getElementById("salaryExtraRate").value);

  if (base < 0 || hours < 0 || rate < 0 ||
      !Number.isFinite(base + hours + rate)) {
    alert("Introduce cantidades válidas.");
    return;
  }

  const extras = hours * rate;
  const total = base + extras;

  document.getElementById("salaryResult").textContent =
    "Sueldo base: " + money(base) +
    " | Horas extras: " + money(extras) +
    " | Total bruto estimado: " + money(total);
});

// 2. CALENDARIO DE TURNOS
const calendarKey = "turnoFacil_calendar";
let calendarData = JSON.parse(localStorage.getItem(calendarKey) || "[]");

function renderCalendar() {
  const list = document.getElementById("calendarList");
  list.replaceChildren();

  calendarData.sort((a, b) => a.date.localeCompare(b.date));

  if (!calendarData.length) {
    list.textContent = "Todavía no hay turnos guardados.";
    return;
  }

  calendarData.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-row";

    const info = document.createElement("span");
    info.textContent = item.date + " · " + item.type +
      (item.type === "Descanso" || item.type === "Vacaciones"
        ? "" : " · " + item.start + "–" + item.end);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Eliminar";
    remove.className = "secondary";

    remove.addEventListener("click", () => {
      calendarData.splice(index, 1);
      localStorage.setItem(calendarKey, JSON.stringify(calendarData));
      renderCalendar();
    });

    row.append(info, remove);
    list.append(row);
  });
}

document.getElementById("calendarDate").value =
  new Date().toLocaleDateString("sv-SE");

document.getElementById("calendarForm").addEventListener("submit", event => {
  event.preventDefault();

  const item = {
    date: document.getElementById("calendarDate").value,
    type: document.getElementById("calendarType").value,
    start: document.getElementById("calendarStart").value,
    end: document.getElementById("calendarEnd").value
  };

  if (!item.date) return;

  calendarData = calendarData.filter(x => x.date !== item.date);
  calendarData.push(item);

  localStorage.setItem(calendarKey, JSON.stringify(calendarData));
  renderCalendar();
  alert("¡Turno guardado!");
});

// 3. REPARTO DE PROPINAS
document.getElementById("splitTipsCalculate").addEventListener("click", () => {
  const total = Number(document.getElementById("splitTipsTotal").value);
  const people = Number(document.getElementById("splitTipsPeople").value);
  const result = document.getElementById("splitTipsResult");

  if (!Number.isFinite(total) || total < 0 ||
      !Number.isInteger(people) || people < 1) {
    alert("Introduce un importe y un número de trabajadores válidos.");
    return;
  }

  const cents = Math.round(total * 100);
  const base = Math.floor(cents / people);
  const remainder = cents % people;

  result.replaceChildren();

  for (let i = 0; i < people; i++) {
    const line = document.createElement("p");
    const amount = (base + (i < remainder ? 1 : 0)) / 100;
    line.textContent = "Trabajador " + (i + 1) + ": " + money(amount);
    result.append(line);
  }

  const share = document.createElement("button");
  share.type = "button";
  share.className = "secondary";
  share.textContent = "Compartir reparto";

  share.addEventListener("click", async () => {
    const text = Array.from(result.querySelectorAll("p"))
      .map(p => p.textContent).join("\n");

    if (navigator.share) {
      await navigator.share({ title: "Turno Fácil - Propinas", text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert("Reparto copiado.");
    } else {
      alert(text);
    }
  });

  result.append(share);
});

// Mostrar turnos guardados
renderCalendar();

console.log("Turno Fácil 2.0: nuevas funciones cargadas.");

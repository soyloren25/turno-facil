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
// MODO OSCURO
const themeToggle = $("themeToggle");

if (localStorage.getItem("turnoFacil_theme") === "dark") {
  document.body.classList.add("dark-mode");
}

function updateThemeButton() {
  themeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Activar modo claro"
    : "🌙 Activar modo oscuro";
}

updateThemeButton();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const dark = document.body.classList.contains("dark-mode");

  localStorage.setItem("turnoFacil_theme", dark ? "dark" : "light");

  updateThemeButton();
  $("settingsDialog").close();
});
// SELECTOR DE ESTILO
const styleSelect = $("styleSelect");

if (localStorage.getItem("turnoFacil_style") === "professional") {
  document.body.classList.add("professional-theme");
  styleSelect.value = "professional";
}

styleSelect.addEventListener("change", () => {
  const professional = styleSelect.value === "professional";
  document.body.classList.toggle("professional-theme", professional);
  localStorage.setItem("turnoFacil_style", professional ? "professional" : "classic");
});
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
// 4. COPIA DE SEGURIDAD Y RESTAURACIÓN
document.getElementById("backupExport").addEventListener("click", () => {
  const backup = {
    app: "Turno Fácil",
    version: 1,
    createdAt: new Date().toISOString(),
    state: { ...emptyState, ...JSON.parse(localStorage.getItem(KEY) || "{}") },
    calendar: Array.isArray(JSON.parse(localStorage.getItem(calendarKey) || "[]"))
  ? JSON.parse(localStorage.getItem(calendarKey) || "[]")
  : []
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "turno-facil-copia-" + dateKey(new Date()) + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  document.getElementById("backupMessage").textContent =
    "Copia descargada. Guárdala en un lugar seguro.";
});

document.getElementById("backupImport").addEventListener("change", async event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());

    const validState = backup &&
      backup.app === "Turno Fácil" &&
      backup.version === 1 &&
      backup.state &&
      Array.isArray(backup.state.shifts) &&
      Array.isArray(backup.state.tips) &&
      Array.isArray(backup.calendar);

    if (!validState) {
      throw new Error("El archivo no parece una copia válida de Turno Fácil.");
    }

    if (!confirm("Restaurar esta copia sustituirá los datos actuales de Turno Fácil en este navegador. ¿Continuar?")) {
      event.target.value = "";
      return;
    }

    localStorage.setItem(KEY, JSON.stringify({
      ...emptyState,
      ...backup.state
    }));

    localStorage.setItem(calendarKey, JSON.stringify(backup.calendar));

    alert("Copia restaurada. Turno Fácil se va a actualizar.");
    location.reload();

  } catch (error) {
    alert(error.message || "No se pudo leer la copia de seguridad.");
    event.target.value = "";
  }
});

// ===== COPIA AUTOMÁTICA EN GOOGLE DRIVE =====

const GOOGLE_CLIENT_ID = "918875459904-9h2kdjiqu8g527266vo3o8h684utsqis.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FILENAME = "turno-facil-auto-backup.json";

let driveToken = null;
let driveFileId = null;
let driveLastSnapshot = "";
let driveSyncTimer = null;

function createDriveBackup() {
  let savedState = {};
  let savedCalendar = [];

  try {
    savedState = {
      ...emptyState,
      ...JSON.parse(localStorage.getItem(KEY) || "{}")
    };

    const calendar = JSON.parse(
      localStorage.getItem(calendarKey) || "[]"
    );

    savedCalendar = Array.isArray(calendar) ? calendar : [];
  } catch (error) {
    console.error("Error preparando la copia:", error);
  }

  return {
    app: "Turno Fácil",
    version: 1,
    createdAt: new Date().toISOString(),
    state: savedState,
    calendar: savedCalendar
  };
}

async function uploadDriveBackup() {
  if (!driveToken) return;

  try {
    const backup = createDriveBackup();
    const snapshot = JSON.stringify(backup);

    if (snapshot === driveLastSnapshot) return;

    let response;

    if (driveFileId) {
      response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files/" +
        driveFileId +
        "?uploadType=media",
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer " + driveToken,
            "Content-Type": "application/json"
          },
          body: snapshot
        }
      );
    } else {
      const boundary = "turnofacil_" + Date.now();

      const body =
        "--" + boundary + "\r\n" +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify({
          name: DRIVE_FILENAME,
          mimeType: "application/json"
        }) +
        "\r\n--" + boundary + "\r\n" +
        "Content-Type: application/json\r\n\r\n" +
        snapshot +
        "\r\n--" + boundary + "--";

      response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + driveToken,
            "Content-Type": "multipart/related; boundary=" + boundary
          },
          body
        }
      );
    }

    if (!response.ok) {
      throw new Error("Google Drive respondió con error " + response.status);
    }

    const result = await response.json();

    if (result.id) driveFileId = result.id;

    driveLastSnapshot = snapshot;

    $("googleStatus").textContent =
      "✅ Copia guardada automáticamente en Google Drive.";
  } catch (error) {
    console.error(error);
    $("googleStatus").textContent =
      "No se pudo guardar. Comprueba la conexión y vuelve a conectar Google Drive.";
  }
}

function startDriveSync() {
  if (driveSyncTimer) clearInterval(driveSyncTimer);

  driveLastSnapshot = "";
  uploadDriveBackup();

  driveSyncTimer = setInterval(() => {
    uploadDriveBackup();
  }, 5000);
}

$("googleConnect").addEventListener("click", () => {
  if (!window.google?.accounts?.oauth2) {
    $("googleStatus").textContent =
      "Google todavía está cargando. Espera unos segundos y prueba otra vez.";
    return;
  }

  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (response) => {
      if (response.error) {
        $("googleStatus").textContent =
          "No se pudo conectar con Google Drive.";
        return;
      }

      driveToken = response.access_token;
      $("googleStatus").textContent =
        "Conectado. Preparando la copia de seguridad...";
      startDriveSync();
    }
  });

  tokenClient.requestAccessToken();
});
// ===== GUARDAR Y RESTAURAR DESDE GOOGLE DRIVE =====

async function findDriveBackupFile() {
  const query = encodeURIComponent(
    "name='" + DRIVE_FILENAME + "' and trashed=false"
  );

  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=" +
    query + "&spaces=drive&fields=files(id,name)",
    {
      headers: {
        Authorization: "Bearer " + driveToken
      }
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo buscar la copia en Drive.");
  }

  const data = await response.json();

  return data.files && data.files.length
    ? data.files[0].id
    : null;
}

// Al conectar, buscar la copia existente antes de guardar
async function startDriveSync() {
  if (driveSyncTimer) clearInterval(driveSyncTimer);

  try {
    driveFileId = await findDriveBackupFile();
    driveLastSnapshot = "";

    await uploadDriveBackup();

    driveSyncTimer = setInterval(() => {
      uploadDriveBackup();
    }, 5000);
  } catch (error) {
    $("googleStatus").textContent =
      "No se pudo iniciar la sincronización con Drive.";
  }
}

// Guardar una copia manualmente
$("googleSaveNow").addEventListener("click", async () => {
  if (!driveToken) {
    alert("Primero conecta Google Drive.");
    return;
  }

  driveLastSnapshot = "";

  $("googleStatus").textContent = "Guardando copia...";

  await uploadDriveBackup();
});

// Restaurar la copia guardada en Drive
$("googleRestore").addEventListener("click", async () => {
  if (!driveToken) {
    alert("Primero conecta Google Drive.");
    return;
  }

  if (!confirm(
    "La copia de Google Drive sustituirá los datos actuales de este navegador. ¿Continuar?"
  )) return;

  try {
    $("googleStatus").textContent = "Buscando copia en Drive...";

    const fileId = await findDriveBackupFile();

    if (!fileId) {
      alert("Todavía no existe ninguna copia en Google Drive.");
      return;
    }

    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files/" +
      fileId + "?alt=media",
      {
        headers: {
          Authorization: "Bearer " + driveToken
        }
      }
    );

    if (!response.ok) {
      throw new Error("No se pudo descargar la copia.");
    }

    const backup = await response.json();
// Protección contra copias vacías
const tieneDatos =
  backup &&
  backup.state &&
  (
    backup.state.shifts?.length > 0 ||
    backup.state.tips?.length > 0 ||
    backup.state.active !== null ||
    backup.calendar?.length > 0 ||
    backup.state.name !== "compañero" ||
    Number(backup.state.rate) > 0
  );

if (!tieneDatos) {
  throw new Error(
    "La copia está vacía. No se han modificado tus datos actuales."
  );
}
    const validBackup =
      backup.app === "Turno Fácil" &&
      backup.version === 1 &&
      backup.state &&
      Array.isArray(backup.state.shifts) &&
      Array.isArray(backup.state.tips) &&
      Array.isArray(backup.calendar);

    if (!validBackup) {
      throw new Error("La copia de Drive no es válida.");
    }

    localStorage.setItem(
      KEY,
      JSON.stringify({ ...emptyState, ...backup.state })
    );

    localStorage.setItem(
      calendarKey,
      JSON.stringify(backup.calendar)
    );

    alert("¡Copia de Google Drive restaurada correctamente!");

    location.reload();

  } catch (error) {
    alert(error.message || "Error al restaurar la copia.");
  }
});
// ===== MEJORAS DE SEGURIDAD DE GOOGLE DRIVE =====

let driveUploading = false;

const lastBackupDate = localStorage.getItem("turnoFacil_drive_last_backup");

if (lastBackupDate && $("googleLastBackup")) {
  $("googleLastBackup").textContent =
    "Última copia: " + new Date(lastBackupDate).toLocaleString("es-ES");
}

async function uploadDriveBackup() {
  if (!driveToken || driveUploading) return;

  const backup = createDriveBackup();

  // Comprobar si hay datos reales que proteger
  const hasData =
    backup.state.shifts.length > 0 ||
    backup.state.tips.length > 0 ||
    backup.state.active !== null ||
    backup.calendar.length > 0 ||
    backup.state.name !== "compañero" ||
    Number(backup.state.rate) > 0;

  if (!hasData) {
    $("googleStatus").textContent =
      "No se ha guardado: no hay datos para proteger.";
    return;
  }

  // Evitar subir copias si nada ha cambiado
  const snapshot = JSON.stringify({
    state: backup.state,
    calendar: backup.calendar
  });

  if (snapshot === driveLastSnapshot) return;

  driveUploading = true;

  try {
    backup.createdAt = new Date().toISOString();

    let response;

    if (driveFileId) {
      response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files/" +
        driveFileId + "?uploadType=media",
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer " + driveToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(backup)
        }
      );
    } else {
      const boundary = "turnofacil_" + Date.now();

      const body =
        "--" + boundary + "\r\n" +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify({
          name: DRIVE_FILENAME,
          mimeType: "application/json"
        }) +
        "\r\n--" + boundary + "\r\n" +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(backup) +
        "\r\n--" + boundary + "--";

      response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + driveToken,
            "Content-Type": "multipart/related; boundary=" + boundary
          },
          body
        }
      );
    }

    if (response.status === 401) {
      driveToken = null;
      if (driveSyncTimer) clearInterval(driveSyncTimer);

      $("googleStatus").textContent =
        "El permiso de Google ha caducado. Vuelve a conectar Drive.";
      return;
    }

    if (!response.ok) {
      throw new Error("Error de Google Drive: " + response.status);
    }

    const result = await response.json();

    if (result.id) driveFileId = result.id;

    driveLastSnapshot = snapshot;

    const now = new Date().toISOString();
    localStorage.setItem("turnoFacil_drive_last_backup", now);

    $("googleStatus").textContent =
      "✅ Copia guardada automáticamente en Google Drive.";

    $("googleLastBackup").textContent =
      "Última copia: " + new Date(now).toLocaleString("es-ES");

  } catch (error) {
    console.error(error);
    $("googleStatus").textContent =
      "Error al guardar. Tus datos locales siguen conservados.";
  } finally {
    driveUploading = false;
  }
}
// COMPARTIR JORNADAS
document.getElementById("shareShifts").addEventListener("click", async () => {
  if (!state.shifts.length) {
    alert("Todavía no tienes jornadas para compartir.");
    return;
  }

  const jornadas = [...state.shifts].sort((a, b) => a.start - b.start);

  let totalHoras = 0;

  let mensaje = "📋 MIS JORNADAS - TURNO FÁCIL\n\n";

  jornadas.forEach((s, i) => {
    const horas = shiftHours(s);
    totalHoras += horas;

    mensaje +=
      "📅 " + new Date(s.start).toLocaleDateString("es-ES") + "\n" +
      "🕒 Entrada: " + new Date(s.start).toLocaleTimeString("es-ES", {hour:"2-digit", minute:"2-digit"}) + "\n" +
      "🕒 Salida: " + new Date(s.end).toLocaleTimeString("es-ES", {hour:"2-digit", minute:"2-digit"}) + "\n" +
      "⏱️ Horas: " + horas.toFixed(2).replace(".", ",") + "\n\n";
  });

  mensaje += "--------------------\n";
  mensaje += "TOTAL: " + totalHoras.toFixed(2).replace(".", ",") + " horas\n";
  mensaje += "\nEnviado desde Turno Fácil 📱";

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Mis jornadas - Turno Fácil",
        text: mensaje
      });
    } catch (error) {}
  } else {
    await navigator.clipboard.writeText(mensaje);
    alert("Resumen copiado. Ya puedes compartirlo.");
  }
});
// INFORME MENSUAL PDF
document.getElementById("downloadMonthlyPDF").addEventListener("click", () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const jornadas = state.shifts
    .filter(s => {
      const d = new Date(s.start);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .sort((a, b) => a.start - b.start);

  const totalHoras = jornadas.reduce((sum, s) => sum + shiftHours(s), 0);
  const totalPropinas = state.tips
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const filas = jornadas.map(s => `
    <tr>
      <td>${new Date(s.start).toLocaleDateString("es-ES")}</td>
      <td>${new Date(s.start).toLocaleTimeString("es-ES", {hour:"2-digit",minute:"2-digit"})}</td>
      <td>${new Date(s.end).toLocaleTimeString("es-ES", {hour:"2-digit",minute:"2-digit"})}</td>
      <td>${shiftHours(s).toFixed(2).replace(".", ",")} h</td>
    </tr>
  `).join("");

  const contenido = `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Informe mensual - Turno Fácil</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #10213b; }
        h1 { color: #10213b; }
        table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        th, td { border: 1px solid #ccc; padding: 9px; text-align: left; }
        th { background: #eaf1f7; }
        .resumen { margin-top: 25px; padding: 15px; background: #f1f6fa; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h1>Turno Fácil</h1>
      <h2>Informe mensual: ${now.toLocaleDateString("es-ES", {month:"long",year:"numeric"})}</h2>
      <p><strong>Trabajador:</strong> ${state.name || "Sin nombre"}</p>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Horas</th></tr>
        </thead>
        <tbody>${filas || '<tr><td colspan="4">No hay jornadas este mes.</td></tr>'}</tbody>
      </table>
      <div class="resumen">
        <p><strong>Total de jornadas:</strong> ${jornadas.length}</p>
        <p><strong>Total de horas:</strong> ${totalHoras.toFixed(2).replace(".", ",")} h</p>
        <p><strong>Propinas:</strong> ${money(totalPropinas)}</p>
        <p><strong>Sueldo estimado:</strong> ${money(totalHoras * Number(state.rate || 0))}</p>
      </div>
      <p>Documento generado con Turno Fácil. Resumen orientativo.</p>
      <button onclick="window.print()">Guardar como PDF</button>
    </body>
    </html>
  `;

  const ventana = window.open("", "_blank");
  if (!ventana) {
    alert("Permite las ventanas emergentes para generar el informe.");
    return;
  }

  ventana.document.write(contenido);
  ventana.document.close();
  ventana.focus();
});
/* NAVEGACIÓN INFERIOR */
document.querySelectorAll(".bottom-nav [data-target]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;

    if (target === "inicio") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

$("navSettings").addEventListener("click", () => {
  $("settingsBtn").click();
});

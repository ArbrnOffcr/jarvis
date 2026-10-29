/* JARVIS – HUD-Oberfläche. Spricht mit dem lokalen JARVIS-Core (127.0.0.1). */
"use strict";

// ---------- Zugang ----------
const params = new URLSearchParams(location.search);
let TOKEN = params.get("token") || "";
try {
  if (TOKEN) sessionStorage.setItem("atlas-token", TOKEN);
  else TOKEN = sessionStorage.getItem("atlas-token") || "";
} catch (e) { /* Speicher nicht verfügbar */ }
if (params.has("token")) history.replaceState(null, "", location.pathname);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, opts = {}) {
  const r = await fetch(path, { ...opts, headers: { ...(TOKEN ? { "x-atlas-token": TOKEN } : {}), ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ---------- Uhr ----------
const TAGE = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
function tickClock() {
  const d = new Date();
  $("time").textContent = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("date").textContent = `${TAGE[d.getDay()]} · ${d.toLocaleDateString("de-DE")}`;
}
setInterval(tickClock, 1000); tickClock();

// ---------- Kern-Animation: 3D-Sphäre (Canvas, ohne Zusatzbibliothek) ----------
const STATES = {
  idle:  { label: "BEREIT",              speed: 0.22, energy: 0.15, color: [0, 229, 255] },
  think: { label: "DENKT NACH",          speed: 0.85, energy: 0.65, color: [0, 229, 255] },
  tool:  { label: "FÜHRE AUS",           speed: 0.7,  energy: 0.85, color: [127, 243, 255] },
  speak: { label: "SPRICHT",             speed: 0.35, energy: 0.5,  color: [0, 229, 255] },
  listen:{ label: "HÖRT ZU",             speed: 0.3,  energy: 0.45, color: [61, 220, 151] },
  ask:   { label: "WARTET AUF FREIGABE", speed: 0.15, energy: 0.7,  color: [255, 181, 71] },
  error: { label: "STÖRUNG",             speed: 0.1,  energy: 0.4,  color: [255, 84, 104] },
  off:   { label: "OFFLINE",             speed: 0.05, energy: 0.0,  color: [90, 127, 142] },
};
let coreState = "off", level = 0;
function setState(s) {
  coreState = s; $("state").textContent = STATES[s].label;
  window.jarvis3d?.setState(s);
}
window.atlasCore = { setState, setLevel: (v) => { level = Math.max(0, Math.min(1, v)); window.jarvis3d?.setLevel(level); } };

const cv = $("core"), ctx = cv.getContext("2d");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function fit() {
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(fit).observe(cv); fit();

// Kugelpunkte (Fibonacci) + Staubpartikel im Raum
const N = 1800, PTS = [], DUST = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
  PTS.push([Math.cos(th) * rr, y, Math.sin(th) * rr, Math.random() * 6.28]);
}
for (let i = 0; i < 160; i++) {
  const u = Math.random() * 2 - 1, a = Math.random() * 6.28, r = 1.35 + Math.random() * 1.1;
  DUST.push([Math.sqrt(1 - u * u) * Math.cos(a) * r, u * r * 0.6, Math.sqrt(1 - u * u) * Math.sin(a) * r, Math.random()]);
}
const ORBITS = [[0.30, 0.45, 1.28, 0.9], [0.40, -0.75, 1.40, -0.6], [0.26, 2.0, 1.52, 0.4]];
const LEVELS = new Array(96).fill(0);       // Pegelverlauf für den Klangring
let bolts = [], boltT = 0;

let t0 = performance.now(), rot = 0, time = 0, energy = 0.15, cur = [0, 229, 255];
function rotate([x, y, z], ay, ax) {
  const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
  const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}
function orbitPoint(a, [e, phi, r]) {
  const x = Math.cos(a) * r, y = Math.sin(a) * r * Math.sin(e), z = Math.sin(a) * r * Math.cos(e);
  const f = phi + time * 0.03;
  return [x * Math.cos(f) - y * Math.sin(f), x * Math.sin(f) + y * Math.cos(f), z];
}

function draw(now) {
  if (window.jarvis3d?.active) { t0 = now; requestAnimationFrame(draw); return; }   // 3D übernimmt
  const dt = Math.min(0.05, (now - t0) / 1000); t0 = now;
  const st = STATES[coreState], k = reduce ? 0.2 : 1;
  energy += (st.energy + level * 0.7 - energy) * Math.min(1, dt * 3);
  cur = cur.map((c, i) => c + (st.color[i] - c) * Math.min(1, dt * 4));
  rot += dt * st.speed * k; time += dt * k;
  const [r, g, b] = cur.map(Math.round), col = (a) => `rgba(${r},${g},${b},${a})`;
  const deep = (a) => `rgba(${Math.round(r * 0.15)},${Math.round(g * 0.45)},${Math.round(b * 0.85)},${a})`;
  const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2, cy = h * 0.45;
  const R = Math.max(40, Math.min(w * 0.26, h * 0.33)), D = 3.4, tilt = 0.32 + Math.sin(time * 0.2) * 0.07;
  const P = (p) => { const s = D / (D - p[2]); return [cx + p[0] * R * s, cy + p[1] * R * s, s]; };
  ctx.clearRect(0, 0, w, h);

  // Hintergrund-Halo
  let gr = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.6);
  gr.addColorStop(0, col(0.13 + energy * 0.1)); gr.addColorStop(0.5, col(0.04)); gr.addColorStop(1, col(0));
  ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);

  // Staub (hinterer Teil)
  const dustRot = time * 0.05;
  const drawDust = (front) => {
    for (const d of DUST) {
      const p = rotate(d, dustRot, tilt); if ((p[2] > 0) !== front) continue;
      const [X, Y, s] = P(p), a = 0.15 + 0.35 * Math.abs(Math.sin(time * 0.8 + d[3] * 9));
      ctx.fillStyle = col(a * (front ? 0.8 : 0.4)); ctx.fillRect(X, Y, 1.3 * s, 1.3 * s);
    }
  };
  drawDust(false);

  // HUD-Ringe außen: Skala mit Beschriftung, Segmentbögen
  const ring = (rad, segs, frac, speed, lw, a) => {
    ctx.strokeStyle = col(a); ctx.lineWidth = lw;
    for (let i = 0; i < segs; i++) {
      const s0 = time * speed + (i * 6.283) / segs;
      ctx.beginPath(); ctx.arc(cx, cy, rad, s0, s0 + (6.283 / segs) * frac); ctx.stroke();
    }
  };
  ring(R * 1.6, 3, 0.28, 0.12, 2, 0.35);
  ring(R * 1.66, 48, 0.55, -0.05, 1, 0.18);
  ring(R * 1.8, 2, 0.12, -0.2 - energy * 0.4, 3, 0.4 + energy * 0.3);
  ctx.fillStyle = col(0.35); ctx.font = `${Math.max(8, R * 0.05)}px "SF Mono", Menlo, monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.283 - time * 0.02, rr = R * 1.9;
    ctx.fillText(String(i * 30).padStart(3, "0"), cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.strokeStyle = col(0.2); ctx.lineWidth = 1;
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * 6.283 + time * 0.03, l = i % 15 ? 3 : 9, rr = R * 1.72;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    ctx.lineTo(cx + Math.cos(a) * (rr + l), cy + Math.sin(a) * (rr + l)); ctx.stroke();
  }

  // Klangring: Pegelverlauf als radiale Balken
  LEVELS.push(level); LEVELS.shift();
  if (level > 0.01 || coreState === "listen" || coreState === "speak") {
    ctx.strokeStyle = col(0.55); ctx.lineWidth = 2; ctx.lineCap = "round";
    for (let i = 0; i < LEVELS.length; i++) {
      const a = (i / LEVELS.length) * 6.283 - 1.571, v = LEVELS[(i * 7) % LEVELS.length];
      const r0 = R * 1.18, r1 = r0 + 4 + v * R * 0.35;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
  }

  // Umlaufbahnen hinten
  const orbitPath = (o, front) => {
    ctx.beginPath(); let on = false;
    for (let a = 0; a <= 6.32; a += 0.05) {
      const p = orbitPoint(a, o); if ((p[2] > 0) !== front) { on = false; continue; }
      const [X, Y] = P(p); on ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); on = true;
    }
    ctx.stroke();
  };
  ctx.lineWidth = 1; ORBITS.forEach((o) => { ctx.strokeStyle = deep(0.35); orbitPath(o, false); });

  // Kern: Plasma in Schichten
  const pulse = 1 + Math.sin(time * 3.1) * 0.035 * (0.6 + energy) + level * 0.15;
  for (const [rf, a] of [[0.95, 0.10], [0.7, 0.22], [0.45, 0.5]]) {
    gr = ctx.createRadialGradient(cx - R * 0.12, cy - R * 0.15, 0, cx, cy, R * rf * pulse);
    gr.addColorStop(0, `rgba(235,255,255,${a + energy * 0.25})`);
    gr.addColorStop(0.35, col(a)); gr.addColorStop(1, col(0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * rf * pulse, 0, 6.283); ctx.fill();
  }
  // Energieblitze beim Denken/Ausführen
  boltT -= dt;
  if (energy > 0.45 && boltT <= 0) {
    boltT = 0.09 + Math.random() * 0.1; bolts = [];
    for (let i = 0; i < 2 + Math.floor(energy * 4); i++) {
      const a = Math.random() * 6.283, path = [[cx, cy]];
      for (let j = 1; j <= 7; j++) {
        const d = (j / 7) * R * 0.9, jit = R * 0.07;
        path.push([cx + Math.cos(a) * d + (Math.random() - 0.5) * jit, cy + Math.sin(a) * d + (Math.random() - 0.5) * jit]);
      }
      bolts.push(path);
    }
  } else if (energy <= 0.45) bolts = [];
  ctx.strokeStyle = "rgba(225,255,255,.55)"; ctx.lineWidth = 1.2; ctx.shadowColor = col(1); ctx.shadowBlur = 12;
  for (const path of bolts) { ctx.beginPath(); path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }
  ctx.shadowBlur = 0;

  // Kugelpunkte: nach Tiefe sortiert, hinten tiefblau, vorne hell
  const band = Math.sin(time * (0.55 + energy)) * 0.9, proj = [];
  for (const [x, y, z, ph] of PTS) {
    const amp = 1 + (level * 0.2 + energy * 0.025) * Math.sin(ph + time * 6 + y * 4);
    const p = rotate([x * amp, y * amp, z * amp], rot, tilt);
    proj.push([p[2], p, y, ph]);
  }
  proj.sort((a, b) => a[0] - b[0]);
  for (const [z, p, y, ph] of proj) {
    const [X, Y, s] = P(p), depth = (z + 1) / 2;
    const scan = Math.max(0, 1 - Math.abs(y - band) * 7) * energy;
    const tw = 0.85 + 0.15 * Math.sin(time * 2 + ph * 5);
    const size = (0.6 + depth * 1.7 + scan * 1.4) * s;
    if (z < 0) ctx.fillStyle = deep(0.25 + depth * 0.5);
    else if (scan > 0.3) ctx.fillStyle = `rgba(230,255,255,${Math.min(1, 0.6 + scan)})`;
    else ctx.fillStyle = col(Math.min(1, (0.3 + depth * 0.65) * tw));
    ctx.fillRect(X - size / 2, Y - size / 2, size, size);
  }

  // Gitter: Längen- und Breitenkreise (vorne)
  ctx.lineWidth = 1;
  const line = (fn, front, a) => {
    ctx.strokeStyle = front ? col(a) : deep(a * 0.6); ctx.beginPath(); let on = false;
    for (let t = 0; t <= 6.32; t += 0.07) {
      const p = rotate(fn(t), rot, tilt); if ((p[2] > 0) !== front) { on = false; continue; }
      const [X, Y] = P(p); on ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); on = true;
    }
    ctx.stroke();
  };
  for (const front of [true]) {
    for (const lat of [-0.6, -0.3, 0, 0.3, 0.6]) {
      const rr = Math.sqrt(1 - lat * lat); line((t) => [Math.cos(t) * rr, lat, Math.sin(t) * rr], front, lat ? 0.12 : 0.3);
    }
    for (let m = 0; m < 6; m++) {
      const ph = (m / 6) * Math.PI; line((t) => [Math.cos(ph) * Math.sin(t), Math.cos(t), Math.sin(ph) * Math.sin(t)], front, 0.1);
    }
  }

  // Randlicht (Fresnel-Glanz an der Silhouette)
  gr = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.14);
  gr.addColorStop(0, col(0)); gr.addColorStop(0.45, col(0.22 + energy * 0.15)); gr.addColorStop(1, col(0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, 6.283); ctx.fill();

  // Umlaufbahnen vorne mit Satelliten und Leuchtspur
  ctx.shadowColor = col(0.9); ctx.shadowBlur = 10;
  ORBITS.forEach((o, i) => {
    ctx.lineWidth = 1; ctx.strokeStyle = col(0.3 + energy * 0.3); orbitPath(o, true);
    const a0 = time * o[3] * (0.6 + energy) + i * 2;
    for (let j = 0; j < 14; j++) {             // Spur
      const p = orbitPoint(a0 - Math.sign(o[3]) * j * 0.035, o), [X, Y, s] = P(p);
      ctx.fillStyle = p[2] > 0 ? `rgba(225,255,255,${0.9 - j * 0.06})` : col(0.25 - j * 0.015);
      ctx.beginPath(); ctx.arc(X, Y, Math.max(0.5, (3 - j * 0.18) * s), 0, 6.283); ctx.fill();
    }
  });
  ctx.shadowBlur = 0;
  drawDust(true);

  // Fadenkreuz-Markierungen
  ctx.strokeStyle = col(0.2); ctx.lineWidth = 1;
  const RR = R * 2.0;
  ctx.beginPath();
  ctx.moveTo(cx - RR - 60, cy); ctx.lineTo(cx - RR, cy); ctx.moveTo(cx + RR, cy); ctx.lineTo(cx + RR + 60, cy);
  ctx.stroke();
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// ---------- Text-Darstellung (einfaches, sicheres Markdown) ----------
function md(src) {
  const lines = esc(src).split("\n"); let html = "", list = false;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  for (const raw of lines) {
    const l = raw.trimEnd();
    const li = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (li) { if (!list) { html += "<ul>"; list = true; } html += `<li>${inline(li[1])}</li>`; continue; }
    if (list) { html += "</ul>"; list = false; }
    const hd = l.match(/^#{1,4}\s+(.*)$/);
    if (hd) html += `<h4>${inline(hd[1])}</h4>`;
    else if (l.trim()) html += `<p>${inline(l)}</p>`;
  }
  return html + (list ? "</ul>" : "");
}

// ---------- Dialog ----------
const chat = $("chat");
let current = null;   // aktuelle JARVIS-Antwort
function addMsg(who, text) {
  const el = document.createElement("div");
  el.className = `msg ${who}`;
  el.innerHTML = `<div class="who">${who === "user" ? "DU" : "JARVIS"}</div><div class="body"></div>`;
  el.querySelector(".body").innerHTML = text ? md(text) : "";
  chat.appendChild(el); chat.scrollTop = chat.scrollHeight;
  document.querySelector(".center").classList.toggle("talking", chat.children.length > 1);
  return el;
}
function addLine(el, cls, text) {
  const d = document.createElement("div"); d.className = cls; d.textContent = text;
  el.insertBefore(d, el.querySelector(".route")); chat.scrollTop = chat.scrollHeight;
}

// ---------- Verbindung zum Kern ----------
let ws = null, retry = 1000;
function connect() {
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws${TOKEN ? "?token=" + encodeURIComponent(TOKEN) : ""}`);
  ws.onopen = () => {
    retry = 1000; setState("idle");
    api("/status").then((st) => {                 // neue Version eingespielt? Dann Oberfläche neu laden
      const c = st.update?.commit;
      if (window.JARVIS_COMMIT && c && c !== window.JARVIS_COMMIT && !window.REC?.aktiv) location.reload();
      window.JARVIS_COMMIT = window.JARVIS_COMMIT || c;
    }).catch(() => {});
  };
  ws.onclose = () => { setState("off"); setTimeout(connect, retry); retry = Math.min(retry * 2, 15000); };
  ws.onmessage = (m) => handle(JSON.parse(m.data));
}

// Tippt der Nutzer gerade in einem Feld (Einstellungen, Dialoge …)? Dann keine Tastenkürzel abfangen.
function inFeld(el = document.activeElement) {
  return !!el && el !== document.body && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

function handle(ev) {
  switch (ev.type) {
    case "info":
      if (current) addLine(current, "info", ev.text);
      else if (!chat.children.length) addMsg("atlas", ev.text);
      else toast(ev.text);
      break;
    case "route": {
      setState("think");
      current = addMsg("atlas", "");
      current.dataset.text = "";
      const r = document.createElement("div"); r.className = "route";
      r.textContent = `${ev.target === "lokal" ? "◆ LOKAL" : "◇ CLAUDE"} · ${ev.model} · ${ev.reason}`;
      current.appendChild(r);
      break; }
    case "delta":
      if (!current) current = addMsg("atlas", "");
      current.dataset.text = (current.dataset.text || "") + ev.text;
      current.querySelector(".body").innerHTML = md(current.dataset.text);
      chat.scrollTop = chat.scrollHeight;
      if (coreState !== "think" && !play.src) setState("think");     // während JARVIS spricht: Sprechen zeigen
      break;
    case "tool":
      setState("tool");
      window.jarvis3d?.tool(ev.name); sfx("tick");
      if (current) addLine(current, "tool", `⚙ ${ev.text}`);
      break;
    case "confirm":
      setState("ask"); ask(ev);
      break;
    case "done": {
      setState("idle");
      if (current) {
        const r = current.querySelector(".route");
        if (r) r.textContent += ` · ${ev.tokens_in}↑ ${ev.tokens_out}↓` +
          (ev.s_erst != null ? ` · ⏱ ${String(ev.s_erst).replace(".", ",")} s / ${String(ev.s_gesamt).replace(".", ",")} s` : "");
      }
      current = null; busy(false); loadLage();
      break; }
    case "error":
      setState("error");
      (current || addMsg("atlas", "")).querySelector(".body").insertAdjacentHTML(
        "beforeend", `<p class="err">✕ ${esc(ev.text)}</p>`);
      current = null; busy(false);
      setTimeout(() => coreState === "error" && setState("idle"), 4000);
      break;
  }
}

function ask(ev) {
  $("mtext").textContent = ev.text; $("modal").hidden = false; $("myes").focus();
  const answer = (yes) => {
    $("modal").hidden = true;
    ws.send(JSON.stringify({ type: "confirm", id: ev.id, answer: yes }));
    setState("think");
    if (current) addLine(current, yes ? "info" : "tool", yes ? "✓ freigegeben" : "✕ abgelehnt");
  };
  $("myes").onclick = () => answer(true);
  $("mno").onclick = () => answer(false);
}
document.addEventListener("keydown", (e) => {
  if ($("modal").hidden) return;
  if (e.key === "Escape") $("mno").click();
});

// ---------- Fokus: Seitenleisten aus, Kern bildschirmfüllend ----------
function setFokus(on) {
  document.body.classList.toggle("fokus", on);
  $("fokusbtn").setAttribute("aria-pressed", String(on));
  try { localStorage.setItem("jarvis-fokus", on ? "1" : ""); } catch (e) {}
}
$("fokusbtn").addEventListener("click", () => setFokus(!document.body.classList.contains("fokus")));
try { if (localStorage.getItem("jarvis-fokus")) setFokus(true); } catch (e) {}

// ---------- Verlauf ein-/ausklappen ----------
$("histbtn").addEventListener("click", () => {
  const open = chat.classList.toggle("compact") === false;
  $("histbtn").setAttribute("aria-expanded", String(open));
  $("histbtn").textContent = open ? "SCHLIESSEN ▾" : "VERLAUF ▴";
  chat.scrollTop = chat.scrollHeight;
});

// ---------- Eingabe ----------
const input = $("input");
function busy(b) { $("send").disabled = b; input.disabled = b; if (!b) input.focus(); }
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = input.scrollHeight + "px"; });
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("ask").requestSubmit(); }
});
const QUICK = {
  lage: "Gib mir die Tageslage: Termine heute, fällige Erinnerungen, wichtige ungelesene Mails, " +
        "Fristen der nächsten 7 Tage und das Wetter – kurz und nach Wichtigkeit geordnet.",
  mail: "Fasse meine ungelesenen Mails zusammen und markiere, was eine Antwort von mir braucht.",
  woche: "Plane mit mir die kommende Woche: Termine, Fristen und offene Erinnerungen. Wo gibt es Engpässe, was sollte ich vorziehen?",
  fristen: "Welche Fristen, Fälligkeiten und Geburtstage stehen in den nächsten 14 Tagen an? Was ist dringend?",
};
function sendText(text) {
  if (!text || !ws || ws.readyState !== 1 || $("send").disabled) return;
  addMsg("user", text); busy(true); setState("think");
  ws.send(JSON.stringify({ type: "chat", text }));
}
$("quick").addEventListener("click", (e) => { const q = e.target.dataset.q; if (q) sendText(QUICK[q]); });
$("ask").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if ((!text && !ANH.liste.length) || !ws || ws.readyState !== 1) return;
  if (text === "/neu") {
    ws.send(JSON.stringify({ type: "clear" })); chat.innerHTML = ""; input.value = "";
    document.querySelector(".center").classList.remove("talking"); return;
  }
  input.value = ""; input.style.height = "auto";
  sendText(text);
});
$("modes").addEventListener("click", (e) => {
  const m = e.target.dataset.mode; if (!m || !ws) return;
  ws.send(JSON.stringify({ type: "mode", value: m }));
  [...$("modes").children].forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
});
$("notaus").addEventListener("click", async () => {
  const on = !$("notaus").classList.contains("on");
  await api(`/notaus/${on ? "an" : "aus"}`, { method: "POST" });
  loadStatus();
});

function toast(text) {
  const t = $("toast"); t.textContent = text; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 3500);
}

// ---------- Status-Chips ----------
function chip(label, value, level, why = "") {
  const icon = { good: "✓", warn: "⚠", crit: "✕" }[level] || "•";
  return `<span class="chip ${level}" title="${esc(why)}"><b>${icon}</b>${esc(label)} ${esc(value)}</span>`;
}
async function loadStatus() {
  try {
    const s = await api("/status");
    $("who").textContent = `${s.name.toUpperCase()} · ${s.host}`; $("who").dataset.name = s.name;
    const lokalOk = s.lokal && !String(s.lokal).startsWith("–");
    const claudeOk = s.claude && !String(s.claude).startsWith("–");
    const icloudOk = s.icloud && s.icloud !== "nicht eingerichtet";
    $("chips").innerHTML =
      chip("LOKAL", lokalOk ? s.lokal : "aus", lokalOk ? "good" : "warn") +
      chip("CLAUDE", claudeOk ? s.claude.replace(/^claude-/, "") : "aus", claudeOk ? "good" : "crit",
           claudeOk ? "" : String(s.claude).replace(/^– \(|\)$/g, "")) +
      chip("ICLOUD", icloudOk ? "verbunden" : "fehlt", icloudOk ? "good" : "warn") +
      chip("WERKZEUGE", s.werkzeuge, "good") +
      (s.notaus ? chip("NOT-AUS", "AKTIV", "crit") : "");
    $("notaus").classList.toggle("on", !!s.notaus);
    $("notaus").textContent = s.notaus ? "NOT-AUS AKTIV – AUFHEBEN" : "NOT-AUS";
  } catch (e) { $("chips").innerHTML = chip("KERN", "nicht erreichbar", "crit"); }
}

// ---------- Lagebild ----------
const li = (cls, html) => `<li class="${cls || ""}">${html}</li>`;
const empty = (t) => li("empty", esc(t));

function renderTermine(rows, err) {
  if (err) return $("termine").innerHTML = li("empty", `⚠ Kalender: ${esc(err)}`);
  if (!rows.length) return $("termine").innerHTML = empty("Keine Termine heute und morgen.");
  const heute = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  $("termine").innerHTML = rows.map((t) => {
    const isToday = t.beginn.includes(heute);
    const zeit = `${isToday ? "HEUTE" : "MORGEN"} · ${t.ganztag ? "ganztägig" : t.beginn.slice(-5)}`;
    return li(isToday ? "now" : "", `<div class="t">${esc(zeit)}</div><div class="x">${esc(t.titel)}</div>` +
      `<div class="m">${esc(t.kalender)}${t.ort ? " · " + esc(t.ort) : ""}</div>`);
  }).join("");
}

function renderErinnerungen(rows, err) {
  if (err) return $("erinnerungen").innerHTML = li("empty", `⚠ Erinnerungen: ${esc(err)}`);
  if (!rows.length) return $("erinnerungen").innerHTML = empty("Nichts offen.");
  const now = Date.now();
  $("erinnerungen").innerHTML = rows.map((r) => {
    let badge = "";
    if (r.faellig) {
      const d = new Date(r.faellig), over = d.getTime() < now;
      badge = `<span class="badge ${over ? "crit" : "warn"}">${over ? "✕ ÜBERFÄLLIG" : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>`;
    }
    return li("", `<div class="x">${esc(r.titel)}${badge}</div><div class="m">${esc(r.liste)}</div>`);
  }).join("");
}

function renderVorgaenge(rows) {
  if (!rows.length) return $("vorgaenge").innerHTML = empty("Keine offenen Vorgänge.");
  $("vorgaenge").innerHTML = rows.map((v) => {
    let badge = "";
    if (v.tage !== null && v.tage !== undefined) {
      const lvl = v.tage < 0 ? "crit" : v.tage <= 7 ? "warn" : "good";
      const txt = v.tage < 0 ? `✕ ${-v.tage} T. ÜBER FRIST` : v.tage === 0 ? "⚠ HEUTE" : `${v.tage} TAGE`;
      badge = `<span class="badge ${lvl}">${txt}</span>`;
    }
    return li(v.tage !== null && v.tage <= 7 ? "now" : "",
      `<div class="x">${esc(v.titel)}${badge}</div><div class="m">${esc(v.status)} · Frist ${esc(v.frist)}</div>` +
      (v.naechster_schritt && v.naechster_schritt !== "–" ? `<div class="m">→ ${esc(v.naechster_schritt)}</div>` : ""));
  }).join("");
}

function renderIndex(ix) {
  const docs = ix.lokal?.dokumente ?? 0, total = ix.dateien || 0, offen = ix.offen || 0;
  const n = (v) => Number(v).toLocaleString("de-DE");
  if (ix.phase === "kein DATENARCHIV") return $("index").innerHTML = `<div class="sysline">⚠ DATENARCHIV nicht gefunden</div>`;
  const stand = ix.stand ? new Date(ix.stand).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";
  if (!offen) {                     // Ruhezustand: eine Zeile
    $("index").innerHTML = `<div class="sysline"><span><span class="ok">✓</span> ARCHIV</span><span><b>${n(docs)}</b> Dokumente</span></div>` +
      `<div class="sysline sub"><span>Stand ${stand}</span><span>${ix.fehler ? `⚠ ${ix.fehler} unlesbar` : "alles lesbar"}</span></div>`;
    return;
  }
  const pct = total ? Math.round(((total - offen) / total) * 100) : 0;   // Indexierung läuft
  $("index").innerHTML =
    `<div class="sysline"><span>⟳ ARCHIV WIRD INDEXIERT${ix.pausiert ? " (pausiert)" : ""}</span><b>${pct} %</b></div>` +
    `<div class="meter" role="img" aria-label="Index ${pct} Prozent"><i style="width:${pct}%"></i></div>` +
    `<div class="sysline sub"><span>${n(docs)} durchsuchbar</span><span>${n(offen)} offen</span></div>`;
}

function renderKosten(k) {
  const pct = k.budget ? Math.min(100, Math.round((k.kosten / k.budget) * 100)) : 0;
  const lvl = pct >= 100 ? "crit" : pct >= 80 ? "warn" : "";
  const detail = Object.entries(k.modelle).map(([m, v]) =>
    `${m.replace("claude:", "Claude ")}: ${v.anfragen}× · ${v.kosten.toFixed(2)} $`).join("\n");
  const icon = lvl === "crit" ? "✕ " : lvl === "warn" ? "⚠ " : "";
  $("kosten").innerHTML =
    `<div class="sysline" title="${esc(detail || "Noch keine Nutzung")}"><span>${icon}KOSTEN MONAT</span>` +
    `<span><b>${k.kosten.toFixed(2)} $</b> / ${k.budget} $</span></div>` +
    `<div class="meter thin ${lvl}" role="img" aria-label="Budget ${pct} Prozent"><i style="width:${pct}%"></i></div>`;
}

function renderAktionen(rows) {
  if (!rows.length) return $("aktionen").innerHTML = empty("Heute noch keine Aktionen.");
  $("aktionen").innerHTML = rows.map((a) => {
    const t = a.ts.slice(11, 16);
    let txt = a.werkzeug || a.aktion || a.event;
    if (a.event === "bestaetigung") txt = `${a.erteilt ? "✓ freigegeben" : "✕ abgelehnt"}: ${a.was || a.aktion}`;
    if (a.event === "werkzeug") txt = `${a.erfolg ? "✓" : "✕"} ${a.werkzeug}`;
    if (a.event === "werkzeug_verweigert") txt = `✕ gesperrt: ${a.werkzeug}`;
    if (a.event === "notaus") txt = a.aktiv ? "✕ Not-Aus aktiviert" : "✓ Not-Aus aufgehoben";
    return li("", `<span class="t">${t}</span> ${esc(txt)}`);
  }).join("");
}

// Wetter
const SYM = (c) => (c === 0 ? "☀" : c <= 2 ? "⛅" : c === 3 ? "☁" : c <= 48 ? "≋" : c <= 67 || (c >= 80 && c <= 82) ? "☂"
  : c <= 77 || c === 85 || c === 86 ? "❄" : "ϟ") + "\uFE0E";
function renderWetter(w, err) {
  if (err || !w.aktuell) { $("wetter").innerHTML = `<div class="sysline">⚠ Wetter: ${esc(err || "keine Daten")}</div>`; return; }
  $("wort").textContent = "· " + w.ort.toUpperCase() + (w.quelle === "standort" ? " ⌖" : "");
  $("wort").title = w.quelle === "standort" ? "Aktueller Standort" : "Heimatort (Standort unbekannt)";
  const a = w.aktuell, d = (w.tage || [])[0] || {};
  const hours = (w.stunden || []).filter((_, i) => i % 2 === 0).slice(1, 7);
  $("wetter").innerHTML =
    `<div class="now"><div class="sym" aria-hidden="true">${SYM(a.code)}</div><div class="temp">${a.temp}°</div>` +
    `<div class="desc">${esc(a.text)}<br>gefühlt ${a.gefuehlt}° · Wind ${a.wind_kmh} km/h<br>` +
    `heute ${d.min ?? "–"}° / ${d.max ?? "–"}° · Regen ${d.regen ?? 0} %</div></div>` +
    `<div class="hours">${hours.map((h) => `<div>${h.zeit}<i>${SYM(h.code)}</i><b>${h.temp}°</b>` +
      `<span class="rain">${h.regen ?? 0}%</span></div>`).join("")}</div>` +
    (w.reiseziele || []).map((z) => `<div class="reiseziel" title="${esc(z.termin)} · ${z.km} km entfernt"><i>${SYM(z.code)}</i>` +
      `<span>→ <b>${esc(z.ort)}</b>${z.zeit ? " · " + esc(z.zeit) : ""}</span><em>${z.zur_terminzeit ? z.zur_terminzeit.temp + "°" : (z.max ?? "–") + "°"}` +
      ` · ☂ ${(z.zur_terminzeit?.regen ?? z.regen) ?? 0}%</em></div>`).join("");
}

// Posteingang
function renderMail(m, err) {
  if (err) { $("mail").innerHTML = `<div class="sysline">⚠ ${esc(err)}</div>`; return; }
  const n = m.ungelesen ?? 0;
  $("mail").innerHTML =
    `<div class="count" title="Zusammenfassen lassen" role="button" tabindex="0"><span class="big">${n}</span><span>UNGELESEN · ZUSAMMENFASSEN ▸</span></div>` +
    `<ul class="list small">${(m.neueste || []).map((x) =>
      li("", `<div class="x">${esc(x.betreff || "(ohne Betreff)")}</div><div class="m">${esc(String(x.von).replace(/<.*>/, "").trim())} · ${esc(x.datum)}</div>`)).join("")
      || empty("Alles gelesen.")}</ul>`;
  const c = $("mail").querySelector(".count");
  c.onclick = () => sendText(QUICK.mail);
  c.onkeydown = (e) => e.key === "Enter" && c.onclick();
}

// Geburtstage
function renderGeburtstage(rows, err) {
  if (err) return $("geburtstage").innerHTML = li("empty", `⚠ ${esc(err)}`);
  if (!rows.length) return $("geburtstage").innerHTML = empty("Keine in den nächsten 14 Tagen.");
  $("geburtstage").innerHTML = rows.map((g) => {
    const wann = g.in_tagen === 0 ? "HEUTE" : g.in_tagen === 1 ? "MORGEN" : `in ${g.in_tagen} Tagen`;
    const d = new Date(g.datum + "T12:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
    return li(g.in_tagen <= 1 ? "now" : "", `<span class="t">${d}</span> ${esc(g.name)}` +
      `<div class="m">${wann}${g.alter ? ` · wird ${g.alter}` : ""}</div>`);
  }).join("");
}

// Zeitleiste 14 Tage
const MK = { termin: "●", faellig: "▲", frist: "◆", geburtstag: "★" };
const TYP = { termin: "Termin", faellig: "fällig", frist: "Frist", geburtstag: "Geburtstag" };
function renderTimeline(items) {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const T = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  let html = "";
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const key = iso(d), day = items.filter((x) => x.datum === key)
      .sort((a, b) => (a.zeit || "").localeCompare(b.zeit || ""));
    const marks = day.slice(0, 8).map((x) => {
      const crit = x.typ === "frist" && i <= 2 ? " crit" : "";
      return `<span class="mk ${x.typ}${crit}" aria-hidden="true">${MK[x.typ]}</span>`;
    }).join("") + (day.length > 8 ? `<span class="mk">+${day.length - 8}</span>` : "");
    const label = i === 0 ? "HEUTE" : `${T[d.getDay()]} ${d.getDate()}.`;
    html += `<div class="day${i === 0 ? " today" : ""}${[0, 6].includes(d.getDay()) && i ? " we" : ""}" ` +
      `data-day="${esc(JSON.stringify({ label: d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit" }), day }))}"` +
      ` aria-label="${esc(label + ": " + day.map((x) => TYP[x.typ] + " " + x.titel).join(", "))}">${label}<div class="marks">${marks}</div></div>`;
  }
  $("timeline").innerHTML = html;
}
$("timeline").addEventListener("mousemove", (e) => {
  const cell = e.target.closest(".day"), tip = $("tip");
  if (!cell) return (tip.hidden = true);
  const { label, day } = JSON.parse(cell.dataset.day);
  tip.innerHTML = `<b>${esc(label.toUpperCase())}</b>` + (day.length ? day.map((x) =>
    `${MK[x.typ]} ${x.zeit ? esc(x.zeit) + " " : ""}${esc(x.titel)}`).join("<br>") : "<span class='muted'>frei</span>");
  tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 14, innerWidth - 320) + "px"; tip.style.top = e.clientY + 14 + "px";
});
$("timeline").addEventListener("mouseleave", () => ($("tip").hidden = true));

// Filter für Erinnerungslisten
$("filterbtn").addEventListener("click", () => {
  const f = $("filter"), open = f.hidden; f.hidden = !open;
  $("filterbtn").setAttribute("aria-expanded", String(open));
});
function renderFilter(listen, aus) {
  $("filter").innerHTML = listen.map((l) =>
    `<button type="button" class="${aus.includes(l) ? "off" : ""}" data-l="${esc(l)}">${esc(l)}</button>`).join("");
  $("filter").onclick = async (e) => {
    const l = e.target.dataset.l; if (l === undefined) return;
    const neu = aus.includes(l) ? aus.filter((x) => x !== l) : [...aus, l];
    e.target.classList.toggle("off");
    await api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ erinnerungen_ausblenden: neu }) });
    loadLage();
  };
}

async function loadLage(fresh = false) {
  try {
    const l = await api(`/lage${fresh ? "?frisch=1" : ""}`);
    // jeder Bereich für sich: ein Fehler in einer Quelle darf den Rest nicht leer lassen
    [() => renderTimeline(l.zeitleiste || []),
     () => renderTermine(l.termine || [], l.fehler?.termine),
     () => renderWetter(l.wetter || {}, l.fehler?.wetter),
     () => renderMail(l.mail || {}, l.fehler?.mail),
     () => renderGeburtstage(l.geburtstage || [], l.fehler?.geburtstage),
     () => renderFilter(l.erinnerungslisten || [], l.ausgeblendet || []),
     () => renderErinnerungen(l.erinnerungen || [], l.fehler?.erinnerungen),
     () => renderVorgaenge(l.vorgaenge || []),
     () => renderIndex(l.index || {}),
     () => renderKosten(l.kosten || { modelle: {}, kosten: 0, budget: 0 }),
     () => renderAktionen(l.aktionen || [])].forEach((f) => { try { f(); } catch (e) { console.warn("Lage:", e); } });
  } catch (e) { /* Kern nicht erreichbar – Chips zeigen das */ }
}

// ---------- Start ----------
// Zugang: Schlüssel aus der Adresse oder Cookie (Safari-Web-App)
fetch("/status", { headers: TOKEN ? { "x-atlas-token": TOKEN } : {} }).then((r) => {
  if (r.status === 401) {
    const el = addMsg("atlas", "Kein Zugang. Im Terminal **jarvis token** ausführen und den Schlüssel hier einfügen:");
    el.querySelector(".body").insertAdjacentHTML("beforeend",
      `<p><input id="tokin" type="password" style="width:100%;background:transparent;color:var(--ink);border:1px solid var(--line-strong);padding:6px" aria-label="Zugangsschlüssel"></p>`);
    $("tokin").addEventListener("keydown", (e) => {
      if (e.key === "Enter") location.href = "/start?token=" + encodeURIComponent(e.target.value.trim());
    });
    setState("error"); return;
  }
  connect(); loadStatus(); loadLage();
  setInterval(loadStatus, 30000); setInterval(loadLage, 60000);
}).catch(() => setState("off"));

// =====================================================================
//  SPRACHE (Phase 4): Mikrofon -> Kern (Weckwort/Whisper), Antwort -> Stimme
// =====================================================================
const V = { out: "auto", wake: false, mic: null, ctx: null, node: null, aws: null,
            ptt: false, idleTimer: null, turnSpeak: false, turnLang: "", privat: false, buf: "" };
const play = { ctx: null, an: null, queue: [], running: false, src: null };

function setOut(mode) {
  V.out = mode; $("outbtn").textContent = `STIMME: ${mode.toUpperCase()}`;
  $("outbtn").classList.toggle("on", mode !== "aus");
}
function setWakeBtn() {
  $("wakebtn").textContent = `${V.wakeLabel || "WECKWORT"}: ${V.wake ? "AN" : "AUS"}`;
  $("wakebtn").classList.toggle("on", V.wake); $("wakebtn").setAttribute("aria-pressed", String(V.wake));
}
function saveVoicePrefs() {
  api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ stimme_ausgabe: V.out, weckwort: V.wake }) }).catch(() => {});
}
$("outbtn").addEventListener("click", () => {
  setOut({ auto: "immer", immer: "aus", aus: "auto" }[V.out]); saveVoicePrefs();
  if (V.out === "aus") ttsStop();
});
$("wakebtn").addEventListener("click", async () => {
  V.wake = !V.wake; setWakeBtn(); saveVoicePrefs();
  await reopenAudio();
});

// ---------- Mikrofon ----------
async function micOpen() {
  if (V.mic) return true;
  try {
    V.ctx = new AudioContext();
    await V.ctx.audioWorklet.addModule("mic-worklet.js");
    V.mic = await navigator.mediaDevices.getUserMedia({ audio: {
      channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const src = V.ctx.createMediaStreamSource(V.mic);
    V.node = new AudioWorkletNode(V.ctx, "mic16k");
    V.node.port.onmessage = (e) => {
      if (coreState === "listen") {                // Kern pulsiert im Takt der eigenen Stimme
        const a = new Int16Array(e.data); let q = 0;
        for (let i = 0; i < a.length; i += 4) q += a[i] * a[i];
        V.micLevel = Math.min(1, Math.sqrt(q / (a.length / 4)) / 5000);
        if (!play.ctx) window.jarvis3d?.setLevel(V.micLevel);
      } else V.micLevel = 0;
      if (V.aws && V.aws.readyState === 1 && (V.wake || V.ptt || V.hoert)) V.aws.send(e.data);
      const rec = window.REC; if (rec?.ws && rec.ws.readyState === 1) rec.ws.send(e.data);
    };
    src.connect(V.node);
    return true;
  } catch (e) {
    toast("Mikrofon nicht verfügbar – Safari: Einstellungen für diese Website → Mikrofon erlauben");
    micClose(); return false;
  }
}
function micClose() {
  V.mic?.getTracks().forEach((t) => t.stop()); V.mic = null;
  V.node?.disconnect(); V.node = null; V.ctx?.close(); V.ctx = null;
}
function scheduleMicClose() {           // ohne Weckwort Mikrofon nach 60 s freigeben
  clearTimeout(V.idleTimer);
  if (!V.wake) V.idleTimer = setTimeout(() => { if (!V.ptt && !V.wake) { micClose(); closeAudioWs(); } }, 60000);
}

function closeAudioWs() { if (V.aws) { V.aws.onclose = null; V.aws.close(); V.aws = null; } }
function openAudioWs() {
  return new Promise((resolve) => {
    if (V.aws && V.aws.readyState === 1) return resolve(true);
    const tok = TOKEN ? `token=${encodeURIComponent(TOKEN)}&` : "";
    V.aws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/audio?${tok}wake=${V.wake ? 1 : 0}`);
    V.aws.binaryType = "arraybuffer";
    V.aws.onopen = () => resolve(true);
    V.aws.onerror = () => resolve(false);
    V.aws.onclose = () => { V.aws = null; if (V.wake) setTimeout(reopenAudio, 3000); };
    V.aws.onmessage = (m) => onAudioEvent(JSON.parse(m.data));
  });
}
async function reopenAudio() {
  closeAudioWs();
  if (V.wake) { if (await micOpen()) await openAudioWs(); }
  else scheduleMicClose();
}

function chime(up = true) {
  if (!play.ctx) return;
  const o = play.ctx.createOscillator(), g = play.ctx.createGain(), t = play.ctx.currentTime;
  o.frequency.setValueAtTime(up ? 660 : 880, t); o.frequency.linearRampToValueAtTime(up ? 990 : 550, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(play.ctx.destination); o.start(t); o.stop(t + 0.2);
}

function onAudioEvent(ev) {
  switch (ev.type) {
    case "ready":
      if (ev.label) { V.wakeLabel = ev.label; setWakeBtn(); }
      if (V.wake && !ev.wake) { toast(`Weckwort nicht aktiv: ${ev.wake_error}`); V.wake = false; setWakeBtn(); }
      break;
    case "wake":
      ttsStop(); chime(true); setState("listen"); break;
    case "processing":
      $("micbtn").classList.remove("rec"); $("micbtn").classList.add("busy"); setState("think"); break;
    case "transcript":
      $("micbtn").classList.remove("busy"); V.hoert = false;
      if (ev.text && $("send").disabled) { V.wartend = ev.text; V.turnLang = sprachVon(ev.text); }   // läuft noch: gleich danach
      else if (ev.text) { V.turnLang = ev.lang === "en" && sprachVon(ev.text) === "en" ? "en" : "de"; sendText(ev.text, true); }
      else setState("idle");
      scheduleMicClose(); break;
    case "cancel":
      $("micbtn").classList.remove("busy", "rec");
      if (V.hoert) { V.hoert = false; setState("idle"); scheduleMicClose(); break; }   // Gespräch leise beenden
      chime(false); setState("idle"); scheduleMicClose(); break;
    case "bargein":
      window.dazwischen?.(); break;
    case "error":
      $("micbtn").classList.remove("busy", "rec"); setState("error"); toast(ev.text); break;
  }
}

// ---------- Sprechen per Taste/Knopf ----------
async function pttStart() {
  if (V.ptt) return;
  if ($("send").disabled) {                      // Taste während der Antwort: JARVIS unterbrechen
    if (!V.turnSpeak || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: "stop" }));
  }
  unlockAudio(); ttsStop();
  V.ptt = true; $("micbtn").classList.add("rec"); setState("listen");
  if (!(await micOpen()) || !(await openAudioWs())) { V.ptt = false; $("micbtn").classList.remove("rec"); setState("idle"); return; }
  if (V.ptt) V.aws.send(JSON.stringify({ ptt: "start" }));
}
function pttStop() {
  if (!V.ptt) return;
  V.ptt = false;
  setTimeout(() => V.aws?.readyState === 1 && V.aws.send(JSON.stringify({ ptt: "stop" })), 150); // Nachlauf
}
const mic = $("micbtn");
mic.addEventListener("pointerdown", (e) => { e.preventDefault(); pttStart(); });
["pointerup", "pointerleave", "pointercancel"].forEach((t) => mic.addEventListener(t, pttStop));
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat || document.activeElement === input || inFeld() || !$("modal").hidden) return;
  e.preventDefault(); pttStart();
});
document.addEventListener("keyup", (e) => { if (e.code === "Space" && document.activeElement !== input && !inFeld()) pttStop(); });

// ---------- Vorlesen ----------
function unlockAudio() {
  if (!play.ctx) {
    play.ctx = new AudioContext();
    play.an = play.ctx.createAnalyser(); play.an.fftSize = 512;
    play.an.connect(play.ctx.destination);
    const data = new Uint8Array(play.an.fftSize);
    (function meter() {
      play.an.getByteTimeDomainData(data);
      let sum = 0; for (const v of data) sum += (v - 128) ** 2;
      window.atlasCore.setLevel(play.src ? Math.min(1, Math.sqrt(sum / data.length) / 40) : (V.micLevel || 0));
      requestAnimationFrame(meter);
    })();
  }
  if (play.ctx.state === "suspended") play.ctx.resume();
}
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

// Sprache der Antwort einmal festlegen (aus der Frage) – nicht Satz für Satz raten
function sprachVon(text) {
  const w = (text || "").toLowerCase().match(/[a-zäöüß]+/g) || [];
  const en = w.filter((x) => ["the", "and", "is", "are", "you", "what", "how", "please", "can", "my", "with", "for", "this", "that"].includes(x)).length;
  const de = w.filter((x) => ["der", "die", "das", "und", "ist", "ich", "du", "wie", "was", "bitte", "mein", "mit", "für", "nicht"].includes(x)).length
    + ((text || "").match(/[äöüß]/gi) || []).length;
  return w.length >= 4 && en >= 2 && en > 2 * de ? "en" : "de";
}
// Ablageorte werden nie vorgelesen – sie stehen in der Anzeige
function ohnePfade(s) {
  return s.replace(/\s*(?:unter|in|im Ordner|abgelegt in|liegt in)?\s*\(?(?:DATENARCHIV\s*[·›>:\/-]*\s*)?\b\d{2}_[^\n,;()]*?\/[^\n,;()]*?(?:\.(?:pdf|docx?|xlsx?|xlsm|pptx?|jpe?g|png|heic|tiff?|txt|md|rtf|csv)\b|(?=[,;)\n]|\.\s|\.$|$))\)?/gi, "")
    .replace(/\(\s*\)/g, "").replace(/\s+([.,;])/g, "$1").replace(/\s{2,}/g, " ");
}
// Gestreamte Stimme: der Kern liefert rohes PCM (24 kHz) – abgespielt wird ab dem ersten Stück
function ttsSay(text) {
  const t = ohnePfade(text).trim(); if (!t || t.length < 2) return;
  const job = { chunks: [], done: false, wake: null, ctrl: new AbortController(), rate: 24000, aus: false };
  const weck = () => { const w = job.wake; job.wake = null; if (w) w(); };
  fetch("/tts/stream", { method: "POST", signal: job.ctrl.signal,
    headers: { "content-type": "application/json", ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) },
    body: JSON.stringify({ text: t, lang: V.turnLang || "de", privat: V.privat }) })   // eine Sprache je Antwort
    .then(async (r) => {
      const eng = r.headers.get("x-tts-engine");
      if (eng && eng !== "ElevenLabs" && !V.warned) {
        V.warned = true;
        toast(`Ersatzstimme (macOS): ${decodeURIComponent(r.headers.get("x-tts-grund") || "")}`);
      }
      job.rate = +r.headers.get("x-tts-rate") || 24000;
      if (!r.ok || !r.body) return;
      const rd = r.body.getReader(); let rest = null;
      for (;;) {
        const { value, done } = await rd.read(); if (done) break;
        let b = value;
        if (rest) { const m = new Uint8Array(rest.length + b.length); m.set(rest); m.set(b, rest.length); b = m; rest = null; }
        const gerade = b.length & ~1;
        if (gerade < b.length) rest = b.slice(gerade);
        if (!gerade) continue;
        const i16 = new Int16Array(b.slice(0, gerade).buffer);
        const f = new Float32Array(i16.length);
        for (let i = 0; i < i16.length; i++) f[i] = i16[i] / 32768;
        job.chunks.push(f); weck();
      }
    }).catch(() => {}).finally(() => { job.done = true; weck(); });
  play.queue.push(job);
  if (!play.running) ttsRun();
}
play.quellen = new Set();
async function ttsRun() {
  play.running = true;
  while (play.queue.length) {
    const job = play.queue[0];
    if (job.szene) { play.queue.shift(); try { window.vortragSzene?.(job.szene); } catch (e) {} continue; }   // Abschnittsmarke
    let t = 0, laeuft = false, puffer = [];
    const spiele = (f) => {
      const b = play.ctx.createBuffer(1, f.length, job.rate); b.copyToChannel(f, 0);
      const q = play.ctx.createBufferSource(); q.buffer = b; q.connect(play.an);
      const jetzt = play.ctx.currentTime;
      if (t < jetzt + 0.01) t = jetzt + 0.03;                   // Lücke im Strom: neu ansetzen
      q.start(t); t += b.duration;
      play.quellen.add(q); play.src = q;
      q.onended = () => { play.quellen.delete(q); if (!play.quellen.size) play.src = null; };
      if (coreState !== "speak") { setState("speak"); window.sprichtGerade?.(); }
    };
    const zusammen = (arr) => { const n = arr.reduce((a, x) => a + x.length, 0), m = new Float32Array(n); let o = 0; for (const x of arr) { m.set(x, o); o += x.length; } return m; };
    while (!job.aus && play.ctx) {
      if (job.chunks.length) {
        const f = job.chunks.shift();
        if (!laeuft) {                       // ~80 ms sammeln, damit der Anfang nicht stottert
          puffer.push(f);
          if (puffer.reduce((a, x) => a + x.length, 0) < job.rate * 0.08 && !job.done) continue;
          laeuft = true; spiele(zusammen(puffer)); puffer = [];
        } else spiele(f);
        continue;
      }
      if (job.done) break;
      await new Promise((res) => { job.wake = res; });
    }
    if (!job.aus && play.ctx && puffer.length) spiele(zusammen(puffer));
    const rest = play.ctx ? t - play.ctx.currentTime : 0;
    if (rest > 0 && !job.aus) await new Promise((res) => { job.ende = res; job.timer = setTimeout(res, rest * 1000 + 20); });
    const i = play.queue.indexOf(job); if (i >= 0) play.queue.splice(i, 1);
  }
  play.running = false;
  if (coreState === "speak") setState("idle");
  window.fertigGesprochen?.();
}
function ttsStop() {
  for (const job of play.queue) {
    job.aus = true; try { job.ctrl.abort(); } catch (e) {}
    if (job.wake) job.wake(); clearTimeout(job.timer); if (job.ende) job.ende();
  }
  play.queue = []; V.buf = "";
  for (const q of play.quellen) { try { q.stop(); } catch (e) {} }
  play.quellen.clear(); play.src = null;
}
// Satzweise vorlesen, während die Antwort noch entsteht
// Punkte nach Zahlen (Daten, „3. Oktober“) und Abkürzungen beenden keinen Satz
const KEIN_SATZENDE = /(?:\d|\b(?:Nr|Dr|ca|bzw|usw|inkl|ggf|evtl|z\. ?B|u\. ?a|d\. ?h|Str|Std|Mio|Mrd|Tsd|Prof|St))$/;
function ttsFeed(text, final = false) {
  if (!V.turnSpeak) return;
  V.buf += text;
  const cut = (b) => {            // Satzende ab 25 Zeichen – der erste Satz schon früher
    const min = V.ersterSatz ? 10 : 25;
    for (let i = 0; i < b.length - 1; i++) {
      if (b[i] === "\n" && b.slice(0, i).trim()) return i + 1;
      if (".!?…:".includes(b[i]) && i >= min && /\s/.test(b[i + 1]) && !(b[i] === "." && KEIN_SATZENDE.test(b.slice(0, i)))) return i + 1;
      if (V.ersterSatz && ",;–".includes(b[i]) && i >= 28 && /\s/.test(b[i + 1])) return i + 1;
    }
    return -1;
  };
  let k;
  while ((k = cut(V.buf)) > 0) { ttsSay(V.buf.slice(0, k)); V.buf = V.buf.slice(k); V.ersterSatz = false; V.gesagt = true; }
  if (final) { ttsSay(V.buf); V.buf = ""; }
}

// Vorlesen braucht einmal eine Interaktion (Browser-Regel) – bis dahin vormerken
let pendingSpeech = "";
function speakWhenAllowed(text) {
  if (play.ctx && play.ctx.state === "running") { V.turnLang = ""; V.privat = false; ttsSay(text); return; }
  pendingSpeech = text;
  toast("Morgenbriefing bereit – zum Vorlesen einmal klicken oder eine Taste drücken");
}
["pointerdown", "keydown"].forEach((t) => document.addEventListener(t, () => {
  if (!pendingSpeech) return;
  unlockAudio(); const txt = pendingSpeech; pendingSpeech = "";
  setTimeout(() => { V.turnLang = ""; V.privat = false; ttsSay(txt); }, 150);
}));

// ---------- in den Dialog einhängen ----------
sendText = function (text, viaVoice = false) {
  V.turnSpeak = V.out === "immer" || (V.out === "auto" && viaVoice);
  V.ersterSatz = true; V.gesagt = false;
  if (!viaVoice) V.turnLang = sprachVon(text);
  if (V.turnSpeak) unlockAudio();
  if ((!text && !ANH.liste.length) || !ws || ws.readyState !== 1 || $("send").disabled) return;
  if (ANH.laedt) { toast("Dokument wird noch gelesen – einen Moment …"); return; }
  const anh = ANH.liste.splice(0); ANH.zeigen();
  const el = addMsg("user", text || "Was steht in diesem Dokument?");
  if (anh.length) el.querySelector(".body").insertAdjacentHTML("beforeend",
    `<div class="anh-namen">${anh.map((a) => `▤ ${esc(a.name)}`).join(" · ")}</div>`);
  if (viaVoice) chat.lastChild.querySelector(".who").textContent = "DU · GESPROCHEN";
  busy(true); setState("think");
  ws.send(JSON.stringify({ type: "chat", text, stimme: viaVoice, quelle: "dashboard", dokumente: anh.map((a) => a.id) }));
};
const _handle = handle;
handle = function (ev) {
  if (ev.type === "briefing") {
    const el = addMsg("atlas", ev.text);
    el.querySelector(".who").textContent = "JARVIS · MORGENBRIEFING";
    if (V.out !== "aus") speakWhenAllowed(ev.text);
    return;
  }
  if (ev.type === "hinweis") {
    chime(true); toast(`🔔 ${ev.text}`);
    const el = addMsg("atlas", ev.text); el.querySelector(".who").textContent = "JARVIS · HINWEIS";
    loadLage();
    return;
  }
  if (ev.type === "route") V.privat = !!ev.sensibel;
  _handle(ev);
  if (ev.type === "delta") ttsFeed(ev.text);
  if (ev.type === "done" || ev.type === "error") { ttsFeed("", true); if (play.running) setState("speak"); }
};

// Einstellungen laden
api("/einstellungen").then((st) => {
  setOut(st.stimme_ausgabe || "auto");
  V.wake = !!st.weckwort; setWakeBtn();
  if (V.wake) reopenAudio();
}).catch(() => { setOut("auto"); setWakeBtn(); });

// =====================================================================
//  ANSICHT (Phase 6): Tabellen, Diagramme, Karten, Quellen, Dateien
// =====================================================================
const PALETTE = ["#3987e5", "#d95926", "#199e70"];      // validierte Reihenfarben (dunkel)
const isNum = (v) => typeof v === "number" || (/^-?[\d.,]+\s*[%€$]?$/.test(String(v).trim()) && String(v).trim() !== "");
const fmtNum = (v, unit = "") => (typeof v === "number" ? v.toLocaleString("de-DE", { maximumFractionDigits: 2 }) : v) + (unit ? ` ${unit}` : "");

function linkSafe(url) { try { const u = new URL(url); return /^https?:$/.test(u.protocol) ? u.href : null; } catch (e) { return null; } }

function renderQuellen(el, quellen) {
  const seen = new Set();
  el.innerHTML = (quellen || []).filter((q) => q.url && !seen.has(q.url) && seen.add(q.url) && linkSafe(q.url))
    .slice(0, 8).map((q) => `<a href="${esc(linkSafe(q.url))}" target="_blank" rel="noopener" title="${esc(q.url)}">↗ ${esc(q.titel || new URL(q.url).hostname)}</a>`).join("");
}

function chartSVG(d) {
  const cats = d.kategorien || [], reihen = (d.reihen || []).filter((r) => Array.isArray(r.werte));
  const W = 900, H = 340, L = 56, R = 16, T = 14, B = 46, pw = W - L - R, ph = H - T - B;
  const all = reihen.flatMap((r) => r.werte).filter((v) => typeof v === "number");
  if (!cats.length || !all.length) return "<p>Keine Daten.</p>";
  const max = Math.max(0, ...all), min = Math.min(0, ...all), span = max - min || 1;
  const y = (v) => T + ph - ((v - min) / span) * ph, step = pw / cats.length;
  const color = (i) => (reihen.length === 1 ? "var(--accent)" : PALETTE[i]);
  let g = '<g class="grid">';
  for (let k = 0; k <= 4; k++) {
    const v = min + (span * k) / 4, yy = y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text x="${L - 8}" y="${yy + 4}" text-anchor="end">${esc(fmtNum(Math.round(v * 100) / 100))}</text>`;
  }
  g += `</g><g class="axis"><line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/></g>`;
  const every = Math.ceil(cats.length / 12);
  cats.forEach((c, i) => {
    if (i % every === 0) g += `<text x="${L + step * (i + 0.5)}" y="${H - B + 18}" text-anchor="middle">${esc(String(c).slice(0, 14))}</text>`;
  });
  let marks = "";
  if (d.diagrammtyp === "linie") {
    reihen.forEach((r, ri) => {
      const pts = r.werte.map((v, i) => `${L + step * (i + 0.5)},${y(v)}`).join(" ");
      marks += `<polyline class="draw" pathLength="1" points="${pts}" fill="none" stroke="${color(ri)}" stroke-width="2" stroke-linejoin="round" style="--i:${ri}"/>`;
      r.werte.forEach((v, i) => {
        marks += `<circle cx="${L + step * (i + 0.5)}" cy="${y(v)}" r="9" fill="transparent" data-tip="${esc(`${cats[i]} · ${r.name || ""}: ${fmtNum(v, d.einheit)}`)}"/>`;
      });
      const li = r.werte.length - 1;                     // letzter Wert beschriftet
      marks += `<circle cx="${L + step * (li + 0.5)}" cy="${y(r.werte[li])}" r="4" fill="${color(ri)}"/>` +
        `<text class="lbl" x="${L + step * (li + 0.5) - 6}" y="${y(r.werte[li]) - 10}" text-anchor="end">${esc(fmtNum(r.werte[li], d.einheit))}</text>`;
    });
  } else {
    const n = reihen.length, gap = 2, bw = Math.max(3, Math.min(36, (step * 0.7 - gap * (n - 1)) / n));
    reihen.forEach((r, ri) => r.werte.forEach((v, i) => {
      const x = L + step * (i + 0.5) - (n * bw + gap * (n - 1)) / 2 + ri * (bw + gap);
      const y0 = y(Math.max(0, v)), h = Math.max(1, Math.abs(y(v) - y(0)));
      marks += `<path class="grow" style="--i:${i * n + ri}" d="M${x},${y0 + h} v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z" fill="${color(ri)}" ` +
        `data-tip="${esc(`${cats[i]}${n > 1 ? " · " + (r.name || "") : ""}: ${fmtNum(v, d.einheit)}`)}"/>`;
    }));
    if (n === 1) {                                        // nur Maximum beschriften
      const w = reihen[0].werte, mi = w.indexOf(Math.max(...w));
      marks += `<text class="lbl" x="${L + step * (mi + 0.5)}" y="${y(w[mi]) - 6}" text-anchor="middle">${esc(fmtNum(w[mi], d.einheit))}</text>`;
    }
  }
  const legend = reihen.length > 1 ? `<div class="legend">${reihen.map((r, i) =>
    `<span><i style="background:${PALETTE[i]}"></i>${esc(r.name || `Reihe ${i + 1}`)}</span>`).join("")}</div>` : "";
  return `${legend}<svg class="viz" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.titel)}">${g}${marks}</svg>`;
}

function tableHTML(spalten, zeilen) {
  const numCol = (i) => (zeilen || []).length && zeilen.every((z) => z[i] === undefined || isNum(z[i]));
  return `<table><thead><tr>${(spalten || []).map((s, i) => `<th class="${numCol(i) ? "num" : ""}">${esc(s)}</th>`).join("")}</tr></thead><tbody>` +
    (zeilen || []).map((z, ri) => `<tr style="--i:${ri}">${z.map((v) => `<td class="${isNum(v) ? "num" : ""}">${esc(typeof v === "number" ? fmtNum(v) : v)}</td>`).join("")}</tr>`).join("") +
    "</tbody></table>";
}

function showAnsicht(d) {
  $("ansicht-titel").textContent = (d.titel || "ANSICHT").toUpperCase();
  let html = "";
  if (d.art === "tabelle") html = tableHTML(d.spalten, d.zeilen);
  else if (d.art === "diagramm") html = chartSVG(d) + (d.zeilen?.length ? tableHTML(d.spalten, d.zeilen) : "");
  else if (d.art === "karten") html = `<div class="karten">${(d.karten || []).map((k) => {
    const href = k.link && linkSafe(k.link);
    return `<div class="karte"><b>${esc(k.titel)}</b><p>${esc(k.text || "")}</p>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">↗ öffnen</a>` : ""}</div>`;
  }).join("")}</div>`;
  if (d.text) html += `<div class="body">${md(d.text)}</div>`;
  $("ansicht-inhalt").innerHTML = html;
  renderQuellen($("ansicht-quellen"), d.quellen);
  const a = $("ansicht"); a.hidden = false; a.classList.remove("mat"); void a.offsetWidth; a.classList.add("mat");
  sfx("ok"); countUp(a);
}
$("ansicht-zu").addEventListener("click", () => ($("ansicht").hidden = true));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("modal").hidden) $("ansicht").hidden = true; });
$("ansicht-inhalt").addEventListener("mousemove", (e) => {
  const t = e.target.closest("[data-tip]"), tip = $("tip");
  if (!t) return (tip.hidden = true);
  tip.textContent = t.dataset.tip; tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 14, innerWidth - 320) + "px"; tip.style.top = e.clientY + 14 + "px";
});
$("ansicht-inhalt").addEventListener("mouseleave", () => ($("tip").hidden = true));

const _handle6 = handle;
handle = function (ev) {
  if (ev.type === "ansicht") { showAnsicht(ev.daten); return; }
  if (ev.type === "quellen") {
    const target = current || chat.lastElementChild;
    if (target) {
      let el = target.querySelector(".src");
      if (!el) { el = document.createElement("div"); el.className = "src"; target.appendChild(el); }
      const prev = JSON.parse(el.dataset.q || "[]").concat(ev.quellen);
      el.dataset.q = JSON.stringify(prev); renderQuellen(el, prev);
    }
    return;
  }
  if (ev.type === "datei") {
    const target = current || chat.lastElementChild;
    if (target) {
      const d = document.createElement("div"); d.className = "file";
      const icon = { word: "▤", excel: "▦", powerpoint: "▭" }[ev.art] || "▢";
      d.innerHTML = `<span>${icon} ${esc(ev.pfad)}</span><button type="button">ÖFFNEN</button>`;
      d.querySelector("button").onclick = () => api("/oeffnen", { method: "POST",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: ev.pfad }) })
        .catch(() => toast("Konnte die Datei nicht öffnen"));
      target.appendChild(d);
    }
    return;
  }
  _handle6(ev);
};


// =====================================================================
//  STILWELTEN, KLÄNGE, ZÄHLER (Oberflächen-Prototypen)
// =====================================================================
const STILE = ["plexus", "holo", "organisch", "taktisch", "minimal", "aura", "nova", "milo"];
const STILNAME = { plexus: "PLEXUS", holo: "HOLOGRAFISCH", organisch: "ORGANISCH", taktisch: "TAKTISCH", minimal: "MINIMAL",
  aura: "AVATAR AURA", nova: "AVATAR NOVA", milo: "AVATAR MILO" };
const AVATAR_STILE = ["aura", "nova", "milo"];          // Avatare sind zusätzliche Stilwelten (Oberfläche: holografisch)
const stilThema = (s) => AVATAR_STILE.includes(s) ? "holo" : s;
let stil = "holo", klang = true;

function setStil(name, save = true) {
  stil = STILE.includes(name) ? name : "holo";
  document.body.dataset.stil = stilThema(stil);
  $("stilbtn").textContent = `STIL: ${STILNAME[stil]}`;
  window.jarvis3d?.setTheme(stilThema(stil));
  avatarSetzen(AVATAR_STILE.includes(stil) ? stil : null);
  if (save) api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ stil }) }).catch(() => {});
}
$("stilbtn").addEventListener("click", () => {
  setStil(STILE[(STILE.indexOf(stil) + 1) % STILE.length]);
  document.querySelectorAll(".panel").forEach((p) => { p.classList.remove("mat"); void p.offsetWidth; p.classList.add("mat"); });
  sfx("ok");
});
function setKlang(on, save = true) {
  klang = on; $("klangbtn").textContent = `KLANG: ${on ? "AN" : "AUS"}`; $("klangbtn").classList.toggle("on", on);
  if (save) api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ klang: on }) }).catch(() => {});
}
$("klangbtn").addEventListener("click", () => { unlockAudio(); setKlang(!klang); if (klang) sfx("done"); });
window.addEventListener("jarvis3d-ready", () => window.jarvis3d.setTheme(stilThema(stil)));

// Klänge: synthetisch über Web Audio – kurz, leise, unaufdringlich
function sfx(kind) {
  if (!klang || !play.ctx || play.ctx.state !== "running") return;
  const c = play.ctx, t = c.currentTime, out = c.createGain(); out.gain.value = 0.12; out.connect(c.destination);
  const tone = (f0, f1, start, dur, type = "sine", vol = 1) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t + start); o.frequency.exponentialRampToValueAtTime(f1, t + start + dur);
    g.gain.setValueAtTime(0.0001, t + start); g.gain.exponentialRampToValueAtTime(vol, t + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + start + dur); o.connect(g).connect(out); o.start(t + start); o.stop(t + start + dur + 0.02);
  };
  ({
    wake: () => { tone(520, 1040, 0, 0.16, "sine"); tone(1040, 1560, 0.09, 0.18, "triangle", 0.6); },
    ok: () => { tone(880, 880, 0, 0.07, "sine", 0.7); tone(1320, 1320, 0.07, 0.1, "sine", 0.6); },
    done: () => { tone(660, 990, 0, 0.12, "sine", 0.6); tone(990, 1480, 0.1, 0.22, "sine", 0.5); },
    warn: () => { tone(330, 300, 0, 0.18, "triangle", 0.9); tone(330, 300, 0.22, 0.18, "triangle", 0.9); },
    ask: () => { tone(740, 740, 0, 0.09, "square", 0.25); tone(587, 587, 0.12, 0.12, "square", 0.25); },
    tick: () => tone(2400, 1800, 0, 0.035, "square", 0.18),
  }[kind] || (() => {}))();
}
// Klänge an bestehende Ereignisse hängen
const _handleSfx = handle;
handle = function (ev) {
  if (ev.type === "done") sfx("done");
  if (ev.type === "error") sfx("warn");
  if (ev.type === "confirm") sfx("ask");
  if (ev.type === "hinweis") sfx("warn");
  _handleSfx(ev);
};
chime = function (up = true) { sfx(up ? "wake" : "warn"); };

// Zahlen hochzählen (Kennzahlen in Paneelen und Tabellen)
function countUp(root) {
  root.querySelectorAll("td.num, .big").forEach((el) => {
    const txt = el.textContent.trim(), m = txt.match(/^(-?[\d.]+(?:,\d+)?)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[1].replace(/\./g, "").replace(",", ".")); if (!isFinite(target)) return;
    const dec = (m[1].split(",")[1] || "").length, rest = m[2], t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700), v = target * (1 - Math.pow(1 - k, 3));
      el.firstChild && (el.firstChild.nodeValue = v.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.children.length ? "" : rest));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Einstellungen laden
api("/einstellungen").then((st) => {
  AV.modus = ["figur", "modell"].includes(st.avatar_modus) ? st.avatar_modus : "portraet"; avatarModusKnopf();
  setStil(st.stil || "plexus", st.stil === undefined); setKlang(st.klang !== false, false);
  setRein(st.rein === undefined ? true : !!st.rein, st.rein === undefined);   // neu: reduziert als Standard
}).catch(() => { setStil("plexus", false); setKlang(true, false); setRein(true, false); });
document.querySelectorAll(".panel").forEach((p) => p.classList.add("mat"));


// =====================================================================
//  REDUZIERT: nur der Kern – Untertitel, Eingabe erst beim Tippen
// =====================================================================
const body = document.body;
let ruheTimer = null, stillTimer = null;
function setRein(on, save = true) {
  body.classList.toggle("rein", on);
  $("reinbtn").setAttribute("aria-pressed", String(on));
  if (!on) { body.classList.remove("tippen", "still", "zeigt"); chat.classList.remove("ruhig"); }
  else { markiere(); wach(); }
  if (save) api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ rein: on }) }).catch(() => {});
}
$("reinbtn").addEventListener("click", () => { setRein(true); sfx("ok"); });
$("rh-dash").addEventListener("click", () => { setRein(false); sfx("ok");
  document.querySelectorAll(".panel").forEach((p) => { p.classList.remove("mat"); void p.offsetWidth; p.classList.add("mat"); }); });
$("rh-mic").addEventListener("click", () => $("wakebtn").click());
const _setWakeBtn = setWakeBtn;
setWakeBtn = function () { _setWakeBtn(); $("rh-mic").textContent = $("wakebtn").textContent; $("rh-mic").classList.toggle("on", !!V.wake); };
setWakeBtn();

// nur letzte Frage und letzte Antwort zeigen; Untertitel verblassen nach einer Weile
function markiere() {
  if (!body.classList.contains("rein")) return;
  const msgs = [...chat.querySelectorAll(".msg")];
  msgs.forEach((m) => m.classList.remove("zeige"));
  const lastUser = msgs.filter((m) => m.classList.contains("user")).pop();
  const lastAtlas = msgs.filter((m) => m.classList.contains("atlas")).pop();
  if (lastAtlas) {
    lastAtlas.classList.add("zeige");
    const b = lastAtlas.querySelector(".body");
    if (!b.dataset.selbst) b.scrollTop = b.scrollHeight;      // mitlaufen, außer du hast selbst gescrollt
    b.classList.toggle("lang", b.scrollHeight > b.clientHeight + 4);
    if (!b.dataset.scrollhoerer) {
      b.dataset.scrollhoerer = "1";
      b.addEventListener("scroll", () => {
        const unten = b.scrollHeight - b.scrollTop - b.clientHeight < 6;
        if (unten) delete b.dataset.selbst; else b.dataset.selbst = "1";
        b.classList.toggle("oben", b.scrollTop < 4);
        chat.classList.remove("ruhig"); clearTimeout(ruheTimer);       // beim Lesen nicht ausblenden
        ruheTimer = setTimeout(() => { if (["idle", "off"].includes(coreState) && !body.classList.contains("tippen")) chat.classList.add("ruhig"); }, 16000);
      }, { passive: true });
    }
  }
  if (lastUser && (!lastAtlas || msgs.indexOf(lastUser) < msgs.indexOf(lastAtlas) || coreState !== "idle")) lastUser.classList.add("zeige");
  chat.classList.remove("ruhig");
  clearTimeout(ruheTimer);
  ruheTimer = setTimeout(() => { if (["idle", "off"].includes(coreState) && !body.classList.contains("tippen")) chat.classList.add("ruhig"); }, 16000);
}
new MutationObserver(markiere).observe(chat, { childList: true, subtree: true, characterData: true });
const _setStateR = setState;
setState = function (s) { _setStateR(s); if (s !== "idle") chat.classList.remove("ruhig"); else markiere();
  $("rh-dot").classList.toggle("on", s !== "off"); };
window.atlasCore.setState = setState;

// Ansicht: Kern tritt zurück
new MutationObserver(() => body.classList.toggle("zeigt", !$("ansicht").hidden))
  .observe($("ansicht"), { attributes: true, attributeFilter: ["hidden"] });

// Tippen öffnet die Eingabe, Esc schließt sie; D wechselt zum Dashboard
function tippen(on) {
  body.classList.toggle("tippen", on);
  if (on) { input.focus(); chat.classList.remove("ruhig"); } else input.blur();
}
document.addEventListener("keydown", (e) => {
  if (!body.classList.contains("rein") || !$("modal").hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  const imFeld = document.activeElement === input;
  if (inFeld() || !$("einst").hidden || e.target.closest?.("#einst,.einst,.ansicht,.karte,.modal")) return;   // Einstellungen & andere Felder
  if (e.key === "Escape") { if (body.classList.contains("tippen")) { tippen(false); e.stopPropagation(); } return; }
  if (imFeld) return;
  if ((e.key === "d" || e.key === "D") && !body.classList.contains("tippen")) { e.preventDefault(); e.stopPropagation(); $("rh-dash").click(); return; }
  if (e.key.length === 1 && e.key !== " ") { tippen(true); }          // Zeichen landet im Feld
}, true);
document.addEventListener("keydown", (e) => {     // im Dashboard: D → reduziert
  if (body.classList.contains("rein") || document.activeElement === input || !$("modal").hidden) return;
  if ((e.key === "d" || e.key === "D") && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement.tagName !== "TEXTAREA"
      && document.activeElement.tagName !== "INPUT") { setRein(true); sfx("ok"); }
});
$("ask").addEventListener("submit", () => { if (body.classList.contains("rein")) setTimeout(() => tippen(false), 0); });
input.addEventListener("blur", () => { if (!input.value.trim()) setTimeout(() => { if (document.activeElement !== input) body.classList.remove("tippen"); }, 150); });
$("stage").addEventListener("click", (e) => {
  if (body.classList.contains("rein") && !e.target.closest("a,button,.ansicht")) tippen(!body.classList.contains("tippen"));
});

// Mauszeiger und Hinweise verschwinden, wenn nichts passiert
function wach() {
  body.classList.remove("still"); clearTimeout(stillTimer);
  stillTimer = setTimeout(() => body.classList.add("still"), 3500);
}
["mousemove", "pointerdown", "keydown"].forEach((t) => document.addEventListener(t, wach, { passive: true }));

// nach einer Antwort nicht in ein unsichtbares Feld springen
busy = function (b) { $("send").disabled = b; input.disabled = b;
  if (!b && (!body.classList.contains("rein") || body.classList.contains("tippen"))) input.focus(); };

// Uhr oben rechts
setInterval(() => { $("rh-time").textContent = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }); }, 1000);


// =====================================================================
//  GESPRÄCHSGEFÜHL: kurze Überbrückung, wenn JARVIS erst Daten holt
// =====================================================================
const UEBERBRUECKUNG = ["Einen Moment.", "Sehr wohl, einen Augenblick.", "Ich sehe nach."];
const _handleFill = handle;
handle = function (ev) {
  if (ev.type === "tool" && V.turnSpeak && !V.gesagt && !V.fuellt) {
    V.fuellt = true; V.gesagt = true;
    ttsSay(UEBERBRUECKUNG[Math.floor(Math.random() * UEBERBRUECKUNG.length)]);
  }
  if (ev.type === "done" || ev.type === "error") V.fuellt = false;
  _handleFill(ev);
};


// =====================================================================
//  FOTOS: aus dem Netz, im Kern eingeblendet (Fallback: Ansicht)
// =====================================================================
function bilderZeigen(ev) {
  if (window.jarvis3d?.showImages) {
    window.jarvis3d.showImages(ev); body.classList.add("bilder"); sfx("ok"); return;
  }
  const figs = (ev.bilder || []).map((b) => {
    const href = linkSafe(b.seite);
    return `<figure><img src="${esc(b.src)}" alt="${esc(b.titel)}"><figcaption>Foto: ${esc(b.urheber)} · ${esc(b.lizenz)}` +
      `${href ? ` · <a href="${esc(href)}" target="_blank" rel="noopener">Quelle</a>` : ""}</figcaption></figure>`;
  }).join("");
  showAnsicht({ titel: ev.titel || "Bild", art: "text", text: "" });
  $("ansicht-inhalt").innerHTML = `<div class="fotos">${figs}</div>`;
}
function bilderWeg() {
  if (window.jarvis3d?.hasImages?.()) { window.jarvis3d.hideImages(); sfx("tick"); }
  setTimeout(() => { if (!window.jarvis3d?.hasImages?.() && !SK.el) body.classList.remove("bilder", "dok"); }, 1400);
}
const _handleBild = handle;
handle = function (ev) {
  if (ev.type === "bild") {
    DOK.aktuell = (ev.bilder || []).length === 1 && ev.bilder[0].pfad ? { ...ev.bilder[0] } : null;
    body.classList.toggle("dok", !!DOK.aktuell); bilderZeigen(ev); return;
  }
  _handleBild(ev);
};
const _sendTextBild = sendText;
sendText = function (text, viaVoice = false) { bilderWeg(); return _sendTextBild(text, viaVoice); };
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("modal").hidden && window.jarvis3d?.hasImages?.()) bilderWeg();
});
$("stage").addEventListener("click", (e) => {
  if (window.jarvis3d?.hasImages?.() && !e.target.closest("a,button,.ansicht,.bild-hit")) { e.stopImmediatePropagation(); bilderWeg(); }
}, true);


// =====================================================================
//  PRINZIPSKIZZE: entsteht Schritt für Schritt im Fenster
// =====================================================================
const SVGNS = "http://www.w3.org/2000/svg";
const SK = { el: null, timer: [], raf: 0 };
const svgEl = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

function skizzeWeg(sofort = false) {
  SK.timer.forEach(clearTimeout); SK.timer = []; cancelAnimationFrame(SK.raf);
  const el = SK.el; SK.el = null;
  window.jarvis3d?.setFocus?.(false);
  if (!el) return;
  if (sofort) { el.remove(); return; }
  el.classList.add("weg"); setTimeout(() => el.remove(), 900);
  setTimeout(() => { if (!SK.el && !window.jarvis3d?.hasImages?.()) body.classList.remove("bilder"); }, 900);
}

// Ebenen-Layout für Elemente ohne Position: von links (Ursache) nach rechts (Wirkung)
function autoLayout(els, vbs) {
  const ids = els.map((e) => e.id), ein = Object.fromEntries(ids.map((i) => [i, 0]));
  vbs.forEach((v) => { if (v.von !== v.nach) ein[v.nach]++; });
  const ebene = {}, queue = ids.filter((i) => !ein[i]);
  if (!queue.length) queue.push(ids[0]);
  queue.forEach((i) => (ebene[i] = 0));
  for (let k = 0; k < queue.length; k++) {
    const i = queue[k];
    vbs.filter((v) => v.von === i).forEach((v) => {
      if (ebene[v.nach] === undefined) { ebene[v.nach] = Math.min(ebene[i] + 1, 6); queue.push(v.nach); }
    });
  }
  ids.forEach((i) => { if (ebene[i] === undefined) ebene[i] = 0; });
  const max = Math.max(...Object.values(ebene)), spalten = {};
  ids.forEach((i) => (spalten[ebene[i]] = [...(spalten[ebene[i]] || []), i]));
  els.forEach((e) => {
    if (e.x != null && e.y != null) return;
    const col = spalten[ebene[e.id]], k = col.indexOf(e.id);
    e.x = max ? 8 + (ebene[e.id] / max) * 84 : 50;
    e.y = col.length > 1 ? 12 + (k / (col.length - 1)) * 76 : 50;
  });
}

function wolkenPfad(cx, cy, w, h) {
  const n = 9, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2]); }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ox = mx - cx, oy = my - cy, l = Math.hypot(ox, oy) || 1;
    d += ` Q${mx + (ox / l) * h * .28},${my + (oy / l) * h * .28} ${x2},${y2}`;
  }
  return d + "Z";
}

// Schnittpunkt der Verbindungslinie mit dem Umriss (Rechteck oder Ellipse)
function rand(e, tx, ty) {
  const dx = tx - e.cx, dy = ty - e.cy;
  if (!dx && !dy) return [e.cx, e.cy];
  if (e.form === "kreis" || e.form === "wolke") {
    const k = 1 / Math.sqrt((dx * dx) / ((e.w / 2) ** 2) + (dy * dy) / ((e.h / 2) ** 2));
    return [e.cx + dx * k, e.cy + dy * k];
  }
  if (e.form === "raute") {
    const k = 1 / (Math.abs(dx) / (e.w / 2) + Math.abs(dy) / (e.h / 2));
    return [e.cx + dx * k, e.cy + dy * k];
  }
  const k = Math.min(Math.abs((e.w / 2 + 2) / (dx || 1e-6)), Math.abs((e.h / 2 + 2) / (dy || 1e-6)));
  return [e.cx + dx * k, e.cy + dy * k];
}

function skizzeZeigen(d) {
  skizzeWeg(true);
  if (window.jarvis3d?.hasImages?.()) window.jarvis3d.hideImages();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const host = document.createElement("div"); host.className = "skizze"; SK.el = host;
  host.innerHTML = `<div class="sk-titel"></div>`;
  host.querySelector(".sk-titel").textContent = d.titel || "";
  $("stage").appendChild(host);
  window.jarvis3d?.setFocus?.(true); body.classList.add("bilder");
  const W = 1000, H = 560, svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": d.titel || "Skizze" }, host);
  const defs = svgEl("defs", {}, svg);
  const mk = svgEl("marker", { id: "sk-pfeil", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  svgEl("path", { d: "M0,0 L10,5 L0,10 L3,5 Z", class: "sk-spitze" }, mk);
  const fl = svgEl("filter", { id: "sk-glow", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
  svgEl("feGaussianBlur", { stdDeviation: 3.2, result: "b" }, fl);
  const mg = svgEl("feMerge", {}, fl); svgEl("feMergeNode", { in: "b" }, mg); svgEl("feMergeNode", { in: "SourceGraphic" }, mg);
  const gBer = svgEl("g", {}, svg), gVb = svgEl("g", {}, svg), gEl = svgEl("g", {}, svg), gFx = svgEl("g", {}, svg);

  const els = (d.elemente || []).map((e) => ({ ...e })), byId = Object.fromEntries(els.map((e) => [e.id, e]));
  const vbs = (d.verbindungen || []).filter((v) => byId[v.von] && byId[v.nach]);
  autoLayout(els, vbs);
  const X = (x) => 70 + (x / 100) * (W - 140), Y = (y) => 46 + (y / 100) * (H - 92);

  // Elemente vorbereiten (unsichtbar), Größe aus Textbreite
  els.forEach((e) => {
    e.cx = X(e.x); e.cy = Y(e.y);
    const g = svgEl("g", { class: `sk-el${e.betont ? " betont" : ""}` }, gEl);
    const t = svgEl("text", { x: e.cx, y: e.cy + (e.notiz ? -4 : 5), class: "sk-text", "text-anchor": "middle" }, g);
    t.textContent = e.text;
    let tw = 60; try { tw = t.getComputedTextLength(); } catch (_) {}
    let nw = 0;
    if (e.notiz) {
      const n = svgEl("text", { x: e.cx, y: e.cy + 15, class: "sk-notiz", "text-anchor": "middle" }, g); n.textContent = e.notiz;
      try { nw = n.getComputedTextLength(); } catch (_) {}
    }
    const inner = Math.max(tw, nw), h = e.notiz ? 58 : 44;
    let shape;
    if (e.form === "kreis") { const r = Math.max(34, inner / 2 + 18); e.w = e.h = r * 2; shape = svgEl("circle", { cx: e.cx, cy: e.cy, r }); }
    else if (e.form === "raute") { e.w = inner + 70; e.h = h + 28; shape = svgEl("path", { d: `M${e.cx},${e.cy - e.h / 2} L${e.cx + e.w / 2},${e.cy} L${e.cx},${e.cy + e.h / 2} L${e.cx - e.w / 2},${e.cy} Z` }); }
    else if (e.form === "zylinder") {
      e.w = inner + 40; e.h = h + 18; const x0 = e.cx - e.w / 2, x1 = e.cx + e.w / 2, y0 = e.cy - e.h / 2 + 7, y1 = e.cy + e.h / 2 - 7, ry = 7;
      shape = svgEl("path", { d: `M${x0},${y0} A${e.w / 2},${ry} 0 0 0 ${x1},${y0} A${e.w / 2},${ry} 0 0 0 ${x0},${y0} L${x0},${y1} A${e.w / 2},${ry} 0 0 0 ${x1},${y1} L${x1},${y0}` });
    } else if (e.form === "wolke") { e.w = inner + 64; e.h = h + 30; shape = svgEl("path", { d: wolkenPfad(e.cx, e.cy, e.w, e.h) }); }
    else if (e.form === "text") { e.w = inner + 8; e.h = 24; }
    else { e.w = inner + 36; e.h = h; shape = svgEl("rect", { x: e.cx - e.w / 2, y: e.cy - e.h / 2, width: e.w, height: e.h, rx: 9 }); }
    if (shape) { shape.setAttribute("class", "sk-form"); shape.setAttribute("pathLength", 1); g.insertBefore(shape, t); }
    e.g = g;
  });

  // Verbindungen: leicht gebogen, mit Lichtfluss
  vbs.forEach((v, i) => {
    const a = byId[v.von], b = byId[v.nach];
    const [x1, y1] = rand(a, b.cx, b.cy), [x2, y2] = rand(b, a.cx, a.cy);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const bog = (i % 2 ? -1 : 1) * Math.min(28, len * .08);
    const qx = mx + (-(y2 - y1) / len) * bog, qy = my + ((x2 - x1) / len) * bog;
    const dPath = `M${x1},${y1} Q${qx},${qy} ${x2},${y2}`;
    const g = svgEl("g", { class: `sk-vb ${v.art}` }, gVb);
    const p = svgEl("path", { d: dPath, class: "sk-linie", pathLength: 1 }, g);
    v.marker = () => {                                   // Pfeilspitzen erst, wenn die Linie gezeichnet ist
      if (v.art === "pfeil" || v.art === "doppelpfeil") p.setAttribute("marker-end", "url(#sk-pfeil)");
      if (v.art === "doppelpfeil") p.setAttribute("marker-start", "url(#sk-pfeil)");
    };
    if (v.art !== "linie") svgEl("path", { d: dPath, class: "sk-fluss" }, g);
    if (v.text) {
      const lx = .25 * x1 + .5 * qx + .25 * x2, ly = .25 * y1 + .5 * qy + .25 * y2;
      const t = svgEl("text", { x: lx, y: ly - 7, class: "sk-vbtext", "text-anchor": "middle" }, g); t.textContent = v.text;
    }
    v.g = g;
  });

  // Rahmen um Bereiche
  (d.bereiche || []).forEach((b) => {
    const m = b.ids.map((i) => byId[i]).filter(Boolean); if (!m.length) return;
    const x0 = Math.min(...m.map((e) => e.cx - e.w / 2)) - 18, x1 = Math.max(...m.map((e) => e.cx + e.w / 2)) + 18;
    const y0 = Math.min(...m.map((e) => e.cy - e.h / 2)) - 26, y1 = Math.max(...m.map((e) => e.cy + e.h / 2)) + 16;
    const g = svgEl("g", { class: "sk-ber" }, gBer);
    svgEl("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 14, pathLength: 1 }, g);
    const t = svgEl("text", { x: x0 + 12, y: y0 + 16, class: "sk-bertext" }, g); t.textContent = b.text;
    b.g = g; b.m = m;
  });

  // Reihenfolge
  let schritte = (d.schritte || []).map((s) => s.filter((i) => byId[i])).filter((s) => s.length);
  const genannt = new Set(schritte.flat());
  els.filter((e) => !genannt.has(e.id)).forEach((e) => schritte.push([e.id]));
  const dauer = reduce ? 0 : (V.turnSpeak ? 2100 : 1500), sichtbar = new Set();
  const orbPunkt = () => {                       // Startpunkt der Lichtfunken: der Kern oben
    const r = svg.getBoundingClientRect(), st = $("stage").getBoundingClientRect();
    const sx = st.left + st.width / 2, sy = st.top + st.height * .1;
    return [((sx - r.left) / r.width) * W, ((sy - r.top) / r.height) * H];
  };
  const funke = (tx, ty, fertig) => {
    if (reduce) return fertig();
    const [ox, oy] = orbPunkt(), c = svgEl("circle", { r: 4, class: "sk-funke" }, gFx), t0 = performance.now();
    const qx = (ox + tx) / 2 + (Math.random() - .5) * 160, qy = Math.min(oy, ty) - 30;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 520), e = 1 - Math.pow(1 - k, 3), i = 1 - e;
      c.setAttribute("cx", i * i * ox + 2 * i * e * qx + e * e * tx); c.setAttribute("cy", i * i * oy + 2 * i * e * qy + e * e * ty);
      if (k < 1) requestAnimationFrame(step); else { c.remove(); fertig(); }
    };
    requestAnimationFrame(step);
  };
  const zeige = (g) => g && g.classList.add("an");
  schritte.forEach((s, k) => {
    SK.timer.push(setTimeout(() => {
      if (SK.el !== host) return;
      s.forEach((id) => funke(byId[id].cx, byId[id].cy, () => { zeige(byId[id].g); sichtbar.add(id); sfx("tick"); }));
      SK.timer.push(setTimeout(() => {
        vbs.forEach((v) => {
          if (v.g.classList.contains("an") || !sichtbar.has(v.von) || !sichtbar.has(v.nach)) return;
          zeige(v.g); SK.timer.push(setTimeout(v.marker, reduce ? 0 : 720));
        });
        (d.bereiche || []).forEach((b) => { if (b.g && b.m.every((e) => sichtbar.has(e.id))) zeige(b.g); });
      }, reduce ? 0 : 750));
    }, 500 + k * dauer));
  });
  sfx("ok");
}

const _handleSk = handle;
handle = function (ev) {
  if (ev.type === "skizze") { skizzeZeigen(ev.daten); return; }
  if (ev.type === "bild") skizzeWeg(true);
  _handleSk(ev);
};
const _sendTextSk = sendText;
sendText = function (text, viaVoice = false) { skizzeWeg(); return _sendTextSk(text, viaVoice); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("modal").hidden && SK.el) skizzeWeg(); });
$("stage").addEventListener("click", (e) => {
  if (SK.el && !e.target.closest("a,button,.ansicht")) { e.stopImmediatePropagation(); skizzeWeg(); }
}, true);


// =====================================================================
//  ARCHIV-DATEIEN IM FENSTER: Lupe, Klick → Vorschau, Blättern
// =====================================================================
const DOK = { aktuell: null, laedt: false };
window.addEventListener("jarvis-bild-klick", async (e) => {
  const m = e.detail.meta;
  if (!m.pfad) { bilderWeg(); return; }
  try {
    await api("/archiv/oeffnen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: m.pfad }) });
    sfx("ok"); toast(`In Vorschau geöffnet: ${m.titel}`);
  } catch (err) { toast("Konnte die Datei nicht öffnen"); }
});
async function blaettern(delta) {
  const d = DOK.aktuell; if (!d || d.seiten < 2 || DOK.laedt) return;
  const seite = Math.min(d.seiten, Math.max(1, d.seite + delta)); if (seite === d.seite) return;
  DOK.laedt = true;
  try {
    const neu = await api(`/vorschau?pfad=${encodeURIComponent(d.pfad)}&seite=${seite}`);
    DOK.aktuell = { ...d, ...neu }; await window.jarvis3d?.swapImage?.(0, neu); sfx("tick");
  } catch (err) { toast("Seite konnte nicht geladen werden"); }
  DOK.laedt = false;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-blatt]"); if (!b) return;
  e.preventDefault(); e.stopPropagation(); blaettern(Number(b.dataset.blatt));
}, true);
document.addEventListener("keydown", (e) => {
  if (!DOK.aktuell || !window.jarvis3d?.hasImages?.() || document.activeElement === input || !$("modal").hidden) return;
  if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); blaettern(1); }
  if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); blaettern(-1); }
});


// =====================================================================
//  AUFNAHME → TRANSKRIPT (lokal mit Whisper, Ablage im Ausgabeordner)
// =====================================================================
window.REC = { ws: null, aktiv: false, t0: 0, uhr: 0 };
const REC = window.REC;
const _micClose = micClose;
micClose = function () { if (REC.aktiv) return; _micClose(); };     // Mikrofon während der Aufnahme offen halten

function recAnzeige() {
  const an = REC.aktiv, s = an ? Math.floor((Date.now() - REC.t0) / 1000) : 0;
  const z = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const label = an ? `■ STOP ${z}` : "● AUFNAHME";
  ["recbtn", "rh-rec"].forEach((id) => { $(id).textContent = label; $(id).classList.toggle("on", an); });
  $("rec-banner").hidden = !an; $("rec-zeit").textContent = `AUFNAHME ${z}`;
  body.classList.toggle("nimmt-auf", an);
}
async function recStart(titel = "") {
  REC.titel = titel;
  unlockAudio();
  if (!(await micOpen())) return;
  if (V.ctx?.state === "suspended") await V.ctx.resume();
  const tok = TOKEN ? `token=${encodeURIComponent(TOKEN)}` : "";
  const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/aufnahme?${tok}${titel ? "&titel=" + encodeURIComponent(titel) : ""}`);
  ws.binaryType = "arraybuffer";
  ws.onmessage = (m) => {
    const ev = JSON.parse(m.data);
    if (ev.type === "laeuft") { REC.aktiv = true; REC.t0 = Date.now(); REC.uhr = setInterval(recAnzeige, 500); recAnzeige(); sfx("wake"); }
    if (ev.type === "info") toast(ev.text);
  };
  ws.onclose = () => { if (REC.aktiv) recEnde(); };
  ws.onerror = () => toast("Aufnahme konnte nicht starten");
  REC.ws = ws;
}
function recEnde() {
  REC.aktiv = false; clearInterval(REC.uhr); recAnzeige(); sfx("done");
  if (!V.wake) scheduleMicClose();
}
function recStop() {
  if (REC.ws?.readyState === 1) REC.ws.send(JSON.stringify({ stop: true }));
  recEnde();
}
function recToggle() { REC.aktiv ? recStop() : recStart(); }
$("recbtn").addEventListener("click", () => recToggle());
$("rh-rec").addEventListener("click", () => recToggle());
window.addEventListener("beforeunload", (e) => { if (REC.aktiv) { e.preventDefault(); e.returnValue = ""; } });

const _handleRec = handle;
handle = function (ev) {
  if (ev.type !== "transkript") return _handleRec(ev);
  if (ev.status === "laeuft") {
    const m = Math.max(1, Math.round(ev.sekunden / 60));
    toast(`Transkribiere ${m} min Aufnahme – das dauert etwa ${Math.max(1, Math.round(m / 6))} min …`);
  } else if (ev.status === "leer") {
    toast("Aufnahme zu kurz – kein Transkript erstellt");
  } else if (ev.status === "fehler") {
    toast(`Transkript fehlgeschlagen: ${ev.text}`); sfx("warn");
  } else if (ev.status === "fertig") {
    const el = addMsg("atlas", `Das Transkript ist fertig (${ev.dauer}, ${ev.absaetze} Absätze).`);
    el.querySelector(".who").textContent = "JARVIS · TRANSKRIPT";
    const d = document.createElement("div"); d.className = "file";
    d.innerHTML = `<span>▤ ${esc(ev.pfad)}</span><button type="button" data-a="zeigen">ANZEIGEN</button><button type="button" data-a="oeffnen">ÖFFNEN</button>`;
    d.addEventListener("click", async (e) => {
      const a = e.target.dataset.a; if (!a) return;
      e.stopPropagation();
      if (a === "oeffnen") {
        api("/archiv/oeffnen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: ev.pfad }) })
          .catch(() => toast("Konnte die Datei nicht öffnen"));
      } else {
        try { const v = await api(`/vorschau?pfad=${encodeURIComponent(ev.pfad)}`); handle({ type: "bild", titel: v.titel, bilder: [v] }); }
        catch (err) { toast("Vorschau nicht möglich"); }
      }
    });
    el.appendChild(d); sfx("ok");
  }
};

// Aktualisierung angekündigt: kurz Bescheid geben; nach dem Neustart lädt die Oberfläche neu
const _handleUpd = handle;
handle = function (ev) {
  if (ev.type === "update") { toast(`JARVIS wird aktualisiert (${ev.commit}) – einen Moment …`); return; }
  _handleUpd(ev);
};


// =====================================================================
//  iMESSAGE: „Neue Nachricht von … – vorlesen?“ (Inhalt bleibt auf dem Mac)
// =====================================================================
const NACHR = { frage: null, bis: 0 };
function nachrichtKarte(ev) {
  document.querySelector(".nachricht-karte")?.remove();
  const k = document.createElement("div"); k.className = "nachricht-karte";
  const wer = ev.gruppe ? `${ev.von} · ${ev.gruppe}` : ev.von;
  k.innerHTML = `<div class="nk-kopf">✉︎ NEUE NACHRICHT · ${esc(ev.zeit || "")}</div><div class="nk-von"></div>
    <div class="nk-text" hidden></div><div class="nk-knoepfe"><button type="button" data-a="lesen">VORLESEN</button>
    <button type="button" data-a="spaeter">SPÄTER</button></div>`;
  k.querySelector(".nk-von").textContent = wer;
  k.addEventListener("click", (e) => {
    const a = e.target.dataset.a; if (!a) return;
    e.stopPropagation();
    a === "lesen" ? nachrichtVorlesen(ev.id) : (k.remove(), NACHR.frage = null);
  });
  document.body.appendChild(k);
  setTimeout(() => k.isConnected && !k.classList.contains("gelesen") && k.remove(), 10 * 60 * 1000);
  return k;
}
async function nachrichtVorlesen(id) {
  NACHR.frage = null;
  try {
    const n = await api(`/nachricht/${id}`);
    const k = document.querySelector(".nachricht-karte") || nachrichtKarte(n);
    const t = k.querySelector(".nk-text"); t.textContent = n.text; t.hidden = false; k.classList.add("gelesen");
    unlockAudio();
    const vorher = V.privat; V.privat = !!n.privat; V.turnLang = "";
    ttsSay(`${n.von} schreibt: ${n.text}`); V.privat = vorher;
    setTimeout(() => k.remove(), 60 * 1000);
  } catch (e) { toast("Nachricht nicht mehr verfügbar"); }
}
const _handleNachr = handle;
handle = function (ev) {
  if (ev.type === "nachricht") {
    nachrichtKarte(ev); sfx("ask");
    NACHR.frage = ev.id; NACHR.bis = Date.now() + 90 * 1000;
    if (V.out !== "aus") { unlockAudio(); V.turnLang = ""; ttsSay(`Neue Nachricht von ${ev.von}. Soll ich sie vorlesen?`); }
    return;
  }
  if (ev.type === "nachricht_vorlesen") { nachrichtVorlesen(ev.id); return; }
  _handleNachr(ev);
};
// Kurze Sprachantwort auf die Frage („ja“, „lies vor“ / „nein“, „später“) direkt erledigen
const _sendTextNachr = sendText;
sendText = function (text, viaVoice = false) {
  if (NACHR.frage && Date.now() < NACHR.bis) {
    const t = (text || "").trim().toLowerCase();
    if (/^(ja|jawohl|gerne|bitte|klar|ok|okay|lies( sie)?( vor)?|vorlesen|mach|ja bitte)\b/.test(t) && t.length < 30) {
      nachrichtVorlesen(NACHR.frage); return;
    }
    if (/^(nein|später|nicht jetzt|danke nein|lass)\b/.test(t) && t.length < 30) {
      NACHR.frage = null; document.querySelector(".nachricht-karte")?.remove();
      V.turnLang = ""; ttsSay("In Ordnung."); return;
    }
  }
  return _sendTextNachr(text, viaVoice);
};


// =====================================================================
//  DOKUMENTE: ins Fenster ziehen oder über ＋ anhängen
// =====================================================================
const ANH = {
  liste: [], laedt: 0,
  zeigen() {
    const box = $("anhaenge");
    box.hidden = !this.liste.length && !this.laedt;
    box.innerHTML = this.liste.map((a, i) =>
      `<span class="anh-chip${a.sensibel?.length ? " sensibel" : ""}" title="${esc(a.sensibel?.length ? "Enthält vermutlich: " + a.sensibel.join(", ") : "")}">` +
      `▤ ${esc(a.name)} <small>${a.seiten} S.${a.leer ? " · kein Text" : ""}</small><button type="button" data-i="${i}" aria-label="entfernen">✕</button></span>`).join("") +
      (this.laedt ? `<span class="anh-chip laedt">lese ${this.laedt} Dokument${this.laedt > 1 ? "e" : ""} …</span>` : "");
  },
};
$("anhaenge").addEventListener("click", (e) => {
  const i = e.target.dataset.i; if (i === undefined) return;
  ANH.liste.splice(Number(i), 1); ANH.zeigen();
});
async function anhaengen(dateien) {
  const liste = [...dateien].slice(0, 5);
  if (!liste.length) return;
  if (body.classList.contains("rein")) tippen(true);
  ANH.laedt += liste.length; ANH.zeigen();
  for (const f of liste) {
    try {
      if (f.size > 60 * 1024 * 1024) throw new Error("größer als 60 MB");
      const r = await fetch("/dokument", { method: "POST", body: f, headers: {
        ...(TOKEN ? { "x-atlas-token": TOKEN } : {}), "x-dateiname": encodeURIComponent(f.name) } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || r.status);
      ANH.liste.push(d); sfx("ok");
    } catch (err) { toast(`„${f.name}“: ${err.message}`); sfx("warn"); }
    ANH.laedt--; ANH.zeigen();
  }
  input.focus();
  if (!input.value.trim()) input.placeholder = "Frage zum Dokument – oder einfach SENDEN für eine Zusammenfassung";
}
$("anhbtn").addEventListener("click", () => $("anhdatei").click());
$("anhdatei").addEventListener("change", (e) => { anhaengen(e.target.files); e.target.value = ""; });
// Ablagefläche nur, solange wirklich eine Datei über das Fenster gezogen wird
let dzTiefe = 0, dzTimer = 0;
const hatDateien = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
function dzZu() { dzTiefe = 0; clearTimeout(dzTimer); $("dropzone").hidden = true; }
function dzAuf() { $("dropzone").hidden = false; clearTimeout(dzTimer); dzTimer = setTimeout(dzZu, 1500); }
$("dropzone").hidden = true;
window.addEventListener("dragenter", (e) => { if (!hatDateien(e)) return; e.preventDefault(); dzTiefe++; dzAuf(); });
window.addEventListener("dragover", (e) => { if (hatDateien(e)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; dzAuf(); } });
window.addEventListener("dragleave", (e) => { if (!hatDateien(e)) return; dzTiefe = Math.max(0, dzTiefe - 1); if (!dzTiefe) dzZu(); });
["dragend", "blur"].forEach((t) => window.addEventListener(t, dzZu));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") dzZu(); });
window.addEventListener("drop", (e) => {
  if (!hatDateien(e)) return;
  e.preventDefault(); dzZu();
  anhaengen(e.dataTransfer.files);
});
document.addEventListener("paste", (e) => {             // Bildschirmfoto aus der Zwischenablage
  const files = [...(e.clipboardData?.files || [])];
  if (files.length) { e.preventDefault(); anhaengen(files); }
});


// =====================================================================
//  KARTEN: neue Briefe (Ablage bestätigen), Gesprächsaufgaben, Wochenplan
// =====================================================================
function fdat(iso) { if (!iso) return ""; const [j, m, t] = iso.slice(0, 10).split("-"); return `${t}.${m}.${j}`; }
function postKarte(ev) {
  if (document.querySelector(`.post-karte[data-id="${ev.id}"]`)) return;
  const k = document.createElement("div"); k.className = "karte post-karte"; k.dataset.id = ev.id;
  const fr = (ev.fristen || []).map((f) => `<li>◆ ${esc(f.art)} bis <b>${fdat(f.datum)}</b> <small>${esc(f.was)}</small></li>`).join("");
  k.innerHTML = `<div class="nk-kopf">✉ NEUER BRIEF${ev.datum ? " · " + fdat(ev.datum) : ""}</div>
    <div class="nk-von">${esc(ev.absender || "Absender unklar")}</div>
    <div class="k-betreff">${esc(ev.betreff || ev.original)}</div>
    ${fr ? `<ul class="k-fristen">${fr}</ul><div class="k-klein">Erinnerung ist angelegt.</div>` : ""}
    ${ev.steuer ? `<div class="k-klein">Steuer: ${esc(ev.steuer)} – wird beim Ablegen vorgemerkt.</div>` : ""}
    <label class="k-feld">ORDNER<input class="k-ordner" list="ordnerliste" value="${esc(ev.ordner || "")}"></label>
    <label class="k-feld">NAME<input class="k-name" value="${esc(ev.name || "")}"></label>
    <div class="k-klein">${esc(ev.ordner_grund || "")}</div>
    <div class="nk-knoepfe"><button type="button" data-a="ablegen" class="primaer">ABLEGEN</button>
      <button type="button" data-a="spaeter">SPÄTER</button><button type="button" data-a="verwerfen">NICHT ABLEGEN</button></div>`;
  k.addEventListener("click", async (e) => {
    const a = e.target.dataset.a; if (!a) return;
    e.stopPropagation();
    if (a === "spaeter") { k.remove(); return; }
    try {
      const r = await api(`/post/${ev.id}/${a}`, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ordner: k.querySelector(".k-ordner").value.trim(), dateiname: k.querySelector(".k-name").value.trim() }) });
      toast(a === "ablegen" ? `Abgelegt: ${r.abgelegt}${r.steuer ? " · " + r.steuer : ""}` : "Bleibt im Scan-Ordner");
      sfx("ok"); k.remove();
    } catch (err) { toast("Ablage nicht möglich – Ordner prüfen"); sfx("warn"); }
  });
  $("karten").appendChild(k);
  ordnerLaden();
}
let ordnerGeladen = false;
async function ordnerLaden() {
  if (ordnerGeladen) return;
  try {
    const r = await api("/ordner"); ordnerGeladen = true;
    const dl = document.createElement("datalist"); dl.id = "ordnerliste";
    dl.innerHTML = r.ordner.map((o) => `<option value="${esc(o)}">`).join("");
    document.body.appendChild(dl);
  } catch (e) {}
}
function aufgabenKarte(el, ev) {
  if (ev.zusammenfassung?.length) {
    el.querySelector(".body").insertAdjacentHTML("beforeend", `<ul>${ev.zusammenfassung.map((z) => `<li>${esc(z)}</li>`).join("")}</ul>`);
  }
  if (!ev.aufgaben?.length) return;
  const d = document.createElement("div"); d.className = "aufgaben";
  d.innerHTML = `<div class="nk-kopf">AUFGABEN AUS DEM GESPRÄCH</div>` + ev.aufgaben.map((a, i) =>
    `<label><input type="checkbox" checked data-i="${i}"> ${esc(a.titel)}` +
    `${a.wer || a.faellig ? ` <small>${esc([a.wer, a.faellig && fdat(a.faellig)].filter(Boolean).join(" · "))}</small>` : ""}</label>`).join("") +
    `<div class="nk-knoepfe"><button type="button" class="primaer">ALS ERINNERUNGEN ANLEGEN</button></div>`;
  d.querySelector("button").addEventListener("click", async (e) => {
    e.stopPropagation();
    const wahl = [...d.querySelectorAll("input:checked")].map((c) => ev.aufgaben[Number(c.dataset.i)]);
    if (!wahl.length) return;
    try {
      const r = await api("/aufgaben", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ aufgaben: wahl, quelle: ev.pfad }) });
      d.innerHTML = `<div class="k-klein">✓ ${r.angelegt} Erinnerung${r.angelegt !== 1 ? "en" : ""} in „${esc(r.liste)}“ angelegt.</div>`;
      sfx("ok"); loadLage();
    } catch (err) { toast("Erinnerungen konnten nicht angelegt werden"); }
  });
  el.appendChild(d); chat.scrollTop = chat.scrollHeight;
}
const _handleKarten = handle;
handle = function (ev) {
  if (ev.type === "post") { postKarte(ev); sfx("ask"); return; }
  if (ev.type === "post_erledigt") { document.querySelector(`.post-karte[data-id="${ev.id}"]`)?.remove(); return; }
  if (ev.type === "wochenplan") {
    const el = addMsg("atlas", ev.text); el.querySelector(".who").textContent = "JARVIS · WOCHENPLAN"; sfx("ok"); return;
  }
  if (ev.type === "transkript" && ev.status === "auswertung") { toast("Transkript fertig – fasse zusammen und suche Aufgaben …"); return; }
  _handleKarten(ev);
  if (ev.type === "transkript" && ev.status === "fertig") {
    const el = [...chat.querySelectorAll(".msg.atlas")].pop();
    if (el) aufgabenKarte(el, ev);
  }
};
// Beim Start: noch offene Briefe als Karten zeigen
setTimeout(() => api("/post").then((r) => (r.offen || []).forEach(postKarte)).catch(() => {}), 2500);
QUICK.woche = "Zeig mir den Wochenplan (Werkzeug 'wochenplan') und sag mir in zwei, drei Sätzen, wo es eng wird und was ich vorziehen sollte.";


// =====================================================================
//  YOUTUBE: eingebettet, startet stumm, Ton per Knopf oder „Ton an“
// =====================================================================
const YT = { el: null, liste: [], i: 0, ton: false };
function ytBefehl(func, args = []) {
  const f = YT.el?.querySelector("iframe");
  f?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}
function ytLaden(i) {
  YT.i = i; const v = YT.liste[i]; if (!v) return;
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&mute=${YT.ton ? 0 : 1}` +
    `&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  YT.el.querySelector(".yt-rahmen").innerHTML =
    `<iframe src="${src}" title="${esc(v.titel)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" ` +
    `allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  YT.el.querySelector(".yt-titel").textContent = v.titel;
  YT.el.querySelector(".yt-kanal").textContent = [v.kanal, v.dauer, v.live ? "LIVE" : ""].filter(Boolean).join(" · ");
  YT.el.querySelectorAll(".yt-weitere button").forEach((b) => b.classList.toggle("an", Number(b.dataset.i) === i));
}
function ytTon(an) {
  YT.ton = an;
  ytBefehl(an ? "unMute" : "mute"); if (an) ytBefehl("setVolume", [80]);
  const b = YT.el?.querySelector('[data-a="ton"]'); if (b) b.textContent = an ? "🔊 TON AUS" : "🔇 TON AN";
  if (an && typeof ttsStop === "function") ttsStop();          // JARVIS nicht über das Video sprechen lassen
}
function ytZu() { YT.el?.remove(); YT.el = null; YT.liste = []; body.classList.remove("youtube"); }
function ytZeigen(ev) {
  ytZu();
  YT.liste = ev.videos || []; YT.ton = false;
  const k = document.createElement("div"); k.className = "yt"; YT.el = k;
  k.innerHTML = `<div class="yt-kopf"><div><div class="yt-titel"></div><div class="yt-kanal"></div></div>
    <div class="yt-knoepfe"><button type="button" data-a="ton" class="primaer">🔇 TON AN</button>
    <button type="button" data-a="gross" title="Größer/kleiner">⤢</button>
    <button type="button" data-a="extern" title="Auf YouTube öffnen">↗</button>
    <button type="button" data-a="zu" title="Schließen (Esc)">✕</button></div></div>
    <div class="yt-rahmen"></div>
    <div class="yt-weitere">${YT.liste.map((v, i) => `<button type="button" data-i="${i}" title="${esc(v.titel)}">` +
      `<img src="${esc(v.bild)}" alt=""><span>${esc(v.titel)}</span><small>${esc(v.dauer || "")}</small></button>`).join("")}</div>`;
  k.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    e.stopPropagation();
    if (b.dataset.i !== undefined) return ytLaden(Number(b.dataset.i));
    const a = b.dataset.a;
    if (a === "ton") ytTon(!YT.ton);
    else if (a === "gross") k.classList.toggle("gross");
    else if (a === "zu") ytZu();
    else if (a === "extern") window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(YT.liste[YT.i].id)}`, "_blank");
  });
  document.body.appendChild(k); body.classList.add("youtube");
  ytLaden(0); sfx("ok");
}
function ytSteuern(a) {
  if (!YT.el) return false;
  if (a === "ton_an") ytTon(true);
  else if (a === "ton_aus") ytTon(false);
  else if (a === "pause") ytBefehl("pauseVideo");
  else if (a === "weiter") ytBefehl("playVideo");
  else if (a === "naechstes") ytLaden((YT.i + 1) % YT.liste.length);
  else if (a === "gross") YT.el.classList.toggle("gross");
  else if (a === "schliessen") ytZu();
  return true;
}
const _handleYT = handle;
handle = function (ev) {
  if (ev.type === "youtube") { ytZeigen(ev); return; }
  if (ev.type === "youtube_steuern") { ytSteuern(ev.aktion); return; }
  _handleYT(ev);
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && YT.el && $("modal").hidden && document.activeElement !== input) ytZu();
});
// Kurze Befehle direkt erledigen, ohne das Modell zu fragen („Ton an“, „Pause“, „nächstes Video“, „schließen“)
const _sendTextYT = sendText;
sendText = function (text, viaVoice = false) {
  if (YT.el) {
    const t = (text || "").trim().toLowerCase().replace(/[.!]+$/, "");
    const befehle = [[/^(ton an|mach (den )?ton an|mit ton|lauter|ton bitte)$/, "ton_an"], [/^(ton aus|stumm|leise|ohne ton)$/, "ton_aus"],
      [/^(pause|stopp|stop|anhalten)$/, "pause"], [/^(weiter|play|abspielen|fortsetzen)$/, "weiter"],
      [/^(nächstes|nächstes video|anderes video|weiter zum nächsten)$/, "naechstes"],
      [/^(video )?(schließen|zu|weg|aus)$|^video (schließen|aus|weg)$/, "schliessen"], [/^(größer|vollbild|groß)$/, "gross"]];
    for (const [rx, a] of befehle) if (rx.test(t)) { ytSteuern(a); sfx("tick"); return; }
  }
  return _sendTextYT(text, viaVoice);
};


// =====================================================================
//  ORBIT: Termine, Fälliges, Fristen der nächsten 7 Tage kreisen um den Kern
// =====================================================================
const _renderTimelineOrbit = renderTimeline;
renderTimeline = function (items) {
  _renderTimelineOrbit(items);
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const orbit = (items || []).map((x) => {
    const d = new Date(`${x.datum}T00:00:00`); const tage = Math.round((d - heute) / 864e5);
    return { ...x, tage };
  }).filter((x) => x.tage >= 0 && x.tage <= 7).sort((a, b) => a.tage - b.tage);
  window.jarvis3d?.setOrbit?.(orbit);
  ORBIT.items = orbit;
};
const ORBIT = { items: [] };
const ORBIT_TYP = { termin: "TERMIN", faellig: "FÄLLIG", frist: "FRIST", geburtstag: "GEBURTSTAG" };
window.addEventListener("jarvis-orbit-klick", (e) => {
  const it = e.detail; document.querySelector(".orbit-karte")?.remove();
  const wann = it.tage === 0 ? "heute" : it.tage === 1 ? "morgen" : `in ${it.tage} Tagen`;
  const k = document.createElement("div"); k.className = "karte orbit-karte";
  k.innerHTML = `<div class="nk-kopf">◉ ${ORBIT_TYP[it.typ] || "EINTRAG"} · ${wann.toUpperCase()}</div>
    <div class="nk-von"></div><div class="k-betreff">${fdat(it.datum)}${it.zeit ? " · " + esc(it.zeit) + " Uhr" : ""}</div>
    <div class="nk-knoepfe"><button type="button" data-a="frag" class="primaer">FRAG JARVIS</button><button type="button" data-a="zu">SCHLIESSEN</button></div>`;
  k.querySelector(".nk-von").textContent = it.titel;
  k.addEventListener("click", (ev) => {
    const a = ev.target.dataset.a; if (!a) return; ev.stopPropagation(); k.remove();
    if (a === "frag") sendText(`Was muss ich zu „${it.titel}“ (${fdat(it.datum)}) wissen oder vorbereiten?`);
  });
  $("karten").appendChild(k); sfx("tick");
  setTimeout(() => k.isConnected && k.remove(), 20000);
});
window.addEventListener("jarvis3d-ready", () => { if (ORBIT.items.length) window.jarvis3d.setOrbit(ORBIT.items); stimmung(); });


// =====================================================================
//  TAGESZEIT: morgens klar, abends wärmer, nachts gedimmt (Wachmodus)
// =====================================================================
function stimmung() {
  const h = new Date().getHours();
  const z = h >= 22 || h < 5 ? "nacht" : h < 10 ? "morgen" : h < 17 ? "tag" : "abend";
  document.body.dataset.tageszeit = z;
  window.jarvis3d?.setMood?.({ warm: { abend: .8, nacht: .5 }[z] || 0, dim: { nacht: .55, abend: .12 }[z] || 0 });
}
stimmung(); setInterval(stimmung, 5 * 60 * 1000);


// =====================================================================
//  STARTSEQUENZ (abschaltbar: Rechtsklick auf STIL)
// =====================================================================
function bootAn() { try { return localStorage.getItem("jarvis-boot") !== "aus"; } catch (e) { return true; } }
// Hochfahrklang: fertige Klangdatei (sounds/boot.wav, ≈10 s, synthetisch erzeugt). Wird vor dem Start
// geladen, damit Bild und Ton gleichzeitig loslaufen; der „Zündschlag“ liegt bei 8,4 s.
function bootTon() {
  const a = new Audio("sounds/boot.wav"); a.preload = "auto"; a.volume = 0.9;
  return a;
}
// Startet den Ton und wartet, bis er wirklich läuft (höchstens 1,2 s) – Rückgabe: schon gespielte Sekunden
function tonStarten(a) {
  return new Promise((r) => {
    let fertig = false;
    const ende = (v) => { if (!fertig) { fertig = true; r(v); } };
    a.addEventListener("playing", () => ende(a.currentTime || 0), { once: true });
    a.addEventListener("error", () => ende(null), { once: true });
    a.play().catch(() => ende(null));
    setTimeout(() => ende(a.paused ? null : a.currentTime), 1200);
  });
}

// Partikel, Drahtgitter-Globus und Explosion auf einer eigenen 2D-Leinwand
function bootLeinwand(cv, t0, ZUEND) {
  const ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const groesse = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  groesse(); addEventListener("resize", groesse);
  const P = [], N = 900;
  const neu = (explodiert = false) => {
    const a = Math.random() * Math.PI * 2, r = Math.hypot(W, H) * (0.45 + Math.random() * 0.25);
    return { a, r, v: 40 + Math.random() * 90, w: (Math.random() < .5 ? 1 : -1) * (.25 + Math.random() * .6),
             s: .6 + Math.random() * 1.8, h: Math.random() < .12 ? 1 : 0, ex: explodiert };
  };
  for (let i = 0; i < N; i++) P.push(neu());
  let laeuft = true, letzt = performance.now(), knall = false;
  (function bild(now) {
    if (!laeuft) return;
    const dt = Math.min(.05, (now - letzt) / 1000); letzt = now;
    const t = (now - t0) / 1000, cx = W / 2, cy = H * .44;
    ctx.clearRect(0, 0, W, H);
    // Partikel: ab 1,2 s spiralförmig zum Zentrum, immer schneller; beim Zünden nach außen
    const sicht = Math.min(1, Math.max(0, (t - 1.2) / 1.5));
    const tempo = 1 + Math.max(0, t - 3) * .55 + Math.max(0, t - 7) * 2.2;
    if (t >= ZUEND && !knall) { knall = true; P.forEach((p) => { p.ex = true; p.v = 300 + Math.random() * 900; p.r = Math.random() * 40; }); }
    ctx.globalCompositeOperation = "lighter";
    for (const p of P) {
      if (p.ex) { p.r += p.v * dt; p.v *= .985; }
      else {
        p.r -= p.v * tempo * dt; p.a += p.w * tempo * dt * (60 / Math.max(60, p.r));
        if (p.r < 18) Object.assign(p, neu());
      }
      const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * .62;
      const nah = 1 - Math.min(1, p.r / (Math.min(W, H) * .6));
      const alpha = (p.ex ? Math.max(0, 1 - (t - ZUEND) / 1.4) : sicht * (.15 + nah * .85));
      if (alpha <= 0.01) continue;
      ctx.fillStyle = p.h ? `rgba(230,255,255,${alpha})` : `rgba(80,215,255,${alpha * .8})`;
      if (!p.ex && tempo > 2.2) {                     // Lichtspuren bei hoher Geschwindigkeit
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = p.s * .7; ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(cx + Math.cos(p.a - p.w * .08) * (p.r + 14 * tempo), cy + Math.sin(p.a - p.w * .08) * (p.r + 14 * tempo) * .62); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, p.s * (p.ex ? 1.4 : 1), 0, Math.PI * 2); ctx.fill();
    }
    // Drahtgitter-Globus hinter den Ringen: ab 2,4 s, dreht sich und wächst
    const g = Math.min(1, Math.max(0, (t - 2.4) / 1.8)) * (t < ZUEND ? 1 : Math.max(0, 1 - (t - ZUEND) / .6));
    if (g > 0) {
      const R = Math.min(W, H) * .16 * (.6 + g * .4) * (1 + Math.max(0, t - 7.4) * .08), rot = t * (.5 + Math.max(0, t - 6) * .6);
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(0,229,255,${.32 * g})`;
      for (let i = 1; i < 8; i++) {                    // Breitenkreise
        const la = -Math.PI / 2 + i * Math.PI / 8, ry = Math.sin(la) * R, rx = Math.cos(la) * R;
        ctx.beginPath(); ctx.ellipse(cx, cy + ry, rx, rx * .28, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {                    // Längenkreise
        const lo = rot + i * Math.PI / 9;
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(Math.cos(lo)) * R, R, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(bild);
  })(performance.now());
  return () => { laeuft = false; removeEventListener("resize", groesse); };
}

function uiLog(text) {
  api("/ui-log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {});
}
async function bootSequenz(erzwingen = false) {
  if (document.querySelector(".boot")) return;
  let nachUpdate = false;
  try {
    nachUpdate = sessionStorage.getItem("jarvis-nach-update") === "1"; sessionStorage.removeItem("jarvis-nach-update");
    window.JARVIS_NACH_UPDATE = nachUpdate;
    if (!localStorage.getItem("jarvis-boot-v3")) {          // einmalig: eine früher abgeschaltete Sequenz wieder an
      localStorage.setItem("jarvis-boot-v3", "1"); localStorage.removeItem("jarvis-boot");
    }
  } catch (e) {}
  if (!erzwingen && (!bootAn() || nachUpdate)) {
    uiLog(`Startsequenz übersprungen (${!bootAn() ? "abgeschaltet" : "nach Update"})`);
    setTimeout(() => window.jarvis3d?.ignite?.(), 300); return;
  }
  const DAUER = 9.8, ZUEND = 8.4;
  const b = document.createElement("div"); b.className = "boot";
  const ticks = Array.from({ length: 96 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2, r1 = i % 8 ? 174 : 162, r2 = 182;
    return `<line x1="${(200 + Math.cos(a) * r1).toFixed(1)}" y1="${(200 + Math.sin(a) * r1).toFixed(1)}" x2="${(200 + Math.cos(a) * r2).toFixed(1)}" y2="${(200 + Math.sin(a) * r2).toFixed(1)}" style="animation-delay:${(1.6 + i * .014).toFixed(3)}s"/>`;
  }).join("");
  const bogen = (r, a0, a1) => `M${200 + Math.cos(a0) * r} ${200 + Math.sin(a0) * r} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${200 + Math.cos(a1) * r} ${200 + Math.sin(a1) * r}`;
  const segmente = Array.from({ length: 12 }, (_, i) => `<path d="${bogen(142, (i / 12) * Math.PI * 2 + .05, ((i + 1) / 12) * Math.PI * 2 - .05)}" style="animation-delay:${(2.2 + i * .06).toFixed(2)}s"/>`).join("");
  const segmente2 = Array.from({ length: 3 }, (_, i) => `<path d="${bogen(124, (i / 3) * Math.PI * 2 + .3, (i / 3) * Math.PI * 2 + 1.6)}" style="animation-delay:${(3.0 + i * .15).toFixed(2)}s"/>`).join("");
  b.innerHTML = `<canvas class="boot-cv"></canvas><div class="boot-boden"></div>
    <div class="boot-hlinie"></div><div class="boot-vlinie"></div><div class="boot-scan"></div>
    <div class="boot-links"><div class="b-kopf">SYSTEMPRÜFUNG</div></div>
    <div class="boot-mitte"><svg viewBox="0 0 400 400" class="boot-svg" aria-hidden="true">
      <g class="b-ticks">${ticks}</g>
      <circle cx="200" cy="200" r="190" class="bz l1"/>
      <g class="b-seg">${segmente}</g><g class="b-seg2">${segmente2}</g>
      <circle cx="200" cy="200" r="108" class="bz l2"/><circle cx="200" cy="200" r="92" class="bz l5"/>
      <path d="M200 0 V58 M200 342 V400 M0 200 H58 M342 200 H400" class="bz l3"/>
      <path d="M26 26 h50 M26 26 v50 M374 26 h-50 M374 26 v50 M26 374 h50 M26 374 v-50 M374 374 h-50 M374 374 v-50" class="bz l4"/>
      <g class="b-innen"><path d="M200 128 L262 164 L262 236 L200 272 L138 236 L138 164 Z" class="bz l6"/>
        <path d="M200 146 L246 173 L246 227 L200 254 L154 227 L154 173 Z" class="bz l7"/></g>
      <circle cx="200" cy="200" r="7" class="bk"/></svg>
      <div class="boot-welle"></div><div class="boot-welle w2"></div></div>
    <div class="boot-rechts"><div class="b-kopf">DATENSTROM</div><div class="b-hex"></div><div class="b-meter"></div></div>
    <div class="boot-unten"><div class="boot-titel">&nbsp;</div><div class="b-status">&nbsp;</div>
      <div class="b-balken"><i></i></div><div class="b-prozent">0 %</div></div>
    <div class="boot-blitz"></div>`;
  document.body.appendChild(b);
  const ton = { a: bootTon() };
  const statusP = Promise.race([api("/status").catch(() => ({})), new Promise((r) => setTimeout(() => r({}), 800))]);
  const stabP = Promise.race([api("/stab").catch(() => null), new Promise((r) => setTimeout(() => r(null), 900))]);
  const ein = await Promise.race([api("/einstellungen").catch(() => ({})), new Promise((r) => setTimeout(() => r({}), 600))]);
  const vorlauf = ein.klang !== false ? await tonStarten(ton.a) : null;
  const st = await statusP;
  const sd = await stabP;                       // läuft parallel zu /status – verzögert den Start nicht spürbar
  // Start: Bild und Ton gleichzeitig (läuft der Ton schon ein paar Millisekunden, zieht das Bild nach)
  const versatz = Math.min(.6, vorlauf || 0);
  const t0 = performance.now() - versatz * 1000;
  b.classList.add("los");
  uiLog(`Startsequenz läuft (Ton: ${vorlauf === null ? (ein.klang === false ? "aus" : "blockiert") : "ja"}, `
        + `Bewegung reduziert: ${matchMedia("(prefers-reduced-motion: reduce)").matches ? "ja" : "nein"})`);
  const stopLeinwand = bootLeinwand(b.querySelector(".boot-cv"), t0, ZUEND);
  // Stab meldet sich: Embleme der aktiven Agenten erscheinen auf einem Ring um den Kern und werden beim Laden hineingezogen
  const agK = sd && sd.aktiv ? (sd.agenten || []).filter((a) => a.aktiv !== false).map((a) => a.kuerzel) : [];
  if (agK.length) {
    const R = 222, n = agK.length;
    const teile = agK.map((k, i) => {
      const w = -Math.PI / 2 + (i / n) * Math.PI * 2, co = Math.cos(w), si = Math.sin(w);
      const x = 200 + co * R, y = 200 + si * R, d = (4.4 + i * .18).toFixed(2);
      return `<line x1="${(200 + co * 112).toFixed(1)}" y1="${(200 + si * 112).toFixed(1)}" x2="${(x - co * 30).toFixed(1)}" y2="${(y - si * 30).toFixed(1)}" pathLength="1" class="b-al" style="animation-delay:${d}s"/>
        <g class="b-ag" style="transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px;animation-delay:${d}s">${stabLogo(k).replace("<svg ", `<svg x="${(x - 25).toFixed(1)}" y="${(y - 25).toFixed(1)}" width="50" height="50" `)}
        <text x="${x.toFixed(1)}" y="${(y + 39).toFixed(1)}" class="b-agt">${esc(STAB_NAMEN[k] || k)}</text></g>`;
    }).join("");
    b.querySelector(".boot-svg").insertAdjacentHTML("beforeend", `<g class="b-stab">${teile}</g>`);
  }
  const zeilen = [
    ["KERN", `v${st.version || "?"} · ${st.host || "MAC"}`], ["WACHE", "AKTIV"],
    ["LOKALES MODELL", String(st.lokal || "–").split(" ")[0]], ["CLAUDE", String(st.claude || "–").split(" ")[0]],
    ["ARCHIV", `${st.index?.dateien ?? "–"} DATEIEN`], ["WERKZEUGE", `${st.werkzeuge ?? "–"} GELADEN`],
    ["SPRACHE", "ELEVENLABS · WHISPER"], ["SICHERHEIT", st.notaus ? "NOT-AUS AKTIV" : "RECHTE GEPRÜFT"],
    ["STAB", agK.length ? `${agK.length} AGENTEN BEREIT` : (sd ? "AUS" : "–")], ["SYSTEME", "BEREIT"]];
  const STATUS = [[0, "INITIALISIERE KERN …"], [2.2, "STARTE NEURONALES NETZ …"], [3.6, "LADE SPRACHMODELLE …"],
    [5.0, "VERBINDE ARCHIV UND DIENSTE …"], ...(agK.length ? [[5.6, "STAB MELDET EINSATZBEREITSCHAFT …"]] : []), [6.3, "KALIBRIERE SENSORIK …"], [7.4, "ENERGIE WIRD GEBÜNDELT …"], [ZUEND, "ONLINE"]];
  const links = b.querySelector(".boot-links"), hex = b.querySelector(".b-hex"), meter = b.querySelector(".b-meter");
  const balken = b.querySelector(".b-balken i"), proz = b.querySelector(".b-prozent"), titel = b.querySelector(".boot-titel");
  const status = b.querySelector(".b-status");
  let ende = false; const timer = [];
  const spaeter = (s, f) => timer.push(setTimeout(() => { if (!ende) f(); }, Math.max(0, s - versatz) * 1000));
  zeilen.forEach(([k, v], i) => spaeter(2.2 + i * .5, () => {
    const d = document.createElement("div"); d.innerHTML = `<span>${esc(k)}</span><b>${esc(v)}</b><em>[ OK ]</em>`;
    links.appendChild(d);
  }));
  STATUS.forEach(([s, txt]) => spaeter(s, () => { status.textContent = txt; status.classList.remove("neu"); void status.offsetWidth; status.classList.add("neu"); }));
  ["KERN", "SPRACHE", "ARCHIV", "NETZ", "ENERGIE"].forEach((n, i) => {
    const m = document.createElement("div"); m.className = "b-m";
    m.innerHTML = `<span>${n}</span><i style="animation-delay:${(2.6 + i * .7).toFixed(2)}s"></i>`; meter.appendChild(m);
  });
  const hexIv = setInterval(() => {
    if (ende || performance.now() - t0 < 1800) return;
    const z = Array.from({ length: 4 }, () => Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, "0")).join(" ");
    const d = document.createElement("div"); d.textContent = z; hex.appendChild(d);
    while (hex.children.length > 11) hex.firstChild.remove();
  }, 80);
  (function fortschritt() {
    if (ende) return;
    const p = Math.min(1, (performance.now() - t0) / ((ZUEND - .2) * 1000));
    const e = 1 - Math.pow(1 - p, 1.6);
    balken.style.width = `${(e * 100).toFixed(1)}%`; proz.textContent = `${Math.round(e * 100)} %`;
    if (p < 1) requestAnimationFrame(fortschritt);
  })();
  const ZIEL = "J · A · R · V · I · S", ZEICHEN = "#%&$@*+=?/<>01XΛΣΔ";
  spaeter(6.6, () => {
    titel.classList.add("an"); let n = 0;
    const iv = setInterval(() => {
      n += .45;
      titel.textContent = [...ZIEL].map((ch, i) => (ch === " " || ch === "·" || i < n) ? ch : ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)]).join("");
      if (n >= ZIEL.length || ende) { clearInterval(iv); titel.textContent = ZIEL; }
    }, 45);
  });
  spaeter(7.4, () => b.classList.add("laden"));
  spaeter(8.2, () => b.classList.add("beben"));
  spaeter(ZUEND, () => { b.classList.add("zuend"); window.jarvis3d?.ignite?.(); });
  spaeter(ZUEND + .25, () => b.classList.add("weg"));
  const fertig = (abbruch) => {
    if (ende) return; ende = true;
    timer.forEach(clearTimeout); clearInterval(hexIv);
    if (abbruch) {
      try { ton.a.volume = 0; ton.a.pause(); } catch (e) {}
      window.jarvis3d?.ignite?.(); b.classList.add("weg");
    }
    setTimeout(() => { stopLeinwand(); b.remove(); }, abbruch ? 900 : 200);
  };
  spaeter(DAUER, () => fertig(false));
  b.addEventListener("click", () => fertig(true));
  const taste = (e) => { if (["Escape", "Enter", " "].includes(e.key)) { document.removeEventListener("keydown", taste); fertig(true); } };
  document.addEventListener("keydown", taste);
}
$("stilbtn").addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const an = !bootAn();
  try { localStorage.setItem("jarvis-boot", an ? "an" : "aus"); } catch (err) {}
  toast(`Startsequenz ${an ? "eingeschaltet" : "ausgeschaltet"}`);
});
const _handleBoot = handle;
handle = function (ev) {
  if (ev.type === "update") { try { sessionStorage.setItem("jarvis-nach-update", "1"); } catch (e) {} }
  if (ev.type === "vergessen") {
    const el = addMsg("atlas", ev.text); el.querySelector(".who").textContent = "JARVIS · WOCHENCHECK"; sfx("ask"); return;
  }
  _handleBoot(ev);
  if (ev.type === "transkript" && ev.status === "fertig" && /telefon/i.test(ev.titel || "")) {
    const el = [...chat.querySelectorAll(".msg.atlas")].pop();
    if (el) el.querySelector(".who").textContent = "JARVIS · TELEFONNOTIZ";
  }
};
window.startsequenz = () => bootSequenz(true);          // auch aus dem App-Menü „Startsequenz abspielen“
bootSequenz();
QUICK.vergessen = "Was habe ich vergessen? Nutze 'was_vergessen' und nenne die drei Punkte knapp.";


// =====================================================================
//  DOKUMENT-SCAN: das Blatt fliegt in den Kern, eine Lichtlinie liest es
// =====================================================================
let letzterDrop = null;
window.addEventListener("drop", (e) => { letzterDrop = { x: e.clientX, y: e.clientY }; }, true);
function dokScan(d) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { window.jarvis3d?.tool("dokument"); return; }
  const st = $("stage").getBoundingClientRect();
  const start = letzterDrop || { x: innerWidth / 2, y: innerHeight - 120 }; letzterDrop = null;
  const ziel = { x: st.left + st.width / 2, y: st.top + st.height * .44 };
  const el = document.createElement("div"); el.className = "dok-blatt";
  el.innerHTML = `<div class="db-seite"><img alt=""><div class="db-ersatz"><b></b><i></i><i></i><i></i><i></i><i></i></div>
    <div class="db-linie"></div></div><div class="db-marken"></div>`;
  el.querySelector(".db-ersatz b").textContent = d.name;
  const img = el.querySelector("img");
  img.onload = () => el.classList.add("hat-bild");
  img.src = `/dokument/${encodeURIComponent(d.id)}/seite`;
  const marken = el.querySelector(".db-marken");
  (d.fristen || []).forEach((f, i) => {
    const m = document.createElement("div"); m.className = "db-marke"; m.style.animationDelay = `${1.05 + i * .25}s`;
    m.textContent = `◆ ${f.art.toUpperCase()} ${fdat(f.datum)}`; marken.appendChild(m);
  });
  document.body.appendChild(el);
  const w = 250, h = 340;
  el.style.left = `${ziel.x - w / 2}px`; el.style.top = `${ziel.y - h / 2}px`;
  const dx = start.x - ziel.x, dy = start.y - ziel.y;
  const halten = 1500 + (d.fristen?.length || 0) * 250;
  el.animate([
    { transform: `translate(${dx}px, ${dy}px) scale(.35) rotateX(0deg) rotateY(0deg)`, opacity: 0 },
    { transform: `translate(${dx * .3}px, ${dy * .3}px) scale(.8) rotateX(14deg) rotateY(-22deg)`, opacity: 1, offset: .14 },
    { transform: "translate(0,0) scale(1) rotateX(8deg) rotateY(-14deg)", opacity: 1, offset: .26 },
    { transform: "translate(0,0) scale(1) rotateX(8deg) rotateY(-8deg)", opacity: 1, offset: .78 },
    { transform: "translate(0,0) scale(.04) rotateX(0deg) rotateY(0deg)", opacity: 0 },
  ], { duration: 700 + halten + 600, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" });
  setTimeout(() => window.jarvis3d?.tool("dokument"), 500);
  setTimeout(() => { window.jarvis3d?.tool("dokument"); sfx("done"); }, 700 + halten + 300);
  setTimeout(() => el.remove(), 700 + halten + 700);
}
const _anhaengenScan = anhaengen;
anhaengen = async function (dateien) {
  const vorher = ANH.liste.length;
  await _anhaengenScan(dateien);
  ANH.liste.slice(vorher).forEach((d, i) => setTimeout(() => dokScan(d), i * 450));
};


// =====================================================================
//  TELEFONNOTIZ: ⌥⌘N (auch global in der App), „Notiz“ / „Notiz beenden“
// =====================================================================
window.telefonnotiz = function () {
  if (REC.aktiv) { recStop(); toast("Telefonnotiz beendet – fasse zusammen …"); return; }
  recStart("Telefonnotiz"); toast("Telefonnotiz läuft – ⌥⌘N oder „Notiz beenden“ zum Stoppen");
};
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.metaKey && (e.key === "n" || e.key === "N" || e.code === "KeyN")) { e.preventDefault(); window.telefonnotiz(); }
});
const _sendTextNotiz = sendText;
sendText = function (text, viaVoice = false) {
  const t = (text || "").trim().toLowerCase().replace(/[.!]+$/, "");
  if (!REC.aktiv && /^(notiz|telefonnotiz|notiz starten|nimm (das gespräch )?auf|aufnahme starten)$/.test(t)) { window.telefonnotiz(); return; }
  if (REC.aktiv && /^(notiz|aufnahme|telefonnotiz) (beenden|stopp|stop|ende)$|^(stopp aufnahme|aufnahme aus)$/.test(t)) { window.telefonnotiz(); return; }
  return _sendTextNotiz(text, viaVoice);
};


// =====================================================================
//  DATEIPFAD → ORDNER IM FINDER · KONTAKTE AUS FOTOS · IMPORT AUS DER APP
// =====================================================================
window.addEventListener("jarvis-ordner-klick", async (e) => {
  try {
    await api("/archiv/ordner", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: e.detail.pfad }) });
    sfx("ok"); toast("Ordner im Finder geöffnet");
  } catch (err) { toast("Ordner konnte nicht geöffnet werden"); }
});

const KFELDER = [["vorname", "VORNAME"], ["nachname", "NACHNAME"], ["firma", "FIRMA"], ["position", "FUNKTION"],
  ["emails", "E-MAIL"], ["telefone", "TELEFON"], ["strasse", "STRASSE"], ["plz", "PLZ"], ["ort", "ORT"], ["webseite", "WEBSEITE"]];
function kontaktKarte(ev) {
  document.querySelector(".kontakt-karte")?.remove();
  const f = ev.felder || {};
  const wert = (k) => k === "emails" ? (f.emails || []).join(", ")
    : k === "telefone" ? (f.telefone || []).map((t) => `${t.art === "mobile" ? "mobil" : t.art === "fax" ? "fax" : "tel"} ${t.nummer}`).join(", ")
    : (f[k] || "");
  const k = document.createElement("div"); k.className = "karte kontakt-karte";
  k.innerHTML = `<div class="nk-kopf">👤 NEUER KONTAKT · BITTE PRÜFEN</div>
    ${(ev.vorhanden || []).length ? `<div class="k-klein warn">Ähnlicher Kontakt vorhanden: ${esc(ev.vorhanden.join(", "))}</div>` : ""}
    <div class="k-raster">${KFELDER.map(([key, lab]) => `<label class="k-feld">${lab}<input data-k="${key}" value="${esc(wert(key))}"></label>`).join("")}</div>
    <div class="nk-knoepfe"><button type="button" data-a="anlegen" class="primaer">ANLEGEN</button><button type="button" data-a="zu">VERWERFEN</button></div>`;
  k.addEventListener("click", async (e) => {
    const a = e.target.dataset.a; if (!a) return; e.stopPropagation();
    if (a === "zu") { k.remove(); return; }
    const neu = {};
    k.querySelectorAll("input[data-k]").forEach((i) => { neu[i.dataset.k] = i.value.trim(); });
    neu.emails = neu.emails ? neu.emails.split(/[,;\s]+/).filter(Boolean) : [];
    neu.telefone = neu.telefone ? neu.telefone.split(",").map((t) => t.trim()).filter(Boolean).map((t) => {
      const m = t.match(/^(mobil|fax|tel)\s+(.*)$/i);
      return { art: m ? ({ mobil: "mobile", fax: "fax", tel: "work" }[m[1].toLowerCase()]) : "work", nummer: m ? m[2] : t };
    }) : [];
    try {
      const r = await api("/kontakt/anlegen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ felder: neu }) });
      toast(`Kontakt „${r.angelegt}“ angelegt`); sfx("done"); k.remove();
    } catch (err) { toast("Kontakt konnte nicht angelegt werden (Kontakte-Zugriff erlauben?)"); sfx("warn"); }
  });
  $("karten").appendChild(k); sfx("ask");
}
const _handleKontakt = handle;
handle = function (ev) {
  if (ev.type === "kontakt_vorschlag") { kontaktKarte(ev); return; }
  _handleKontakt(ev);
};
// Aus der JARVIS-App („Ablage → Dokument vom iPhone“): fertig gelesenes Dokument als Anhang übernehmen
window.anhangVonApp = function (d) {
  if (!d || !d.id) return;
  if (body.classList.contains("rein")) tippen(true);
  ANH.liste.push(d); ANH.zeigen(); dokScan(d); input.focus();
  input.placeholder = "Frage zum Dokument – oder einfach SENDEN für eine Zusammenfassung";
};
window.importStatus = function (text) { toast(text); };


// =====================================================================
//  GESPRÄCHSMODUS: nach der Antwort weiter zuhören, Dazwischenreden unterbricht
// =====================================================================
V.gespraech = true; V.unterbrechen = true; V.hoert = false; V.dialog = false; V.turnFertig = true;
function setGesprBtn() {
  const txt = !V.gespraech ? "AUS" : V.unterbrechen ? "AN" : "OHNE STOPP";
  $("gesprbtn").textContent = `GESPRÄCH: ${txt}`;
  $("gesprbtn").title = !V.gespraech ? "Gesprächsmodus aus"
    : V.unterbrechen ? "Nach jeder gesprochenen Antwort weiter zuhören; Dazwischenreden unterbricht JARVIS"
    : "Nach jeder gesprochenen Antwort weiter zuhören; JARVIS redet aus";
  $("gesprbtn").classList.toggle("on", V.gespraech); $("gesprbtn").setAttribute("aria-pressed", String(V.gespraech));
}
$("gesprbtn").addEventListener("click", () => {          // AN → OHNE STOPP → AUS → AN
  if (V.gespraech && V.unterbrechen) V.unterbrechen = false;
  else if (V.gespraech) V.gespraech = false;
  else { V.gespraech = true; V.unterbrechen = true; }
  setGesprBtn();
  api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ gespraech: V.gespraech, unterbrechen: V.unterbrechen }) }).catch(() => {});
  if (!V.gespraech || !V.unterbrechen) gespraechAus();
});
api("/einstellungen").then((st) => {
  V.gespraech = st.gespraech !== false; V.unterbrechen = st.unterbrechen !== false; setGesprBtn();
}).catch(setGesprBtn);

function awsSend(o) { if (V.aws && V.aws.readyState === 1) { V.aws.send(JSON.stringify(o)); return true; } return false; }
function gespraechAus() { if (V.hoert) awsSend({ ptt: "idle" }); V.hoert = false; if (coreState === "listen" && !V.ptt) setState("idle"); }

// JARVIS beginnt zu sprechen → auf Dazwischenreden achten
window.sprichtGerade = async function () {
  if (!V.gespraech || !V.unterbrechen || !V.dialog || V.ptt || V.monitorAn) return;
  V.monitorAn = true;
  if (!(await micOpen()) || !(await openAudioWs())) return;
  V.hoert = true; awsSend({ ptt: "monitor" });
};
// Antwort fertig und ausgesprochen → kurz weiter zuhören
function weiterZuhoeren() {
  if (!V.gespraech || !V.dialog || !V.turnFertig || play.running || V.ptt || $("send").disabled) return;
  setTimeout(async () => {
    if (play.running || V.ptt || $("send").disabled || !V.dialog) return;
    if (!(await micOpen()) || !(await openAudioWs())) return;
    V.hoert = true; awsSend({ ptt: "listen", sek: 6 }); setState("listen");
    clearTimeout(V.idleTimer);
  }, 250);
}
window.fertigGesprochen = weiterZuhoeren;
// Nutzer redet dazwischen
window.dazwischen = function () {
  ttsStop(); V.hoert = true;
  if ($("send").disabled && ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "stop" }));
  $("micbtn").classList.add("rec"); setState("listen");
};

const _sendGespr = sendText;
sendText = function (text, viaVoice = false) {
  V.dialog = !!viaVoice; V.turnFertig = false; V.monitorAn = false;
  if (!viaVoice) gespraechAus();
  return _sendGespr(text, viaVoice);
};
const _handleGespr = handle;
handle = function (ev) {
  _handleGespr(ev);
  if (ev.type === "done" || ev.type === "error") {
    V.turnFertig = true;
    if (V.wartend) {                                     // während der Antwort gesprochen
      const t = V.wartend; V.wartend = ""; setTimeout(() => sendText(t, true), 30); return;
    }
    if (!play.running) {
      if (V.hoert && !V.ptt) gespraechAus();             // Monitor beenden, falls nichts gesprochen wurde
      weiterZuhoeren();
    }
  }
};
// Tippen beendet das Zuhören
input.addEventListener("focus", () => { if (V.hoert && coreState === "listen") gespraechAus(); });


// =====================================================================
//  EINSTELLUNGEN (⚙ / ⌘,) und FUNKTIONSLISTE
// =====================================================================
function einstAktualisieren() {
  document.querySelectorAll("#einst [data-proxy]").forEach((b) => {
    const z = $(b.dataset.proxy); if (!z) return;
    b.textContent = z.textContent.trim() || "–";
    b.classList.toggle("an", z.classList.contains("on") || z.getAttribute("aria-pressed") === "true");
  });
}
window.einstellungenOeffnen = function () {
  einstAktualisieren(); $("einst").hidden = false;
  api("/status").then((s) => {
    const kurz = (x) => String(x || "–").split("/").pop();
    $("einst-system").innerHTML = [
      `VERSION ${esc(s.version)} · STAND ${esc(s.update?.commit || "–")} ${s.update?.hinweis ? "· " + esc(s.update.hinweis) : ""}`,
      `CLAUDE ${esc(kurz(s.claude))} · LOKAL ${esc(s.lokal || "–")}`,
      `ARCHIV ${esc(kurz(s.archiv))} · ICLOUD ${esc(s.icloud)}`,
      `BENUTZER ${esc(s.name)} @ ${esc(s.host)}`,
      ...(s.kennung ? [`INSTALLATIONS-KENNUNG <b>${esc(s.kennung)}</b>`] : [])].join("<br>");
  }).catch(() => { $("einst-system").textContent = "Status nicht verfügbar"; });
};
function einstZu() { $("einst").hidden = true; }
$("einstbtn").addEventListener("click", () => window.einstellungenOeffnen());
$("rh-einst").addEventListener("click", () => window.einstellungenOeffnen());
$("einst-zu").addEventListener("click", einstZu);
$("einst").addEventListener("click", (e) => { if (e.target === $("einst")) einstZu(); });
document.querySelectorAll("#einst [data-proxy]").forEach((b) => b.addEventListener("click", () => {
  $(b.dataset.proxy)?.click(); setTimeout(einstAktualisieren, 60);
}));
$("einst-boot").addEventListener("click", () => { einstZu(); window.startsequenz?.(); });
$("einst-tour").addEventListener("click", () => { einstZu(); window.einfuehrung(true); });
$("einst-liste").addEventListener("click", () => { einstZu(); window.funktionslisteZeigen(); });
document.addEventListener("keydown", (e) => {
  if (e.metaKey && e.key === ",") { e.preventDefault(); window.einstellungenOeffnen(); }
  else if (e.key === "Escape" && !$("einst").hidden) einstZu();
});

// Markdown mit Tabellen (für FUNKTIONEN.md)
function mdTabellen(src) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  let html = "", tab = null, liste = false;
  const tabZu = () => { if (tab) { html += "</tbody></table>"; tab = null; } };
  for (const z of src.split("\n")) {
    const l = z.trim();
    if (/^\|.*\|$/.test(l)) {
      const zellen = l.slice(1, -1).split("|").map((x) => x.trim());
      if (zellen.every((x) => /^:?-{2,}:?$/.test(x))) continue;
      if (!tab) { tab = true; html += `<table><thead><tr>${zellen.map((x) => `<th>${inline(x)}</th>`).join("")}</tr></thead><tbody>`; }
      else html += `<tr>${zellen.map((x) => `<td>${inline(x)}</td>`).join("")}</tr>`;
      continue;
    }
    tabZu();
    const li = l.match(/^[-*]\s+(.*)$/);
    if (li) { if (!liste) { html += "<ul>"; liste = true; } html += `<li>${inline(li[1])}</li>`; continue; }
    if (liste) { html += "</ul>"; liste = false; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { if (h[1].length > 1) html += `<h4>${inline(h[2])}</h4>`; }
    else if (l && l !== "---") html += `<p>${inline(l)}</p>`;
  }
  tabZu(); if (liste) html += "</ul>";
  return html;
}
window.funktionslisteZeigen = async function () {
  let t = "";
  try { t = (await api("/funktionen")).text; } catch (e) {}
  if (!t) { toast("Funktionsliste nicht gefunden"); return; }
  $("ansicht-titel").textContent = "WAS JARVIS KANN";
  $("ansicht-inhalt").innerHTML = `<div class="funktionsliste">${mdTabellen(t)}</div>`;
  $("ansicht-quellen").innerHTML = "";
  const a = $("ansicht"); a.hidden = false; a.classList.remove("mat"); void a.offsetWidth; a.classList.add("mat");
};


// =====================================================================
//  EINFÜHRUNG: geführte Tour nach der Erstinstallation, jederzeit wiederholbar
// =====================================================================
const TOUR = { aktiv: false, i: 0, warte: null, erledigt: false, vorherRein: false, timer: null };
const tourName = () => (document.getElementById("who")?.dataset?.name || "").trim();
const SCHRITTE = [
  { titel: "Willkommen", text: () => `Schön, dass du da bist${tourName() ? ", " + tourName() : ""}. Ich bin JARVIS, dein persönlicher Assistent. Ich kümmere mich um Termine, Erinnerungen, die Einkaufsliste, Mails und Dokumente. In etwa drei Minuten zeige ich dir, wie wir zusammenarbeiten. Mit Escape kannst du jederzeit abbrechen.` },
  { titel: "Das bin ich", ziel: "#stage", demo: true,
    text: "Dieser Kern zeigt dir, was ich gerade tue. Höre ich zu, pulsiert er mit deiner Stimme. Denke ich nach, fließen Daten zu mir. Spreche ich, laufen Wellen nach außen." },
  { titel: "Sprich mit mir", ziel: "#micbtn", aufgabe: "stimme",
    text: "Am schnellsten geht es per Sprache. Halte die Leertaste gedrückt, sprich, und lass wieder los.",
    hinweis: "Probier es: <kbd>Leertaste</kbd> halten und sagen „Wie wird das Wetter morgen?“" },
  { titel: "Oder schreib", ziel: ".inputline", aufgabe: "text",
    text: "Du kannst mir genauso gut schreiben. Enter schickt die Nachricht ab.",
    hinweis: "Schreib „Was steht heute an?“ und drück <kbd>Enter</kbd>." },
  { titel: "Wie ein Gespräch", ziel: ".voicectl",
    text: "Mit GESPRÄCH höre ich nach meiner Antwort noch ein paar Sekunden zu – du kannst einfach weiterreden. Fällst du mir ins Wort, höre ich auf. Mit WECKWORT reagiere ich auf „Hey Jarvis“, ganz ohne Taste. STIMME legt fest, wann ich vorlese." },
  { titel: "Dein Tag auf einen Blick", ziel: ".panel.left",
    text: "Links siehst du deinen Tag: Wetter, Termine, Erinnerungen und Geburtstage. Ich halte alles aktuell." },
  { titel: "Lage und System", ziel: ".panel.right",
    text: "Rechts stehen wichtige Mails, laufende Vorgänge, meine letzten Aktionen und der Systemzustand. NOT-AUS stoppt alle Änderungen – dann lese ich nur noch." },
  { titel: "Ein Klick genügt", ziel: "#quick",
    text: "Die Schnellknöpfe: Tageslage, Posteingang, Wochenplanung, Fristen – und „Vergessen?“, wenn du wissen willst, was liegen geblieben ist." },
  { titel: "Dokumente", ziel: "#anhbtn",
    text: "Zieh ein Dokument einfach ins Fenster oder klick auf Plus. Ich lese es zuerst auf deinem Mac – ob Claude es sehen darf, frage ich dich jedes Mal." },
  { titel: "Darauf kannst du dich verlassen",
    text: "Bevor ich etwas lösche, sende oder in deinen Dateien ändere, frage ich nach. Passwörter und Kontonummern speichere ich nie. Private Themen wie Gesundheit oder Finanzen bleiben auf deinem Mac." },
  { titel: "Nur der Kern", ziel: "#reinbtn",
    text: "Mit REDUZIERT oder der Taste D blendest du alles aus – dann bin nur ich zu sehen, mit Untertiteln. D bringt das Dashboard zurück." },
  { titel: "Los geht's", ziel: "#einstbtn", ende: true,
    text: "Probier zum Beispiel: „Setz Milch auf die Einkaufsliste“, „Erinnere mich morgen um acht an den Zahnarzt“ oder „Zeig mir meine Woche“. Frag mich jederzeit „Was kannst du?“. Diese Einführung findest du wieder unter Einstellungen – oder sag einfach „Starte die Einführung“." },
];

function tourSprich(t) {
  if (V.out === "aus") return;
  ttsStop(); unlockAudio(); V.turnLang = "de"; V.privat = false;
  ttsSay(t.replace(/<[^>]+>/g, ""));
}
function tourZiel(s) {
  if (!s.ziel) return null;
  const el = document.querySelector(s.ziel); if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 4 && r.height > 4 ? r : null;
}
function tourPlatzieren() {
  if (!TOUR.aktiv) return;
  const s = SCHRITTE[TOUR.i], r = tourZiel(s), k = $("tour-karte"), spot = $("tour-spot");
  const kw = k.offsetWidth, kh = k.offsetHeight, W = innerWidth, H = innerHeight, rand = 16;
  $("tour").classList.toggle("dunkel", !r);
  if (!r) {
    spot.hidden = true;
    k.style.left = `${(W - kw) / 2}px`; k.style.top = `${Math.max(rand, (H - kh) / 2)}px`; return;
  }
  spot.hidden = false;
  const p = 8;
  Object.assign(spot.style, { left: `${r.left - p}px`, top: `${r.top - p}px`, width: `${r.width + 2 * p}px`, height: `${r.height + 2 * p}px` });
  let top, left;
  if (r.bottom + p + 14 + kh < H - rand) top = r.bottom + p + 14;                 // darunter
  else if (r.top - p - 14 - kh > rand) top = r.top - p - 14 - kh;                // darüber
  else { top = Math.max(rand, (H - kh) / 2);                                     // daneben
    left = r.right + p + 14 + kw < W - rand ? r.right + p + 14 : r.left - p - 14 - kw; }
  if (left === undefined) left = r.left + r.width / 2 - kw / 2;
  k.style.left = `${Math.min(W - kw - rand, Math.max(rand, left))}px`;
  k.style.top = `${Math.min(H - kh - rand, Math.max(rand, top))}px`;
}
function tourDemo() {
  const folge = ["listen", "think", "speak", "idle"]; let n = 0;
  clearInterval(TOUR.timer);
  TOUR.timer = setInterval(() => {
    if (!TOUR.aktiv || !SCHRITTE[TOUR.i].demo) { clearInterval(TOUR.timer); return; }
    const st = folge[n++ % folge.length]; setState(st);
    $("tour-aufgabe").hidden = false; $("tour-aufgabe").className = "tour-aufgabe";
    $("tour-aufgabe").textContent = { listen: "◉ ZUHÖREN", think: "◌ DENKEN", speak: "◎ SPRECHEN", idle: "· BEREIT" }[st];
  }, 1700);
}
function tourZeige(i) {
  TOUR.i = Math.max(0, Math.min(SCHRITTE.length - 1, i));
  const s = SCHRITTE[TOUR.i], text = typeof s.text === "function" ? s.text() : s.text;
  TOUR.warte = s.aufgabe || null; TOUR.erledigt = false; TOUR.gesendet = null;
  $("tour-nr").textContent = `${TOUR.i + 1} / ${SCHRITTE.length}`;
  $("tour-titel").textContent = s.titel; $("tour-text").textContent = text;
  const auf = $("tour-aufgabe");
  auf.hidden = !s.hinweis; auf.className = "tour-aufgabe"; auf.innerHTML = s.hinweis || "";
  $("tour-zurueck").style.visibility = TOUR.i === 0 ? "hidden" : "visible";
  $("tour-skip").hidden = !s.aufgabe;
  $("tour-weiter").textContent = TOUR.i === 0 ? "LOS GEHT'S" : s.ende ? "FERTIG" : "WEITER";
  $("tour-weiter").disabled = false;
  $("tour-karte").style.setProperty("--fort", `${Math.round(((TOUR.i + 1) / SCHRITTE.length) * 100)}%`);
  $("tour-punkte").innerHTML = SCHRITTE.map((_, n) => `<i class="${n <= TOUR.i ? "an" : ""}"></i>`).join("");
  if (s.aufgabe === "text") setTimeout(() => input.focus(), 300);
  if (s.demo) tourDemo(); else { clearInterval(TOUR.timer); if (["listen", "speak"].includes(coreState) && !play.running) setState("idle"); }
  requestAnimationFrame(tourPlatzieren); setTimeout(tourPlatzieren, 500);
  if (document.activeElement?.closest?.("#tour")) document.activeElement.blur();   // Leertaste soll nicht „Weiter“ drücken
  if (TOUR.i > 0) tourSprich(text);
}
function tourAufgabeErledigt() {
  TOUR.erledigt = true; TOUR.warte = null;
  const auf = $("tour-aufgabe"); auf.hidden = false; auf.className = "tour-aufgabe ok";
  auf.textContent = "✓ Sehr gut – genau so.";
  $("tour-skip").hidden = true;
  const i = TOUR.i;
  const weiter = () => { if (TOUR.aktiv && TOUR.i === i) tourZeige(i + 1); };
  (function warte(n) {                                   // erst weiter, wenn die Antwort ausgesprochen ist
    if (!TOUR.aktiv || TOUR.i !== i) return;
    if ((play.running || $("send").disabled) && n < 60) setTimeout(() => warte(n + 1), 500);
    else setTimeout(weiter, 1200);
  })(0);
}
function tourEnde(gesehen = true) {
  TOUR.aktiv = false; clearInterval(TOUR.timer); ttsStop();
  $("tour").hidden = true;
  if (["listen", "think", "speak"].includes(coreState) && !$("send").disabled) setState("idle");
  if (TOUR.vorherRein) setRein(true, false);
  if (gesehen) api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ einfuehrung_gesehen: true, einfuehrung_offen: false }) }).catch(() => {});
}
window.einfuehrung = function (sofort = false) {
  if (TOUR.aktiv) return;
  einstZu?.(); $("ansicht").hidden = true;
  TOUR.vorherRein = body.classList.contains("rein");
  if (TOUR.vorherRein) setRein(false, false);
  if (document.body.classList.contains("fokus")) setFokus(false);
  TOUR.aktiv = true; $("tour").hidden = false;
  tourZeige(0);
  if (sofort) setTimeout(() => tourSprich(SCHRITTE[0].text()), 200);
};
$("tour-weiter").addEventListener("click", () => {
  unlockAudio();
  const s = SCHRITTE[TOUR.i];
  if (s.ende) { tourEnde(true); toast("Einführung abgeschlossen – jederzeit wieder unter ⚙ Einstellungen"); return; }
  tourZeige(TOUR.i + 1);
});
$("tour-zurueck").addEventListener("click", () => tourZeige(TOUR.i - 1));
$("tour-skip").addEventListener("click", () => tourZeige(TOUR.i + 1));
$("tour-zu").addEventListener("click", () => { tourEnde(true); toast("Einführung jederzeit wieder unter ⚙ Einstellungen"); });
document.addEventListener("keydown", (e) => {
  if (!TOUR.aktiv || !$("modal").hidden) return;
  if (e.key === "Escape") { e.preventDefault(); tourEnde(true); toast("Einführung jederzeit wieder unter ⚙ Einstellungen"); }
  else if (e.key === "ArrowRight" && document.activeElement !== input && !SCHRITTE[TOUR.i].aufgabe) $("tour-weiter").click();
  else if (e.key === "ArrowLeft" && document.activeElement !== input && TOUR.i > 0) tourZeige(TOUR.i - 1);
}, true);
addEventListener("resize", tourPlatzieren);
setInterval(tourPlatzieren, 1200);                       // Ziele können sich verschieben

// Aufgaben erkennen: gesprochene bzw. getippte Frage, Abschluss bei „done“
const _sendTourWrap = sendText;
sendText = function (text, viaVoice = false) {
  if (TOUR.aktiv && TOUR.warte) TOUR.gesendet = { stimme: !!viaVoice };
  return _sendTourWrap(text, viaVoice);
};
const _handleTour = handle;
handle = function (ev) {
  _handleTour(ev);
  if (ev.type === "einfuehrung") { window.einfuehrung(true); return; }
  if (TOUR.aktiv && TOUR.gesendet && (ev.type === "done" || ev.type === "error")) {
    const passt = TOUR.warte === "stimme" ? TOUR.gesendet.stimme : TOUR.warte === "text" ? !TOUR.gesendet.stimme : false;
    TOUR.gesendet = null;
    if (passt) tourAufgabeErledigt();
  }
};

// Nach der Erstinstallation automatisch – sobald die Startsequenz vorbei ist
api("/einstellungen").then((st) => {
  if (!st.einfuehrung_offen || st.einfuehrung_gesehen) return;
  (function warte(n) {
    if (document.querySelector(".boot") || !$("modal").hidden || n < 4) { if (n < 120) setTimeout(() => warte(n + 1), 500); return; }
    window.einfuehrung(false);
  })(0);
}).catch(() => {});


// =====================================================================
//  IPHONE: Web-App auf dem Home-Bildschirm (über Tailscale) und Siri
// =====================================================================
const MOBIL = matchMedia("(max-width: 760px)").matches && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
if (MOBIL) {
  document.body.classList.add("mobil");
  setRein(true, false);
  const _setReinM = setRein;
  setRein = function (on, save) { return _setReinM(true, false); };    // auf dem iPhone immer die reduzierte Ansicht
  $("micbtn").addEventListener("contextmenu", (e) => e.preventDefault());
  $("micbtn").addEventListener("pointerdown", (e) => { try { $("micbtn").setPointerCapture(e.pointerId); } catch (x) {} });
  $("micbtn").addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });   // kein Lupen-/Kopiermenü
}
async function iphoneBereich() {
  const el = $("einst-iphone");
  let d = {};
  try { d = await api("/iphone"); } catch (e) {}
  if (MOBIL) {
    el.innerHTML = `<ol>
      <li>Siri-Kurzbefehl laden: ${d.kurzbefehl ? `<a href="/iphone/kurzbefehl" download>„Frag Jarvis“ hinzufügen</a>` : "auf dem Mac zuerst <code>jarvis iphone</code> ausführen"}</li>
      <li>Danach: „Hey Siri, frag Jarvis“ – Siri fragt nach deiner Frage und liest die Antwort vor.</li>
      <li>Sprechen in der App: den runden Knopf gedrückt halten.</li></ol>`;
    return;
  }
  if (!d.url) {
    el.innerHTML = `<ol><li>Tailscale auf Mac und iPhone installieren (<a data-l="https://apps.apple.com/app/tailscale/id1475387142">App Store ↗</a>)
        und mit demselben Konto anmelden.</li>
      <li>Auf <a data-l="https://login.tailscale.com/admin/dns">login.tailscale.com → DNS ↗</a> „MagicDNS“ und „HTTPS Certificates“ einschalten.</li>
      <li><button type="button" id="iphone-los" class="vb-knopf">IPHONE VERBINDEN</button> <span id="iphone-st" class="vb-hilfe"></span></li></ol>
      <p class="vb-hilfe"><button type="button" id="iphone-diag" class="vb-knopf">VERBINDUNG PRÜFEN</button></p><p id="iphone-diag-aus" class="vb-hilfe"></p>`;
    el.querySelectorAll("[data-l]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); vbLink(a.dataset.l); }));
    $("iphone-los").addEventListener("click", async () => {
      $("iphone-los").disabled = true; $("iphone-st").textContent = "Richte ein … (kann bis zu einer Minute dauern)";
      try {
        const r = await vbPost("/iphone/einrichten");
        $("iphone-st").innerHTML = esc(r.text) + (r.link ? ` <a data-l2="${esc(r.link)}">Seite öffnen ↗</a>` : "");
        $("iphone-st").querySelector("[data-l2]")?.addEventListener("click", (e) => { e.preventDefault(); vbLink(r.link); });
        if (r.ok) setTimeout(iphoneBereich, 800);
      }
      catch (e) { $("iphone-st").textContent = "✕ " + e.message; }
      finally { if ($("iphone-los")) $("iphone-los").disabled = false; }
    });
    $("iphone-diag")?.addEventListener("click", async () => {
      const box = $("iphone-diag-aus"); box.textContent = "Prüfe …";
      try { const d = await api("/iphone/diagnose"); const t = d.tailscale || {};
        box.innerHTML = `<b>Tailscale:</b> ${t.installiert ? "installiert" : "nicht gefunden"}${t.version ? " · " + esc(t.version.split("-")[0]) : ""}<br>
          <b>Verbunden:</b> ${t.laeuft ? "ja" : "nein"} ${t.zustand ? "(" + esc(t.zustand) + ")" : ""}<br>
          <b>Name im Tailnet:</b> ${esc(t.dns || "– (MagicDNS aus?)")}<br><b>HTTPS-Zertifikate:</b> ${t.zertifikate ? "an" : "aus / unbekannt"}<br>
          ${t.fehler ? `<b>Meldung:</b> ${esc(t.fehler)}<br>` : ""}${d.serve ? `<b>Freigabe:</b> ${esc(d.serve)}` : ""}`;
      } catch (e) { box.textContent = "✕ " + e.message; }
    });
    return;
  }
  el.innerHTML = `<div class="qr">${d.qr || ""}</div><ol>
    <li>Tailscale auf dem iPhone verbinden.</li>
    <li>QR-Code mit der Kamera scannen, in Safari öffnen.</li>
    <li>Teilen → „Zum Home-Bildschirm“ – JARVIS ist jetzt eine App.</li>
    <li>In der iPhone-App unter ⚙ den Siri-Kurzbefehl „Frag Jarvis“ laden.</li>
    ${d.qr ? "" : "<li><b>QR-Code fehlt:</b> einmal <code>jarvis iphone</code> ausführen.</li>"}</ol>
    <p class="vb-hilfe"><button type="button" id="iphone-neu" class="vb-knopf">NEU EINRICHTEN</button></p>`;
  $("iphone-neu")?.addEventListener("click", async () => { await vbPost("/iphone/zuruecksetzen"); iphoneBereich(); });
}
const _einstOeffnenI = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenI(); iphoneBereich(); };


// =====================================================================
//  KARTE: Orte und Routen – Globus-Anflug, leuchtende Route, HUD
// =====================================================================
const KARTE = { map: null, laden: null, el: null, anim: null, marker: [] };
// MapLibre ab 6.x gibt es nur noch als ES-Modul (Sicherheitsupdate CVE-2026-85061 / GHSA-jrc7-96c5-q579).
// Das Modul findet seinen Worker (vendor/maplibre-gl-worker.mjs) selbst über import.meta.url.
const MAPLIBRE_V = "6.16.0";
function karteLib() {
  if (window.maplibregl) return Promise.resolve();
  if (KARTE.laden) return KARTE.laden;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = `vendor/maplibre-gl.css?v=${MAPLIBRE_V}`; document.head.appendChild(l);
  KARTE.laden = import(new URL(`vendor/maplibre-gl.mjs?v=${MAPLIBRE_V}`, document.baseURI).href)
    .then((m) => { window.maplibregl = m; })
    .catch((e) => { KARTE.laden = null; console.warn("Karte nicht geladen:", e); throw e; });
  return KARTE.laden;
}
function karteGeruest() {
  if (KARTE.el) return KARTE.el;
  const el = document.createElement("section");
  el.className = "karte-hud"; el.hidden = true;
  el.innerHTML = `<div class="kh-map" id="kh-map"></div><div class="kh-gitter"></div><div class="kh-scan"></div>
    <i class="kh-ecke a"></i><i class="kh-ecke b"></i><i class="kh-ecke c"></i><i class="kh-ecke d"></i>
    <header class="kh-kopf"><span class="kh-tag">NAVIGATION</span><h3 id="kh-titel"></h3>
      <button type="button" id="kh-apple" title="In Apple Karten öffnen (mit Verkehr)">IN APPLE KARTEN ↗</button>
      <button type="button" id="kh-zu" aria-label="Karte schließen">✕</button></header>
    <aside class="kh-info" id="kh-info"></aside>`;
  document.body.appendChild(el);
  el.querySelector("#kh-zu").addEventListener("click", karteZu);
  el.querySelector("#kh-apple").addEventListener("click", () => {
    const u = el.dataset.apple; if (!u) return;
    if (MOBIL) location.href = u; else api("/karte/apple", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: u }) }).catch(() => toast("Karten-App ließ sich nicht öffnen"));
  });
  KARTE.el = el; return el;
}
function karteZu() {
  if (!KARTE.el || KARTE.el.hidden) return;
  KARTE.el.classList.add("weg"); cancelAnimationFrame(KARTE.anim);
  setTimeout(() => { KARTE.el.hidden = true; KARTE.el.classList.remove("weg", "da"); }, 600);
  document.body.classList.remove("karte-offen");
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && KARTE.el && !KARTE.el.hidden && $("modal").hidden) karteZu(); });

// dunkle, kühle Optik über die OpenFreeMap-Vorlage legen
function karteEinfaerben(m) {
  for (const l of m.getStyle().layers) {
    const id = l.id, t = l.type, set = (p, v) => { try { m.setPaintProperty(id, p, v); } catch (e) {} };
    if (t === "background") set("background-color", "#020a12");
    else if (t === "fill" && /water/.test(id)) set("fill-color", "#03243a");
    else if (t === "fill" && /landuse|landcover|park|wood|grass/.test(id)) { set("fill-color", "#041722"); set("fill-opacity", .55); }
    else if (t === "fill" && /building/.test(id)) { set("fill-color", "#0a3550"); set("fill-opacity", .55); }
    else if (t === "fill-extrusion") { set("fill-extrusion-color", "#0b4a6e"); set("fill-extrusion-opacity", .6); }
    else if (t === "line" && /water|river|stream|canal/.test(id)) set("line-color", "#06405e");
    else if (t === "line" && /boundary|admin/.test(id)) { set("line-color", "#1d6c8f"); set("line-opacity", .5); }
    else if (t === "line" && /motorway|trunk/.test(id)) set("line-color", "#1ba7d6");
    else if (t === "line" && /primary|secondary/.test(id)) set("line-color", "#147aa3");
    else if (t === "line") set("line-color", "#0d4f6d");
    else if (t === "symbol") { set("text-color", "#9fe3ff"); set("text-halo-color", "#020a12"); set("text-halo-width", 1.2); set("icon-opacity", .5); }
  }
}
async function karteZeigen(d) {
  const el = karteGeruest();
  el.hidden = false; void el.offsetWidth; el.classList.add("da"); document.body.classList.add("karte-offen");
  $("kh-titel").textContent = (d.titel || "").toUpperCase();
  el.dataset.apple = d.apple || "";
  karteInfo(d);
  sfx?.("ok");
  try { await karteLib(); } catch (e) { $("kh-info").insertAdjacentHTML("beforeend", `<p class="kh-warn">Kartenansicht nicht verfügbar.</p>`); return; }
  const ml = window.maplibregl;
  const ziel = d.modus === "route" ? [d.ziel.lon, d.ziel.lat] : [d.punkte[0].lon, d.punkte[0].lat];
  if (!KARTE.map) {
    KARTE.map = new ml.Map({ container: "kh-map", style: "https://tiles.openfreemap.org/styles/dark",
      center: [ziel[0] - 40, 25], zoom: 1.2, pitch: 0, attributionControl: { compact: true }, fadeDuration: 0 });
    KARTE.map.on("style.load", () => {
      try { KARTE.map.setProjection({ type: "globe" }); } catch (e) {}
      karteEinfaerben(KARTE.map);
    });
    await new Promise((r) => { KARTE.map.once("load", r); setTimeout(r, 6000); });
  } else {
    KARTE.map.resize();
  }
  const m = KARTE.map;
  KARTE.marker.forEach((x) => x.remove()); KARTE.marker = [];
  for (const id of ["route-glut", "route-linie", "route-fluss"]) if (m.getLayer(id)) m.removeLayer(id);
  if (m.getSource("route")) m.removeSource("route");
  const marke = (p, art, text) => {
    const e = document.createElement("div"); e.className = `kh-marke ${art}`;
    e.innerHTML = `<i></i><b>${esc(text)}</b>`;
    KARTE.marker.push(new ml.Marker({ element: e }).setLngLat([p.lon, p.lat]).addTo(m));
  };
  // Anflug: vom Globus zum Ziel
  m.jumpTo({ center: [ziel[0] - 25, Math.max(-60, Math.min(60, ziel[1] - 10))], zoom: 1.6, pitch: 0, bearing: 0 });
  if (d.modus === "route") {
    const coords = d.linie || [];
    const b = coords.reduce((bb, c) => bb.extend(c), new ml.LngLatBounds(coords[0], coords[0]));
    const kamera = m.cameraForBounds(b, { padding: karteRand() }) || { center: ziel, zoom: 10 };
    m.flyTo({ ...kamera, pitch: 48, bearing: -12, duration: 4200, essential: true, curve: 1.6 });
    m.addSource("route", { type: "geojson", lineMetrics: true, data: { type: "Feature", geometry: { type: "LineString", coordinates: coords.slice(0, 2) } } });
    m.addLayer({ id: "route-glut", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#00e5ff", "line-width": 16, "line-blur": 12, "line-opacity": .45 } });
    m.addLayer({ id: "route-linie", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-width": 4.5, "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#7ff3ff", 1, "#00b8ff"] } });
    m.addLayer({ id: "route-fluss", type: "line", source: "route", layout: { "line-cap": "round" },
      paint: { "line-color": "#ffffff", "line-width": 2, "line-opacity": .85, "line-dasharray": [0, 4, 3] } });
    marke(d.start, "start", d.start.name); marke(d.ziel, "ziel", d.ziel.name);
    // Route zeichnet sich nach dem Anflug Stück für Stück
    setTimeout(() => {
      const t0 = performance.now(), dauer = 1800, n = coords.length;
      const schritt = (t) => {
        const k = Math.min(1, (t - t0) / dauer), bis = Math.max(2, Math.round(n * (1 - Math.pow(1 - k, 3))));
        m.getSource("route")?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords.slice(0, bis) } });
        if (k < 1) KARTE.anim = requestAnimationFrame(schritt); else karteFluss();
      };
      KARTE.anim = requestAnimationFrame(schritt);
    }, 3900);
  } else {
    const pts = d.punkte;
    d.punkte.forEach((p, i) => marke(p, i === 0 ? "ziel" : "ort", p.name));
    if (pts.length === 1) m.flyTo({ center: [pts[0].lon, pts[0].lat], zoom: 15.5, pitch: 55, bearing: -20, duration: 4200, essential: true, curve: 1.6 });
    else {
      const b = pts.reduce((bb, p) => bb.extend([p.lon, p.lat]), new ml.LngLatBounds([pts[0].lon, pts[0].lat], [pts[0].lon, pts[0].lat]));
      const kamera = m.cameraForBounds(b, { padding: karteRand(), maxZoom: 15 });
      m.flyTo({ ...kamera, pitch: 40, duration: 4200, essential: true });
    }
    setTimeout(() => { if (KARTE.el && !KARTE.el.hidden) m.easeTo({ bearing: m.getBearing() + 25, duration: 14000, easing: (x) => x }); }, 4400);
  }
}
function karteRand() {
  const info = $("kh-info"), w = innerWidth;
  return MOBIL ? { top: 90, bottom: 260, left: 30, right: 30 } : { top: 90, bottom: 60, left: 60, right: Math.min(420, (info?.offsetWidth || 320) + 60) };
}
function karteFluss() {                      // Lichtpunkte laufen die Route entlang
  const m = KARTE.map; if (!m || !m.getLayer("route-fluss")) return;
  const folge = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];
  let i = 0, letzte = 0;
  const lauf = (t) => {
    if (!KARTE.el || KARTE.el.hidden || !m.getLayer("route-fluss")) return;
    if (t - letzte > 70) { try { m.setPaintProperty("route-fluss", "line-dasharray", folge[i++ % folge.length]); } catch (e) {} letzte = t; }
    KARTE.anim = requestAnimationFrame(lauf);
  };
  KARTE.anim = requestAnimationFrame(lauf);
}
const kmText = (m) => m >= 10000 ? `${Math.round(m / 1000)} km` : m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.round(m)} m`;
const dauerText = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} Std. ${m % 60} Min.` : `${Math.max(1, m)} Min.`; };
function karteInfo(d) {
  const i = $("kh-info");
  if (d.modus === "route") {
    i.innerHTML = `<div class="kh-werte">
        <div><small>FAHRZEIT</small><b data-count>${esc(dauerText(d.dauer))}</b></div>
        <div><small>STRECKE</small><b>${esc(kmText(d.distanz))}</b></div>
        <div><small>ANKUNFT CA.</small><b>${esc(d.ankunft)}</b></div></div>
      <div class="kh-weg"><span>◉ ${esc(d.start.label || d.start.name)}</span><span>◆ ${esc(d.ziel.label || d.ziel.name)}</span></div>
      <div class="kh-mittel">${esc(d.verkehrsmittel || "Auto").toUpperCase()} · OHNE LIVE-VERKEHR</div>
      <ol class="kh-schritte">${(d.schritte || []).map((s, n) => `<li style="--i:${n}"><span>${esc(s.text)}</span><em>${s.m ? esc(kmText(s.m)) : ""}</em></li>`).join("")}</ol>`;
  } else {
    i.innerHTML = `<ol class="kh-orte">${d.punkte.map((p, n) => `<li style="--i:${n}"><b>${esc(p.name)}</b><span>${esc(p.label)}</span>
      <em>${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}</em></li>`).join("")}</ol>`;
  }
}
const _handleKarte = handle;
handle = function (ev) {
  if (ev.type === "karte") { karteZeigen(ev); return; }
  _handleKarte(ev);
};
// Standort mitschicken, wenn nach einer Route gefragt wird (iPhone/Browser fragt einmal um Erlaubnis)
const ROUTE_FRAGE = /\b(route|wie komme|wie weit|wie lange (brauche|fahre|dauert)|fahr(e|t)? nach|navig|weg (nach|zu)|entfernung|wo bin ich|in der nähe)/i;
const _sendKarte = sendText;
sendText = function (text, viaVoice = false) {
  if (text && ROUTE_FRAGE.test(text) && navigator.geolocation && (MOBIL || location.protocol === "https:")) {
    const absenden = (pos) => {
      const orig = ws.send.bind(ws);
      if (pos) ws.send = (s) => { try { const o = JSON.parse(s); if (o.type === "chat") { o.standort = { lat: pos.coords.latitude, lon: pos.coords.longitude }; s = JSON.stringify(o); } } catch (e) {} ws.send = orig; return orig(s); };
      return _sendKarte(text, viaVoice);
    };
    navigator.geolocation.getCurrentPosition((p) => absenden(p), () => absenden(null), { timeout: 4000, maximumAge: 300000 });
    return;
  }
  return _sendKarte(text, viaVoice);
};


// =====================================================================
//  TIMER UND WECKER
// =====================================================================
const ALARM = { aktiv: {}, ton: null };
function timerChips(liste) {
  let box = $("timerbox");
  if (!box) { box = document.createElement("div"); box.id = "timerbox"; box.className = "timerbox"; document.body.appendChild(box); }
  ALARM.liste = liste || [];
  box.hidden = !ALARM.liste.length;
  timerTick();
}
function timerTick() {
  const box = $("timerbox"); if (!box || !ALARM.liste?.length) return;
  const jetzt = Date.now() / 1000;
  box.innerHTML = ALARM.liste.map((t) => {
    const rest = Math.max(0, t.ende - jetzt), h = Math.floor(rest / 3600), m = Math.floor(rest % 3600 / 60), s = Math.floor(rest % 60);
    const anz = t.art === "wecker" ? `⏰ ${t.um}` : `⏱ ${h ? h + ":" + String(m).padStart(2, "0") : m}:${String(s).padStart(2, "0")}`;
    return `<div class="tchip ${t.art} ${rest < 60 && t.art === "timer" ? "bald" : ""}" title="${esc(t.titel)}"><b>${esc(anz)}</b><span>${esc(t.titel)}</span></div>`;
  }).join("");
}
setInterval(timerTick, 1000);
api("/timer").then((d) => { timerChips(d.timer); (d.klingelt || []).forEach(alarmZeigen); }).catch(() => {});
function alarmTon(an) {
  if (!an) { clearInterval(ALARM.ton); ALARM.ton = null; return; }
  if (ALARM.ton) return;
  unlockAudio();
  const piep = () => {
    if (!play.ctx) return;
    const t = play.ctx.currentTime;
    [0, .18, .36].forEach((d, i) => {
      const o = play.ctx.createOscillator(), g = play.ctx.createGain();
      o.type = "sine"; o.frequency.value = i === 2 ? 1318 : 988;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.22, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .16);
      o.connect(g).connect(play.ctx.destination); o.start(t + d); o.stop(t + d + .2);
    });
  };
  piep(); ALARM.ton = setInterval(piep, 1400);
}
function alarmZeigen(a) {
  if (ALARM.aktiv[a.id]) return;
  const el = document.createElement("div"); el.className = "alarm"; el.dataset.id = a.id;
  el.innerHTML = `<div class="alarm-ring"><i></i><i></i><i></i><span>${a.art === "wecker" ? "⏰" : "⏱"}</span></div>
    <div class="alarm-text"><small>${a.art === "wecker" ? "WECKER" : "TIMER ABGELAUFEN"}</small><b>${esc(a.titel)}</b></div>
    <div class="alarm-knoepfe"><button type="button" data-a="schlummern">+9 MIN.</button><button type="button" data-a="stopp" class="primary">STOPP</button></div>`;
  document.body.appendChild(el); ALARM.aktiv[a.id] = el;
  el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    api(`/alarm/${a.id}/${b.dataset.a}`, { method: "POST" }).catch(() => {}); alarmWeg(a.id);
  }));
  alarmTon(true);
  setTimeout(() => { if (ALARM.aktiv[a.id] && V.out !== "aus") { V.turnLang = "de"; ttsSay(`${a.art === "wecker" ? "Ihr Wecker" : "Der Timer"} ${a.titel !== "Timer" && a.titel !== "Wecker" ? "„" + a.titel + "“ " : ""}${a.art === "wecker" ? "klingelt" : "ist abgelaufen"}.`); } }, 900);
  setTimeout(() => alarmTon(false), 60000);                   // nach einer Minute nur noch die Karte
}
function alarmWeg(id) {
  const el = ALARM.aktiv[id]; if (!el) return;
  delete ALARM.aktiv[id]; el.classList.add("weg"); setTimeout(() => el.remove(), 400);
  if (!Object.keys(ALARM.aktiv).length) alarmTon(false);
}
const _handleTimer = handle;
handle = function (ev) {
  if (ev.type === "timer_liste") { timerChips(ev.liste); return; }
  if (ev.type === "alarm") { alarmZeigen(ev); return; }
  if (ev.type === "alarm_aus") { alarmWeg(ev.id); return; }
  _handleTimer(ev);
};


// =====================================================================
//  PLAYER: Apple Music (Musik-App) und Podcasts (hier im Dashboard)
// =====================================================================
const PL = { el: null, audio: null, quelle: "", st: {}, versteckt: null, gedueckt: false };
function playerGeruest() {
  if (PL.el) return PL.el;
  const el = document.createElement("div"); el.className = "player"; el.hidden = true;
  el.innerHTML = `<div class="pl-cover"><img alt=""><i class="pl-eq"><b></b><b></b><b></b><b></b></i></div>
    <div class="pl-mitte"><div class="pl-titel"><span></span></div><div class="pl-kuenstler"></div>
      <div class="pl-zeit"><em class="pl-pos">0:00</em><div class="pl-balken"><i></i></div><em class="pl-dauer">0:00</em></div></div>
    <div class="pl-knoepfe"><button type="button" data-a="vorheriger" title="Zurück">⏮</button>
      <button type="button" data-a="playpause" class="pl-haupt" title="Wiedergabe/Pause">⏯</button>
      <button type="button" data-a="naechster" title="Weiter">⏭</button></div>
    <input type="range" class="pl-laut" min="0" max="100" value="60" title="Lautstärke">
    <button type="button" class="pl-zu" data-a="stopp" title="Beenden">✕</button>`;
  document.body.appendChild(el);
  el.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => playerBefehl(b.dataset.a)));
  el.querySelector(".pl-laut").addEventListener("input", (e) => playerBefehl("lautstaerke", +e.target.value));
  el.querySelector(".pl-balken").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect(), k = (e.clientX - r.left) / r.width, d = PL.st.dauer || 0;
    if (d) playerBefehl("position", Math.round(k * d));
  });
  PL.el = el; return el;
}
const mmss = (s) => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };
function playerZeichnen() {
  const el = playerGeruest(), s = PL.st;
  const sichtbar = s.zustand === "spielt" || s.zustand === "pause";
  el.hidden = !sichtbar; document.body.classList.toggle("spielt-musik", sichtbar);
  if (!sichtbar) return;
  el.classList.toggle("pausiert", s.zustand !== "spielt");
  el.dataset.quelle = PL.quelle;
  const t = el.querySelector(".pl-titel span"); if (t.textContent !== (s.titel || "")) { t.textContent = s.titel || ""; t.parentElement.classList.toggle("lang", (s.titel || "").length > 28); }
  el.querySelector(".pl-kuenstler").textContent = [s.kuenstler, PL.quelle === "podcast" ? s.datum : s.album].filter(Boolean).join(" · ");
  const img = el.querySelector(".pl-cover img"); if (s.cover && img.dataset.src !== s.cover) { img.dataset.src = s.cover; img.src = s.cover; }
  el.querySelector(".pl-cover").classList.toggle("ohne", !s.cover);
  el.querySelector(".pl-pos").textContent = mmss(s.position); el.querySelector(".pl-dauer").textContent = mmss(s.dauer);
  el.querySelector(".pl-balken i").style.width = s.dauer ? `${Math.min(100, (s.position / s.dauer) * 100)}%` : "0%";
  const laut = el.querySelector(".pl-laut"); if (document.activeElement !== laut && s.lautstaerke != null) laut.value = s.lautstaerke;
}
async function playerBefehl(a, wert) {
  if (PL.quelle === "podcast") return podcastBefehl(a, wert);
  if (a === "stopp") { PL.st = { zustand: "stopp" }; playerZeichnen(); }
  try { await api(`/musik/${a}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wert }) }); }
  catch (e) { toast("Musik-App reagiert nicht"); }
}
// ---- Podcast im Dashboard
function podcastStarten(d) {
  PL.quelle = "podcast";
  if (!PL.audio) {
    PL.audio = new Audio(); PL.audio.preload = "auto";
    const melde = () => {
      const a = PL.audio;
      PL.st = { ...PL.st, zustand: a.ended ? "stopp" : a.paused ? "pause" : "spielt", position: a.currentTime, dauer: a.duration || PL.st.dauer, lautstaerke: Math.round(a.volume * 100) };
      playerZeichnen();
      try { localStorage.setItem("jarvis-pod:" + a.src, String(Math.floor(a.currentTime))); } catch (e) {}
    };
    ["timeupdate", "play", "pause", "ended", "loadedmetadata"].forEach((t) => PL.audio.addEventListener(t, melde));
    PL.audio.addEventListener("pause", () => ws?.readyState === 1 && ws.send(JSON.stringify({ type: "player", quelle: "podcast", zustand: "pause" })));
    PL.audio.addEventListener("ended", () => ws?.readyState === 1 && ws.send(JSON.stringify({ type: "player", quelle: "podcast", zustand: "stopp" })));
  }
  PL.st = { zustand: "spielt", titel: d.titel, kuenstler: d.sendung, datum: d.datum, cover: d.cover, dauer: d.dauer, position: 0, lautstaerke: 80 };
  PL.audio.src = d.url; PL.audio.volume = .8;
  try { const p = +localStorage.getItem("jarvis-pod:" + d.url); if (p > 10) PL.audio.currentTime = p - 5; } catch (e) {}
  unlockAudio();
  PL.audio.play().catch(() => toast("Zum Abspielen einmal ▶ im Player drücken"));
  playerZeichnen();
}
function podcastBefehl(a, wert) {
  const au = PL.audio; if (!au) return;
  if (a === "playpause") au.paused ? au.play() : au.pause();
  else if (a === "pause") au.pause();
  else if (a === "weiter" || a === "play") au.play();
  else if (a === "naechster") au.currentTime = Math.min(au.duration || 1e9, au.currentTime + 30);
  else if (a === "vorheriger" || a === "zurueck") au.currentTime = Math.max(0, au.currentTime - 15);
  else if (a === "lauter") au.volume = Math.min(1, au.volume + .15);
  else if (a === "leiser") au.volume = Math.max(0, au.volume - .15);
  else if (a === "lautstaerke" && wert != null) au.volume = Math.max(0, Math.min(1, wert / 100));
  else if (a === "position" && wert != null) au.currentTime = wert;
  else if (a === "stopp") { au.pause(); PL.st = { zustand: "stopp" }; PL.quelle = ""; playerZeichnen();
    ws?.readyState === 1 && ws.send(JSON.stringify({ type: "player", quelle: "podcast", zustand: "stopp" })); }
}
// ---- leiser, solange JARVIS spricht
function ducken(an) {
  if (PL.gedueckt === an) return; PL.gedueckt = an;
  if (PL.quelle === "podcast" && PL.audio) { if (an) { PL.vorVol = PL.audio.volume; PL.audio.volume = PL.vorVol * .25; } else if (PL.vorVol != null) PL.audio.volume = PL.vorVol; }
  else if (PL.quelle === "music" && PL.st.zustand === "spielt") api("/musik/ducken", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ an }) }).catch(() => {});
}
setInterval(() => ducken(!!play.src), 300);
const _handlePlayer = handle;
handle = function (ev) {
  if (ev.type === "player") { if (PL.quelle !== "podcast" || ev.quelle === "podcast") { PL.quelle = ev.quelle; PL.st = ev; if (ev.zustand === "spielt") ev.position_zeit = Date.now(); playerZeichnen(); } return; }
  if (ev.type === "podcast") { if (PL.quelle === "music") PL.st = { zustand: "stopp" }; podcastStarten(ev); return; }
  if (ev.type === "player_befehl") { podcastBefehl(ev.aktion, ev.wert); return; }
  if (ev.type === "player_zeigen") { PL.quelle = "music"; return; }
  _handlePlayer(ev);
};
// Position bei Musik zwischen den Meldungen weiterzählen
setInterval(() => { if (PL.quelle === "music" && PL.st.zustand === "spielt" && PL.st.dauer) { PL.st.position = Math.min(PL.st.dauer, (PL.st.position || 0) + 1); playerZeichnen(); } }, 1000);
api("/musik/status").then((s) => { if (s.zustand === "spielt" || s.zustand === "pause") { PL.quelle = "music"; PL.st = s; playerZeichnen(); } }).catch(() => {});



// =====================================================================
//  DEAKTIVIERT (weitergegebene Installation vom Herausgeber abgeschaltet)
// =====================================================================
const _handleSperre = handle;
handle = function (ev) {
  if (ev.type === "gesperrt") {
    let el = document.getElementById("gesperrt");
    if (!el) {
      el = document.createElement("div"); el.id = "gesperrt"; el.className = "gesperrt";
      el.innerHTML = `<div><b>JARVIS IST DEAKTIVIERT</b><p></p><small>Bei Fragen wende dich an die Person, von der du JARVIS bekommen hast.</small></div>`;
      document.body.appendChild(el);
    }
    el.querySelector("p").textContent = ev.text || "";
    busy(false); setState("off");
    return;
  }
  _handleSperre(ev);
};


// =====================================================================
//  VERBINDUNGEN: alle Schlüssel und Zugänge per Oberfläche (kein Terminal nötig)
// =====================================================================
const VB_INFO = {
  anthropic: { titel: "Claude (Anthropic)", pflicht: true, ph: "sk-ant-…", link: "https://console.anthropic.com/settings/keys",
    hilfe: "console.anthropic.com → API Keys → Create Key. Guthaben unter Billing aufladen." },
  elevenlabs: { titel: "Stimme (ElevenLabs)", ph: "sk_…", link: "https://elevenlabs.io/app/settings/api-keys",
    hilfe: "elevenlabs.io → Settings → API Keys. Ohne Schlüssel spricht die Mac-Stimme." },
  telegram: { titel: "Telegram (unterwegs)", ph: "123456789:ABC…", link: "https://t.me/BotFather",
    hilfe: "In Telegram @BotFather öffnen → /newbot → Token kopieren. Danach dem eigenen Bot „Start“ schicken." },
  serper: { titel: "Google-Bilder (Serper)", ph: "Schlüssel", link: "https://serper.dev",
    hilfe: "serper.dev – 2.500 Suchen kostenlos. Ohne: Bilder von Wikimedia." },
  nuki: { titel: "NUKI Smart Lock", ph: "API-Token", link: "https://web.nuki.io/#/admin/web-api",
    hilfe: "web.nuki.io → Menü → API → API-Token erstellen (Rechte: Smartlocks lesen, Aktionen). JARVIS kann damit nur Status lesen und abschließen." },
  youtube: { titel: "YouTube", ph: "AIza…", link: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    hilfe: "Google Cloud Console → YouTube Data API v3 aktivieren → Anmeldedaten → API-Schlüssel." },
};
function vbLink(url) {
  if (MOBIL) { window.open(url, "_blank"); return; }
  api("/link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => window.open(url, "_blank"));
}
async function vbPost(pfad, daten) {
  const r = await fetch(pfad, { method: "POST", headers: { "content-type": "application/json", ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) },
    body: JSON.stringify(daten || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.detail || `Fehler ${r.status}`);
  return j;
}
function vbZeile(id, titel, zustand, inhalt, offen = false) {
  return `<details class="vb-zeile" data-id="${id}" ${offen ? "open" : ""}><summary><span>${titel}</span><em class="${zustand.ok ? "ok" : zustand.warn ? "warn" : ""}">${esc(zustand.text)}</em></summary>
    <div class="vb-inhalt">${inhalt}<div class="vb-status"></div></div></details>`;
}
async function vbAufbauen(versuch = 0) {
  const box = $("einst-vb");
  let d;
  try { d = await api("/verbindungen"); }
  catch (e) {                                   // z. B. während JARVIS nach einer Änderung neu startet
    if (versuch < 12 && !$("einst").hidden) { if (!versuch) box.insertAdjacentHTML("beforeend", "<p class='vb-hilfe'>JARVIS startet neu …</p>"); setTimeout(() => vbAufbauen(versuch + 1), 2500); }
    else box.textContent = "Nicht verfügbar";
    return;
  }
  const offen = [...box.querySelectorAll("details[open]")].map((x) => x.dataset.id);
  const k = d.schluessel, html = [];
  for (const [art, inf] of Object.entries(VB_INFO)) {
    const z = k[art].gesetzt ? { ok: true, text: `✓ eingerichtet ${k[art].maske}` } : { warn: inf.pflicht, text: inf.pflicht ? "fehlt – nötig" : "– nicht eingerichtet" };
    let extra = "";
    if (art === "telegram" && k[art].gesetzt) extra = `<p class="vb-hilfe">${d.telegram.bot ? "Bot @" + esc(d.telegram.bot) + " · " : ""}${d.telegram.verbunden ? "✓ Chat verbunden" : "⚠ Noch nicht verbunden – dem Bot in Telegram „Start“ schicken."}</p>`;
    if (art === "elevenlabs" && k[art].gesetzt) extra = `<div class="vb-feld"><label>Stimme</label><div class="vb-reihe"><select data-stimmen><option value="${esc(d.stimme.id || d.stimme.standard)}">${esc(d.stimme.id || "Daniel (Standard)")}</option></select>
      <button type="button" data-a="probe">PROBEHÖREN</button></div></div>`;
    html.push(vbZeile(art, inf.titel, z, `<p class="vb-hilfe">${esc(inf.hilfe)} <a data-link="${inf.link}">Seite öffnen ↗</a></p>
      <div class="vb-reihe"><input type="password" autocomplete="off" placeholder="${esc(k[art].gesetzt ? "neuen Schlüssel einfügen" : inf.ph)}" data-wert>
      <button type="button" data-a="speichern" class="primary">PRÜFEN &amp; SPEICHERN</button>${k[art].gesetzt && !inf.pflicht ? `<button type="button" data-a="loeschen">ENTFERNEN</button>` : ""}</div>${extra}`));
  }
  html.push(vbZeile("icloud", "Kalender &amp; Mail (iCloud)", d.icloud.gesetzt ? { ok: true, text: "✓ " + d.icloud.apple_id } : { text: "– nicht eingerichtet" },
    `<p class="vb-hilfe">Braucht ein <b>App-spezifisches Passwort</b>, nicht dein Apple-Passwort: account.apple.com → Anmeldung und Sicherheit → App-spezifische Passwörter → „+“. <a data-link="https://account.apple.com/account/manage">Seite öffnen ↗</a></p>
     <div class="vb-feld"><label>Apple-ID</label><input type="text" data-f="apple_id" value="${esc(d.icloud.apple_id)}" placeholder="name@icloud.com"></div>
     <div class="vb-feld"><label>iCloud-Mailadresse (falls anders)</label><input type="text" data-f="mail" value="${esc(d.icloud.mail !== d.icloud.apple_id ? d.icloud.mail : "")}"></div>
     <div class="vb-feld"><label>App-spezifisches Passwort</label><input type="password" data-f="pw" placeholder="xxxx-xxxx-xxxx-xxxx"></div>
     <div class="vb-reihe"><button type="button" data-a="icloud" class="primary">PRÜFEN &amp; SPEICHERN</button></div>`));
  html.push(vbZeile("profil", "Über dich", { ok: true, text: `${d.profil.name}${d.profil.ort ? " · " + d.profil.ort : ""}` },
    `<div class="vb-feld"><label>Name</label><input type="text" data-f="name" value="${esc(d.profil.name)}"></div>
     <div class="vb-feld"><label>Begrüßung („Guten Morgen, …“)</label><input type="text" data-f="anrede" value="${esc(d.profil.anrede)}" placeholder="z. B. Sir, Ma'am oder Vorname – leer = ohne"></div>
     <div class="vb-feld"><label>Heimatort (Wetter, wenn der Standort unbekannt ist; Routen „nach Hause“)</label><input type="text" data-f="ort" value="${esc(d.profil.ort)}" placeholder="z. B. Leipzig oder 04109 Leipzig"></div>
     <p class="vb-hilfe">${d.profil.standort?.bekannt ? `Aktueller Standort: <b>${esc(d.profil.standort.ort || "bekannt")}</b> (${esc({ mac: "Mac", iphone: "iPhone", browser: "Browser" }[d.profil.standort.quelle] || d.profil.standort.quelle)}, vor ${d.profil.standort.alter_min < 60 ? d.profil.standort.alter_min + " Min." : Math.round(d.profil.standort.alter_min / 60) + " Std."})${d.profil.standort.aktuell ? " – das Wetter gilt dort." : " – zu alt, Wetter gilt für den Heimatort."}` : "Standort noch unbekannt: Beim nächsten Start fragt die JARVIS-App einmal nach den Ortungsdiensten (am iPhone fragt Safari)."} Termine von heute mit Ort, die mehr als 50 km entfernt sind, bekommen ihr eigenes Wetter.</p>
     <div class="vb-reihe"><button type="button" data-a="profil" class="primary">SPEICHERN</button></div>`));
  html.push(vbZeile("archiv", "Dokumenten-Ordner", d.archiv ? { ok: true, text: "✓ " + d.archiv.split("/").pop() } : { text: "– keiner" },
    `<p class="vb-hilfe">${d.archiv ? esc(d.archiv) : "JARVIS durchsucht diesen Ordner, legt Post ab und zeigt Dokumente."}</p>
     <div class="vb-reihe">${MOBIL ? "<span class='vb-hilfe'>Nur am Mac änderbar.</span>" : `<button type="button" data-a="archiv" class="primary">ORDNER WÄHLEN …</button>${d.archiv ? `<button type="button" data-a="archiv-weg">ENTFERNEN</button>` : ""}`}</div>`));
  const l = d.lokal;
  html.push(vbZeile("lokal", "Lokales Sprachmodell (Privates bleibt am Mac)",
    l.bereit ? { ok: true, text: "✓ bereit" } : l.laedt ? { warn: true, text: "lädt …" } : { text: "– nicht eingerichtet" },
    `<p class="vb-hilfe">${l.bereit ? "Modelle: " + esc(l.modelle.join(", ")) : "Gesundheit, Finanzen und Zugangsdaten werden dann auf dem Mac beantwortet. Download ca. 7 GB, läuft im Hintergrund."}
      ${l.fortschritt ? "<br>Stand: " + esc(l.fortschritt) : ""}</p>
     ${l.bereit || MOBIL ? "" : `<div class="vb-reihe"><button type="button" data-a="lokal" class="primary" ${l.laedt ? "disabled" : ""}>${l.laedt ? "LÄDT …" : "JETZT EINRICHTEN"}</button></div>`}`));
  box.innerHTML = html.join("");
  offen.forEach((id) => { const x = box.querySelector(`details[data-id="${id}"]`); if (x) x.open = true; });
  if (k.elevenlabs.gesetzt) api("/verbindungen/stimmen").then((liste) => {
    const sel = box.querySelector("[data-stimmen]"); if (!sel || !liste.length) return;
    const akt = d.stimme.id || d.stimme.standard;
    sel.innerHTML = liste.map((v) => `<option value="${esc(v.id)}" ${v.id === akt ? "selected" : ""}>${esc(v.name)}${v.info ? " – " + esc(v.info) : ""}</option>`).join("");
  }).catch(() => {});
  if (l.laedt) setTimeout(() => { if (!$("einst").hidden) vbAufbauen(); }, 5000);
}
$("einst-vb").addEventListener("click", async (e) => {
  const link = e.target.closest("[data-link]"); if (link) { e.preventDefault(); vbLink(link.dataset.link); return; }
  const b = e.target.closest("button[data-a]"); if (!b) return;
  if (["loeschen", "archiv-weg"].includes(b.dataset.a) && !b.dataset.sicher) {   // zweiter Klick bestätigt
    b.dataset.sicher = "1"; b.dataset.alt = b.textContent; b.textContent = "WIRKLICH?";
    setTimeout(() => { if (b.isConnected) { delete b.dataset.sicher; b.textContent = b.dataset.alt; } }, 4000);
    return;
  }
  const zeile = b.closest(".vb-zeile"), id = zeile.dataset.id, st = zeile.querySelector(".vb-status");
  const f = (n) => zeile.querySelector(`[data-f="${n}"]`)?.value ?? "";
  const melde = (t, art = "") => { st.textContent = t; st.className = "vb-status " + art; };
  b.disabled = true; melde("Einen Moment …");
  try {
    let r;
    if (b.dataset.a === "speichern") {
      const wert = zeile.querySelector("[data-wert]").value.trim();
      if (!wert) throw new Error("Bitte den Schlüssel einfügen");
      r = await vbPost(`/verbindungen/schluessel/${id}`, { wert });
      zeile.querySelector("[data-wert]").value = "";
      if (r.warten) {                                   // Telegram: auf „Start“ im Chat warten
        melde(r.text, "ok");
        let n = 0; const t = setInterval(async () => {
          const d = await api("/verbindungen").catch(() => null);
          if (d?.telegram.verbunden || ++n > 36) { clearInterval(t); vbAufbauen(); }
        }, 5000);
        return;
      }
    } else if (b.dataset.a === "loeschen") {
      r = await vbPost(`/verbindungen/schluessel/${id}`, { loeschen: true });
    } else if (b.dataset.a === "probe") {
      const sid = zeile.querySelector("[data-stimmen]").value;
      await vbPost("/verbindungen/stimme", { id: sid });
      V.turnLang = "de"; unlockAudio(); ttsSay("Guten Tag. So klinge ich mit dieser Stimme.");
      r = { text: "✓ Stimme übernommen" };
    } else if (b.dataset.a === "icloud") r = await vbPost("/verbindungen/icloud", { apple_id: f("apple_id"), mail: f("mail"), pw: f("pw") });
    else if (b.dataset.a === "profil") r = await vbPost("/verbindungen/profil", { name: f("name"), anrede: f("anrede"), ort: f("ort") });
    else if (b.dataset.a === "archiv") { melde("Bitte im Fenster „Ordner wählen“ auswählen …"); r = await vbPost("/verbindungen/archiv/waehlen"); }
    else if (b.dataset.a === "archiv-weg") r = await vbPost("/verbindungen/archiv/entfernen");
    else if (b.dataset.a === "lokal") r = await vbPost("/verbindungen/lokal");
    melde(r?.text || "✓ Gespeichert", "ok");
    setTimeout(vbAufbauen, 1200);
  } catch (err) { melde("✕ " + err.message, "fehler"); }
  finally { b.disabled = false; }
});
$("einst-vb").addEventListener("change", (e) => {
  if (e.target.matches("[data-stimmen]")) vbPost("/verbindungen/stimme", { id: e.target.value }).catch(() => {});
});
const _einstOeffnenVB = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenVB(); vbAufbauen(); };

// ---------- Stab: Agenten, Aufgaben, Persönlichkeit (Einstellungen) und Schalter in der Kopfleiste ----------
const STAB = { d: null };
async function stabPost(pfad, body) {
  const r = await fetch(pfad, { method: "POST", headers: { "content-type": "application/json", ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) },
    body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.detail || `Fehler ${r.status}`);
  return j;
}
function stabBtn() {
  const b = $("stabbtn"); if (!b) return;
  if (!STAB.d) { b.hidden = true; return; }
  b.hidden = false; b.setAttribute("aria-pressed", STAB.d.aktiv ? "true" : "false");
  b.textContent = STAB.d.aktiv ? "STAB: AN" : "STAB: AUS";
  b.title = STAB.d.aktiv ? "Stab ist eingeschaltet – JARVIS verteilt größere Aufträge an seine Agenten. Klick: ausschalten"
                         : "Stab ist ausgeschaltet – JARVIS erledigt alles selbst. Klick: einschalten";
}
async function stabLaden() { try { STAB.d = await api("/stab"); } catch (e) { STAB.d = null; } stabBtn(); return STAB.d; }
async function stabSchalten(an) {
  try { await stabPost("/stab/schalter", { aktiv: an }); toast(an ? "Stab eingeschaltet" : "Stab ausgeschaltet – JARVIS erledigt alles selbst"); }
  catch (e) { toast("Stab: " + e.message); }
  await stabLaden(); if (!$("einst").hidden) stabAufbauen();
}
function stabOpt(map, wert) { return Object.entries(map).map(([k, v]) => `<option value="${esc(k)}" ${k === wert ? "selected" : ""}>${esc(v)}</option>`).join(""); }
function stabListe(arr) { return (arr || []).length ? `<ul class="stab-liste">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p class='vb-hilfe'>–</p>"; }
function stabVerlauf(p, versionen) {
  const v = (p.verlauf || []).slice(-5).reverse().map((e) => `<li><b>${esc(e.version)}</b> · ${esc(fdat(e.datum))} · ${esc(e.grund)}${e.von ? " <i>(" + esc(e.von) + ")</i>" : ""}</li>`).join("");
  const opt = (versionen || []).slice().reverse().map((x) => `<option>${esc(x)}</option>`).join("");
  return `<div class="vb-feld"><label>Verlauf (aktuell ${esc(p.version)})</label><ul class="stab-liste">${v}</ul></div>
    ${opt ? `<div class="vb-reihe"><select data-f="version">${opt}</select><button type="button" data-a="zurueck">ZURÜCKSETZEN</button></div>` : ""}`;
}
function stabGrund() {
  return `<div class="vb-feld"><label>Grund der Änderung (wird protokolliert)</label><input type="text" data-f="grund" placeholder="z. B. soll förmlicher klingen"></div>`;
}
function stabAufbauen() {
  const box = $("einst-stab"), d = STAB.d;
  if (!box) return;
  if (!d) { box.innerHTML = "<p class='vb-hilfe'>Stab nicht verfügbar.</p>"; return; }
  const offen = [...box.querySelectorAll("details[open]")].map((x) => x.dataset.id);
  const o = d.optionen, j = d.jarvis, pe = j.persoenlichkeit || {};
  const grenze = d.kostengrenze_eur;
  const html = [];
  html.push(`<p class="vb-hilfe">Du sprichst nur mit JARVIS. Größere Aufträge verteilt er an seine Agenten, die sich bei Bedarf untereinander abstimmen; er gewichtet die Ergebnisse und trägt sie dir vor. Rechte und Bestätigungen gelten für alle Agenten unverändert.</p>
    <div class="einst-zeile"><span>Stab</span><button type="button" data-a="schalter" class="${d.aktiv ? "an" : ""}">${d.aktiv ? "AN" : "AUS"}</button></div>
    <div class="einst-zeile"><span>Kosten diesen Monat</span><em class="stab-kosten ${grenze && d.kosten_monat >= grenze * 0.8 ? "warn" : ""}">${d.kosten_monat.toFixed(2)} € ${grenze ? "von " + Number(grenze).toFixed(2) + " €" : "· keine Grenze"}</em></div>
    <div class="vb-reihe stab-grenze"><input type="number" min="1" step="1" data-f="grenze" placeholder="Grenze in €" value="${grenze ?? ""}">
      <button type="button" data-a="grenze" class="primary">GRENZE SETZEN</button>${grenze ? `<button type="button" data-a="grenze-weg">AUFHEBEN</button>` : ""}</div><div class="vb-status" data-st="kopf"></div>`);
  html.push(vbZeile("jarvis", `${stabLogo("JARVIS", "klein")}JARVIS · Chef des Stabes`, { ok: true, text: `v${j.version} · ${o.grundton[pe.grundton] || ""}` },
    `<p class="vb-hilfe"><b>Aufgabe:</b> ${esc(j.auftrag)}</p>
     <div class="stab-raster">
      <div class="vb-feld"><label>Grundton</label><select data-p="grundton">${stabOpt(o.grundton, pe.grundton)}</select></div>
      <div class="vb-feld"><label>Humor</label><select data-p="humor">${stabOpt(o.humor, pe.humor)}</select></div>
      <div class="vb-feld"><label>Ausführlichkeit</label><select data-p="ausfuehrlichkeit">${stabOpt(o.ausfuehrlichkeit, pe.ausfuehrlichkeit)}</select></div>
      <div class="vb-feld"><label>Anrede</label><select data-p="anrede_form">${stabOpt(o.anrede_form, pe.anrede_form)}</select></div>
     </div>
     <div class="vb-feld"><label>Eigene Anweisung zum Auftreten</label><textarea data-p="zusatz" rows="2" placeholder="z. B. Nenne Zeiten als Datum-Zeit-Gruppe">${esc(pe.zusatz || "")}</textarea></div>
     ${stabGrund()}<div class="vb-reihe"><button type="button" data-a="speichern" class="primary">SPEICHERN</button></div>
     ${stabVerlauf(j, d.jarvis_versionen)}`, offen.includes("jarvis") || !offen.length));
  for (const a of d.agenten) {
    html.push(vbZeile(a.id, `${stabLogo(a.kuerzel, "klein")}${esc(a.name)} · ${esc(a.kuerzel)}`, a.aktiv === false ? { text: `v${a.version} · aus` } : { ok: true, text: `v${a.version} · ${esc(o.modell[a.modell] ? a.modell : "")}` },
      `<p class="vb-hilfe"><b>Sachgebiet:</b> ${esc(a.sachgebiet)}<br><b>Auftrag:</b> ${esc(a.auftrag)}</p>
       <div class="stab-raster"><div class="vb-feld"><label>Darf</label>${stabListe(a.darf)}</div><div class="vb-feld"><label>Darf nicht</label>${stabListe(a.darf_nicht)}</div></div>
       <p class="vb-hilfe"><b>Werkzeuge:</b> ${esc((a.werkzeuge || []).join(", "))} · <b>Datenschutz:</b> ${esc(a.datenschutz || "")}</p>
       <div class="stab-raster">
        <div class="vb-feld"><label>Tonfall</label><input type="text" data-f="tonfall" value="${esc(a.tonfall || "")}"></div>
        <div class="vb-feld"><label>Ausführlichkeit</label><select data-f="ausfuehrlichkeit">${stabOpt(o.ausfuehrlichkeit, a.ausfuehrlichkeit)}</select></div>
        <div class="vb-feld"><label>Modell</label><select data-f="modell" ${a.fest_lokal ? "disabled title='Bleibt aus Datenschutzgründen lokal'" : ""}>${stabOpt(o.modell, a.modell)}</select></div>
        <div class="vb-feld"><label>Einsatzbereit</label><select data-f="aktiv"><option value="1" ${a.aktiv !== false ? "selected" : ""}>Aktiv</option><option value="0" ${a.aktiv === false ? "selected" : ""}>Abgeschaltet</option></select></div>
       </div>
       <div class="vb-feld"><label>Eigene Anweisung</label><textarea data-f="zusatz" rows="2">${esc(a.zusatz || "")}</textarea></div>
       ${stabGrund()}<div class="vb-reihe"><button type="button" data-a="speichern" class="primary">SPEICHERN</button></div>
       ${stabVerlauf(a, a.versionen)}`, offen.includes(a.id)));
  }
  const ein = (d.einsaetze || []).map((e) => `<li><b>${esc(e.zeit.slice(5, 16).replace("T", " "))}</b> · ${esc((e.agenten || []).map((x) => x.agent).join(", "))} · ${esc(e.dauer_s)} s · ${Number(e.kosten_eur || 0).toFixed(3)} €${e.auftrag ? "<br><i>" + esc(e.auftrag) + "</i>" : ""}</li>`).join("");
  html.push(vbZeile("einsaetze", "Letzte Einsätze", { text: `${(d.einsaetze || []).length}` },
    ein ? `<ul class="stab-liste">${ein}</ul>` : "<p class='vb-hilfe'>Noch keine Einsätze.</p>", offen.includes("einsaetze")));
  box.innerHTML = html.join("");
}
$("einst-stab")?.addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const box = $("einst-stab"), zeile = b.closest(".vb-zeile");
  const st = zeile ? zeile.querySelector(".vb-status") : box.querySelector('[data-st="kopf"]');
  const melde = (t, art = "") => { if (st) { st.textContent = t; st.className = "vb-status " + art; } };
  const f = (n) => zeile?.querySelector(`[data-f="${n}"]`)?.value ?? "";
  try {
    if (b.dataset.a === "schalter") { await stabSchalten(!STAB.d.aktiv); return; }
    if (b.dataset.a === "grenze" || b.dataset.a === "grenze-weg") {
      const wert = b.dataset.a === "grenze" ? Number(box.querySelector('[data-f="grenze"]').value) : null;
      if (b.dataset.a === "grenze" && !(wert > 0)) { melde("Bitte einen Betrag in Euro eingeben.", "fehler"); return; }
      await stabPost("/stab/kostengrenze", { wert }); await stabLaden(); stabAufbauen();
      toast(wert ? `Kostengrenze des Stabs: ${wert} € pro Monat` : "Kostengrenze des Stabs aufgehoben"); return;
    }
    const id = zeile.dataset.id, grund = f("grund").trim();
    if (b.dataset.a === "zurueck") {
      const version = f("version");
      if (!b.dataset.sicher) { b.dataset.sicher = "1"; b.textContent = `AUF ${version}?`; setTimeout(() => { if (b.isConnected) { delete b.dataset.sicher; b.textContent = "ZURÜCKSETZEN"; } }, 4000); return; }
      b.disabled = true; melde("Einen Moment …");
      const r = await stabPost(`/stab/zuruecksetzen/${id}`, { version, grund });
      await stabLaden(); stabAufbauen(); toast(`Zurückgesetzt – jetzt Version ${r.version}`); return;
    }
    if (b.dataset.a === "speichern") {
      if (!grund) { melde("Bitte kurz einen Grund angeben – er wird im Verlauf protokolliert.", "fehler"); zeile.querySelector('[data-f="grund"]').focus(); return; }
      let aenderungen;
      if (id === "jarvis") {
        const pe = {}; zeile.querySelectorAll("[data-p]").forEach((x) => { pe[x.dataset.p] = x.value; });
        aenderungen = { persoenlichkeit: pe };
      } else {
        aenderungen = { tonfall: f("tonfall"), ausfuehrlichkeit: f("ausfuehrlichkeit"), zusatz: f("zusatz"), aktiv: f("aktiv") === "1" };
        const m = zeile.querySelector('[data-f="modell"]'); if (m && !m.disabled) aenderungen.modell = m.value;
      }
      b.disabled = true; melde("Speichere …");
      const r = await stabPost(`/stab/persona/${id}`, { aenderungen, grund });
      await stabLaden(); stabAufbauen();
      toast(r.unveraendert ? "Keine Änderung" : `Gespeichert – Version ${r.version}`);
    }
  } catch (err) { melde(err.message, "fehler"); b.disabled = false; }
});
$("stabbtn")?.addEventListener("click", () => { if (STAB.d) stabSchalten(!STAB.d.aktiv); });
const _handleStab = handle;
handle = function (ev) {
  if (ev.type === "stab") {
    if (ev.phase === "start") { if (document.hidden || !ev.kuerzel) toast("Stab arbeitet: " + (ev.agenten || []).join(", ")); else saStart(ev.kuerzel); }
    if (ev.phase === "abstimmung") saAbstimmung(ev.von, ev.an);
    if (ev.phase === "meldung") saMeldung(ev.kuerzel);
    if (ev.phase === "ende") saEnde();
    if (ev.phase === "schalter" && STAB.d) { STAB.d.aktiv = !!ev.aktiv; stabBtn(); }
    return;
  }
  _handleStab(ev);
};
const _einstOeffnenStab = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenStab(); stabLaden().then(stabAufbauen); };
stabLaden();
// ---------- Stab: Embleme der Agenten (gleiche Formsprache wie der JARVIS-Kern: Sechseck, Ticks, Linien) ----------
function stabGlyph(k) {
  const G = {
    JARVIS: `<circle cx="32" cy="32" r="11"/><circle cx="32" cy="32" r="5" class="sl-voll"/><path d="M32 17 V21 M32 43 V47 M17 32 H21 M43 32 H47"/>`,
    ZEIT: `<path d="M23 19 H41 M23 45 H41"/><path d="M25 19 C25 28 31 29 32 32 C33 35 39 36 39 45 M39 19 C39 28 33 29 32 32 C31 35 25 36 25 45"/><path d="M27.5 43.5 L32 38 L36.5 43.5 Z" class="sl-voll"/><path d="M29 24.5 H35" class="sl-fein"/>`,
    KOM: `<rect x="23" y="25" width="18" height="14" rx="1.5"/><path d="M23 26 L32 33 L41 26"/><path d="M21 29 L13 25 M21 32.5 L11 31 M21 36 L14 37" class="sl-fein"/><path d="M43 29 L51 25 M43 32.5 L53 31 M43 36 L50 37" class="sl-fein"/>`,
    DIENST: `<path d="M21 37 L32 30.5 L43 37 M21 44 L32 37.5 L43 44"/><path d="M32 15.5 L33.8 20.2 L38.7 20.4 L34.9 23.5 L36.2 28.3 L32 25.6 L27.8 28.3 L29.1 23.5 L25.3 20.4 L30.2 20.2 Z" class="sl-voll"/>`,
    FIN: `<path d="M32 19 V44 M25 45 H39 M19 23 H45"/><circle cx="32" cy="18" r="1.8" class="sl-voll"/><path d="M19 23 L15 32 M19 23 L23 32 M44 23 L40 32 M44 23 L48 32" class="sl-fein"/><path d="M14.5 32 Q19 37 23.5 32 Z M39.5 32 Q44 37 48.5 32 Z"/>`,
    AKTE: `<rect x="21" y="17" width="22" height="30" rx="1.5"/><path d="M21 27 H43 M21 37 H43"/><path d="M28.5 21.5 H35.5 M28.5 31.5 H35.5 M28.5 41.5 H35.5" class="sl-dick"/>`,
    AUFKL: `<circle cx="32" cy="32" r="13"/><circle cx="32" cy="32" r="6.5" class="sl-fein"/><path d="M32 32 L41.2 22.8"/><path d="M32 32 L41.2 22.8 A13 13 0 0 1 45 32 Z" class="sl-schwenk"/><path d="M32 15 V19 M32 45 V49 M15 32 H19 M45 32 H49" class="sl-fein"/><circle cx="37" cy="36.5" r="1.8" class="sl-voll"/>`,
    LOG: `<path d="M32 45 C27 38.5 24.5 34.5 24.5 30 A7.5 7.5 0 0 1 39.5 30 C39.5 34.5 37 38.5 32 45 Z"/><circle cx="32" cy="30" r="2.8"/><path d="M16 47 Q22 41 27 46 M37 46 Q42 41 48 47" class="sl-weg"/>`,
    SICH: `<path d="M32 15.5 L44.5 20 V30.5 C44.5 38.5 39 44.5 32 47.5 C25 44.5 19.5 38.5 19.5 30.5 V20 Z"/><path d="M32 20 V43.5" class="sl-fein"/><path d="M26 31.5 L30.5 36 L38.5 27.5" class="sl-dick"/>`,
    IMMO: `<path d="M17.5 31.5 L32 19 L46.5 31.5"/><path d="M21.5 28.5 V45 H42.5 V28.5"/><path d="M38.5 23.2 V18.5 H41.5 V25.8" class="sl-fein"/><path d="M32 43 C27 40.2 27 35.6 30.6 31.2 C30.8 34.2 32.6 35 33.4 33.2 C36 35.8 37 40.2 32 43 Z" class="sl-voll"/><path d="M26 45 H38" class="sl-fein"/>`,
  };
  return G[k] || "";
}
function stabLogo(k, cls = "") {
  return `<svg viewBox="0 0 64 64" class="stab-logo ${cls}" data-k="${k}" aria-hidden="true">
    <path class="sl-rahmen" d="M32 4 L56.2 18 L56.2 46 L32 60 L7.8 46 L7.8 18 Z"/>
    <path class="sl-innen" d="M32 8.5 L52.3 20.25 L52.3 43.75 L32 55.5 L11.7 43.75 L11.7 20.25 Z"/>
    <path class="sl-ecken" d="M32 0.5 V4 M32 60 V63.5 M3 16 L7.8 18 M61 16 L56.2 18 M3 48 L7.8 46 M61 48 L56.2 46"/>
    <g class="sl-glyph">${stabGlyph(k)}</g></svg>`;
}
const STAB_NAMEN = { JARVIS: "JARVIS", ZEIT: "CHRONOS", KOM: "HERMES", DIENST: "ADJUTANT", FIN: "QUAESTOR", AKTE: "ARCHIVAR", AUFKL: "SCOUT", LOG: "QUARTIERMEISTER", IMMO: "HESTIA", SICH: "AEGIS" };

// ---------- Stab: Animation beim Delegieren (Kern → Agenten → Meldung zurück) ----------
const SA = { el: null, svg: null, ag: {}, c: [0, 0], weg: null, ruhig: false };
function saZentrum() {
  for (const id of ["core3d", "core"]) {
    const r = $(id)?.getBoundingClientRect();
    if (r && r.width > 60 && r.height > 60) return [r.left + r.width / 2, r.top + r.height / 2];
  }
  return [innerWidth / 2, innerHeight * 0.42];
}
function saPaket(x1, y1, x2, y2, dauer = .8, verz = 0, cls = "") {
  if (!SA.svg) return;
  const ns = "http://www.w3.org/2000/svg", c = document.createElementNS(ns, "circle");
  c.setAttribute("r", "3.5"); c.setAttribute("class", "sa-paket " + cls); c.setAttribute("cx", "0"); c.setAttribute("cy", "0");
  c.style.opacity = "0"; SA.svg.appendChild(c);
  c.animate([{ transform: `translate(${x1}px,${y1}px)`, opacity: 0 }, { opacity: 1, offset: .15 },
    { transform: `translate(${x2}px,${y2}px)`, opacity: 1, offset: .9 }, { transform: `translate(${x2}px,${y2}px)`, opacity: 0 }],
    { duration: dauer * 1000, delay: verz * 1000, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" }).onfinish = () => c.remove();
}
function saLinie(x1, y1, x2, y2, cls = "", kurve = 0) {
  const ns = "http://www.w3.org/2000/svg", p = document.createElementNS(ns, "path");
  const mx = (x1 + x2) / 2 - (y2 - y1) * kurve, my = (y1 + y2) / 2 + (x2 - x1) * kurve;
  p.setAttribute("d", `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`); p.setAttribute("pathLength", "1"); p.setAttribute("class", "sa-linie " + cls);
  SA.svg.appendChild(p); return p;
}
function saWeg(sofort = false) {
  clearTimeout(SA.weg);
  if (!SA.el) return;
  const el = SA.el; SA.el = null; SA.svg = null; SA.ag = {};
  if (sofort) { el.remove(); return; }
  el.classList.add("aus"); setTimeout(() => el.remove(), 700);
}
function saAgent(k, x, y, verz = 0, gast = false) {
  const [cx, cy] = SA.c;
  const d = document.createElement("div");
  d.className = "sa-agent" + (gast ? " gast" : "");
  d.style.left = `${x}px`; d.style.top = `${y}px`;
  d.style.setProperty("--dx", `${cx - x}px`); d.style.setProperty("--dy", `${cy - y}px`); d.style.animationDelay = `${verz}s`;
  d.innerHTML = `<div class="sa-ring"></div>${stabLogo(k)}<b>${esc(STAB_NAMEN[k] || k)}</b><span>${gast ? "AUSKUNFT" : "AUFTRAG"}</span>`;
  SA.el.appendChild(d);
  SA.ag[k] = { el: d, x, y };
  return d;
}
function saStart(kuerzel) {
  saWeg(true);
  if (!kuerzel || !kuerzel.length) return;
  SA.ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [cx, cy] = SA.c = saZentrum();
  const n = kuerzel.length, R = Math.max(130, Math.min(280, Math.min(innerWidth, innerHeight) * 0.3));
  const el = SA.el = document.createElement("div"); el.className = "stab-anim" + (SA.ruhig ? " ruhig" : "");
  el.innerHTML = `<svg class="sa-svg" width="${innerWidth}" height="${innerHeight}" viewBox="0 0 ${innerWidth} ${innerHeight}"></svg>
    <div class="sa-kern" style="left:${cx}px;top:${cy}px">${stabLogo("JARVIS")}</div>
    <div class="sa-titel" style="left:${cx}px;top:${cy + Math.min(150, R * .62)}px">DELEGIERE · ${n} ${n === 1 ? "AGENT" : "AGENTEN"}</div>`;
  document.body.appendChild(el);
  SA.svg = el.querySelector(".sa-svg");
  kuerzel.forEach((k, i) => {
    const w = -Math.PI / 2 + (n === 1 ? 0 : (i / n) * Math.PI * 2);
    const x = cx + Math.cos(w) * R * 1.25, y = cy + Math.sin(w) * R * .78;
    const verz = .12 + i * .1;
    const l = saLinie(cx, cy, x, y); l.style.animationDelay = `${verz}s`;
    SA.ag[k] = null; saAgent(k, x, y, verz);
    SA.ag[k].linie = l;
    if (!SA.ruhig) saPaket(cx, cy, x, y, .7, verz);
  });
  SA.weg = setTimeout(() => saWeg(), 150000);                  // Notbremse
}
function saMeldung(k) {
  const a = SA.ag[k]; if (!a || a.el.classList.contains("fertig")) return;
  a.el.classList.add("fertig"); a.el.querySelector("span").textContent = "MELDUNG ✓";
  if (!SA.ruhig) saPaket(a.x, a.y, SA.c[0], SA.c[1], .8, 0, "zurueck");
}
function saAbstimmung(von, an) {
  if (!SA.el) return;
  const a = SA.ag[von]; if (!a) return;
  let b = SA.ag[an];
  if (!b) {                                                      // befragter Agent war nicht beauftragt: kommt als Gast dazu
    const [cx, cy] = SA.c, w = Math.atan2(a.y - cy, a.x - cx) + .55;
    const r = Math.hypot(a.x - cx, a.y - cy) * .62;
    saAgent(an, cx + Math.cos(w) * r, cy + Math.sin(w) * r, 0, true); b = SA.ag[an];
  }
  saLinie(a.x, a.y, b.x, b.y, "quer", .25);
  if (!SA.ruhig) { saPaket(a.x, a.y, b.x, b.y, .7); setTimeout(() => saPaket(b.x, b.y, a.x, a.y, .7, 0, "zurueck"), 900); }
}
function saEnde() {
  if (!SA.el) return;
  Object.keys(SA.ag).forEach(saMeldung);
  const t = SA.el.querySelector(".sa-titel"); if (t) t.textContent = "LAGE WIRD BEURTEILT";
  setTimeout(() => { if (!SA.el) return; SA.el.classList.add("heim"); clearTimeout(SA.weg); SA.weg = setTimeout(() => saWeg(), 900); }, SA.ruhig ? 400 : 1000);
}
addEventListener("resize", () => { if (SA.el) saWeg(true); });

// ---------- Begrüßung beim Start: nur gesprochen, kein Text. Einmal am Tag übernimmt das Tagesupdate ----------
let GRUSS_FERTIG = false;
const _handleGruss = handle;
handle = function (ev) {
  if (ev.type !== "gruss") return _handleGruss(ev);
  if (GRUSS_FERTIG || ev.briefing) { GRUSS_FERTIG = true; return; }     // nur einmal je Start, nicht bei Neuverbindung
  GRUSS_FERTIG = true;
  if (window.JARVIS_NACH_UPDATE || V.out === "aus") return;
  const sagen = (n = 0) => {
    if (document.querySelector(".boot") && n < 60) { setTimeout(() => sagen(n + 1), 400); return; }   // nach der Startsequenz
    try { unlockAudio(); } catch (e) { return; }
    const los = () => { V.turnLang = "de"; V.privat = false; ttsSay(ev.text); };
    if (play.ctx.state === "running") los();
    else play.ctx.resume().then(() => { if (play.ctx.state === "running") los(); }).catch(() => {});
  };
  setTimeout(sagen, 700);
};

// =====================================================================
//  LAGEVORTRAG: Tagesupdate und Wochenüberblick als animierte, klickbare Darstellung.
//  Der Server schickt die Daten ({type:"vortrag"}), danach Abschnittsmarken ({type:"marke"}) im Textstrom.
//  Beim Vorlesen wechselt die Grafik genau dann, wenn JARVIS den Abschnitt zu sprechen beginnt.
// =====================================================================
const VT = { el: null, d: null, szenen: [], i: -1, auto: null, ruhe: null, gesprochen: false };
const VT_TITEL = { AUFTAKT: "LAGE", SOFORT: "SOFORT", TERMINE: "TERMINE", WETTER: "WETTER", FRISTEN: "FRISTEN & ZAHLUNGEN",
  POST: "POST & ERINNERUNGEN", KENNTNIS: "ZUR KENNTNIS" };
const VT_MARKE = /\[(SOFORT|TERMINE|WETTER|FRISTEN|POST|KENNTNIS)\][ \t]*\n?/g;
const VT_WT = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
const VT_WT_LANG = ["SONNTAG", "MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG", "SAMSTAG"];
const VT_MON = ["JANUAR", "FEBRUAR", "MÄRZ", "APRIL", "MAI", "JUNI", "JULI", "AUGUST", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DEZEMBER"];
function vtDatum(iso) { const [j, m, t] = iso.split("-").map(Number); return new Date(j, m - 1, t); }
function vtTage(von, bis) { const out = []; for (let d = vtDatum(von); d <= vtDatum(bis); d.setDate(d.getDate() + 1)) out.push(new Date(d)); return out; }
function vtIso(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function vtOhneMarken(t) { return String(t || "").replace(VT_MARKE, ""); }
function vtZeilen(meldung) {
  return String(meldung || "").split("\n").map((z) => z.replace(/^\s*[-•·*]\s*/, "").replace(/^(Lage|Punkte|Empfehlung):\s*/i, (m) => /empfehlung/i.test(m) ? "→ " : "").trim())
    .filter((z) => z && !/^(DRINGLICHKEIT|WICHTIGKEIT)\b/i.test(z));
}
function vtSofort(d) { const m = (d.meldungen || []).filter((x) => x.gewicht >= 60).slice(0, 3); return m; }
function vtKenntnis(d) { const s = new Set(vtSofort(d)); return (d.meldungen || []).filter((x) => !s.has(x)); }

// ---------- Szenen ----------
function vtAuftakt(d) {
  const v = vtDatum(d.von), b = vtDatum(d.bis), woche = d.von !== d.bis;
  const zr = woche ? `${v.getDate()}. ${VT_MON[v.getMonth()]} – ${b.getDate()}. ${VT_MON[b.getMonth()]} ${b.getFullYear()}`
                   : `${VT_WT_LANG[v.getDay()]} · ${v.getDate()}. ${VT_MON[v.getMonth()]} ${v.getFullYear()}`;
  const ag = (d.meldungen || []).map((m, i) => `<div class="vt-ag" style="--i:${i}">${stabLogo(m.agent)}<b>${esc(STAB_NAMEN[m.agent] || m.name)}</b>
    <span class="vt-g ${m.gewicht >= 60 ? "hoch" : m.gewicht >= 20 ? "mittel" : ""}">G ${m.gewicht}</span></div>`).join("");
  const zahl = (n, l) => `<div class="vt-kz"><b data-zahl="${n}">0</b><span>${l}</span></div>`;
  return `<div class="vt-auftakt"><div class="vt-gross">${esc(d.titel || "LAGE")}</div><div class="vt-datum">${zr}</div>
    <div class="vt-kennzahlen">${zahl((d.termine || []).length, "TERMINE")}${zahl(vtSofort(d).length, "SOFORT")}
      ${zahl((d.fristen || []).length + (d.zahlungen || []).length, "FRISTEN")}${d.mails ? zahl(d.mails.ungelesen || 0, "MAILS NEU") : ""}</div>
    <div class="vt-agenten">${ag}</div></div>`;
}
function vtSofortSzene(d) {
  return `<div class="vt-karten">${vtSofort(d).map((m, i) => {
    const z = vtZeilen(m.meldung).slice(0, 5);
    return `<button type="button" class="vt-karte" style="--i:${i}" data-frage="${esc(`Mehr Details zu ${STAB_NAMEN[m.agent] || m.name}: ${z[0] || ""}`)}">
      <header>${stabLogo(m.agent)}<div><b>${esc(STAB_NAMEN[m.agent] || m.name)}</b><span>GEWICHT ${m.gewicht} / 125</span></div></header>
      <div class="vt-balken"><i style="--w:${Math.min(1, m.gewicht / 125)}"></i></div>
      <ul>${z.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><em>FÜR DETAILS ANTIPPEN</em></button>`;
  }).join("")}</div>`;
}
function vtTermineSzene(d) {
  const termine = d.termine || [], heute = vtIso(new Date());
  const pill = (t, i) => `<button type="button" class="vt-pill ${t.dienst ? "dienst" : ""}" style="--i:${i}" data-frage="${esc(`Erzähl mir mehr zum Termin „${t.titel}“ am ${t.datum.split("-").reverse().join(".")}`)}">
      <b>${t.ganztag ? "GANZTÄGIG" : esc(t.zeit || "")}${t.ende ? "–" + esc(t.ende) : ""}</b><span>${esc(t.titel)}</span>${t.ort ? `<i>${esc(t.ort)}</i>` : ""}</button>`;
  const legende = `<div class="vt-legende"><span class="privat">PRIVAT</span><span class="dienst">DIENST</span></div>`;
  if (d.von !== d.bis) {
    let n = 0;
    const spalten = vtTage(d.von, d.bis).map((tg, si) => {
      const iso = vtIso(tg), liste = termine.filter((t) => t.datum === iso);
      return `<div class="vt-tag ${iso === heute ? "heute" : ""} ${tg.getDay() % 6 === 0 ? "we" : ""}" style="--s:${si}">
        <header><b>${VT_WT[tg.getDay()]}</b><span>${tg.getDate()}.</span><em>${liste.length || ""}</em></header>
        <div class="vt-tag-inhalt">${liste.map((t) => pill(t, n++)).join("") || "<p class='vt-frei'>frei</p>"}</div></div>`;
    }).join("");
    return `<div class="vt-woche">${spalten}</div>${legende}`;
  }
  // Tagesansicht: Zeitstrahl
  const tagT = termine.filter((t) => t.datum === d.von);
  const mitZeit = tagT.filter((t) => !t.ganztag && t.zeit), ganz = tagT.filter((t) => t.ganztag || !t.zeit);
  const min = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + (m || 0); };
  let von = 7 * 60, bis = 20 * 60;
  mitZeit.forEach((t) => { von = Math.min(von, Math.floor(min(t.zeit) / 60) * 60); bis = Math.max(bis, Math.ceil(min(t.ende || t.zeit) / 60 + 1) * 60); });
  const H = Math.round(Math.max(240, Math.min(470, innerHeight * 0.52 - (ganz.length ? 110 : 70)))), y = (m) => ((m - von) / (bis - von)) * H;
  const stunden = []; for (let h = von / 60; h <= bis / 60; h++) stunden.push(`<div class="vt-std" style="top:${y(h * 60)}px"><span>${String(h).padStart(2, "0")}:00</span></div>`);
  const jetzt = new Date(), jm = jetzt.getHours() * 60 + jetzt.getMinutes();
  const linie = d.von === heute && jm >= von && jm <= bis ? `<div class="vt-jetzt" style="top:${y(jm)}px"><span>JETZT</span></div>` : "";
  // Überschneidungen nebeneinander (Spalten je Gruppe)
  const zeiten = mitZeit.map((t) => { const a = min(t.zeit); return { t, a, e: Math.max(a + 30, t.ende ? min(t.ende) : a + 60) }; }).sort((x, z) => x.a - z.a);
  let gruppe = [], gEnde = -1;
  const fertig = () => { const sp = []; gruppe.forEach((x) => { let k = sp.findIndex((ende) => ende <= x.a); if (k < 0) { k = sp.length; sp.push(0); } sp[k] = x.e; x.sp = k; }); gruppe.forEach((x) => { x.n = sp.length; }); gruppe = []; };
  zeiten.forEach((x) => { if (x.a >= gEnde && gruppe.length) fertig(); gruppe.push(x); gEnde = Math.max(gEnde, x.e); }); fertig();
  const bloecke = zeiten.map(({ t, a, e, sp, n }, i) => {
    return `<button type="button" class="vt-block ${t.dienst ? "dienst" : ""}" style="--i:${i};top:${y(a)}px;height:${Math.max(26, y(e) - y(a) - 3)}px;left:calc(6px + (100% - 12px) * ${sp / n});width:calc((100% - 12px) / ${n} - 4px);right:auto"
      data-frage="${esc(`Erzähl mir mehr zum Termin „${t.titel}“`)}"><b>${esc(t.zeit)}${t.ende ? "–" + esc(t.ende) : ""}</b> ${esc(t.titel)}${t.ort ? ` · <i>${esc(t.ort)}</i>` : ""}</button>`;
  }).join("");
  return `${ganz.length ? `<div class="vt-ganz">${ganz.map((t, i) => pill(t, i)).join("")}</div>` : ""}
    <div class="vt-strahl" style="height:${H}px">${stunden.join("")}${linie}${bloecke}</div>${legende}`;
}
function vtWetterIcon(code) {
  const sonne = `<circle cx="24" cy="24" r="8" class="w-sonne"/><g class="w-strahlen">${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${24 + Math.cos(a) * 12}" y1="${24 + Math.sin(a) * 12}" x2="${24 + Math.cos(a) * 16}" y2="${24 + Math.sin(a) * 16}"/>`; }).join("")}</g>`;
  const wolke = (dx = 0, dy = 0) => `<path class="w-wolke" transform="translate(${dx} ${dy})" d="M14 34 h22 a7 7 0 0 0 0 -14 a10 10 0 0 0 -19 -2 a6 6 0 0 0 -3 16 z"/>`;
  let g;
  if (code <= 1) g = sonne;
  else if (code <= 2) g = `<g transform="translate(-6 -6) scale(.8)">${sonne}</g>${wolke(2, 4)}`;
  else if (code <= 3 || (code >= 45 && code <= 48)) g = wolke(0, 0) + (code >= 45 ? `<path class="w-nebel" d="M10 40 h28 M14 44 h22"/>` : "");
  else if ((code >= 71 && code <= 77) || code === 85 || code === 86) g = wolke(0, -4) + `<g class="w-flocken"><circle cx="17" cy="38" r="1.6"/><circle cx="25" cy="42" r="1.6"/><circle cx="33" cy="38" r="1.6"/></g>`;
  else if (code >= 95) g = wolke(0, -4) + `<path class="w-blitz" d="M25 32 l-5 9 h5 l-3 8 l9 -11 h-5 l3 -6 z"/>`;
  else g = wolke(0, -4) + `<g class="w-regen"><line x1="17" y1="36" x2="15" y2="42"/><line x1="25" y1="36" x2="23" y2="42"/><line x1="33" y1="36" x2="31" y2="42"/></g>`;
  return `<svg viewBox="0 0 48 48" class="vt-wicon" aria-hidden="true">${g}</svg>`;
}
function vtWetterSzene(d) {
  const w = d.wetter, tage = w.tage || [];
  const lo = Math.min(...tage.map((t) => t.min)), hi = Math.max(...tage.map((t) => t.max)), sp = Math.max(1, hi - lo);
  const karten = tage.map((t, i) => {
    const dt = vtDatum(t.datum);
    return `<div class="vt-wtag" style="--i:${i}"><b>${VT_WT[dt.getDay()]} ${dt.getDate()}.</b>${vtWetterIcon(t.code)}<span class="vt-wtext">${esc(t.text || "")}</span>
      <div class="vt-temp"><em>${t.max}°</em><div class="vt-tskala"><i style="--a:${(t.min - lo) / sp};--e:${(t.max - lo) / sp}"></i></div><em class="min">${t.min}°</em></div>
      <span class="vt-regen ${t.regen >= 50 ? "hoch" : ""}">☂ ${t.regen ?? 0} %</span></div>`;
  }).join("");
  const a = w.aktuell ? `<div class="vt-jetztwetter">${vtWetterIcon(w.aktuell.code)}<div><b>${w.aktuell.temp}°</b><span>${esc(w.aktuell.text || "")} · gefühlt ${w.aktuell.gefuehlt}° · Wind ${w.aktuell.wind_kmh} km/h</span></div></div>` : "";
  const rz = (w.reiseziele || []).map((z, i) => `<div class="vt-reisekarte" style="--i:${i}">${vtWetterIcon(z.code ?? 3)}
    <div><b>${esc(z.ort)}${z.zeit ? " · " + esc(z.zeit) : ""}</b><span>${esc(z.termin || "")} · ${z.km} km · ☂ ${(z.zur_terminzeit?.regen ?? z.regen) ?? 0} %</span></div>
    <em>${z.zur_terminzeit ? z.zur_terminzeit.temp : (z.max ?? "–")}°</em></div>`).join("");
  return `<div class="vt-wetter-kopf">${esc(w.ort || "")}${w.quelle === "standort" ? " · AKTUELLER STANDORT" : ""}</div>${a}<div class="vt-wetter ${tage.length > 3 ? "viele" : ""}">${karten}</div>` +
    (rz ? `<div class="vt-reise-titel">HEUTE AUCH UNTERWEGS</div><div class="vt-reise">${rz}</div>` : "");
}
function vtRing(tage, max = 30) {
  const anteil = tage < 0 ? 1 : Math.max(.04, 1 - Math.min(tage, max) / max), u = 2 * Math.PI * 19;
  const kl = tage <= 1 ? "krit" : tage <= 7 ? "warn" : "";
  const txt = tage < 0 ? "!" : tage === 0 ? "HEUTE" : `${tage} T`;
  return `<svg viewBox="0 0 48 48" class="vt-ring ${kl}"><circle cx="24" cy="24" r="19" class="r-grund"/>
    <circle cx="24" cy="24" r="19" class="r-wert" style="--u:${u};--a:${anteil}" transform="rotate(-90 24 24)"/>
    <text x="24" y="27.5">${txt}</text></svg>`;
}
function vtFristenSzene(d) {
  let n = 0;
  const f = (d.fristen || []).map((x) => `<button type="button" class="vt-frist" style="--i:${n++}" data-frage="${esc(`Was muss ich für „${x.titel}“ tun?`)}">${vtRing(x.tage)}
    <div><b>${esc(x.titel)}</b><span>${x.datum.split("-").reverse().join(".")} · ${x.tage < 0 ? "überfällig" : x.tage === 0 ? "heute" : x.tage === 1 ? "morgen" : `in ${x.tage} Tagen`}</span></div></button>`).join("");
  const z = (d.zahlungen || []).map((x) => `<button type="button" class="vt-frist zahlung" style="--i:${n++}" data-frage="${esc(`Zeig mir den Stand der ${x.titel}`)}">${vtRing(x.tage, 14)}
    <div><b>${esc(x.titel)}</b><span>${esc(x.betrag)} · bis ${x.datum.split("-").reverse().join(".")}</span></div><em>€</em></button>`).join("");
  return `<div class="vt-fristen">${f}${z}</div>`;
}
function vtPostSzene(d) {
  const kachel = (titel, zahl, inhalt, i) => `<div class="vt-kachel" style="--i:${i}"><header><b data-zahl="${zahl}">0</b><span>${titel}</span></header>${inhalt}</div>`;
  const out = [];
  if (d.mails) out.push(kachel("UNGELESENE MAILS", d.mails.ungelesen || 0, `<ul>${(d.mails.neueste || []).map((m) =>
    `<li><button type="button" data-frage="${esc(`Fasse mir die Mail „${m.betreff}“ von ${m.von} zusammen`)}"><b>${esc(m.von)}</b><span>${esc(m.betreff)}</span></button></li>`).join("")}</ul>`, 0));
  if ((d.erinnerungen || []).length) out.push(kachel("FÄLLIGE ERINNERUNGEN", d.erinnerungen.length, `<ul>${d.erinnerungen.map((e) =>
    `<li><b>${esc(e.titel)}</b><span>${e.faellig ? e.faellig.split("-").reverse().join(".") : ""}</span></li>`).join("")}</ul>`, 1));
  if ((d.geburtstage || []).length) out.push(kachel("GEBURTSTAGE", d.geburtstage.length, `<ul>${d.geburtstage.map((g) =>
    `<li><b>${esc(g.name)}</b><span>${g.in_tagen === 0 ? "heute" : g.in_tagen === 1 ? "morgen" : `in ${g.in_tagen} Tagen`}</span></li>`).join("")}</ul>`, 2));
  return `<div class="vt-kacheln">${out.join("")}</div>`;
}
function vtKenntnisSzene(d) {
  return `<div class="vt-chips">${vtKenntnis(d).map((m, i) => {
    const z = vtZeilen(m.meldung);
    return `<button type="button" class="vt-chip" style="--i:${i}" data-frage="${esc(`Was meldet ${STAB_NAMEN[m.agent] || m.name} genau?`)}">${stabLogo(m.agent)}
      <div><b>${esc(STAB_NAMEN[m.agent] || m.name)} <em>G ${m.gewicht}</em></b><span>${esc(z.slice(0, 2).join(" · ") || "Keine Besonderheiten.")}</span></div></button>`;
  }).join("")}</div>`;
}
const VT_RENDER = { AUFTAKT: vtAuftakt, SOFORT: vtSofortSzene, TERMINE: vtTermineSzene, WETTER: vtWetterSzene,
  FRISTEN: vtFristenSzene, POST: vtPostSzene, KENNTNIS: vtKenntnisSzene };

// ---------- Steuerung ----------
function vtZaehlen(root) {
  root.querySelectorAll("[data-zahl]").forEach((el) => {
    const ziel = +el.dataset.zahl, t0 = performance.now(), dauer = 900;
    (function lauf(t) { const p = Math.min(1, (t - t0) / dauer); el.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(lauf); })(t0);
  });
}
function vtZeige(i) {
  if (!VT.el || i < 0 || i >= VT.szenen.length) return;
  if (i === VT.i) return;
  const name = VT.szenen[i], buehne = VT.el.querySelector(".vt-buehne"), alt = buehne.querySelector(".vt-szene:not(.weg)");
  const neu = document.createElement("div");
  neu.className = `vt-szene vt-s-${name.toLowerCase()} ${i < VT.i ? "zurueck" : ""}`;
  try { neu.innerHTML = VT_RENDER[name](VT.d); } catch (e) { neu.innerHTML = `<p class="vt-leer">Darstellung nicht möglich.</p>`; uiLog?.(`Vortrag ${name}: ${e}`); }
  if (alt) { alt.classList.add("weg"); setTimeout(() => alt.remove(), 650); }
  buehne.appendChild(neu);
  VT.i = i;
  VT.el.querySelector(".vt-kapitel").textContent = VT_TITEL[name] || name;
  VT.el.querySelectorAll(".vt-nav button").forEach((b, k) => { b.classList.toggle("an", k === i); b.classList.toggle("gesehen", k < i); });
  vtZaehlen(neu);
  sfx?.("tick");
}
function vortragStart(d) {
  vortragZu(true);
  if (!d) return;
  VT.d = d; VT.i = -1; VT.gesprochen = false;
  VT.szenen = ["AUFTAKT", ...(d.szenen || [])];
  const el = VT.el = document.createElement("div");
  el.className = "vortrag";
  el.innerHTML = `<div class="vt-rahmen" role="dialog" aria-label="Lagevortrag">
      <header class="vt-kopf"><span class="vt-marke">◢ ${esc(d.titel || "LAGE")}</span><span class="vt-kapitel"></span>
        <button type="button" class="vt-zu" title="Vortrag schließen (Esc)">✕</button></header>
      <div class="vt-buehne"></div>
      <nav class="vt-nav">${VT.szenen.map((s, k) => `<button type="button" data-k="${k}" title="${esc(VT_TITEL[s] || s)}"><i></i><span>${esc(VT_TITEL[s] || s)}</span></button>`).join("")}</nav>
    </div>`;
  document.body.appendChild(el);
  body.classList.add("mit-vortrag");
  requestAnimationFrame(() => el.classList.add("an"));
  vtZeige(0);
}
function vortragZu(sofort = false) {
  clearInterval(VT.auto); clearTimeout(VT.ruhe); VT.auto = null;
  const el = VT.el; VT.el = null; VT.i = -1;
  body.classList.remove("mit-vortrag");
  if (!el) return;
  if (sofort) { el.remove(); return; }
  el.classList.remove("an"); el.classList.add("aus"); setTimeout(() => el.remove(), 600);
}
window.vortragSzene = (name) => { if (!VT.el) return; VT.gesprochen = true; const i = VT.szenen.indexOf(name); if (i >= 0) vtZeige(i); };
function vtAutoplay(sek = 9) {               // ohne Sprachausgabe: Abschnitte nacheinander zeigen
  clearInterval(VT.auto);
  VT.auto = setInterval(() => { if (!VT.el || VT.i >= VT.szenen.length - 1) { clearInterval(VT.auto); vtRuhe(); return; } vtZeige(VT.i + 1); }, sek * 1000);
}
function vtRuhe(sek = 75) {                   // nach dem Vortrag offen lassen, später leise schließen
  clearTimeout(VT.ruhe);
  VT.ruhe = setTimeout(() => { if (VT.el && !VT.el.matches(":hover")) vortragZu(); else vtRuhe(30); }, sek * 1000);
}
// Abschnittsmarke in die Vorlesewarteschlange: Szene wechselt, wenn das Gesprochene dort ankommt
function ttsMarke(name) { play.queue.push({ szene: name }); if (!play.running) ttsRun(); }
// Text mit Marken vorlesen (Morgenbriefing)
function vortragSprechen(text) {
  V.turnSpeak = true; V.turnLang = ""; V.privat = false; V.buf = ""; V.ersterSatz = true;
  const teile = String(text || "").split(/\[(SOFORT|TERMINE|WETTER|FRISTEN|POST|KENNTNIS)\][ \t]*\n?/);
  teile.forEach((t, k) => { if (k % 2) ttsMarke(t); else if (t.trim()) { ttsFeed(t); ttsFeed("", true); } });
}
window.vortragSprechen = vortragSprechen;
document.addEventListener("click", (e) => {
  if (!VT.el || !e.target.closest(".vortrag")) return;
  if (e.target.closest(".vt-zu")) { vortragZu(); return; }
  const nav = e.target.closest(".vt-nav button"); if (nav) { clearInterval(VT.auto); vtZeige(+nav.dataset.k); vtRuhe(); return; }
  const f = e.target.closest("[data-frage]");
  if (f) { const frage = f.dataset.frage; ttsStop(); vortragZu(); sendText(frage); }
});
document.addEventListener("keydown", (e) => {
  if (!VT.el || inFeld() || !$("modal").hidden || !$("einst").hidden) return;
  if (e.key === "ArrowRight") { e.preventDefault(); clearInterval(VT.auto); vtZeige(VT.i + 1); vtRuhe(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); clearInterval(VT.auto); vtZeige(VT.i - 1); vtRuhe(); }
  else if (e.key === "Escape") { e.preventDefault(); vortragZu(); }
}, true);
// Sprachbefehle während des Vortrags; jede neue Frage schließt ihn
const _sendTextVT = sendText;
sendText = function (text, viaVoice = false) {
  if (VT.el) {
    const t = (text || "").trim().toLowerCase().replace(/[.!]+$/, "");
    if (/^(weiter|nächste[rns]?( punkt| folie| abschnitt)?|vor)$/.test(t)) { clearInterval(VT.auto); vtZeige(VT.i + 1); vtRuhe(); return; }
    if (/^(zurück|vorherige[rns]?( punkt| folie| abschnitt)?)$/.test(t)) { clearInterval(VT.auto); vtZeige(VT.i - 1); vtRuhe(); return; }
    if (/^(vortrag )?(schließen|beenden|ende|zu|danke)$/.test(t)) { vortragZu(); return; }
    vortragZu();
  }
  return _sendTextVT(text, viaVoice);
};
const _fertigVT = window.fertigGesprochen;
window.fertigGesprochen = function () {
  if (VT.el && VT.gesprochen && !play.queue.length) vtRuhe();
  return _fertigVT?.apply(this, arguments);
};
const _handleVT = handle;
handle = function (ev) {
  if (ev.type === "vortrag") { vortragStart(ev.daten); if (!V.turnSpeak) vtAutoplay(); return; }
  if (ev.type === "marke") {
    if (!VT.el) return;
    if (V.turnSpeak) { ttsFeed("", true); ttsMarke(ev.name); }
    else { clearInterval(VT.auto); window.vortragSzene(ev.name); vtRuhe(); }
    return;
  }
  if (ev.type === "briefing" && ev.vortrag) {
    const el = addMsg("atlas", vtOhneMarken(ev.text)); el.querySelector(".who").textContent = "JARVIS · MORGENBRIEFING";
    vortragStart(ev.vortrag);
    const marken = ev.text_marken || ev.text;
    if (V.out === "aus") { vtAutoplay(); return; }
    if (play.ctx && play.ctx.state === "running") vortragSprechen(marken);
    else {
      try { unlockAudio(); } catch (e) {}
      const los = () => vortragSprechen(marken);
      if (play.ctx?.state === "running") los();
      else if (play.ctx) play.ctx.resume().then(() => play.ctx.state === "running" ? los() : (pendingSpeech = "", vtAutoplay())).catch(() => vtAutoplay());
      else vtAutoplay();
    }
    return;
  }
  _handleVT(ev);
};

// ---------- Standort vom iPhone/Browser (Wetter vor Ort, Reiseziele) ----------
function standortSenden() {
  if (!MOBIL || !navigator.geolocation || document.hidden) return;
  navigator.geolocation.getCurrentPosition((p) => {
    fetch("/standort", { method: "POST", headers: { "content-type": "application/json", ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) },
      body: JSON.stringify({ lat: p.coords.latitude, lon: p.coords.longitude, genauigkeit: p.coords.accuracy, quelle: "iphone" }) })
      .then(() => loadLage?.()).catch(() => {});
  }, () => {}, { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false });
}
if (MOBIL) { setTimeout(standortSenden, 3000); setInterval(standortSenden, 15 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) standortSenden(); }); }

// =====================================================================
//  TESLA: Fahrzeugfenster (Bild, Akku, Laden, Klima, Ort, Steuerung) und Einrichtung unter Verbindungen
// =====================================================================
const TS = { el: null, d: null, busy: false };
function teslaAuto(d) {
  // Eigene Grafik (falls kein Konfigurator-Bild verfügbar ist) – Seitenansicht in Lackfarbe, Holo-Kontur
  const f = d.farbe || "#9aa1a8";
  return `<svg viewBox="0 0 620 230" class="ts-svg" aria-hidden="true">
    <defs><linearGradient id="ts-lack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f}" stop-opacity=".95"/>
      <stop offset=".55" stop-color="${f}" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      <linearGradient id="ts-glas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ff4ff" stop-opacity=".35"/><stop offset="1" stop-color="#02121a" stop-opacity=".9"/></linearGradient></defs>
    <ellipse cx="312" cy="196" rx="270" ry="14" class="ts-boden"/>
    <path class="ts-karosse" fill="url(#ts-lack)" d="M44 160 L58 128 Q84 102 172 92 L246 64 Q306 42 388 46 Q458 50 508 92 L552 104 Q578 110 580 134 L578 156 Q576 168 562 168 L528 168 A44 44 0 0 0 440 168 L196 168 A44 44 0 0 0 108 168 L60 168 Q44 168 44 160 Z"/>
    <path fill="url(#ts-glas)" class="ts-glas" d="M192 96 L254 70 Q306 54 376 56 L378 96 Z M392 56 Q446 60 488 94 L392 96 Z"/>
    <path class="ts-linie" d="M190 100 L560 108 M300 102 L298 160 M386 100 L388 160 M548 116 L572 120 M58 132 L80 128"/>
    <g class="ts-rad"><circle cx="152" cy="168" r="36"/><circle cx="152" cy="168" r="22" class="ts-felge"/>
      <path class="ts-speiche" d="M152 146 V190 M130 168 H174 M137 153 L167 183 M167 153 L137 183"/></g>
    <g class="ts-rad"><circle cx="484" cy="168" r="36"/><circle cx="484" cy="168" r="22" class="ts-felge"/>
      <path class="ts-speiche" d="M484 146 V190 M462 168 H506 M469 153 L499 183 M499 153 L469 183"/></g>
  </svg>`;
}
function teslaZeit(min) { if (min == null) return ""; const t = new Date(Date.now() + min * 60000); return t.toTimeString().slice(0, 5); }
function teslaAkkuFarbe(p) { return p >= 50 ? "var(--good,#3ddc97)" : p >= 20 ? "#ffb547" : "#ff6b4a"; }
function teslaHTML(d) {
  if (d.leer) return `<div class="ts-leer">Noch keine Daten – „AKTUALISIEREN“ weckt das Auto und lädt den Stand.</div>`;
  const l = d.laden || {}, k = d.klima || {}, o = d.ort || {}, akku = d.akku ?? 0;
  const laedt = l.zustand === "Charging";
  const stand = d.stand ? new Date(d.stand).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const ladeText = laedt ? `Lädt mit ${l.leistung_kw ?? "–"} kW${l.minuten_bis_voll ? " · voll um " + teslaZeit(l.minuten_bis_voll) : ""}`
    : l.zustand === "Complete" ? "Fertig geladen" : l.kabel ? "Kabel steckt · lädt nicht" : "Nicht angeschlossen";
  const bild = `<img class="ts-bild" alt="" src="/tesla/bild?modell=${encodeURIComponent(d.modell_code || "my")}&lack=${encodeURIComponent(d.lack || "")}&v=${TS.bildV || 0}"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ts-bild-svg',innerHTML:teslaAuto(TS.d||{})}))">`;
  return `<div class="ts-grid">
    <div class="ts-links">
      <div class="ts-buehne ${laedt ? "laedt" : ""} ${k.an ? "klima" : ""}">${d.eigenes_bild || (d.lack && !d.highland) ? bild : `<div class="ts-bild-svg">${teslaAuto(d)}</div>`}
        ${d.eigenes_bild ? "" : `<button type="button" class="ts-foto-hinweis" data-t="foto">＋ EIGENES FOTO – für ein echtes Bild deines Autos</button>`}
        <div class="ts-scan"></div>${laedt ? `<div class="ts-kabel"><i></i></div>` : ""}
        ${k.an ? `<div class="ts-luft"><i></i><i></i><i></i></div>` : ""}</div>
      <div class="ts-akku">
        <div class="ts-akku-zahl"><b data-zahl="${akku}">${akku}</b><span>%</span><em>${d.reichweite_km ?? "–"} km</em></div>
        <div class="ts-akku-balken"><i style="--p:${akku / 100};--f:${teslaAkkuFarbe(akku)}" class="${laedt ? "laedt" : ""}"></i>
          ${l.limit ? `<u style="left:${l.limit}%" title="Ladelimit ${l.limit} %"><span>${l.limit} %</span></u>` : ""}</div>
        <div class="ts-akku-text">${esc(ladeText)}${l.plan_text ? ` · <b>${esc(l.plan_text)}</b>` : ""}</div>
      </div>
    </div>
    <div class="ts-rechts">
      <section class="ts-kachel"><h5>KLIMA <em class="${k.an ? "an" : ""}">${k.an ? "LÄUFT" : "AUS"}</em></h5>
        <div class="ts-temp"><div><b>${k.innen != null ? Math.round(k.innen) + "°" : "–"}</b><span>INNEN</span></div>
          <div><b>${k.aussen != null ? Math.round(k.aussen) + "°" : "–"}</b><span>AUSSEN</span></div>
          <div class="ts-soll"><button type="button" data-t="klima-minus">−</button><b data-soll="${k.soll ?? 21}">${(k.soll ?? 21).toFixed(1).replace(".0", "")}°</b>
            <button type="button" data-t="klima-plus">+</button><span>WUNSCH</span></div></div>
        <button type="button" class="ts-haupt ${k.an ? "an" : ""}" data-t="${k.an ? "klima-aus" : "klima-an"}">${k.an ? "KLIMA AUSSCHALTEN" : "KLIMA EINSCHALTEN"}</button></section>
      <section class="ts-kachel"><h5>LADEN</h5>
        <div class="ts-reihe"><button type="button" data-t="laden-start" ${laedt || !l.kabel ? "disabled" : ""}>START</button>
          <button type="button" data-t="laden-stop" ${laedt ? "" : "disabled"}>STOPP</button></div>
        <div class="ts-reihe ts-limit"><input type="range" min="50" max="100" step="5" value="${l.limit ?? 80}" data-f="limit">
          <b data-limit>${l.limit ?? 80} %</b><button type="button" data-t="limit">SETZEN</button></div>
        <div class="ts-plan"><select data-f="modus"><option value="abfahrt" ${l.plan === "DepartBy" ? "selected" : ""}>Abfahrt um</option>
            <option value="start" ${l.plan === "StartAt" ? "selected" : ""}>Ladestart um</option><option value="aus" ${l.plan === "Off" ? "selected" : ""}>Kein Ladeplan</option></select>
          <input type="time" data-f="uhrzeit" value="${l.plan_text ? l.plan_text.slice(-5) : "07:00"}">
          <label><input type="checkbox" data-f="vorklima" checked> vorklimatisieren</label>
          <button type="button" data-t="plan">ÜBERNEHMEN</button></div></section>
      <section class="ts-kachel ts-info"><h5>FAHRZEUG</h5>
        <div class="ts-chips"><span class="${d.verriegelt ? "ok" : "warn"}">${d.verriegelt ? "🔒 verriegelt" : "🔓 offen"}</span>
          <button type="button" class="ts-waechter ${d.waechter ? "an" : ""}" data-t="${d.waechter ? "waechter-aus" : "waechter-an"}" title="Wächtermodus (Sentry) ${d.waechter ? "ausschalten" : "einschalten"} – Live-Kamera nur in der Tesla-App">◉ Wächter ${d.waechter ? "an" : "aus"}</button>${o.faehrt ? `<span class="ok">▶ fährt ${o.geschwindigkeit_kmh ?? ""} km/h</span>` : ""}
          ${d.kilometerstand ? `<span>${d.kilometerstand.toLocaleString("de-DE")} km</span>` : ""}</div>
        <div class="ts-ort">⌖ <b>${esc(o.name || "Standort unbekannt")}</b>${o.lat != null || o.name ? `<button type="button" data-t="karte">LIVE-KARTE</button>` : ""}</div>
        <div class="ts-stand">${d.online ? "Stand " + esc(stand) : `<b>${esc(d.zustand || "schläft")}</b> · letzter Stand ${esc(stand)}`}</div></section>
      ${teslaTermineHTML(d.termine || [])}
    </div></div><div class="ts-status"></div>`;
}
function fzFenster() {
  if (!TS.el) {
    TS.el = document.createElement("div"); TS.el.className = "tesla";
    TS.el.innerHTML = `<div class="ts-rahmen" role="dialog" aria-label="Fahrzeug"><header class="vt-kopf"><span class="vt-marke">◢ FAHRZEUG</span>
      <nav class="fz-tabs"><button type="button" data-t="tab-tesla">TESLA</button><button type="button" data-t="tab-ford">FORD</button></nav>
      <span class="vt-kapitel ts-titel"></span><button type="button" class="ts-neu" data-t="foto" title="Eigenes Foto deines Autos verwenden (Hintergrund wird automatisch entfernt)">BILD ÄNDERN</button>
      <button type="button" class="ts-neu" data-t="neu" title="Aktuelle Werte holen (weckt das Auto)">AKTUALISIEREN</button><input type="file" accept="image/*,.heic" hidden class="ts-datei">
      <button type="button" class="vt-zu" data-t="zu" title="Schließen (Esc)">✕</button></header><div class="ts-inhalt"></div></div>`;
    document.body.appendChild(TS.el);
    requestAnimationFrame(() => TS.el.classList.add("an"));
  }
  TS.el.querySelectorAll(".fz-tabs button").forEach((b) => b.classList.toggle("an", b.dataset.t === "tab-" + TS.fz));
}
function teslaZeigen(d) {
  TS.d = d; TS.fz = "tesla"; fzFenster();
  TS.el.querySelector(".ts-titel").textContent = `${(d.name || "Tesla").toUpperCase()}${d.modell ? " · " + d.modell.toUpperCase() : ""}${d.baujahr ? " · " + d.baujahr : ""}`;
  TS.el.querySelector(".ts-inhalt").innerHTML = teslaHTML(d);
  if (typeof vtZaehlen === "function") vtZaehlen(TS.el);
}
function teslaZu() { if (!TS.el) return; const el = TS.el; TS.el = null; el.classList.remove("an"); setTimeout(() => el.remove(), 500); }
async function teslaLaden(wecken = false) {
  const st = TS.el?.querySelector(".ts-status"); if (st) { st.textContent = wecken ? "Wecke das Auto …" : "Lade …"; st.className = "ts-status"; }
  try { const r = await fetch(`/tesla?wecken=${wecken ? 1 : 0}`, { headers: TOKEN ? { "x-atlas-token": TOKEN } : {} });
    const j = await r.json(); if (!r.ok) throw new Error(j.detail || r.status); teslaZeigen(j); }
  catch (e) { if (st) { st.textContent = "⚠ " + e.message; st.className = "ts-status fehler"; } else toast("Tesla: " + e.message); }
}
async function teslaBefehl(befehl, args, text) {
  const st = TS.el.querySelector(".ts-status"); st.textContent = text + " …"; st.className = "ts-status";
  TS.el.querySelectorAll(".ts-rechts button").forEach((b) => b.disabled = true);
  try { await vbPost("/tesla/befehl", { befehl, args }); st.textContent = "✓ " + text; st.className = "ts-status ok"; sfx?.("ok");
    setTimeout(() => teslaLaden(false), 2500); }
  catch (e) { st.textContent = "⚠ " + e.message; st.className = "ts-status fehler"; TS.el.querySelectorAll(".ts-rechts button").forEach((b) => b.disabled = false); }
}
document.addEventListener("click", async (e) => {
  if (!TS.el || !e.target.closest(".tesla")) return;
  const b = e.target.closest("[data-t]"); if (!b) return;
  const t = b.dataset.t, f = (n) => TS.el.querySelector(`[data-f="${n}"]`);
  if (t === "zu") return teslaZu();
  if (t === "tab-ford") return fordLaden();
  if (t === "tab-tesla") return teslaLaden(false);
  if (TS.fz === "ford" && t !== "foto") return fordKlick(t);
  if (t === "neu") return teslaLaden(true);
  if (t === "foto") { TS.el.querySelector(".ts-datei").click(); return; }
  if (t === "klima-an") return teslaBefehl("klima", { an: true }, "Klima wird eingeschaltet");
  if (t === "klima-aus") return teslaBefehl("klima", { an: false }, "Klima wird ausgeschaltet");
  if (t === "klima-plus" || t === "klima-minus") {
    const el = TS.el.querySelector("[data-soll]"); let v = parseFloat(el.dataset.soll) + (t === "klima-plus" ? 0.5 : -0.5);
    v = Math.min(28, Math.max(15, v)); el.dataset.soll = v; el.textContent = String(v).replace(".0", "") + "°";
    clearTimeout(TS.tempT); TS.tempT = setTimeout(() => teslaBefehl("klima", { an: true, temperatur: v }, `Klima auf ${v} °C`), 1200); return;
  }
  if (t === "waechter-an") return teslaBefehl("waechter_an", {}, "Wächtermodus wird eingeschaltet");
  if (t === "waechter-aus") { if (!(await frage({ titel: "TESLA · WÄCHTERMODUS", text: "Wächtermodus ausschalten?", ok: "AUSSCHALTEN", gefahr: true }))) return; return teslaBefehl("waechter_aus", {}, "Wächtermodus wird ausgeschaltet"); }
  if (t === "laden-start") return teslaBefehl("laden", { aktion: "start" }, "Laden wird gestartet");
  if (t === "laden-stop") return teslaBefehl("laden", { aktion: "stop" }, "Laden wird gestoppt");
  if (t === "limit") return teslaBefehl("laden", { aktion: "limit", prozent: +f("limit").value }, `Ladelimit ${f("limit").value} %`);
  if (t === "plan") {
    const modus = f("modus").value, uhrzeit = f("uhrzeit").value;
    return teslaBefehl("ladeplan", { modus, uhrzeit, vorklimatisieren: f("vorklima").checked },
      modus === "aus" ? "Ladeplan wird ausgeschaltet" : `Ladeplan: ${modus === "abfahrt" ? "Abfahrt" : "Ladestart"} ${uhrzeit}`);
  }
  if (t === "karte") { teslaZu(); window.teslaKarteOeffnen(); }
});
document.addEventListener("input", (e) => { if (TS.el && e.target.matches('.tesla [data-f="limit"]')) TS.el.querySelector("[data-limit]").textContent = e.target.value + " %"; });
document.addEventListener("keydown", (e) => { if (TS.el && e.key === "Escape" && !inFeld()) teslaZu(); });
const _handleTesla = handle;
handle = function (ev) {
  if (ev.type === "tesla") { teslaZeigen(ev.daten || {}); return; }
  if (ev.type === "tesla_verbunden") { toast((ev.ok ? "✓ " : "⚠ ") + ev.text); if (!$("einst").hidden) teslaVbAufbauen(); return; }
  _handleTesla(ev);
};
window.teslaAnzeigen = () => teslaLaden(false);

// ---------- Einrichtung (Einstellungen → Verbindungen → Tesla) ----------
async function teslaVbAufbauen() {
  const box = $("einst-vb"); if (!box) return;
  let z; try { z = await api("/verbindungen/tesla"); } catch (e) { return; }
  const fertig = z.angemeldet && z.vin;
  const schritt = (n, ok, titel, inhalt, aktiv) => `<div class="ts-schritt ${ok ? "ok" : aktiv ? "aktiv" : ""}"><b>${ok ? "✓" : n}</b><div><h6>${titel}</h6>${ok && !aktiv ? "" : inhalt}</div></div>`;
  const s1 = !z.app, s2 = !s1 && !z.veroeffentlicht, s3 = !s1 && !s2 && !z.registriert, s4 = !s1 && !s2 && !s3 && !z.angemeldet,
    s5 = !s1 && !s2 && !s3 && !s4 && !z.virtueller_schluessel;
  const origin = z.origin || "https://<dein-github-name>.github.io";
  const inhalt = `<p class="vb-hilfe">Offizielle Tesla-Schnittstelle (Fleet API) mit deinem eigenen Zugang. Für ein Auto deckt Teslas
      Monatsguthaben die Abrufe normalerweise ab. Steuerbar sind nur Klima und Laden – kein Entriegeln.</p>
    ${schritt(1, z.app, "Tesla-Entwickler-App anlegen", `<p class="vb-hilfe">Auf <a data-link="https://developer.tesla.com/">developer.tesla.com</a> mit deinem
      Tesla-Konto anmelden → „Create Application“. Eintragen:<br>· Allowed Origin: <code>${esc(origin)}</code><br>· Redirect URI: <code>${esc(z.redirect)}</code><br>
      · Scopes: Vehicle Information, Vehicle Location, Vehicle Commands, Vehicle Charging Management<br>Danach Client-ID und Client-Secret hier eintragen.</p>
      <div class="vb-feld"><label>Client-ID</label><input type="text" data-tf="client_id" autocomplete="off"></div>
      <div class="vb-feld"><label>Client-Secret</label><input type="password" data-tf="client_secret" autocomplete="off"></div>
      <div class="vb-reihe"><button type="button" class="primary" data-ta="app">${z.app ? "NEU PRÜFEN &amp; SPEICHERN" : "PRÜFEN &amp; SPEICHERN"}</button></div>`, s1 || !z.angemeldet)}
    ${schritt(2, z.veroeffentlicht, "Schlüssel erzeugen &amp; veröffentlichen", `<p class="vb-hilfe">Richtet das Befehlsmodul ein (einmalig 1–2 Min.), erzeugt dein
      Schlüsselpaar und legt den <b>öffentlichen</b> Schlüssel auf deine GitHub-Seite (${esc(origin)}). Der private Schlüssel bleibt auf diesem Mac.</p>
      <div class="vb-reihe">${z.helfer ? "" : `<button type="button" data-ta="helfer" ${z.helfer_laedt ? "disabled" : ""}>${z.helfer_laedt ? "MODUL WIRD EINGERICHTET …" : "1 · BEFEHLSMODUL EINRICHTEN"}</button>`}
      <button type="button" class="primary" data-ta="schluessel" ${z.helfer ? "" : "disabled"}>${z.helfer ? "" : "2 · "}SCHLÜSSEL VERÖFFENTLICHEN</button></div>`, s2)}
    ${schritt(3, z.registriert, "Bei Tesla registrieren", `<p class="vb-hilfe">Meldet deine App für Europa bei Tesla an (prüft den veröffentlichten Schlüssel).
      Falls abgelehnt: 2 Minuten warten und erneut.</p><div class="vb-reihe"><button type="button" class="primary" data-ta="registrieren">REGISTRIEREN</button></div>`, s3)}
    ${schritt(4, z.angemeldet, "Mit Tesla anmelden", `<p class="vb-hilfe">Öffnet die Tesla-Anmeldung im Browser. Dort einloggen und Zugriff erlauben – danach meldet
      sich JARVIS automatisch.${z.fahrzeug ? " Verbunden: <b>" + esc(z.fahrzeug) + "</b>" : ""}</p>
      <div class="vb-reihe"><button type="button" class="primary" data-ta="anmelden">${z.angemeldet ? "NEU ANMELDEN" : "ANMELDEN"}</button></div>`, s4)}
    ${schritt(5, z.virtueller_schluessel, "Virtuellen Schlüssel ins Auto (für Klima &amp; Laden)", `<p class="vb-hilfe">Mit dem iPhone (Tesla-App angemeldet) den
      Code scannen oder den Link öffnen, dann im Auto auf der Schlüsselkarte bestätigen. Ohne diesen Schritt funktioniert nur der Statusabruf.</p>
      <div class="ts-qr"></div><div class="vb-reihe"><button type="button" data-ta="vschluessel">CODE ZEIGEN</button>
      <button type="button" class="primary" data-ta="vschluessel_ok">IM AUTO BESTÄTIGT</button></div>`, s5)}
    ${z.fehler ? `<p class="vb-hilfe" style="color:var(--crit,#ff6b4a)">${esc(z.fehler)}</p>` : ""}
    ${fertig ? `<div class="vb-reihe"><button type="button" data-ta="zeigen">FAHRZEUG ANZEIGEN</button></div>` : ""}`;
  let zeile = box.querySelector('details[data-id="tesla"]');
  const html = vbZeile("tesla", "Tesla", fertig ? { ok: true, text: `✓ ${z.fahrzeug || "verbunden"}${z.virtueller_schluessel ? "" : " · nur Status"}` }
    : { text: z.app ? "Einrichtung läuft" : "– nicht eingerichtet" }, inhalt, zeile?.open);
  if (zeile) zeile.outerHTML = html; else box.insertAdjacentHTML("beforeend", html);
  if (z.helfer_laedt) setTimeout(() => { if (!$("einst").hidden) teslaVbAufbauen(); }, 6000);
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ta]"); if (!b || !b.closest('details[data-id="tesla"]')) return;
  const zeile = b.closest(".vb-zeile"), st = zeile.querySelector(".vb-status");
  const melde = (t, art = "") => { st.textContent = t; st.className = "vb-status " + art; };
  const a = b.dataset.ta;
  if (a === "zeigen") { einstZu(); teslaLaden(false); return; }
  b.disabled = true; melde(a === "schluessel" ? "Erzeuge und veröffentliche …" : "Einen Moment …");
  try {
    const daten = a === "app" ? { client_id: zeile.querySelector('[data-tf="client_id"]').value, client_secret: zeile.querySelector('[data-tf="client_secret"]').value } : {};
    const r = await vbPost(`/verbindungen/tesla/${a}`, daten);
    if (a === "vschluessel") { zeile.querySelector(".ts-qr").innerHTML = `${r.qr || ""}<p class="vb-hilfe"><a data-link="${esc(r.link)}">${esc(r.link)}</a></p>`; melde(""); b.disabled = false; return; }
    melde(r.text || "✓", "ok");
    setTimeout(teslaVbAufbauen, a === "anmelden" ? 8000 : 900);
  } catch (err) { melde(err.message, "fehler"); b.disabled = false; }
});
const _vbAufbauenTesla = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenTesla(...a); teslaVbAufbauen(); };

// Eigenes Fahrzeugfoto hochladen (wird auf dem Mac freigestellt)
document.addEventListener("change", async (e) => {
  if (!e.target.matches(".tesla .ts-datei") || !e.target.files.length) return;
  const f = e.target.files[0], st = TS.el.querySelector(".ts-status");
  st.textContent = "Bild wird übernommen und freigestellt …"; st.className = "ts-status";
  try {
    const r = await fetch(`/${TS.fz === "ford" ? "ford" : "tesla"}/bild`, { method: "POST", body: f, headers: { "x-dateiname": encodeURIComponent(f.name).replace(/%20/g, " "),
      ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) } });
    const j = await r.json(); if (!r.ok) throw new Error(j.detail || r.status);
    TS.bildV = Date.now();
    if (TS.fz === "ford") { TS.fd.eigenes_bild = true; fordZeigen(TS.fd); } else if (TS.d) { TS.d.eigenes_bild = true; teslaZeigen(TS.d); }
    const st2 = TS.el.querySelector(".ts-status"); st2.textContent = j.text; st2.className = "ts-status ok";
  } catch (err) { st.textContent = "⚠ " + err.message; st.className = "ts-status fehler"; }
  e.target.value = "";
});

// =====================================================================
//  TESLA LIVE-KARTE: 3D-Fahrzeugsymbol, Fahrt-Animation, Minimieren an den Rand (schwebend, ohne Kanten)
// =====================================================================
const TL = { an: false, mini: false, marke: null, pos: null, anzeige: null, timer: null, raf: 0, spur: [], folgen: true };
function tlAutoSVG(farbe = "#e9ecef") {
  // Draufsicht mit Licht und Schatten – liegt dank pitchAlignment flach auf der Straße und kippt mit der Karte
  return `<svg viewBox="0 0 60 110" class="tl-auto-svg" aria-hidden="true">
    <defs><linearGradient id="tl-lack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${farbe}" stop-opacity=".72"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="${farbe}" stop-opacity=".72"/></linearGradient>
      <linearGradient id="tl-lack2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${farbe}"/><stop offset="1" stop-color="${farbe}" stop-opacity=".82"/></linearGradient>
      <linearGradient id="tl-glas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2733"/><stop offset=".5" stop-color="#0e3a4c"/><stop offset="1" stop-color="#061820"/></linearGradient>
      <radialGradient id="tl-kegel" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#e9fbff" stop-opacity=".85"/><stop offset="1" stop-color="#9ff4ff" stop-opacity="0"/></radialGradient></defs>
    <path class="tl-kegel" d="M18 6 L2 -46 L58 -46 L42 6 Z" fill="url(#tl-kegel)"/>
    <rect x="8" y="10" width="44" height="92" rx="16" class="tl-schatten"/>
    <rect x="3" y="20" width="6" height="16" rx="2.5" class="tl-rad"/><rect x="51" y="20" width="6" height="16" rx="2.5" class="tl-rad"/>
    <rect x="3" y="74" width="6" height="16" rx="2.5" class="tl-rad"/><rect x="51" y="74" width="6" height="16" rx="2.5" class="tl-rad"/>
    <path d="M30 4 C44 4 52 10 53 24 L54 84 C54 98 46 104 30 104 C14 104 6 98 6 84 L7 24 C8 10 16 4 30 4 Z" fill="url(#tl-lack2)" class="tl-karosse"/>
    <path d="M30 6 C41 6 47 11 48 22 L49 40 L11 40 L12 22 C13 11 19 6 30 6 Z" fill="url(#tl-lack)" opacity=".55"/>
    <path d="M13 34 C18 30 42 30 47 34 L45 50 C38 48 22 48 15 50 Z" fill="url(#tl-glas)"/>
    <path d="M15 52 C22 50 38 50 45 52 L45 80 C38 82 22 82 15 80 Z" fill="url(#tl-glas)" opacity=".9"/>
    <path d="M16 84 C22 86 38 86 44 84 L43 92 C36 94 24 94 17 92 Z" fill="url(#tl-glas)"/>
    <path d="M10 10 Q14 6 20 6" class="tl-licht v"/><path d="M50 10 Q46 6 40 6" class="tl-licht v"/>
    <path d="M10 100 Q16 104 24 104" class="tl-licht h"/><path d="M50 100 Q44 104 36 104" class="tl-licht h"/>
  </svg>`;
}
function tlMarke(pos) {
  const e = document.createElement("div");
  e.className = "tl-marke tl-3d-marke";
  e.innerHTML = `<div class="tl-3d"></div><b class="tl-schild"></b>`;
  return e;
}
// Echtes 3D-Modell (Three.js, wird erst bei Bedarf geladen); ohne WebGL bleibt die flache Grafik
let auto3dLaden = null;
function tlAuto3D() {
  if (window.Auto3D) return Promise.resolve();
  if (!auto3dLaden) auto3dLaden = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "auto3d.bundle.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  return auto3dLaden;
}
async function tl3DStarten(el, pos) {
  const ziel = el.querySelector(".tl-3d");
  try {
    await tlAuto3D();
    TL.modell?.entfernen();
    TL.modell = window.Auto3D.erzeugen(ziel, { farbe: pos.farbe || "#e9ecef", typ: pos.typ || "limousine" });
    tlAusrichten();
  } catch (e) {
    el.classList.remove("tl-3d-marke");
    ziel.innerHTML = `<div class="tl-ring"></div><div class="tl-auto">${tlAutoSVG(pos.farbe)}</div>`;
    TL.marke?.setRotationAlignment("map").setPitchAlignment("map");
    TL.flach = true;
  }
}
function tlAusrichten() {
  const m = KARTE.map, h = TL.anzeige?.heading || 0;
  if (TL.flach) { TL.marke?.setRotation(h); return; }
  if (!TL.modell || !m) return;
  TL.modell.ausrichten(h - m.getBearing(), m.getPitch());
}
function tlSchild() {
  const p = TL.pos; if (!TL.marke || !p) return;
  const s = TL.marke.getElement().querySelector(".tl-schild");
  s.textContent = p.faehrt ? `${p.geschwindigkeit_kmh || 0} KM/H` : (p.online ? "GEPARKT" : "SCHLÄFT");
  TL.marke.getElement().classList.toggle("faehrt", !!p.faehrt);
  TL.modell?.fahrt(!!p.faehrt);
}
function tlInfo() {
  const p = TL.pos; if (!p || !KARTE.el) return;
  const stand = p.stand ? new Date(p.stand).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–";
  $("kh-info").innerHTML = `<div class="kh-werte">
      <div><small>STATUS</small><b>${p.faehrt ? "FÄHRT" : p.online ? "GEPARKT" : "SCHLÄFT"}</b></div>
      <div><small>TEMPO</small><b>${p.faehrt ? (p.geschwindigkeit_kmh || 0) + " km/h" : "–"}</b></div>
      <div><small>RICHTUNG</small><b>${["N", "NO", "O", "SO", "S", "SW", "W", "NW"][Math.round(((p.heading || 0) % 360) / 45) % 8]}</b></div></div>
    <div class="kh-weg"><span>⌖ ${esc(p.ort_name || "Standort")}</span><span>Stand ${esc(stand)}${p.online ? "" : " · letzter bekannter"}</span></div>
    <div class="tl-knoepfe"><button type="button" class="tl-mini-knopf ${p.faehrt ? "an" : ""}" data-tl="mini">◱ MINIMIEREN – LIVE AM RAND VERFOLGEN</button>
      <button type="button" data-tl="folgen" class="${TL.folgen ? "an" : ""}">${TL.folgen ? "◎ KAMERA FOLGT" : "◎ KAMERA FREI"}</button></div>
    <p class="kh-mittel">${p.demo ? "VORSCHAU MIT BEISPIELDATEN" : p.faehrt ? "LIVE · AKTUALISIERUNG ALLE 12 S" : p.online ? "LIVE · AKTUALISIERUNG JEDE MINUTE" : "DAS AUTO SCHLÄFT – ES WIRD NICHT GEWECKT"}</p>`;
}
async function teslaKarte(pos) {
  if (TL.mini) tlMaximieren(true);
  const el = karteGeruest();
  el.hidden = false; void el.offsetWidth; el.classList.add("da", "tl-live"); document.body.classList.add("karte-offen");
  TL.quelle = pos.quelle || "tesla";
  $("kh-titel").textContent = `${(pos.name || "TESLA").toUpperCase()} · ${pos.demo ? "VORSCHAU" : "LIVE"}`;
  el.dataset.apple = pos.lat != null ? `https://maps.apple.com/?ll=${pos.lat},${pos.lon}&q=${encodeURIComponent(pos.name || "Auto")}` : "";
  TL.an = true; TL.pos = pos; TL.spur = pos.lat != null ? [[pos.lon, pos.lat]] : [];
  tlInfo(); sfx?.("ok");
  try { await karteLib(); } catch (e) { return; }
  const ml = window.maplibregl;
  if (!KARTE.map) {
    KARTE.map = new ml.Map({ container: "kh-map", style: "https://tiles.openfreemap.org/styles/dark",
      center: [pos.lon - 30, 25], zoom: 1.2, attributionControl: { compact: true }, fadeDuration: 0 });
    KARTE.map.on("style.load", () => { try { KARTE.map.setProjection({ type: "globe" }); } catch (e) {} karteEinfaerben(KARTE.map); });
    await new Promise((r) => { KARTE.map.once("load", r); setTimeout(r, 6000); });
  } else KARTE.map.resize();
  const m = KARTE.map;
  KARTE.marker.forEach((x) => x.remove()); KARTE.marker = [];
  for (const id of ["route-glut", "route-linie", "route-fluss"]) if (m.getLayer(id)) m.removeLayer(id);
  if (m.getSource("route")) m.removeSource("route");
  tlSpurLayer();
  TL.marke?.remove(); TL.modell?.entfernen(); TL.modell = null; TL.flach = false;
  const markeEl = tlMarke(pos);
  TL.marke = new ml.Marker({ element: markeEl, anchor: "center" }).setLngLat([pos.lon, pos.lat]).addTo(m);
  TL.anzeige = { lon: pos.lon, lat: pos.lat, heading: pos.heading || 0 };
  tl3DStarten(markeEl, pos);
  if (!TL.kameraHook) { TL.kameraHook = true; m.on("move", () => { if (TL.an) tlAusrichten(); }); }
  tlSchild();
  m.jumpTo({ center: [pos.lon - 20, Math.max(-60, Math.min(60, pos.lat - 8))], zoom: 1.6, pitch: 0, bearing: 0 });
  m.flyTo({ center: [pos.lon, pos.lat], zoom: 16.4, pitch: 62, bearing: (pos.heading || 0) - 20, duration: 4200, essential: true, curve: 1.6 });
  tlPlanen();
}
function tlSpurLayer() {
  const m = KARTE.map; if (!m) return;
  if (!m.getSource("tl-spur")) {
    m.addSource("tl-spur", { type: "geojson", lineMetrics: true, data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
    m.addLayer({ id: "tl-spur-glut", type: "line", source: "tl-spur", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#00e5ff", "line-width": 14, "line-blur": 10, "line-opacity": .35 } });
    m.addLayer({ id: "tl-spur", type: "line", source: "tl-spur", layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-width": 4, "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "rgba(0,229,255,0)", 1, "#9ff4ff"] } });
  }
  tlSpurSetzen();
}
function tlSpurSetzen(extra) {
  const q = KARTE.map?.getSource("tl-spur"); if (!q) return;
  const c = extra ? [...TL.spur, extra] : TL.spur;
  q.setData({ type: "Feature", geometry: { type: "LineString", coordinates: c.length > 1 ? c : [] } });
}
function tlPlanen() {
  clearTimeout(TL.timer);
  if (!TL.an) return;
  TL.timer = setTimeout(tlAbruf, TL.pos?.faehrt ? 12000 : 60000);
}
async function tlAbruf() {
  if (!TL.an) return;
  try {
    const r = await fetch(`/${TL.quelle || "tesla"}/position`, { headers: TOKEN ? { "x-atlas-token": TOKEN } : {} });
    if (r.ok) tlNeu(await r.json());
  } catch (e) {}
  tlPlanen();
}
function tlNeu(p) {
  if (!TL.an || p.lat == null) return;
  const vorher = TL.anzeige || { lon: p.lon, lat: p.lat, heading: p.heading || 0 };
  const warFahrt = TL.pos?.faehrt;
  TL.pos = p; tlSchild(); if (!TL.mini) tlInfo();
  const ziel = { lon: p.lon, lat: p.lat, heading: p.heading || vorher.heading };
  const letzte = TL.spur[TL.spur.length - 1];
  if (!letzte || Math.abs(letzte[0] - p.lon) + Math.abs(letzte[1] - p.lat) > 0.00002) { TL.spur.push([p.lon, p.lat]); TL.spur = TL.spur.slice(-80); }
  // weiche Fahrt: das Symbol gleitet in der Abrufzeit zur neuen Position, Kamera folgt
  cancelAnimationFrame(TL.raf);
  const dauer = p.faehrt ? 11500 : 1200, t0 = performance.now();
  let dh = ((ziel.heading - vorher.heading + 540) % 360) - 180;
  const lauf = (t) => {
    if (!TL.an || !TL.marke) return;
    const k = Math.min(1, (t - t0) / dauer), e = p.faehrt ? k : 1 - Math.pow(1 - k, 3);
    const lon = vorher.lon + (ziel.lon - vorher.lon) * e, lat = vorher.lat + (ziel.lat - vorher.lat) * e;
    const hd = vorher.heading + dh * Math.min(1, k * 3);
    TL.anzeige = { lon, lat, heading: hd };
    TL.marke.setLngLat([lon, lat]); tlAusrichten();
    tlSpurSetzen([lon, lat]);
    if (TL.folgen || TL.mini) KARTE.map.jumpTo({ center: [lon, lat], ...(TL.mini && p.faehrt ? { bearing: hd } : {}) });
    if (k < 1) TL.raf = requestAnimationFrame(lauf);
  };
  TL.raf = requestAnimationFrame(lauf);
  if (p.faehrt && !warFahrt && !TL.mini) toast("Das Auto fährt – „Minimieren“ verfolgt es live am Rand");
}
function tlStop() {
  TL.an = false; clearTimeout(TL.timer); cancelAnimationFrame(TL.raf);
  TL.modell?.entfernen(); TL.modell = null;
  TL.marke?.remove(); TL.marke = null;
  const m = KARTE.map;
  if (m) for (const id of ["tl-spur", "tl-spur-glut"]) if (m.getLayer(id)) m.removeLayer(id);
  if (m?.getSource("tl-spur")) m.removeSource("tl-spur");
  KARTE.el?.classList.remove("tl-live", "tl-mini", "tl-wandel");
  document.querySelector(".tl-halo")?.remove();
  TL.mini = false;
}

// ---------- Minimieren / Maximieren (FLIP: Karte schrumpft schwebend an den Rand und wächst zurück) ----------
function tlMiniRect() {
  const g = Math.round(Math.min(300, Math.max(200, innerWidth * 0.2)));
  return { w: g, h: g, x: innerWidth - g - 26, y: Math.round(innerHeight * 0.5 - g / 2) };
}
function tlMinimieren() {
  const el = KARTE.el, m = KARTE.map; if (!el || TL.mini) return;
  const von = el.getBoundingClientRect(), nach = tlMiniRect();
  el.classList.add("tl-wandel");
  el.style.transformOrigin = "0 0";
  el.style.transition = "none";
  // Endlage setzen, dann aus der Startlage hineinanimieren
  el.classList.add("tl-mini"); TL.mini = true; document.body.classList.remove("karte-offen");
  Object.assign(el.style, { left: nach.x + "px", top: nach.y + "px", width: nach.w + "px", height: nach.h + "px", right: "auto", bottom: "auto" });
  m?.resize();
  const sx = von.width / nach.w, sy = von.height / nach.h;
  el.style.transform = `translate(${von.left - nach.x}px, ${von.top - nach.y}px) scale(${sx}, ${sy})`;
  el.style.setProperty("--tl-maske", "300%");
  void el.offsetWidth;
  el.style.transition = "transform .85s cubic-bezier(.65,0,.25,1), --tl-maske .85s cubic-bezier(.65,0,.25,1), opacity .5s";
  el.style.transform = "none";
  el.style.setProperty("--tl-maske", "100%");
  const halo = document.createElement("div"); halo.className = "tl-halo";
  Object.assign(halo.style, { left: nach.x + "px", top: nach.y + "px", width: nach.w + "px", height: nach.h + "px" });
  document.body.appendChild(halo);
  setTimeout(() => { el.classList.remove("tl-wandel"); el.style.transition = ""; halo.classList.add("da"); }, 880);
  if (m) { m.dragPan.disable(); m.scrollZoom.disable(); m.easeTo({ zoom: 15.2, pitch: 55, duration: 900 }); }
  sfx?.("tick");
}
function tlMaximieren(sofort = false) {
  const el = KARTE.el, m = KARTE.map; if (!el || !TL.mini) return;
  const von = el.getBoundingClientRect();
  document.querySelector(".tl-halo")?.remove();
  el.classList.add("tl-wandel"); el.style.transition = "none";
  el.classList.remove("tl-mini"); TL.mini = false;
  for (const k of ["left", "top", "width", "height", "right", "bottom"]) el.style[k] = "";
  document.body.classList.add("karte-offen");
  m?.resize();
  const nach = el.getBoundingClientRect();
  el.style.transformOrigin = "0 0";
  el.style.transform = `translate(${von.left - nach.left}px, ${von.top - nach.top}px) scale(${von.width / nach.width}, ${von.height / nach.height})`;
  el.style.setProperty("--tl-maske", "100%");
  void el.offsetWidth;
  if (sofort) { el.style.transform = ""; el.style.removeProperty("--tl-maske"); el.classList.remove("tl-wandel"); }
  else {
    el.style.transition = "transform .8s cubic-bezier(.65,0,.25,1), --tl-maske .8s cubic-bezier(.65,0,.25,1)";
    el.style.transform = "none"; el.style.setProperty("--tl-maske", "300%");
    setTimeout(() => { el.classList.remove("tl-wandel"); el.style.transition = ""; el.style.transform = ""; el.style.removeProperty("--tl-maske"); }, 840);
  }
  if (m) { m.dragPan.enable(); m.scrollZoom.enable(); m.easeTo({ zoom: 16.4, pitch: 62, duration: 900 }); }
  tlInfo(); sfx?.("ok");
}
document.addEventListener("click", (e) => {
  if (TL.an && e.target.closest("#kh-zu")) { const mini = TL.mini; tlStop(); if (mini) KARTE.el.style.cssText = ""; return; }
  const b = e.target.closest("[data-tl]");
  if (b) { e.preventDefault(); if (b.dataset.tl === "mini") tlMinimieren(); if (b.dataset.tl === "folgen") { TL.folgen = !TL.folgen; tlInfo(); } return; }
  if (TL.mini && e.target.closest(".karte-hud.tl-mini")) { e.preventDefault(); e.stopPropagation(); tlMaximieren(); }
}, true);
addEventListener("resize", () => {
  if (!TL.mini || !KARTE.el) return;
  const r = tlMiniRect(); Object.assign(KARTE.el.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
  const h = document.querySelector(".tl-halo"); if (h) Object.assign(h.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
  KARTE.map?.resize();
});
// Schließen beendet die Live-Verfolgung; andere Karten (Routen) übernehmen das Fenster wieder normal
const _karteZuTL = karteZu;
karteZu = function () { if (TL.an) { const mini = TL.mini; tlStop(); if (mini) { KARTE.el.style.cssText = ""; } } return _karteZuTL(); };
const _karteZeigenTL = karteZeigen;
karteZeigen = function (d) { if (TL.an) { if (TL.mini) tlMaximieren(true); tlStop(); } return _karteZeigenTL(d); };
const _handleTL = handle;
handle = function (ev) {
  if (ev.type === "tesla_karte") { teslaKarte(ev.position); return; }
  _handleTL(ev);
};
window.teslaKarteOeffnen = async () => {
  try { const r = await fetch("/tesla/position", { headers: TOKEN ? { "x-atlas-token": TOKEN } : {} }); const j = await r.json();
    if (!r.ok || j.lat == null) throw new Error(j.detail || "Keine Position"); teslaKarte(j); }
  catch (e) { toast("Tesla: " + e.message); }
};

// ---------- TÜV und Versicherung im Fahrzeugfenster ----------
function teslaTermineHTML(t) {
  const hu = t.find((x) => x.rolle === "hu"), vs = t.find((x) => x.rolle === "versicherung"), kd = t.find((x) => x.rolle === "kuendigung");
  const datum = (iso) => iso.split("-").reverse().join(".");
  const monat = (iso) => { const [j, m] = iso.split("-"); return `${m}/${j}`; };
  const ring = (x, max) => typeof vtRing === "function" ? vtRing(x.tage, max) : `<b class="ts-tage">${x.tage} T</b>`;
  const wann = (n) => n < 0 ? `seit ${-n} Tagen überfällig` : n === 0 ? "heute" : n === 1 ? "morgen" : n < 60 ? `in ${n} Tagen` : `in ${Math.round(n / 30.4)} Monaten`;
  const zeile = (x, titel, text, max) => `<div class="ts-termin ${x.tage <= 30 ? "bald" : ""}">${ring(x, max)}<div><b>${titel}</b><span>${text}</span></div></div>`;
  const leer = !hu && !vs;
  const zeilen = [hu ? zeile(hu, "TÜV / HU", `${monat(hu.datum)} · ${wann(hu.tage)}`, 365) : "",
    vs ? zeile(vs, "VERSICHERUNG", `${vs.versicherer ? esc(vs.versicherer) + " · " : ""}Hauptfälligkeit ${datum(vs.datum)} · ${wann(vs.tage)}`, 365) : "",
    kd ? zeile(kd, "KÜNDBAR BIS", `${datum(kd.datum)} · ${wann(kd.tage)}${kd.tage <= 45 ? " – jetzt Tarife vergleichen" : ""}`, 60) : ""].join("");
  const huWert = hu ? hu.datum.slice(0, 7) : "", vsWert = vs ? vs.datum : "";
  return `<section class="ts-kachel ts-termine"><h5>TERMINE <button type="button" class="ts-mini" data-tt="bearbeiten">${leer ? "EINTRAGEN" : "ÄNDERN"}</button></h5>
    ${leer ? `<p class="ts-hinweis">Noch nicht hinterlegt – TÜV-Monat steht auf der Plakette bzw. im Fahrzeugschein, die Hauptfälligkeit im Versicherungsschein.</p>` : zeilen}
    <div class="ts-termine-form" ${leer ? "" : "hidden"}>
      <label>TÜV / HU fällig<input type="month" data-tf="tuev" value="${huWert}"></label>
      <label>Versicherung – Hauptfälligkeit<input type="date" data-tf="versicherung" value="${vsWert}"></label>
      <label>Versicherer<input type="text" data-tf="versicherer" value="${esc(vs?.versicherer || "")}" placeholder="optional"></label>
      <button type="button" data-tt="speichern">SPEICHERN</button></div></section>`;
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-tt]"); if (!b || !TS.el) return;
  const kachel = b.closest(".ts-termine");
  if (b.dataset.tt === "bearbeiten") { const f = kachel.querySelector(".ts-termine-form"); f.hidden = !f.hidden; return; }
  const wert = (n) => kachel.querySelector(`[data-tf="${n}"]`).value;
  const st = TS.el.querySelector(".ts-status");
  b.disabled = true; st.textContent = "Trage Termine ein …"; st.className = "ts-status";
  try {
    const r = await vbPost(`/${TS.fz === "ford" ? "ford" : "tesla"}/termine`, { tuev: wert("tuev"), versicherung: wert("versicherung"), versicherer: wert("versicherer") });
    if (TS.fz === "ford") { TS.fd.termine = r.termine; fordZeigen(TS.fd); } else { TS.d.termine = r.termine; teslaZeigen(TS.d); }
    const st2 = TS.el.querySelector(".ts-status"); st2.textContent = "✓ Termine eingetragen – mit Erinnerung in „Fristen“"; st2.className = "ts-status ok";
  } catch (err) { st.textContent = "⚠ " + err.message; st.className = "ts-status fehler"; b.disabled = false; }
});

// =====================================================================
//  FORD (Tourneo Custom): Fahrzeugfenster – nur Status (Tank, Reichweite, Reifen, Wartung, Ort, Termine)
//  und Einrichtung unter Verbindungen. Vor der Übergabe: Profil, Foto, Termine und Vorschau mit Beispieldaten.
// =====================================================================
function fordVan(d) {
  const f = d.farbe || "#eef0f1";
  return `<svg viewBox="0 0 620 230" class="ts-svg" aria-hidden="true">
    <defs><linearGradient id="fd-lack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f}" stop-opacity=".95"/>
      <stop offset=".6" stop-color="${f}" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
      <linearGradient id="fd-glas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ff4ff" stop-opacity=".35"/><stop offset="1" stop-color="#02121a" stop-opacity=".9"/></linearGradient></defs>
    <ellipse cx="312" cy="200" rx="275" ry="14" class="ts-boden"/>
    <path class="ts-karosse" fill="url(#fd-lack)" d="M40 166 L44 132 Q48 116 70 110 L122 100 L176 46 Q184 36 202 36 L554 36 Q576 36 578 58 L582 158 Q582 172 568 172 L536 172 A44 44 0 0 0 448 172 L206 172 A44 44 0 0 0 118 172 L56 172 Q40 172 40 166 Z"/>
    <path fill="url(#fd-glas)" class="ts-glas" d="M132 100 L182 50 L204 50 L204 100 Z M216 50 H300 V100 H216 Z M312 50 H424 V100 H312 Z M436 50 H546 Q562 50 564 66 L564 100 H436 Z"/>
    <path class="ts-linie" d="M306 104 L306 168 M210 104 L210 168 M44 140 L84 136 M568 70 L578 70 M300 132 H316"/>
    <path d="M46 124 L84 118" stroke="#e9fbff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    <g class="ts-rad"><circle cx="162" cy="172" r="36"/><circle cx="162" cy="172" r="22" class="ts-felge"/>
      <path class="ts-speiche" d="M162 150 V194 M140 172 H184 M147 157 L177 187 M177 157 L147 187"/></g>
    <g class="ts-rad"><circle cx="492" cy="172" r="36"/><circle cx="492" cy="172" r="22" class="ts-felge"/>
      <path class="ts-speiche" d="M492 150 V194 M470 172 H514 M477 157 L507 187 M507 157 L477 187"/></g>
  </svg>`;
}
function fordReifen(r = {}) {
  const w = (k) => r[k] != null ? `${String(r[k]).replace(".", ",")}` : "–";
  const warn = (k) => r[k] != null && r[k] < 2.3 ? "warn" : "";
  return `<div class="fd-reifen"><span class="${warn("VL")}"><small>VL</small>${w("VL")}</span><span class="${warn("VR")}"><small>VR</small>${w("VR")}</span>
    <i class="fd-umriss"></i><span class="${warn("HL")}"><small>HL</small>${w("HL")}</span><span class="${warn("HR")}"><small>HR</small>${w("HR")}</span></div>`;
}
function fordHTML(d) {
  const o = d.ort || {}, tank = d.tank ?? 0, offen = !d.verbunden && !d.demo;
  const stand = d.stand ? new Date(d.stand).toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const bild = d.eigenes_bild ? `<img class="ts-bild" alt="" src="/ford/bild?v=${TS.bildV || 0}">` : `<div class="ts-bild-svg">${fordVan(d)}</div>`;
  const tankFarbe = tank >= 40 ? "var(--good,#3ddc97)" : tank >= 15 ? "#ffb547" : "#ff6b4a";
  const ok = (b) => b ? `<em class="ok">✓</em>` : `<em>–</em>`;
  const links = offen ? `
      <div class="fd-bereit"><h6>BEREIT ZUR ANBINDUNG${d.erwartet ? " · ÜBERGABE " + esc(d.erwartet) : ""}</h6>
        <ul><li>${ok(true)} Fahrzeugprofil (${esc(d.name)}${d.kennzeichen ? " · " + esc(d.kennzeichen) : ""})</li>
          <li>${ok(d.eigenes_bild)} Eigenes Foto</li>
          <li>${ok((d.termine || []).length)} TÜV &amp; Versicherung</li>
          <li>${ok(false)} Ford-Zugang – nach der Übergabe, ca. 10 Minuten</li></ul>
        <div class="ts-reihe"><button type="button" data-t="einrichten">ANBINDUNG EINRICHTEN</button><button type="button" data-t="vorschau">VORSCHAU ANSEHEN</button></div></div>`
    : `<div class="ts-akku">
        <div class="ts-akku-zahl"><b data-zahl="${tank}">${tank}</b><span>% TANK</span><em>${d.reichweite_km ?? "–"} km</em></div>
        <div class="ts-akku-balken"><i style="--p:${tank / 100};--f:${tankFarbe}"></i></div>
        <div class="ts-akku-text">Diesel · Reichweite laut Bordcomputer${d.aussen != null ? ` · außen <b>${Math.round(d.aussen)}°</b>` : ""}</div></div>`;
  const warnungen = (d.warnungen || []).map((w) => `<span class="warn">⚠ ${esc(w)}</span>`).join("");
  const rechts = offen ? "" : `
      <section class="ts-kachel ts-info"><h5>FAHRZEUG ${d.demo ? `<em class="fd-demo">VORSCHAU</em>` : ""}</h5>
        <div class="ts-chips">${d.verriegelt == null ? "" : `<span class="${d.verriegelt ? "ok" : "warn"}">${d.verriegelt ? "🔒 verriegelt" : "🔓 offen"}</span>`}
          ${o.faehrt ? `<span class="ok">▶ fährt ${o.geschwindigkeit_kmh ?? ""} km/h</span>` : d.zuendung === "on" ? `<span>Zündung an</span>` : ""}
          ${d.kilometerstand != null ? `<span>${d.kilometerstand.toLocaleString("de-DE")} km</span>` : ""}
          ${d.kennzeichen ? `<span>${esc(d.kennzeichen)}</span>` : ""}</div>
        <div class="ts-ort">⌖ <b>${esc(o.name || (o.lat != null ? "Position bekannt" : "Standort unbekannt"))}</b>${o.lat != null ? `<button type="button" data-t="karte">LIVE-KARTE</button>` : ""}</div>
        <div class="ts-stand">${d.hinweis ? `<b>${esc(d.hinweis)}</b>` : "Stand " + esc(stand)}</div></section>
      <section class="ts-kachel"><h5>REIFEN &amp; WARTUNG <em>BAR</em></h5>
        ${fordReifen(d.reifen)}
        <div class="ts-chips fd-wartung">${d.oel != null ? `<span class="${d.oel < 15 ? "warn" : ""}">Öl ${d.oel} %</span>` : ""}
          ${d.adblue != null ? `<span>AdBlue ${esc(String(d.adblue))}</span>` : ""}
          ${d.batterie_v != null ? `<span class="${d.batterie_v < 12.2 ? "warn" : ""}">12 V: ${String(d.batterie_v).replace(".", ",")} V</span>` : ""}${warnungen}</div></section>`;
  return `<div class="ts-grid">
    <div class="ts-links">
      <div class="ts-buehne">${bild}
        ${d.eigenes_bild ? "" : `<button type="button" class="ts-foto-hinweis" data-t="foto">＋ EIGENES FOTO</button>`}<div class="ts-scan"></div></div>
      ${links}
    </div>
    <div class="ts-rechts">${rechts}
      ${teslaTermineHTML(d.termine || [])}
      <p class="fd-nur">Nur Status – Ford erlaubt über diese Schnittstelle keine Fernsteuerung (kein Öffnen, Starten, Heizen).</p>
    </div></div><div class="ts-status"></div>`;
}
function fordZeigen(d) {
  TS.fd = d; TS.fz = "ford"; fzFenster();
  TS.el.querySelector(".ts-titel").textContent = `${(d.name || "Ford").toUpperCase()} · ${(d.modell || "Ford Tourneo Custom").toUpperCase()}${d.baujahr ? " · " + d.baujahr : ""}`;
  TS.el.querySelector(".ts-inhalt").innerHTML = fordHTML(d);
  if (typeof vtZaehlen === "function") vtZaehlen(TS.el);
}
async function fordLaden() {
  const st = TS.el?.querySelector(".ts-status"); if (st) { st.textContent = "Lade …"; st.className = "ts-status"; }
  try { fordZeigen(await fdGet("/ford")); }
  catch (e) { if (st) { st.textContent = "⚠ " + e.message; st.className = "ts-status fehler"; } else toast("Ford: " + e.message); }
}
async function fdGet(pfad) {
  const r = await fetch(pfad, { headers: TOKEN ? { "x-atlas-token": TOKEN } : {} });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.detail || `Fehler ${r.status}`);
  return j;
}
function fordEinrichtungOeffnen() {
  window.einstellungenOeffnen();
  setTimeout(() => { const z = document.querySelector('#einst-vb details[data-id="ford"]'); if (z) { z.open = true; z.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 900);
}
async function fordKlick(t) {
  if (t === "neu") return fordLaden();
  if (t === "karte") { teslaZu(); return window.fordKarteOeffnen(); }
  if (t === "einrichten") { teslaZu(); return fordEinrichtungOeffnen(); }
  if (t === "vorschau") { try { await vbPost("/verbindungen/ford/demo", { an: true }); } catch (e) {} return fordLaden(); }
}
const _handleFord = handle;
handle = function (ev) {
  if (ev.type === "ford") { fordZeigen(ev.daten || {}); return; }
  if (ev.type === "ford_verbunden") { toast((ev.ok ? "✓ " : "⚠ ") + ev.text); if (!$("einst").hidden) fordVbAufbauen(); return; }
  _handleFord(ev);
};
window.fordAnzeigen = () => fordLaden();
window.fordKarteOeffnen = async () => {
  try { const j = await fdGet("/ford/position"); if (j.lat == null) throw new Error("Keine Position bekannt"); teslaKarte(j); }
  catch (e) { toast("Ford: " + e.message); }
};

// ---------- Einrichtung (Einstellungen → Verbindungen → Ford) ----------
const FORD_FARBEN = [["Frozen White", "#eef0f1"], ["Agate Black", "#15171a"], ["Magnetic (Grau)", "#4b5056"], ["Moondust Silver", "#a9aeb3"],
  ["Chrome Blue", "#1f3e6e"], ["Race Red", "#b3121f"]];
async function fordVbAufbauen() {
  const box = $("einst-vb"); if (!box) return;
  let z; try { z = await api("/verbindungen/ford"); } catch (e) { return; }
  const p = z.profil, fertig = z.angemeldet && z.fahrzeug_id;
  const schritt = (n, ok, titel, inhalt, aktiv) => `<div class="ts-schritt ${ok ? "ok" : aktiv ? "aktiv" : ""}"><b>${ok ? "✓" : n}</b><div><h6>${titel}</h6>${ok && !aktiv ? "" : inhalt}</div></div>`;
  const farbe = FORD_FARBEN.map(([n, h]) => `<option value="${h}" ${p.farbe === h ? "selected" : ""}>${n}</option>`).join("");
  const autos = (z.fahrzeuge || []).map((a) => `<option value="${esc(a.id)}" ${a.id === z.fahrzeug_id ? "selected" : ""}>${esc(a.name)} · ${esc(a.vin || a.modell)}</option>`).join("");
  const u = z.urls || {};
  const inhalt = `<p class="vb-hilfe">Offizielle Ford-Schnittstelle (FordConnect Query) mit deinem eigenen Zugang – <b>nur Lesen</b>: Tank, Reichweite,
      Kilometerstand, Standort, Reifendruck, Wartung. Eine Fernsteuerung bietet Ford darüber nicht an.</p>
    ${schritt("A", false, "Schon jetzt: Fahrzeugprofil", `<p class="vb-hilfe">Name, Farbe (für die 3D-Karte und die Grafik) und Kennzeichen. TÜV und Versicherung
      trägst du im Fahrzeugfenster unter „Termine“ ein.</p>
      <div class="vb-feld"><label>Name</label><input type="text" data-ff="name" value="${esc(p.name)}" placeholder="z. B. Bus"></div>
      <div class="vb-feld"><label>Farbe</label><select data-ff="farbe">${farbe}</select></div>
      <div class="vb-feld"><label>Kennzeichen</label><input type="text" data-ff="kennzeichen" value="${esc(p.kennzeichen)}" placeholder="optional"></div>
      <div class="vb-feld"><label>Übergabe</label><input type="text" data-ff="erwartet" value="${esc(p.erwartet || "März 2027")}"></div>
      <div class="vb-reihe"><button type="button" class="primary" data-fa="profil">SPEICHERN</button>
        <button type="button" data-fa="demo" data-an="${z.demo ? 0 : 1}">${z.demo ? "VORSCHAU AUSSCHALTEN" : "VORSCHAU MIT BEISPIELDATEN"}</button>
        <button type="button" data-fa="zeigen">FAHRZEUG ANZEIGEN</button></div>`, true)}
    ${schritt(1, z.app, "Nach der Übergabe: Ford-Entwickler-App anlegen", `<p class="vb-hilfe">1. Den Ford in der <b>FordPass-App</b> zu deinem Konto hinzufügen.<br>
      2. Auf <a data-link="${esc(z.portal)}">developer.ford.com/developer-eu</a> mit demselben FordPass-Konto anmelden → App anlegen:<br>
      · Verwendung: <b>Persönliche Nutzung</b> · Fahrzeugtypen und Datenkategorien: <b>alle</b><br>
      · Redirect-URL: <code>${esc(z.redirect)}</code><br>
      3. Client-ID und Client-Secret erscheinen <b>nur einmal</b> – sofort hier eintragen. Danach kann es bis zu 2 Stunden dauern, bis Ford die App freischaltet.</p>
      <div class="vb-feld"><label>Client-ID</label><input type="text" data-ff="client_id" autocomplete="off"></div>
      <div class="vb-feld"><label>Client-Secret</label><input type="password" data-ff="client_secret" autocomplete="off"></div>
      <div class="vb-reihe"><button type="button" class="primary" data-fa="app">SPEICHERN</button></div>`, !z.app)}
    ${schritt(2, z.angemeldet, "Mit dem FordPass-Konto anmelden", `<p class="vb-hilfe">Öffnet die Ford-Anmeldung im Browser; danach meldet sich JARVIS automatisch.
      Schlägt es fehl, 1–2 Stunden nach dem Anlegen der App erneut versuchen.</p>
      <div class="vb-reihe"><button type="button" class="primary" data-fa="anmelden" ${z.app ? "" : "disabled"}>${z.angemeldet ? "NEU ANMELDEN" : "ANMELDEN"}</button></div>`, z.app && !z.angemeldet)}
    ${schritt(3, !!fertig, "Fahrzeug auswählen", `${autos ? `<div class="vb-feld"><label>Fahrzeug</label><select data-ff="fahrzeug">${autos}</select></div>` : `<p class="vb-hilfe">Noch keine Fahrzeuge geladen.</p>`}
      <div class="vb-reihe"><button type="button" data-fa="garage" ${z.angemeldet ? "" : "disabled"}>LISTE LADEN</button>
        ${autos ? `<button type="button" class="primary" data-fa="waehlen">ÜBERNEHMEN</button>` : ""}</div>`, z.angemeldet && !fertig)}
    ${z.fehler ? `<p class="vb-hilfe" style="color:var(--crit,#ff6b4a)">${esc(z.fehler)}</p>` : ""}
    <details class="fd-experten"><summary>EXPERTEN – falls Ford Adressen ändert</summary>
      <p class="vb-hilfe">Leer lassen = Standard. Pfade dürfen <code>{id}</code> (Fahrzeug-ID) oder <code>{vin}</code> enthalten.${z.letzter_abruf ? " Letzter Abruf: " + esc(z.letzter_abruf.replace("T", " ")) : ""}</p>
      ${[["auth_url", "Anmelde-Adresse"], ["token_url", "Token-Adresse"], ["api", "API-Basis"], ["garage", "Pfad Fahrzeugliste"], ["telemetrie", "Pfad Fahrzeugdaten"]]
        .map(([k, n]) => `<div class="vb-feld"><label>${n}</label><input type="text" data-fu="${k}" value="${u[k] !== z.standard[k] ? esc(u[k]) : ""}" placeholder="${esc(z.standard[k])}"></div>`).join("")}
      <div class="vb-feld"><label>Kopfzeilen (JSON)</label><input type="text" data-fu="kopfzeilen" value="${Object.keys(u.kopfzeilen || {}).length ? esc(JSON.stringify(u.kopfzeilen)) : ""}" placeholder='{"Application-Id":"…"}'></div>
      <div class="vb-reihe"><button type="button" data-fa="urls">SPEICHERN</button><button type="button" data-fa="urls_standard">STANDARD</button>
        <button type="button" data-fa="rohdaten">EMPFANGENE FELDER</button>${z.angemeldet ? `<button type="button" data-fa="trennen">TRENNEN</button>` : ""}</div>
      <pre class="fd-roh" hidden></pre></details>`;
  let zeile = box.querySelector('details[data-id="ford"]');
  const zust = fertig ? { ok: true, text: `✓ ${z.fahrzeug || p.name} · nur Status` } : z.demo ? { warn: true, text: "Vorschau aktiv" }
    : z.app ? { text: "Einrichtung läuft" } : { text: `vorbereitet – Übergabe ${p.erwartet || "März"}` };
  const html = vbZeile("ford", "Ford Tourneo Custom", zust, inhalt, zeile?.open);
  if (zeile) zeile.outerHTML = html; else box.insertAdjacentHTML("beforeend", html);
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-fa]"); if (!b || !b.closest('details[data-id="ford"]')) return;
  const zeile = b.closest(".vb-zeile"), st = zeile.querySelector(".vb-status");
  const melde = (t, art = "") => { st.textContent = t; st.className = "vb-status " + art; };
  const wert = (n) => zeile.querySelector(`[data-ff="${n}"]`)?.value || "";
  const a = b.dataset.fa;
  if (a === "zeigen") { einstZu(); fordLaden(); return; }
  let pfad = a, daten = {};
  if (a === "profil") { const sel = zeile.querySelector('[data-ff="farbe"]'); daten = { name: wert("name"), farbe: sel.value, kennzeichen: wert("kennzeichen"), erwartet: wert("erwartet") }; }
  if (a === "app") daten = { client_id: wert("client_id"), client_secret: wert("client_secret") };
  if (a === "demo") daten = { an: b.dataset.an === "1" };
  if (a === "waehlen") daten = { id: wert("fahrzeug") };
  if (a === "urls") zeile.querySelectorAll("[data-fu]").forEach((i) => daten[i.dataset.fu] = i.value.trim());
  if (a === "urls_standard") pfad = "urls";
  b.disabled = true; melde("Einen Moment …");
  try {
    const r = await vbPost(`/verbindungen/ford/${pfad}`, daten);
    if (a === "rohdaten") { const pre = zeile.querySelector(".fd-roh"); pre.hidden = false;
      pre.textContent = r.leer ? "Noch nichts empfangen." : `Felder: ${r.felder.join(", ")}\n\n${JSON.stringify(r.roh, null, 1).slice(0, 6000)}`; melde(""); b.disabled = false; return; }
    melde(r.text || "✓", "ok");
    setTimeout(fordVbAufbauen, a === "anmelden" ? 10000 : 800);
  } catch (err) { melde(err.message, "fehler"); b.disabled = false; }
});
const _vbAufbauenFord = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenFord(...a); fordVbAufbauen(); };

// =====================================================================
//  EINSTELLUNGEN: Reiter (Allgemein, Stimme, Stab, Konten, Daten, Fahrzeuge, Immobilien, iPhone) und Suche
//  Die Verbindungszeilen bleiben in einem Container (#einst-vb) und werden je Reiter ein-/ausgeblendet.
// =====================================================================
const EINST_ZEILEN = { profil: "allgemein", elevenlabs: "stimme", anthropic: "konten", serper: "konten", youtube: "konten",
  telegram: "konten", lokal: "konten", icloud: "daten", archiv: "daten", tesla: "fahrzeuge", ford: "fahrzeuge", nuki: "zuhause" };
const EINST_VB_TITEL = { allgemein: "ÜBER DICH", stimme: "STIMME (ELEVENLABS)", konten: "KONTEN & SCHLÜSSEL", daten: "KALENDER, MAIL & ARCHIV",
  fahrzeuge: "FAHRZEUGE", immobilien: "IMMOBILIEN", zuhause: "SCHLÜSSEL" };
let einstAktiv = (() => { try { return localStorage.getItem("jarvis-einst-reiter") || "allgemein"; } catch (e) { return "allgemein"; } })();
function einstFiltern() {
  const box = $("einst"); if (!box) return;
  const such = ($("einst-suche")?.value || "").trim().toLowerCase();
  box.querySelectorAll("#einst-reiter [data-reiter]").forEach((b) => {
    const an = !such && b.dataset.reiter === einstAktiv; b.classList.toggle("an", an); b.setAttribute("aria-selected", an ? "true" : "false"); });
  box.querySelectorAll("#einst-vb > details[data-id]").forEach((z) => {
    const r = EINST_ZEILEN[z.dataset.id] || "konten";
    z.hidden = such ? !z.textContent.toLowerCase().includes(such) : r !== einstAktiv;
  });
  box.querySelectorAll(".einst-inhalt > section[data-reiter]").forEach((s) => {
    if (s.querySelector("#einst-vb")) {
      s.hidden = ![...s.querySelectorAll("#einst-vb > details")].some((z) => !z.hidden);
      const t = $("einst-vb-titel"); if (t) t.textContent = such ? "VERBINDUNGEN" : (EINST_VB_TITEL[einstAktiv] || "VERBINDUNGEN");
      return;
    }
    if (such) {
      const zeilen = s.querySelectorAll(".einst-zeile");
      if (zeilen.length) { let eins = false; zeilen.forEach((z) => { const t = z.textContent.toLowerCase().includes(such) || s.querySelector("h4").textContent.toLowerCase().includes(such); z.hidden = !t; eins ||= t; }); s.hidden = !eins; }
      else s.hidden = !s.textContent.toLowerCase().includes(such);
    } else { s.hidden = !s.dataset.reiter.split(" ").includes(einstAktiv); s.querySelectorAll(".einst-zeile").forEach((z) => z.hidden = false); }
  });
}
window.einstReiter = function (name, oeffnen = true) {
  einstAktiv = name; try { localStorage.setItem("jarvis-einst-reiter", name); } catch (e) {}
  const s = $("einst-suche"); if (s) s.value = "";
  if (oeffnen && $("einst").hidden) window.einstellungenOeffnen();
  einstFiltern(); $("einst").querySelector(".einst-box").scrollTop = 0;
  $("einst-reiter")?.querySelector(".an")?.scrollIntoView({ block: "nearest", inline: "center" });
};
$("einst-reiter")?.addEventListener("click", (e) => { const b = e.target.closest("[data-reiter]"); if (b) { window.einstReiter(b.dataset.reiter, false); sfx?.("tick"); } });
$("einst-suche")?.addEventListener("input", einstFiltern);
$("einst-suche")?.addEventListener("keydown", (e) => { if (e.key === "Escape" && e.target.value) { e.stopPropagation(); e.target.value = ""; einstFiltern(); } });
new MutationObserver(() => einstFiltern()).observe($("einst-vb"), { childList: true });
const _einstOeffnenReiter = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenReiter(); einstFiltern(); };
einstFiltern();
// Ford/Tesla: „Anbindung einrichten“ springt direkt in den Reiter Fahrzeuge
fordEinrichtungOeffnen = function () {
  window.einstReiter("fahrzeuge");
  setTimeout(() => { const z = document.querySelector('#einst-vb details[data-id="ford"]'); if (z) { z.open = true; z.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 900);
};

// =====================================================================
//  HESTIA – IMMOBILIENFENSTER: Karte, Haupt­bild + Galerie (5), Kennzahlen mit Ampel, Mieter, Darlehen,
//  Mieterhöhungen; Assistent „＋ IMMOBILIE“ (4 Schritte) mit lokalem Einlesen des Mietvertrags.
// =====================================================================
const IM = { el: null, d: null, aktiv: null, map: null, form: null };
const imEuro = (v, nk = 0) => v == null ? "–" : v.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: nk, minimumFractionDigits: nk });
const imZahl = (v, nk = 1, e = "") => v == null ? "–" : v.toLocaleString("de-DE", { maximumFractionDigits: nk, minimumFractionDigits: nk }) + e;
const imDatum = (iso) => iso ? iso.slice(0, 10).split("-").reverse().join(".") : "–";
const imH = () => (TOKEN ? { "x-atlas-token": TOKEN } : {});
function imObjekt() { return (IM.d?.objekte || []).find((o) => o.id === IM.aktiv) || (IM.d?.objekte || [])[0]; }
function imBildUrl(o, datei) { return `/immobilien/${o.id}/bild/${encodeURIComponent(datei)}`; }
async function imBildLaden(img) {             // Bilder mit Token holen (img-src kann keinen Header senden)
  try { const r = await fetch(img.dataset.src, { headers: imH() }); if (!r.ok) throw 0; img.src = URL.createObjectURL(await r.blob()); }
  catch (e) { img.closest(".im-bild, .im-thumb")?.classList.add("fehlt"); }
}
function imKachel(titel, inhalt, extra = "") { return `<section class="ts-kachel im-kachel"><h5>${titel}${extra}</h5>${inhalt}</section>`; }
function imKennzahlen(o) {
  const k = o.kennzahlen || {}, a = k.ampel || {}, mi = o.miete || {};
  const z = (label, wert, amp = "", tip = "") => `<div class="im-kz ${amp}" title="${esc(tip)}"><i></i><b>${wert}</b><span>${label}</span></div>`;
  return `<div class="im-kz-grid">
    ${z("KALTMIETE", imEuro(mi.kalt), "", "pro Monat")}${z("WARMMIETE", imEuro(k.warm), "", "Kalt + Nebenkostenvorauszahlung")}
    ${z("BRUTTORENDITE", imZahl(k.brutto, 2, " %"), a.brutto, "Jahreskaltmiete / Kaufpreis")}${z("NETTORENDITE", imZahl(k.netto, 2, " %"), "", "(Jahreskaltmiete − nicht umlagefähige Kosten) / (Kaufpreis + Nebenkosten)")}
    ${z("CASHFLOW / MONAT", imEuro(k.cashflow), a.cashflow, "Kaltmiete − Darlehensraten − nicht umlagefähige Kosten")}${z("BELEIHUNG", imZahl(k.beleihung, 1, " %"), a.beleihung, "Restschuld / Marktwert (sonst Kaufpreis)")}
    ${z("KAPITALDIENSTDECKUNG", imZahl(k.dscr, 2), a.dscr, "Jahreskaltmiete / Jahreskapitaldienst – Banken meist ≥ 1,2")}${z("KALT JE M²", k.kalt_qm == null ? "–" : imEuro(k.kalt_qm, 2), "", "für den Mietspiegel-Vergleich")}
    ${z("EK-RENDITE", imZahl(k.ek_rendite, 1, " %"), "", "Überschuss vor Steuern / Eigenkapital")}${z("TILGUNG", imZahl(k.tilgung, 1, " %"), "", "bereits getilgt vom Darlehensbetrag")}</div>`;
}
function imHTML(o) {
  if (!o) return `<div class="im-leer">${stabLogo("IMMO", "im-leer-logo")}<h4>NOCH KEINE IMMOBILIE</h4>
      <p>HESTIA verwaltet Objekte, Mieter, Darlehen und Kennzahlen. Der Mietvertrag kann dabei lokal auf dem Mac ausgelesen werden.</p>
      <button type="button" class="primary" data-im="neu">＋ IMMOBILIE ANLEGEN</button></div>`;
  const k = o.kennzahlen || {}, m = o.mieter || {}, mi = o.miete || {}, b = o.bilder || {};
  const gal = b.galerie || [];
  const slots = Array.from({ length: 5 }, (_, i) => gal[i]
    ? `<div class="im-thumb ${gal[i] === b.haupt ? "haupt" : ""}"><img alt="" data-src="${imBildUrl(o, gal[i])}">
        <span><button type="button" data-im="bild-haupt" data-datei="${esc(gal[i])}" title="Als Hauptbild">★</button><button type="button" data-im="bild-weg" data-datei="${esc(gal[i])}" title="Entfernen">✕</button></span></div>`
    : `<button type="button" class="im-thumb leer" data-im="bild-neu" title="Bild hinzufügen">＋</button>`).join("");
  const dl = (o.darlehen || []).map((x, i) => {
    const kd = (k.darlehen || [])[i] || {}, p = x.betrag ? Math.max(0, Math.min(1, 1 - kd.rest_heute / x.betrag)) : 0;
    return `<div class="im-dl"><div class="im-dl-kopf"><b>${esc(x.bank || "Darlehen " + (i + 1))}</b><em>${imZahl(x.zins, 2, " %")} · Rate ${imEuro(x.rate)}</em></div>
      <div class="im-dl-balken"><i style="--p:${p}"></i></div>
      <div class="im-dl-fuss"><span>Restschuld <b>${imEuro(kd.rest_heute)}</b> von ${imEuro(x.betrag)}</span>
        <span>Zinsbindung bis <b>${imDatum(x.zinsbindung_bis)}</b>${kd.rest_ende != null ? ` · dann ${imEuro(kd.rest_ende)}` : ""}</span></div></div>`;
  }).join("") || `<p class="ts-hinweis">Kein Darlehen hinterlegt.</p>`;
  const erh = (k.erhoehungen || []).map((e) => `<div class="im-erh ${e.hinweis ? "warn" : ""}"><b>${imDatum(e.datum)}</b><span>${imEuro(e.kalt_neu)} kalt${e.prozent != null ? ` (${e.prozent > 0 ? "+" : ""}${imZahl(e.prozent, 1, " %")})` : ""}</span>${e.hinweis ? `<em>${esc(e.hinweis)}</em>` : ""}</div>`).join("");
  const zeile = (l, v) => v ? `<div class="im-zeile"><span>${l}</span><b>${v}</b></div>` : "";
  return `<div class="ts-grid im-grid">
    <div class="im-links">
      <div class="im-bild">${b.haupt ? `<img alt="" data-src="${imBildUrl(o, b.haupt)}">` : `<button type="button" data-im="bild-neu-haupt" class="im-platzhalter">＋ BILD DER IMMOBILIE EINFÜGEN<small>JPG, PNG oder HEIC vom iPhone</small></button>`}
        <div class="im-bild-schild"><b>${esc(o.name || o.adresse)}</b><span>${esc(o.adresse || "")}</span></div>
        <div class="im-links-knoepfe">${(o.links || {}).mietvertrag ? `<button type="button" data-im="mv-auf" data-pfad="${esc(o.links.mietvertrag)}" title="${esc(o.links.mietvertrag)}">▤ MIETVERTRAG</button>` : `<button type="button" data-im="bearbeiten" class="aus" title="Kein Mietvertrag gefunden – unter Bearbeiten eintragen">▤ MIETVERTRAG ?</button>`}
          ${(o.links || {}).ordner ? `<button type="button" data-im="ordner-auf" data-pfad="${esc(o.links.ordner)}" title="${esc(o.links.ordner)}">▱ ORDNER</button>` : `<button type="button" data-im="bearbeiten" class="aus" title="Ordner unter Bearbeiten eintragen">▱ ORDNER ?</button>`}</div></div>
      <div class="im-galerie">${slots}</div>
      <div class="im-duo">
        <div class="im-karte"><div class="im-karte-map"></div><span class="im-tile-titel">⌖ LAGE</span>
          ${o.lat == null ? `<p class="ts-hinweis im-ort-fehlt">Adresse wird auf der Karte gesucht …</p>` : ""}</div>
        <div class="im-3d"><div class="im-3d-box"></div><span class="im-tile-titel">⬚ GRUNDRISS 3D</span>
          <button type="button" class="im-3d-gross" data-im="grundriss" title="Grundriss öffnen und bearbeiten">⤢</button></div></div>
      <div class="ts-reihe im-werkzeuge"><button type="button" data-im="grundriss">⬚ GRUNDRISS → 3D</button></div>
    </div>
    <div class="ts-rechts">
      <section class="ts-kachel im-kachel im-nk-kachel" data-im="nk"><h5>NEBENKOSTEN <em>ÖFFNEN ›</em></h5><div class="im-nk-kurz">…</div></section>
      ${imKachel("KENNZAHLEN", imKennzahlen(o))}
      ${imKachel("MIETER &amp; MIETE", `${zeile("Mieter", esc(m.name || "–"))}${zeile("seit", m.seit ? imDatum(m.seit) + (k.mietdauer ? " · " + esc(k.mietdauer) : "") : "")}
        ${zeile("Miete kalt / NK / warm", `${imEuro(mi.kalt)} / ${imEuro(mi.nk)} / ${imEuro(k.warm)}`)}${zeile("Kaution", m.kaution ? imEuro(m.kaution) : "")}
        ${zeile("Mietart", { vergleichsmiete: "Vergleichsmiete (§ 558)", staffelmiete: "Staffelmiete", indexmiete: "Indexmiete" }[m.mietart] || "")}`)}
      ${imKachel("MIETERHÖHUNGEN", `${k.erhoehung_ab ? `<p class="ts-hinweis">Nächste Erhöhung auf Vergleichsmiete frühestens wirksam ab <b>${imDatum(k.erhoehung_ab)}</b> (15 Monate, Kappungsgrenze ${imZahl(IM.d?.grenzen?.kappung, 0, " %")} in 3 Jahren).</p>` : ""}
        ${erh || `<p class="ts-hinweis">Keine geplant.</p>`}
        <div class="im-erh-form" hidden><input type="date" data-ef="datum"><input type="number" step="10" data-ef="kalt_neu" placeholder="neue Kaltmiete €"><button type="button" data-im="erh-speichern">EINTRAGEN</button></div>`,
        ` <button type="button" class="ts-mini" data-im="erh-neu">＋ PLANEN</button>`)}
      ${imKachel("DARLEHEN", dl)}
      ${imKachel("OBJEKT", `${zeile("Art", esc(o.art || ""))}${zeile("Baujahr", o.baujahr ? String(o.baujahr) : "")}${zeile("Wohnfläche", o.wohnflaeche ? imZahl(o.wohnflaeche, 1, " m²") : "")}
        ${zeile("Grundstück", o.grundstueck ? imZahl(o.grundstueck, 0, " m²") : "")}${zeile("Kauf", o.kaufpreis ? `${imEuro(o.kaufpreis)}${o.kaufdatum ? " · " + imDatum(o.kaufdatum) : ""}` : "")}
        ${zeile("Marktwert", o.marktwert ? imEuro(o.marktwert) : "")}${zeile("Heizung", esc(o.heizung || ""))}${zeile("Eigentümer", esc(o.eigentuemer || ""))}`)}
    </div></div><div class="ts-status"></div>`;
}
function imZeigen(d, aktiv) {
  IM.d = d; if (aktiv) IM.aktiv = aktiv;
  if (!imObjekt() && d.objekte?.length) IM.aktiv = d.objekte[0].id;
  if (!IM.el) {
    IM.el = document.createElement("div"); IM.el.className = "tesla immo";
    IM.el.innerHTML = `<div class="ts-rahmen" role="dialog" aria-label="Immobilien"><header class="vt-kopf"><span class="vt-marke im-marke">${stabLogo("IMMO", "klein")} IMMOBILIEN</span>
      <nav class="fz-tabs im-tabs"></nav><span class="vt-kapitel ts-titel"></span>
      <button type="button" class="ts-neu" data-im="nk">NEBENKOSTEN</button><button type="button" class="ts-neu" data-im="bearbeiten">BEARBEITEN</button><button type="button" class="ts-neu" data-im="neu">＋ IMMOBILIE</button>
      <input type="file" accept="image/*,.heic,.heif" multiple hidden class="im-datei"><button type="button" class="vt-zu" data-im="zu" title="Schließen (Esc)">✕</button></header>
      <div class="ts-inhalt"></div></div>`;
    document.body.appendChild(IM.el);
    requestAnimationFrame(() => IM.el.classList.add("an"));
  }
  const o = imObjekt();
  IM.el.querySelector(".im-tabs").innerHTML = (d.objekte || []).map((x) => `<button type="button" data-im="tab" data-id="${esc(x.id)}" class="${x.id === o?.id ? "an" : ""}">${esc((x.name || x.adresse || "Objekt").toUpperCase())}</button>`).join("");
  IM.el.querySelector(".ts-titel").textContent = o ? [o.art, o.wohnflaeche ? imZahl(o.wohnflaeche, 0, " m²") : "", o.baujahr].filter(Boolean).join(" · ").toUpperCase() : "";
  IM.el.querySelector('[data-im="bearbeiten"]').hidden = !o;
  IM.el.querySelector(".ts-inhalt").innerHTML = imHTML(o);
  IM.el.querySelectorAll("img[data-src]").forEach(imBildLaden);
  if (o) { imKarte(o); im3dKachel(o); }
  if (o) nkKurz(o.id);
}
function imZu() { if (!IM.el) return; const el = IM.el; IM.el = null; try { IM.m3d?.entfernen(); } catch (e) {} IM.m3d = null; if (typeof NK !== "undefined") { NK.el = null; IM.form = null; } if (typeof GR !== "undefined" && GR.el) { try { GR.m3d?.entfernen(); } catch (e) {} GR.m3d = null; GR.el = null; } try { IM.map?.remove(); } catch (e) {} IM.map = null; el.classList.remove("an"); setTimeout(() => el.remove(), 500); }
async function imLaden(aktiv) {
  try { const r = await fetch("/immobilien", { headers: imH() }); const j = await r.json(); if (!r.ok) throw new Error(j.detail || r.status); imZeigen(j, aktiv); }
  catch (e) { toast("Immobilien: " + e.message); }
}
async function imKarte(o) {
  const box = IM.el?.querySelector(".im-karte-map"); if (!box) return;
  if (o.lat == null) {                                  // Adresse (noch) nicht verortet: einmal nachholen
    if (IM.verortet === o.id) { const h = IM.el.querySelector(".im-ort-fehlt"); if (h) h.textContent = "Adresse nicht auf der Karte gefunden – unter „Bearbeiten“ prüfen."; return; }
    IM.verortet = o.id;
    try { const r = await vbPost(`/immobilien/${o.id}/verorten`, {}); if (r.lat != null) { IM.d.objekte = IM.d.objekte.map((x) => x.id === o.id ? { ...x, lat: r.lat, lon: r.lon } : x); return imZeigen(IM.d); } } catch (e) {}
    const h = IM.el?.querySelector(".im-ort-fehlt"); if (h) h.textContent = "Adresse nicht auf der Karte gefunden – unter „Bearbeiten“ prüfen."; return;
  }
  try { await karteLib(); } catch (e) { return; }
  try { IM.map?.remove(); } catch (e) {}
  const ml = window.maplibregl;
  const m = IM.map = new ml.Map({ container: box, style: "https://tiles.openfreemap.org/styles/dark", center: [o.lon, o.lat], zoom: 13, pitch: 0,
    attributionControl: { compact: true }, fadeDuration: 0, interactive: true });
  m.on("style.load", () => {
    try { karteEinfaerben(m); } catch (e) {}
    try {
      const quelle = Object.keys(m.getStyle().sources).find((s) => m.getStyle().sources[s].type === "vector");
      if (quelle && !m.getLayer("im-3d")) m.addLayer({ id: "im-3d", type: "fill-extrusion", source: quelle, "source-layer": "building", minzoom: 14,
        paint: { "fill-extrusion-color": "#0b4a6e", "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": .7 } });
    } catch (e) {}
  });
  const pin = document.createElement("div"); pin.className = "im-pin"; pin.innerHTML = `<i></i>${stabLogo("IMMO")}`;
  new ml.Marker({ element: pin, anchor: "bottom" }).setLngLat([o.lon, o.lat]).addTo(m);
  m.once("load", () => m.flyTo({ center: [o.lon, o.lat], zoom: 17, pitch: 58, bearing: -25, duration: 3200, essential: true }));
}
function imStatus(t, art = "") { const st = IM.el?.querySelector(".ts-status"); if (st) { st.textContent = t; st.className = "ts-status " + art; } }
async function imBilderHoch(files, haupt) {
  const o = imObjekt(); if (!o) return;
  let n = 0;
  for (const f of files) {
    imStatus(`Bild ${++n} von ${files.length} wird übernommen …`);
    const r = await fetch(`/immobilien/${o.id}/bild?haupt=${haupt && n === 1 ? 1 : 0}`, { method: "POST", body: f,
      headers: { "x-dateiname": encodeURIComponent(f.name), ...imH() } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { imStatus("⚠ " + (j.detail || r.status), "fehler"); return; }
  }
  await imLaden(o.id); imStatus("✓ Bilder übernommen", "ok");
}
document.addEventListener("click", async (e) => {
  if (!IM.el || !e.target.closest(".immo")) return;
  const b = e.target.closest("[data-im]"); if (!b) return;
  const a = b.dataset.im, o = imObjekt();
  if (a === "zu") return imZu();
  if (a === "tab") { IM.aktiv = b.dataset.id; return imZeigen(IM.d); }
  if (a === "neu") return imFormular(null);
  if (a === "bearbeiten") return o && imFormular(o);
  if (a === "mv-auf") {
    if (MOBIL) { try { const d = await api(`/vorschau?pfad=${encodeURIComponent(b.dataset.pfad)}&seite=1`); DOK.aktuell = d; handle({ type: "bild", titel: d.titel, bilder: [d] }); }
      catch (err) { toast("Mietvertrag konnte nicht geladen werden"); } return; }
    try { await api("/archiv/oeffnen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: b.dataset.pfad }) }); toast("Mietvertrag in Vorschau geöffnet"); }
    catch (err) { toast("Mietvertrag: " + err.message); } return;
  }
  if (a === "ordner-auf") {
    if (MOBIL) { toast(`Dateien-App → iCloud Drive → DATENARCHIV → ${b.dataset.pfad}`); return; }
    try { await api("/archiv/ordner_auf", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pfad: b.dataset.pfad }) }); toast("Ordner im Finder geöffnet"); }
    catch (err) { toast("Ordner: " + err.message); } return;
  }
  if (a === "nk") return o && nkOeffnen(o.id);
  if (a === "grundriss") return o && grOeffnen(o.id);
  if (a === "bild-neu" || a === "bild-neu-haupt") { const inp = IM.el.querySelector(".im-datei"); inp.dataset.haupt = a === "bild-neu-haupt" ? "1" : ""; inp.click(); return; }
  if (a === "bild-haupt" || a === "bild-weg") {
    try { await vbPost(`/immobilien/${o.id}/bild/${encodeURIComponent(b.dataset.datei)}/${a === "bild-haupt" ? "haupt" : "entfernen"}`, {}); await imLaden(o.id); }
    catch (err) { imStatus("⚠ " + err.message, "fehler"); } return;
  }
  if (a === "erh-neu") { const f = IM.el.querySelector(".im-erh-form"); f.hidden = !f.hidden; return; }
  if (a === "erh-speichern") {
    const f = IM.el.querySelector(".im-erh-form"), datum = f.querySelector('[data-ef="datum"]').value, kalt = f.querySelector('[data-ef="kalt_neu"]').value;
    if (!datum || !kalt) return imStatus("Datum und neue Kaltmiete angeben", "fehler");
    try { const r = await vbPost(`/immobilien/${o.id}`, { ...o, erhoehungen: [...(o.erhoehungen || []), { datum, kalt_neu: +kalt }] });
      await imLaden(o.id); imStatus("✓ Mieterhöhung geplant – Frist zum Ankündigen steht unter „Fristen“", "ok"); }
    catch (err) { imStatus("⚠ " + err.message, "fehler"); }
  }
});
document.addEventListener("change", (e) => {
  if (!e.target.matches(".immo .im-datei") || !e.target.files.length) return;
  imBilderHoch([...e.target.files].slice(0, 5), e.target.dataset.haupt === "1"); e.target.value = "";
});
document.addEventListener("keydown", (e) => { if (IM.el && e.key === "Escape" && !inFeld()) { if (IM.form) imFormZu(); else imZu(); } });

// ---------- Assistent „＋ IMMOBILIE“ / Bearbeiten (4 Schritte) ----------
const IM_SCHRITTE = ["OBJEKT", "KAUF", "DARLEHEN", "MIETER & MIETE"];
function imWert(o, pfad) { return pfad.split(".").reduce((x, k) => (x == null ? x : x[k]), o) ?? ""; }
function imFeld(o, pfad, label, typ = "text", extra = "") {
  return `<label class="im-f"><span>${label}</span><input type="${typ}" data-if="${pfad}" value="${esc(String(imWert(o, pfad)))}" ${typ === "number" ? 'step="any"' : ""} ${extra}></label>`;
}
function imDlZeile(x = {}, i = 0) {
  return `<div class="im-dl-form" data-dl="${i}">
    <label class="im-f"><span>Bank</span><input data-df="bank" value="${esc(x.bank || "")}"></label>
    <label class="im-f"><span>Darlehensbetrag €</span><input type="number" step="any" data-df="betrag" value="${x.betrag ?? ""}"></label>
    <label class="im-f"><span>Sollzins %</span><input type="number" step="any" data-df="zins" value="${x.zins ?? ""}"></label>
    <label class="im-f"><span>Monatsrate €</span><input type="number" step="any" data-df="rate" value="${x.rate ?? ""}"></label>
    <label class="im-f"><span>Zinsbindung bis</span><input type="date" data-df="zinsbindung_bis" value="${esc(x.zinsbindung_bis || "")}"></label>
    <label class="im-f"><span>Restschuld € (laut Auszug)</span><input type="number" step="any" data-df="restschuld" value="${x.restschuld ?? ""}"></label>
    <label class="im-f"><span>Stand der Restschuld</span><input type="date" data-df="restschuld_stand" value="${esc(x.restschuld_stand || "")}"></label>
    <button type="button" class="im-dl-weg" data-imf="dl-weg" title="Darlehen entfernen">✕</button></div>`;
}
function imFormular(o) {
  const neu = !o; o = o || { mieter: { mietart: "vergleichsmiete" }, miete: {}, darlehen: [] };
  IM.formObj = o;
  const f = document.createElement("div"); f.className = "im-form";
  f.innerHTML = `<div class="im-form-box"><header><b>${neu ? "＋ NEUE IMMOBILIE" : "IMMOBILIE BEARBEITEN"}</b>
      <nav>${IM_SCHRITTE.map((s, i) => `<button type="button" data-imf="schritt" data-n="${i}" class="${i ? "" : "an"}"><i>${i + 1}</i>${s}</button>`).join("")}</nav>
      <button type="button" class="vt-zu" data-imf="zu">✕</button></header>
    <div class="im-mv"><button type="button" data-imf="mv">⇪ MIETVERTRAG LOKAL EINLESEN</button>
      <span>Text und Felder werden nur auf diesem Mac erkannt (lokales Modell) – nichts geht an Claude. Die Datei wird nicht gespeichert.</span>
      <input type="file" accept=".pdf,image/*" hidden class="im-mv-datei"></div>
    <form class="im-schritte" onsubmit="return false">
      <fieldset data-n="0">${imFeld(o, "name", "Kurzname (z. B. Straße)")}${imFeld(o, "adresse", "Adresse (Straße Nr, PLZ Ort)", "text", "required")}
        ${imFeld(o, "art", "Objektart (Einfamilienhaus, Wohnung …)")}${imFeld(o, "baujahr", "Baujahr", "number")}${imFeld(o, "wohnflaeche", "Wohnfläche m²", "number")}
        ${imFeld(o, "grundstueck", "Grundstück m²", "number")}${imFeld(o, "heizung", "Heizung")}${imFeld(o, "energieklasse", "Energieklasse")}
        ${imFeld(o, "eigentuemer", "Eigentümer (z. B. GbR)")}${imFeld(o, "ordner", "Ordner im DATENARCHIV (vorhandener Ordner)")}${imFeld(o, "mietvertrag", "Mietvertrag – Pfad im DATENARCHIV (leer = im Ordner suchen)")}</fieldset>
      <fieldset data-n="1" hidden>${imFeld(o, "kaufdatum", "Kaufdatum / Fertigstellung", "date")}${imFeld(o, "kaufpreis", "Kaufpreis bzw. Gesamtkosten €", "number")}
        ${imFeld(o, "kaufnebenkosten", "Kaufnebenkosten €", "number")}${imFeld(o, "marktwert", "Geschätzter Marktwert € (optional)", "number")}
        ${imFeld(o, "nicht_umlagefaehig_jahr", "Nicht umlagefähige Kosten € pro Jahr (Verwaltung, Rücklage …)", "number")}</fieldset>
      <fieldset data-n="2" hidden><div class="im-dl-liste">${(o.darlehen || []).map(imDlZeile).join("")}</div>
        <button type="button" data-imf="dl-neu">＋ DARLEHEN</button></fieldset>
      <fieldset data-n="3" hidden>${imFeld(o, "mieter.name", "Mieter")}${imFeld(o, "mieter.seit", "Mietbeginn", "date")}${imFeld(o, "mieter.kaution", "Kaution €", "number")}
        <label class="im-f"><span>Mietart</span><select data-if="mieter.mietart">${["vergleichsmiete", "staffelmiete", "indexmiete"].map((v) => `<option value="${v}" ${imWert(o, "mieter.mietart") === v ? "selected" : ""}>${{ vergleichsmiete: "Vergleichsmiete", staffelmiete: "Staffelmiete", indexmiete: "Indexmiete" }[v]}</option>`).join("")}</select></label>
        ${imFeld(o, "miete.kalt", "Kaltmiete € / Monat", "number")}${imFeld(o, "miete.nk", "Nebenkostenvorauszahlung € / Monat", "number")}
        ${imFeld(o, "miete.letzte_erhoehung", "Letzte Mieterhöhung wirksam ab", "date")}${imFeld(o, "mieter.kontakt", "Kontakt (Telefon/Mail, optional)")}
        <div class="im-bk" ${(o.betriebskosten || []).length ? "" : "hidden"}><span>Vereinbarte Betriebskosten</span><p>${esc((o.betriebskosten || []).join(" · "))}</p></div></fieldset>
    </form>
    <footer><button type="button" data-imf="zurueck">‹ ZURÜCK</button><span class="im-form-status"></span>
      ${neu ? "" : `<button type="button" data-imf="loeschen" class="gefahr">ENTFERNEN</button>`}
      <button type="button" data-imf="weiter">WEITER ›</button><button type="button" class="primary" data-imf="speichern">SPEICHERN</button></footer></div>`;
  (IM.el || document.body).appendChild(f); IM.form = f;
  requestAnimationFrame(() => f.classList.add("an"));
  imSchritt(0);
}
function imSchritt(n) {
  const f = IM.form; if (!f) return; f.dataset.n = n;
  f.querySelectorAll("fieldset").forEach((x) => x.hidden = +x.dataset.n !== n);
  f.querySelectorAll('[data-imf="schritt"]').forEach((x) => x.classList.toggle("an", +x.dataset.n === n));
  f.querySelector('[data-imf="zurueck"]').disabled = n === 0; f.querySelector('[data-imf="weiter"]').hidden = n === 3;
}
function imFormZu() { const f = IM.form; IM.form = null; if (f) { f.classList.remove("an"); setTimeout(() => f.remove(), 300); } }
function imFormDaten() {
  const f = IM.form, o = JSON.parse(JSON.stringify(IM.formObj || {}));
  f.querySelectorAll("[data-if]").forEach((i) => {
    const p = i.dataset.if.split("."); let z = o;
    p.slice(0, -1).forEach((k) => { z[k] = z[k] || {}; z = z[k]; });
    z[p.at(-1)] = i.type === "number" ? (i.value === "" ? null : +i.value) : i.value.trim();
  });
  o.darlehen = [...f.querySelectorAll(".im-dl-form")].map((r) => Object.fromEntries([...r.querySelectorAll("[data-df]")].map((i) => [i.dataset.df, i.type === "number" ? (i.value === "" ? null : +i.value) : i.value.trim()])));
  return o;
}
function imFormStatus(t, art = "") { const s = IM.form?.querySelector(".im-form-status"); if (s) { s.textContent = t; s.className = "im-form-status " + art; } }
function imVorschlag(v) {
  const setz = (pfad, wert) => { if (wert == null || wert === "" || (Array.isArray(wert) && !wert.length)) return 0;
    const i = IM.form.querySelector(`[data-if="${pfad}"]`); if (!i) return 0; i.value = wert; i.closest(".im-f")?.classList.add("vorschlag"); return 1; };
  let n = 0;
  n += setz("adresse", v.adresse); n += setz("art", v.art); n += setz("wohnflaeche", v.wohnflaeche); n += setz("eigentuemer", v.eigentuemer);
  n += setz("mieter.name", v.mieter?.name); n += setz("mieter.seit", v.mieter?.seit); n += setz("mieter.kaution", v.mieter?.kaution);
  n += setz("mieter.mietart", v.mieter?.mietart); n += setz("miete.kalt", v.miete?.kalt); n += setz("miete.nk", v.miete?.nk);
  if (!IM.form.querySelector('[data-if="name"]').value && v.adresse) { IM.form.querySelector('[data-if="name"]').value = v.adresse.split(",")[0]; }
  if ((v.betriebskosten || []).length) { IM.formObj.betriebskosten = v.betriebskosten; const bk = IM.form.querySelector(".im-bk"); bk.hidden = false; bk.querySelector("p").textContent = v.betriebskosten.join(" · "); }
  return n;
}
document.addEventListener("click", async (e) => {
  if (!IM.form || !e.target.closest(".im-form")) return;
  const b = e.target.closest("[data-imf]"); if (!b) { if (e.target === IM.form) imFormZu(); return; }
  const a = b.dataset.imf, n = +(IM.form.dataset.n || 0);
  if (a === "zu") return imFormZu();
  if (a === "schritt") return imSchritt(+b.dataset.n);
  if (a === "weiter") return imSchritt(Math.min(3, n + 1));
  if (a === "zurueck") return imSchritt(Math.max(0, n - 1));
  if (a === "dl-neu") { const l = IM.form.querySelector(".im-dl-liste"); l.insertAdjacentHTML("beforeend", imDlZeile({}, l.children.length)); return; }
  if (a === "dl-weg") { b.closest(".im-dl-form").remove(); return; }
  if (a === "mv") { IM.form.querySelector(".im-mv-datei").click(); return; }
  if (a === "loeschen") {
    if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "WIRKLICH ENTFERNEN?"; return; }
    try { await fetch(`/immobilien/${IM.formObj.id}`, { method: "DELETE", headers: imH() }); imFormZu(); IM.aktiv = null; imLaden(); } catch (err) { imFormStatus("⚠ " + err.message, "fehler"); }
    return;
  }
  if (a === "speichern") {
    const o = imFormDaten();
    if (!o.adresse) { imSchritt(0); return imFormStatus("Bitte die Adresse angeben", "fehler"); }
    b.disabled = true; imFormStatus("Speichere …");
    try { const r = await vbPost(o.id ? `/immobilien/${o.id}` : "/immobilien", o);
      imFormZu(); await imLaden(r.id); imStatus(r.text || "✓ Gespeichert", "ok"); sfx?.("ok");
      if (!$("einst").hidden) imEinstAufbauen(); }
    catch (err) { imFormStatus("⚠ " + err.message, "fehler"); b.disabled = false; }
  }
});
document.addEventListener("change", async (e) => {
  if (!e.target.matches(".im-mv-datei") || !e.target.files.length) return;
  const f = e.target.files[0]; e.target.value = "";
  const knopf = IM.form.querySelector('[data-imf="mv"]'); knopf.disabled = true;
  imFormStatus("Lese den Mietvertrag lokal – Texterkennung und lokales Modell, das kann 1–2 Minuten dauern …");
  try {
    const r = await fetch("/immobilien/mietvertrag", { method: "POST", body: f, headers: { "x-dateiname": encodeURIComponent(f.name), ...imH() } });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.detail || r.status);
    const n = imVorschlag(j.vorschlag || {});
    imSchritt(3); imFormStatus(n ? `✓ ${n} Felder lokal erkannt (markiert) – bitte jeden Wert prüfen` : "Keine Felder sicher erkannt – bitte von Hand eintragen", n ? "ok" : "fehler");
  } catch (err) { imFormStatus("⚠ " + err.message, "fehler"); }
  knopf.disabled = false;
});
const _handleImmo = handle;
handle = function (ev) { if (ev.type === "immobilien") { imZeigen(ev.daten || {}, ev.aktiv); return; } _handleImmo(ev); };
window.immobilienAnzeigen = (id) => imLaden(id);

// ---------- Einstellungen → Reiter Immobilien ----------
async function imEinstAufbauen() {
  const s = document.querySelector('#einst section[data-reiter="immobilien"]'); if (!s) return;
  let d; try { const r = await fetch("/immobilien", { headers: imH() }); d = await r.json(); if (!r.ok) throw 0; } catch (e) { return; }
  const g = d.grenzen || {};
  const liste = (d.objekte || []).map((o) => `<div class="einst-zeile"><span>${esc(o.name || o.adresse)}<small class="im-einst-sub">${esc(o.adresse || "")}${o.miete?.kalt ? " · " + imEuro(o.miete.kalt) + " kalt" : ""}</small></span>
      <span class="vb-reihe"><button type="button" data-ime="zeigen" data-id="${esc(o.id)}">ANZEIGEN</button><button type="button" data-ime="bearbeiten" data-id="${esc(o.id)}">BEARBEITEN</button></span></div>`).join("");
  const gf = (k, l) => `<label class="im-f"><span>${l}</span><input type="number" step="any" data-ig="${k}" value="${g[k] ?? ""}"></label>`;
  s.innerHTML = `<h4>IMMOBILIEN · HESTIA</h4>
    ${liste || `<p class="vb-hilfe einst-leer">Noch keine Immobilien angelegt.</p>`}
    <div class="einst-zeile"><span>Neue Immobilie (Assistent, Mietvertrag lokal einlesbar)</span><button type="button" class="primary" data-ime="neu">＋ IMMOBILIE</button></div>
    <details class="vb-zeile"><summary><span>Ampel-Grenzen der Kennzahlen</span><em>${imZahl(g.brutto_gruen, 1, " %")} Rendite · Kappung ${imZahl(g.kappung, 0, " %")}</em></summary>
      <div class="vb-inhalt im-grenzen">${gf("brutto_gruen", "Bruttorendite grün ab %")}${gf("brutto_gelb", "Bruttorendite gelb ab %")}${gf("cashflow_gruen", "Cashflow grün ab € / Monat")}
        ${gf("cashflow_gelb", "Cashflow gelb ab € / Monat")}${gf("beleihung_gruen", "Beleihung grün bis %")}${gf("beleihung_gelb", "Beleihung gelb bis %")}
        ${gf("dscr_gruen", "Kapitaldienstdeckung grün ab")}${gf("dscr_gelb", "Kapitaldienstdeckung gelb ab")}${gf("kappung", "Kappungsgrenze % (15 in Orten mit Verordnung, sonst 20)")}
        <div class="vb-reihe"><button type="button" class="primary" data-ime="grenzen">SPEICHERN</button></div><div class="vb-status"></div></div></details>`;
  if (typeof einstFiltern === "function") einstFiltern();
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ime]"); if (!b) return;
  const a = b.dataset.ime;
  if (a === "zeigen") { einstZu(); return imLaden(b.dataset.id); }
  if (a === "bearbeiten" || a === "neu") { einstZu(); await imLaden(b.dataset.id); const o = a === "neu" ? null : imObjekt(); return imFormular(o); }
  if (a === "grenzen") {
    const box = b.closest(".im-grenzen"), daten = Object.fromEntries([...box.querySelectorAll("[data-ig]")].map((i) => [i.dataset.ig, i.value]));
    const st = box.querySelector(".vb-status");
    try { const r = await vbPost("/immobilien/grenzen", daten); st.textContent = r.text; st.className = "vb-status ok"; } catch (err) { st.textContent = err.message; st.className = "vb-status fehler"; }
  }
});
const _einstOeffnenImmo = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenImmo(); imEinstAufbauen(); };

// =====================================================================
//  HESTIA – NEBENKOSTEN: Belegliste, Ablage-Vorschläge (Bestätigung), Anfragen (Billigung), Entwurf, Billigung,
//  Versand an den Mieter, Zugang. Alles Abgelegte/Gesendete nur per Klick.
// =====================================================================
const NK = { el: null, oid: null, jahr: null, u: null, pdfUrl: null };
const NK_STATUS = { fehlt: ["FEHLT", "rot"], angefragt: ["ANGEFRAGT", "gelb"], vorhanden: ["DA", "gruen"], entfaellt: ["ENTFÄLLT", ""] };
const NK_JSTATUS = { sammeln: "Belege sammeln", anfragen: "Belege angefragt", vollstaendig: "Belege vollständig", entwurf: "Entwurf zur Billigung",
  gebilligt: "Gebilligt – Versand an den Mieter", versendet: "Beim Mieter", abgeschlossen: "Abgeschlossen" };
const NK_ARTEN = { grundsteuer: "Grundsteuer", wasser: "Wasserversorgung", abwasser: "Entwässerung", heizung: "Heizung – Wartung Wärmepumpe",
  muell: "Müllbeseitigung", strassenreinigung: "Straßenreinigung / Winterdienst", garten: "Gartenpflege", schornstein: "Schornsteinfeger",
  versicherung: "Sach- und Haftpflichtversicherung", rauchmelder: "Rauchwarnmelder – Wartung", sonstige: "Sonstige Betriebskosten" };
const nkPost = (aktion, daten) => vbPost(`/hestia/${aktion}`, daten);
async function nkKurz(oid) {
  const box = IM.el?.querySelector(".im-nk-kurz"); if (!box) return;
  try {
    const u = await fdGet(`/hestia?objekt=${encodeURIComponent(oid)}`), j = u.jahre[0];
    const v = u.vorschlaege.length, a = j ? j.anfragen.filter((x) => x.status === "entwurf").length : 0;
    box.innerHTML = j ? `<div class="im-zeile"><span>Abrechnung ${j.jahr}</span><b>${esc(NK_JSTATUS[j.status] || j.status)}</b></div>
      <div class="im-zeile"><span>Belege</span><b>${j.posten.length - j.offen} von ${j.posten.length}</b></div>
      <div class="im-zeile"><span>An den Mieter bis</span><b>${imDatum(j.abrechnen_bis)} <small>(gesetzlich ${imDatum(j.gesetzlich_bis)})</small></b></div>
      ${v || a ? `<p class="nk-hinweis">${v ? `${v} Beleg(e) zur Ablage-Bestätigung` : ""}${v && a ? " · " : ""}${a ? `${a} Anfrage(n) zur Billigung` : ""}</p>` : ""}`
      : `<p class="ts-hinweis">Noch kein Abrechnungsjahr angelegt.${v ? ` ${v} Beleg(e) warten auf Bestätigung.` : ""}</p>`;
  } catch (e) { box.textContent = "–"; }
}
async function nkOeffnen(oid, jahr) {
  if (!IM.el || imObjekt()?.id !== oid) await imLaden(oid);
  NK.oid = oid; NK.jahr = jahr || NK.jahr;
  if (!NK.el) {
    NK.el = document.createElement("div"); NK.el.className = "im-form nk";
    NK.el.innerHTML = `<div class="im-form-box nk-box"><header><b>${stabLogo("IMMO", "klein")} NEBENKOSTEN</b><nav class="nk-jahre"></nav>
      <button type="button" data-nk="pruefen" title="Immobilien-Postfach und Nebenkosten-Ordner jetzt prüfen">⟳ PRÜFEN</button>
      <button type="button" data-nk="hoch">⇪ BELEG</button><input type="file" accept=".pdf,image/*" multiple hidden class="nk-datei">
      <button type="button" class="vt-zu" data-nk="zu">✕</button></header><div class="nk-inhalt"></div>
      <footer><span class="im-form-status nk-status"></span></footer></div>`;
    IM.el.appendChild(NK.el); requestAnimationFrame(() => NK.el.classList.add("an"));
  }
  await nkLaden();
}
function nkZu() { const el = NK.el; NK.el = null; if (NK.pdfUrl) URL.revokeObjectURL(NK.pdfUrl); NK.pdfUrl = null; if (el) { el.classList.remove("an"); setTimeout(() => el.remove(), 300); } if (IM.el) nkKurz(NK.oid); }
function nkMeldung(t, art = "") { const s = NK.el?.querySelector(".nk-status"); if (s) { s.textContent = t; s.className = "im-form-status nk-status " + art; } }
async function nkLaden() {
  try { NK.u = await fdGet(`/hestia?objekt=${encodeURIComponent(NK.oid)}`); }
  catch (e) { return nkMeldung("⚠ " + e.message, "fehler"); }
  const jahre = NK.u.jahre;
  if (!jahre.find((j) => j.jahr === NK.jahr)) NK.jahr = jahre[0]?.jahr || null;
  const vorschlagJahr = new Date().getMonth() < 6 ? new Date().getFullYear() - 1 : new Date().getFullYear();
  NK.el.querySelector(".nk-jahre").innerHTML = jahre.map((j) => `<button type="button" data-nk="jahr" data-jahr="${j.jahr}" class="${j.jahr === NK.jahr ? "an" : ""}">${j.jahr}</button>`).join("")
    + `<span class="nk-neu"><input type="number" min="2000" max="2100" value="${jahre.length ? Math.max(...jahre.map((j) => j.jahr)) + 1 : vorschlagJahr}" class="nk-neu-jahr">
       <button type="button" data-nk="anlegen">＋ JAHR</button></span>`;
  const j = jahre.find((x) => x.jahr === NK.jahr);
  NK.el.querySelector(".nk-inhalt").innerHTML = nkHTML(j);
  if (j?.entwurf || j?.final) nkPdf(j);
}
function nkHTML(j) {
  const u = NK.u, o = imObjekt();
  const vors = u.vorschlaege.filter((v) => !v.objekt || v.objekt === NK.oid);
  const vorschlaege = vors.length ? `<section class="nk-teil"><h5>ZUR ABLAGE – BITTE BESTÄTIGEN <em>${vors.length}</em></h5>${vors.map(nkVorschlag).join("")}</section>` : "";
  if (!j) return `${vorschlaege}<section class="nk-teil"><h5>ABRECHNUNG</h5><p class="ts-hinweis">Noch kein Abrechnungsjahr angelegt. Oben das Jahr wählen und „＋ JAHR“ –
      HESTIA legt die Belegliste aus dem Mietvertrag an und trägt die Fristen ein. Ab dem 2. Januar passiert das für das Vorjahr automatisch.</p></section>${nkVersorger(o)}${nkProtokoll()}`;
  const r = j.rechnung;
  const fertig = j.posten.length - j.offen;
  const kopf = `<section class="nk-teil nk-kopf">
      <div><small>ZEITRAUM</small><b>${imDatum(j.von)} – ${imDatum(j.bis)}</b></div>
      <div><small>STATUS</small><b>${esc(NK_JSTATUS[j.status] || j.status)}</b></div>
      <div><small>BELEGE</small><b>${fertig} / ${j.posten.length}</b><i class="nk-balken"><u style="--p:${j.posten.length ? fertig / j.posten.length : 0}"></u></i></div>
      <div><small>BELEGE BIS</small><b>${imDatum(j.zielfrist)}</b></div><div><small>AN MIETER BIS</small><b>${imDatum(j.abrechnen_bis)}</b></div>
      <div><small>GESETZLICH</small><b>${imDatum(j.gesetzlich_bis)}</b></div></section>`;
  const zeilen = j.posten.map((p) => {
    const z = r.zeilen.find((x) => x.id === p.id) || {}, [st, farbe] = NK_STATUS[p.status] || [p.status, ""];
    const belege = p.belege.map((b, i) => `<div class="nk-beleg"><span title="${esc(b.datei)}">${esc((b.datei || "").split("/").pop())}</span>
        <input type="number" step="0.01" value="${b.betrag ?? ""}" data-nkb="${p.id}" data-i="${i}" title="Gesamtbetrag laut Beleg"> €</div>`).join("");
    return `<tr class="${p.status}"><td><b>${esc(p.bezeichnung)}</b><small>${esc(z.schluessel || "")}</small></td>
      <td><span class="nk-chip ${farbe}">${st}</span></td><td>${belege || `<span class="nk-leer">kein Beleg</span>`}</td>
      <td class="z">${z.anteil != null ? imEuro(z.anteil, 2) : "–"}</td>
      <td class="nk-akt">${p.status === "fehlt" || p.status === "angefragt" ? `<button type="button" data-nk="anfrage" data-p="${p.id}" title="Anfrage an den Versorger vorbereiten">ANFRAGEN</button>` : ""}
        <button type="button" data-nk="entfaellt" data-p="${p.id}" title="${p.status === "entfaellt" ? "wieder aufnehmen" : "für dieses Jahr nicht abrechnen"}">${p.status === "entfaellt" ? "AUFNEHMEN" : "ENTFÄLLT"}</button>
        <button type="button" data-nk="verteilung" data-p="${p.id}" title="Zeitanteilig nach Mietdauer oder voll umlegen">${p.verteilung === "voll" ? "VOLL" : "ZEITANT."}</button>
        <input type="number" step="0.01" placeholder="Verbrauch €" value="${p.betrag_manuell ?? ""}" data-nkm="${p.id}" title="Mieteranteil laut Zählerständen (überschreibt die Berechnung)"></td></tr>`;
  }).join("");
  const liste = `<section class="nk-teil"><h5>BELEGLISTE <button type="button" class="ts-mini" data-nk="posten-neu">＋ KOSTENART</button></h5>
    <table class="nk-tab"><tr><th>Kostenart</th><th>Status</th><th>Beleg · Gesamtbetrag</th><th class="z">Mieteranteil</th><th></th></tr>${zeilen}</table>
    <div class="nk-posten-neu" hidden><select class="nk-art">${Object.entries(NK_ARTEN).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <button type="button" data-nk="posten-anlegen">HINZUFÜGEN</button></div>
    ${j.offen ? `<div class="vb-reihe"><button type="button" data-nk="anfragen-alle">ANFRAGEN FÜR ALLE FEHLENDEN VORBEREITEN</button></div>` : ""}</section>`;
  const anfr = j.anfragen.filter((a) => a.status !== "erledigt");
  const anfragen = anfr.length ? `<section class="nk-teil"><h5>ANFRAGEN AN VERSORGER</h5>${anfr.map(nkAnfrage).join("")}</section>` : "";
  const abr = `<section class="nk-teil nk-abr"><h5>ABRECHNUNG</h5>
    <div class="nk-summe"><div><small>KOSTEN MIETER</small><b>${imEuro(r.summe, 2)}</b></div><div><small>VORAUSZAHLUNGEN (${r.monate} × ${imEuro(r.vorauszahlung_bisher, 2)})</small>
      <b>${imEuro(r.vorauszahlungen, 2)}</b></div><div class="${r.ergebnis > 0 ? "nach" : "gut"}"><small>${esc(r.art.toUpperCase())}</small><b>${imEuro(Math.abs(r.ergebnis), 2)}</b></div>
      ${r.vorschlag_vorauszahlung ? `<div><small>NEUE VORAUSZAHLUNG (VORSCHLAG)</small><b>${imEuro(r.vorschlag_vorauszahlung)}</b></div>` : ""}</div>
    <label class="im-f nk-vz"><span>Tatsächlich gezahlte Vorauszahlungen (leer = ${r.monate} × Monatsbetrag)</span><input type="number" step="0.01" data-nkvz value="${j.vorauszahlungen_manuell ?? ""}"></label>
    ${nkAbrAktionen(j)}<div class="nk-pdf"></div></section>`;
  return `${kopf}${vorschlaege}${liste}${anfragen}${abr}${nkVersorger(o)}${nkProtokoll()}`;
}
function nkAbrAktionen(j) {
  const m = imObjekt()?.mieter || {};
  if (["sammeln", "anfragen"].includes(j.status)) return `<p class="ts-hinweis">Der Entwurf entsteht automatisch, sobald alle Belege da sind.${j.offen ? "" : ""}</p>
    <div class="vb-reihe"><button type="button" data-nk="entwurf">ENTWURF TROTZDEM ERSTELLEN</button></div>`;
  if (["vollstaendig", "entwurf"].includes(j.status)) return `<div class="vb-reihe"><button type="button" data-nk="entwurf">ENTWURF NEU ERSTELLEN</button>
    ${j.entwurf ? `<button type="button" class="primary" data-nk="billigen">ABRECHNUNG BILLIGEN</button>` : ""}</div>
    ${j.entwurf ? `<p class="ts-hinweis">Billigen erzeugt das endgültige PDF und legt es im Nebenkosten-Ordner der Immobilie ab.</p>` : ""}`;
  if (j.status === "gebilligt") return `<div class="nk-versand"><label class="im-f"><span>Mail des Mieters</span><input type="email" class="nk-mail" value="${esc(/@/.test(m.kontakt || "") ? m.kontakt : "")}"></label>
      <button type="button" class="primary" data-nk="mieter-mail">PER MAIL SENDEN (MIT BELEGEN)</button><button type="button" data-nk="mieter-brief">ALS BRIEF DRUCKEN</button>
      <label class="im-f"><span>Zugegangen am</span><input type="date" class="nk-zugang" value="${new Date().toISOString().slice(0, 10)}"></label>
      <button type="button" data-nk="zugang">ZUGANG VERMERKEN</button></div>${j.final?.archiv ? `<p class="ts-hinweis">Abgelegt: ${esc(j.final.archiv)}</p>` : ""}`;
  return `<p class="ts-hinweis">Zugegangen am <b>${imDatum(j.zugang)}</b>${j.final?.archiv ? ` · abgelegt: ${esc(j.final.archiv)}` : ""}. Zahlungsfrist steht unter „Fristen“.</p>`;
}
function nkVorschlag(v) {
  const q = v.quelle || {};
  return `<div class="nk-vor" data-v="${esc(v.id)}"><div class="nk-vor-kopf"><b>${esc(v.original || "Beleg")}</b>
      <span>${q.art === "mail" ? `Mail · ${esc((q.von || "").replace(/<.*>/, "").trim())} · „${esc(q.betreff || "")}“` : q.art === "ordner" ? "liegt im Nebenkosten-Ordner" : "hochgeladen"}</span>
      <button type="button" data-nk="ansehen" data-v="${esc(v.id)}">ANSEHEN</button></div>
    <div class="nk-vor-felder">
      <label class="im-f"><span>Kostenart</span><select data-vf="kostenart">${Object.entries(NK_ARTEN).map(([k, n]) => `<option value="${k}" ${k === v.kostenart ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label class="im-f"><span>Jahr</span><input type="number" data-vf="jahr" value="${v.jahr}"></label>
      <label class="im-f"><span>Gesamtbetrag €</span><input type="number" step="0.01" data-vf="betrag" value="${v.betrag ?? ""}"></label>
      <label class="im-f"><span>Zeitraum von</span><input type="date" data-vf="von" value="${esc(v.von || "")}"></label>
      <label class="im-f"><span>bis</span><input type="date" data-vf="bis" value="${esc(v.bis || "")}"></label>
      <label class="im-f nk-breit"><span>Ordner im DATENARCHIV${v.ordner_neu ? " – wird angelegt" : ""}</span><input data-vf="ordner" value="${esc(v.ordner || "")}" placeholder="Ordner der Immobilie unter „Bearbeiten“ eintragen"></label>
      <label class="im-f nk-breit"><span>Dateiname</span><input data-vf="dateiname" value="${esc(v.dateiname || "")}"></label></div>
    ${(v.gruende || []).length ? `<p class="nk-hinweis">Erkannt: ${esc(v.gruende.join(", "))}</p>` : ""}
    <div class="vb-reihe"><button type="button" class="primary" data-nk="ablegen" data-v="${esc(v.id)}">ABLEGEN &amp; ZUORDNEN</button>
      <button type="button" data-nk="verwerfen" data-v="${esc(v.id)}">KEIN NEBENKOSTENBELEG</button></div></div>`;
}
function nkAnfrage(a) {
  const st = { entwurf: "ZUR BILLIGUNG", gebilligt: "BRIEF DRUCKEN & VERSCHICKEN", versendet: `VERSENDET ${imDatum(a.versendet)}` }[a.status] || a.status.toUpperCase();
  const edit = a.status === "entwurf";
  return `<div class="nk-anf ${a.status}" data-a="${esc(a.id)}"><div class="nk-vor-kopf"><b>${esc(a.bezeichnung)}${a.art === "erinnerung" ? " · ERINNERUNG" : ""}</b><span class="nk-chip ${a.status === "entwurf" ? "gelb" : a.status === "versendet" ? "gruen" : ""}">${st}</span></div>
    ${edit ? `<div class="nk-vor-felder">
      <label class="im-f"><span>Weg</span><select data-af="weg"><option value="mail" ${a.weg === "mail" ? "selected" : ""}>Mail</option><option value="brief" ${a.weg === "brief" ? "selected" : ""}>Brief</option></select></label>
      <label class="im-f"><span>Empfänger</span><input data-af="empfaenger" value="${esc(a.empfaenger || "")}"></label>
      <label class="im-f"><span>Mail</span><input data-af="email" value="${esc(a.email || "")}"></label>
      <label class="im-f"><span>Anschrift (Zeilen mit ; trennen)</span><input data-af="anschrift" value="${esc(a.anschrift || "")}"></label>
      <label class="im-f nk-breit"><span>Betreff</span><input data-af="betreff" value="${esc(a.betreff)}"></label>
      <label class="im-f nk-breit"><span>Text</span><textarea data-af="text" rows="7">${esc(a.text)}</textarea></label></div>
      <div class="vb-reihe"><button type="button" class="primary" data-nk="anf-billigen" data-a="${esc(a.id)}">BILLIGEN &amp; ${a.weg === "mail" ? "SENDEN" : "DRUCKEN"}</button>
        <button type="button" data-nk="anf-weg" data-a="${esc(a.id)}">VERWERFEN</button></div>`
    : a.status === "gebilligt" ? `<div class="vb-reihe"><button type="button" class="primary" data-nk="anf-verschickt" data-a="${esc(a.id)}">VERSCHICKT</button></div>` : ""}</div>`;
}
function nkVersorger(o) {
  const v = o?.versorger || [];
  const zeile = (x = {}) => `<tr><td><select data-vs="kostenart">${Object.entries(NK_ARTEN).map(([k, n]) => `<option value="${k}" ${k === x.kostenart ? "selected" : ""}>${n}</option>`).join("")}</select></td>
    <td><input data-vs="name" value="${esc(x.name || "")}" placeholder="z. B. Stadtwerke"></td><td><input data-vs="email" value="${esc(x.email || "")}" placeholder="Mail für Anfragen"></td>
    <td><input data-vs="anschrift" value="${esc(x.anschrift || "")}" placeholder="Straße; PLZ Ort"></td><td><input data-vs="kundennummer" value="${esc(x.kundennummer || "")}"></td>
    <td><button type="button" class="nk-x" data-nk="vs-weg">✕</button></td></tr>`;
  return `<details class="nk-teil nk-vs" ${v.length ? "" : "open"}><summary><h5>VERSORGER &amp; BEHÖRDEN <em>${v.length}</em></h5></summary>
    <p class="ts-hinweis">Für Anfragen und zum Erkennen eingehender Belege (Name, Kundennummer). Bleibt lokal.</p>
    <table class="nk-tab nk-vs-tab"><tr><th>Kostenart</th><th>Name</th><th>Mail</th><th>Anschrift</th><th>Kundennr.</th><th></th></tr>${v.map(zeile).join("")}</table>
    <template class="nk-vs-vorlage">${zeile()}</template>
    <div class="vb-reihe"><button type="button" data-nk="vs-neu">＋ VERSORGER</button><button type="button" class="primary" data-nk="vs-speichern">SPEICHERN</button></div></details>`;
}
function nkProtokoll() {
  const p = (NK.u.protokoll || []).slice().reverse();
  return p.length ? `<details class="nk-teil"><summary><h5>VERLAUF</h5></summary>${p.map((x) => `<div class="im-zeile"><span>${esc(x.zeit.replace("T", " "))}</span><b>${esc(x.text)}</b></div>`).join("")}</details>` : "";
}
async function nkPdf(j) {
  const box = NK.el?.querySelector(".nk-pdf"); if (!box) return;
  try {
    const r = await fetch(`/hestia-datei?objekt=${encodeURIComponent(NK.oid)}&jahr=${j.jahr}`, { headers: imH() }); if (!r.ok) throw 0;
    if (NK.pdfUrl) URL.revokeObjectURL(NK.pdfUrl);
    NK.pdfUrl = URL.createObjectURL(await r.blob());
    box.innerHTML = `<iframe src="${NK.pdfUrl}#toolbar=1&view=FitH" title="Abrechnung"></iframe>`;
  } catch (e) { box.innerHTML = ""; }
}
async function nkTun(aktion, daten, ok) {
  nkMeldung("Einen Moment …");
  try { const r = await nkPost(aktion, daten); await nkLaden(); nkMeldung(r.text || ok || "✓", "ok"); return r; }
  catch (e) { nkMeldung("⚠ " + e.message, "fehler"); }
}
document.addEventListener("click", async (e) => {
  if (!NK.el || !e.target.closest(".nk")) return;
  const b = e.target.closest("[data-nk]"); if (!b) return;
  const a = b.dataset.nk, base = { objekt: NK.oid, jahr: NK.jahr };
  const vfeld = (id) => { const c = NK.el.querySelector(`.nk-vor[data-v="${id}"]`); return Object.fromEntries([...c.querySelectorAll("[data-vf]")].map((i) => [i.dataset.vf, i.value])); };
  if (a === "zu") return nkZu();
  if (a === "jahr") { NK.jahr = +b.dataset.jahr; return nkLaden(); }
  if (a === "anlegen") { const y = +NK.el.querySelector(".nk-neu-jahr").value; NK.jahr = y; return nkTun("jahr", { objekt: NK.oid, jahr: y }); }
  if (a === "pruefen") return nkTun("pruefen", {});
  if (a === "hoch") return NK.el.querySelector(".nk-datei").click();
  if (a === "posten-neu") { const f = NK.el.querySelector(".nk-posten-neu"); f.hidden = !f.hidden; return; }
  if (a === "posten-anlegen") return nkTun("posten", { ...base, posten: "neu", daten: { kostenart: NK.el.querySelector(".nk-art").value } });
  if (a === "entfaellt") { const p = NK.u.jahre.find((j) => j.jahr === NK.jahr).posten.find((x) => x.id === b.dataset.p);
    return nkTun("posten", { ...base, posten: p.id, daten: { status: p.status === "entfaellt" ? (p.belege.length ? "vorhanden" : "fehlt") : "entfaellt" } }); }
  if (a === "verteilung") { const p = NK.u.jahre.find((j) => j.jahr === NK.jahr).posten.find((x) => x.id === b.dataset.p);
    return nkTun("posten", { ...base, posten: p.id, daten: { verteilung: p.verteilung === "voll" ? "zeitanteil" : "voll" } }); }
  if (a === "anfrage") return nkTun("anfragen", base).then(() => {});
  if (a === "anfragen-alle") return nkTun("anfragen", base);
  if (a === "ansehen") { try { const r = await fetch(`/hestia-datei?vorschlag=${encodeURIComponent(b.dataset.v)}`, { headers: imH() }); if (!r.ok) throw 0;
    window.open(URL.createObjectURL(await r.blob()), "_blank"); } catch (err) { nkMeldung("Datei nicht verfügbar", "fehler"); } return; }
  if (a === "ablegen") return nkTun("bestaetigen", { id: b.dataset.v, aenderung: vfeld(b.dataset.v) });
  if (a === "verwerfen") return nkTun("verwerfen", { id: b.dataset.v }, "✓ Verworfen");
  if (a === "anf-billigen" || a === "anf-weg") {
    const c = NK.el.querySelector(`.nk-anf[data-a="${b.dataset.a}"]`);
    const daten = Object.fromEntries([...c.querySelectorAll("[data-af]")].map((i) => [i.dataset.af, i.value]));
    if (a === "anf-weg") return nkTun("anfrage_verwerfen", { id: b.dataset.a }, "✓ Verworfen");
    try { await nkPost("anfrage_aendern", { id: b.dataset.a, daten }); } catch (err) { return nkMeldung("⚠ " + err.message, "fehler"); }
    return nkTun("anfrage_billigen", { id: b.dataset.a });
  }
  if (a === "anf-verschickt") return nkTun("anfrage_verschickt", { id: b.dataset.a });
  if (a === "entwurf") return nkTun("entwurf", base);
  if (a === "billigen") {
    if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "WIRKLICH BILLIGEN?"; return; }
    return nkTun("billigen", base);
  }
  if (a === "mieter-mail") {
    if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "JETZT AN DEN MIETER SENDEN?"; return; }
    return nkTun("mieter", { ...base, weg: "mail", email: NK.el.querySelector(".nk-mail").value });
  }
  if (a === "mieter-brief") return nkTun("mieter", { ...base, weg: "brief" });
  if (a === "zugang") return nkTun("zugang", { ...base, datum: NK.el.querySelector(".nk-zugang").value });
  if (a === "vs-neu") { const t = NK.el.querySelector(".nk-vs-vorlage"); NK.el.querySelector(".nk-vs-tab tbody, .nk-vs-tab").insertAdjacentHTML("beforeend", t.innerHTML); return; }
  if (a === "vs-weg") { b.closest("tr").remove(); return; }
  if (a === "vs-speichern") {
    const liste = [...NK.el.querySelectorAll(".nk-vs-tab tr")].filter((tr) => tr.querySelector("[data-vs]"))
      .map((tr) => Object.fromEntries([...tr.querySelectorAll("[data-vs]")].map((i) => [i.dataset.vs, i.value.trim()])));
    try { const r = await nkPost("versorger", { objekt: NK.oid, liste }); IM.d.objekte = IM.d.objekte.map((x) => x.id === NK.oid ? r.objekt : x); await nkLaden(); nkMeldung("✓ Versorger gespeichert", "ok"); }
    catch (err) { nkMeldung("⚠ " + err.message, "fehler"); }
  }
});
document.addEventListener("change", async (e) => {
  if (!NK.el) return;
  const t = e.target, base = { objekt: NK.oid, jahr: NK.jahr };
  if (t.matches(".nk-datei") && t.files.length) {
    let n = 0;
    for (const f of [...t.files].slice(0, 10)) {
      nkMeldung(`Lese Beleg ${++n} lokal …`);
      try { const r = await fetch("/hestia-beleg", { method: "POST", body: f, headers: { "x-dateiname": encodeURIComponent(f.name), ...imH() } });
        const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.detail || r.status); }
      catch (err) { nkMeldung("⚠ " + err.message, "fehler"); }
    }
    t.value = ""; await nkLaden(); nkMeldung("✓ Erkannt – bitte die Ablage bestätigen", "ok"); return;
  }
  if (t.matches("[data-nkb]")) return nkTun("posten", { ...base, posten: t.dataset.nkb, daten: { beleg_index: +t.dataset.i, beleg_betrag: t.value } });
  if (t.matches("[data-nkm]")) return nkTun("posten", { ...base, posten: t.dataset.nkm, daten: { betrag_manuell: t.value } });
  if (t.matches("[data-nkvz]")) { const p = NK.u.jahre.find((j) => j.jahr === NK.jahr)?.posten[0]; if (p) return nkTun("posten", { ...base, posten: p.id, daten: { vorauszahlungen_manuell: t.value } }); }
});
document.addEventListener("keydown", (e) => { if (NK.el && e.key === "Escape" && !inFeld()) { e.stopImmediatePropagation(); nkZu(); } }, true);
const _handleHestia = handle;
handle = function (ev) {
  if (ev.type === "hestia") {
    if (ev.ereignis === "zeigen") { nkOeffnen(ev.objekt, ev.jahr); return; }
    if (NK.el) nkLaden(); else if (IM.el && imObjekt()) nkKurz(imObjekt().id);
    if (ev.ereignis === "vorschlag" && !NK.el) toast("HESTIA: neuer Beleg – bitte die Ablage bestätigen");
    return;
  }
  _handleHestia(ev);
};

// ---------- Einstellungen: Immobilien-Postfach (Daten & Postfächer), Absender und Bankverbindung (Immobilien) ----------
async function nkEinstAufbauen() {
  const box = $("einst-vb"); if (!box) return;
  let u; try { u = await fdGet("/hestia"); } catch (e) { return; }
  const p = u.postfach || {};
  const inhalt = `<p class="vb-hilfe">Ein zusätzlicher iCloud-Mail-Alias nur für Versorger, Behörden und Versicherer der Immobilien
      (icloud.com → Mail → Einstellungen → E-Mail-Adresse hinzufügen). Mails dorthin landen im selben Postfach; HESTIA prüft sie,
      erkennt Belege lokal und legt sie erst nach deiner Bestätigung ab. Der Werbefilter lässt sie in Ruhe.</p>
    <div class="vb-feld"><label>Alias-Adresse</label><input type="email" data-hp="alias" value="${esc(p.alias || "")}" placeholder="immobilien.…@icloud.com"></div>
    <div class="vb-feld"><label>Prüfen alle … Minuten</label><input type="number" min="5" max="240" data-hp="intervall_min" value="${p.intervall_min || 15}"></div>
    <div class="vb-reihe"><button type="button" class="primary" data-hp-a="speichern">SPEICHERN</button><button type="button" data-hp-a="pruefen" ${p.alias ? "" : "disabled"}>JETZT PRÜFEN</button></div>
    ${p.letzter_lauf ? `<p class="vb-hilfe">Zuletzt geprüft: ${esc(p.letzter_lauf.replace("T", " "))}</p>` : ""}`;
  const zeile = box.querySelector('details[data-id="hestia-postfach"]');
  const html = vbZeile("hestia-postfach", "Immobilien-Postfach (HESTIA)", p.alias ? { ok: true, text: "✓ " + p.alias } : { text: "– nicht eingerichtet" }, inhalt, zeile?.open);
  if (zeile) zeile.outerHTML = html; else box.insertAdjacentHTML("beforeend", html);
  const s = document.querySelector('#einst section[data-reiter="immobilien"]');
  if (s && !s.querySelector(".nk-einst")) s.insertAdjacentHTML("beforeend", `<details class="vb-zeile nk-einst"><summary><span>Absender &amp; Bankverbindung für Abrechnungen</span>
      <em>${u.bank ? "✓ Bankverbindung hinterlegt" : "– keine Bankverbindung"}</em></summary><div class="vb-inhalt">
      <p class="vb-hilfe">Steht im Briefkopf und bei einer Nachzahlung in der Abrechnung. Die IBAN liegt im Schlüsselbund und wird nur in die
        PDFs auf dem Mac geschrieben – nie an Claude gegeben.</p>
      <div class="vb-feld"><label>Absenderanschrift (Zeilen mit ; trennen)</label><input data-hb="anschrift" value="${esc(u.absender_anschrift || "")}" placeholder="Straße Nr; PLZ Ort"></div>
      <div class="vb-feld"><label>Kontoinhaber</label><input data-hb="inhaber" placeholder="z. B. Name der GbR"></div>
      <div class="vb-feld"><label>IBAN</label><input type="password" data-hb="iban" autocomplete="off" placeholder="${u.bank ? "gespeichert – zum Ändern neu eingeben" : "DE…"}"></div>
      <div class="vb-reihe"><button type="button" class="primary" data-hb-a="speichern">SPEICHERN</button></div><div class="vb-status"></div></div></details>`);
  if (typeof einstFiltern === "function") einstFiltern();
}
EINST_ZEILEN["hestia-postfach"] = "daten";
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-hp-a],[data-hb-a]"); if (!b) return;
  const zeile = b.closest(".vb-zeile"), st = zeile.querySelector(".vb-status");
  const melde = (t, art = "") => { st.textContent = t; st.className = "vb-status " + art; };
  b.disabled = true; melde("Einen Moment …");
  try {
    let r;
    if (b.dataset.hpA === "speichern") r = await nkPost("postfach", { alias: zeile.querySelector('[data-hp="alias"]').value, intervall_min: +zeile.querySelector('[data-hp="intervall_min"]').value });
    else if (b.dataset.hpA === "pruefen") r = await nkPost("pruefen", {});
    else {
      const w = (k) => zeile.querySelector(`[data-hb="${k}"]`).value;
      r = await nkPost("absender", { anschrift: w("anschrift") });
      if (w("iban") || w("inhaber")) r = await nkPost("bank", { iban: w("iban"), inhaber: w("inhaber") });
    }
    melde(r.text || "✓", "ok"); if (b.dataset.hpA) setTimeout(nkEinstAufbauen, 900);
  } catch (err) { melde(err.message, "fehler"); }
  b.disabled = false;
});
const _vbAufbauenHestia = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenHestia(...a); nkEinstAufbauen(); };
const _imEinstHestia = imEinstAufbauen;
imEinstAufbauen = async function () { await _imEinstHestia(); nkEinstAufbauen(); };

// =====================================================================
//  HESTIA – GRUNDRISS → 3D: Hochladen, Erkennen (Claude, nur mit Freigabe), Editor (Wände, Türen, Fenster, Räume,
//  Maßstab), 3D-Puppenhaus (Three.js, lazy), Flächenabgleich mit der Wohnfläche.
// =====================================================================
const GR = { el: null, oid: null, plaene: [], i: 0, wz: "auswahl", sel: null, m3d: null, bilder: {}, timer: 0, zug: null, raum: [], bildAn: true, abgleich: null };
let gr3dLaden = null;
function gr3dLib() {
  if (window.Grundriss3D) return Promise.resolve();
  if (!gr3dLaden) gr3dLaden = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "grundriss3d.bundle.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return gr3dLaden;
}
const grPlan = () => GR.plaene[GR.i];
const grLen = (w) => Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
const grFlaechePx = (poly) => Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
function grFlaechen(p) {
  const s = p.massstab; let summe = 0;
  for (const r of p.raeume || []) { r.flaeche = s ? +(grFlaechePx(r.polygon) * s * s).toFixed(2) : null; summe += r.flaeche_plan || r.flaeche || 0; }
  p.flaeche_summe = summe ? +summe.toFixed(1) : null;
}
async function grOeffnen(oid) {
  GR.oid = oid; GR.i = 0; GR.sel = null; GR.wz = "auswahl";
  if (!GR.el) {
    GR.el = document.createElement("div"); GR.el.className = "im-form gr";
    GR.el.innerHTML = `<div class="im-form-box gr-box"><header><b>${stabLogo("IMMO", "klein")} GRUNDRISS → 3D</b><nav class="gr-ebenen"></nav>
      <button type="button" data-gr="hoch">⇪ GRUNDRISS</button><input type="file" accept=".pdf,image/*,.heic" hidden class="gr-datei">
      <button type="button" class="vt-zu" data-gr="zu">✕</button></header>
      <div class="gr-inhalt"><section class="gr-plan"><div class="gr-werkzeuge"></div><div class="gr-svg-box"></div><div class="gr-freigabe" hidden></div></section>
        <section class="gr-3d"><div class="gr-3d-box"><p class="ts-hinweis">3D-Modell wird geladen …</p></div>
          <div class="gr-3d-knoepfe"><button type="button" data-gr="ansicht">⟲ ANSICHT</button><button type="button" data-gr="halb">HALBHOCH</button><span class="gr-3d-ebenen"></span></div></section>
        <aside class="gr-seite"></aside></div>
      <footer><span class="im-form-status gr-status"></span><button type="button" class="primary" data-gr="speichern">SPEICHERN</button></footer></div>`;
    (IM.el || document.body).appendChild(GR.el); requestAnimationFrame(() => GR.el.classList.add("an"));
  }
  await grLaden();
}
function grZu() { const el = GR.el; GR.el = null; setTimeout(() => { if (IM.el && imObjekt()) im3dKachel(imObjekt()); }, 350); try { GR.m3d?.entfernen(); } catch (e) {} GR.m3d = null; Object.values(GR.bilder).forEach((u) => URL.revokeObjectURL(u)); GR.bilder = {}; if (el) { el.classList.remove("an"); setTimeout(() => el.remove(), 300); } }
function grMeldung(t, art = "") { const s = GR.el?.querySelector(".gr-status"); if (s) { s.textContent = t; s.className = "im-form-status gr-status " + art; } }
async function grLaden() {
  try { const r = await fdGet(`/grundriss/${encodeURIComponent(GR.oid)}`); GR.plaene = r.plaene; GR.abgleich = r.abgleich; }
  catch (e) { return grMeldung("⚠ " + e.message, "fehler"); }
  GR.i = Math.min(GR.i, Math.max(0, GR.plaene.length - 1));
  grAlles();
}
async function grBild(p) {
  if (GR.bilder[p.id]) return GR.bilder[p.id];
  try { const r = await fetch(`/grundriss/${GR.oid}/${p.id}/bild`, { headers: imH() }); if (!r.ok) throw 0; GR.bilder[p.id] = URL.createObjectURL(await r.blob()); } catch (e) { GR.bilder[p.id] = ""; }
  return GR.bilder[p.id];
}
function grAlles() { grKopf(); grWerkzeuge(); grZeichnen(); grSeite(); gr3d(); }
function grKopf() {
  GR.el.querySelector(".gr-ebenen").innerHTML = GR.plaene.map((p, i) => `<button type="button" data-gr="ebene" data-i="${i}" class="${i === GR.i ? "an" : ""}">${esc(p.stockwerk || "Ebene " + (i + 1))}</button>`).join("");
  GR.el.querySelector(".gr-3d-ebenen").innerHTML = GR.plaene.length > 1 ? `<button type="button" data-gr="3d-alle">ALLE EBENEN</button>${GR.plaene.map((p, i) => `<button type="button" data-gr="3d-ebene" data-i="${i}">${esc(p.stockwerk)}</button>`).join("")}` : "";
}
function grWerkzeuge() {
  const p = grPlan(), w = (k, t, tip) => `<button type="button" data-gr="wz" data-wz="${k}" class="${GR.wz === k ? "an" : ""}" title="${tip}">${t}</button>`;
  GR.el.querySelector(".gr-werkzeuge").innerHTML = !p ? "" : `${w("auswahl", "↖ AUSWAHL", "Wandenden ziehen, Raum anklicken")}${w("wand", "▬ WAND", "Ziehen zeichnet eine Wand (rastet an Ecken und rechten Winkeln ein)")}
    ${w("tuer", "◫ TÜR", "Auf eine Wand klicken")}${w("fenster", "▭ FENSTER", "Auf eine Wand klicken")}${w("raum", "⬠ RAUM", "Ecken anklicken, Doppelklick schließt")}
    ${w("loeschen", "✕ LÖSCHEN", "Element anklicken")}${w("massstab", "↔ MASSSTAB", "Wand anklicken und echte Länge eingeben")}
    <span class="gr-trenner"></span><button type="button" data-gr="bild" class="${GR.bildAn ? "an" : ""}">BILD</button>
    <button type="button" class="gr-ki" data-gr="erkennen">✦ ERKENNEN</button>`;
}
async function grZeichnen() {
  const box = GR.el.querySelector(".gr-svg-box"), p = grPlan();
  if (!p) { box.innerHTML = `<div class="gr-leer"><p>Noch kein Grundriss. Lade einen Plan hoch (PDF, Foto oder HEIC) – je Stockwerk einen.</p>
      <button type="button" class="primary" data-gr="hoch">⇪ GRUNDRISS HOCHLADEN</button></div>`; return; }
  const url = await grBild(p);
  const b = p.bild_b || 1000, h = p.bild_h || 700, d = Math.max(b, h) / 300;
  const s = p.massstab;
  const wand = (w, i) => {
    const sel = GR.sel?.art === "wand" && GR.sel.i === i;
    return `<line class="gr-w ${w.aussen ? "aussen" : ""} ${sel ? "sel" : ""}" data-w="${i}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke-width="${(w.aussen ? 3.2 : 1.8) * d}"/>`
      + `<line class="gr-w-treffer" data-w="${i}" x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke-width="${10 * d}"/>`;
  };
  const oeff = (o, k) => {
    const w = p.waende[o.wand]; if (!w) return "";
    const L = grLen(w), bpx = s ? (o.breite_m || 0.9) / s : (o.typ === "tuer" ? 0.9 : 1.2) / 0.02, t0 = o.pos - bpx / 2 / L, t1 = o.pos + bpx / 2 / L;
    const P = (t) => [w.x1 + (w.x2 - w.x1) * t, w.y1 + (w.y2 - w.y1) * t];
    const [a, e] = [P(Math.max(0, t0)), P(Math.min(1, t1))];
    return `<line class="gr-o ${o.typ}" data-o="${k}" x1="${a[0]}" y1="${a[1]}" x2="${e[0]}" y2="${e[1]}" stroke-width="${5 * d}"/>`;
  };
  const raum = (r, k) => {
    const c = r.polygon.reduce((a, q) => [a[0] + q[0] / r.polygon.length, a[1] + q[1] / r.polygon.length], [0, 0]);
    const f = r.flaeche_plan || r.flaeche, sel = GR.sel?.art === "raum" && GR.sel.i === k;
    return `<g class="gr-r ${sel ? "sel" : ""}" data-r="${k}"><polygon points="${r.polygon.map((q) => q.join(",")).join(" ")}"/>
      <text x="${c[0]}" y="${c[1]}" font-size="${11 * d}">${esc(r.name)}</text>${f ? `<text x="${c[0]}" y="${c[1] + 13 * d}" font-size="${9 * d}" class="m2">${String(f.toFixed(1)).replace(".", ",")} m²</text>` : ""}</g>`;
  };
  const griffe = GR.wz === "auswahl" ? p.waende.map((w, i) => `<circle class="gr-g" data-w="${i}" data-e="1" cx="${w.x1}" cy="${w.y1}" r="${4 * d}"/><circle class="gr-g" data-w="${i}" data-e="2" cx="${w.x2}" cy="${w.y2}" r="${4 * d}"/>`).join("") : "";
  const raumNeu = GR.raum.length ? `<polyline class="gr-raum-neu" points="${GR.raum.map((q) => q.join(",")).join(" ")}" stroke-width="${2 * d}"/>` : "";
  box.innerHTML = `<svg class="gr-svg wz-${GR.wz}" viewBox="0 0 ${b} ${h}" preserveAspectRatio="xMidYMid meet">
    ${url && GR.bildAn ? `<image href="${url}" x="0" y="0" width="${b}" height="${h}" opacity=".55"/>` : `<rect width="${b}" height="${h}" class="gr-papier"/>`}
    <g>${(p.raeume || []).map(raum).join("")}</g><g>${p.waende.map(wand).join("")}</g><g>${(p.oeffnungen || []).map(oeff).join("")}</g>${raumNeu}
    <line class="gr-vorschau" x1="0" y1="0" x2="0" y2="0" stroke-width="${2.5 * d}" visibility="hidden"/>${griffe}</svg>`;
}
function grSeite() {
  const p = grPlan(), box = GR.el.querySelector(".gr-seite");
  if (!p) { box.innerHTML = ""; return; }
  grFlaechen(p);
  const o = imObjekt(), wf = o?.wohnflaeche;
  const summe = GR.plaene.reduce((a, q) => { grFlaechen(q); return a + (q.flaeche_summe || 0); }, 0);
  const abw = summe && wf ? (summe / wf - 1) * 100 : null;
  let sel = "";
  if (GR.sel?.art === "raum") {
    const r = p.raeume[GR.sel.i];
    sel = `<div class="gr-sel"><h6>RAUM</h6><label class="im-f"><span>Name</span><input data-grf="raum-name" value="${esc(r.name)}"></label>
      <label class="im-f"><span>Fläche laut Plan m² (optional)</span><input type="number" step="0.01" data-grf="raum-plan" value="${r.flaeche_plan ?? ""}"></label>
      <p class="ts-hinweis">Aus dem Modell: ${r.flaeche != null ? String(r.flaeche).replace(".", ",") + " m²" : "– (Maßstab fehlt)"}</p></div>`;
  } else if (GR.sel?.art === "wand") {
    const w = p.waende[GR.sel.i];
    sel = `<div class="gr-sel"><h6>WAND</h6><p class="ts-hinweis">Länge: ${p.massstab ? (grLen(w) * p.massstab).toFixed(2).replace(".", ",") + " m" : "– (Maßstab fehlt)"}</p>
      <label class="gr-check"><input type="checkbox" data-grf="wand-aussen" ${w.aussen ? "checked" : ""}> Außenwand (36 cm)</label></div>`;
  } else if (GR.sel?.art === "massstab") {
    const w = p.waende[GR.sel.i];
    sel = `<div class="gr-sel"><h6>MASSSTAB</h6><label class="im-f"><span>Echte Länge dieser Wand in m</span><input type="number" step="0.01" data-grf="massstab-m" autofocus
      value="${p.massstab ? (grLen(w) * p.massstab).toFixed(2) : ""}"></label><button type="button" data-gr="massstab-setzen">ÜBERNEHMEN</button></div>`;
  }
  box.innerHTML = `<div class="gr-info"><label class="im-f"><span>Stockwerk</span><input data-grf="stockwerk" value="${esc(p.stockwerk || "")}"></label>
      <label class="im-f"><span>Raumhöhe m</span><input type="number" step="0.05" data-grf="wandhoehe" value="${p.wandhoehe || 2.5}"></label>
      <p class="gr-mass ${p.massstab ? "" : "warn"}">${p.massstab ? `Maßstab: 1 m = ${(1 / p.massstab).toFixed(1)} Bildpunkte${p.masse?.length ? ` (aus ${p.masse.length} Maßketten)` : ""}` : "⚠ Maßstab fehlt – Werkzeug „MASSSTAB“: Wand anklicken, echte Länge eingeben."}</p></div>
    ${sel}
    <div class="gr-raeume"><h6>RÄUME ${esc(p.stockwerk || "")}</h6>${(p.raeume || []).map((r, k) => `<button type="button" data-gr="raum-sel" data-i="${k}" class="${GR.sel?.art === "raum" && GR.sel.i === k ? "an" : ""}"><span>${esc(r.name)}</span><b>${(r.flaeche_plan || r.flaeche) != null ? String((r.flaeche_plan || r.flaeche).toFixed(1)).replace(".", ",") + " m²" : "–"}</b></button>`).join("") || `<p class="ts-hinweis">Keine Räume – „ERKENNEN“ oder Werkzeug „RAUM“.</p>`}</div>
    <div class="gr-abgleich ${abw != null && Math.abs(abw) > 10 ? "warn" : ""}"><h6>FLÄCHENABGLEICH</h6>
      <div class="im-zeile"><span>Summe Räume (alle Ebenen)</span><b>${summe ? summe.toFixed(1).replace(".", ",") + " m²" : "–"}</b></div>
      <div class="im-zeile"><span>Wohnfläche laut Mietvertrag</span><b>${wf ? String(wf).replace(".", ",") + " m²" : "–"}</b></div>
      ${abw != null ? `<div class="im-zeile"><span>Abweichung</span><b>${abw > 0 ? "+" : ""}${abw.toFixed(1).replace(".", ",")} %</b></div>
        ${Math.abs(abw) > 10 ? `<p class="nk-hinweis">Mehr als 10 % Abweichung – für die Miete rechtlich relevant. Bitte Räume und Maßstab prüfen; die Wohnflächenverordnung zählt z. B. Dachschrägen und Balkone nur anteilig.</p>` : `<p class="ts-hinweis">Innerhalb von 10 % – unkritisch.</p>`}` : ""}</div>
    <div class="vb-reihe"><button type="button" data-gr="ebene-weg">GRUNDRISS ENTFERNEN</button></div>`;
}
async function gr3d() {
  const box = GR.el.querySelector(".gr-3d-box");
  try { await gr3dLib(); } catch (e) { box.innerHTML = `<p class="ts-hinweis">3D-Ansicht konnte nicht geladen werden.</p>`; return; }
  if (!GR.plaene.length) { try { GR.m3d?.entfernen(); } catch (e) {} GR.m3d = null; box.innerHTML = `<p class="ts-hinweis">Das 3D-Modell erscheint, sobald Wände da sind.</p>`; return; }
  if (!GR.m3d) { box.innerHTML = ""; try { GR.m3d = window.Grundriss3D.erzeugen(box, GR.plaene); } catch (e) { box.innerHTML = `<p class="ts-hinweis">3D braucht WebGL.</p>`; } }
  else GR.m3d.setzen(GR.plaene);
}
function grGeaendert(neu3d = true) {
  grFlaechen(grPlan()); grZeichnen(); grSeite(); if (neu3d) GR.m3d?.setzen(GR.plaene);
  clearTimeout(GR.timer); GR.timer = setTimeout(grSpeichern, 1500); grMeldung("Änderung – wird gespeichert …");
}
async function grSpeichern() {
  const p = grPlan(); if (!p) return;
  try { const r = await vbPost(`/grundriss/${GR.oid}/${p.id}/speichern`, { waende: p.waende, oeffnungen: p.oeffnungen, raeume: p.raeume, masse: p.masse || [],
      massstab: p.massstab, wandhoehe: p.wandhoehe, stockwerk: p.stockwerk }); grMeldung("✓ Gespeichert", "ok"); return r; }
  catch (e) { grMeldung("⚠ " + e.message, "fehler"); }
}
function grPunkt(ev) { const svg = GR.el.querySelector(".gr-svg"); const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }
function grFang(pt, ohne = -1, ausgang = null) {
  const p = grPlan(), d = Math.max(p.bild_b, p.bild_h) / 60;
  for (const [i, w] of p.waende.entries()) { if (i === ohne) continue;
    for (const q of [[w.x1, w.y1], [w.x2, w.y2]]) if (Math.hypot(q[0] - pt[0], q[1] - pt[1]) < d) return q.slice(); }
  if (ausgang) {                                           // rechte Winkel bevorzugen
    if (Math.abs(pt[0] - ausgang[0]) < d) pt[0] = ausgang[0];
    if (Math.abs(pt[1] - ausgang[1]) < d) pt[1] = ausgang[1];
  }
  return pt;
}
function grNaechsteWand(pt) {
  const p = grPlan(); let best = null;
  p.waende.forEach((w, i) => { const dx = w.x2 - w.x1, dy = w.y2 - w.y1, l2 = dx * dx + dy * dy; if (!l2) return;
    const t = Math.max(0, Math.min(1, ((pt[0] - w.x1) * dx + (pt[1] - w.y1) * dy) / l2)), dd = Math.hypot(w.x1 + t * dx - pt[0], w.y1 + t * dy - pt[1]);
    if (!best || dd < best.d) best = { i, t, d: dd }; });
  return best && best.d < Math.max(p.bild_b, p.bild_h) / 40 ? best : null;
}
function grWandWeg(i) {
  const p = grPlan(); p.waende.splice(i, 1);
  p.oeffnungen = (p.oeffnungen || []).filter((o) => o.wand !== i).map((o) => ({ ...o, wand: o.wand > i ? o.wand - 1 : o.wand }));
}
document.addEventListener("pointerdown", (e) => {
  if (!GR.el || !e.target.closest(".gr-svg")) return;
  const p = grPlan(); if (!p) return;
  const pt = grPunkt(e), t = e.target;
  if (GR.wz === "auswahl") {
    if (t.matches(".gr-g")) { GR.zug = { w: +t.dataset.w, e: t.dataset.e }; t.setPointerCapture?.(e.pointerId); e.preventDefault(); return; }
    if (t.closest(".gr-w-treffer,.gr-w")) { GR.sel = { art: "wand", i: +t.closest("[data-w]").dataset.w }; grZeichnen(); grSeite(); return; }
    if (t.closest(".gr-r")) { GR.sel = { art: "raum", i: +t.closest(".gr-r").dataset.r }; grZeichnen(); grSeite(); return; }
    GR.sel = null; grZeichnen(); grSeite(); return;
  }
  if (GR.wz === "wand") { const a = grFang(pt); GR.zug = { neu: a }; e.preventDefault(); return; }
  if (GR.wz === "tuer" || GR.wz === "fenster") {
    const n = grNaechsteWand(pt); if (!n) return grMeldung("Bitte direkt auf eine Wand klicken", "fehler");
    (p.oeffnungen = p.oeffnungen || []).push({ typ: GR.wz, wand: n.i, pos: +n.t.toFixed(4), breite_m: GR.wz === "tuer" ? 0.9 : 1.2 });
    return grGeaendert();
  }
  if (GR.wz === "loeschen") {
    if (t.matches("[data-o]")) { p.oeffnungen.splice(+t.dataset.o, 1); return grGeaendert(); }
    if (t.closest("[data-w]")) { grWandWeg(+t.closest("[data-w]").dataset.w); GR.sel = null; return grGeaendert(); }
    if (t.closest(".gr-r")) { p.raeume.splice(+t.closest(".gr-r").dataset.r, 1); GR.sel = null; return grGeaendert(); }
    return;
  }
  if (GR.wz === "massstab") {
    const n = t.closest("[data-w]") ? { i: +t.closest("[data-w]").dataset.w } : grNaechsteWand(pt);
    if (!n) return grMeldung("Bitte eine Wand anklicken, deren Länge du kennst", "fehler");
    GR.sel = { art: "massstab", i: n.i }; grZeichnen(); grSeite(); GR.el.querySelector('[data-grf="massstab-m"]')?.focus(); return;
  }
  if (GR.wz === "raum") {
    if (e.detail >= 2 && GR.raum.length >= 3) { (p.raeume = p.raeume || []).push({ name: "Raum " + (p.raeume.length + 1), polygon: GR.raum, flaeche_plan: null });
      GR.raum = []; GR.sel = { art: "raum", i: p.raeume.length - 1 }; return grGeaendert(); }
    GR.raum.push(grFang(pt)); grZeichnen();
  }
});
document.addEventListener("pointermove", (e) => {
  if (!GR.el || !GR.zug) return;
  const p = grPlan(), pt = grPunkt(e);
  if (GR.zug.neu) { const v = GR.el.querySelector(".gr-vorschau"), q = grFang(pt, -1, GR.zug.neu);
    Object.entries({ x1: GR.zug.neu[0], y1: GR.zug.neu[1], x2: q[0], y2: q[1] }).forEach(([k, x]) => v.setAttribute(k, x)); v.setAttribute("visibility", "visible"); return; }
  const w = p.waende[GR.zug.w], ander = GR.zug.e === "1" ? [w.x2, w.y2] : [w.x1, w.y1], q = grFang(pt, GR.zug.w, ander);
  if (GR.zug.e === "1") { w.x1 = q[0]; w.y1 = q[1]; } else { w.x2 = q[0]; w.y2 = q[1]; }
  const l = GR.el.querySelectorAll(`[data-w="${GR.zug.w}"]`);
  l.forEach((x) => { if (x.tagName === "line") { x.setAttribute("x1", w.x1); x.setAttribute("y1", w.y1); x.setAttribute("x2", w.x2); x.setAttribute("y2", w.y2); }
    else if (x.dataset.e === GR.zug.e) { x.setAttribute("cx", q[0]); x.setAttribute("cy", q[1]); } });
});
document.addEventListener("pointerup", (e) => {
  if (!GR.el || !GR.zug) return;
  const p = grPlan(), z = GR.zug; GR.zug = null;
  if (z.neu) { const q = grFang(grPunkt(e), -1, z.neu);
    if (Math.hypot(q[0] - z.neu[0], q[1] - z.neu[1]) > Math.max(p.bild_b, p.bild_h) / 80) { p.waende.push({ x1: z.neu[0], y1: z.neu[1], x2: q[0], y2: q[1], aussen: false }); return grGeaendert(); }
    return grZeichnen(); }
  grGeaendert();
});
document.addEventListener("keydown", (e) => {
  if (!GR.el) return;
  if (e.key === "Escape" && !inFeld()) { e.stopImmediatePropagation(); if (GR.raum.length) { GR.raum = []; grZeichnen(); } else grZu(); return; }
  if (e.key === "Enter" && GR.wz === "raum" && GR.raum.length >= 3) { const p = grPlan(); (p.raeume = p.raeume || []).push({ name: "Raum " + (p.raeume.length + 1), polygon: GR.raum, flaeche_plan: null }); GR.raum = []; grGeaendert(); }
  if ((e.key === "Delete" || e.key === "Backspace") && !inFeld() && GR.sel) { const p = grPlan();
    if (GR.sel.art === "wand") grWandWeg(GR.sel.i); else if (GR.sel.art === "raum") p.raeume.splice(GR.sel.i, 1); GR.sel = null; grGeaendert(); }
}, true);
document.addEventListener("click", async (e) => {
  if (!GR.el || !e.target.closest(".gr")) return;
  const b = e.target.closest("[data-gr]"); if (!b) return;
  const a = b.dataset.gr, p = grPlan();
  if (a === "zu") { if (GR.timer) { clearTimeout(GR.timer); await grSpeichern(); } return grZu(); }
  if (a === "hoch") return GR.el.querySelector(".gr-datei").click();
  if (a === "ebene") { GR.i = +b.dataset.i; GR.sel = null; GR.raum = []; return grAlles(); }
  if (a === "wz") { GR.wz = b.dataset.wz; GR.sel = null; GR.raum = []; grWerkzeuge(); return grZeichnen(); }
  if (a === "bild") { GR.bildAn = !GR.bildAn; grWerkzeuge(); return grZeichnen(); }
  if (a === "ansicht") return GR.m3d?.ansicht();
  if (a === "halb") { b.classList.toggle("an"); return GR.m3d?.halbhoch(b.classList.contains("an")); }
  if (a === "3d-alle") return GR.m3d?.ebene(null);
  if (a === "3d-ebene") return GR.m3d?.ebene(+b.dataset.i);
  if (a === "speichern") { clearTimeout(GR.timer); return grSpeichern(); }
  if (a === "raum-sel") { GR.sel = { art: "raum", i: +b.dataset.i }; GR.wz = "auswahl"; grWerkzeuge(); grZeichnen(); return grSeite(); }
  if (a === "massstab-setzen") {
    const m = +GR.el.querySelector('[data-grf="massstab-m"]').value, w = p.waende[GR.sel.i];
    if (!(m > 0.2)) return grMeldung("Bitte eine Länge in Metern eingeben", "fehler");
    p.massstab = m / grLen(w); GR.sel = null; grMeldung(`✓ Maßstab gesetzt`, "ok"); return grGeaendert();
  }
  if (a === "ebene-weg") {
    if (b.dataset.sicher !== "1") { b.dataset.sicher = "1"; b.textContent = "WIRKLICH ENTFERNEN?"; return; }
    try { await vbPost(`/grundriss/${GR.oid}/${p.id}/entfernen`, {}); GR.i = 0; GR.sel = null; await grLaden(); } catch (err) { grMeldung("⚠ " + err.message, "fehler"); }
    return;
  }
  if (a === "erkennen") {
    const f = GR.el.querySelector(".gr-freigabe");
    f.hidden = false;
    f.innerHTML = `<h6>FREIGABE</h6><p>Zum Erkennen wird <b>nur das Bild dieses Grundrisses</b> an Claude gesendet (Anthropic) und dort ausgewertet –
      keine Adresse, keine Namen, keine weiteren Daten. Kosten etwa 5–20 Cent. ${p.waende.length ? "Deine bisherigen Wände dieses Stockwerks werden dabei ersetzt." : ""}</p>
      <div class="vb-reihe"><button type="button" class="primary" data-gr="freigeben">FREIGEBEN &amp; ERKENNEN</button><button type="button" data-gr="freigabe-ab">ABBRECHEN</button></div>`;
    return;
  }
  if (a === "freigabe-ab") { GR.el.querySelector(".gr-freigabe").hidden = true; return; }
  if (a === "freigeben") {
    const f = GR.el.querySelector(".gr-freigabe"); f.innerHTML = `<p class="gr-laeuft"><i></i>Claude liest den Grundriss … (bis zu einer Minute)</p>`;
    try { const r = await vbPost(`/grundriss/${GR.oid}/${p.id}/erkennen`, { freigabe: true });
      GR.plaene[GR.i] = r.plan; f.hidden = true; grAlles();
      grMeldung(r.text + (r.hinweis ? " · " + r.hinweis : "") + (r.kosten_eur ? ` · ${String(r.kosten_eur).replace(".", ",")} €` : ""), "ok"); }
    catch (err) { f.hidden = true; grMeldung("⚠ " + err.message, "fehler"); }
  }
});
document.addEventListener("change", async (e) => {
  if (!GR.el) return;
  const t = e.target, p = grPlan();
  if (t.matches(".gr-datei") && t.files.length) {
    const f = t.files[0]; t.value = ""; grMeldung("Grundriss wird übernommen …");
    try { const r = await fetch(`/grundriss/${GR.oid}`, { method: "POST", body: f, headers: { "x-dateiname": encodeURIComponent(f.name), ...imH() } });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.detail || r.status);
      GR.plaene.push(j.plan); GR.i = GR.plaene.length - 1; grAlles(); grMeldung(j.text, "ok"); }
    catch (err) { grMeldung("⚠ " + err.message, "fehler"); }
    return;
  }
  if (!t.matches("[data-grf]") || !p) return;
  const k = t.dataset.grf;
  if (k === "stockwerk") { p.stockwerk = t.value.trim().slice(0, 30) || p.stockwerk; grKopf(); }
  if (k === "wandhoehe") p.wandhoehe = Math.max(1.8, Math.min(5, +t.value || 2.5));
  if (k === "raum-name") p.raeume[GR.sel.i].name = t.value.trim().slice(0, 30) || "Raum";
  if (k === "raum-plan") p.raeume[GR.sel.i].flaeche_plan = t.value === "" ? null : +t.value;
  if (k === "wand-aussen") p.waende[GR.sel.i].aussen = t.checked;
  grGeaendert();
});

// ---------- Immobilienfenster: interaktives 3D-Modell des Grundrisses neben der Karte ----------
async function im3dKachel(o) {
  const box = IM.el?.querySelector(".im-3d-box"); if (!box) return;
  try { IM.m3d?.entfernen(); } catch (e) {} IM.m3d = null;
  let plaene = [];
  try { plaene = (await fdGet(`/grundriss/${encodeURIComponent(o.id)}`)).plaene.filter((p) => (p.waende || []).length); } catch (e) {}
  if (!IM.el || imObjekt()?.id !== o.id) return;
  if (!plaene.length) {
    box.innerHTML = `<button type="button" class="im-3d-leer" data-im="grundriss"><b>＋ GRUNDRISS HINZUFÜGEN</b><small>Plan hochladen – daraus entsteht ein 3D-Modell zum Drehen</small></button>`;
    return;
  }
  box.innerHTML = "";
  try { await gr3dLib(); IM.m3d = window.Grundriss3D.erzeugen(box, plaene); box.title = "Ziehen zum Drehen, scrollen zum Zoomen"; }
  catch (e) { box.innerHTML = `<p class="ts-hinweis">3D braucht WebGL.</p>`; }
}

// ---------- Live-Karte (Fahrzeuge): Orte bei Durchfahrt einblenden – auch in der minimierten Ansicht ----------
TL.orte = []; TL.ortZeit = 0; TL.ortPos = null; TL.ortLetzt = "";
function tlAbstand(a, b) {
  const r = Math.PI / 180, dl = (b[1] - a[1]) * r, dn = (b[0] - a[0]) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dn / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(x));
}
async function tlOrtPruefen(p) {
  if (!TL.an || p.lat == null || !p.faehrt) return;
  const jetzt = Date.now(), pos = [p.lon, p.lat];
  if (jetzt - TL.ortZeit < 15000 || (TL.ortPos && tlAbstand(TL.ortPos, pos) < 400)) return;
  TL.ortZeit = jetzt; TL.ortPos = pos;
  let o; try { o = await fdGet(`/standort/ort?lat=${p.lat}&lon=${p.lon}`); } catch (e) { return; }
  const label = o.teil ? `${o.teil} · ${o.ort}` : o.ort;
  if (!label || label === TL.ortLetzt || !TL.an) return;
  const neueStadt = !TL.ortLetzt || !TL.ortLetzt.endsWith(o.ort);
  TL.ortLetzt = label;
  TL.orte.unshift({ ort: o.ort, teil: o.teil, zeit: new Date().toTimeString().slice(0, 5) }); TL.orte = TL.orte.slice(0, 6);
  tlOrtZeigen(o, neueStadt);
  if (!TL.mini) tlInfo();
}
function tlOrtZeigen(o, neueStadt) {
  const el = KARTE.el; if (!el) return;
  el.querySelector(".tl-durchfahrt")?.remove();
  const d = document.createElement("div");
  d.className = "tl-durchfahrt" + (neueStadt ? " stadt" : "");
  d.innerHTML = `<small>${neueStadt ? "◉ ORTSEINFAHRT" : "DURCHFAHRT"}</small><b>${esc((o.teil || o.ort).toUpperCase())}</b>${o.teil ? `<span>${esc(o.ort.toUpperCase())}</span>` : ""}`;
  el.appendChild(d);
  requestAnimationFrame(() => d.classList.add("da"));
  setTimeout(() => { d.classList.remove("da"); d.classList.add("weg"); }, neueStadt ? 6500 : 4500);
  setTimeout(() => d.remove(), neueStadt ? 7400 : 5400);
  sfx?.("tick");
}
const _tlNeuOrt = tlNeu;
tlNeu = function (p) { _tlNeuOrt(p); tlOrtPruefen(p); };
const _tlInfoOrt = tlInfo;
tlInfo = function () {
  _tlInfoOrt();
  const box = $("kh-info"); if (!box || !TL.orte.length || !TL.an) return;
  box.insertAdjacentHTML("beforeend", `<div class="tl-orte"><small>DURCHFAHREN</small>${TL.orte.map((x) => `<div><i>${esc(x.zeit)}</i><b>${esc(x.teil || x.ort)}</b>${x.teil ? `<span>${esc(x.ort)}</span>` : ""}</div>`).join("")}</div>`);
};
const _tlStopOrt = tlStop;
tlStop = function () { TL.orte = []; TL.ortLetzt = ""; TL.ortPos = null; KARTE.el?.querySelector(".tl-durchfahrt")?.remove(); return _tlStopOrt(); };

// =====================================================================
//  MAIL-WACHE: erwartete Mails sofort melden (Karte, Ansage „Soll ich sie vorlesen?“), Hinweis-Chip, Einstellungen
// =====================================================================
const MW = { frage: null, bis: 0, liste: [] };
function mwKarte(ev) {
  document.querySelector(".nachricht-karte")?.remove();
  const k = document.createElement("div"); k.className = "nachricht-karte mw-karte";
  k.innerHTML = `<div class="nk-kopf">✉︎ ${ev.alle ? "NEUE MAIL" : "DIE ERWARTETE MAIL IST DA"}</div><div class="nk-von"></div><div class="mw-betreff"></div>
    <div class="nk-knoepfe"><button type="button" data-a="lesen">VORLESEN</button><button type="button" data-a="spaeter">SPÄTER</button></div>`;
  k.querySelector(".nk-von").textContent = ev.von; k.querySelector(".mw-betreff").textContent = ev.betreff || "(ohne Betreff)";
  k.addEventListener("click", (e) => {
    const a = e.target.dataset.a; if (!a) return; e.stopPropagation();
    if (a === "lesen") mwVorlesen(ev); else { k.remove(); MW.frage = null; }
  });
  document.body.appendChild(k);
  setTimeout(() => k.remove(), 10 * 60 * 1000);
}
function mwVorlesen(ev) {
  MW.frage = null; document.querySelector(".mw-karte")?.remove();
  _sendTextMW(`Lies mir die Mail von ${ev.von} mit dem Betreff „${ev.betreff}“ vor (uid ${ev.uid}).`);
}
async function mwChip() {
  try { const d = await fdGet("/mailwache"); MW.liste = d.wachen; } catch (e) { return; }
  let c = $("mw-chip");
  const gezielt = MW.liste.filter((w) => w.worauf !== "jede neue Mail");
  if (!MW.liste.length) { c?.remove(); return; }
  if (!c) { c = document.createElement("button"); c.type = "button"; c.id = "mw-chip"; c.title = "Mail-Wache – Einstellungen öffnen";
    c.addEventListener("click", () => window.einstReiter?.("daten")); document.body.appendChild(c); }
  c.innerHTML = `<i></i>✉ ${gezielt.length ? `WARTE AUF: ${esc(gezielt[0].worauf.replace(/^von /, "").replace(/[„“]/g, ""))}${gezielt.length > 1 ? ` +${gezielt.length - 1}` : ""}` : "POSTEINGANG WIRD ÜBERWACHT"}`;
}
const _handleMW = handle;
handle = function (ev) {
  if (ev.type === "mailwache") {
    if (ev.ereignis === "treffer") {
      mwKarte(ev); sfx("ask");
      MW.frage = ev; MW.bis = Date.now() + 90 * 1000;
      if (V.out !== "aus") { unlockAudio(); V.turnLang = "";
        ttsSay(ev.alle ? `Neue Mail von ${ev.von}: ${ev.betreff}.` : `Sir, die erwartete Mail ist da – von ${ev.von}: ${ev.betreff}. Soll ich sie vorlesen?`); }
    }
    mwChip(); if (!$("einst").hidden) mwEinstAufbauen();
    return;
  }
  _handleMW(ev);
};
const _sendTextMW = sendText;
sendText = function (text, viaVoice = false) {
  if (MW.frage && Date.now() < MW.bis) {
    const t = (text || "").trim().toLowerCase();
    if (/^(ja|jawohl|gerne|bitte|klar|ok|okay|lies( sie)?( vor)?|vorlesen|ja bitte)\b/.test(t) && t.length < 30) return mwVorlesen(MW.frage);
    if (/^(nein|später|nicht jetzt|danke nein|lass)\b/.test(t) && t.length < 30) { MW.frage = null; document.querySelector(".mw-karte")?.remove(); V.turnLang = ""; ttsSay("In Ordnung."); return; }
  }
  return _sendTextMW(text, viaVoice);
};
setTimeout(mwChip, 4000); setInterval(mwChip, 5 * 60 * 1000);

async function mwEinstAufbauen() {
  const box = $("einst-vb"); if (!box) return;
  let d; try { d = await fdGet("/mailwache"); } catch (e) { return; }
  const iv = d.intervall_s || 120;
  const liste = d.wachen.map((w) => `<div class="einst-zeile"><span>${esc(w.worauf)}<small class="im-einst-sub">seit ${esc(w.seit.replace("T", " "))}${w.dauerhaft ? " · dauerhaft" : " · bis zum ersten Treffer"}${w.dringend ? " · dringend" : ""}${w.bis ? " · bis " + esc(w.bis.split("-").reverse().join(".")) : ""}</small></span>
      <button type="button" data-mw="beenden" data-id="${esc(w.id)}">BEENDEN</button></div>`).join("");
  const inhalt = `<p class="vb-hilfe">JARVIS darf deinen Posteingang dauerhaft im Hintergrund prüfen (nur Absender und Betreff neuer Mails) und meldet sich
      sofort, wenn eine erwartete Mail eintrifft – mit Ansage, Mitteilung und Telegram. Am einfachsten per Sprache: „Sag mir Bescheid, wenn die Mail von … kommt.“</p>
    ${liste || `<p class="vb-hilfe">Gerade keine Wache aktiv.</p>`}
    <div class="vb-feld"><label>Absender (Name oder Adresse, Teil genügt)</label><input data-mwf="absender"></div>
    <div class="vb-feld"><label>Stichwort im Betreff (optional)</label><input data-mwf="stichwort"></div>
    <div class="vb-reihe"><label class="gr-check"><input type="checkbox" data-mwf="dauerhaft"> dauerhaft (nicht nach dem ersten Treffer beenden)</label></div>
    <div class="vb-reihe"><label class="gr-check"><input type="checkbox" data-mwf="dringend"> dringend (kommt auch in Ruhezeiten und im Fokus durch)</label></div>
    <div class="vb-reihe"><button type="button" class="primary" data-mw="setzen">WACHE STARTEN</button>
      <button type="button" data-mw="alle">JEDE NEUE MAIL MELDEN</button>${d.wachen.length ? `<button type="button" data-mw="alle-aus">ALLE BEENDEN</button>` : ""}</div>
    <div class="vb-feld"><label>Prüfen alle</label><select data-mwf="intervall">${[[60, "1 Minute"], [120, "2 Minuten"], [300, "5 Minuten"], [900, "15 Minuten"]].map(([s, t]) => `<option value="${s}" ${s === iv ? "selected" : ""}>${t}</option>`).join("")}</select></div>`;
  const zeile = box.querySelector('details[data-id="mail-wache"]');
  const html = vbZeile("mail-wache", "Mail-Wache (Posteingang überwachen)", d.wachen.length ? { ok: true, text: `✓ ${d.wachen.length} aktiv` } : { text: "– keine aktiv" }, inhalt, zeile?.open);
  if (zeile) zeile.outerHTML = html; else box.insertAdjacentHTML("beforeend", html);
  if (typeof einstFiltern === "function") einstFiltern();
}
EINST_ZEILEN["mail-wache"] = "daten";
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-mw]"); if (!b) return;
  const z = b.closest(".vb-zeile"), st = z?.querySelector(".vb-status"), w = (k) => z.querySelector(`[data-mwf="${k}"]`);
  const a = b.dataset.mw;
  try {
    let r;
    if (a === "setzen") r = await vbPost("/mailwache/setzen", { absender: w("absender").value, stichwort: w("stichwort").value, dauerhaft: w("dauerhaft").checked, dringend: w("dringend").checked });
    if (a === "alle") r = await vbPost("/mailwache/setzen", { alle: true, dauerhaft: true });
    if (a === "beenden") r = await vbPost("/mailwache/beenden", { id: b.dataset.id });
    if (a === "alle-aus") r = await vbPost("/mailwache/beenden", { alle: true });
    if (st) { st.textContent = r?.hinweis || "✓"; st.className = "vb-status ok"; }
    mwChip(); setTimeout(mwEinstAufbauen, 400);
  } catch (err) { if (st) { st.textContent = err.message; st.className = "vb-status fehler"; } }
});
document.addEventListener("change", async (e) => {
  if (!e.target.matches('[data-mwf="intervall"]')) return;
  try { await vbPost("/mailwache/intervall", { sekunden: +e.target.value }); } catch (err) {}
});
const _vbAufbauenMW = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenMW(...a); mwEinstAufbauen(); };

// =====================================================================
//  BUTLER STUFE 1: Sicherheit (eingeschleuste Anweisungen), Rechenschaft + Rückgängig,
//  Aufmerksamkeit (Ruhe/Fokus, leise Zustellung, Entscheidungsstapel), Einstellungen → AUTOPILOT
// =====================================================================
const BT = { modus: { modus: "normal" }, leise: 0, fenster: null };
const BT_MODUS = { normal: "", ruhe: "RUHE", fokus: "FOKUS" };
function btChip() {
  let c = $("bt-chip");
  const m = BT.modus.modus || "normal";
  if (m === "normal" && !BT.leise) { c?.remove(); return; }
  if (!c) { c = document.createElement("button"); c.type = "button"; c.id = "bt-chip";
    c.addEventListener("click", () => btStapelLaden()); document.body.appendChild(c); }
  c.className = "bt-" + m;
  c.title = (BT.modus.grund ? BT.modus.grund + " – " : "") + "Zurückgelegtes und offene Entscheidungen anzeigen";
  c.innerHTML = `<i></i>${m === "normal" ? "ZURÜCKGELEGT" : BT_MODUS[m]}${BT.modus.bis && m !== "normal" ? ` BIS ${esc(BT.modus.bis)}` : ""}${BT.leise ? ` · ${BT.leise}` : ""}`;
}
async function btModusLaden() {
  try { const d = await fdGet("/autopilot"); BT.modus = d.modus; BT.leise = d.stapel; btChip(); } catch (e) {}
}
function btFenster(titel, html, klasse = "") {
  btZu();
  const el = document.createElement("div"); el.className = "im-form bt " + klasse;
  el.innerHTML = `<div class="im-form-box bt-box"><header><b>${titel}</b><span class="bt-kopf-rechts"></span><button type="button" class="vt-zu" data-bt="zu">✕</button></header>
    <div class="bt-inhalt">${html}</div><footer><span class="im-form-status bt-status"></span></footer></div>`;
  el.addEventListener("click", (e) => { if (e.target === el) btZu(); });
  document.body.appendChild(el); BT.fenster = el; requestAnimationFrame(() => el.classList.add("an"));
  return el;
}
function btZu() { const el = BT.fenster; BT.fenster = null; if (el) { el.classList.remove("an"); setTimeout(() => el.remove(), 300); } }
const btZeit = (ts) => { const d = new Date(ts); return isNaN(d) ? "" : d.toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }); };

// ---------- Rechenschaft ----------
async function btRechenschaft(tage = 1) {
  let d; try { d = await fdGet(`/rechenschaft?tage=${tage}`); } catch (e) { toast("Rechenschaft nicht verfügbar"); return; }
  const kanal = (k) => k ? `<em class="bt-kanal">${esc(k.replace(/^stab:/, "Stab · "))}</em>` : "";
  const zeilen = d.aktionen.map((a) => `<li class="${a.warum.startsWith("per Befugnis") ? "selbst" : ""}"><time>${btZeit(a.zeit)}</time>
      <div><b>${esc(a.was)}</b><small>${esc(a.warum)} ${kanal(a.kanal)}${a.fremd?.length ? ` <em class="bt-fremd" title="nach fremdem Inhalt">⚠ nach ${esc(a.fremd.join(", "))}</em>` : ""}</small></div>
      ${a.rueckgaengig ? `<button type="button" data-bt="undo" data-id="${esc(a.rueckgaengig)}" title="${esc(a.rueckgaengig_text)}">↺ RÜCKGÄNGIG</button>` : ""}</li>`).join("");
  const abgelehnt = d.abgelehnt.map((a) => `<li><time>${btZeit(a.zeit)}</time><div><b>${esc(a.was)}</b><small>${esc(a.grund)}${a.fremd ? " · nach fremdem Inhalt" : ""}</small></div></li>`).join("");
  const sich = d.sicherheit.map((v) => `<li class="warn"><time>${btZeit(v.zeit)}</time><div><b>Zurückgehalten aus ${esc(v.quelle)}</b><small>„${esc(v.zitat)}“</small></div></li>`).join("");
  const el = btFenster("RECHENSCHAFT", `<p class="bt-summe">${esc(d.zusammenfassung)}</p>
    <section><h5>AKTIONEN</h5><ul class="bt-liste">${zeilen || "<li class='leer'>Keine Aktionen im Zeitraum.</li>"}</ul></section>
    ${abgelehnt ? `<section><h5>ABGELEHNT / GESPERRT</h5><ul class="bt-liste">${abgelehnt}</ul></section>` : ""}
    ${sich ? `<section><h5>SICHERHEIT · ERKANNTE EINSCHLEUSUNGSVERSUCHE</h5><ul class="bt-liste">${sich}</ul></section>` : ""}`, "bt-rs");
  el.querySelector(".bt-kopf-rechts").innerHTML = [1, 7].map((t) => `<button type="button" data-bt="tage" data-t="${t}" class="${t === d.zeitraum_tage ? "an" : ""}">${t === 1 ? "HEUTE" : "7 TAGE"}</button>`).join("");
}

// ---------- Entscheidungsstapel ----------
function btStapel(ev) {
  const z = (ev.zurueckgelegt || []).map((e) => `<li><time>${btZeit(e.zeit)}</time><div><b>${esc(e.text)}</b><small>${esc({ nachricht: "iMessage", mailwache: "Mail-Wache", hinweis: "Hinweis" }[e.art] || e.art)}</small></div>
      ${e.art === "nachricht" && e.daten?.id ? `<button type="button" data-bt="vorlesen" data-id="${esc(e.daten.id)}">VORLESEN</button>` : ""}</li>`).join("");
  const ent = (ev.entscheidungen || []).map((e) => `<li class="ent"><time>☐</time><div><b>${esc(e.text)}</b></div>
      ${e.fenster ? `<button type="button" data-bt="oeffnen" data-f="${esc(e.fenster)}">ÖFFNEN</button>` : ""}</li>`).join("");
  btFenster("ENTSCHEIDUNGSSTAPEL", `<p class="bt-summe">${esc(ev.grund ? "Gebündelt · " + ev.grund : "Gebündelt")}${ev.modus && ev.modus !== "normal" ? ` · gerade ${esc(BT_MODUS[ev.modus])}${ev.grund ? "" : ""}` : ""}</p>
    ${ent ? `<section><h5>WARTET AUF DICH</h5><ul class="bt-liste">${ent}</ul></section>` : ""}
    <section><h5>ZURÜCKGELEGT WÄHREND RUHE/FOKUS</h5><ul class="bt-liste">${z || "<li class='leer'>Nichts zurückgelegt.</li>"}</ul></section>`, "bt-st");
  BT.leise = 0; btChip();
}
async function btStapelLaden() {
  try { const d = await vbPost("/autopilot/stapel", { leeren: true }); btStapel(d.leer ? { zurueckgelegt: [], entscheidungen: [], grund: "auf Wunsch" } : { ...d, grund: "auf Wunsch" }); }
  catch (e) { toast(e.message); }
}

// ---------- Sicherheitsmeldung ----------
function btSicherheit(ev) {
  document.querySelector(".bt-sicher")?.remove();
  const k = document.createElement("div"); k.className = "nachricht-karte bt-sicher";
  k.innerHTML = `<div class="nk-kopf">⚠ EINGESCHLEUSTE ANWEISUNG ZURÜCKGEHALTEN</div><div class="nk-von"></div><div class="mw-betreff bt-zitat"></div>
    <div class="nk-knoepfe"><button type="button" data-a="rs">RECHENSCHAFT</button><button type="button" data-a="ok">VERSTANDEN</button></div>`;
  k.querySelector(".nk-von").textContent = `Quelle: ${ev.quelle} · ${ev.art}${ev.anzahl > 1 ? ` (+${ev.anzahl - 1})` : ""}`;
  k.querySelector(".bt-zitat").textContent = `„${ev.zitat}“`;
  k.addEventListener("click", (e) => { const a = e.target.dataset.a; if (!a) return; e.stopPropagation(); k.remove(); if (a === "rs") btRechenschaft(1); });
  document.body.appendChild(k); sfx("ask");
  setTimeout(() => k.remove(), 5 * 60 * 1000);
}

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-bt]"); if (!b) return;
  const a = b.dataset.bt, st = BT.fenster?.querySelector(".bt-status");
  if (a === "zu") return btZu();
  if (a === "tage") return btRechenschaft(+b.dataset.t);
  if (a === "oeffnen") { btZu(); return sendText(b.dataset.f === "hestia" ? "Zeig mir die Nebenkosten" : "Welche Post wartet auf Ablage?"); }
  if (a === "vorlesen") { btZu(); return nachrichtVorlesen(b.dataset.id); }
  if (a === "undo") {
    if (!(await frage({ text: `${b.title}?` }))) return;
    b.disabled = true;
    try { const r = await vbPost(`/rueckgaengig/${encodeURIComponent(b.dataset.id)}`); if (st) { st.textContent = "✓ " + r.rueckgaengig; st.className = "im-form-status bt-status ok"; }
      b.textContent = "✓ ZURÜCK"; }
    catch (err) { b.disabled = false; if (st) { st.textContent = "⚠ " + err.message; st.className = "im-form-status bt-status fehler"; } }
  }
});

const _handleBT = handle;
handle = function (ev) {
  if (ev.type === "sicherheit") { btSicherheit(ev); return; }
  if (ev.type === "rechenschaft") { btRechenschaft(ev.tage || 1); return; }
  if (ev.type === "stapel") { btStapel(ev); return; }
  if (ev.type === "modus") { BT.modus = ev; btChip(); return; }
  if (ev.type === "leise") { BT.modus = { modus: ev.modus, grund: ev.grund, bis: ev.bis }; BT.leise = ev.anzahl || BT.leise + 1; btChip(); return; }
  if (ev.type === "nachricht" && ev.leise) return;            // Ruhe/Fokus: liegt im Stapel, keine Karte, keine Ansage
  if (ev.type === "info" && ev.rueckgaengig) {
    _handleBT(ev);
    const t = $("toast"); if (t && !t.hidden) { t.insertAdjacentHTML("beforeend", ` <button type="button" class="bt-toast-undo" data-bt="undo" data-id="${esc(ev.rueckgaengig)}" title="Rückgängig machen">↺</button>`);
      clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 8000); }
    return;
  }
  _handleBT(ev);
};
setTimeout(btModusLaden, 3000); setInterval(btModusLaden, 5 * 60 * 1000);

// ---------- Einstellungen → AUTOPILOT ----------
async function btEinstAufbauen() {
  const box = $("einst-autopilot"); if (!box) return;
  let d; try { d = await fdGet("/autopilot"); } catch (e) { box.textContent = "Nicht verfügbar"; return; }
  const offen = [...box.querySelectorAll("details[open]")].map((x) => x.dataset.id);
  const bef = d.befugnisse.befugnisse.map((r) => `<div class="einst-zeile bt-bef ${r.aktiv && !r.abgelaufen ? "" : "aus"}"><span><b>${esc(r.titel)}</b>
      <small class="im-einst-sub">${esc(d.befugnisse.bereiche[r.bereich] || r.bereich)}${r.bedingung?.kalender_ausschluss?.length ? ` · nicht in: ${esc(r.bedingung.kalender_ausschluss.join(", "))}` : ""}${r.max_pro_woche ? ` · max. ${r.max_pro_woche}/Woche` : ""}${r.gueltig_bis ? ` · bis ${esc(r.gueltig_bis.split("-").reverse().join("."))}` : ""} · ${r.nutzungen_7_tage}× in 7 Tagen${r.abgelaufen ? " · abgelaufen" : ""}</small></span>
      ${r.aktiv ? `<button type="button" data-ap="entziehen" data-id="${esc(r.id)}">ENTZIEHEN</button>` : `<button type="button" data-ap="aktivieren" data-id="${esc(r.id)}">WIEDER ERTEILEN</button>`}</div>`).join("");
  const bereiche = Object.entries(d.befugnisse.bereiche).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("");
  const a = d.aufmerksamkeit;
  const m = d.modus;
  const html = [
    vbZeile("ap-befugnisse", "Befugnisse – was JARVIS ohne Rückfrage darf", { ok: true, text: `${d.befugnisse.befugnisse.filter((r) => r.aktiv).length} aktiv` },
      `<p class="vb-hilfe">Innerhalb einer Befugnis handelt JARVIS selbst und meldet es danach (mit Rückgängig). Alles außerhalb – Dienstliches, Familie, Geld, Senden – bleibt bei deiner Bestätigung.
       Per Sprache: „Was darfst du ohne mich?“, „Lass das mit den Terminen“, „Notbremse“. Nach dem Lesen fremder Inhalte (Mails, Dokumente) gilt keine Befugnis.</p>
       ${bef || "<p class='vb-hilfe'>Keine Befugnisse.</p>"}
       <div class="vb-reihe"><select data-apf="bereich">${bereiche}</select><input data-apf="max" type="number" min="0" placeholder="max./Woche" style="width:110px"><input data-apf="bis" type="date">
         <button type="button" class="primary" data-ap="erteilen">ERTEILEN</button></div>
       <div class="vb-reihe"><button type="button" class="gefahr" data-ap="notbremse">NOTBREMSE – ALLE ENTZIEHEN</button></div>`, offen.includes("ap-befugnisse")),
    vbZeile("ap-ruhe", "Ruhe, Fokus & Entscheidungsstapel", m.modus === "normal" ? { ok: true, text: "gerade normal" } : { warn: true, text: `${BT_MODUS[m.modus]} · ${m.grund}` },
      `<p class="vb-hilfe">In Ruhe- und Fokuszeiten legt JARVIS Nicht-Dringendes still zurück (kein Telegram, keine Ansage) und bündelt es im Entscheidungsstapel.
       Durch kommen nur Notfälle und als dringend markierte Mail-Wachen.</p>
       <div class="bt-reihe"><label><input type="checkbox" data-apf="aktiv" ${a.aktiv ? "checked" : ""}> Router aktiv</label>
         <label><input type="checkbox" data-apf="sonntag" ${a.sonntag ? "checked" : ""}> Sonntag ganz Ruhe</label></div>
       <div class="bt-reihe"><span>Nachtruhe</span><input type="time" data-apf="ruhe_von" value="${esc(a.ruhe_von)}"><span>bis</span><input type="time" data-apf="ruhe_bis" value="${esc(a.ruhe_bis)}">
         <span>Samstag ab</span><input type="time" data-apf="samstag_ab" value="${esc(a.samstag_ab)}"></div>
       <div class="vb-feld"><label>Ruhe bei Kalenderterminen mit (Komma-getrennt)</label><input data-apf="ruhe_titel" value="${esc((a.ruhe_titel || []).join(", "))}"></div>
       <div class="vb-feld"><label>Fokus bei Kalenderterminen mit</label><input data-apf="fokus_titel" value="${esc((a.fokus_titel || []).join(", "))}"></div>
       <div class="vb-feld"><label>Entscheidungsstapel um</label><input data-apf="stapel_zeiten" value="${esc((a.stapel_zeiten || []).join(", "))}"></div>
       <div class="vb-reihe"><button type="button" class="primary" data-ap="speichern">SPEICHERN</button>
         ${m.modus === "fokus" ? `<button type="button" data-ap="fokus-aus">FOKUS BEENDEN</button>` : `<button type="button" data-ap="fokus">FOKUS 2 STUNDEN</button>`}
         <button type="button" data-ap="stapel">STAPEL JETZT ZEIGEN</button></div>`, offen.includes("ap-ruhe")),
    vbZeile("ap-sicherheit", "Sicherheit – eingeschleuste Anweisungen", d.vorfaelle.length ? { warn: true, text: `${d.vorfaelle.length} Vorfälle` } : { ok: true, text: "✓ keine Vorfälle" },
      `<p class="vb-hilfe">Anweisungen nimmt JARVIS nur von dir an. Inhalte aus Mails, Dokumenten, Web, Terminen und Stabsmeldungen sind Daten: Sie werden geprüft,
       verdächtige Sätze zurückgehalten und als „fremder Inhalt“ eingerahmt. Danach braucht jede Aktion deine Bestätigung. Vor jedem „jarvis speichern“ laufen die Sicherheitstests.</p>
       <ul class="bt-liste">${d.vorfaelle.slice(0, 12).map((v) => `<li class="warn"><time>${btZeit(v.zeit)}</time><div><b>${esc(v.quelle)}</b><small>${(v.treffer || []).map((t) => `${esc(t.art)}: „${esc(t.zitat)}“`).join("<br>")}</small></div></li>`).join("") || "<li class='leer'>Noch nichts zurückgehalten.</li>"}</ul>
       <div class="vb-reihe"><button type="button" data-ap="rechenschaft">RECHENSCHAFT ÖFFNEN</button></div>`, offen.includes("ap-sicherheit")),
  ].join("");
  box.innerHTML = html; if (typeof einstFiltern === "function") einstFiltern();
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ap]"); if (!b) return;
  const z = b.closest(".vb-zeile"), st = z?.querySelector(".vb-status"), f = (k) => z?.querySelector(`[data-apf="${k}"]`);
  const liste = (k) => f(k).value.split(",").map((x) => x.trim()).filter(Boolean);
  try {
    let r; const a = b.dataset.ap;
    if (a === "entziehen") r = await vbPost("/autopilot/entziehen", { id: b.dataset.id });
    if (a === "aktivieren") r = await vbPost("/autopilot/aktivieren", { id: b.dataset.id });
    if (a === "notbremse") { if (!(await frage({ titel: "NOTBREMSE", text: "Alle Befugnisse sofort entziehen?", ok: "ENTZIEHEN", gefahr: true }))) return; r = await vbPost("/autopilot/entziehen", { alle: true }); }
    if (a === "erteilen") r = await vbPost("/autopilot/erteilen", { bereich: f("bereich").value, max_pro_woche: +f("max").value || null, gueltig_bis: f("bis").value });
    if (a === "speichern") r = await vbPost("/autopilot/einstellen", { aktiv: f("aktiv").checked, ruhe_von: f("ruhe_von").value, ruhe_bis: f("ruhe_bis").value,
      samstag_ab: f("samstag_ab").value, sonntag: f("sonntag").checked, ruhe_titel: liste("ruhe_titel"), fokus_titel: liste("fokus_titel"), stapel_zeiten: liste("stapel_zeiten") });
    if (a === "fokus") r = await vbPost("/autopilot/fokus", { minuten: 120 });
    if (a === "fokus-aus") r = await vbPost("/autopilot/fokus_ende");
    if (a === "stapel") { (typeof einstZu === "function" && einstZu()); return btStapelLaden(); }
    if (a === "rechenschaft") return btRechenschaft(7);
    if (st) { st.textContent = "✓ gespeichert"; st.className = "vb-status ok"; }
    btModusLaden(); setTimeout(btEinstAufbauen, 300);
  } catch (err) { if (st) { st.textContent = err.message; st.className = "vb-status fehler"; } }
});
const _vbAufbauenBT = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenBT(...a); btEinstAufbauen(); };

// =====================================================================
//  ZIELE (Autopilot-Reiter), ZUHAUSE (HomeKit-Kurzbefehle, NUKI) und NOTFALLBEGLEITUNG
// =====================================================================
const ORT_TXT = { dienst: "Dienststelle", mobil: "Mobil", frei: "Frei" };
async function zieleEinstAufbauen() {
  const box = $("einst-autopilot"); if (!box) return;
  let d; try { d = await fdGet("/ziele"); } catch (e) { return; }
  const e = d.einstellungen, alt = box.querySelector('details[data-id="ap-ziele"]');
  const woche = d.woche.map((t) => `<div class="zi-tag zi-${t.arbeitsort}"><b>${esc(t.tag)}</b><span>${esc(ORT_TXT[t.arbeitsort] || t.arbeitsort)}</span>
      <small>${t.arbeit ? esc(t.arbeit) + "<br>Sport " + esc(t.sport.split(" ")[0]) : (t.familie ? "Familie" : "")}</small><i title="${esc(t.quelle)}"></i></div>`).join("");
  const inhalt = `<p class="vb-hilfe">Deine Ziele: Wochenenden für die Familie, feste Arbeitszeiten, tägliche Sportzeit. JARVIS legt Sportblöcke im Privatkalender an
      (per Befugnis, mit Meldung), passt sie morgens an deinen Arbeitsort an und fragt nach, wenn ein Termin gegen ein Ziel läuft.
      Arbeitsort: Kalendereintrag („Mobiles Arbeiten“ / „Dienststelle“) vor Standort vor üblichem Wochenmuster.</p>
    <div class="zi-woche">${woche}</div>
    <div class="bt-reihe"><label><input type="checkbox" data-zif="aktiv" ${e.aktiv ? "checked" : ""}> Zielregister aktiv</label>
      <label><input type="checkbox" data-zif="wochenende_frei" ${e.wochenende_frei ? "checked" : ""}> Wochenende frei</label>
      <label><input type="checkbox" data-zif="sport_bloecke" ${e.sport_bloecke ? "checked" : ""}> Sportblöcke anlegen</label></div>
    <div class="bt-reihe"><span>Dienststelle</span><input type="time" data-zif="d_beginn" value="${esc(e.arbeit.dienst.beginn)}"><span>–</span><input type="time" data-zif="d_ende" value="${esc(e.arbeit.dienst.ende)}">
      <span>Sport ab</span><input type="time" data-zif="ds_beginn" value="${esc(e.sport.dienst.beginn)}"><input type="number" min="5" max="120" data-zif="ds_min" value="${e.sport.dienst.minuten}" style="width:64px"><span>min</span></div>
    <div class="bt-reihe"><span>Mobil</span><input type="time" data-zif="m_beginn" value="${esc(e.arbeit.mobil.beginn)}"><span>–</span><input type="time" data-zif="m_ende" value="${esc(e.arbeit.mobil.ende)}">
      <span>Sport ab</span><input type="time" data-zif="ms_beginn" value="${esc(e.sport.mobil.beginn)}"><input type="number" min="5" max="120" data-zif="ms_min" value="${e.sport.mobil.minuten}" style="width:64px"><span>min</span></div>
    <p class="vb-hilfe">Dienststelle als Ort: ${esc(d.dienststelle)}. Am besten einmal vor Ort „Ich bin in der Dienststelle“ sagen oder hier tippen.</p>
    <div class="vb-reihe"><button type="button" class="primary" data-zi="speichern">SPEICHERN</button><button type="button" data-zi="dienststelle">HIER IST DIE DIENSTSTELLE</button>
      <button type="button" data-zi="mobil">HEUTE MOBIL</button><button type="button" data-zi="dienst">HEUTE DIENSTSTELLE</button></div>`;
  const h = d.heute;
  const html = vbZeile("ap-ziele", "Ziele & Arbeitszeit", { ok: true, text: h.arbeit ? `heute ${ORT_TXT[h.arbeitsort]} ${h.arbeit}` : "heute frei" }, inhalt, alt?.open);
  if (alt) alt.outerHTML = html; else box.insertAdjacentHTML("afterbegin", html);
}
document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-zi]"); if (!b) return;
  const z = b.closest(".vb-zeile"), st = z?.querySelector(".vb-status"), f = (k) => z.querySelector(`[data-zif="${k}"]`);
  try {
    const a = b.dataset.zi;
    if (a === "speichern") await vbPost("/ziele/einstellen", { aktiv: f("aktiv").checked, wochenende_frei: f("wochenende_frei").checked, sport_bloecke: f("sport_bloecke").checked,
      arbeit: { dienst: { beginn: f("d_beginn").value, ende: f("d_ende").value }, mobil: { beginn: f("m_beginn").value, ende: f("m_ende").value } },
      sport: { dienst: { beginn: f("ds_beginn").value, minuten: +f("ds_min").value || 45 }, mobil: { beginn: f("ms_beginn").value, minuten: +f("ms_min").value || 15 } } });
    if (a === "dienststelle") await vbPost("/ziele/dienststelle");
    if (a === "mobil" || a === "dienst") await vbPost("/ziele/arbeitsort", { ort: a });
    if (st) { st.textContent = "✓ gespeichert"; st.className = "vb-status ok"; }
    setTimeout(zieleEinstAufbauen, 300);
  } catch (err) { if (st) { st.textContent = err.message; st.className = "vb-status fehler"; } }
});
const _btEinstZiele = btEinstAufbauen;
btEinstAufbauen = async function (...a) { await _btEinstZiele(...a); await zieleEinstAufbauen(); };

// ---------- Zuhause ----------
async function zuhauseEinstAufbauen() {
  const box = $("einst-zuhause"); if (!box) return;
  let d; try { d = await fdGet("/zuhause"); } catch (e) { box.innerHTML = "<p class='vb-hilfe'>Nicht verfügbar.</p>"; return; }
  const kb = d.kurzbefehle.map((k) => `<button type="button" class="zh-kb" data-zh="kb" data-a="${esc(k)}">${esc(k)}</button>`).join("");
  const locks = (d.schloesser || []).map((l) => `<div class="einst-zeile"><span><b>${l.abgeschlossen ? "🔒" : "🔓"} ${esc(l.name)}</b>
      <small class="im-einst-sub">${esc(l.schloss)} · Tür ${esc(l.tuer)}${l.batterie != null ? ` · Batterie ${l.batterie} %` : ""}${l.batterie_kritisch ? " · ⚠ Batterie kritisch" : ""}</small></span>
      ${l.abgeschlossen ? "" : `<button type="button" data-zh="ab" data-a="${esc(l.name)}">ABSCHLIESSEN</button>`}</div>`).join("");
  box.innerHTML = `
    <p class="vb-hilfe"><b>HomeKit (Lichter, Lautsprecher, Szenen):</b> In der App „Kurzbefehle“ je Aktion einen Kurzbefehl mit „Steuere Zuhause“ anlegen,
      dessen Name mit <b>JARVIS</b> beginnt – z. B. „JARVIS Licht Wohnzimmer an“, „JARVIS Szene Abend“, „JARVIS Lautsprecher Küche leiser“.
      Dann reicht „Licht im Wohnzimmer an“. Kurzbefehle zu Türen, Schlössern, Garage oder Alarm führt JARVIS nie aus.</p>
    <div class="zh-kbs">${kb || "<span class='vb-hilfe'>Noch keine JARVIS-Kurzbefehle gefunden.</span>"}</div>
    ${d.gesperrte_kurzbefehle?.length ? `<p class="vb-hilfe">Gesperrt (Sicherheit): ${d.gesperrte_kurzbefehle.map(esc).join(", ")}</p>` : ""}
    <p class="vb-hilfe"><b>NUKI:</b> JARVIS liest den Status und darf abschließen – aufschließen und öffnen kann er nicht. Um 21:45 meldet er eine offene Tür.
      ${d.nuki ? "" : "Token oben unter „NUKI Smart Lock“ eintragen."}${d.nuki_fehler ? " ⚠ " + esc(d.nuki_fehler) : ""}</p>
    ${locks}<div class="vb-status"></div>`;
}
document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-zh]"); if (!b) return;
  const st = $("einst-zuhause")?.querySelector(".vb-status");
  try {
    const r = await vbPost(b.dataset.zh === "kb" ? "/zuhause/steuern" : "/zuhause/abschliessen", { aktion: b.dataset.a, schloss: b.dataset.a });
    if (st) { st.textContent = "✓ " + (r.ausgefuehrt || `${r.schloss}: ${r.status}`); st.className = "vb-status ok"; }
    if (b.dataset.zh === "ab") setTimeout(zuhauseEinstAufbauen, 4000);
  } catch (err) { if (st) { st.textContent = err.message; st.className = "vb-status fehler"; } }
});

// ---------- Notfallbegleitung ----------
const NF = { aktiv: false, probe: false, bis: "", d: null };
function nfSelbsttestHTML(t) {
  return `<ul class="nf-test">${(t || []).map((x) => `<li class="${x.ok ? "ok" : "warn"}"><b>${x.ok ? "✓" : "⚠"}</b><span>${esc(x.punkt)}${x.hinweis ? `<small>${esc(x.hinweis)}</small>` : ""}</span></li>`).join("")}</ul>`;
}
async function notfallEinstAufbauen() {
  const box = $("einst-notfall"); if (!box) return;
  let d; try { d = await fdGet("/notfall"); } catch (e) { return; }
  NF.aktiv = d.aktiv; NF.probe = !!d.probe; NF.bis = d.probe_bis || ""; notfallBanner();
  if (d.aktiv && d.probe) {
    box.innerHTML = `<p class="vb-hilfe">🧪 Eine <b>Probe</b> läuft bis ${esc(d.probe_bis)} Uhr. JARVIS verhält sich wie im Ernstfall, führt aber nichts aus.</p>
      <div class="vb-reihe"><button type="button" class="primary" data-nf="oeffnen">BEGLEITUNG ÖFFNEN</button><button type="button" data-nf="probe-ende">PROBE BEENDEN</button></div><div class="nf-bericht"></div><div class="vb-status"></div>`;
    return;
  }
  if (d.aktiv) {
    box.innerHTML = `<p class="vb-hilfe">Die Notfallbegleitung ist aktiv (seit ${esc((d.seit || "").replace("T", " "))}).</p>
      <div class="vb-reihe"><button type="button" class="primary" data-nf="oeffnen">BEGLEITUNG ÖFFNEN</button><button type="button" class="gefahr" data-nf="beenden">BEGLEITUNG BEENDEN</button></div><div class="vb-status"></div>`;
    return;
  }
  box.innerHTML = `
    <p class="vb-hilfe">Für den Fall, dass Richard etwas zustößt: JARVIS begleitet ${esc(d.name)} Schritt für Schritt – mit Richards Notfallordner als Leitlinie und als administrative
      Unterstützung (Checkliste, Fristen, Entwürfe). Der Notfallordner wird dabei nur auf dem Mac gelesen. Starten kann die Begleitung nur, wer den persönlichen Notfallcode kennt.</p>
    <details class="vb-zeile" ${d.eingerichtet ? "" : "open"}><summary><span>Notfallcode ${d.eingerichtet ? "ändern" : "einrichten"}</span><em class="${d.eingerichtet ? "ok" : "warn"}">${d.eingerichtet ? "✓ eingerichtet" : "fehlt"}</em></summary>
      <div class="vb-inhalt"><p class="vb-hilfe">Bitte ${esc(d.name)} den Code selbst eingeben lassen – mindestens 6 Zeichen, nicht aufschreiben. Gespeichert wird nur eine verschlüsselte Prüfsumme.</p>
        <div class="vb-feld"><label>Name</label><input data-nff="name" value="${esc(d.name)}"></div>
        <div class="vb-feld"><label>Notfallcode</label><input type="password" data-nff="code1" autocomplete="new-password"></div>
        <div class="vb-feld"><label>Notfallcode wiederholen</label><input type="password" data-nff="code2" autocomplete="new-password"></div>
        <div class="vb-reihe"><button type="button" class="primary" data-nf="einrichten">CODE SPEICHERN</button></div><div class="vb-status"></div></div></details>
    <details class="vb-zeile"><summary><span>Probe – den Ernstfall üben</span><em class="${d.letzte_probe ? "ok" : ""}">${d.letzte_probe ? "zuletzt " + esc(d.letzte_probe.datum.slice(0, 10).split("-").reverse().join(".")) : "noch nie"}</em></summary>
      <div class="vb-inhalt"><p class="vb-hilfe">Die Probe läuft genau wie der Ernstfall – Code-Eingabe, Banner, Begleitung mit deinem Notfallordner, lokales Modell,
        Telegram-Nachricht an dich – aber nichts wird gesendet, abgelegt oder eingetragen, und der Fortschritt wird danach verworfen.
        Während der Probe ruhen deine Befugnisse und Hinweise; sie endet automatisch nach der gewählten Zeit.</p>
        <div class="vb-reihe"><button type="button" data-nf="selbsttest">SELBSTTEST</button></div><div class="nf-selbst"></div>
        <div class="vb-feld"><label>Notfallcode (leer lassen = Probe ohne Codeprüfung)</label><input type="password" data-nff="probecode" autocomplete="off"></div>
        <div class="bt-reihe"><span>Dauer</span><select data-nff="dauer"><option value="30">30 Minuten</option><option value="60">1 Stunde</option><option value="120" selected>2 Stunden</option></select>
          <button type="button" class="primary" data-nf="probe">PROBE STARTEN</button></div><div class="nf-bericht"></div><div class="vb-status"></div></div></details>
    <details class="vb-zeile"><summary><span>Notfallordner prüfen (für Richard)</span><em></em></summary>
      <div class="vb-inhalt"><p class="vb-hilfe">Zeigt, welche Kapitel JARVIS in deinem Word-Dokument erkennt – nur Überschriften und Anzahl der Schritte, ohne Inhalte, ohne Sprachmodell.</p>
        <div class="vb-reihe"><button type="button" data-nf="pruefen">JETZT PRÜFEN</button></div><div class="nf-pruef"></div><div class="vb-status"></div></div></details>
    ${d.eingerichtet ? `<details class="vb-zeile"><summary><span>Begleitung starten</span><em></em></summary>
      <div class="vb-inhalt"><p class="vb-hilfe">${esc(d.name)}, hier mit deinem Notfallcode starten. Richard bekommt eine Nachricht; bei einem Irrtum lässt sich die Begleitung jederzeit beenden.</p>
        <div class="vb-feld"><label>Notfallcode</label><input type="password" data-nff="code" autocomplete="off"></div>
        <div class="vb-reihe"><button type="button" class="primary" data-nf="aktivieren">BEGLEITUNG STARTEN</button></div><div class="vb-status"></div></div></details>` : ""}`;
}
function notfallBanner() {
  let b = $("nf-banner");
  if (!NF.aktiv) { b?.remove(); return; }
  if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "nf-banner"; b.addEventListener("click", notfallOeffnen); document.body.appendChild(b); }
  b.classList.toggle("probe", NF.probe);
  b.innerHTML = NF.probe ? `<i></i>NOTFALL-PROBE${NF.bis ? " · BIS " + esc(NF.bis) : ""}` : "<i></i>NOTFALLBEGLEITUNG";
}
async function notfallOeffnen() {
  let d; try { d = await fdGet("/notfall"); } catch (e) { return toast(e.message); }
  if (!d.aktiv) { NF.aktiv = false; notfallBanner(); return; }
  NF.d = d; const u = d.begleitung || { kapitel: [] };
  const STATUS = { offen: "○", erledigt: "✓", spaeter: "◔", nicht_noetig: "–" };
  const kap = u.kapitel.map((k) => `<section class="nf-kap"><h5>${esc(k.titel)} <em>${k.erledigt}/${k.gesamt}</em></h5><ul class="nf-schritte">${k.schritte.map((s) =>
      `<li class="nf-${s.art} nf-st-${s.status}">${s.art === "text" ? "" : `<button type="button" data-nf="schritt" data-id="${esc(s.id)}" data-s="${s.status === "erledigt" ? "offen" : "erledigt"}" title="abhaken">${STATUS[s.status] || "○"}</button>`}
        <div><span>${esc(s.text)}</span>${s.notiz ? `<small>${esc(s.notiz)}</small>` : ""}</div>
        ${s.art === "text" ? "" : `<button type="button" class="nf-frag" data-nf="frag" data-t="${esc(s.text.slice(0, 160))}" title="JARVIS dazu fragen">?</button>`}</li>`).join("")}</ul></section>`).join("");
  const fristen = (d.fristen || []).map((f, i) => `<label><input type="checkbox" data-nff="frist" value="${i}" checked> ${esc(f.datum.split("-").reverse().join("."))} – ${esc(f.titel)}<small>${esc(f.hinweis)}</small></label>`).join("");
  const el = btFenster(u.probe ? "BEGLEITUNG · PROBE" : "BEGLEITUNG", `
    ${u.probe ? `<div class="nf-probe-band">🧪 PROBE bis ${esc(u.probe_bis)} Uhr – so sieht ${esc(u.name)} es im Ernstfall. Es wird nichts ausgeführt; Häkchen werden danach verworfen.</div>` : ""}
    <p class="bt-summe">${esc(u.name)}, ich bin da. Wir gehen das in Ruhe durch – immer nur den nächsten Schritt. Du kannst jederzeit pausieren.</p>
    ${u.naechster_schritt ? `<div class="nf-naechster"><small>NÄCHSTER SCHRITT · ${esc(u.naechster_schritt.kapitel)}</small><b>${esc(u.naechster_schritt.text)}</b>
       <button type="button" data-nf="frag" data-t="${esc(u.naechster_schritt.text.slice(0, 160))}">MIT JARVIS ANGEHEN</button></div>` : ""}
    <section class="nf-kap"><h5>FRISTEN</h5>
      <div class="bt-reihe"><span>Sterbedatum</span><input type="date" data-nff="datum" value="${esc(u.sterbedatum)}"><button type="button" data-nf="datum">ÜBERNEHMEN</button></div>
      ${fristen ? `<div class="nf-fristen">${fristen}</div><p class="vb-hilfe">Vorschläge – bitte mit dem Notfallordner abgleichen. Keine Rechtsberatung.</p>
        <div class="bt-reihe"><button type="button" data-nf="fristen">${u.fristen_vorgeschlagen ? "ERNEUT " : ""}INS FRISTENRADAR</button></div>` : ""}</section>
    ${kap || `<p class="vb-hilfe">${esc(d.hinweis || "Leitfaden nicht gefunden.")}</p>`}`, "nf-fenster");
  el.querySelector(".bt-kopf-rechts").innerHTML = u.probe ? `<button type="button" data-nf="probe-ende">PROBE BEENDEN</button>` : `<button type="button" data-nf="beenden">BEENDEN</button>`;
}
document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-nf]"); if (!b) return;
  const z = b.closest(".vb-inhalt, .vb, .bt-box"), st = z?.querySelector(".vb-status, .bt-status"), f = (k) => z?.querySelector(`[data-nff="${k}"]`);
  const melde = (t, ok = true) => { if (st) { st.textContent = t; st.className = (st.classList.contains("bt-status") ? "im-form-status bt-status " : "vb-status ") + (ok ? "ok" : "fehler"); } };
  try {
    const a = b.dataset.nf;
    if (a === "einrichten") {
      if (f("code1").value !== f("code2").value) return melde("Die beiden Eingaben stimmen nicht überein.", false);
      const r = await vbPost("/notfall/einrichten", { code: f("code1").value, name: f("name").value }); f("code1").value = f("code2").value = ""; melde(r.text);
      return setTimeout(notfallEinstAufbauen, 1200);
    }
    if (a === "aktivieren") { await vbPost("/notfall/aktivieren", { code: f("code").value }); f("code").value = ""; NF.aktiv = true; notfallBanner(); notfallEinstAufbauen(); return notfallOeffnen(); }
    if (a === "beenden") { if (!(await frage({ titel: "NOTFALLBEGLEITUNG", text: "Notfallbegleitung beenden?", ok: "BEENDEN", gefahr: true }))) return; await vbPost("/notfall/beenden"); NF.aktiv = false; notfallBanner(); btZu(); return notfallEinstAufbauen(); }
    if (a === "oeffnen") return notfallOeffnen();
    if (a === "selbsttest") { const r = await vbPost("/notfall/selbsttest"); z.querySelector(".nf-selbst").innerHTML = nfSelbsttestHTML(r.selbsttest); return; }
    if (a === "probe") {
      const r = await vbPost("/notfall/probe", { code: f("probecode").value, minuten: +f("dauer").value }); f("probecode").value = "";
      NF.aktiv = true; NF.probe = true; NF.bis = r.bis; notfallBanner(); notfallEinstAufbauen(); (typeof einstZu === "function" && einstZu()); return notfallOeffnen();
    }
    if (a === "probe-ende") {
      const r = await vbPost("/notfall/probe_ende"); NF.aktiv = false; NF.probe = false; notfallBanner();
      const lp = r.bericht || {};
      btFenster("PROBE · ERGEBNIS", `<p class="bt-summe">Probe beendet${lp.seit ? ` (gestartet ${esc(lp.seit.slice(11, 16))} Uhr)` : ""}. ${lp.mit_code ? "Code-Eingabe geübt ✓" : "Ohne Codeprüfung geprobt."}
        ${lp.abgehakt ? ` ${lp.abgehakt} Schritt(e) testweise abgehakt.` : ""} Alles ist zurückgesetzt, deine Befugnisse sind wieder aktiv.</p>
        <section class="nf-kap"><h5>BEREIT FÜR DEN ERNSTFALL?</h5>${nfSelbsttestHTML(r.selbsttest)}</section>`, "nf-fenster");
      return notfallEinstAufbauen();
    }
    if (a === "pruefen") {
      const r = await vbPost("/notfall/pruefen"); const p = z.querySelector(".nf-pruef");
      p.innerHTML = r.gefunden ? `<p class="vb-hilfe">✓ ${esc(r.datei)} (Stand ${esc(r.stand)})</p><ul class="nf-pruefliste">${r.kapitel.map((k) => `<li style="padding-left:${(k.ebene - 1) * 14}px">${esc(k.titel)} <em>${k.schritte} Schritte</em></li>`).join("")}</ul>`
        : `<p class="vb-hilfe">⚠ Kein Word-Dokument mit „Notfallordner“ im Namen im DATENARCHIV gefunden.</p>`;
      return;
    }
    if (a === "schritt") { await vbPost("/notfall/schritt", { id: b.dataset.id, status: b.dataset.s }); return notfallOeffnen(); }
    if (a === "datum") { await vbPost("/notfall/sterbedatum", { datum: f("datum").value }); return notfallOeffnen(); }
    if (a === "fristen") { const sel = [...z.querySelectorAll('[data-nff="frist"]:checked')].map((x) => +x.value);
      const r = await vbPost("/notfall/fristen", { auswahl: sel }); melde(`✓ Eingetragen: ${r.eingetragen.length}`); return; }
    if (a === "frag") { btZu(); return sendText(`Hilf mir bei diesem Schritt aus dem Notfallordner: „${b.dataset.t}“`); }
  } catch (err) { melde(err.message, false); }
});
const _handleNF = handle;
handle = function (ev) {
  if (ev.type === "notfall") { NF.aktiv = !!ev.aktiv; NF.probe = !!ev.probe && !!ev.aktiv; notfallBanner(); if (!$("einst").hidden) notfallEinstAufbauen(); if (ev.aktualisiert && BT.fenster?.classList.contains("nf-fenster")) notfallOeffnen(); return; }
  _handleNF(ev);
};
setTimeout(async () => { try { const d = await fdGet("/notfall"); NF.aktiv = d.aktiv; NF.probe = !!d.probe; NF.bis = d.probe_bis || ""; notfallBanner(); } catch (e) {} }, 3500);
const _vbAufbauenZN = vbAufbauen;
vbAufbauen = async function (...a) { await _vbAufbauenZN(...a); zuhauseEinstAufbauen(); notfallEinstAufbauen(); };

// =====================================================================
//  SCHNELLLEISTE links: Fahrzeuge und Immobilien – dezent, auch in der reduzierten Ansicht
// =====================================================================
(function schnellleiste() {
  const l = document.createElement("nav"); l.id = "schnell"; l.setAttribute("aria-label", "Schnellzugriff");
  l.innerHTML = `
    <button type="button" data-sl="fahrzeug" title="Fahrzeuge"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 19.5v-3.2c0-.9.5-1.7 1.3-2.1l2.6-1.3 2.4-4a3 3 0 0 1 2.6-1.4h6.4c1 0 2 .5 2.6 1.4l2.4 4 2.6 1.3c.8.4 1.3 1.2 1.3 2.1v3.2"/><path d="M4 19.5h24v3a1 1 0 0 1-1 1h-2.5M7.5 23.5H5a1 1 0 0 1-1-1v-3"/><circle cx="10" cy="23.5" r="2.4"/><circle cx="22" cy="23.5" r="2.4"/><path d="M12.4 23.5h7.2M9.6 12.9h12.8"/></svg><span>FAHRZEUGE</span></button>
    <button type="button" data-sl="immo" title="Immobilien"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 15 16 6l11 9"/><path d="M8 13v12.5h16V13"/><path d="M13.5 25.5v-6.5h5v6.5"/><path d="M21 9V6.5h2.5v4.6"/></svg><span>IMMOBILIEN</span></button>`;
  document.body.appendChild(l);
  l.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sl]"); if (!b) return;
    sfx?.("tick");
    if (b.dataset.sl === "fahrzeug") window.teslaAnzeigen?.(); else imLaden();
  });
})();


// =====================================================================
//  AVATARE AURA · NOVA · MILO – zusätzliche Stilwelten (STIL-Knopf). Darstellung „Porträt“ (lebendes Hologramm
//  aus den Konzeptbildern) oder „3D-Figur“ (mitgelieferte three.js-Prototypen). Der Kern bleibt für alle anderen Stile.
// =====================================================================
const AV = { person: null, inst: null, laden: null, modus: "portraet" };
const AV_ZUSTAND = { idle: "ruhe", listen: "zuhoeren", think: "denken", tool: "denken", speak: "sprechen", ask: "warnung",
  error: "warnung", off: "ruhe" };
function avatarLib() {
  if (window.JarvisAvatar) return Promise.resolve();
  if (!AV.laden) AV.laden = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "avatar3d.bundle.js?v=20261028b";
    s.onload = res; s.onerror = () => { AV.laden = null; rej(new Error("Avatar-Modul fehlt")); }; document.head.appendChild(s); });
  return AV.laden;
}
async function avatarSetzen(person) {
  if (AV.person === person && (AV.inst || !person)) return;
  try { AV.inst?.entfernen(); } catch (e) {}
  AV.inst = null; AV.person = person;
  let box = $("avatar-box");
  if (!person) { delete document.body.dataset.avatar; if (box) setTimeout(() => { if (!AV.person) box.remove(); }, 900); return; }
  if (!box) { box = document.createElement("div"); box.id = "avatar-box"; box.setAttribute("aria-hidden", "true"); $("stage").insertBefore(box, $("state")); }
  box.textContent = "";
  try {
    await avatarLib();
    if (AV.person !== person) return;
    AV.inst = window.JarvisAvatar.erzeugen(box, { person, modus: AV.modus, qualitaet: MOBIL ? "niedrig" : "hoch",
      meldung: (i) => { if (AV.modus === "modell" && i && i.modell === false) toast(`Für ${person.toUpperCase()} gibt es noch kein 3D-Modell – Porträt wird gezeigt`); } });
    AV.inst.zustand(AV_ZUSTAND[coreState] || "ruhe");
    document.body.dataset.avatar = person;
  } catch (e) {
    console.warn("Avatar", e); AV.person = null; delete document.body.dataset.avatar; box.remove();
    toast("Avatar ließ sich nicht laden – der Kern bleibt aktiv");
  }
}
const _setStateAvatar = setState;
setState = function (s) { _setStateAvatar(s); try { AV.inst?.zustand(AV_ZUSTAND[s] || "ruhe"); } catch (e) {} };
window.atlasCore.setState = setState;
const _setLevelAvatar = window.atlasCore.setLevel;
window.atlasCore.setLevel = (v) => { _setLevelAvatar(v); try { AV.inst?.pegel(v); } catch (e) {} };
const AV_MODI = ["portraet", "modell", "figur"], AV_MODUSNAME = { portraet: "PORTRÄT", modell: "3D-MODELL", figur: "3D-FIGUR (PROTOTYP)" };
function avatarModusKnopf() { const b = $("avatarmodus"); if (b) b.textContent = AV_MODUSNAME[AV.modus] || "PORTRÄT"; }
$("avatarmodus")?.addEventListener("click", () => {
  AV.modus = AV_MODI[(AV_MODI.indexOf(AV.modus) + 1) % AV_MODI.length]; avatarModusKnopf(); sfx?.("tick");
  api("/einstellungen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ avatar_modus: AV.modus }) }).catch(() => {});
  if (AV.person) { const p = AV.person; AV.person = null; avatarSetzen(p); }
});
const _handleStil = handle;
handle = function (ev) {
  if (ev.type === "stil") {
    if (["figur", "portraet", "modell"].includes(ev.avatar_modus)) { AV.modus = ev.avatar_modus; avatarModusKnopf(); if (AV.person) AV.person = null; }
    setStil(ev.stil); sfx?.("ok"); return;
  }
  _handleStil(ev);
};

// Avatar: Mund folgt dem gesprochenen Text, „dreh dich“, 3D-Modelle hochladen
const _ttsSayAvatar = ttsSay;
ttsSay = function (text, ...rest) { try { AV.inst?.text?.(String(text || "")); } catch (e) {} return _ttsSayAvatar(text, ...rest); };
const _handleAvatar = handle;
handle = function (ev) {
  if (ev.type === "avatar") { if (ev.aktion === "drehen") AV.inst?.drehen?.(+ev.grad || 360); return; }
  _handleAvatar(ev);
};
async function avatarModelleAufbauen() {
  const box = $("avatar-modelle"); if (!box) return;
  let d = {}; try { d = await api("/avatar-modelle"); } catch (e) { return; }
  box.innerHTML = ["aura", "nova", "milo"].map((p) => { const m = d[p] || {};
    return `<div class="einst-zeile"><span>${p.toUpperCase()} · 3D-Modell <small class="im-einst-sub">${m.hoch ? `✓ ${m.hoch.mb} MB vom ${esc(m.hoch.datum)}` : "noch keins"}${m.lod1 ? ` · iPhone-Fassung ✓` : ""}</small></span>
      <span class="avm-knoepfe"><button type="button" data-avm="${p}" data-lod="0">.GLB LADEN</button><button type="button" data-avm="${p}" data-lod="1" title="Leichtere Fassung fürs iPhone (_lod1)">IPHONE</button></span></div>`; }).join("")
    + `<input type="file" accept=".glb,model/gltf-binary" hidden id="avatar-glb">`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-avm]"); if (!b) return;
  const inp = $("avatar-glb"); inp.dataset.p = b.dataset.avm; inp.dataset.lod = b.dataset.lod; inp.value = ""; inp.click();
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "avatar-glb" || !e.target.files[0]) return;
  const f = e.target.files[0], p = e.target.dataset.p, lod = e.target.dataset.lod;
  toast(`Lade ${f.name} für ${p.toUpperCase()} …`);
  try {
    const r = await fetch(`/avatar-modell/${p}?lod=${lod}`, { method: "POST", body: f, headers: TOKEN ? { "x-atlas-token": TOKEN } : {} });
    const j = await r.json(); if (!r.ok) throw new Error(j.detail || r.status);
    toast(`✓ ${p.toUpperCase()}: ${j.formen} Gesichtsformen${j.viseme ? `, ${j.viseme} Viseme` : ""}${j.kopf ? ", Kopfknochen" : ""}${j.clips.length ? `, ${j.clips.length} Clips` : ""}`);
    avatarModelleAufbauen();
    if (AV.person === p && AV.modus === "modell") { AV.person = null; avatarSetzen(p); }
  } catch (err) { toast("Modell: " + err.message); }
});
const _einstOeffnenAvatar = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenAvatar(); avatarModelleAufbauen(); };

// =====================================================================
//  PROJEKTE: Vorhaben über Wochen – Beobachtungen (Internetrecherche), Funde, verknüpfte Vorgänge und Fristen
// =====================================================================
const PJ = { d: null, aktiv: null, el: null };
const pjZeit = (iso) => { if (!iso) return "–"; const d = new Date(iso); return isNaN(d) ? "–" : d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); };
const pjListe = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
async function projekteOeffnen(id) {
  try { PJ.d = await fdGet("/projekte"); } catch (e) { return toast("Projekte: " + e.message); }
  if (id) PJ.aktiv = id;
  if (!PJ.d.projekte.find((p) => p.id === PJ.aktiv)) PJ.aktiv = PJ.d.projekte[0]?.id || null;
  if (!PJ.el || !document.body.contains(PJ.el)) {
    PJ.el = btFenster("PROJEKTE", "", "pj-fenster");
    PJ.el.querySelector(".bt-kopf-rechts").innerHTML = `<button type="button" data-pj="neu">＋ PROJEKT</button>`;
  }
  pjZeichnen();
}
function pjZeichnen() {
  const d = PJ.d, box = PJ.el?.querySelector(".bt-inhalt"); if (!box) return;
  const v = d.verbrauch || {};
  const liste = d.projekte.map((p) => `<button type="button" class="pj-karte ${p.id === PJ.aktiv ? "an" : ""} pj-${p.status}" data-pj="waehlen" data-id="${esc(p.id)}">
      <b>${esc(p.name)}</b><span>${esc({ aktiv: "aktiv", pausiert: "pausiert", abgeschlossen: "abgeschlossen" }[p.status])}${p.beobachtungen.length ? ` · ${p.beobachtungen.length} Beobachtung${p.beobachtungen.length > 1 ? "en" : ""}` : ""}</span>
      ${p.alarme ? `<em class="pj-alarm">${p.alarme} ALARM</em>` : p.ungelesen ? `<em>${p.ungelesen} neu</em>` : ""}</button>`).join("")
    || `<p class="vb-hilfe">Noch kein Projekt. Rechts oben „＋ PROJEKT“ – oder per Sprache: „Leg ein Projekt Auslandsverwendung an und halte mich zu Dienstposten in Norfolk auf dem Laufenden.“</p>`;
  const p = d.projekte.find((x) => x.id === PJ.aktiv);
  box.innerHTML = `<div class="pj-raster"><aside class="pj-liste">${liste}<p class="pj-verbrauch">Claude-Auswertungen ${new Date().toLocaleString("de-DE", { month: "long" })}: ${v.bewertungen || 0}/${v.grenzen?.bewertungen || "–"} Bewertungen · ${v.nachrecherchen || 0}/${v.grenzen?.nachrecherchen || "–"} Nachrecherchen</p></aside>
    <section class="pj-detail vb">${p ? pjDetail(p) : ""}</section></div>`;
}
function pjDetail(p) {
  const beob = p.beobachtungen.map((b) => `<li class="${b.aktiv ? "" : "aus"}"><div><b>${esc(b.titel)}</b>
      <small>${esc(b.suchbegriffe.join(", "))} · alle ${b.intervall_h} h · zuletzt ${pjZeit(b.letzter_lauf)}${b.alarmwoerter.length ? ` · Alarm bei: ${esc(b.alarmwoerter.join(", "))}` : ""}${b.feeds.length ? ` · ${b.feeds.length} eigene Feeds` : ""}</small></div>
      <button type="button" data-pj="b-aktiv" data-b="${esc(b.id)}">${b.aktiv ? "PAUSE" : "AN"}</button><button type="button" data-pj="b-weg" data-b="${esc(b.id)}" title="Beobachtung entfernen">✕</button></li>`).join("");
  const funde = p.funde.map((f) => `<li class="pj-fund ${f.alarm ? "pj-alarm-fund" : ""} ${f.gelesen ? "gelesen" : ""}">
      <i class="pj-rel" style="--r:${f.relevanz / 10}" title="Relevanz ${f.relevanz}/10"></i>
      <div><a href="#" data-pj="fund" data-f="${esc(f.id)}">${esc(f.titel)}</a>
        <small>${esc(f.quelle)} · ${pjZeit(f.datum || f.gefunden)} · ${esc(f.beobachtung)}</small>${f.satz ? `<p>${esc(f.satz)}</p>` : ""}${f.stand ? `<p class="pj-stand">${esc(f.stand)}</p>` : ""}</div></li>`).join("");
  const vg = p.vorgaenge.map((x) => `<li><b>${esc(x.titel)}</b><small>${esc(x.status)}${x.frist && x.frist !== "–" ? ` · Frist ${esc(x.frist)}` : ""}${x.naechster_schritt && x.naechster_schritt !== "–" ? ` · nächster Schritt: ${esc(x.naechster_schritt)}` : ""}</small></li>`).join("");
  const fr = p.fristen.map((x) => `<li><b>${esc(x.titel)}</b><small>${esc(x.datum.split("-").reverse().join("."))} · ${x.in_tagen < 0 ? `${-x.in_tagen} Tage überfällig` : `in ${x.in_tagen} Tagen`}</small></li>`).join("");
  return `<div class="pj-kopf"><h3>${esc(p.name)}</h3><select data-pj="status">${["aktiv", "pausiert", "abgeschlossen"].map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select>
      <button type="button" data-pj="lauf" title="Alle Beobachtungen jetzt ausführen">⟳ JETZT RECHERCHIEREN</button></div>
    <div class="vb-feld"><label>Ziel</label><input data-pjf="ziel" value="${esc(p.ziel)}" placeholder="Worum geht es, was soll erreicht werden?"></div>
    <div class="vb-feld"><label>Stichwörter (verknüpfen Vorgänge und Fristen, Komma-getrennt)</label><input data-pjf="stichwoerter" value="${esc(p.stichwoerter.join(", "))}"></div>
    <div class="bt-reihe"><button type="button" data-pj="speichern">SPEICHERN</button><span class="pj-hinweis">angelegt ${pjZeit(p.erstellt)}${p.naechster_lauf ? ` · nächste Recherche ${pjZeit(p.naechster_lauf)}` : ""}</span></div>
    <h5>BEOBACHTUNGEN</h5><ul class="pj-beob">${beob || "<li class='leer'>Noch keine – unten anlegen.</li>"}</ul>
    <details class="pj-neu"><summary>＋ BEOBACHTUNG</summary>
      <div class="vb-feld"><label>Titel</label><input data-pjb="titel" placeholder="z. B. Dienstposten Norfolk"></div>
      <div class="vb-feld"><label>Suchbegriffe (Komma-getrennt; Wortgruppen werden zusammen gesucht)</label><input data-pjb="suchbegriffe" placeholder="NATO Norfolk, Allied Command Transformation"></div>
      <div class="vb-feld"><label>Alarm sofort bei (Komma-getrennt, optional)</label><input data-pjb="alarm" placeholder="Ausschreibung, Frist, Auflösung"></div>
      <div class="vb-feld"><label>Ausschließen (optional)</label><input data-pjb="aus" placeholder="Sport, Börse"></div>
      <div class="vb-feld"><label>Eigene RSS-Feeds (https, optional)</label><input data-pjb="feeds" placeholder="https://…/feed"></div>
      <div class="bt-reihe"><span>Alle</span><select data-pjb="int"><option value="3">3 Stunden</option><option value="6">6 Stunden</option><option value="12" selected>12 Stunden</option><option value="24">24 Stunden</option><option value="72">3 Tage</option><option value="168">Woche</option></select>
        <span>Sprache</span><select data-pjb="sprache"><option value="de">Deutsch</option><option value="en">Englisch</option></select>
        <button type="button" class="primary" data-pj="b-neu">ANLEGEN</button></div></details>
    <h5>FUNDE ${p.ungelesen ? `<button type="button" class="pj-mini" data-pj="gelesen">ALLE GELESEN</button>` : ""}</h5>
    <ul class="pj-funde">${funde || "<li class='leer'>Noch keine Meldungen.</li>"}</ul>
    <div class="pj-zwei"><div><h5>VORGÄNGE</h5><ul class="pj-mini-liste">${vg || "<li class='leer'>keine verknüpft</li>"}</ul></div>
      <div><h5>FRISTEN</h5><ul class="pj-mini-liste">${fr || "<li class='leer'>keine verknüpft</li>"}</ul></div></div>`;
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-pj]"); if (!b) return;
  if (b.tagName === "SELECT") return;
  e.preventDefault();
  const a = b.dataset.pj, st = PJ.el?.querySelector(".bt-status"), p = PJ.d?.projekte.find((x) => x.id === PJ.aktiv);
  const f = (k) => PJ.el.querySelector(`[data-pjf="${k}"]`), g = (k) => PJ.el.querySelector(`[data-pjb="${k}"]`);
  const melde = (t, ok = true) => { if (st) { st.textContent = t; st.className = "im-form-status bt-status " + (ok ? "ok" : "fehler"); } };
  try {
    if (a === "waehlen") { PJ.aktiv = b.dataset.id; return pjZeichnen(); }
    if (a === "neu") { const name = await frage({ titel: "NEUES PROJEKT", text: "Name des Projekts:", ok: "ANLEGEN", eingabe: { platzhalter: "z. B. Auslandsverwendung" } }); if (!name) return; const r = await vbPost("/projekte/anlegen", { name }); PJ.aktiv = r.id; return projekteOeffnen(); }
    if (a === "speichern") { await vbPost("/projekte/aendern", { projekt: p.id, ziel: f("ziel").value, stichwoerter: pjListe(f("stichwoerter").value) }); melde("✓ gespeichert"); return projekteOeffnen(); }
    if (a === "b-neu") {
      const r = await vbPost("/projekte/beobachtung", { projekt: p.id, titel: g("titel").value, suchbegriffe: pjListe(g("suchbegriffe").value),
        alarmwoerter: pjListe(g("alarm").value), ausschluss: pjListe(g("aus").value), feeds: pjListe(g("feeds").value), intervall_h: +g("int").value, sprache: g("sprache").value });
      melde("✓ " + r.hinweis); return setTimeout(projekteOeffnen, 400);
    }
    if (a === "b-aktiv") { const bb = p.beobachtungen.find((x) => x.id === b.dataset.b); await vbPost("/projekte/beobachtung_aendern", { projekt: p.id, beobachtung: bb.id, aktiv: !bb.aktiv }); return projekteOeffnen(); }
    if (a === "b-weg") { if (!(await frage({ titel: "BEOBACHTUNG", text: "Beobachtung entfernen?", ok: "ENTFERNEN", gefahr: true }))) return; await vbPost("/projekte/beobachtung_aendern", { projekt: p.id, beobachtung: b.dataset.b, loeschen: true }); return projekteOeffnen(); }
    if (a === "lauf") { melde("Recherchiere …"); b.disabled = true; const r = await vbPost("/projekte/lauf", { projekt: p.id });
      const n = (r || []).reduce((s, x) => s + (x.funde || 0), 0); melde(`✓ ${n} neue Meldung(en)`); return projekteOeffnen(); }
    if (a === "gelesen") { await vbPost("/projekte/gelesen", { projekt: p.id, alle: true }); return projekteOeffnen(); }
    if (a === "fund") {
      const r = await vbPost(`/projekte/fund/${encodeURIComponent(b.dataset.f)}/oeffnen`).catch((err) => ({ fehler: err.message }));
      if (MOBIL && r.url) window.open(r.url, "_blank");
      vbPost("/projekte/gelesen", { projekt: p.id, fund: b.dataset.f }).catch(() => {}); return;
    }
    if (a === "einst-oeffnen") { typeof einstZu === "function" && einstZu(); return projekteOeffnen(b.dataset.id); }
  } catch (err) { melde("⚠ " + err.message, false); }
});
document.addEventListener("change", async (e) => {
  if (!e.target.matches('[data-pj="status"]')) return;
  try { await vbPost("/projekte/aendern", { projekt: PJ.aktiv, status: e.target.value }); projekteOeffnen(); } catch (err) { toast(err.message); }
});
const _handleProjekte = handle;
handle = function (ev) {
  if (ev.type === "projekte") {
    if (ev.zeigen) projekteOeffnen();
    else if (PJ.el && document.body.contains(PJ.el)) projekteOeffnen();
    if (!$("einst").hidden) projekteEinstAufbauen();
    return;
  }
  _handleProjekte(ev);
};
// Schnellleiste: dritter Knopf
(function () {
  const l = $("schnell"); if (!l) return;
  l.insertAdjacentHTML("beforeend", `<button type="button" data-sl="projekte" title="Projekte"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 9.5h7l2 2.5h11v12.5H6z"/><path d="M6 14h20"/><path d="M11 19h7M11 22h4"/></svg><span>PROJEKTE</span></button>`);
  l.addEventListener("click", (e) => { if (e.target.closest('[data-sl="projekte"]')) { e.stopImmediatePropagation(); projekteOeffnen(); } }, true);
})();
// Einstellungen → Reiter PROJEKTE
async function projekteEinstAufbauen() {
  const box = $("einst-projekte"); if (!box) return;
  let d; try { d = await fdGet("/projekte"); } catch (e) { return; }
  box.innerHTML = (d.projekte.map((p) => `<div class="einst-zeile"><span><b>${esc(p.name)}</b><small class="im-einst-sub">${esc(p.status)} · ${p.beobachtungen.length} Beobachtung(en)${p.ungelesen ? ` · ${p.ungelesen} neu` : ""}${p.alarme ? ` · ${p.alarme} Alarm` : ""}${p.ziel ? " · " + esc(p.ziel.slice(0, 60)) : ""}</small></span>
      <button type="button" data-pj="einst-oeffnen" data-id="${esc(p.id)}">ÖFFNEN</button></div>`).join("") || `<p class="vb-hilfe">Noch keine Projekte.</p>`)
    + `<p class="vb-hilfe">Recherche: erst kostenlose Nachrichten-Feeds, nur neue Treffer bewertet Claude (Monat: ${d.verbrauch.bewertungen}/${d.verbrauch.grenzen.bewertungen}), Alarme kommen sofort, alles andere gesammelt im Entscheidungsstapel und Briefing.</p>
      <div class="vb-reihe"><button type="button" class="primary" data-pj="einst-oeffnen">ÜBERSICHT ÖFFNEN</button></div>`;
}
const _einstOeffnenPJ = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenPJ(); projekteEinstAufbauen(); };

// =====================================================================
//  AEGIS: Sicherheitsaudit (Stab-Agent SICH) – Bericht mit Ampel, Befunden und drei Behebungswegen:
//  KLICK (JARVIS behebt nach Rückfrage) · ANLEITUNG (Schritte, Systemeinstellung, Befehl) · CLAUDE (Auftrag für Code-Änderungen)
// =====================================================================
const AG = { d: null, el: null, warten: null, wahl: new Set(), auftrag: null };
const AG_STUFE = { kritisch: "KRITISCH", hoch: "HOCH", mittel: "MITTEL", niedrig: "NIEDRIG", info: "INFO", ok: "OK" };
const AG_AMPEL = { rot: "ROT", gelb: "GELB", gruen: "GRÜN" };
const AG_WEG = { klick: ["JARVIS BEHEBT", "Per Klick – JARVIS fragt vorher nach"], anleitung: ["DU", "Schritt-für-Schritt-Anleitung"], claude: ["CLAUDE", "Code-Änderung – als Auftrag an Claude"] };
async function aegisOeffnen() {
  try { AG.d = await fdGet("/sicherheit/audit"); } catch (e) { return toast("Sicherheitsaudit: " + e.message); }
  if (!AG.el || !document.body.contains(AG.el)) {
    AG.el = btFenster("SICHERHEITSAUDIT · AEGIS", "", "ag-fenster");
    AG.el.querySelector(".bt-kopf-rechts").innerHTML = `<button type="button" data-ag="start">⟳ JETZT PRÜFEN</button>`;
    AG.wahl = new Set((AG.d.befunde || []).filter((b) => b.weg === "claude" && !b.akzeptiert && !b.behoben).map((b) => b.id));
  }
  agZeichnen();
}
async function agKopieren(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  const t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} t.remove(); return ok;
}
function agBefund(b) {
  const offen = !["ok", "info"].includes(b.stufe) && !b.behoben && !b.akzeptiert;
  const weg = offen && b.weg ? `<em class="ag-weg ag-weg-${b.weg}" title="${esc(AG_WEG[b.weg]?.[1] || "")}">${AG_WEG[b.weg]?.[0] || ""}</em>` : "";
  let aktion = "";
  if (b.behoben) aktion = `<span class="ag-erledigt">✓ behoben</span>`;
  else if (b.akzeptiert) aktion = `<button type="button" class="ag-leise" data-ag="ausnahme-weg" data-id="${esc(b.id)}">WIEDER MELDEN</button>`;
  else if (offen) {
    const k = [];
    if (b.fix) k.push(`<button type="button" class="ag-haupt" data-ag="fix" data-fix="${esc(b.fix)}" data-titel="${esc(b.titel)}">BEHEBEN</button>`);
    if (b.weg === "claude") k.push(`<label class="ag-wahl" title="In den Claude-Auftrag aufnehmen"><input type="checkbox" data-ag-wahl="${esc(b.id)}" ${AG.wahl.has(b.id) ? "checked" : ""}> CLAUDE</label>`);
    if (b.einstellung) k.push(`<button type="button" data-ag="einstellung" data-ziel="${esc(b.einstellung)}">EINSTELLUNG ÖFFNEN</button>`);
    if (b.befehl) k.push(`<button type="button" data-ag="befehl" data-befehl="${esc(b.befehl)}" title="${esc(b.befehl)}">BEFEHL KOPIEREN</button>`);
    if (b.weg !== "klick") k.push(`<button type="button" data-ag="nachpruefen" data-bereich="${esc(b.bereich)}" title="Nur diesen Bereich erneut prüfen">NACHPRÜFEN</button>`);
    if (b.stufe !== "kritisch") k.push(`<button type="button" class="ag-leise" data-ag="ausnahme" data-id="${esc(b.id)}" data-titel="${esc(b.titel)}" title="Bewusst so lassen (90 Tage)">HINNEHMEN</button>`);
    aktion = `<div class="ag-knoepfe">${k.join("")}</div>`;
  }
  const schritte = offen && b.schritte?.length ? `<ol class="ag-schritte">${b.schritte.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
  const befehl = offen && b.befehl ? `<code class="ag-befehl">${esc(b.befehl)}</code>` : "";
  const akz = b.akzeptiert ? `<p class="ag-akz">Hingenommen bis ${esc(b.akzeptiert.bis.split("-").reverse().join("."))}: ${esc(b.akzeptiert.grund)}</p>` : "";
  return `<li class="ag-b ag-${b.stufe} ${b.behoben ? "behoben" : ""} ${b.akzeptiert ? "akzeptiert" : ""}"><i>${AG_STUFE[b.stufe] || b.stufe}</i>
    <div><b>${esc(b.titel)}${b.neu ? ` <em class="ag-neu">NEU</em>` : ""}${weg}</b><small>${esc(b.bereich)}${b.detail ? " · " + esc(b.detail) : ""}</small>
    ${b.empfehlung && !b.akzeptiert ? `<p>${esc(b.empfehlung)}</p>` : ""}${schritte}${befehl}${akz}${aktion}</div></li>`;
}
function agZeichnen() {
  const d = AG.d, box = AG.el?.querySelector(".bt-inhalt"); if (!box) return;
  const st = AG.el.querySelector(".bt-status");
  if (st) st.textContent = d.laeuft ? "AEGIS prüft … (bis 1–2 Minuten)" : "";
  if (!d.vorhanden) { box.innerHTML = `<p class="vb-hilfe">${esc(d.hinweis)}</p>`; return; }
  const z = d.zaehlung, ernst = d.befunde.filter((b) => !["ok", "info"].includes(b.stufe) && !b.akzeptiert && !b.behoben);
  const erledigt = d.befunde.filter((b) => b.behoben && !b.akzeptiert);
  const akz = d.befunde.filter((b) => b.akzeptiert);
  const ok = d.befunde.filter((b) => b.stufe === "ok"), info = d.befunde.filter((b) => b.stufe === "info");
  const offen = ernst.filter((b) => !b.behoben);
  const n = { klick: 0, anleitung: 0, claude: 0 }; offen.forEach((b) => { n[b.weg] = (n[b.weg] || 0) + 1; });
  const verlauf = (d.verlauf || []).slice(-12).map((v) => `<i class="ag-punkt ag-${v.ampel}" title="${esc(v.zeit.slice(0, 10))}: ${AG_AMPEL[v.ampel]} – ${v.zaehlung.kritisch + v.zaehlung.hoch} ernst, ${v.zaehlung.mittel} mittel"></i>`).join("");
  box.innerHTML = `<div class="ag-kopf"><div class="ag-ampel ag-${d.ampel}"><i></i><i></i><i></i></div>
      <div><h3>Ampel ${AG_AMPEL[d.ampel]}</h3><small>${pjZeit(d.zeit)} · ${esc(d.anlass)} · ${d.dauer_s} s${d.nachgeprueft ? ` · nachgeprüft ${pjZeit(d.nachgeprueft)}` : ""} · nächster Lauf automatisch nach 7 Tagen</small></div>
      <div class="ag-zahlen">${["kritisch", "hoch", "mittel", "niedrig"].map((s) => `<span class="ag-${s}"><b>${z[s]}</b>${AG_STUFE[s]}</span>`).join("")}</div></div>
    <div class="ag-verlauf"><span>VERLAUF</span>${verlauf}</div>
    ${offen.length ? `<div class="ag-plan"><b>SO WIRD ES BEHOBEN</b>
      <span><em class="ag-weg ag-weg-klick">JARVIS BEHEBT</em> ${n.klick} per Klick</span>
      <span><em class="ag-weg ag-weg-anleitung">DU</em> ${n.anleitung} mit Anleitung</span>
      <span><em class="ag-weg ag-weg-claude">CLAUDE</em> ${n.claude} als Code-Auftrag</span>
      <button type="button" class="ag-haupt" data-ag="auftrag">CLAUDE-AUFTRAG ERSTELLEN (<span data-ag-zahl>${AG.wahl.size}</span>)</button></div>` : ""}
    <div class="ag-auftrag-box"></div>
    <h5>HANDLUNGSBEDARF</h5><ul class="ag-liste">${ernst.map(agBefund).join("") || "<li class='leer'>Keine Schwachstellen gefunden.</li>"}</ul>
    ${erledigt.length ? `<h5>ERLEDIGT – WIRKT NACH NEUSTART BZW. NÄCHSTER PRÜFUNG</h5><ul class="ag-liste">${erledigt.map(agBefund).join("")}</ul>` : ""}
    ${akz.length ? `<h5>BEWUSST HINGENOMMEN</h5><ul class="ag-liste">${akz.map(agBefund).join("")}</ul>` : ""}
    ${info.length ? `<h5>HINWEISE</h5><ul class="ag-liste">${info.map(agBefund).join("")}</ul>` : ""}
    <details class="ag-gut"><summary>${ok.length} PRÜFUNGEN OHNE BEFUND</summary><ul class="ag-liste">${ok.map(agBefund).join("")}</ul></details>
    <p class="vb-hilfe">Alle Prüfungen laufen lokal auf dem Mac. Nach außen geht nur die Liste der Paketnamen und Versionen an die öffentliche Schwachstellendatenbank OSV. Fundstellen von Schlüsseln stehen nur maskiert im Bericht und im Claude-Auftrag.</p>`;
  if (AG.auftrag) agAuftragZeigen(AG.auftrag);
}
function agAuftragZeigen(r) {
  const box = AG.el?.querySelector(".ag-auftrag-box"); if (!box) return;
  box.innerHTML = `<section class="ag-auftrag"><div class="ag-auftrag-kopf"><b>CLAUDE-AUFTRAG · ${r.befunde} BEFUND${r.befunde > 1 ? "E" : ""}</b><button type="button" class="vt-zu" data-ag="auftrag-zu">✕</button></div>
    <p>Gespeichert im atlas-Ordner unter <code>${esc(r.relativ)}</code> (wird nicht hochgeladen). Drei Wege:</p>
    <ol class="ag-wege">
      <li><b>Claude Code im Terminal</b>${r.claude_code ? ` – startet im Repository mit dem Auftrag; jede Änderung bestätigst du dort.<br><button type="button" class="ag-haupt" data-ag="claude-code">IN CLAUDE CODE STARTEN</button>` : ` – auf diesem Mac nicht installiert (claude.ai/code).`}</li>
      <li><b>Claude / Cowork</b> mit verbundenem atlas-Ordner – diesen Satz einfügen:<br><code class="ag-befehl">${esc(r.cowork)}</code> <button type="button" data-ag="kopieren" data-was="cowork">SATZ KOPIEREN</button></li>
      <li><b>Beliebiger Chat</b> – kompletten Auftrag kopieren und einfügen: <button type="button" data-ag="kopieren" data-was="text">AUFTRAG KOPIEREN</button></li>
    </ol>
    <details><summary>AUFTRAG ANSEHEN</summary><pre>${esc(r.text)}</pre></details>
    <p class="vb-hilfe">Nach den Änderungen: „jarvis speichern“, JARVIS neu starten, dann hier „Jetzt prüfen“.</p></section>`;
}
function agWarten() {
  clearTimeout(AG.warten);
  AG.warten = setTimeout(async () => {
    try { AG.d = await fdGet("/sicherheit/audit"); } catch (e) { return; }
    if (AG.el && document.body.contains(AG.el)) agZeichnen();
    if (AG.d.laeuft) agWarten(); else if (!$("einst").hidden) aegisEinstAufbauen();
  }, 2500);
}
document.addEventListener("change", (e) => {
  const c = e.target.closest("[data-ag-wahl]"); if (!c) return;
  c.checked ? AG.wahl.add(c.dataset.agWahl) : AG.wahl.delete(c.dataset.agWahl);
  const z = AG.el?.querySelector("[data-ag-zahl]"); if (z) z.textContent = AG.wahl.size;
});
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ag]"); if (!b) return;
  e.preventDefault();
  const a = b.dataset.ag;
  const melde = (t) => { const st = AG.el?.querySelector(".bt-status"); if (st) st.textContent = t; else toast(t); };
  try {
    if (a === "oeffnen") { typeof einstZu === "function" && einstZu(); return aegisOeffnen(); }
    if (a === "start") {
      const r = await vbPost("/sicherheit/audit/start", { tests: true });
      if (!r.ok) toast(r.hinweis || "Läuft bereits");
      AG.auftrag = null;
      if (!AG.el || !document.body.contains(AG.el)) await aegisOeffnen();
      AG.d = { ...(AG.d || {}), laeuft: true }; agZeichnen(); return agWarten();
    }
    if (a === "fix") {
      if (!(await frage({ titel: "AEGIS · BEHEBEN", text: `„${b.dataset.titel}“\n\nJARVIS behebt das jetzt und prüft danach nach.`, ok: "BEHEBEN" }))) return;
      b.disabled = true; melde("AEGIS behebt …" + (b.dataset.fix.startsWith("pip:") ? " (Update + Sicherheitstests, bis 2 Minuten)" : ""));
      const r = await vbPost("/sicherheit/audit/beheben", { fix: b.dataset.fix });
      toast("✓ " + (r.hinweis || "behoben")); await aegisOeffnen(); return melde("✓ " + (r.hinweis || "behoben"));
    }
    if (a === "nachpruefen") {
      b.disabled = true; melde(`Prüfe ${b.dataset.bereich} erneut …`);
      const r = await vbPost("/sicherheit/audit/nachpruefen", { bereich: b.dataset.bereich });
      await aegisOeffnen(); return melde(r.erledigt ? `✓ ${r.erledigt} Befund(e) erledigt` : `${b.dataset.bereich}: noch ${r.offen} offen`);
    }
    if (a === "einstellung") { await vbPost("/sicherheit/audit/einstellung", { ziel: b.dataset.ziel }); return melde("Systemeinstellungen geöffnet – danach „Nachprüfen“."); }
    if (a === "befehl") { const ok = await agKopieren(b.dataset.befehl); return melde(ok ? "✓ Befehl kopiert – im Terminal einfügen." : b.dataset.befehl); }
    if (a === "ausnahme") {
      const grund = await frage({ titel: "AEGIS · HINNEHMEN", text: `„${b.dataset.titel}“ bewusst hinnehmen?\nGilt 90 Tage, zählt nicht zur Ampel und wird nicht gemeldet.`, ok: "HINNEHMEN", eingabe: { platzhalter: "Grund, z. B. „gewollt, nur im Heimnetz“" } });
      if (!grund) return;
      await vbPost("/sicherheit/audit/ausnahme", { id: b.dataset.id, grund }); AG.wahl.delete(b.dataset.id); return aegisOeffnen();
    }
    if (a === "ausnahme-weg") { await vbPost("/sicherheit/audit/ausnahme", { id: b.dataset.id, aufheben: true }); return aegisOeffnen(); }
    if (a === "auftrag") {
      if (!AG.wahl.size) return melde("Erst bei mindestens einem Befund „CLAUDE“ ankreuzen.");
      AG.auftrag = await vbPost("/sicherheit/audit/auftrag", { ids: [...AG.wahl] });
      agAuftragZeigen(AG.auftrag); AG.el.querySelector(".ag-auftrag")?.scrollIntoView({ behavior: "smooth", block: "start" }); return;
    }
    if (a === "auftrag-zu") { AG.auftrag = null; const x = AG.el?.querySelector(".ag-auftrag-box"); if (x) x.innerHTML = ""; return; }
    if (a === "kopieren" && AG.auftrag) { const ok = await agKopieren(b.dataset.was === "cowork" ? AG.auftrag.cowork : AG.auftrag.text); return melde(ok ? "✓ kopiert" : "Kopieren nicht möglich – Text unten markieren."); }
    if (a === "claude-code") {
      if (!(await frage({ titel: "CLAUDE CODE", text: "Terminal öffnen und Claude Code im atlas-Ordner mit diesem Auftrag starten?\nJede Änderung bestätigst du dort selbst.", ok: "STARTEN" }))) return;
      const r = await vbPost("/sicherheit/audit/claude_code"); return melde("✓ " + r.hinweis);
    }
  } catch (err) { melde("⚠ " + err.message); b.disabled = false; }
});
const _handleAegis = handle;
handle = function (ev) {
  if (ev.type === "sicherheit") {
    if (ev.zeigen) aegisOeffnen();
    else if (AG.el && document.body.contains(AG.el)) { aegisOeffnen(); if (ev.phase === "start") agWarten(); }
    if (!$("einst").hidden) aegisEinstAufbauen();
    return;
  }
  _handleAegis(ev);
};
async function aegisEinstAufbauen() {
  const box = $("einst-sicherheit"); if (!box) return;
  let d; try { d = await fdGet("/sicherheit/audit"); } catch (e) { return; }
  const z = d.zaehlung || {};
  box.innerHTML = (d.vorhanden ? `<div class="einst-zeile"><span><b class="ag-text-${d.ampel}">Ampel ${AG_AMPEL[d.ampel]}</b>
      <small class="im-einst-sub">${pjZeit(d.zeit)} · ${z.kritisch} kritisch · ${z.hoch} hoch · ${z.mittel} mittel · ${z.niedrig} niedrig${z.akzeptiert ? ` · ${z.akzeptiert} hingenommen` : ""}</small></span>
      <button type="button" data-ag="oeffnen">BERICHT &amp; BEHEBEN</button></div>` : `<p class="vb-hilfe">${esc(d.hinweis)}</p>`)
    + `<p class="vb-hilfe">AEGIS prüft wöchentlich rein lokal: Rechte und Befugnisse, Schlüssel im Code und in der Git-Historie, Dateirechte, offene Ports und Tailscale (Funnel = öffentlich), FileVault/Firewall/SIP/Gatekeeper/Updates/Time Machine, bekannte Schwachstellen der Abhängigkeiten, Auffälligkeiten im Protokoll und die Sicherheitstests. Kritisches meldet AEGIS sofort, der Rest landet im Entscheidungsstapel.</p>
    <p class="vb-hilfe">Behebung je Befund: <b>JARVIS behebt</b> per Klick (nach Rückfrage, danach automatische Nachprüfung) · <b>Du</b> mit Anleitung, Knopf zur Systemeinstellung und Befehl zum Kopieren · <b>Claude</b> als Auftrag für Code-Änderungen (Claude Code im Terminal oder Cowork). Bewusst Gewolltes lässt sich mit Grund 90 Tage hinnehmen.</p>
    <div class="vb-reihe"><button type="button" class="primary" data-ag="start" ${d.laeuft ? "disabled" : ""}>${d.laeuft ? "PRÜFT …" : "JETZT PRÜFEN"}</button></div>`;
}
const _einstOeffnenAG = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenAG(); aegisEinstAufbauen(); };

// ---------- Eigener Rückfrage-Dialog ----------
// window.confirm/prompt liefern in der Mac-App (WKWebView) ohne passende Swift-Methode sofort „Nein“ bzw. nichts –
// deshalb fragt JARVIS überall mit diesem Dialog nach. Rückgabe: true/false bzw. eingegebener Text oder null.
function frage({ titel = "BESTÄTIGEN", text = "", ok = "OK", abbrechen = "ABBRECHEN", eingabe = null, gefahr = false } = {}) {
  return new Promise((res) => {
    const el = document.createElement("div"); el.className = "jv-frage";
    el.innerHTML = `<div class="jv-frage-box" role="dialog" aria-modal="true"><b>${esc(titel)}</b><p>${esc(text).replace(/\n/g, "<br>")}</p>
      ${eingabe ? `<input type="text" value="${esc(eingabe.wert || "")}" placeholder="${esc(eingabe.platzhalter || "")}">` : ""}
      <div class="jv-frage-knoepfe"><button type="button" data-f="nein">${esc(abbrechen)}</button><button type="button" class="${gefahr ? "gefahr" : "primary"}" data-f="ja">${esc(ok)}</button></div></div>`;
    const inp = el.querySelector("input");
    inp?.addEventListener("input", () => inp.classList.remove("fehlt"));
    const zu = (w) => { document.removeEventListener("keydown", taste, true); el.classList.remove("an"); setTimeout(() => el.remove(), 180); res(w); };
    const ja = () => {
      if (!inp) return zu(true);
      const v = inp.value.trim();
      if (!v) { inp.classList.add("fehlt"); inp.focus(); return; }
      zu(v);
    };
    const taste = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); zu(inp ? null : false); }
      else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); ja(); }
    };
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const f = e.target.closest("[data-f]")?.dataset.f;
      if (f === "ja") ja(); else if (f === "nein" || e.target === el) zu(inp ? null : false);
    });
    document.addEventListener("keydown", taste, true);
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("an"));
    setTimeout(() => (inp || el.querySelector('[data-f="ja"]'))?.focus(), 30);
  });
}

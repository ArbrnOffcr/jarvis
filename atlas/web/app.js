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
const STILE = ["plexus", "holo", "organisch", "taktisch", "minimal"];
const STILNAME = { plexus: "PLEXUS", holo: "HOLOGRAFISCH", organisch: "ORGANISCH", taktisch: "TAKTISCH", minimal: "MINIMAL" };
let stil = "holo", klang = true;

function setStil(name, save = true) {
  stil = STILE.includes(name) ? name : "holo";
  document.body.dataset.stil = stil;
  $("stilbtn").textContent = `STIL: ${STILNAME[stil]}`;
  window.jarvis3d?.setTheme(stil);
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
window.addEventListener("jarvis3d-ready", () => window.jarvis3d.setTheme(stil));

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
      <li><button type="button" id="iphone-los" class="vb-knopf">IPHONE VERBINDEN</button> <span id="iphone-st" class="vb-hilfe"></span></li></ol>`;
    el.querySelectorAll("[data-l]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); vbLink(a.dataset.l); }));
    $("iphone-los").addEventListener("click", async () => {
      $("iphone-los").disabled = true; $("iphone-st").textContent = "Richte ein …";
      try { const r = await vbPost("/iphone/einrichten"); $("iphone-st").textContent = r.text; if (r.ok) setTimeout(iphoneBereich, 800); }
      catch (e) { $("iphone-st").textContent = "✕ " + e.message; }
      finally { if ($("iphone-los")) $("iphone-los").disabled = false; }
    });
    return;
  }
  el.innerHTML = `<div class="qr">${d.qr || ""}</div><ol>
    <li>Tailscale auf dem iPhone verbinden.</li>
    <li>QR-Code mit der Kamera scannen, in Safari öffnen.</li>
    <li>Teilen → „Zum Home-Bildschirm“ – JARVIS ist jetzt eine App.</li>
    <li>In der iPhone-App unter ⚙ den Siri-Kurzbefehl „Frag Jarvis“ laden.</li>
    ${d.qr ? "" : "<li><b>QR-Code fehlt:</b> einmal <code>jarvis iphone</code> ausführen.</li>"}</ol>`;
}
const _einstOeffnenI = window.einstellungenOeffnen;
window.einstellungenOeffnen = function () { _einstOeffnenI(); iphoneBereich(); };


// =====================================================================
//  KARTE: Orte und Routen – Globus-Anflug, leuchtende Route, HUD
// =====================================================================
const KARTE = { map: null, laden: null, el: null, anim: null, marker: [] };
function karteLib() {
  if (window.maplibregl) return Promise.resolve();
  if (KARTE.laden) return KARTE.laden;
  KARTE.laden = new Promise((res, rej) => {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "vendor/maplibre-gl.css"; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = "vendor/maplibre-gl.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
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
const STAB_NAMEN = { JARVIS: "JARVIS", ZEIT: "CHRONOS", KOM: "HERMES", DIENST: "ADJUTANT", FIN: "QUAESTOR", AKTE: "ARCHIVAR", AUFKL: "SCOUT", LOG: "QUARTIERMEISTER" };

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
          ${d.waechter ? `<span>◉ Wächter an</span>` : ""}${o.faehrt ? `<span class="ok">▶ fährt ${o.geschwindigkeit_kmh ?? ""} km/h</span>` : ""}
          ${d.kilometerstand ? `<span>${d.kilometerstand.toLocaleString("de-DE")} km</span>` : ""}</div>
        <div class="ts-ort">⌖ <b>${esc(o.name || "Standort unbekannt")}</b>${o.name ? `<button type="button" data-t="karte">AUF KARTE</button>` : ""}</div>
        <div class="ts-stand">${d.online ? "Stand " + esc(stand) : `<b>${esc(d.zustand || "schläft")}</b> · letzter Stand ${esc(stand)}`}</div></section>
    </div></div><div class="ts-status"></div>`;
}
function teslaZeigen(d) {
  TS.d = d;
  if (!TS.el) {
    TS.el = document.createElement("div"); TS.el.className = "tesla";
    TS.el.innerHTML = `<div class="ts-rahmen" role="dialog" aria-label="Fahrzeug"><header class="vt-kopf"><span class="vt-marke">◢ FAHRZEUG</span>
      <span class="vt-kapitel ts-titel"></span><button type="button" class="ts-neu" data-t="foto" title="Eigenes Foto deines Autos verwenden (Hintergrund wird automatisch entfernt)">BILD ÄNDERN</button>
      <button type="button" class="ts-neu" data-t="neu" title="Aktuelle Werte holen (weckt das Auto)">AKTUALISIEREN</button><input type="file" accept="image/*,.heic" hidden class="ts-datei">
      <button type="button" class="vt-zu" data-t="zu" title="Schließen (Esc)">✕</button></header><div class="ts-inhalt"></div></div>`;
    document.body.appendChild(TS.el);
    requestAnimationFrame(() => TS.el.classList.add("an"));
  }
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
document.addEventListener("click", (e) => {
  if (!TS.el || !e.target.closest(".tesla")) return;
  const b = e.target.closest("[data-t]"); if (!b) return;
  const t = b.dataset.t, f = (n) => TS.el.querySelector(`[data-f="${n}"]`);
  if (t === "zu") return teslaZu();
  if (t === "neu") return teslaLaden(true);
  if (t === "foto") { TS.el.querySelector(".ts-datei").click(); return; }
  if (t === "klima-an") return teslaBefehl("klima", { an: true }, "Klima wird eingeschaltet");
  if (t === "klima-aus") return teslaBefehl("klima", { an: false }, "Klima wird ausgeschaltet");
  if (t === "klima-plus" || t === "klima-minus") {
    const el = TS.el.querySelector("[data-soll]"); let v = parseFloat(el.dataset.soll) + (t === "klima-plus" ? 0.5 : -0.5);
    v = Math.min(28, Math.max(15, v)); el.dataset.soll = v; el.textContent = String(v).replace(".0", "") + "°";
    clearTimeout(TS.tempT); TS.tempT = setTimeout(() => teslaBefehl("klima", { an: true, temperatur: v }, `Klima auf ${v} °C`), 1200); return;
  }
  if (t === "laden-start") return teslaBefehl("laden", { aktion: "start" }, "Laden wird gestartet");
  if (t === "laden-stop") return teslaBefehl("laden", { aktion: "stop" }, "Laden wird gestoppt");
  if (t === "limit") return teslaBefehl("laden", { aktion: "limit", prozent: +f("limit").value }, `Ladelimit ${f("limit").value} %`);
  if (t === "plan") {
    const modus = f("modus").value, uhrzeit = f("uhrzeit").value;
    return teslaBefehl("ladeplan", { modus, uhrzeit, vorklimatisieren: f("vorklima").checked },
      modus === "aus" ? "Ladeplan wird ausgeschaltet" : `Ladeplan: ${modus === "abfahrt" ? "Abfahrt" : "Ladestart"} ${uhrzeit}`);
  }
  if (t === "karte" && TS.d?.ort?.name) { teslaZu(); sendText(`Zeig ${TS.d.ort.name} auf der Karte`); }
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
    const r = await fetch("/tesla/bild", { method: "POST", body: f, headers: { "x-dateiname": encodeURIComponent(f.name).replace(/%20/g, " "),
      ...(TOKEN ? { "x-atlas-token": TOKEN } : {}) } });
    const j = await r.json(); if (!r.ok) throw new Error(j.detail || r.status);
    TS.bildV = Date.now(); if (TS.d) { TS.d.eigenes_bild = true; teslaZeigen(TS.d); }
    const st2 = TS.el.querySelector(".ts-status"); st2.textContent = j.text; st2.className = "ts-status ok";
  } catch (err) { st.textContent = "⚠ " + err.message; st.className = "ts-status fehler"; }
  e.target.value = "";
});

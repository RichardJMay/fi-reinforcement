// --- Parameters ---
const FI_SECONDS = 8;     // FI 5s schedule
const SESSION_SECONDS = 90;

const targetBtn = document.getElementById("target");
const startBtn  = document.getElementById("start");
const resetBtn  = document.getElementById("reset");

const timerEl   = document.getElementById("timer");
const pointsEl  = document.getElementById("points");

const resultsEl = document.getElementById("results");
const clickEl   = document.getElementById("clickCount");
const pointEl   = document.getElementById("pointCount");

const canvas    = document.getElementById("cumRecord");
const ctx       = canvas.getContext("2d");

// --- State ---
let running = false;
let sessionStartMs = null;
let tickInterval = null;

let totalClicks = 0;
let points = 0;

// For FI: next time when reinforcement becomes available
let nextAvailableMs = null;
let reinforcerAvailable = false;

// Data for cumulative record (timeSeconds, cumulativeResponses)
let cumData = [];

// --- Helpers ---
function nowMs() { return performance.now(); }

function setTimerDisplay(remainingSeconds) {
  timerEl.textContent = `${remainingSeconds.toFixed(1)}s`;
}

function endSession() {
  running = false;
  targetBtn.disabled = true;
  startBtn.disabled = false;

  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;

  // Reveal end-of-session info
  clickEl.textContent = String(totalClicks);
  pointEl.textContent = String(points);
  resultsEl.classList.remove("hidden");

  drawCumulativeRecord();
}

function resetAll() {
  running = false;
  sessionStartMs = null;

  totalClicks = 0;
  points = 0;
  pointsEl.textContent = "0";

  nextAvailableMs = null;
  reinforcerAvailable = false;

  cumData = [];

  setTimerDisplay(SESSION_SECONDS);
  targetBtn.disabled = true;
  startBtn.disabled = false;
  resultsEl.classList.add("hidden");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

 // Draw in white so it's visible on dark background
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";

function scheduleTick() {
  const elapsed = (nowMs() - sessionStartMs) / 1000;
  const remaining = Math.max(0, SESSION_SECONDS - elapsed);
  setTimerDisplay(remaining);

  // FI availability: when time crosses nextAvailableMs, reinforcer becomes available
  const tMs = nowMs();
  if (tMs >= nextAvailableMs) reinforcerAvailable = true;

  if (elapsed >= SESSION_SECONDS) endSession();
}

function startSession() {
  resetAll(); // resets display & counts
  running = true;

  resultsEl.classList.add("hidden");
  startBtn.disabled = true;
  targetBtn.disabled = false;

  sessionStartMs = nowMs();

  // FI: first interval starts immediately, so reinforcement becomes available after 5 seconds
  nextAvailableMs = sessionStartMs + FI_SECONDS * 1000;
  reinforcerAvailable = false;

  // Seed cumulative record with 0 at time 0
  cumData.push({ t: 0, r: 0 });

  // update timer ~10 times/second
  tickInterval = setInterval(scheduleTick, 100);
  scheduleTick();
}

function recordResponse() {
  if (!running) return;

  const t = (nowMs() - sessionStartMs) / 1000;
  totalClicks += 1;

  // Store cumulative response point
  cumData.push({ t, r: totalClicks });

  // FI rule: first response AFTER interval completion earns 1 point
  if (reinforcerAvailable) {
    points += 1;
    pointsEl.textContent = String(points);

    // After reinforcement, start next interval from *this* response time (standard FI reset)
    reinforcerAvailable = false;
    nextAvailableMs = nowMs() + FI_SECONDS * 1000;
  }
}

// --- Cumulative record drawing (revealed at end) ---
function drawCumulativeRecord() {
  // Set internal canvas size in case CSS scales it
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Padding for axes
  const padL = 50, padR = 20, padT = 20, padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Determine max values
  const maxT = SESSION_SECONDS;
  const maxR = 250; // fixed Y-axis max for consistency

  // Axes
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  // Labels
  ctx.font = "14px system-ui";
  ctx.fillText("Responses", 8, padT + 14);
  ctx.fillText("Time (s)", padL + plotW/2 - 25, padT + plotH + 32);

  // Ticks (every 5s)
  ctx.lineWidth = 1;
  for (let t = 0; t <= maxT; t += 5) {
    const x = padL + (t / maxT) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT + plotH);
    ctx.lineTo(x, padT + plotH + 6);
    ctx.stroke();
    ctx.fillText(String(t), x - 5, padT + plotH + 22);
  }

  // Response ticks (up to 5 labels)
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const r = Math.round((i / steps) * maxR);
    const y = padT + plotH - (r / maxR) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL - 6, y);
    ctx.lineTo(padL, y);
    ctx.stroke();
    ctx.fillText(String(r), padL - 38, y + 5);
  }

  // Plot cumulative record line
  ctx.lineWidth = 2;
  ctx.beginPath();

  // ensure a final point at 30s for the last count
  const data = [...cumData];
  if (data.length === 0) data.push({ t: 0, r: 0 });
  const last = data[data.length - 1];
  if (last.t < SESSION_SECONDS) data.push({ t: SESSION_SECONDS, r: last.r });

  data.forEach((p, idx) => {
    const x = padL + (p.t / maxT) * plotW;
    const y = padT + plotH - (p.r / maxR) * plotH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

// --- Wire up UI ---
startBtn.addEventListener("click", startSession);
targetBtn.addEventListener("click", recordResponse);

// If reset button exists (only after end), connect it safely
if (resetBtn) resetBtn.addEventListener("click", resetAll);

// Initial display
resetAll();
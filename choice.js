// --- Parameters ---
const SESSION_SECONDS = 90;

// --- Elements ---
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");

const btnNoLoss = document.getElementById("btnNoLoss");
const btn5 = document.getElementById("btn5");
const btn10 = document.getElementById("btn10");
const btn20 = document.getElementById("btn20");

const resultsEl = document.getElementById("results");
const countNoLossEl = document.getElementById("countNoLoss");
const count5El = document.getElementById("count5");
const count10El = document.getElementById("count10");
const count20El = document.getElementById("count20");

const canvas = document.getElementById("barChart");
const ctx = canvas.getContext("2d");

// --- State ---
let running = false;
let sessionStartMs = null;
let tickInterval = null;

let counts = {
  noLoss: 0,
  s5: 0,
  s10: 0,
  s20: 0
};

function nowMs() { return performance.now(); }

function setTimerDisplay(remainingSeconds) {
  timerEl.textContent = remainingSeconds.toFixed(1);
}

function setButtonsEnabled(enabled) {
  btnNoLoss.disabled = !enabled;
  btn5.disabled = !enabled;
  btn10.disabled = !enabled;
  btn20.disabled = !enabled;
}

function resetAll() {
  running = false;
  sessionStartMs = null;

  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;

  counts = { noLoss: 0, s5: 0, s10: 0, s20: 0 };

  setTimerDisplay(SESSION_SECONDS);
  startBtn.disabled = false;
  setButtonsEnabled(false);

  resultsEl.classList.add("hidden");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function endSession() {
  running = false;

  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;

  setButtonsEnabled(false);
  startBtn.disabled = false;

  // Show totals
  countNoLossEl.textContent = String(counts.noLoss);
  count5El.textContent = String(counts.s5);
  count10El.textContent = String(counts.s10);
  count20El.textContent = String(counts.s20);

  resultsEl.classList.remove("hidden");
  drawBarChart();
}

function scheduleTick() {
  const elapsed = (nowMs() - sessionStartMs) / 1000;
  const remaining = Math.max(0, SESSION_SECONDS - elapsed);
  setTimerDisplay(remaining);

  if (elapsed >= SESSION_SECONDS) endSession();
}

function startSession() {
  resetAll();

  running = true;
  sessionStartMs = nowMs();

  startBtn.disabled = true;
  setButtonsEnabled(true);
  resultsEl.classList.add("hidden");

  tickInterval = setInterval(scheduleTick, 100);
  scheduleTick();
}

function press(which) {
  if (!running) return;
  counts[which] += 1;
}

// --- Drawing ---
function drawBarChart() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // White text/lines for dark canvas
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";

  const labels = ["No loss", "5s", "10s", "20s"];
  const values = [counts.noLoss, counts.s5, counts.s10, counts.s20];

  const maxV = Math.max(1, ...values);

  // Layout
  const padL = 60, padR = 20, padT = 20, padB = 50;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // Axes
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  // Y ticks
  ctx.font = "14px system-ui";
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const v = Math.round((i / steps) * maxV);
    const y = padT + plotH - (v / maxV) * plotH;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL - 6, y);
    ctx.lineTo(padL, y);
    ctx.stroke();
    ctx.fillText(String(v), padL - 45, y + 5);
  }

  // Bars
  const barCount = values.length;
  const gap = 24;
  const barW = (plotW - gap * (barCount - 1)) / barCount;

  values.forEach((v, i) => {
    const x = padL + i * (barW + gap);
    const barH = (v / maxV) * plotH;
    const y = padT + plotH - barH;

    // Fill bars in white for high contrast
    ctx.globalAlpha = 1;
    ctx.fillRect(x, y, barW, barH);

    // Label under bars
    ctx.globalAlpha = 1;
    const labelX = x + barW / 2;
    ctx.textAlign = "center";
    ctx.fillText(labels[i], labelX, padT + plotH + 30);

    // Value above bars
    ctx.fillText(String(v), labelX, Math.max(padT + 14, y - 8));
    ctx.textAlign = "start";
  });

  // Title
  ctx.textAlign = "start";
  ctx.font = "16px system-ui";
  ctx.fillText("Presses per option", padL, padT + 14);
}

// --- Events ---
startBtn.addEventListener("click", startSession);
if (resetBtn) resetBtn.addEventListener("click", resetAll);

btnNoLoss.addEventListener("click", () => press("noLoss"));
btn5.addEventListener("click", () => press("s5"));
btn10.addEventListener("click", () => press("s10"));
btn20.addEventListener("click", () => press("s20"));

resetAll();
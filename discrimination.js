const pointsEl = document.getElementById("points");

const circleBtn = document.getElementById("circle");
const squareBtn = document.getElementById("square");
const triangleBtn = document.getElementById("triangle");
const diamondBtn = document.getElementById("diamond");

let points = 0;

function render() {
  pointsEl.textContent = String(points);
}

function addPoint() {
  points += 1;
  render();
}

function subtractPoint() {
  points = Math.max(0, points - 1); // never below 0
  render();
}

circleBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); addPoint(); });
squareBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); subtractPoint(); });
triangleBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); subtractPoint(); });
diamondBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); subtractPoint(); });

render();
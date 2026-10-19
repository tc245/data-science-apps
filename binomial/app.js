import { distribution } from "./binomial.js";
import { explain } from "../shared/explain.js";
import { TEXT, WORDS, prob } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { n: 100, p: 0.5, k: 64, thing: "coin" };
const PRESETS = {
  coin64: { n: 100, p: 0.5, k: 64, thing: "coin" },
  coin10: { n: 10, p: 0.5, k: 8, thing: "coin" },
  datazone: { n: 23, p: 0.15, k: 2, thing: "datazone" },
};

// ---------------------------------------------------------------- the chart
const W = 720, H = 340, M = { left: 70, right: 16, top: 14, bottom: 52 };
const plotW = W - M.left - M.right, plotH = H - M.top - M.bottom;
// A tidy gap between the axis labels: 1, 2 or 5 times a power of ten, giving about `count` labels.
const step = (max, count) => { const raw = max / count, ten = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((m) => m * ten).find((s) => s >= raw); };

function drawChart(s) {
  const top = Math.max(...s.d.prob), yStep = step(top, 5), yMax = Math.ceil(top / yStep) * yStep;
  const bar = plotW / (s.n + 1);
  const sx = (k) => M.left + (k + 0.5) * bar;
  const sy = (v) => M.top + plotH - (v / yMax) * plotH;
  let out = "";
  for (let y = 0; y <= yMax + 1e-12; y += yStep) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 8}" y="${sy(y) + 5}" text-anchor="end">${+y.toFixed(4)}</text>`;
  }
  const xStep = Math.max(1, step(s.n, 10));
  for (let k = 0; k <= s.n; k += xStep) out += `<text x="${sx(k)}" y="${H - M.bottom + 22}" text-anchor="middle">${k}</text>`;
  out += `<text class="axis-title" x="${M.left + plotW / 2}" y="${H - 8}" text-anchor="middle">Number of ${s.w.many} out of ${s.n}</text>`;
  out += `<text class="axis-title" transform="translate(16 ${M.top + plotH / 2}) rotate(-90)" text-anchor="middle">Probability</text>`;
  const gap = bar > 4 ? Math.min(2, bar * 0.15) : 0;
  out += s.d.prob.map((v, k) => `<rect class="bar${k === s.k ? " picked" : ""}" x="${sx(k) - bar / 2 + gap / 2}" y="${sy(v)}" width="${bar - gap}" height="${sy(0) - sy(v)}"/>`).join("");
  // Bars too thin to click on still get a marker above them.
  out += `<path class="marker" d="M${sx(s.k)},${sy(s.d.prob[s.k]) - 4} l-6,-10 h12 z"/>`;
  out += `<line class="expected" x1="${sx(s.n * s.p)}" x2="${sx(s.n * s.p)}" y1="${M.top}" y2="${sy(0)}"/>`;
  $("chart").innerHTML = out;
  $("chart-desc").textContent = TEXT.describe(s);
}

// ---------------------------------------------------------------- the panel
function render() {
  const { n, p } = state, k = Math.min(state.k, n), w = WORDS[state.thing];
  const d = distribution(n, p);
  const mode = d.prob.indexOf(Math.max(...d.prob));
  // The middle 95%: the results we would not be surprised by.
  const range = [d.atMost.findIndex((v) => v >= 0.025), d.atLeast.findLastIndex((v) => v >= 0.025)];
  const above = k / n >= p;
  const d100 = distribution(100, p), k100 = above ? Math.ceil((k / n) * 100) : Math.floor((k / n) * 100);
  const s = {
    n, p, k, w, d, mode, range,
    tail: Math.min(d.atMost[k], d.atLeast[k]) < 0.025,
    squashed: n * p < 10 || n * (1 - p) < 10,
    extreme: above ? d.atLeast[k] : d.atMost[k],
    extreme100: above ? d100.atLeast[k100] : d100.atMost[k100],
  };

  $("n").value = n; $("n-value").textContent = n; $("n-label").textContent = `Number of ${w.tries}`;
  $("p").value = p; $("p-value").textContent = p; $("p-label").textContent = w.p;
  $("k").max = n; $("k").value = k; $("k-value").textContent = k; $("k-label").textContent = `Number of ${w.many} we are asking about`;

  const args = `size = ${n}, prob = ${p}`;
  $("prob-table").innerHTML =
    `<thead><tr><th scope="col">What is the probability of...</th><th scope="col">In R</th><th scope="col" class="num">Probability</th></tr></thead><tbody>` +
    [[`exactly ${k}`, `dbinom(${k}, ${args})`, d.prob[k]],
     [`${k} or fewer`, `pbinom(${k}, ${args})`, d.atMost[k]],
     [`${k} or more`, `pbinom(${k - 1}, ${args}, lower.tail = FALSE)`, d.atLeast[k]]]
      .map(([q, code, v]) => `<tr><td>${q} ${k === 1 && q.startsWith("exactly") ? w.one : w.many}</td><td><code>${code}</code></td><td class="num">${prob(v)}</td></tr>`).join("") + `</tbody>`;

  drawChart(s);
  const key = state.thing === "datazone" ? "datazone" : n <= 20 ? "few" : p !== 0.5 ? "skew" : "fair";
  explain(key, TEXT.explain[key](s));
}

// ---------------------------------------------------------------- events
for (const key of ["n", "p", "k"]) $(key).addEventListener("input", (e) => { state[key] = Number(e.target.value); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-preset]");
  if (b) { Object.assign(state, PRESETS[b.dataset.preset]); render(); }
});
// Clicking (or dragging across) the chart picks the number of tails under the pointer.
const pick = (e) => {
  const box = $("chart").getBoundingClientRect(), x = (e.clientX - box.left) * (W / box.width);
  const k = Math.round((x - M.left) / (plotW / (state.n + 1)) - 0.5);
  if (k >= 0 && k <= state.n && k !== state.k) { state.k = k; render(); }
};
$("chart").addEventListener("pointerdown", pick);
$("chart").addEventListener("pointermove", (e) => { if (e.buttons) pick(e); });

$("intro").innerHTML = TEXT.intro;
render();

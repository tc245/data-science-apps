import { DATA } from "./data.js";
import { lm, predict } from "../shared/model.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { model: "simple", colour: false, retailers: 2, rank: 800 };

// ---------------------------------------------------------------- the data and the two models
const [retailers, smoking, rank] = [0, 1, 2].map((j) => DATA.map((row) => row[j]));
const m1 = lm(smoking, [retailers]);
const m2 = lm(smoking, [retailers, rank]);

// Three equal groups by deprivation rank (rank 1 is the most deprived).
const sortedRanks = [...rank].sort((a, b) => a - b);
const cuts = [sortedRanks[Math.floor(DATA.length / 3)], sortedRanks[Math.floor((2 * DATA.length) / 3)]];
const GROUPS = ["most", "mid", "least"];
const groupOf = (k) => (k < cuts[0] ? "most" : k < cuts[1] ? "mid" : "least");
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const g = Object.fromEntries(GROUPS.map((name) => {
  const rows = DATA.filter((row) => groupOf(row[2]) === name);
  return [name, { retailers: mean(rows.map((r) => r[0])), smoking: mean(rows.map((r) => r[1])), rank: mean(rows.map((r) => r[2])) }];
}));

// ---------------------------------------------------------------- the chart
const W = 720, H = 440, M = { left: 62, right: 18, top: 14, bottom: 56 };
const X_MAX = 16, Y_MAX = 70;
const sx = (v) => M.left + (v / X_MAX) * (W - M.left - M.right);
const sy = (v) => H - M.bottom - (v / Y_MAX) * (H - M.top - M.bottom);
const line = (cls, x0, y0, x1, y1) => `<line class="${cls}" x1="${sx(x0)}" y1="${sy(y0)}" x2="${sx(x1)}" y2="${sy(y1)}"/>`;

function axes() {
  let out = "";
  for (let y = 0; y <= Y_MAX; y += 10) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 9}" y="${sy(y) + 5}" text-anchor="end">${y}</text>`;
  }
  for (let x = 0; x <= X_MAX; x += 2) out += `<text x="${sx(x)}" y="${H - M.bottom + 21}" text-anchor="middle">${x}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 8}" text-anchor="middle">Tobacco retailers per 1,000 people (retailers_adj)</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">Smoking rate, % (smoking_rate)</text>`;
  return out;
}

// A fitted line with a halo so it stands out from the dots, and a label at its right-hand end.
function fitted(cls, x1, intercept, slope, label) {
  const y1 = intercept + slope * x1;
  return line("halo", 0, intercept, x1, y1) + line(`fit-line ${cls}`, 0, intercept, x1, y1) +
    (label ? `<text class="line-label" x="${sx(x1)}" y="${sy(y1) - 9}" text-anchor="end">${label}</text>` : "");
}

function drawChart() {
  const coloured = state.colour || state.model === "adjusted";
  let out = axes();
  out += DATA.map(([x, y, k]) => `<circle class="dot ${coloured ? groupOf(k) : ""}" cx="${sx(x)}" cy="${sy(y)}" r="3.2"/>`).join("");

  if (state.model === "simple") {
    out += fitted("", X_MAX, m1.coef[0], m1.coef[1], "Model 1");
  } else {
    out += line("fit-line ghost", 0, m1.coef[0], X_MAX, m1.coef[0] + m1.coef[1] * X_MAX);
    out += `<text class="line-label" x="${sx(X_MAX)}" y="${sy(m1.coef[0] + m1.coef[1] * X_MAX) - 9}" text-anchor="end">Model 1</text>`;
    for (const name of GROUPS) {
      out += fitted(name, X_MAX, m2.coef[0] + m2.coef[2] * g[name].rank, m2.coef[1], TEXT.groups[name]);
    }
  }
  out += `<circle class="predicted" cx="${sx(state.retailers)}" cy="${sy(prediction())}" r="7"/>`;
  out += `<circle class="hover" id="hover" r="6" visibility="hidden"/>`;
  $("chart").innerHTML = out;

  $("chart-desc").textContent = state.model === "simple" ? TEXT.chartDescription.simple(m1) : TEXT.chartDescription.adjusted(m1, m2);
  $("legend").innerHTML =
    (coloured ? GROUPS.map((name) => `<li><span class="swatch round ${name}"></span>${TEXT.groups[name]}</li>`).join("") : "") +
    (state.model === "adjusted" ? `<li><span class="swatch ghost"></span>Model 1 (for comparison)</li>` : `<li><span class="swatch line"></span>Model 1</li>`) +
    `<li><span class="swatch predicted"></span>The model's prediction</li>`;
}

// ---------------------------------------------------------------- the model panel
const prediction = () => (state.model === "simple" ? predict(m1, [state.retailers]) : predict(m2, [state.retailers, state.rank]));
// Enough decimal places to see the number: simd_rank's coefficient is tiny.
const fmt = (v) => (Math.abs(v) < 0.1 ? v.toFixed(4) : v.toFixed(2));

function drawModel() {
  const m = state.model === "simple" ? m1 : m2;
  const terms = state.model === "simple" ? ["(Intercept)", "retailers_adj"] : ["(Intercept)", "retailers_adj", "simd_rank"];
  $("code").textContent = TEXT.code[state.model];
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col"></th><th scope="col" class="num">Estimate</th><th scope="col" class="num">95% CI</th></tr></thead><tbody>` +
    terms.map((t, i) => `<tr><td><code>${t}</code></td><td class="num">${fmt(m.coef[i])}</td><td class="num">${fmt(m.ci[i][0])} to ${fmt(m.ci[i][1])}</td></tr>`).join("") +
    `</tbody>`;
  $("fit").innerHTML = TEXT.fit(m);

  $("rank").disabled = state.model === "simple";
  $("retailers-value").textContent = state.retailers.toFixed(1);
  $("rank-value").textContent = state.rank;
  $("prediction").textContent = `${prediction().toFixed(1)}%`;
  $("equation").textContent = state.model === "simple"
    ? `${fmt(m.coef[0])} + (${fmt(m.coef[1])} × ${state.retailers.toFixed(1)}) = ${prediction().toFixed(1)}`
    : `${fmt(m.coef[0])} + (${fmt(m.coef[1])} × ${state.retailers.toFixed(1)})\n      + (${fmt(m.coef[2])} × ${state.rank}) = ${prediction().toFixed(1)}`;
  $("prediction-note").textContent = TEXT.predictionNote[state.model];
}

function render() {
  document.querySelectorAll("[data-model]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.model === state.model)));
  // Model 2's lines only make sense with the colours on.
  $("colour").checked = state.colour || state.model === "adjusted";
  $("colour").disabled = state.model === "adjusted";
  drawChart();
  drawModel();
  const step = state.model === "adjusted" ? "adjusted" : state.colour ? "coloured" : "simple";
  explain(step, TEXT.explain[step](m1, m2, g));
}

// ---------------------------------------------------------------- events
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-model]");
  if (b) { state.model = b.dataset.model; render(); }
});
$("colour").addEventListener("change", (e) => { state.colour = e.target.checked; render(); });
$("retailers").addEventListener("input", (e) => { state.retailers = Number(e.target.value); drawChart(); drawModel(); });
$("rank").addEventListener("input", (e) => { state.rank = Number(e.target.value); drawChart(); drawModel(); });

// Hovering shows the nearest datazone.
$("chart").addEventListener("pointermove", (e) => {
  const box = $("chart").getBoundingClientRect();
  const scale = W / box.width;
  const px = (e.clientX - box.left) * scale, py = (e.clientY - box.top) * scale;
  let best = null, bestD = 18 ** 2;
  for (const row of DATA) {
    const d = (sx(row[0]) - px) ** 2 + (sy(row[1]) - py) ** 2;
    if (d < bestD) { bestD = d; best = row; }
  }
  const tip = $("tip"), hover = $("hover");
  if (!best) { tip.hidden = true; hover.setAttribute("visibility", "hidden"); return; }
  hover.setAttribute("cx", sx(best[0])); hover.setAttribute("cy", sy(best[1])); hover.setAttribute("visibility", "visible");
  tip.innerHTML = `Retailers per 1,000 people: <b>${best[0].toFixed(1)}</b><br>Smoking rate: <b>${best[1].toFixed(1)}%</b><br>Deprivation rank: <b>${best[2]}</b> (${TEXT.groups[groupOf(best[2])].toLowerCase()})`;
  tip.hidden = false;
  const left = sx(best[0]) / scale, top = sy(best[1]) / scale;
  tip.style.left = `${Math.min(left + 12, box.width - tip.offsetWidth - 4)}px`;
  tip.style.top = `${Math.max(top - tip.offsetHeight - 10, 0)}px`;
});
$("chart").addEventListener("pointerleave", () => { $("tip").hidden = true; $("hover").setAttribute("visibility", "hidden"); });

$("intro").textContent = TEXT.intro(m1, m2);
render();

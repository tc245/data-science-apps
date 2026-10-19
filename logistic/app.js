import { DATA } from "./data.js";
import { lm, glm } from "../shared/model.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { cut: 20, scale: "probability", showLinear: true };
const SCALES = { probability: "Probability", odds: "Odds", logodds: "Log-odds" };

// ---------------------------------------------------------------- the data and the models
const rank = DATA.map((r) => r[0]), rate = DATA.map((r) => r[1]);
const order = rank.map((_, i) => i).sort((a, b) => rank[a] - rank[b]);
// Ten groups of datazones, from the most to the least deprived.
const tenths = Array.from({ length: 10 }, (_, g) => order.slice(Math.round((g * DATA.length) / 10), Math.round(((g + 1) * DATA.length) / 10)));
const fitAt = (cut) => {
  const y = rate.map((v) => (v >= cut ? 1 : 0));
  return { y, m: glm(y, [rank]), lin: lm(y, [rank]) };
};
const at20 = fitAt(20);

// ---------------------------------------------------------------- the chart
const W = 720, H = 420, M = { left: 70, right: 18, top: 14, bottom: 56 }, X_MAX = 1600;
const sx = (v) => M.left + (v / X_MAX) * (W - M.left - M.right);
const step = (span, count) => { const raw = span / count, ten = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 2.5, 5, 10].map((m) => m * ten).find((s) => s >= raw); };
const toScale = { probability: (p) => p, odds: (p) => p / (1 - p), logodds: (p) => Math.log(p / (1 - p)) };
// A small up-and-down spread for the 0s and 1s, so they don't all sit on one line (the same every time).
const wobble = DATA.map((_, i) => (((i * 0.6180339887) % 1) - 0.5) * 0.06);

function drawChart(s) {
  const curve = Array.from({ length: 81 }, (_, j) => { const x = (j / 80) * X_MAX; return [x, toScale[s.scale](1 / (1 + Math.exp(-(s.m.coef[0] + s.m.coef[1] * x))))]; });
  const props = tenths.map((g) => [g.reduce((t, i) => t + rank[i], 0) / g.length, g.reduce((t, i) => t + s.y[i], 0) / g.length]);
  // A tenth with no 1s (or only 1s) has odds of 0 (or infinity), so it can't go on the odds or log-odds plots.
  const circles = props.filter(([, p]) => s.scale === "probability" || (p > 0 && p < 1)).map(([x, p]) => [x, toScale[s.scale](p)]);

  let lo, hi, yStep;
  if (s.scale === "probability") { lo = -0.2; hi = 1.2; yStep = 0.2; }
  else {
    const ys = [...curve, ...circles].map(([, v]) => v);
    yStep = step(Math.max(...ys) - Math.min(0, ...ys), 6);
    lo = s.scale === "odds" ? 0 : Math.floor(Math.min(...ys) / yStep) * yStep;
    hi = Math.ceil(Math.max(...ys) / yStep) * yStep;
  }
  const sy = (v) => H - M.bottom - ((v - lo) / (hi - lo)) * (H - M.top - M.bottom);

  let out = `<clipPath id="clip"><rect x="${M.left}" y="${M.top}" width="${W - M.left - M.right}" height="${H - M.top - M.bottom}"/></clipPath>`;
  if (s.scale === "probability") {
    out += `<rect class="impossible" x="${M.left}" y="${sy(0)}" width="${W - M.left - M.right}" height="${sy(lo) - sy(0)}"/><text class="impossible-label" x="${W - M.right - 8}" y="${sy(lo) - 10}" text-anchor="end">Impossible: probabilities can't go below 0</text>`;
    out += `<rect class="impossible" x="${M.left}" y="${sy(hi)}" width="${W - M.left - M.right}" height="${sy(1) - sy(hi)}"/><text class="impossible-label" x="${W - M.right - 8}" y="${sy(hi) + 20}" text-anchor="end">Impossible: probabilities can't go above 1</text>`;
  }
  for (let y = lo; y <= hi + 1e-9; y += yStep) {
    out += `<line class="grid${Math.abs(y) < 1e-9 ? " zero" : ""}" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 8}" y="${sy(y) + 5}" text-anchor="end">${+y.toFixed(3)}</text>`;
  }
  for (let x = 0; x <= X_MAX; x += 200) out += `<text x="${sx(x)}" y="${H - M.bottom + 22}" text-anchor="middle">${x}</text>`;
  out += `<text class="axis-title" x="${M.left + (W - M.left - M.right) / 2}" y="${H - 8}" text-anchor="middle">SIMD rank (1 = most deprived)</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">${s.scaleName} of a smoking rate of ${s.cut}% or more</text>`;

  let inside = "";
  if (s.scale === "probability") {
    inside += DATA.map((_, i) => `<circle class="dot${s.y[i] ? " one" : ""}" cx="${sx(rank[i])}" cy="${sy(s.y[i] + (s.y[i] ? -1 : 1) * Math.abs(wobble[i]))}" r="2.6"/>`).join("");
    if (s.showLinear) {
      const [b0, b1] = s.lin.coef;
      inside += `<line class="linear" x1="${sx(0)}" x2="${sx(X_MAX)}" y1="${sy(b0)}" y2="${sy(b0 + b1 * X_MAX)}"/>`;
    }
  }
  const path = `M${curve.map(([x, v]) => `${sx(x)},${sy(v)}`).join("L")}`;
  inside += `<path class="halo" d="${path}"/><path class="fit-line" d="${path}"/>`;
  inside += circles.map(([x, v]) => `<circle class="tenth" cx="${sx(x)}" cy="${sy(v)}" r="6"/>`).join("");
  out += `<g clip-path="url(#clip)">${inside}</g>`;
  $("chart").innerHTML = out;
  $("chart-desc").textContent = TEXT.describe(s);
}

// ---------------------------------------------------------------- the panel
function render() {
  const { y, m, lin } = fitAt(state.cut);
  const fitted = rank.map((r) => lin.coef[0] + lin.coef[1] * r);
  const s = {
    ...state, y, m, lin, m20: at20.m, n: DATA.length, scaleName: SCALES[state.scale],
    ones: y.reduce((t, v) => t + v, 0), ones20: at20.y.reduce((t, v) => t + v, 0),
    below: fitted.filter((v) => v < 0).length, above: fitted.filter((v) => v > 1).length,
  };

  $("cut").value = state.cut; $("cut-value").textContent = $("cut-title").textContent = `${state.cut}%`;
  document.querySelectorAll("[data-scale]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scale === state.scale)));
  $("show-linear").checked = state.showLinear;
  $("show-linear").disabled = state.scale !== "probability";
  document.querySelectorAll("[data-for]").forEach((li) => { li.hidden = li.dataset.for === "probability" ? state.scale !== "probability" : li.dataset.for === "linear" ? state.scale !== "probability" || !state.showLinear : false; });

  $("code").textContent = TEXT.code(state.cut);
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col"></th><th scope="col" class="num">Estimate</th><th scope="col" class="num">Std. Error</th><th scope="col" class="num">z value</th></tr></thead><tbody>` +
    ["(Intercept)", "simd_rank"].map((name, i) => `<tr><td><code>${name}</code></td><td class="num">${m.coef[i].toPrecision(4)}</td><td class="num">${m.se[i].toPrecision(4)}</td><td class="num">${(m.coef[i] / m.se[i]).toFixed(2)}</td></tr>`).join("") + `</tbody>`;
  $("aic").innerHTML = `AIC: <b>${m.aic.toFixed(2)}</b>`;
  $("odds-table").innerHTML =
    `<thead><tr><th scope="col">Going up by</th><th scope="col" class="num">Odds multiplied by</th><th scope="col" class="num">Change in odds</th></tr></thead><tbody>` +
    TEXT.oddsRows(m.coef[1]).map(([d, r, c]) => `<tr><td>${d} rank${d === "1" ? "" : "s"}</td><td class="num">${r}</td><td class="num">${c}</td></tr>`).join("") + `</tbody>`;
  $("linear").innerHTML = TEXT.linear(s);

  drawChart(s);
  const key = state.scale !== "probability" ? state.scale : state.cut !== 20 ? "cut" : "probability";
  explain(key, TEXT.explain[key](s));
}

// ---------------------------------------------------------------- events
$("cut").addEventListener("input", (e) => { state.cut = Number(e.target.value); render(); });
$("show-linear").addEventListener("change", (e) => { state.showLinear = e.target.checked; render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-scale], [data-reset]");
  if (!b) return;
  if (b.dataset.scale) state.scale = b.dataset.scale; else Object.assign(state, { cut: 20, scale: "probability", showLinear: true });
  render();
});

$("intro").innerHTML = TEXT.intro;
render();

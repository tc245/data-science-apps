import { simulate, fit, coverage, trueRatio, TRUE } from "./counts.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { offset: true, extra: 0, seed: 1 };

// ---------------------------------------------------------------- the two plots
const W = 360, H = 280, M = { left: 54, right: 24, top: 10, bottom: 46 }, X_MAX = 1600;
const sx = (v) => M.left + (v / X_MAX) * (W - M.left - M.right);

function draw(id, { yMax, yStep, yTitle, ys, lines = () => "" }) {
  const sy = (v) => H - M.bottom - (Math.min(v, yMax) / yMax) * (H - M.top - M.bottom);
  let out = "";
  for (let y = 0; y <= yMax; y += yStep) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 8}" y="${sy(y) + 5}" text-anchor="end">${y}</text>`;
  }
  for (let x = 0; x <= X_MAX; x += 400) out += `<text x="${sx(x)}" y="${H - M.bottom + 20}" text-anchor="middle">${x}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 6}" text-anchor="middle">SIMD rank (1 = most deprived)</text>`;
  out += `<text class="axis-title" transform="translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">${yTitle}</text>`;
  out += ys.map(([x, y]) => `<circle class="dot" cx="${sx(x)}" cy="${sy(y)}" r="3"/>`).join("");
  out += lines(sy);
  $(id).innerHTML = out;
}
const curve = (fn, sy, cls) => `<path class="${cls}" d="M${Array.from({ length: 41 }, (_, j) => { const x = (j / 40) * X_MAX; return `${sx(x)},${sy(fn(x))}`; }).join("L")}"/>`;

function drawCharts(s) {
  const { rank, women, smokers } = s.data;
  draw("women", { yMax: 70, yStep: 10, yTitle: "Pregnant women", ys: rank.map((k, i) => [k, women[i]]) });
  $("women-desc").textContent = TEXT.describe.women();
  const [b0, b1] = s.m.coef;
  if (s.offset) {
    draw("smokers", {
      yMax: 70, yStep: 10, yTitle: "Smoking rate (%)", ys: rank.map((k, i) => [k, (100 * smokers[i]) / women[i]]),
      // The true rate goes on top, so you can still see it where the model gets it right.
      lines: (sy) => curve((x) => 100 * Math.exp(b0 + b1 * x), sy, "fit-line") + curve((x) => 100 * Math.exp(TRUE.intercept + TRUE.slope * x), sy, "truth"),
    });
  } else {
    // Without the offset the model predicts a number of smokers, so that is what we plot.
    draw("smokers", { yMax: 40, yStep: 5, yTitle: "Number of smokers", ys: rank.map((k, i) => [k, smokers[i]]), lines: (sy) => curve((x) => Math.exp(b0 + b1 * x), sy, "fit-line") });
  }
  $("smokers-title").textContent = s.offset ? "Smoking rate" : "Number of smokers";
  $("smokers-desc").textContent = TEXT.describe.smokers(s);
}

// ---------------------------------------------------------------- the panel
function render() {
  const data = simulate(state.seed, state.extra);
  const m = fit(data, state.offset);
  const s = { ...state, data, m, trueRatio, coverage: coverage(state.extra, state.offset) };

  $("offset").checked = state.offset;
  $("extra").value = state.extra; $("extra-value").textContent = `${Math.round(state.extra * 100)}%`;
  $("truth-key").hidden = !state.offset;
  $("code").textContent = TEXT.code(s);
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col"></th><th scope="col" class="num">Estimate</th><th scope="col" class="num">Std. Error</th><th scope="col" class="num">z value</th></tr></thead><tbody>` +
    ["(Intercept)", "simd_rank"].map((name, i) => `<tr><td><code>${name}</code></td><td class="num">${m.coef[i].toPrecision(4)}</td><td class="num">${m.se[i].toPrecision(4)}</td><td class="num">${(m.coef[i] / m.se[i]).toFixed(2)}</td></tr>`).join("") + `</tbody>`;
  $("deviance").innerHTML = TEXT.deviance(s);
  const row = (name, ratio, ci) => `<tr><td>${name}</td><td class="num">${ratio.toFixed(3)}</td><td class="num">${ci ? `${ci[0].toFixed(3)} to ${ci[1].toFixed(3)}` : ""}</td></tr>`;
  $("ratio-table").innerHTML =
    `<thead><tr><th scope="col">Rate ratio for 100 ranks</th><th scope="col" class="num">Estimate</th><th scope="col" class="num">95% CI</th></tr></thead><tbody>` +
    row("Poisson", m.ratio, m.ci) + (state.extra > 0 ? row("Quasipoisson", m.ratio, m.quasiCi) : "") + row("The true value (what we simulated)", trueRatio) + `</tbody>`;
  $("coverage").innerHTML = TEXT.coverage(s);

  drawCharts(s);
  const key = !state.offset ? "nooffset" : state.extra === 0 ? "good" : state.extra < 0.3 ? "slight" : "over";
  explain(key, TEXT.explain[key](s));
}

// ---------------------------------------------------------------- events
$("offset").addEventListener("change", (e) => { state.offset = e.target.checked; render(); });
$("extra").addEventListener("input", (e) => { state.extra = Number(e.target.value); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-extra], #again");
  if (!b) return;
  if (b.id === "again") state.seed++; else Object.assign(state, { extra: Number(b.dataset.extra), offset: true });
  render();
});

$("intro").innerHTML = TEXT.intro;
render();

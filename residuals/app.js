import { draws, simulate, diagnose } from "./diagnostics.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { curve: 0, fan: 0, seed: 20 };
let random = draws(state.seed), d;

// ---------------------------------------------------------------- the four plots
const W = 360, H = 270, M = { left: 54, right: 20, top: 10, bottom: 46 };
// Each axis is [from, to, step]. The axes stay the same whatever the sliders say, so we can watch the points move.
const CHARTS = {
  scatter: { x: [0, 100, 25], y: [-25, 150, 25], xTitle: "x", yTitle: "y", at: (r) => [r.x, r.y] },
  fitted: { x: [-25, 110, 25], y: [-50, 50, 25], xTitle: "Fitted values", yTitle: "Residuals", at: (r) => [r.fitted, r.resid] },
  qq: { x: [-3, 3, 1], y: [-4, 4, 2], xTitle: "Theoretical quantiles", yTitle: "Standardised residuals", at: (r) => [r.theoretical, r.std] },
  scale: { x: [-25, 110, 25], y: [0, 2.5, 0.5], xTitle: "Fitted values", yTitle: "√|Standardised residuals|", at: (r) => [r.fitted, r.scale] },
};

function draw(id, lines) {
  const c = CHARTS[id];
  const sx = (v) => M.left + ((v - c.x[0]) / (c.x[1] - c.x[0])) * (W - M.left - M.right);
  const sy = (v) => H - M.bottom - ((v - c.y[0]) / (c.y[1] - c.y[0])) * (H - M.top - M.bottom);
  let out = `<clipPath id="clip-${id}"><rect x="${M.left}" y="${M.top}" width="${W - M.left - M.right}" height="${H - M.top - M.bottom}"/></clipPath>`;
  for (let y = c.y[0]; y <= c.y[1] + 1e-9; y += c.y[2]) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 8}" y="${sy(y) + 5}" text-anchor="end">${+y.toFixed(1)}</text>`;
  }
  for (let x = c.x[0]; x <= c.x[1]; x += c.x[2]) out += `<text x="${sx(x)}" y="${H - M.bottom + 20}" text-anchor="middle">${x}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 6}" text-anchor="middle">${c.xTitle}</text>`;
  out += `<text class="axis-title" transform="translate(15 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">${c.yTitle}</text>`;

  // A point that falls off the edge of a plot is drawn at the edge.
  const clamp = (v, [lo, hi]) => Math.min(Math.max(v, lo), hi);
  c.px = d.rows.map((r) => { const [x, y] = c.at(r); return [sx(clamp(x, c.x)), sy(clamp(y, c.y))]; });
  out += `<g clip-path="url(#clip-${id})">${lines(sx, sy)}</g>`;
  out += c.px.map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="3.2"/>`).join("");
  out += `<circle class="hover" r="6" visibility="hidden"/>`;
  $(id).innerHTML = out;
  $(`${id}-desc`).textContent = TEXT.describe[id](d);
}

const path = (points, sx, sy) => `<path class="smooth" d="M${points.map(([x, y]) => `${sx(x)},${sy(y)}`).join("L")}"/>`;
const straight = (cls, [b0, b1], [from, to], sx, sy) => `<line class="${cls}" x1="${sx(from)}" y1="${sy(b0 + b1 * from)}" x2="${sx(to)}" y2="${sy(b0 + b1 * to)}"/>`;

function drawCharts() {
  // The thin lines from each point to the regression line are the residuals.
  draw("scatter", (sx, sy) =>
    d.rows.map((r) => `<line class="stick" x1="${sx(r.x)}" x2="${sx(r.x)}" y1="${sy(r.y)}" y2="${sy(r.fitted)}"/>`).join("") +
    straight("halo", d.model.coef, CHARTS.scatter.x, sx, sy) + straight("fit-line", d.model.coef, CHARTS.scatter.x, sx, sy));
  draw("fitted", (sx, sy) => straight("reference", [0, 0], CHARTS.fitted.x, sx, sy) + path(d.smoothResid, sx, sy));
  draw("qq", (sx, sy) => straight("reference", d.qqline, CHARTS.qq.x, sx, sy));
  draw("scale", (sx, sy) => path(d.smoothScale, sx, sy));
}

// ---------------------------------------------------------------- the panel
const percent = (v) => `${Math.round(v * 100)}%`;
const SLIGHT = 0.3; // below this a problem is hard to see in the plots

function drawPanel() {
  $("curve").value = state.curve; $("curve-value").textContent = percent(state.curve);
  $("fan").value = state.fan; $("fan-value").textContent = percent(state.fan);
  $("code").textContent = TEXT.code(state.curve, state.fan);
  const m = d.model;
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col"></th><th scope="col" class="num">Estimate</th><th scope="col" class="num">Std. Error</th><th scope="col" class="num">t value</th></tr></thead><tbody>` +
    ["(Intercept)", "x"].map((name, i) =>
      `<tr><td><code>${name}</code></td><td class="num">${m.coef[i].toFixed(2)}</td><td class="num">${m.se[i].toFixed(2)}</td><td class="num">${(m.coef[i] / m.se[i]).toFixed(1)}</td></tr>`).join("") + `</tbody>`;
  $("fit").innerHTML = TEXT.fit(d);

  const curved = state.curve >= SLIGHT, fanned = state.fan >= SLIGHT;
  if (state.curve === 0 && state.fan === 0) explain("good", TEXT.explain.good(d));
  else if (curved && fanned) explain("both", TEXT.explain.both(d, state.curve === 1 && state.fan === 1));
  else if (curved) explain("curve", TEXT.explain.curve(d, state.fan > 0));
  else if (fanned) explain("fan", TEXT.explain.fan(d, state.curve > 0));
  else explain("slight", TEXT.explain.slight(d));
}

function render() {
  const { x, y } = simulate(random, state.curve, state.fan);
  d = diagnose(x, y);
  drawCharts();
  drawPanel();
}

// ---------------------------------------------------------------- events
for (const key of ["curve", "fan"]) $(key).addEventListener("input", (e) => { state[key] = Number(e.target.value); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-preset], #again");
  if (!b) return;
  if (b.id === "again") random = draws(++state.seed);
  else [state.curve, state.fan] = b.dataset.preset.split(",").map(Number);
  render();
});

// Hovering over a point picks out the same observation in all four plots.
const hover = (i) => {
  for (const id in CHARTS) {
    const ring = $(id).querySelector(".hover");
    if (i === null) { ring.setAttribute("visibility", "hidden"); continue; }
    ring.setAttribute("cx", CHARTS[id].px[i][0]); ring.setAttribute("cy", CHARTS[id].px[i][1]); ring.setAttribute("visibility", "visible");
  }
};
for (const id in CHARTS) {
  $(id).addEventListener("pointermove", (e) => {
    const box = $(id).getBoundingClientRect(), scale = W / box.width;
    const px = (e.clientX - box.left) * scale, py = (e.clientY - box.top) * scale;
    let best = null, bestD = 18 ** 2;
    CHARTS[id].px.forEach(([x, y], i) => {
      const dist = (x - px) ** 2 + (y - py) ** 2;
      if (dist < bestD) { bestD = dist; best = i; }
    });
    hover(best);
  });
  $(id).addEventListener("pointerleave", () => hover(null));
}

$("intro").textContent = TEXT.intro;
render();

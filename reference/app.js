import { DATA } from "./data.js";
import { NAMES, quintile, smoking, means, steps, fitModel } from "./quintiles.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { ref: 0, number: false };

// ---------------------------------------------------------------- the chart
const W = 720, H = 420, M = { left: 62, right: 56, top: 14, bottom: 56 }, Y_MAX = 70;
const col = (W - M.left - M.right) / 5;
const sx = (q) => M.left + (q + 0.5) * col; // q runs from 0 to 4
const sy = (v) => H - M.bottom - (v / Y_MAX) * (H - M.top - M.bottom);
// The dots are spread sideways a little so they don't sit on top of each other (the same every time).
const jitter = DATA.map((_, i) => (((i * 0.6180339887) % 1) - 0.5) * col * 0.6);

function drawChart(s) {
  let out = "";
  for (let y = 0; y <= Y_MAX; y += 10) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 8}" y="${sy(y) + 5}" text-anchor="end">${y}</text>`;
  }
  NAMES.forEach((name, q) => {
    out += `<rect class="column${!s.number && q === s.ref ? " ref" : ""}" data-q="${q}" x="${sx(q) - col / 2}" y="${M.top}" width="${col}" height="${H - M.top - M.bottom}"/>`;
    out += `<text class="${!s.number && q === s.ref ? "ref-label" : ""}" x="${sx(q)}" y="${H - M.bottom + 22}" text-anchor="middle">${name}</text>`;
  });
  out += `<text class="axis-title" x="${M.left + (W - M.left - M.right) / 2}" y="${H - 8}" text-anchor="middle">SIMD quintile</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">Smoking rate (%)</text>`;
  out += DATA.map((_, i) => `<circle class="dot" cx="${sx(quintile[i]) + jitter[i]}" cy="${sy(smoking[i])}" r="2.2"/>`).join("");

  if (s.number) {
    const at = (q) => s.model.coef[0] + s.model.coef[1] * (q + 1);
    out += `<line class="halo" x1="${sx(-0.3)}" x2="${sx(4.3)}" y1="${sy(at(-0.3))}" y2="${sy(at(4.3))}"/>`;
    out += `<line class="fit-line" x1="${sx(-0.3)}" x2="${sx(4.3)}" y1="${sy(at(-0.3))}" y2="${sy(at(4.3))}"/>`;
  } else {
    const base = sy(means[s.ref]);
    out += `<line class="refline" x1="${M.left}" x2="${W - M.right}" y1="${base}" y2="${base}"/>`;
    means.forEach((v, q) => {
      if (q === s.ref) return;
      const x = sx(q) + col * 0.36;
      out += `<line class="arrow" x1="${x}" x2="${x}" y1="${base}" y2="${sy(v)}" marker-end="url(#head)"/>`;
      out += `<text class="line-label" x="${x + 6}" y="${(base + sy(v)) / 2 + 5}">${v > means[s.ref] ? "+" : "−"}${Math.abs(v - means[s.ref]).toFixed(2)}</text>`;
    });
  }
  means.forEach((v, q) => { out += `<line class="mean${s.number ? " ghost" : ""}" x1="${sx(q) - col * 0.3}" x2="${sx(q) + col * 0.3}" y1="${sy(v)}" y2="${sy(v)}"/>`; });
  $("chart").innerHTML = `<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>` + out;
  $("chart-desc").textContent = TEXT.describe(s);
}

// ---------------------------------------------------------------- the panel
const term = (s, q) => (s.ref === 0 ? `simd_quintile${NAMES[q]}` : `relevel(simd_quintile, ref = "${NAMES[s.ref]}")${NAMES[q]}`);

function render() {
  const model = fitModel(state.ref, state.number);
  const s = { ...state, model, means, steps, names: NAMES, n: DATA.length };

  document.querySelectorAll("[data-ref]").forEach((b) => {
    b.setAttribute("aria-pressed", String(!state.number && Number(b.dataset.ref) === state.ref));
    b.disabled = state.number;
  });
  $("number").checked = state.number;
  document.querySelectorAll("[data-mode]").forEach((li) => { li.hidden = (li.dataset.mode === "number") !== state.number; });
  $("code").textContent = TEXT.code(s);

  const others = NAMES.map((_, q) => q).filter((q) => q !== state.ref);
  const names = state.number ? ["(Intercept)", "simd_quintile"] : ["(Intercept)", ...others.map((q) => term(s, q))];
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col"></th><th scope="col" class="num">Estimate</th><th scope="col" class="num">Std. Error</th><th scope="col" class="num">t value</th></tr></thead><tbody>` +
    names.map((name, i) => `<tr><td><code>${name}</code></td><td class="num">${model.coef[i].toFixed(2)}</td><td class="num">${model.se[i].toFixed(2)}</td><td class="num">${(model.coef[i] / model.se[i]).toFixed(1)}</td></tr>`).join("") + `</tbody>`;
  $("fit").innerHTML = TEXT.fit(s);

  // What R actually puts into the model for a datazone in each quintile.
  $("dummy-title").textContent = state.number ? "What R puts into the model" : "The dummy variables R makes for us";
  $("dummy-table").innerHTML = state.number
    ? `<thead><tr><th scope="col">Quintile</th><th scope="col" class="num"><code>simd_quintile</code></th></tr></thead><tbody>` +
      NAMES.map((name, q) => `<tr><td>${name}</td><td class="num">${q + 1}</td></tr>`).join("") + `</tbody>`
    : `<thead><tr><th scope="col">Quintile</th>${others.map((q) => `<th scope="col" class="num">${NAMES[q]}</th>`).join("")}</tr></thead><tbody>` +
      NAMES.map((name, q) => `<tr class="${q === state.ref ? "ref" : ""}"><td>${name}${q === state.ref ? " <span class=\"sub\">(reference)</span>" : ""}</td>${others.map((o) => `<td class="num">${o === q ? 1 : 0}</td>`).join("")}</tr>`).join("") + `</tbody>`;

  drawChart(s);
  const key = state.number ? "number" : state.ref === 0 ? "first" : "other";
  explain(key + state.ref, TEXT.explain[key](s));
}

// ---------------------------------------------------------------- events
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ref], #chart .column");
  if (!b || state.number) return;
  state.ref = Number(b.dataset.ref ?? b.dataset.q);
  render();
});
$("number").addEventListener("change", (e) => { state.number = e.target.checked; render(); });

$("intro").innerHTML = TEXT.intro;
render();

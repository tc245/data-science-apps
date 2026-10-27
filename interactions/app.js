import { simulateDummies, fitDummies, simulateSlopes, fitSlopes, MAX_RETAILERS } from "./sim.js";
import { explain } from "../shared/explain.js";
import { TEXT, CELLS, cellName, other } from "./text.js";

const $ = (id) => document.getElementById(id);
const START = { gap: 3, change: -2, effect: -3, urbanSlope: 1, slopeDiff: -0.8, ruralGap: 3 };
const SLIDERS = Object.keys(START);
const state = { tab: "dummies", interaction: false, cell: 3, ref: "Rural", seed: 1, ...START };
const sg = (x, dp = 2) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(dp)}`;

// ---------------------------------------------------------------- the charts
const W = 800, H = 400, M = { left: 58, right: 30, top: 16, bottom: 48 };
const ARROWS = `<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`;
function yAxis(lo, hi, step, title, sy, right) {
  let out = "";
  for (let v = lo; v <= hi + 1e-9; v += step) out += `<line class="grid" x1="${M.left}" x2="${W - right}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${M.left - 8}" y="${sy(v) + 5}" text-anchor="end">${v}</text>`;
  return out + `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">${title}</text>`;
}
const syFor = (lo, hi) => (v) => H - M.bottom - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - M.top - M.bottom);

function drawDummies(fit) {
  const { model, means, predicted } = fit;
  const [b0, b1, b2, b3 = 0] = model.coef;
  const [t, p] = CELLS[state.cell];
  // the coefficients that add up to the chosen group's prediction, one column each
  const terms = [["(Intercept)", b0, 1, "intercept"], ["treated", b1, t, "treated"], ["post", b2, p, "post"], ["treated:post", b3, state.interaction && t && p, "interaction"]].filter((d) => d[2]);
  const ends = terms.reduce((acc, [, b]) => [...acc, (acc.at(-1) ?? 0) + b], []).slice(1);
  const all = [...means.flat(), ...predicted.flat(), b0, ...ends];
  const lo = Math.floor((Math.min(...all) - 1.5) / 2) * 2, hi = Math.ceil((Math.max(...all) + 1.5) / 2) * 2;
  const sy = syFor(lo, hi), X = [140, 320], COL = [430, 525, 620, 715];
  let out = ARROWS + yAxis(lo, hi, hi - lo > 14 ? 4 : 2, "Mean smoking rate (%)", sy, M.right);
  out += X.map((x, k) => `<text x="${x}" y="${H - M.bottom + 24}" text-anchor="middle">${k ? "After (post = 1)" : "Before (post = 0)"}</text>`).join("");
  out += `<line class="divider" x1="${COL[0] - 30}" x2="${COL[0] - 30}" y1="${M.top}" y2="${H - M.bottom}"/><text x="${(COL[0] + W - M.right) / 2 - 15}" y="${H - M.bottom + 24}" text-anchor="middle">Adding up the prediction</text>`;
  for (const g of [0, 1]) {
    const cls = g ? "treated" : "untreated";
    out += `<line class="series ${cls}" x1="${X[0]}" x2="${X[1]}" y1="${sy(predicted[g][0])}" y2="${sy(predicted[g][1])}"/>`;
    const mid = (predicted[g][0] + predicted[g][1]) / 2, above = predicted[g][0] + predicted[g][1] >= predicted[1 - g][0] + predicted[1 - g][1];
    out += `<text class="line-label ${cls}" x="${(X[0] + X[1]) / 2}" y="${sy(mid) + (above ? -14 : 24)}" text-anchor="middle">${g ? "Treated" : "Untreated"}</text>`;
  }
  // the real means (rings), the model's predictions (dots) and how far apart they are (red)
  CELLS.forEach(([tt, pp], k) => {
    const cls = tt ? "treated" : "untreated", x = X[pp];
    if (Math.abs(means[tt][pp] - predicted[tt][pp]) > 0.02) out += `<line class="miss" x1="${x}" x2="${x}" y1="${sy(means[tt][pp])}" y2="${sy(predicted[tt][pp])}"/>`;
    out += `<circle class="pred ${cls}" cx="${x}" cy="${sy(predicted[tt][pp])}" r="5"/>`;
    out += `<circle class="mean-ring ${cls}${k === state.cell ? " chosen" : ""}" data-cell="${k}" cx="${x}" cy="${sy(means[tt][pp])}" r="10" tabindex="0" role="button" aria-label="Show the prediction for the ${cellName([tt, pp])}"><title>${cellName([tt, pp])}: real mean ${means[tt][pp].toFixed(2)}, predicted ${predicted[tt][pp].toFixed(2)}</title></circle>`;
  });
  let y = 0;
  terms.forEach(([name, b, , cls], k) => {
    const x = COL[k], from = k ? y : null;
    y += b;
    if (k === 0) out += `<line class="intercept" x1="${M.left}" x2="${x}" y1="${sy(b)}" y2="${sy(b)}"/><circle class="start" cx="${x}" cy="${sy(b)}" r="5"/>`;
    else {
      out += `<line class="step" x1="${COL[k - 1]}" x2="${x}" y1="${sy(from)}" y2="${sy(from)}"/>`;
      if (Math.abs(b) > 0.1) out += `<line class="arrow ${cls}" x1="${x}" x2="${x}" y1="${sy(from)}" y2="${sy(y)}" marker-end="url(#head)"/>`;
    }
    out += `<text class="term-label ${cls}" x="${x}" y="${M.top + 12}" text-anchor="middle">${name}</text><text class="term-value ${cls}" x="${x}" y="${M.top + 30}" text-anchor="middle">${k ? sg(b) : b.toFixed(2)}</text>`;
  });
  const last = COL[terms.length - 1];
  out += `<line class="step" x1="${X[p]}" x2="${last}" y1="${sy(y)}" y2="${sy(y)}"/><text class="term-label" x="${last + 10}" y="${sy(y) + 5}">= ${y.toFixed(2)}</text>`;
  $("chart").innerHTML = out;
  $("legend").innerHTML = `<li><span class="swatch ring"></span>The real mean for each group (click one)</li><li><span class="swatch dot-pred"></span>The model's prediction</li><li><span class="swatch miss"></span>How far the prediction misses</li><li><span class="swatch arrow"></span>The coefficients that add up to the chosen prediction</li>`;
}

function drawSlopes(rows, fit) {
  const { model, lines } = fit;
  const ys = rows.map((r) => r[2]).concat(lines.map((l) => l.intercept));
  const lo = Math.floor(Math.min(...ys) / 5) * 5, hi = Math.ceil(Math.max(...ys) / 5) * 5;
  const sy = syFor(lo, hi), sx = (v) => M.left + (v / MAX_RETAILERS) * (W - M.left - M.right);
  let out = ARROWS + yAxis(lo, hi, 5, "Smoking rate (%)", sy, M.right);
  for (let v = 0; v <= MAX_RETAILERS; v += 2) out += `<text x="${sx(v)}" y="${H - M.bottom + 22}" text-anchor="middle">${v}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 8}" text-anchor="middle">Tobacco retailers per 1,000 people (retailers_adj)</text>`;
  out += rows.map(([g, x, y]) => `<circle class="pt ${g ? "rural" : "urban"}" cx="${sx(x)}" cy="${sy(y)}" r="3.5"/>`).join("");
  [0, 1].forEach((g) => {
    const { intercept: a, slope: b } = lines[g], cls = g ? "rural" : "urban";
    const xs = rows.filter((r) => r[0] === g).map((r) => r[1]), hi = Math.max(...xs);
    out += `<line class="halo" x1="${sx(Math.min(...xs))}" x2="${sx(hi)}" y1="${sy(a + b * Math.min(...xs))}" y2="${sy(a + b * hi)}"/>`;
    out += `<line class="series ${cls} extend" x1="${sx(0)}" x2="${sx(hi)}" y1="${sy(a)}" y2="${sy(a + b * hi)}"/>`;
    out += `<line class="series ${cls}" x1="${sx(Math.min(...xs))}" x2="${sx(hi)}" y1="${sy(a + b * Math.min(...xs))}" y2="${sy(a + b * hi)}"/>`;
    // how much the line goes up for one extra retailer
    const at = g ? 4 : 7;
    out += `<path class="rise ${cls}" d="M${sx(at)},${sy(a + b * at)}H${sx(at + 1)}V${sy(a + b * (at + 1))}"/><text class="line-label ${cls}" x="${sx(at + 1) + 8}" y="${sy(a + b * (at + 0.5)) + (g ? 24 : 5)}">${g ? "Rural" : "Urban"} slope ${sg(b)}</text>`;
  });
  const [ga, gb] = [lines[state.ref === "Rural" ? 1 : 0].intercept, lines[state.ref === "Rural" ? 0 : 1].intercept];
  if (Math.abs(gb - ga) > 0.2) out += `<line class="arrow gap" x1="${sx(0) + 8}" x2="${sx(0) + 8}" y1="${sy(ga)}" y2="${sy(gb)}" marker-end="url(#head)"/>`;
  out += `<text class="term-label" x="${sx(0) + 16}" y="${(sy(ga) + sy(gb)) / 2 + 5}">urban_rural_2cat${other(state.ref)} ${sg(model.coef[2])}</text>`;
  $("chart").innerHTML = out;
  $("legend").innerHTML = `<li><span class="swatch urban"></span>Urban datazones</li><li><span class="swatch rural"></span>Rural datazones</li><li><span class="swatch ghost"></span>A line carried on back to 0 retailers</li><li><span class="swatch arrow"></span>The gap at 0 retailers</li>`;
}

// ---------------------------------------------------------------- the panel
function render() {
  const dummies = state.tab === "dummies";
  const rows = dummies ? simulateDummies(state.seed, state) : simulateSlopes(state.seed, state);
  const fit = dummies ? fitDummies(rows, state.interaction) : fitSlopes(rows, state.interaction, state.ref);
  const s = { ...state, fit, cell: CELLS[state.cell] };

  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.tab === state.tab));
  document.querySelectorAll("[data-interaction]").forEach((b) => b.setAttribute("aria-pressed", Boolean(Number(b.dataset.interaction)) === state.interaction));
  document.querySelectorAll("[data-cell]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.cell) === state.cell));
  document.querySelectorAll("[data-ref]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.ref === state.ref));
  $("cell-control").hidden = $("dummy-sliders").hidden = $("row-wrap").hidden = !dummies;
  $("ref-control").hidden = $("slope-sliders").hidden = dummies;
  for (const k of SLIDERS) {
    $(k).value = state[k];
    $(`${k}-value`).textContent = k === "urbanSlope" || k === "slopeDiff" ? `${sg(state[k], 1)} points per retailer` : `${sg(state[k], 1)} percentage points`;
  }

  if (dummies) drawDummies(fit); else drawSlopes(rows, fit);
  $("chart-title").textContent = TEXT.title[state.tab](state.interaction);
  $("chart-desc").textContent = TEXT.describe(s);
  $("howto").innerHTML = TEXT.howto[state.tab];
  $("code").textContent = TEXT.code[state.tab](state.interaction, state.ref);

  const O = other(state.ref);
  const names = dummies ? ["(Intercept)", "treated", "post", "treated:post"] : ["(Intercept)", "retailers_adj", `urban_rural_2cat${O}`, `retailers_adj:urban_rural_2cat${O}`];
  const meaning = TEXT.meaning[state.tab](state.interaction, state.ref);
  $("coefs").innerHTML = `<thead><tr><th scope="col">Term</th><th scope="col" class="num">Estimate</th><th scope="col" class="num">95% CI</th><th scope="col">What it means in this model</th></tr></thead><tbody>`
    + fit.model.coef.map((b, i) => `<tr${i === 3 ? ` class="current"` : ""}><td><code>${names[i]}</code></td><td class="num">${b.toFixed(2)}</td><td class="num">${fit.model.ci[i][0].toFixed(2)} to ${fit.model.ci[i][1].toFixed(2)}</td><td>${meaning[i]}</td></tr>`).join("")
    + `</tbody>`;
  if (dummies) {
    const [t, p] = CELLS[state.cell];
    const { predicted, means } = fit;
    $("row").innerHTML = `<caption>The dummy variables for the ${cellName([t, p])}</caption><thead><tr><th scope="col" class="num"><code>treated</code></th><th scope="col" class="num"><code>post</code></th><th scope="col" class="num"><code>treated × post</code></th><th scope="col" class="num">Prediction</th><th scope="col" class="num">Real mean</th></tr></thead>`
      + `<tbody><tr><td class="num">${t}</td><td class="num">${p}</td><td class="num">${t * p}${state.interaction ? "" : " (not in the model)"}</td><td class="num">${predicted[t][p].toFixed(2)}</td><td class="num">${means[t][p].toFixed(2)}</td></tr></tbody>`;
  }
  explain(`${state.tab}-${state.interaction}-${dummies ? state.cell : state.ref}`, `<p>${TEXT.explain[state.tab](s)}</p>`);
}

// ---------------------------------------------------------------- events
$("cells").innerHTML = CELLS.map((c, k) => `<button type="button" data-cell="${k}">${["Untreated", "Treated"][c[0]]}, ${c[1] ? "after" : "before"}</button>`).join("");
for (const k of SLIDERS) $(k).addEventListener("input", (ev) => { state[k] = Number(ev.target.value); render(); });
$("reset").addEventListener("click", () => { Object.assign(state, START, { interaction: false, cell: 3, ref: "Rural" }); render(); });
$("again").addEventListener("click", () => { state.seed++; render(); });
const choose = (el) => {
  if (el.dataset.tab) state.tab = el.dataset.tab;
  else if (el.dataset.interaction) state.interaction = el.dataset.interaction === "1";
  else if (el.dataset.cell) state.cell = Number(el.dataset.cell);
  else if (el.dataset.ref) state.ref = el.dataset.ref;
  else return;
  render();
};
document.addEventListener("click", (ev) => { const el = ev.target.closest("[data-tab],[data-interaction],[data-cell],[data-ref]"); if (el) choose(el); });
$("chart").addEventListener("keydown", (ev) => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.dataset.cell) { ev.preventDefault(); choose(ev.target); } });

$("intro").innerHTML = TEXT.intro;
render();

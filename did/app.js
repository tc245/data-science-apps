import { simulate, estimate, trueEffect, YEARS, POLICY } from "./did.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const PARALLEL = { gap: 2, effect: -3, builds: true, trend: 0 };
const state = { step: 1, seed: 1, ...PARALLEL };
const mean = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;

// ---------------------------------------------------------------- the chart
const W = 720, H = 400, M = { left: 58, right: 120, top: 16, bottom: 48 };
const sx = (year) => M.left + ((year - 2012) / 7) * (W - M.left - M.right);

function axes(lo, hi, step, yTitle, sy) {
  let out = "";
  for (let v = lo; v <= hi + 1e-9; v += step) out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${M.left - 8}" y="${sy(v) + 5}" text-anchor="end">${+v.toFixed(1)}</text>`;
  YEARS.forEach((y) => { out += `<text x="${sx(y)}" y="${H - M.bottom + 22}" text-anchor="middle">${y}</text>`; });
  out += `<line class="policy" x1="${sx(2015.5)}" x2="${sx(2015.5)}" y1="${M.top}" y2="${H - M.bottom}"/><text x="${sx(2015.5) + 6}" y="${M.top + 14}">policy starts</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">${yTitle}</text>`;
  return out;
}
const line = (vals, cls) => `<path class="${cls}" d="M${vals.map((v, k) => `${sx(YEARS[k])},${v}`).join("L")}"/>`;
const dots = (vals, cls, label) => vals.map((v, k) => `<circle class="${cls}" cx="${sx(YEARS[k])}" cy="${v}" r="5"><title>${label}, ${YEARS[k]}</title></circle>`).join("");
const meanLine = (from, to, y, cls) => `<line class="mean-line ${cls}" x1="${sx(from) - 10}" x2="${sx(to) + 10}" y1="${y}" y2="${y}"/>`;
function bracket(x, y1, y2, label) {
  const tick = 7;
  return `<path class="bracket" d="M${x - tick},${y1}H${x}V${y2}H${x - tick}"/><text class="bracket-label" x="${x + 8}" y="${(y1 + y2) / 2 + 5}">${label}</text>`;
}
const pp = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;

function drawTrends(e, s) {
  const [untreated, treated] = e.yearly;
  const shift = mean(treated.slice(0, 4)) - mean(untreated.slice(0, 4));
  const counterfactual = untreated.map((v) => v + shift);
  const all = [...untreated, ...treated, ...counterfactual];
  const lo = Math.floor(Math.min(...all) / 2) * 2 - 2, hi = Math.ceil(Math.max(...all) / 2) * 2 + 2;
  const sy = (v) => H - M.bottom - ((v - lo) / (hi - lo)) * (H - M.top - M.bottom);
  const [[c0, c1], [t0, t1]] = e.table;
  let out = axes(lo, hi, (hi - lo) > 16 ? 4 : 2, "Mean smoking rate (%)", sy);
  const showUntreated = s.step > 1;
  if (showUntreated) out += line(untreated.map(sy), "series untreated") + dots(untreated.map(sy), "untreated", "Untreated");
  if (s.step >= 3) out += line(counterfactual.map(sy), "counterfactual");
  out += line(treated.map(sy), "series treated") + dots(treated.map(sy), "treated", "Treated");
  const xr = sx(2019) + 26;
  if (s.step === 1) {
    out += meanLine(2012, 2015, sy(t0), "treated") + meanLine(2016, 2019, sy(t1), "treated");
    out += bracket(xr, sy(t0), sy(t1), pp(e.beforeAfter));
  } else if (s.step === 2) {
    out += meanLine(2016, 2019, sy(t1), "treated") + meanLine(2016, 2019, sy(c1), "untreated");
    out += bracket(xr, sy(c1), sy(t1), pp(e.afterOnly));
  } else if (s.step === 4) {
    const cf1 = mean(counterfactual.slice(4));
    out += meanLine(2016, 2019, sy(t1), "treated") + meanLine(2016, 2019, sy(cf1), "treated");
    out += bracket(xr, sy(cf1), sy(t1), pp(e.diffInDiff));
  }
  $("chart").innerHTML = out;
  $("legend").innerHTML = (showUntreated ? `<li><span class="swatch untreated"></span>Untreated datazones (mean)</li>` : "")
    + `<li><span class="swatch treated"></span>Treated datazones (mean)</li>`
    + (s.step >= 3 ? `<li><span class="swatch counterfactual"></span>What the treated datazones would have done without the policy (if the trends are parallel)</li>` : "");
}

function drawEvents(e, s) {
  const vals = e.events.flatMap((ev) => ev.ci).concat(YEARS.map((y) => trueEffect(y, s)));
  const lo = Math.floor(Math.min(...vals, -1)) - 1, hi = Math.ceil(Math.max(...vals, 1)) + 1;
  const sy = (v) => H - M.bottom - ((v - lo) / (hi - lo)) * (H - M.top - M.bottom);
  let out = axes(lo, hi, hi - lo > 10 ? 2 : 1, "Difference compared with 2015", sy);
  out += `<line class="zero" x1="${M.left}" x2="${W - M.right}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  out += YEARS.map((y) => `<circle class="truth-dot" cx="${sx(y)}" cy="${sy(trueEffect(y, s))}" r="9"/>`).join("");
  out += e.events.map((ev) => `<line class="ci" x1="${sx(ev.year)}" x2="${sx(ev.year)}" y1="${sy(ev.ci[0])}" y2="${sy(ev.ci[1])}"/><circle class="estimate" cx="${sx(ev.year)}" cy="${sy(ev.estimate)}" r="5.5"><title>${ev.year}: ${ev.estimate.toFixed(2)} (95% CI ${ev.ci[0].toFixed(2)} to ${ev.ci[1].toFixed(2)})</title></circle>`).join("");
  $("chart").innerHTML = out;
  $("legend").innerHTML = `<li><span class="swatch estimate"></span>Estimate for each year, with its 95% confidence interval</li><li><span class="swatch truth-dot"></span>The true effect of the policy (what we simulated)</li>`;
}

// ---------------------------------------------------------------- the panel
function render() {
  const e = estimate(simulate(state.seed, state));
  const truth = mean(YEARS.filter((y) => y >= POLICY).map((y) => trueEffect(y, state)));
  const s = { ...state, e, truth };

  document.querySelectorAll("[data-step]").forEach((b) => b.setAttribute("aria-pressed", Number(b.dataset.step) === state.step));
  for (const k of ["gap", "effect", "trend"]) $(k).value = state[k];
  $("builds").checked = state.builds;
  $("gap-value").textContent = `${state.gap.toFixed(1)} percentage points`;
  $("effect-value").textContent = `${pp(state.effect)} percentage points`;
  $("trend-value").textContent = state.trend === 0 ? "none (parallel trends)" : `${pp(state.trend)} percentage points a year`;

  (state.step === 5 ? drawEvents : drawTrends)(e, state);
  $("chart-title").textContent = TEXT.title[state.step];
  $("chart-desc").textContent = TEXT.describe(s);

  const rows = [[1, TEXT.rows[1], e.beforeAfter], [2, TEXT.rows[2], e.afterOnly], [4, TEXT.rows[4], e.diffInDiff]];
  $("estimates").innerHTML = `<thead><tr><th scope="col">Comparison</th><th scope="col" class="num">Estimate</th></tr></thead><tbody>`
    + rows.map(([k, name, v]) => `<tr class="${k === state.step || (k === 4 && state.step === 3) ? "current" : ""}"><td>${name}</td><td class="num">${v.toFixed(2)}</td></tr>`).join("")
    + `<tr><td>${TEXT.rows.truth}</td><td class="num">${truth.toFixed(2)}</td></tr></tbody>`;
  $("code").textContent = TEXT.code[state.step];
  const [[c0, c1], [t0, t1]] = e.table;
  $("table-wrap").hidden = state.step !== 4;
  $("two-by-two").innerHTML = `<thead><tr><th scope="col"><code>treated</code></th><th scope="col" class="num"><code>post_0</code> (before)</th><th scope="col" class="num"><code>post_1</code> (after)</th><th scope="col" class="num"><code>change</code></th></tr></thead><tbody>`
    + `<tr><td>0 (untreated)</td><td class="num">${c0.toFixed(2)}</td><td class="num">${c1.toFixed(2)}</td><td class="num">${(c1 - c0).toFixed(2)}</td></tr>`
    + `<tr><td>1 (treated)</td><td class="num">${t0.toFixed(2)}</td><td class="num">${t1.toFixed(2)}</td><td class="num">${(t1 - t0).toFixed(2)}</td></tr></tbody>`
    + `<tfoot><tr><td colspan="3">Difference-in-differences (and the <code>treated:post</code> coefficient)</td><td class="num"><b>${e.did.coef[3].toFixed(2)}</b></td></tr></tfoot>`;

  const parallel = state.trend === 0 ? "parallel" : "notparallel";
  explain(`${state.step}-${parallel}`, TEXT.explain[state.step](s));
}

// ---------------------------------------------------------------- events
for (const k of ["gap", "effect", "trend"]) $(k).addEventListener("input", (ev) => { state[k] = Number(ev.target.value); render(); });
$("builds").addEventListener("change", (ev) => { state.builds = ev.target.checked; render(); });
$("reset").addEventListener("click", () => { Object.assign(state, PARALLEL); render(); });
$("again").addEventListener("click", () => { state.seed++; render(); });
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-step]");
  if (b) { state.step = Number(b.dataset.step); render(); }
});

$("intro").innerHTML = TEXT.intro;
render();

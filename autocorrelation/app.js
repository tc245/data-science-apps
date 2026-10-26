import { QUEEN } from "../shared/datazones.js";
import { PATHS, WIDTH, HEIGHT, moranI, blue } from "../shared/spatial.js";
import { random } from "../shared/random.js";
import { explain } from "../shared/explain.js";
import { simulateSpace, simulateTime, lagCorrelation, shuffle, shuffleSeries, YEARS } from "./sim.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { mode: "space", strength: { space: 0.6, time: 0.6 }, seed: 1, stats: [], showing: null };
let real, observed, rng;

const statistic = (d) => (state.mode === "space" ? moranI(QUEEN, d) : lagCorrelation(d));
const shuffled = (d) => (state.mode === "space" ? shuffle(rng, d) : shuffleSeries(rng, d));

// A fresh data set (and no shuffles yet) whenever the data change.
function newData() {
  const s = state.strength[state.mode];
  real = state.mode === "space" ? simulateSpace(state.seed, s) : simulateTime(state.seed, s);
  observed = statistic(real);
  rng = random(state.seed + 1000);
  Object.assign(state, { stats: [], showing: null });
}

// ---------------------------------------------------------------- the data: a map or some lines
const dataSvg = $("data");
function drawData(d) {
  if (state.mode === "space") {
    dataSvg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    if (!dataSvg.querySelector("path.area")) dataSvg.innerHTML = PATHS.map((p) => `<path class="area" d="${p}"/>`).join("");
    dataSvg.querySelectorAll("path.area").forEach((p, i) => p.setAttribute("fill", blue((d[i] + 2.5) / 5)));
    return;
  }
  // The first 10 areas, one line each.
  const W = 400, H = 340, M = { left: 20, right: 12, top: 10, bottom: 34 };
  const sx = (t) => M.left + (t / (YEARS - 1)) * (W - M.left - M.right);
  const sy = (v) => H - M.bottom - ((Math.max(-3, Math.min(3, v)) + 3) / 6) * (H - M.top - M.bottom);
  dataSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  let out = [-2, 0, 2].map((v) => `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(v)}" y2="${sy(v)}"/>`).join("");
  out += `<text x="${sx(0)}" y="${H - 10}" text-anchor="start">Year 1</text><text x="${sx(YEARS - 1)}" y="${H - 10}" text-anchor="end">Year ${YEARS}</text>`;
  out += d.slice(0, 10).map((s) => `<path class="series" d="M${s.map((v, t) => `${sx(t)},${sy(v)}`).join("L")}"/>`).join("");
  dataSvg.innerHTML = out;
}

// ---------------------------------------------------------------- the histogram
function drawHist() {
  const W = 400, H = 340, M = { left: 44, right: 14, top: 24, bottom: 52 };
  const all = [...state.stats, observed];
  const lo = Math.min(-0.1, ...all), hi = Math.max(0.1, ...all);
  const pad = (hi - lo) * 0.08, a = lo - pad, b = hi + pad;
  const sx = (v) => M.left + ((v - a) / (b - a)) * (W - M.left - M.right);
  const BINS = 40, width = (b - a) / BINS, counts = Array(BINS).fill(0);
  state.stats.forEach((v) => counts[Math.min(BINS - 1, Math.floor((v - a) / width))]++);
  const top = Math.max(10, ...counts);
  const sy = (c) => H - M.bottom - (c / top) * (H - M.top - M.bottom);
  let out = `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  const step = (b - a) > 0.8 ? 0.2 : (b - a) > 0.3 ? 0.1 : 0.05;
  for (let v = Math.ceil(a / step) * step; v <= b; v += step) out += `<text x="${sx(v)}" y="${H - M.bottom + 20}" text-anchor="middle">${+v.toFixed(2)}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 8}" text-anchor="middle">${TEXT.statName[state.mode]}</text>`;
  out += `<text x="${M.left - 6}" y="${sy(top) + 5}" text-anchor="end">${top}</text><text x="${M.left - 6}" y="${sy(0) + 5}" text-anchor="end">0</text>`;
  out += counts.map((c, k) => (c ? `<rect class="bar" x="${sx(a + k * width) + 1}" y="${sy(c)}" width="${Math.max(1, sx(a + width) - sx(a) - 2)}" height="${sy(0) - sy(c)}" rx="2"/>` : "")).join("");
  const x = sx(observed);
  out += `<line class="observed" x1="${x}" x2="${x}" y1="${M.top}" y2="${sy(0)}"/><text class="observed-label" x="${x}" y="${M.top - 6}" text-anchor="${x > W - 80 ? "end" : x < 80 ? "start" : "middle"}">real data: ${observed.toFixed(3)}</text>`;
  $("hist").innerHTML = out;
}

// ---------------------------------------------------------------- the panel
function render() {
  const n = state.stats.length, beaten = state.stats.filter((v) => v >= observed).length;
  const s = { ...state, n, observed, beaten, p: (beaten + 1) / (n + 1), strengthNow: state.strength[state.mode], last: state.stats[n - 1] };

  document.querySelectorAll("[data-mode]").forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.mode === state.mode));
  $("strength").value = s.strengthNow;
  $("slider-label").innerHTML = TEXT.slider[state.mode](s.strengthNow);
  $("real").disabled = !state.showing;
  $("ramp-key").hidden = state.mode !== "space";
  $("data-title").textContent = TEXT.dataTitle(s, Boolean(state.showing));
  $("hist-title").textContent = TEXT.histTitle(s);
  $("code").textContent = TEXT.code[state.mode];
  $("result").innerHTML = TEXT.result(s);
  drawData(state.showing || real);
  drawHist();
  $("data-desc").textContent = TEXT.describe.data(s);
  $("hist-desc").textContent = TEXT.describe.hist(s);
  const key = `${state.mode}-${n === 0 ? "none" : n < 50 ? "few" : "many"}`;
  explain(key, TEXT.explain[state.mode][n === 0 ? "none" : n < 50 ? "few" : "many"](s));
}

// ---------------------------------------------------------------- events
$("once").addEventListener("click", () => { state.showing = shuffled(real); state.stats.push(statistic(state.showing)); render(); });
$("many").addEventListener("click", () => {
  for (let k = 0; k < 999; k++) { state.showing = shuffled(real); state.stats.push(statistic(state.showing)); }
  render();
});
$("real").addEventListener("click", () => { state.showing = null; render(); });
$("again").addEventListener("click", () => { state.seed++; newData(); render(); });
$("strength").addEventListener("input", (e) => { state.strength[state.mode] = Number(e.target.value); newData(); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-mode]");
  if (!b || b.dataset.mode === state.mode) return;
  state.mode = b.dataset.mode; newData(); render();
});

$("intro").innerHTML = TEXT.intro;
newData();
render();

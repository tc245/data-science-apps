import { QUEEN, ROOK, CENTROIDS } from "../shared/datazones.js";
import { PATHS, WIDTH, HEIGHT, point, nearest, weights, blue } from "../shared/spatial.js";
import { explain } from "../shared/explain.js";
import { DATA } from "./data.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const YEARS = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];
const rate = (i, year = 2015) => DATA[i][1 + YEARS.indexOf(year)];
const RAMP_MAX = 40; // smoking rates of 40% and over get the darkest blue
const state = { chosen: 244, rule: "queen", style: "W", k: 6, zoomed: true };

const neighboursOf = (i) => (state.rule === "queen" ? QUEEN[i] : state.rule === "rook" ? ROOK[i] : nearest(i, state.k));

// ---------------------------------------------------------------- the map
const map = $("map");
map.innerHTML = `<g id="areas">${PATHS.map((d, i) => `<path d="${d}" data-i="${i}" fill="${blue(rate(i) / RAMP_MAX)}"/>`).join("")}</g><g id="links"></g>`;
const paths = [...map.querySelectorAll("#areas path")];
$("ramp-range").textContent = `0% (light) to ${RAMP_MAX}% or more (dark)`;

function zoomBox(ids) {
  if (!state.zoomed) return `0 0 ${WIDTH} ${HEIGHT}`;
  // The box around the chosen datazone and its neighbours' centroids, with some space around it.
  const pts = ids.map((j) => point(CENTROIDS[j]));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 3000) * 1.6;
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
}

function drawMap(nb) {
  const set = new Set(nb);
  paths.forEach((p, i) => {
    p.classList.toggle("chosen", i === state.chosen);
    p.classList.toggle("neighbour", set.has(i));
    p.classList.toggle("faded", state.zoomed && i !== state.chosen && !set.has(i));
  });
  // Move the neighbours and then the chosen datazone to the end, so their outlines are drawn on top.
  [...nb, state.chosen].forEach((j) => paths[j].parentNode.append(paths[j]));
  const [x, y] = point(CENTROIDS[state.chosen]);
  const r = state.zoomed ? zoomBox([state.chosen, ...nb]).split(" ")[2] / 140 : WIDTH / 200;
  $("links").innerHTML = nb.map((j) => { const [x2, y2] = point(CENTROIDS[j]); return `<line class="link" x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/><circle class="centroid" cx="${x2}" cy="${y2}" r="${r}"/>`; }).join("")
    + `<circle class="centroid" cx="${x}" cy="${y}" r="${r * 1.4}"/>`;
  map.setAttribute("viewBox", zoomBox([state.chosen, ...nb]));
  $("whole").textContent = state.zoomed ? "Show the whole map" : "Zoom in on my datazone";
  $("map-title").textContent = `${DATA[state.chosen][0]} and its ${nb.length} neighbour${nb.length === 1 ? "" : "s"}`;
  $("map-desc").textContent = TEXT.describe.map(DATA[state.chosen][0], nb.length);
}

// ---------------------------------------------------------------- the years
function drawYears() {
  const W = 640, H = 200, M = { left: 50, right: 20, top: 14, bottom: 40 };
  const vals = YEARS.map((y) => rate(state.chosen, y));
  const yMax = Math.max(20, Math.ceil(Math.max(...vals) / 10) * 10);
  const sx = (k) => M.left + (k / (YEARS.length - 1)) * (W - M.left - M.right);
  const sy = (v) => H - M.bottom - (v / yMax) * (H - M.top - M.bottom);
  let out = "";
  for (let v = 0; v <= yMax; v += yMax / 4) out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${M.left - 8}" y="${sy(v) + 5}" text-anchor="end">${v}</text>`;
  YEARS.forEach((y, k) => { out += `<text x="${sx(k)}" y="${H - M.bottom + 22}" text-anchor="middle">${y}</text>`; });
  out += `<text class="axis-title" transform="translate(14 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">Smoking rate (%)</text>`;
  out += `<path class="year-line" d="M${vals.map((v, k) => `${sx(k)},${sy(v)}`).join("L")}"/>`;
  out += vals.map((v, k) => `<circle class="dot ${YEARS[k] === 2015 ? "this-year" : YEARS[k] === 2014 ? "last-year" : ""}" cx="${sx(k)}" cy="${sy(v)}" r="${YEARS[k] === 2015 || YEARS[k] === 2014 ? 7 : 4}"><title>${YEARS[k]}: ${v}%</title></circle>`).join("");
  out += `<text class="line-label" x="${sx(3)}" y="${sy(vals[3]) - 14}" text-anchor="middle">this year</text><text class="line-label" x="${sx(2)}" y="${sy(vals[2]) - 14}" text-anchor="middle">last year</text>`;
  $("years").innerHTML = out;
  $("years-desc").textContent = TEXT.describe.years(DATA[state.chosen][0], vals);
  $("years-text").innerHTML = TEXT.years(vals[3], vals[2]);
}

// ---------------------------------------------------------------- the panel
function render() {
  const i = state.chosen, nb = neighboursOf(i);
  const w = weights([nb], state.style)[0];
  const lag = nb.reduce((s, j, k) => s + w[k] * rate(j), 0);
  const s = { ...state, n: nb.length, own: rate(i), lag, id: DATA[i][0], w: w[0] };

  document.querySelectorAll("[data-rule]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.rule === state.rule));
  document.querySelectorAll("[data-style]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.style === state.style));
  $("k").value = state.k; $("k-value").textContent = state.k; $("k").disabled = state.rule !== "knn";
  $("code").textContent = TEXT.code(s);
  const fmtW = (v) => (state.style === "W" ? `1/${nb.length} = ${v.toFixed(3)}` : "1");
  $("weights-table").innerHTML =
    `<thead><tr><th scope="col">Neighbour</th><th scope="col" class="num">Smoking rate</th><th scope="col" class="num">Weight</th><th scope="col" class="num">Weight × rate</th></tr></thead><tbody>` +
    nb.map((j, k) => `<tr><td>${DATA[j][0]}</td><td class="num">${rate(j).toFixed(2)}</td><td class="num">${fmtW(w[k])}</td><td class="num">${(w[k] * rate(j)).toFixed(2)}</td></tr>`).join("") +
    `</tbody><tfoot><tr><td colspan="3">Spatial lag (add up the last column)</td><td class="num">${lag.toFixed(2)}</td></tr></tfoot>`;
  $("lag-text").innerHTML = TEXT.lag(s);

  drawMap(nb);
  drawYears();
  const key = `${state.rule}-${state.style}`;
  explain(key, TEXT.explain[state.rule](s) + " " + TEXT.explain[state.style](s));
}

// ---------------------------------------------------------------- events
const tip = $("tip");
map.addEventListener("click", (e) => {
  const p = e.target.closest("path[data-i]");
  if (!p) return;
  Object.assign(state, { chosen: Number(p.dataset.i), zoomed: true });
  render();
});
map.addEventListener("mousemove", (e) => {
  const p = e.target.closest("path[data-i]");
  if (!p) { tip.hidden = true; return; }
  const i = Number(p.dataset.i), box = map.parentNode.getBoundingClientRect();
  tip.innerHTML = `<b>${DATA[i][0]}</b><br>Smoking rate in 2015: ${rate(i)}%`;
  tip.hidden = false;
  tip.style.left = `${e.clientX - box.left + 14}px`; tip.style.top = `${e.clientY - box.top + 14}px`;
});
map.addEventListener("mouseleave", () => { tip.hidden = true; });
$("whole").addEventListener("click", () => { state.zoomed = !state.zoomed; render(); });
$("k").addEventListener("input", (e) => { state.k = Number(e.target.value); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-rule], [data-style]");
  if (!b) return;
  if (b.dataset.rule) state.rule = b.dataset.rule; else state.style = b.dataset.style;
  render();
});

$("intro").innerHTML = TEXT.intro;
render();

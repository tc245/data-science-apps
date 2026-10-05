import { DATA } from "./data.js";
import { fitAt, PRACTICAL_CUTOFF } from "./trim.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const MIN = 10, MAX = 300;
const state = { cutoff: MAX };

// ---------------------------------------------------------------- the fits at every cut-off
const FITS = {};
for (let c = MIN; c <= MAX; c++) FITS[c] = fitAt(DATA, c);
const all = FITS[MAX], practical = FITS[PRACTICAL_CUTOFF];
const SIX = DATA.filter((row) => row[0] > PRACTICAL_CUTOFF).sort((a, b) => b[0] - a[0]);
// Where the main body of the data ends (the gap runs from here up to the practical's cut-off).
const EDGE = Math.ceil(Math.max(...DATA.filter((row) => row[0] <= PRACTICAL_CUTOFF).map((row) => row[0])));

// ---------------------------------------------------------------- the scatter plot
const W = 720, H = 400, M = { left: 62, right: 22, top: 14, bottom: 56 };
const Y_MAX = 70;
const plotX = (v, max) => M.left + (v / max) * (W - M.left - M.right);
const sy = (v) => H - M.bottom - (v / Y_MAX) * (H - M.top - M.bottom);

function drawChart() {
  const now = FITS[state.cutoff];
  const kept = DATA.filter((row) => row[0] <= state.cutoff);
  // The x-axis zooms in to fit the datazones we have kept.
  const biggest = Math.max(...kept.map((row) => row[0]));
  const xMax = biggest <= 16 ? 16 : Math.ceil(biggest / 50) * 50;
  const step = xMax <= 16 ? 2 : 50;
  const sx = (v) => plotX(v, xMax);

  let out = "";
  for (let y = 0; y <= Y_MAX; y += 10) {
    out += `<line class="grid" x1="${M.left}" x2="${W - M.right}" y1="${sy(y)}" y2="${sy(y)}"/>`;
    out += `<text x="${M.left - 9}" y="${sy(y) + 5}" text-anchor="end">${y}</text>`;
  }
  for (let x = 0; x <= xMax; x += step) out += `<text x="${sx(x)}" y="${H - M.bottom + 21}" text-anchor="middle">${x}</text>`;
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 8}" text-anchor="middle">Tobacco retailers per 1,000 people (retailers_adj)</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(M.top + H - M.bottom) / 2}) rotate(-90)" text-anchor="middle">Smoking rate, % (smoking_rate)</text>`;

  const extreme = (row) => row[0] > PRACTICAL_CUTOFF;
  out += kept.filter((row) => !extreme(row)).map((row) => `<circle class="dot" cx="${sx(row[0])}" cy="${sy(row[1])}" r="3.2"/>`).join("");
  out += kept.filter(extreme).map((row) => `<circle class="dot extreme" cx="${sx(row[0])}" cy="${sy(row[1])}" r="6.5"/>`).join("");

  const [b0, b1] = now.simple.coef;
  // The line stops at the top of the plot if it gets there before the right-hand side.
  const xEnd = b1 > 0 ? Math.min(xMax, (Y_MAX - b0) / b1) : xMax;
  const yEnd = b0 + b1 * xEnd;
  const line = (cls) => `<line class="${cls}" x1="${sx(0)}" y1="${sy(b0)}" x2="${sx(xEnd)}" y2="${sy(yEnd)}"/>`;
  out += line("halo") + line("fit-line");
  out += `<text class="line-label" x="${sx(xEnd) - 6}" y="${sy(yEnd) + (yEnd > Y_MAX - 8 ? 52 : -10)}" text-anchor="end">slope ${b1.toFixed(2)}</text>`;
  out += `<circle class="hover" id="hover" r="6" visibility="hidden"/>`;

  const chart = $("chart");
  chart.innerHTML = out;
  chart.sx = sx; // for the hover
  chart.kept = kept;
  $("chart-desc").textContent = TEXT.chartDescription(now, state.cutoff);
}

// ---------------------------------------------------------------- the coefficient at every cut-off
const TW = 720, TH = 250, TM = { left: 62, right: 22, top: 16, bottom: 52 };
const B_MAX = 3;
const tx = (c) => TM.left + ((c - MIN) / (MAX - MIN)) * (TW - TM.left - TM.right);
const ty = (b) => TH - TM.bottom - (b / B_MAX) * (TH - TM.top - TM.bottom);

function drawTrace() {
  let out = "";
  for (let b = 0; b <= B_MAX; b++) {
    out += `<line class="grid" x1="${TM.left}" x2="${TW - TM.right}" y1="${ty(b)}" y2="${ty(b)}"/>`;
    out += `<text x="${TM.left - 9}" y="${ty(b) + 5}" text-anchor="end">${b}</text>`;
  }
  for (const c of [MIN, 50, 100, 150, 200, 250, 300]) out += `<text x="${tx(c)}" y="${TH - TM.bottom + 21}" text-anchor="middle">${c}</text>`;
  out += `<text class="axis-title" x="${(TM.left + TW - TM.right) / 2}" y="${TH - 8}" text-anchor="middle">Cut-off (retailers per 1,000 people)</text>`;
  out += `<text class="axis-title" transform="translate(16 ${(TM.top + TH - TM.bottom) / 2}) rotate(-90)" text-anchor="middle">Coefficient</text>`;
  out += `<line class="reference" x1="${tx(PRACTICAL_CUTOFF)}" x2="${tx(PRACTICAL_CUTOFF)}" y1="${TM.top}" y2="${TH - TM.bottom}"/>`;

  // The coefficient only changes when a datazone crosses the cut-off, so these are steps.
  const path = (model) => {
    let d = "";
    for (let c = MIN; c <= MAX; c++) {
      const y = ty(FITS[c][model].coef[1]);
      d += c === MIN ? `M${tx(c)},${y}` : `H${tx(c)}V${y}`;
    }
    return d;
  };
  out += `<path class="trace adjusted" d="${path("adjusted")}"/><path class="trace" d="${path("simple")}"/>`;
  out += `<text class="line-label" x="${tx(MIN) + 8}" y="${ty(FITS[MIN].simple.coef[1]) + 22}">${TEXT.models[0]}</text>`;
  out += `<text class="line-label" x="${tx(MIN) + 8}" y="${ty(FITS[MIN].adjusted.coef[1]) - 12}">${TEXT.models[1]}</text>`;

  const now = FITS[state.cutoff];
  out += `<line class="now" x1="${tx(state.cutoff)}" x2="${tx(state.cutoff)}" y1="${TM.top}" y2="${TH - TM.bottom}"/>`;
  for (const model of ["adjusted", "simple"]) out += `<circle class="now-dot" cx="${tx(state.cutoff)}" cy="${ty(now[model].coef[1])}" r="6"/>`;
  $("trace").innerHTML = out;
  $("trace-desc").textContent = TEXT.traceDescription(all, practical);
}

// ---------------------------------------------------------------- the panel
function drawPanel() {
  const now = FITS[state.cutoff];
  $("cutoff").value = state.cutoff;
  $("cutoff-value").textContent = state.cutoff;
  $("kept").innerHTML = TEXT.kept(now);
  $("coef-table").innerHTML =
    `<thead><tr><th scope="col">Model</th><th scope="col" class="num">Estimate</th><th scope="col" class="num">95% CI</th></tr></thead><tbody>` +
    ["simple", "adjusted"].map((model, i) => {
      const m = now[model];
      return `<tr><td>${TEXT.models[i]}</td><td class="num">${m.coef[1].toFixed(2)}</td><td class="num">${m.ci[1][0].toFixed(2)} to ${m.ci[1][1].toFixed(2)}</td></tr>`;
    }).join("") + `</tbody>`;
  $("fit").innerHTML = TEXT.fit(now);
  $("code").textContent = TEXT.code(state.cutoff);

  $("six-table").innerHTML =
    `<thead><tr><th scope="col" class="num">Retailers</th><th scope="col" class="num">Residents</th><th scope="col" class="num">Per 1,000</th><th scope="col" class="num">Smoking</th><th scope="col"></th></tr></thead><tbody>` +
    SIX.map((row) => {
      const removed = row[0] > state.cutoff;
      return `<tr class="${removed ? "removed" : ""}"><td class="num">${row[3]}</td><td class="num">${row[4]}</td><td class="num">${row[0].toFixed(1)}</td><td class="num">${row[1].toFixed(1)}%</td><td>${removed ? "removed" : "kept"}</td></tr>`;
    }).join("") + `</tbody>`;

  const gone = SIX.filter((row) => row[0] > state.cutoff).length;
  // "some" moves on each time another of the six goes, so it flashes for each one.
  if (gone === 0) explain("none", TEXT.explain.none(all));
  else if (gone < SIX.length) explain(`some ${gone}`, TEXT.explain.some(all, practical, now, gone));
  else if (state.cutoff >= EDGE) explain("all", TEXT.explain.all(all, practical, now, gone, EDGE));
  else explain("deep", TEXT.explain.deep(all, practical, now));
}

function render() { drawChart(); drawTrace(); drawPanel(); }

// ---------------------------------------------------------------- events
$("cutoff").addEventListener("input", (e) => { state.cutoff = Number(e.target.value); render(); });
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-cutoff]");
  if (b) { state.cutoff = Number(b.dataset.cutoff); render(); }
});

// Hovering shows the nearest datazone.
$("chart").addEventListener("pointermove", (e) => {
  const chart = $("chart");
  const box = chart.getBoundingClientRect();
  const scale = W / box.width;
  const px = (e.clientX - box.left) * scale, py = (e.clientY - box.top) * scale;
  let best = null, bestD = 18 ** 2;
  for (const row of chart.kept) {
    const d = (chart.sx(row[0]) - px) ** 2 + (sy(row[1]) - py) ** 2;
    if (d < bestD) { bestD = d; best = row; }
  }
  const tip = $("tip"), hover = $("hover");
  if (!best) { tip.hidden = true; hover.setAttribute("visibility", "hidden"); return; }
  hover.setAttribute("cx", chart.sx(best[0])); hover.setAttribute("cy", sy(best[1])); hover.setAttribute("visibility", "visible");
  tip.innerHTML = `<b>${best[3]}</b> retailers and <b>${best[4]}</b> residents<br>Retailers per 1,000 people: <b>${best[0].toFixed(1)}</b><br>Smoking rate: <b>${best[1].toFixed(1)}%</b>`;
  tip.hidden = false;
  const left = chart.sx(best[0]) / scale, top = sy(best[1]) / scale;
  tip.style.left = `${Math.min(left + 12, box.width - tip.offsetWidth - 4)}px`;
  tip.style.top = `${Math.max(top - tip.offsetHeight - 10, 0)}px`;
});
$("chart").addEventListener("pointerleave", () => { $("tip").hidden = true; $("hover").setAttribute("visibility", "hidden"); });

$("legend").innerHTML =
  `<li><span class="swatch round extreme"></span>More than 100 retailers per 1,000 people</li>` +
  `<li><span class="swatch line"></span>Regression line (retailers only)</li>`;
$("intro").textContent = TEXT.intro;
render();

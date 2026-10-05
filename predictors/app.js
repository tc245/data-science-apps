import { DATA } from "./data.js";
import { DOMAINS, fit, correlation } from "./fit.js";
import { explain } from "../shared/explain.js";
import { TEXT } from "./text.js";

const $ = (id) => document.getElementById(id);
const state = { included: new Set(["health_rank"]) };
const PRESETS = { income: ["income_rank"], all: DOMAINS, rest: DOMAINS.filter((name) => name !== "income_rank") };

const ALONE = Object.fromEntries(DOMAINS.map((name) => [name, fit(DATA, [name])]));
const FULL = fit(DATA, DOMAINS);
const R = Object.fromEntries(DOMAINS.map((a) => [a, Object.fromEntries(DOMAINS.map((b) => [b, correlation(DATA, a, b)]))]));
const names = () => DOMAINS.filter((name) => state.included.has(name));
// A proper minus sign, and no "−0.00".
const num = (x, dp = 2) => { const t = x.toFixed(dp); return Number(t) === 0 ? t.replace("-", "") : t.replace("-", "−"); };

// ---------------------------------------------------------------- the coefficient plot
const W = 720, H = 400, M = { left: 158, right: 20, top: 12, bottom: 54 };
const X_MIN = -0.34, X_MAX = 0.14;
const sx = (v) => M.left + ((v - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right);
const ROW = (H - M.top - M.bottom) / DOMAINS.length;
const rowY = (i) => M.top + ROW * (i + 0.5);

function drawChart(now) {
  let out = "";
  for (const x of [-0.3, -0.2, -0.1, 0, 0.1]) {
    out += `<line class="${x === 0 ? "zero" : "grid"}" x1="${sx(x)}" x2="${sx(x)}" y1="${M.top}" y2="${H - M.bottom}"/>`;
    out += `<text x="${sx(x)}" y="${H - M.bottom + 21}" text-anchor="middle">${num(x, 1)}</text>`;
  }
  out += `<text class="axis-title" x="${(M.left + W - M.right) / 2}" y="${H - 8}" text-anchor="middle">Change in retailers per 1,000 people for every 100 ranks</text>`;
  DOMAINS.forEach((name, i) => {
    const y = rowY(i), a = ALONE[name].terms[name], m = now?.terms[name];
    out += `<text class="row-label ${m ? "" : "off"}" x="${M.left - 12}" y="${y + 5}" text-anchor="end">${name}</text>`;
    out += `<g><title>${name} as the only domain in the model: ${num(a.estimate)} (${num(a.ci[0])} to ${num(a.ci[1])})</title>` +
      `<line class="alone-ci" x1="${sx(a.ci[0])}" x2="${sx(a.ci[1])}" y1="${y - 8}" y2="${y - 8}"/><circle class="alone" cx="${sx(a.estimate)}" cy="${y - 8}" r="5"/></g>`;
    if (m) {
      out += `<g><title>${name} in the model you have built: ${num(m.estimate)} (${num(m.ci[0])} to ${num(m.ci[1])})</title>` +
        `<line class="model-ci" x1="${sx(m.ci[0])}" x2="${sx(m.ci[1])}" y1="${y + 8}" y2="${y + 8}"/><circle class="model" cx="${sx(m.estimate)}" cy="${y + 8}" r="6.5"/></g>`;
    }
  });
  $("chart").innerHTML = out;
  $("chart-desc").textContent = TEXT.chartDescription(names());
}

// ---------------------------------------------------------------- the grid of correlations
const GW = 720, GH = 330, GM = { left: 158, top: 34 };
const CW = (GW - GM.left - 6) / DOMAINS.length, CH = (GH - GM.top - 4) / DOMAINS.length;
const short = (name) => name.replace("_rank", "");

function drawGrid() {
  let out = "";
  DOMAINS.forEach((a, i) => {
    const on = state.included.has(a) ? "on" : "off";
    out += `<text class="grid-label ${on}" x="${GM.left - 12}" y="${GM.top + CH * (i + 0.5) + 5}" text-anchor="end">${short(a)}</text>`;
    out += `<text class="grid-label top" x="${GM.left + CW * (i + 0.5)}" y="${GM.top - 12}" text-anchor="middle">${short(a)}</text>`;
    DOMAINS.forEach((b, j) => {
      const r = R[a][b], x = GM.left + CW * j, y = GM.top + CH * i;
      // blue for positive and red for negative, fading to the background at zero
      const fill = `color-mix(in oklab, var(${r < 0 ? "--neg" : "--pos"}) ${Math.round(Math.abs(r) * 100)}%, var(--surface))`;
      out += `<rect class="cell" x="${x}" y="${y}" width="${CW}" height="${CH}" rx="4" style="fill: ${fill}"><title>${a} and ${b}: ${num(r)}</title></rect>`;
      out += `<text class="cell-text ${Math.abs(r) > 0.55 ? "strong" : ""}" x="${x + CW / 2}" y="${y + CH / 2 + 5}" text-anchor="middle">${i === j ? "1" : num(r)}</text>`;
    });
  });
  $("grid").innerHTML = out;
  $("grid-desc").textContent = TEXT.gridDescription(R.income_rank.health_rank);
}

// ---------------------------------------------------------------- the model panel and the explanation
function drawPanel(now) {
  const included = names();
  $("code").textContent = included.length ? TEXT.code(included) : TEXT.noCode;
  $("coef-table").innerHTML =
    `<thead><tr>${TEXT.columns.map((c, i) => `<th scope="col" class="${i ? "num" : ""}">${c}</th>`).join("")}</tr></thead><tbody>` +
    included.map((name) => {
      const m = now.terms[name];
      return `<tr><td><code>${name}</code></td><td class="num">${num(m.estimate)}</td><td class="num">${num(m.ci[0])} to ${num(m.ci[1])}</td><td class="num">${num(ALONE[name].terms[name].estimate)}</td></tr>`;
    }).join("") + `</tbody>`;
  $("fit").innerHTML = now ? TEXT.fit(now) : "";

  if (!included.length) return explain("none", TEXT.explain.none());
  if (included.length === 1) return explain(`one ${included[0]}`, TEXT.explain.one(included[0], now, ALONE));
  if (state.included.has("income_rank")) {
    const others = included.filter((name) => name !== "income_rank");
    const isFull = included.length === DOMAINS.length;
    return explain(isFull ? "full" : "with income", TEXT.explain.withIncome(now, ALONE, FULL, others, isFull, R.income_rank.health_rank));
  }
  // domains whose confidence interval is clear of zero, as it is shown in the table (to 2 decimal places)
  const shown = (v) => Number(v.toFixed(2));
  const clear = included.filter((name) => shown(now.terms[name].ci[0]) * shown(now.terms[name].ci[1]) > 0 && name !== "access_rank");
  explain("without income", TEXT.explain.withoutIncome(now, ALONE, FULL, clear));
}

function render() {
  const included = names();
  const now = included.length ? fit(DATA, included) : null;
  document.querySelectorAll("#domains input").forEach((box) => { box.checked = state.included.has(box.value); });
  drawChart(now);
  drawGrid();
  drawPanel(now);
}

// ---------------------------------------------------------------- set-up and events
$("domains").innerHTML = DOMAINS.map((name) => `<label class="toggle"><input type="checkbox" value="${name}"><code>${name}</code></label>`).join("");
$("domains").addEventListener("change", (e) => {
  if (e.target.checked) state.included.add(e.target.value); else state.included.delete(e.target.value);
  render();
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-preset]");
  if (b) { state.included = new Set(PRESETS[b.dataset.preset]); render(); }
});

$("legend").innerHTML =
  `<li><span class="swatch alone"></span><span>${TEXT.legend.alone}</span></li><li><span class="swatch model"></span><span>${TEXT.legend.model}</span></li>`;
$("intro").textContent = TEXT.intro;
$("scale-note").textContent = TEXT.scaleNote(FULL);
render();

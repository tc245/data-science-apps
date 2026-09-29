import { RETAILERS, POSTCODES, DUPLICATE, TRUE_COUNTS, JOINS, join, countByDatazone } from "./joins.js";
import { TEXT } from "./text.js";

const state = { lang: "R", how: "left", dup: false };
const $ = (id) => document.getElementById(id);

// Remember the language choice between visits (it's only a convenience).
try {
  const saved = localStorage.getItem("dsg-lang");
  if (saved === "R" || saved === "Python") state.lang = saved;
} catch { /* storage unavailable */ }

function cell(value, na) {
  return value == null ? `<td class="na">${na}</td>` : `<td>${value}</td>`;
}

function renderTable(el, columns, rows, na, rowClass = () => "", rowTag = () => "") {
  el.innerHTML =
    `<thead><tr>${columns.map((c) => `<th scope="col"><code>${c}</code></th>`).join("")}</tr></thead>` +
    `<tbody>${rows.map((r) => {
      const tag = rowTag(r);
      return `<tr class="${rowClass(r)}">${columns.map((c, i) => {
        const v = r[c];
        if (i === columns.length - 1 && tag) {
          return (v == null ? `<td class="na">${na}` : `<td>${v}`) + ` <span class="tag">${tag}</span></td>`;
        }
        return cell(v, na);
      }).join("")}</tr>`;
    }).join("")}</tbody>`;
}

function render() {
  const T = TEXT[state.lang];
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
  $("intro").textContent = T.intro;

  const buttons = $("join-buttons");
  buttons.innerHTML = JOINS.map((h) =>
    `<button type="button" data-how="${h}" aria-pressed="${h === state.how}"><code>${T.labels[h]}</code></button>`).join("");

  const y = state.dup ? [...POSTCODES, DUPLICATE] : POSTCODES;
  renderTable($("x-table"), ["Premises Name", "postcode"], RETAILERS, T.na);
  renderTable($("y-table"), ["postcode", "DataZone2011Code"], y, T.na, (r) => (r.duplicate ? "dup" : ""),
    (r) => (r.duplicate ? "duplicate" : ""));

  const rows = join(RETAILERS, y, state.how);
  const cols = state.how === "anti" ? ["Premises Name", "postcode"] : ["Premises Name", "postcode", "DataZone2011Code"];
  renderTable($("joined-table"), cols, rows, T.na,
    (r) => (r.duplicate ? "dup" : r.from === "x" ? "x" : r.from === "y" ? "y" : ""),
    (r) => (r.duplicate ? "duplicate" : r.from === "x" ? "no match" : r.from === "y" ? "postcode only" : ""));
  $("row-count").textContent = `(${rows.length} row${rows.length === 1 ? "" : "s"})`;

  // Counts, compared with the real number of retailers.
  const countTable = $("count-table");
  if (state.how === "anti") {
    countTable.innerHTML = `<tbody><tr><td class="na wrap">Nothing to count: the result isn't joined to any datazones.</td></tr></tbody>`;
    $("verdict").textContent = "";
    $("verdict").className = "verdict";
  } else {
    const counts = countByDatazone(rows);
    const zones = Object.keys(TRUE_COUNTS);
    let allRight = true;
    const body = zones.map((z) => {
      const got = counts[z] || 0;
      const right = got === TRUE_COUNTS[z];
      allRight = allRight && right;
      return `<tr class="${right ? "" : "wrong"}"><td><code>${z}</code></td><td>${got}</td><td>${TRUE_COUNTS[z]}</td>` +
        `<td>${right ? '<span class="ok" aria-hidden="true">✓</span><span class="visually-hidden">right</span>' : '<span class="bad" aria-hidden="true">✗</span><span class="visually-hidden">wrong</span>'}</td></tr>`;
    }).join("");
    countTable.innerHTML = `<thead><tr><th scope="col">Datazone</th><th scope="col">Rows counted</th><th scope="col">Real retailers</th><th scope="col"><span class="visually-hidden">Right or wrong?</span></th></tr></thead><tbody>${body}</tbody>`;
    $("verdict").textContent = allRight ? "All of the counts are right." : "Some of the counts are wrong!";
    $("verdict").className = `verdict ${allRight ? "good" : "badv"}`;
  }

  $("explain").innerHTML = T.explain[state.how];
  const showDup = state.dup && state.how !== "anti";
  $("dup-note").hidden = !showDup;
  $("dup-note").innerHTML = showDup ? T.duplicate : "";
  $("code").textContent = T.code[state.how];
  $("count-code").textContent = state.how === "anti" ? "# Nothing to count here" : T.count;
}

document.addEventListener("click", (e) => {
  const lang = e.target.closest("[data-lang]");
  const how = e.target.closest("[data-how]");
  if (lang) {
    state.lang = lang.dataset.lang;
    try { localStorage.setItem("dsg-lang", state.lang); } catch { /* ignore */ }
    render();
  } else if (how) {
    state.how = how.dataset.how;
    render();
    document.querySelector(`[data-how="${state.how}"]`).focus();
  }
});
$("dup").addEventListener("change", (e) => { state.dup = e.target.checked; render(); });

render();

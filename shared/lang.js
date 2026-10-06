// The R / Python switch for the code on a page. The choice is remembered between visits
// (it's only a convenience) and is shared with the join explorer.
export let lang = "R";
try {
  if (localStorage.getItem("dsg-lang") === "Python") lang = "Python";
} catch { /* storage unavailable */ }

// Wire up the [data-lang] buttons; `render` redraws the page after a change.
export function onLang(render) {
  const show = () => document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lang]");
    if (!b) return;
    lang = b.dataset.lang;
    try { localStorage.setItem("dsg-lang", lang); } catch { /* ignore */ }
    show();
    render();
  });
  show();
}

// Update the "What's going on?" box. It flashes briefly when it moves on to a new explanation
// (`key` names the explanation), so you notice that it has changed.
let last;
export function explain(key, html) {
  const el = document.getElementById("explain");
  el.innerHTML = html;
  if (last !== undefined && key !== last) {
    const box = el.closest(".explain");
    box.classList.remove("changed");
    void box.offsetWidth; // restart the animation
    box.classList.add("changed");
  }
  last = key;
}

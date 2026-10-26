// Neighbours, weights, spatial lags and Moran's I for the Practical 6 apps (the same sums as spdep in R).
import { RINGS, CENTROIDS } from "./datazones.js";

// knn2nb(knearneigh(centroids, k)): the k datazones with the nearest centroids (not counting itself).
export function nearest(i, k) {
  const [x, y] = CENTROIDS[i];
  return CENTROIDS.map(([cx, cy], j) => [j, (cx - x) ** 2 + (cy - y) ** 2])
    .filter(([j]) => j !== i)
    .sort((a, b) => a[1] - b[1])
    .slice(0, k)
    .map(([j]) => j)
    .sort((a, b) => a - b);
}

// nb2listw(style = "B" or "W"): every neighbour gets 1, or 1 / (number of neighbours).
export const weights = (nb, style) => nb.map((n) => n.map(() => (style === "W" ? 1 / n.length : 1)));

// lag.listw(): the weighted sum of each datazone's neighbours' values.
export const lag = (nb, w, values) => nb.map((n, i) => n.reduce((s, j, k) => s + w[i][k] * values[j], 0));

// moran(x, listw, n, Szero(listw))$I with row-standardised weights.
export function moranI(nb, values) {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const z = values.map((v) => v - mean);
  const lz = lag(nb, weights(nb, "W"), z);
  const s0 = nb.filter((x) => x.length).length; // each datazone's weights add up to 1
  return (n / s0) * z.reduce((s, v, i) => s + v * lz[i], 0) / z.reduce((s, v) => s + v * v, 0);
}

// SVG paths for the map. y is flipped so north is up.
export const HEIGHT = Math.max(...RINGS.flatMap((r) => r.filter((_, k) => k % 2)));
export const WIDTH = Math.max(...RINGS.flatMap((r) => r.filter((_, k) => k % 2 === 0)));
export const PATHS = RINGS.map((r) => {
  let d = "";
  for (let k = 0; k < r.length; k += 2) d += `${k ? "L" : "M"}${r[k]} ${HEIGHT - r[k + 1]}`;
  return d + "Z";
});
export const point = ([x, y]) => [x, HEIGHT - y];

// A light-to-dark blue for sequential values (the colour of a choropleth), from 0 to 1.
const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
export function blue(t) {
  const x = Math.min(Math.max(t, 0), 1) * (RAMP.length - 1), k = Math.min(Math.floor(x), RAMP.length - 2), f = x - k;
  const hex = (h, i) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  return `rgb(${[0, 1, 2].map((i) => Math.round(hex(RAMP[k], i) * (1 - f) + hex(RAMP[k + 1], i) * f)).join(",")})`;
}

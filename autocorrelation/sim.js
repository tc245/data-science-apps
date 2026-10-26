// Simulated values for the autocorrelation app: one value per datazone (for space), and
// eight years for each of 200 areas (for time), plus the shuffles behind the permutation tests.
import { QUEEN } from "../shared/datazones.js";
import { random } from "../shared/random.js";

const standardise = (xs) => {
  const m = xs.reduce((s, v) => s + v, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length);
  return xs.map((v) => (v - m) / sd);
};

// `clustered` (0 to 1) blends plain random noise with noise that has been averaged with its
// neighbours a few times (which makes neighbouring datazones alike).
export function simulateSpace(seed, clustered) {
  const r = random(seed);
  const noise = QUEEN.map(() => r.normal());
  let smooth = noise;
  for (let pass = 0; pass < 4; pass++) smooth = QUEEN.map((n, i) => (smooth[i] + n.reduce((s, j) => s + smooth[j], 0)) / (n.length + 1));
  const a = standardise(noise), b = standardise(smooth);
  return standardise(a.map((v, i) => (1 - clustered) * v + clustered * b[i]));
}

export const AREAS = 200, YEARS = 8;

// Each area's value is `persistence` times last year's value plus some new noise (an AR(1) series).
export function simulateTime(seed, persistence) {
  const r = random(seed);
  return Array.from({ length: AREAS }, () => {
    let v = r.normal(); // starting from variance 1, which the series then keeps
    return Array.from({ length: YEARS }, () => (v = persistence * v + Math.sqrt(1 - persistence ** 2) * r.normal()));
  });
}

// cor(value, value last year), using every area and every year that has a year before it.
export function lagCorrelation(series) {
  const x = [], y = [];
  for (const s of series) for (let t = 1; t < s.length; t++) { x.push(s[t - 1]); y.push(s[t]); }
  const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
  let sxy = 0, sxx = 0, syy = 0;
  x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2; });
  return sxy / Math.sqrt(sxx * syy);
}

// sample(): the same values in a random order.
export function shuffle(r, xs) {
  const out = xs.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r.uniform() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// Deal all of the values out again at random, to any area and any year (like shuffling the map).
export function shuffleSeries(r, series) {
  const all = shuffle(r, series.flat());
  return series.map((s, a) => all.slice(a * s.length, (a + 1) * s.length));
}

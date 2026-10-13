// The simulated data, and the numbers behind R's plot(model) for a regression of y on x.
import { lm } from "../shared/model.js";

// Random numbers we can repeat: the same seed always gives the same ones (like set.seed() in R).
// Returns n uniform (0 to 1) numbers for x and n standard normal ones for the noise.
export function draws(seed, n = 100) {
  let a = seed >>> 0;
  const uniform = () => { // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const u = Array.from({ length: n }, uniform);
  const z = Array.from({ length: n }, () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform()));
  return { u, z };
}

// curve and fan both run from 0 to 1. At 0 and 0 this is the practical's "good" data, x + rnorm(100, 0, 10).
// At 1 and 1 it is the "bad" data, x^2 + rnorm(100, 0, 15 * x), divided by 100 so it fits on the same axes.
export function simulate({ u, z }, curve, fan) {
  const x = u.map((v) => 100 * v);
  const y = x.map((v, i) => (1 - curve) * v + curve * v * v / 100 + ((1 - fan) * 10 + fan * 0.15 * v) * z[i]);
  return { x, y };
}

// The normal quantile function, qnorm() in R (Acklam's approximation, good to about 1e-9).
export function qnorm(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// The smooth red line in R's plots: at each point, a straight line fitted to the nearest two thirds of
// the data, with closer points counting for more. The fit is then repeated three times, each time
// counting points with big residuals for less, so that a few extreme points don't drag the line about.
// This is lowess() in R. Returns [x, smoothed y] pairs in order of x.
export function lowess(x, y, f = 2 / 3, iter = 3) {
  const n = x.length, q = Math.max(Math.min(Math.floor(f * n + 1e-7), n), 2);
  let robust = x.map(() => 1), smooth;
  for (let pass = 0; pass <= iter; pass++) {
    smooth = x.map((x0) => {
      const dist = x.map((v) => Math.abs(v - x0));
      const h = [...dist].sort((p, r) => p - r)[q - 1];
      let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      for (let i = 0; i < n; i++) {
        if (dist[i] >= h) continue;
        const w = robust[i] * (1 - (dist[i] / h) ** 3) ** 3;
        sw += w; swx += w * x[i]; swy += w * y[i]; swxx += w * x[i] * x[i]; swxy += w * x[i] * y[i];
      }
      const slope = (sw * swxy - swx * swy) / (sw * swxx - swx * swx);
      return (swy - slope * swx) / sw + slope * x0;
    });
    const size = y.map((v, i) => Math.abs(v - smooth[i]));
    const sorted = [...size].sort((p, r) => p - r), half = Math.floor(n / 2);
    const limit = 3 * (sorted[half] + sorted[n - half - 1]); // six times the median residual
    robust = size.map((r) => (r >= limit ? 0 : (1 - (r / limit) ** 2) ** 2));
  }
  return x.map((v, i) => [v, smooth[i]]).sort((p, r) => p[0] - r[0]);
}

// Everything the four plots need. Each row is one observation.
export function diagnose(x, y) {
  const n = x.length, model = lm(y, [x]);
  const [b0, b1] = model.coef;
  const fitted = x.map((v) => b0 + b1 * v);
  const resid = y.map((v, i) => v - fitted[i]);
  const sigma = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / model.df);
  const mean = x.reduce((s, v) => s + v, 0) / n;
  const sxx = x.reduce((s, v) => s + (v - mean) ** 2, 0);
  // Standardised residuals, rstandard() in R: each residual divided by its own standard error.
  const std = resid.map((r, i) => r / (sigma * Math.sqrt(1 - 1 / n - (x[i] - mean) ** 2 / sxx)));

  // The Q-Q plot puts the smallest residual against the smallest quantile we would expect from a
  // normal distribution, the next smallest against the next, and so on.
  const order = std.map((_, i) => i).sort((p, r) => std[p] - std[r]);
  const theoretical = [];
  order.forEach((i, rank) => { theoretical[i] = qnorm((rank + 0.5) / n); }); // ppoints() in R, for more than 10 points
  // The dashed line goes through the quartiles, like qqline() in R.
  const quantile = (p) => { const k = (n - 1) * p, lo = Math.floor(k); return std[order[lo]] + (k - lo) * (std[order[Math.min(lo + 1, n - 1)]] - std[order[lo]]); };
  const slope = (quantile(0.75) - quantile(0.25)) / (2 * qnorm(0.75));
  const qqline = [quantile(0.25) - slope * qnorm(0.25), slope];

  const scale = std.map((s) => Math.sqrt(Math.abs(s)));
  return {
    model, sigma, adjR2: 1 - (1 - model.r2) * (n - 1) / model.df, qqline,
    rows: x.map((v, i) => ({ x: v, y: y[i], fitted: fitted[i], resid: resid[i], std: std[i], theoretical: theoretical[i], scale: scale[i] })),
    smoothResid: lowess(fitted, resid),
    smoothScale: lowess(fitted, scale),
  };
}

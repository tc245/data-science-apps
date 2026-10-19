// Linear regression by ordinary least squares, and logistic and Poisson regression (glm), for the handful of predictors we need.

// Solve A x = b for a small square matrix (Gauss-Jordan with pivoting).
function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    M[c] = M[c].map((v) => v / d);
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c];
      M[r] = M[r].map((v, k) => v - f * M[c][k]);
    }
  }
  return M.map((row) => row.slice(n));
}

// y: outcome, xs: one array per predictor. The intercept is added for us, like lm().
export function lm(y, xs) {
  const n = y.length;
  const cols = [y.map(() => 1), ...xs];
  const k = cols.length;
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const XtX = cols.map((a) => cols.map((b) => dot(a, b)));
  const identity = cols.map((_, i) => cols.map((_, j) => (i === j ? 1 : 0)));
  const inv = solve(XtX, identity);
  const Xty = cols.map((a) => dot(a, y));
  const coef = inv.map((row) => dot(row, Xty));

  const mean = y.reduce((s, v) => s + v, 0) / n;
  let rss = 0, tss = 0;
  for (let i = 0; i < n; i++) {
    const fitted = coef.reduce((s, b, j) => s + b * cols[j][i], 0);
    rss += (y[i] - fitted) ** 2;
    tss += (y[i] - mean) ** 2;
  }
  const df = n - k;
  const se = inv.map((row, i) => Math.sqrt((rss / df) * row[i]));
  // ponytail: 1.962 is the t value for our ~1,200 degrees of freedom; use a t quantile function if the data ever get small
  const ci = coef.map((b, i) => [b - 1.962 * se[i], b + 1.962 * se[i]]);
  return { coef, se, ci, r2: 1 - rss / tss, df };
}

export const predict = (model, values) => model.coef.reduce((s, b, i) => s + b * (i === 0 ? 1 : values[i - 1]), 0);

// glm(), for logistic (family "binomial", y is 0 or 1) and Poisson (family "poisson", y is a count) regression.
// `offset` is the log of the denominator for a Poisson rate, like offset(log(pregnant_women)) in R.
// R fits these by iteratively reweighted least squares, and so do we: a weighted lm() on a "working"
// version of y, repeated until the coefficients stop changing.
const logFactorial = (k) => { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; };
export function glm(y, xs, { family = "binomial", offset } = {}) {
  const n = y.length, cols = [y.map(() => 1), ...xs], k = cols.length;
  const off = offset ?? y.map(() => 0);
  const poisson = family === "poisson";
  const inverseLink = (eta) => (poisson ? Math.exp(eta) : 1 / (1 + Math.exp(-eta)));
  const deviance = (mu) => 2 * y.reduce((s, v, i) => s + (poisson
    ? (v > 0 ? v * Math.log(v / mu[i]) : 0) - (v - mu[i])
    : -(v * Math.log(mu[i]) + (1 - v) * Math.log(1 - mu[i]))), 0);
  let mu = y.map((v) => (poisson ? v + 0.1 : (v + 0.5) / 2));
  let eta = mu.map((m) => (poisson ? Math.log(m) : Math.log(m / (1 - m))));
  let coef, inv, dev = Infinity;
  for (let iter = 0; iter < 50; iter++) {
    const w = mu.map((m) => (poisson ? m : m * (1 - m)));
    const z = eta.map((e, i) => e - off[i] + (y[i] - mu[i]) / w[i]);
    const XtWX = cols.map((a) => cols.map((b) => a.reduce((s, v, i) => s + v * w[i] * b[i], 0)));
    inv = solve(XtWX, cols.map((_, i) => cols.map((_, j) => (i === j ? 1 : 0))));
    const XtWz = cols.map((a) => a.reduce((s, v, i) => s + v * w[i] * z[i], 0));
    coef = inv.map((row) => row.reduce((s, v, j) => s + v * XtWz[j], 0));
    eta = y.map((_, i) => off[i] + coef.reduce((s, b, j) => s + b * cols[j][i], 0));
    mu = eta.map(inverseLink);
    const next = deviance(mu);
    if (Math.abs(next - dev) < 1e-10 * (Math.abs(next) + 0.1)) { dev = next; break; }
    dev = next;
  }
  // One more pass of the weights at the final fit, for the standard errors.
  const w = mu.map((m) => (poisson ? m : m * (1 - m)));
  inv = solve(cols.map((a) => cols.map((b) => a.reduce((s, v, i) => s + v * w[i] * b[i], 0))), cols.map((_, i) => cols.map((_, j) => (i === j ? 1 : 0))));
  const df = n - k;
  const aic = poisson ? -2 * y.reduce((s, v, i) => s + v * Math.log(mu[i]) - mu[i] - logFactorial(v), 0) + 2 * k : dev + 2 * k;
  // The Pearson statistic: how spread out the data are compared with what the model expects (about 1 if all is well).
  const dispersion = y.reduce((s, v, i) => s + (v - mu[i]) ** 2 / w[i], 0) / df;
  return { coef, se: inv.map((row, i) => Math.sqrt(row[i])), deviance: dev, df, aic, dispersion, fitted: mu };
}

// Linear regression by ordinary least squares, for the handful of predictors we need.

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

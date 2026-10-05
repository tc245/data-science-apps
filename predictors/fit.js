// Models of retailers_adj on any choice of the seven SIMD domains.
// Rows are [retailers_adj, income_rank, health_rank, employment_rank, education_rank, access_rank, crime_rank, housing_rank].
import { lm } from "../shared/model.js";

export const DOMAINS = ["income_rank", "health_rank", "employment_rank", "education_rank", "access_rank", "crime_rank", "housing_rank"];
export const PER = 100; // coefficients are reported for every 100 ranks, so they are easier to read

const column = (data, j) => data.map((row) => row[j]);

// `included` is a list of domain names. Returns one entry per domain, in the order given.
export function fit(data, included) {
  const m = lm(column(data, 0), included.map((name) => column(data, DOMAINS.indexOf(name) + 1)));
  const n = data.length;
  return {
    r2: m.r2,
    adjR2: 1 - ((1 - m.r2) * (n - 1)) / m.df,
    terms: Object.fromEntries(included.map((name, i) => [name, {
      estimate: m.coef[i + 1] * PER,
      se: m.se[i + 1] * PER,
      ci: m.ci[i + 1].map((v) => v * PER),
    }])),
  };
}

export function correlation(data, a, b) {
  const x = column(data, DOMAINS.indexOf(a) + 1), y = column(data, DOMAINS.indexOf(b) + 1);
  const mean = (v) => v.reduce((s, t) => s + t, 0) / v.length;
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

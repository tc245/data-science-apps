// Simulated datazones for the Poisson regression app, and the models we fit to them.
import { glm } from "../shared/model.js";
import { random } from "../shared/random.js";

// The "true" smoking rate we simulate from: 30% in the most deprived datazone, falling to about 6% in
// the least deprived, like the data in the practical.
export const TRUE = { intercept: Math.log(0.3), slope: Math.log(0.2) / 1600 };
export const trueRatio = Math.exp(100 * TRUE.slope); // the rate ratio for going up 100 ranks
export const N = 200;

// `extra` (0 to 1) is how much datazones differ from each other beyond what deprivation explains.
// At 0 the counts are exactly Poisson; above 0 they are overdispersed.
export function simulate(seed, extra) {
  const r = random(seed);
  const rank = Array.from({ length: N }, () => Math.ceil(r.uniform() * 1600));
  // More deprived datazones have more pregnant women (about 45, against about 15 in the least deprived).
  const women = rank.map((k) => Math.max(5, Math.round(15 + 30 * (1 - k / 1600) + 6 * r.normal())));
  const sd = 0.7 * extra;
  const smokers = rank.map((k, i) => r.poisson(women[i] * Math.exp(TRUE.intercept + TRUE.slope * k + sd * r.normal() - (sd * sd) / 2)));
  return { rank, women, smokers };
}

// The Poisson model, with or without offset(log(pregnant_women)), plus the quasipoisson standard error.
export function fit({ rank, women, smokers }, offset = true) {
  const m = glm(smokers, [rank], { family: "poisson", offset: offset ? women.map(Math.log) : undefined });
  const ci = (se) => [-1, 1].map((sign) => Math.exp(100 * (m.coef[1] + sign * 1.96 * se)));
  const quasiSe = m.se[1] * Math.sqrt(m.dispersion);
  return { ...m, ratio: Math.exp(100 * m.coef[1]), quasiSe, ci: ci(m.se[1]), quasiCi: ci(quasiSe) };
}

// Run the same study many times: how often does each 95% confidence interval contain the true rate ratio?
export function coverage(extra, offset, studies = 200) {
  let poisson = 0, quasi = 0;
  for (let j = 1; j <= studies; j++) {
    const m = fit(simulate(100000 + j, extra), offset);
    if (m.ci[0] <= trueRatio && trueRatio <= m.ci[1]) poisson++;
    if (m.quasiCi[0] <= trueRatio && trueRatio <= m.quasiCi[1]) quasi++;
  }
  return { poisson: poisson / studies, quasi: quasi / studies };
}

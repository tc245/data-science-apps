// Simulated data and models for the interactions explorer.
import { lm } from "../shared/model.js";
import { random } from "../shared/random.js";

export const PER_GROUP = 100, PER_AREA_TYPE = 150, MAX_RETAILERS = 10;
const mean = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;

// ---- Two dummies: 100 treated and 100 untreated datazones, each with a mean smoking rate before and after.
// `gap`: treated minus untreated before. `change`: the change everywhere. `effect`: the extra change in the treated.
export function simulateDummies(seed, { gap, change, effect }) {
  const r = random(seed);
  const rows = []; // [treated, post, smoking_rate]
  for (const treated of [0, 1]) {
    for (let a = 0; a < PER_GROUP; a++) {
      const area = 3 * r.normal(); // some datazones are always higher or lower than others
      for (const post of [0, 1]) rows.push([treated, post, 17 + area + gap * treated + change * post + effect * treated * post + 1.5 * r.normal()]);
    }
  }
  return rows;
}

// lm(smoking_rate ~ treated + post) or lm(smoking_rate ~ treated * post).
// means[t][p] are the real group means and predicted[t][p] the model's predictions.
export function fitDummies(rows, interaction) {
  const y = rows.map((r) => r[2]), t = rows.map((r) => r[0]), p = rows.map((r) => r[1]);
  const model = lm(y, interaction ? [t, p, t.map((v, i) => v * p[i])] : [t, p]);
  const [b0, b1, b2, b3 = 0] = model.coef;
  const cells = [0, 1].map((tt) => [0, 1].map((pp) => [tt, pp]));
  return {
    model,
    means: cells.map((row) => row.map(([tt, pp]) => mean(rows.filter((r) => r[0] === tt && r[1] === pp).map((r) => r[2])))),
    predicted: cells.map((row) => row.map(([tt, pp]) => b0 + b1 * tt + b2 * pp + b3 * tt * pp)),
  };
}

// ---- A dummy and a number: 150 urban and 150 rural datazones with retailers per 1,000 people.
// `urbanSlope`: the true slope in urban datazones. `slopeDiff`: rural slope minus urban slope.
// `ruralGap`: rural minus urban smoking rate in a datazone with no retailers.
export function simulateSlopes(seed, { urbanSlope, slopeDiff, ruralGap }) {
  const r = random(seed);
  const rows = []; // [rural, retailers_adj, smoking_rate]
  for (const rural of [0, 1]) {
    for (let a = 0; a < PER_AREA_TYPE; a++) {
      const x = Math.min(MAX_RETAILERS, (rural ? 2.2 : 3.5) * Math.exp(0.5 * r.normal())); // fewer shops in the countryside
      rows.push([rural, x, 14 + urbanSlope * x + rural * (ruralGap + slopeDiff * x) + 2.5 * r.normal()]);
    }
  }
  return rows;
}

// lm(smoking_rate ~ retailers_adj + urban_rural_2cat) or with `*`. `ref` is the reference category
// ("Rural" is R's default, as it comes first in the alphabet). lines[g] = { intercept, slope }, g: 0 urban, 1 rural.
export function fitSlopes(rows, interaction, ref) {
  const y = rows.map((r) => r[2]), x = rows.map((r) => r[1]);
  const d = rows.map((r) => (ref === "Rural" ? 1 - r[0] : r[0])); // the dummy for the group that isn't the reference
  const model = lm(y, interaction ? [x, d, x.map((v, i) => v * d[i])] : [x, d]);
  const [b0, b1, b2, b3 = 0] = model.coef;
  const refLine = { intercept: b0, slope: b1 }, otherLine = { intercept: b0 + b2, slope: b1 + b3 };
  return { model, lines: ref === "Rural" ? [otherLine, refLine] : [refLine, otherLine] };
}

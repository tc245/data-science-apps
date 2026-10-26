// Simulated treated and untreated datazones for the difference-in-differences builder, and the estimates.
import { lm } from "../shared/model.js";
import { random } from "../shared/random.js";

export const YEARS = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];
export const POLICY = 2016, PER_GROUP = 100;

// The policy's true effect in each year: nothing before 2016, then either all at once or building up to `effect` by 2019.
export const trueEffect = (year, { effect, builds }) => (year < POLICY ? 0 : builds ? (effect * (year - POLICY + 1)) / 4 : effect);

// `gap`: how much higher the treated datazones start (percentage points). `effect`: the policy's effect.
// `trend`: how much faster (per year) smoking changes in the treated datazones anyway; 0 means parallel trends.
export function simulate(seed, { gap, effect, builds, trend }) {
  const r = random(seed);
  const rows = []; // [treated, year, smoking_rate]
  for (const treated of [0, 1]) {
    for (let a = 0; a < PER_GROUP; a++) {
      const area = 3 * r.normal(); // some datazones are always higher or lower than others
      for (const year of YEARS) {
        let y = 18 - 0.5 * (year - 2012) + area + 2 * r.normal();
        if (treated) y += gap + trend * (year - 2015) + trueEffect(year, { effect, builds });
        rows.push([treated, year, y]);
      }
    }
  }
  return rows;
}

const mean = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;

export function estimate(rows) {
  const m = (pred) => mean(rows.filter(pred).map((r) => r[2]));
  const yearly = [0, 1].map((t) => YEARS.map((year) => m((r) => r[0] === t && r[1] === year)));
  const cell = (t, post) => m((r) => r[0] === t && (r[1] >= POLICY) === Boolean(post));
  const table = [[cell(0, 0), cell(0, 1)], [cell(1, 0), cell(1, 1)]];

  // lm(smoking_rate ~ treated * post)
  const y = rows.map((r) => r[2]), treated = rows.map((r) => r[0]), post = rows.map((r) => Number(r[1] >= POLICY));
  const did = lm(y, [treated, post, treated.map((t, i) => t * post[i])]);

  // lm(smoking_rate ~ treated * year_f), with 2015 as the reference year
  const others = YEARS.filter((yr) => yr !== 2015);
  const dummies = others.map((yr) => rows.map((r) => Number(r[1] === yr)));
  const event = lm(y, [treated, ...dummies, ...dummies.map((d) => d.map((v, i) => v * treated[i]))]);
  const k = 2 + others.length;
  const events = YEARS.map((yr) => {
    const j = others.indexOf(yr);
    return j < 0 ? { year: yr, estimate: 0, ci: [0, 0] } : { year: yr, estimate: event.coef[k + j], ci: event.ci[k + j] };
  });

  return {
    yearly, table, did, events,
    beforeAfter: table[1][1] - table[1][0],
    afterOnly: table[1][1] - table[0][1],
    diffInDiff: (table[1][1] - table[1][0]) - (table[0][1] - table[0][0]),
  };
}

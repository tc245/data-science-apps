// Reference values from R, using merged_data_counts.csv without the six datazones with more than 100 retailers per 1000 people.
import { test } from "node:test";
import assert from "node:assert/strict";
import { means, fitModel } from "../reference/quintiles.js";

const close = (a, b, tol = 1e-5) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);

test("group means match tapply()", () => {
  [26.3087419, 19.1421270, 15.3635127, 9.9283648, 5.7142138].forEach((v, i) => close(means[i], v));
});

test("simd_quintile as a factor matches lm()", () => {
  const m = fitModel(0, false);
  close(m.coef[0], 26.3087419);
  close(m.r2, 0.405973);
  // relevel(simd_quintile, ref = "Second")
  const r = fitModel(1, false);
  [19.1421270, 7.1666150, -3.7786143, -9.2137622, -13.4279131].forEach((v, i) => close(r.coef[i], v));
  [0.48804940, 0.69298359, 0.68965982, 0.68857632, 0.68857632].forEach((v, i) => close(r.se[i], v));
  close(r.r2, 0.405973);
});

test("simd_quintile as a number matches lm()", () => {
  const m = fitModel(0, true);
  close(m.coef[0], 30.3986718);
  close(m.coef[1], -5.0366348);
  close(m.se[1], 0.15485986);
  close(m.r2, 0.4017774);
});

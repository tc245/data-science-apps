// Run with: node --test test/
// Coefficients, confidence intervals and R-squared checked against lm() and confint() in R
// for the same models in the Practical 2 notebook.
import test from "node:test";
import assert from "node:assert/strict";
import { DATA } from "../confounding/data.js";
import { lm, predict } from "../shared/model.js";

const [retailers, smoking, rank] = [0, 1, 2].map((j) => DATA.map((row) => row[j]));
const close = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) < tol, `${got} is not ${want}`);

test("the same 1,202 urban datazones as the notebook", () => assert.equal(DATA.length, 1202));

test("simple model: smoking_rate ~ retailers_adj", () => {
  const m = lm(smoking, [retailers]);
  close(m.coef[0], 10.3768);
  close(m.coef[1], 2.7784);
  close(m.se[1], 0.1299);
  close(m.ci[1][0], 2.523513, 2e-3);
  close(m.ci[1][1], 3.033233, 2e-3);
  close(m.r2, 0.276);
  assert.equal(m.df, 1200);
});

test("adjusted model: smoking_rate ~ retailers_adj + simd_rank", () => {
  const m = lm(smoking, [retailers, rank]);
  close(m.coef[0], 24.3677469);
  close(m.coef[1], 1.2250248);
  close(m.coef[2], -0.0138006, 1e-6);
  close(m.ci[1][0], 0.97417981, 2e-3);
  close(m.ci[2][1], -0.01261856, 1e-5);
  close(m.r2, 0.4964);
  close(predict(m, [2, 800]), 24.3677469 + 2 * 1.2250248 - 800 * 0.0138006, 1e-3);
});

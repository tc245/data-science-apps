// Run with: node --test test/
// Checked against R for the same simulated data: lm(), rstandard(), qqnorm(), the quartile line
// that qqline() draws, and lowess(f = 2/3, iter = 3, delta = 0), which is the smooth line in plot(model).
import test from "node:test";
import assert from "node:assert/strict";
import { draws, simulate, diagnose, qnorm } from "../residuals/diagnostics.js";

const close = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) < tol, `${got} is not ${want}`);
const bad = diagnose(...Object.values(simulate(draws(1), 1, 1)));

test("the same seed always gives the same data", () => assert.deepEqual(draws(7), draws(7)));

test("with both sliders at zero y is x plus noise with a standard deviation of 10", () => {
  const random = draws(1), { x, y } = simulate(random, 0, 0);
  x.forEach((v, i) => close(y[i] - v, 10 * random.z[i], 1e-9));
});

test("the model for the bad data", () => {
  close(bad.model.coef[0], -18.6514);
  close(bad.model.coef[1], 1.0834);
  close(bad.model.se[1], 0.0402);
  close(bad.model.r2, 0.8814);
  close(bad.adjR2, 0.8801);
});

test("standardised residuals and the Q-Q plot", () => {
  close(bad.rows[0].std, 0.015);
  close(bad.rows[99].std, -2.1196);
  close(bad.rows[0].theoretical, 0.0878);
  close(bad.qqline[0], -0.0868);
  close(bad.qqline[1], 0.8824);
  close(qnorm(0.975), 1.959964, 1e-6);
  close(qnorm(0.001), -3.090232, 1e-6);
});

test("the smooth lines", () => {
  close(bad.smoothResid[0][1], 13.6694);
  close(bad.smoothResid[49][1], -6.631);
  close(bad.smoothResid[99][1], 8.4653);
  close(bad.smoothScale[0][1], 0.8682);
  close(bad.smoothScale[99][1], 0.9103);
});

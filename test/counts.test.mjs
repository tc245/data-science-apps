// The simulation should behave like the practical describes: Poisson data give a dispersion near 1 and
// 95% confidence intervals that work; extra variation pushes the dispersion up and the Poisson
// intervals stop working, while quasipoisson ones still do. Leaving out the offset biases the rate ratio.
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, fit, coverage, trueRatio } from "../counts/counts.js";

test("the same seed gives the same data", () => {
  assert.deepEqual(simulate(7, 0.5), simulate(7, 0.5));
});

test("Poisson data: dispersion near 1 and the intervals work", () => {
  const m = fit(simulate(3, 0));
  assert.ok(m.deviance / m.df < 1.4, `deviance/df ${m.deviance / m.df}`);
  const c = coverage(0, true);
  assert.ok(c.poisson > 0.9 && c.poisson < 0.99, `coverage ${c.poisson}`);
});

test("overdispersed data: Poisson intervals too narrow, quasipoisson ones fine", () => {
  const m = fit(simulate(3, 1));
  assert.ok(m.deviance / m.df > 2, `deviance/df ${m.deviance / m.df}`);
  const c = coverage(1, true);
  assert.ok(c.poisson < 0.8, `Poisson coverage ${c.poisson}`);
  assert.ok(c.quasi > 0.9, `quasipoisson coverage ${c.quasi}`);
});

test("without the offset the rate ratio is biased", () => {
  const withOffset = fit(simulate(3, 0)), without = fit(simulate(3, 0), false);
  assert.ok(Math.abs(withOffset.ratio - trueRatio) < 0.02, `with offset ${withOffset.ratio}`);
  assert.ok(without.ratio < trueRatio - 0.03, `without offset ${without.ratio}`);
});

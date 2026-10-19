// Reference values from R's glm().
import { test } from "node:test";
import assert from "node:assert/strict";
import { glm } from "../shared/model.js";
import { DATA } from "../logistic/data.js";

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("logistic regression matches glm(family = binomial) for the rural datazones", () => {
  const rank = DATA.map((r) => r[0]);
  const fit = (cut) => glm(DATA.map((r) => (r[1] >= cut ? 1 : 0)), [rank]);
  const m = fit(20);
  close(m.coef[0], 0.8216704947); close(m.coef[1], -0.0026358131);
  close(m.se[0], 0.23969274102); close(m.se[1], 0.00034266889);
  close(m.aic, 360.7269); close(m.deviance, 356.7269);
  close(fit(30).coef[1], -0.0030073699); close(fit(10).aic, 388.1773);
});

test("Poisson regression with an offset matches glm(family = poisson)", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const n = [20, 25, 18, 30, 22, 27, 35, 19, 24, 28, 31, 26];
  const y = [6, 8, 4, 9, 5, 6, 7, 3, 4, 4, 5, 2];
  const m = glm(y, [x], { family: "poisson", offset: n.map(Math.log) });
  close(m.coef[0], -0.99851807429); close(m.coef[1], -0.09293597051);
  close(m.se[0], 0.24942830612); close(m.se[1], 0.03777730522);
  close(m.aic, 46.75797); close(m.deviance, 1.27984); close(m.dispersion, 0.1225618);
});

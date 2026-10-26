// The difference-in-differences builder: the regression should give exactly the numbers we work out
// by hand from the 2 x 2 table and the yearly means, and the estimate should find the true effect
// when the trends are parallel (and miss it when they aren't).
import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, estimate, trueEffect, YEARS, POLICY } from "../did/did.js";

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
const settings = { gap: 2, effect: -3, builds: true, trend: 0 };

test("the treated:post coefficient is the difference-in-differences from the 2 x 2 table", () => {
  const e = estimate(simulate(1, settings));
  close(e.did.coef[0], e.table[0][0]); // untreated, before
  close(e.did.coef[1], e.table[1][0] - e.table[0][0]); // the gap before
  close(e.did.coef[2], e.table[0][1] - e.table[0][0]); // the change in the untreated
  close(e.did.coef[3], e.diffInDiff);
});

test("each event study coefficient is that year's gap minus the 2015 gap", () => {
  const e = estimate(simulate(2, settings));
  const gap = YEARS.map((_, k) => e.yearly[1][k] - e.yearly[0][k]);
  e.events.forEach((ev, k) => close(ev.estimate, gap[k] - gap[3]));
});

test("parallel trends: the estimate finds the true effect; non-parallel trends: it doesn't", () => {
  const truth = YEARS.filter((y) => y >= POLICY).reduce((s, y) => s + trueEffect(y, settings), 0) / 4;
  const avg = (s) => Array.from({ length: 20 }, (_, i) => estimate(simulate(100 + i, s)).diffInDiff).reduce((a, b) => a + b) / 20;
  close(avg(settings), truth, 0.15);
  assert.ok(avg({ ...settings, trend: -0.5 }) < truth - 1, "a steeper trend in the treated areas looks like a bigger effect");
});

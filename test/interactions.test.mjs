// The interactions explorer: with `*` the model reproduces each group exactly (four means, or a
// separate line for each group); with `+` it forces the same change, or the same slope, on both groups.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lm } from "../shared/model.js";
import { simulateDummies, fitDummies, simulateSlopes, fitSlopes } from "../interactions/sim.js";

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} vs ${b}`);
const dummies = { gap: 3, change: -2, effect: -3 };
const slopes = { urbanSlope: 1, slopeDiff: -0.8, ruralGap: 3 };

test("treated * post: the predictions are the four means and treated:post is the difference-in-differences", () => {
  const { model, means, predicted } = fitDummies(simulateDummies(1, dummies), true);
  for (const t of [0, 1]) for (const p of [0, 1]) close(predicted[t][p], means[t][p]);
  close(model.coef[3], (means[1][1] - means[1][0]) - (means[0][1] - means[0][0]));
});

test("treated + post: the predicted change is the same in both groups", () => {
  const { predicted } = fitDummies(simulateDummies(2, dummies), false);
  close(predicted[1][1] - predicted[1][0], predicted[0][1] - predicted[0][0]);
});

test("retailers * urban/rural: each group's line is the line from a model of that group alone", () => {
  const rows = simulateSlopes(3, slopes);
  for (const ref of ["Rural", "Urban"]) {
    const { lines } = fitSlopes(rows, true, ref);
    for (const g of [0, 1]) {
      const own = rows.filter((r) => r[0] === g);
      const m = lm(own.map((r) => r[2]), [own.map((r) => r[1])]);
      close(lines[g].intercept, m.coef[0], 1e-6);
      close(lines[g].slope, m.coef[1], 1e-6);
    }
  }
});

test("the retailers_adj coefficient is the slope for the reference group; with + the slopes are equal", () => {
  const rows = simulateSlopes(4, slopes);
  close(fitSlopes(rows, true, "Rural").model.coef[1], fitSlopes(rows, true, "Rural").lines[1].slope);
  close(fitSlopes(rows, true, "Urban").model.coef[1], fitSlopes(rows, true, "Urban").lines[0].slope);
  const { lines } = fitSlopes(rows, false, "Rural");
  close(lines[0].slope, lines[1].slope);
});

test("the simulated slopes come back out (on average)", () => {
  const avg = (g) => Array.from({ length: 20 }, (_, i) => fitSlopes(simulateSlopes(100 + i, slopes), true, "Rural").lines[g].slope).reduce((a, b) => a + b) / 20;
  close(avg(0), slopes.urbanSlope, 0.1);
  close(avg(1), slopes.urbanSlope + slopes.slopeDiff, 0.1);
});

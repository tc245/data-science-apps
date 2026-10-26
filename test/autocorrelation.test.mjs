// The autocorrelation app: the "how clustered" slider and the persistence slider should do what they say,
// and shuffling should get rid of the autocorrelation (which is the whole point of the permutation test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEEN } from "../shared/datazones.js";
import { moranI } from "../shared/spatial.js";
import { random } from "../shared/random.js";
import { simulateSpace, simulateTime, lagCorrelation, shuffle, shuffleSeries } from "../autocorrelation/sim.js";

test("more clustered maps have a bigger Moran's I, and shuffled maps have about none", () => {
  const plain = moranI(QUEEN, simulateSpace(1, 0)), clustered = moranI(QUEEN, simulateSpace(1, 1));
  assert.ok(Math.abs(plain) < 0.05, `plain ${plain}`);
  assert.ok(clustered > 0.6, `clustered ${clustered}`);
  const shuffled = moranI(QUEEN, shuffle(random(9), simulateSpace(1, 1)));
  assert.ok(Math.abs(shuffled) < 0.05, `shuffled ${shuffled}`);
});

test("the year-to-year correlation follows the persistence, and shuffling the values removes it", () => {
  assert.ok(Math.abs(lagCorrelation(simulateTime(1, 0))) < 0.08);
  assert.ok(Math.abs(lagCorrelation(simulateTime(1, 0.8)) - 0.8) < 0.06);
  assert.ok(Math.abs(lagCorrelation(shuffleSeries(random(4), simulateTime(1, 0.8)))) < 0.08, "shuffled");
});

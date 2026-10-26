// The neighbours, lag and Moran's I in the Practical 6 apps should match spdep in R on the same data
// (reference values from poly2nb, knn2nb, lag.listw and moran in the course repo's R kernel).
import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEEN, ROOK } from "../shared/datazones.js";
import { nearest, weights, lag, moranI } from "../shared/spatial.js";
import { DATA } from "../neighbours/data.js";

const rate2015 = DATA.map((r) => r[4]);
const total = (nb) => nb.reduce((s, n) => s + n.length, 0);

test("queen and rook neighbours match poly2nb", () => {
  assert.equal(total(QUEEN), 9388);
  assert.equal(total(ROOK), 9376);
  assert.deepEqual(QUEEN[244], [126, 165, 204, 205, 245, 284, 363]); // queen_nb[[245]] in R, minus 1
  // only 12 datazones have a different number of queen and rook neighbours
  assert.equal(QUEEN.filter((n, i) => n.length !== ROOK[i].length).length, 12);
});

test("nearest neighbours match knn2nb(knearneigh(st_centroid(), k = 6))", () => {
  assert.deepEqual(nearest(0, 6), [1, 2, 40, 41, 80, 121]);
  assert.deepEqual(nearest(244, 6), [204, 205, 206, 245, 284, 285]);
  assert.deepEqual(nearest(799, 6), [759, 798, 837, 838, 877, 878]);
  assert.deepEqual(nearest(1599, 6), [1518, 1519, 1558, 1559, 1597, 1598]);
});

test("spatial lags match lag.listw with binary and row-standardised weights", () => {
  assert.ok(Math.abs(lag(QUEEN, weights(QUEEN, "W"), rate2015)[244] - 17.9814285714) < 1e-9);
  assert.ok(Math.abs(lag(QUEEN, weights(QUEEN, "B"), rate2015)[244] - 125.87) < 1e-9);
});

test("Moran's I matches moran() for the 2015 smoking rates", () => {
  assert.ok(Math.abs(moranI(QUEEN, rate2015) - 0.22340048324) < 1e-9);
});

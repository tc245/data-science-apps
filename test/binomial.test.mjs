// Reference values from R: dbinom() and pbinom().
import { test } from "node:test";
import assert from "node:assert/strict";
import { dbinom, distribution } from "../binomial/binomial.js";

// R printed these to 8 significant figures.
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test("matches dbinom()", () => {
  close(dbinom(64, 100, 0.5), 0.0015597394);
  close(dbinom(2, 23, 0.15), 0.18754284);
  close(dbinom(0, 10, 0.3), 0.0282475249);
  close(dbinom(150, 200, 0.73), 0.05290997821);
  assert.equal(dbinom(0, 5, 0), 1);
  assert.equal(dbinom(5, 5, 1), 1);
});

test("running totals match pbinom()", () => {
  const d = distribution(100, 0.5);
  close(d.atMost[64], 0.99824118);
  close(d.atLeast[64], 0.0033185603); // pbinom(63, 100, 0.5, lower.tail = FALSE)
  close(distribution(23, 0.15).atMost[2], 0.30795901);
  close(distribution(200, 0.73).atMost[140], 0.1897290991);
  close(d.prob.reduce((s, v) => s + v, 0), 1);
});

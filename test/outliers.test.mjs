// Run with: node --test test/
// Counts and coefficients checked against numpy (and, at the practical's cut-off, against lm() in R).
import test from "node:test";
import assert from "node:assert/strict";
import { DATA } from "../outliers/data.js";
import { fitAt, PRACTICAL_CUTOFF } from "../outliers/trim.js";

const close = (got, want, tol = 1e-3) => assert.ok(Math.abs(got - want) < tol, `${got} is not ${want}`);

// cut-off: [datazones kept, retailers only, adjusted for deprivation]
const expected = {
  300: [1208, 0.191, 0.085],
  200: [1205, 0.457, 0.2],
  110: [1203, 1.102, 0.422],
  100: [1202, 2.778, 1.225],
  20: [1202, 2.778, 1.225],
  10: [1188, 2.843, 1.072],
};

for (const [cutoff, [kept, simple, adjusted]] of Object.entries(expected)) {
  test(`keeping datazones up to ${cutoff} retailers per 1,000`, () => {
    const fit = fitAt(DATA, Number(cutoff));
    assert.equal(fit.kept, kept);
    assert.equal(fit.removed, 1208 - kept);
    close(fit.simple.coef[1], simple);
    close(fit.adjusted.coef[1], adjusted);
  });
}

test("the practical's cut-off removes exactly six datazones", () => assert.equal(fitAt(DATA, PRACTICAL_CUTOFF).removed, 6));

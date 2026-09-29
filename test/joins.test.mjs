// Run with: node --test test/
// Row counts and retailer counts checked against dplyr and pandas for the same tables.
import test from "node:test";
import assert from "node:assert/strict";
import { RETAILERS, POSTCODES, DUPLICATE, join, countByDatazone } from "../join-explorer/joins.js";

const expected = {
  left: [6, { DZ00593: 4, DZ00754: 1 }],
  inner: [5, { DZ00593: 4, DZ00754: 1 }],
  full: [10, { DZ00593: 5, DZ00754: 2, DZ00594: 2 }],
  right: [9, { DZ00593: 5, DZ00754: 2, DZ00594: 2 }],
  anti: [1, {}],
};

for (const [how, [rows, counts]] of Object.entries(expected)) {
  test(`${how} join`, () => {
    const out = join(RETAILERS, POSTCODES, how);
    assert.equal(out.length, rows);
    assert.deepEqual(countByDatazone(out), counts);
  });
}

test("a duplicate postcode double-counts Inverlea Supermarket", () => {
  const out = join(RETAILERS, [...POSTCODES, DUPLICATE], "left");
  assert.equal(out.filter((r) => r["Premises Name"] === "Inverlea Supermarket").length, 2);
  assert.equal(countByDatazone(out).DZ00593, 5);
});

// The example tables and the join logic for the join explorer.
// A few real rows from the Practical 1 data (all simulated).

export const RETAILERS = [
  { "Premises Name": "Paterson's Convenience Store", postcode: "QD37 6XG" },
  { "Premises Name": "Inverlea Supermarket", postcode: "QD37 6YN" },
  { "Premises Name": "Inverlea Stores", postcode: "QD37 6ZB" },
  { "Premises Name": "Inverlea Service Station", postcode: "QD37 6ZB" },
  { "Premises Name": "Ferguson Newsagents", postcode: "QD37 0EZ" },
  { "Premises Name": "Langmuir Stores", postcode: "QD37 4QD" },
];

export const POSTCODES = [
  { postcode: "QD37 6XG", DataZone2011Code: "DZ00593" },
  { postcode: "QD37 6YN", DataZone2011Code: "DZ00593" },
  { postcode: "QD37 6ZB", DataZone2011Code: "DZ00593" },
  { postcode: "QD37 6HH", DataZone2011Code: "DZ00593" },
  { postcode: "QD37 0EZ", DataZone2011Code: "DZ00754" },
  { postcode: "QD37 0NN", DataZone2011Code: "DZ00754" },
  { postcode: "QD37 9FB", DataZone2011Code: "DZ00594" },
  { postcode: "QD37 9HA", DataZone2011Code: "DZ00594" },
];

// The extra row added by the "duplicate postcode" switch.
export const DUPLICATE = { postcode: "QD37 6YN", DataZone2011Code: "DZ00593", duplicate: true };

// How many retailers each datazone really has.
export const TRUE_COUNTS = { DZ00593: 4, DZ00754: 1, DZ00594: 0 };

export const JOINS = ["left", "inner", "full", "right", "anti"];

// Each output row records where it came from:
//   "both" = matched, "x" = retailer with no postcode match, "y" = postcode with no retailer.
export function join(x, y, how, key = "postcode") {
  const out = [];
  const usedY = new Set();
  if (how === "anti") {
    const keys = new Set(y.map((r) => r[key]));
    return x.filter((r) => !keys.has(r[key])).map((r) => ({ ...r, from: "x" }));
  }
  if (how !== "right") {
    for (const r of x) {
      const matches = y.map((s, i) => [s, i]).filter(([s]) => s[key] === r[key]);
      if (matches.length) {
        for (const [s, i] of matches) {
          usedY.add(i);
          out.push({ ...r, DataZone2011Code: s.DataZone2011Code, from: "both", duplicate: !!s.duplicate });
        }
      } else if (how === "left" || how === "full") {
        out.push({ ...r, DataZone2011Code: null, from: "x" });
      }
    }
  } else {
    for (const r of x) {
      y.forEach((s, i) => {
        if (s[key] === r[key]) {
          usedY.add(i);
          out.push({ ...r, DataZone2011Code: s.DataZone2011Code, from: "both", duplicate: !!s.duplicate });
        }
      });
    }
  }
  if (how === "full" || how === "right") {
    y.forEach((s, i) => {
      if (!usedY.has(i)) out.push({ "Premises Name": null, postcode: s[key], DataZone2011Code: s.DataZone2011Code, from: "y" });
    });
  }
  return out;
}

// Rows per datazone after removing rows with no datazone, as in the practical.
export function countByDatazone(rows) {
  const counts = {};
  for (const r of rows) {
    if (r.DataZone2011Code == null) continue;
    counts[r.DataZone2011Code] = (counts[r.DataZone2011Code] || 0) + 1;
  }
  return counts;
}

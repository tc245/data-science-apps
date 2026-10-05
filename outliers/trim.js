// What our two models say when we only keep datazones up to a cut-off.
// Rows are [retailers_adj, smoking_rate, simd_rank, retailer_count, total_population].
import { lm } from "../shared/model.js";

export const PRACTICAL_CUTOFF = 100; // the cut-off we used in Practical 2

export function fitAt(data, cutoff) {
  const kept = data.filter((row) => row[0] <= cutoff);
  const column = (j) => kept.map((row) => row[j]);
  return {
    kept: kept.length,
    removed: data.length - kept.length,
    simple: lm(column(1), [column(0)]),
    adjusted: lm(column(1), [column(0), column(2)]),
  };
}

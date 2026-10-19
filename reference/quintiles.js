// The data and the two kinds of model: simd_quintile as a factor, or as a plain number.
import { DATA } from "./data.js";
import { lm } from "../shared/model.js";

export const NAMES = ["Most deprived", "Second", "Third", "Fourth", "Least deprived"];
export const quintile = DATA.map((r) => r[0] - 1), smoking = DATA.map((r) => r[1]);
export const means = NAMES.map((_, q) => { const ys = smoking.filter((_, i) => quintile[i] === q); return ys.reduce((s, v) => s + v, 0) / ys.length; });
export const steps = means.slice(1).map((v, i) => v - means[i]);

// A factor in a regression is a set of dummy variables: one for every quintile except the reference.
export const fitModel = (ref, number) => number
  ? lm(smoking, [quintile.map((q) => q + 1)])
  : lm(smoking, NAMES.map((_, q) => q).filter((q) => q !== ref).map((q) => quintile.map((v) => (v === q ? 1 : 0))));


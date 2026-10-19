// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the group `means`, the `model`, the reference level `ref` and the group `names`.

const f = (x, dp = 2) => x.toFixed(dp);
const diff = (x) => `${f(Math.abs(x))} percentage points ${x < 0 ? "lower" : "higher"}`;

export const TEXT = {
  intro: `In the practical we put <code>simd_quintile</code> into our regression in two ways: first as a plain number from 1 to 5, and then as a factor, so that R made dummy variables for us and compared every quintile with a <b>reference category</b>. Here you can choose which quintile is the reference and see what changes (and what doesn't!).`,

  code: (s) =>
    s.number
      ? `# simd_quintile is still a number from 1 to 5\nmodel <- lm(smoking_rate ~ simd_quintile,\n            data = analysis_data)\nsummary(model)`
      : s.ref === 0
        ? `# simd_quintile is a factor, and R uses its\n# first level as the reference category\nmodel <- lm(smoking_rate ~ simd_quintile,\n            data = analysis_data)\nsummary(model)`
        : `model <- lm(smoking_rate ~ relevel(simd_quintile,\n                 ref = "${s.names[s.ref]}"),\n            data = analysis_data)\nsummary(model)`,

  fit: (s) => `Multiple R-squared: <b>${f(s.model.r2, 3)}</b>`,

  explain: {
    first: (s) =>
      `This is the model from the practical. R has used the first level, <b>Most deprived</b>, as the reference category. The intercept (<b>${f(s.model.coef[0])}</b>) is simply the mean smoking rate in the most deprived datazones, which is the dashed line on the plot. Each of the other four coefficients is the difference between the mean for that quintile and the mean for the reference category (the arrows). So datazones in the second quintile have smoking rates that are ${diff(s.means[1] - s.means[0])} on average, and in the least deprived quintile they are ${diff(s.means[4] - s.means[0])}. That is why we get four coefficients for five quintiles. Look at the dummy variables in the table: the most deprived datazones are 0 on every one of them, so for them the model is just the intercept. Now click on another quintile (on the plot or with the buttons) to make it the reference...`,

    other: (s) =>
      `Now <b>${s.names[s.ref]}</b> is the reference category. The dashed line has moved to the mean for this quintile, which is our new intercept (<b>${f(s.model.coef[0])}</b>), and all of the arrows now start from here. The most deprived quintile, for example, is now ${diff(s.means[0] - s.means[s.ref])} than the ${s.names[s.ref].toLowerCase()} quintile. ${s.ref === 1 ? "That's the mirror image of what we saw in the first model. " : ""}${s.ref > 0 && s.ref < 4 ? "Because the reference is in the middle, some of the coefficients are now positive and some are negative. " : ""}But look at what <b>hasn't</b> changed: the means for each quintile (the thick lines) are exactly where they were, and so is the R-squared (${f(s.model.r2, 3)}). Changing the reference category doesn't change the model at all, only the starting point we describe it from. So choose the reference that makes your results easiest to explain. Often that is one end of an ordered variable like this one, or the biggest group. Now try ticking "Treat the quintile as a number"...`,

    number: (s) =>
      `This is the second model from "The problem" section, where <code>simd_quintile</code> was still a number from 1 to 5. R fits a single straight line, so we only get one coefficient: each step up in quintile (from more deprived to less deprived) goes with smoking rates that are <b>${f(Math.abs(s.model.coef[1]))}</b> percentage points lower. The line isn't far from the means for each quintile in our data, but it forces every step to be exactly the same size. The real differences between neighbouring quintiles are ${s.steps.map((v) => f(Math.abs(v))).join(", ")} percentage points, which is why the R-squared (${f(s.model.r2, 3)}) is a bit lower than with dummy variables. Treating a category as a number also only makes any sense when the categories have an order. If we numbered something without an order (say, the region each datazone is in) the "effect" of going up by one would be meaningless! Untick the box to go back to dummy variables.`,
  },

  describe: (s) => `Smoking rates in ${s.n} datazones by SIMD quintile, with the mean for each quintile: ${s.names.map((name, i) => `${name} ${f(s.means[i])}%`).join(", ")}. ${s.number ? `A straight line falls by ${f(Math.abs(s.model.coef[1]))} for each quintile.` : `The reference category is ${s.names[s.ref]}.`}`,
};

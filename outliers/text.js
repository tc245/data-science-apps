// All of the words on the page (the code, and the names of things in the output, in R and Python versions). Written in the same voice as the practical notebooks.
// `all` is the fit with nothing removed, `practical` the fit at the practical's cut-off and `now` the
// fit at the slider's cut-off, so the numbers in the text always match the numbers on the page.

import { lang } from "../shared/lang.js";

const f = (x, dp = 2) => x.toFixed(dp);
const slope = (fit) => f(fit.simple.coef[1]);
const n = (x) => x.toLocaleString("en-GB");

const py = () => lang === "Python";

export const TEXT = {
  intro: `In Practical 2 we found a handful of datazones with extremely high numbers of tobacco retailers per 1,000 people, and we removed them before running our models. Remember we said that decisions like this are always a judgement call? So how much difference did this one actually make? Quite a lot, as it turns out!`,

  kept: (now) => `<b>${n(now.kept)}</b> datazones kept and <b>${n(now.removed)}</b> removed.`,
  models: ["Retailers only", "Adjusted for deprivation"],
  fit: (now) => `${py() ? "R-squared" : "Multiple R-squared"} for the first model: <b>${f(now.simple.r2, 3)}</b>.`,
  code: (cutoff) => py()
    ? `urban_only = analysis_data[\n    (analysis_data['retailers_adj'] <= ${cutoff}) &\n    (analysis_data['urban_rural_2cat'] == "Urban")]\n\nsmf.ols('smoking_rate ~ retailers_adj',\n        data=urban_only).fit()\nsmf.ols('smoking_rate ~ retailers_adj + simd_rank',\n        data=urban_only).fit()`
    : `urban_only <- analysis_data %>%\n    filter(retailers_adj <= ${cutoff}) %>%\n    filter(urban_rural_2cat == "Urban")\n\nlm(smoking_rate ~ retailers_adj,\n   data = urban_only, na.action = na.exclude)\nlm(smoking_rate ~ retailers_adj + simd_rank,\n   data = urban_only, na.action = na.exclude)`,

  explain: {
    none: (all) =>
      `We haven't removed anything yet. Look at the plot! Nearly all of our datazones are squashed up against the left-hand side, and then there are six datazones way out on their own to the right. Have a look at them in the table. They all have fewer than 100 residents but 10 or more tobacco retailers (they are tiny city-centre datazones with lots of shops), which is why their rates are so extreme. Now look at the line. The coefficient for <code>retailers_adj</code> is only <b>${slope(all)}</b>! If we had left these six datazones in, we would have said there was hardly any association between tobacco retailers and smoking rates. Observations that are a long way from all of the others like this act a bit like a long lever: they can pull the whole line towards themselves. Now move the slider to the left and remove them one at a time...`,
    some: (all, practical, now, gone) =>
      `We have now removed ${gone} of the six extreme datazones, and the coefficient for <code>retailers_adj</code> has gone from ${slope(all)} to <b>${slope(now)}</b>. Notice how the line changes every single time one of them goes. That is a lot of influence for one datazone to have over a model with more than 1,200 of them in it! Keep going...`,
    all: (all, practical, now, gone, edge) =>
      `All six of the extreme datazones have now gone, and the coefficient for <code>retailers_adj</code> is <b>${slope(now)}</b>, the same as we got in the practical. So six datazones out of ${n(all.kept)} (that's half of one percent of our data!) were the difference between ${slope(all)} and ${slope(practical)}. Notice that the plot has zoomed in as well, so we can finally see what the other ${n(practical.kept)} datazones are doing. Now try moving the slider anywhere between ${edge} and 100. Nothing changes! There aren't any datazones in that gap, so it doesn't matter exactly where we make the cut. You can see this in the lower plot as a long flat stretch. This is reassuring: our results don't depend on the exact number we happened to choose. They do depend a great deal on the decision to remove those six datazones though, which is why you should always look at what you are removing, and always report it in your write-up! We will come back to observations like these in Practical 3.`,
    deep: (all, practical, now) =>
      `Careful! We are now cutting into the main body of our data. We have removed ${n(now.removed)} datazones, and most of them aren't unusual at all: they just have quite a lot of tobacco retailers. The coefficient hasn't changed very much (it is now <b>${slope(now)}</b>), but we don't have a good reason for removing these datazones. The six extreme ones were different: their rates were based on tiny populations, which makes them very unstable. Removing observations until you get the answer you like is definitely not good practice!`,
  },

  chartDescription: (now, cutoff) =>
    `Scatter plot of smoking rate against tobacco retailers per 1,000 people for the ${n(now.kept)} urban datazones with up to ${cutoff} retailers per 1,000 people, with a regression line that rises by ${slope(now)} per retailer.`,
  traceDescription: (all, practical) =>
    `Line chart of the coefficient for retailers_adj against the cut-off. It is about ${slope(practical)} for any cut-off up to 100, then falls in steps as the six extreme datazones are included, to ${slope(all)} when nothing is removed. The coefficient adjusted for deprivation follows the same pattern at a lower level.`,
};

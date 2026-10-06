// All of the words on the page (the code, and the names of things in the output, in R and Python versions). Written in the same voice as the practical notebooks.
// m1 and m2 are the two fitted models and g holds the averages for the three deprivation groups,
// so the numbers in the text always match the numbers on the page.

import { lang } from "../shared/lang.js";

const f = (x, dp = 2) => x.toFixed(dp);

const py = () => lang === "Python";

export const TEXT = {
  intro: (m1, m2) =>
    `In Practical 2 we found that urban datazones with more tobacco retailers have higher smoking rates. But when we added deprivation (simd_rank) to our model, the coefficient for retailers_adj dropped from about ${f(m1.coef[1], 1)} to about ${f(m2.coef[1], 1)}. What is going on here? This is confounding in action, and it is much easier to see in a picture than in a table of coefficients!`,

  groups: { most: "Most deprived third", mid: "Middle third", least: "Least deprived third" },

  code: {
    R: {
      simple: `simple_linear_regression <- lm(\n    smoking_rate ~ retailers_adj,\n    data = urban_only,\n    na.action = na.exclude)\nsummary(simple_linear_regression)\nconfint(simple_linear_regression)`,
      adjusted: `multiple_linear_regression <- lm(\n    smoking_rate ~ retailers_adj + simd_rank,\n    data = urban_only,\n    na.action = na.exclude)\nsummary(multiple_linear_regression)\nconfint(multiple_linear_regression)`,
    },
    Python: {
      simple: `simple_linear_regression = smf.ols(\n    'smoking_rate ~ retailers_adj',\n    data=urban_only).fit()\nsimple_linear_regression.summary()\nsimple_linear_regression.conf_int()`,
      adjusted: `multiple_linear_regression = smf.ols(\n    'smoking_rate ~ retailers_adj + simd_rank',\n    data=urban_only).fit()\nprint(multiple_linear_regression.summary())\nprint(multiple_linear_regression.conf_int())`,
    },
  },
  intercept: () => (py() ? "Intercept" : "(Intercept)"),

  fit: (m) => `${py() ? "R-squared" : "Multiple R-squared"}: <b>${f(m.r2, 3)}</b>, so this model explains about ${Math.round(m.r2 * 100)}% of the variation in smoking rates.`,

  predictionNote: {
    simple: `Model 1 doesn't know anything about deprivation, so it gives the same answer whatever the deprivation rank is.`,
    adjusted: `Try moving one slider at a time. Each extra retailer adds the same amount whatever the deprivation rank is, and that is exactly what we mean by the effect of one variable "holding the other constant".`,
  },

  explain: {
    simple: (m1) =>
      `The line is the simple linear regression from the practical. It goes up by <b>${f(m1.coef[1])}</b> for every extra tobacco retailer per 1,000 people, so datazones with more retailers have higher smoking rates. So far so good. But is it really the retailers? Try colouring the datazones by deprivation...`,
    coloured: (m1, m2, g) =>
      `Now look at where the colours are! The most deprived datazones are mostly towards the top of the plot <b>and</b> further to the right. They have higher smoking rates (${f(g.most.smoking, 1)}% on average, compared with ${f(g.least.smoking, 1)}% in the least deprived datazones) and they also have more tobacco retailers (${f(g.most.retailers, 1)} per 1,000 people compared with ${f(g.least.retailers, 1)}). So part of the reason our line is so steep is that it runs from the least deprived datazones in the bottom left up to the most deprived datazones in the top right. Deprivation is related to both of our variables, which makes it a <b>confounder</b>, and Model 1 has no way of telling the two things apart. Now switch to Model 2...`,
    adjusted: (m1, m2) =>
      `Look at what has happened to the line! When we add <code>simd_rank</code> to the model we are no longer fitting one line through all of the datazones. Instead we are comparing datazones that have different numbers of retailers but the <b>same</b> level of deprivation. Model 2 really has a line for every possible deprivation rank (they are all parallel), so we have drawn three of them, one for a typical datazone in each of our three groups. Notice that these lines are much flatter than the dashed line from Model 1. The coefficient for <code>retailers_adj</code> has dropped from <b>${f(m1.coef[1])}</b> to <b>${f(m2.coef[1])}</b>. This is what we mean when we say we are "adjusting" or "controlling" for deprivation. So some of the association we saw in Model 1 was actually due to deprivation, but not all of it: the lines still go up. Remember though that this is still an association. There could be other confounders that we haven't measured!`,
  },

  chartDescription: {
    simple: (m1) => `Scatter plot of smoking rate against tobacco retailers per 1,000 people for 1,202 urban datazones, with a regression line that rises by ${f(m1.coef[1])} per retailer.`,
    adjusted: (m1, m2) => `The same scatter plot coloured by deprivation, with three parallel regression lines, one for each deprivation group, each rising by ${f(m2.coef[1])} per retailer. The most deprived group's line is highest. A dashed line shows the steeper Model 1 line for comparison.`,
  },
};

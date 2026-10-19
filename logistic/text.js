// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the cut-off, the logistic model `m`, the straight line `lin` and how many
// predictions it gets wrong (`below`, `above`), the number of 1s (`ones`) and the original model (`m20`).

const f = (x, dp = 2) => x.toFixed(dp);
const sig = (x, n = 4) => String(+x.toPrecision(n));
const lower = (ratio) => `${sig(Math.abs(1 - ratio) * 100, 3)}% ${ratio < 1 ? "lower" : "higher"}`;

export const TEXT = {
  intro: `In the practical we chopped the smoking rate in our 375 rural datazones into two groups (below 20%, and 20% or more) and tried to predict which group each datazone is in from its SIMD rank. A straight line gave us impossible predictions, so we used <b>logistic regression</b> instead, which works on the <b>log-odds</b> scale. Here you can look at the same model on all three scales: probability, odds and log-odds.`,

  code: (cut) => `rural_only <- rural_only %>%\n    mutate(smoking_rate_binary =\n           as.numeric(smoking_rate >= ${cut}))\n\nglm_fit <- glm(smoking_rate_binary ~ simd_rank,\n               data = rural_only,\n               family = binomial(link='logit'))\nsummary(glm_fit)\nexp(coef(glm_fit))`,

  linear: (s) => `Straight line (<code>lm()</code>): <b>${s.below}</b> of the ${s.n} datazones get a predicted probability below 0${s.above ? ` and <b>${s.above}</b> get one above 1` : ""}.`,

  explain: {
    probability: (s) =>
      `Each dot along the bottom of the plot is a rural datazone with a smoking rate below ${s.cut}% (a "0"), and each dot along the top has a smoking rate of ${s.cut}% or more (a "1"). The hollow circles show the proportion of 1s in each tenth of the datazones, from the most deprived to the least deprived. This proportion is the probability we are trying to model. ${s.showLinear ? `The straight line is our linear regression model from the practical, and it goes below 0 for the least deprived datazones, so <b>${s.below}</b> of them get a predicted probability that is impossible! ` : ""}The curve from the logistic regression flattens out as it gets close to 0 (and it would do the same close to 1), so it can never give us an impossible prediction. Over the whole range it would make an S shape, which is called the <b>logistic curve</b>. But it isn't a straight line, and our regression models need straight lines... Click on "Odds" and then "Log-odds" to see how logistic regression gets around this.`,

    odds: (s) =>
      `This is exactly the same curve, but with each probability turned into <b>odds</b> (the probability divided by 1 minus the probability). Odds can never go below 0, but unlike probabilities they have no upper limit. A probability of 0.8, for example, is odds of 4. The odds of a smoking rate of ${s.cut}% or more are ${sig(Math.exp(s.m.coef[0] + s.m.coef[1] * 10), 3)} for the most deprived rural datazone and ${sig(Math.exp(s.m.coef[0] + s.m.coef[1] * 1599), 3)} for the least deprived. The curve still isn't straight, though. Going up 100 ranks always <b>multiplies</b> the odds by the same amount (${sig(Math.exp(100 * s.m.coef[1]))}), rather than adding or taking away the same amount. That multiplying is exactly what an odds ratio describes. (We can't plot the datazones themselves on this scale, because a 1 would have odds of infinity!) Now click on "Log-odds"...`,

    logodds: (s) =>
      `Taking the log of the odds turns multiplying into adding, and our curve becomes a straight line! This is the line that logistic regression actually fits. At rank 0 it starts at the intercept (<b>${f(s.m.coef[0], 3)}</b>), and it goes down by <b>${sig(Math.abs(s.m.coef[1]))}</b> for every rank, which are the two numbers in the model output. That's why the coefficients from <code>summary(glm_fit)</code> are on the log-odds scale, and why we use <code>exp()</code> to turn them back into odds ratios: exp(${sig(s.m.coef[1])}) = <b>${sig(Math.exp(s.m.coef[1]))}</b>. Log-odds can be any number at all (anything below 0 is a probability under 0.5), so there are no impossible predictions. The circles follow the line fairly closely, which tells us that a straight line on this scale is a sensible model for our data.`,

    cut: (s) =>
      `We've moved the cut-off from 20% to <b>${s.cut}%</b>, and now ${s.ones} of the ${s.n} rural datazones count as a 1 (it was ${s.ones20} before). Look at the model output. The coefficient for <code>simd_rank</code> has changed from ${sig(s.m20.coef[1])} to <b>${sig(s.m.coef[1])}</b>, and the odds ratio for going up 1,000 ranks has changed from ${sig(Math.exp(1000 * s.m20.coef[1]), 3)} to <b>${sig(Math.exp(1000 * s.m.coef[1]), 3)}</b>. The datazones haven't changed at all. Only the line we chose to draw has! A datazone with a smoking rate of ${s.cut + 1}% and one with 45% are both just "1", and one with ${Math.max(0, s.cut - 1)}% is a "0". This is the "confession" at the end of the practical: chopping a continuous variable into two groups throws away information, and the results depend on a cut-off that we picked ourselves. That's why we finish by modelling the number of smokers directly with Poisson regression. Logistic regression is the right tool when the outcome really is binary (e.g. whether or not a person smokes).`,
  },

  describe: (s) => `${s.scaleName} of a smoking rate of ${s.cut}% or more against SIMD rank for ${s.n} rural datazones, with the logistic regression ${s.scale === "logodds" ? "line" : "curve"}${s.scale === "probability" && s.showLinear ? ` and a straight line that falls below 0 for ${s.below} datazones` : ""}.`,

  oddsRows: (b) => [1, 100, 1000].map((d) => { const r = Math.exp(d * b); return [d.toLocaleString("en-GB"), sig(r), lower(r)]; }),
};

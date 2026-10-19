// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the model `m`, the `coverage` of its confidence intervals, `trueRatio`, and the settings.

const f = (x, dp = 2) => x.toFixed(dp);
const pct = (v) => `${Math.round(v * 100)}%`;
const change = (ratio) => `${f(Math.abs(1 - ratio) * 100, 1)}% ${ratio < 1 ? "lower" : "higher"}`;
const ratioDf = (s) => f(s.m.deviance / s.m.df);
const ci = ([lo, hi]) => `${f(lo, 3)} to ${f(hi, 3)}`;

export const TEXT = {
  intro: `At the end of the practical we modelled the <b>number</b> of smokers in each datazone with Poisson regression, using <code>offset(log(pregnant_women))</code> so that R knew how many pregnant women each count came out of, and we finished with a warning about <b>overdispersion</b>. Here you can see what goes wrong if we leave the offset out, and what overdispersion does to our confidence intervals. Because we simulate the data ourselves, we know the right answer!`,

  code: (s) => `poisson_fit <- glm(smokers ~ simd_rank${s.offset ? " +\n                     offset(log(pregnant_women))" : ""},\n                   data = sim_data,\n                   family = poisson(link='log'))\nsummary(poisson_fit)\nexp(coef(poisson_fit))${s.extra > 0 ? `\n\n# the same model, allowing for overdispersion\nquasi_fit <- glm(smokers ~ simd_rank${s.offset ? " +\n                   offset(log(pregnant_women))" : ""},\n                 data = sim_data,\n                 family = quasipoisson(link='log'))` : ""}`,

  deviance: (s) => `Residual deviance: <b>${f(s.m.deviance, 1)}</b> on ${s.m.df} degrees of freedom, so ${f(s.m.deviance, 1)} / ${s.m.df} = <b>${ratioDf(s)}</b> (close to 1 is fine, above 2 is a problem).`,

  coverage: (s) => `If we ran this study 200 times (with new random numbers each time), the Poisson 95% confidence interval would contain the true rate ratio <b>${pct(s.coverage.poisson)}</b> of the time${s.extra > 0 ? `, and the quasipoisson one <b>${pct(s.coverage.quasi)}</b>` : ""}. It should be 95%.`,

  explain: {
    good: (s) =>
      `Each dot is a simulated datazone. The left-hand plot shows that the more deprived datazones (on the left) have more pregnant women in them than the least deprived ones. The right-hand plot shows the smoking rate in each datazone, which we made fall from 30% in the most deprived datazone to about 6% in the least deprived (the dashed line). Our model, with the offset, gets this about right: a rate ratio of <b>${f(s.m.ratio, 3)}</b> for going up 100 ranks (the true value is ${f(s.trueRatio, 3)}), so the smoking rate is about ${change(s.m.ratio)} for every 100 ranks less deprived. Notice how much the rates jump about in the datazones with fewer pregnant women, which are mostly on the right. That's just the small numbers (have a look at the coin flip explorer if you haven't already). The residual deviance divided by its degrees of freedom is ${ratioDf(s)}, close to 1, because the counts vary as much as a Poisson distribution expects and no more. And the confidence intervals do their job: ${pct(s.coverage.poisson)} of them contain the true value. Now try unticking the offset...`,

    nooffset: (s) =>
      `Without the offset, the model is predicting the <b>number</b> of smokers, not the smoking rate. Look at the right-hand plot now. The most deprived datazones have more smokers partly because their smoking rate is higher, but also simply because they have more pregnant women (the left-hand plot). The model can't tell these two things apart, so the rate ratio is now <b>${f(s.m.ratio, 3)}</b> instead of ${f(s.trueRatio, 3)}, and deprivation looks like it matters more than it really does. It isn't just a bit off, either: ${s.coverage.poisson === 0 ? "<b>none</b>" : `only <b>${pct(s.coverage.poisson)}</b>`} of the confidence intervals from 200 studies like this one contain the true value! The offset is how we tell R how many pregnant women each count came out of, so that it models the rate. ${s.extra > 0 ? "(You have added some extra variation as well, so the residual deviance is affected by that too.) " : ""}Put the tick back and then try the slider...`,

    slight: (s) =>
      `We've added a little extra variation, so some datazones now have higher or lower smoking rates than their deprivation alone would give them. The residual deviance divided by its degrees of freedom is now <b>${ratioDf(s)}</b>, which is still under the rule of thumb of 2 from the practical. The rate ratio (${f(s.m.ratio, 3)}) is still close to the true value, and the confidence intervals are still doing a reasonable job (${pct(s.coverage.poisson)} of them contain the true value). Keep moving the slider...`,

    over: (s) =>
      `Now the datazones differ from each other much more than deprivation alone explains, as if something we haven't measured pushes some of them up and others down. You can see the smoking rates spreading out in the right-hand plot. The residual deviance divided by its degrees of freedom is now <b>${ratioDf(s)}</b>${s.m.deviance / s.m.df > 2 ? ", over the rule of thumb of 2, so we have overdispersion" : ". That's not over the rule of thumb of 2 yet, but it is getting there"}. Look at the model output. The rate ratio (<b>${f(s.m.ratio, 3)}</b>) is still in the right area, just as the practical said. But the Poisson confidence interval (${ci(s.m.ci)}) is much narrower than the quasipoisson one (${ci(s.m.quasiCi)}). And if we ran this study 200 times, the Poisson interval would only contain the true value <b>${pct(s.coverage.poisson)}</b> of the time instead of 95%. The Poisson model is too sure of itself, so its p-values are too small as well. The quasipoisson model widens the intervals to allow for the extra spread, and gets back to <b>${pct(s.coverage.quasi)}</b>. That's why the practical suggests switching to <code>family = quasipoisson(link='log')</code> if you find overdispersion in your own data.`,
  },

  describe: {
    women: () => "Number of pregnant women in each simulated datazone against SIMD rank: more in the most deprived datazones, fewer in the least deprived.",
    smokers: (s) => s.offset
      ? `Smoking rate in each simulated datazone against SIMD rank, with the true rate falling from 30% to 6% and the model's fitted rate, a rate ratio of ${f(s.m.ratio, 3)} for 100 ranks.`
      : `Number of smokers in each simulated datazone against SIMD rank, with the model's fitted number of smokers, a ratio of ${f(s.m.ratio, 3)} for 100 ranks.`,
  },
};

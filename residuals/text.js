// All of the words on the page. Written in the same voice as the practical notebooks.
// `d` is what diagnose() gives us for the data on the page, so the numbers in the text always match the numbers on the page.

const f = (x, dp = 2) => x.toFixed(dp);
const t = (d) => f(d.model.coef[1] / d.model.se[1], 1);
const r2 = (d) => f(d.model.r2, 2);
// The numbers we multiply by in the simulation code, without any trailing zeros.
const tidy = (x) => String(+x.toFixed(3));

export const TEXT = {
  intro: `In Practical 3 we simulated some "good" data and some "bad" data, and used three plots of the residuals to check the assumptions of linearity, normality and constant variance. Our "bad" data had two things wrong with it at the same time though, which makes it hard to tell which problem is causing which pattern. So here you can break things one at a time!`,

  code: (curve, fan) => {
    const mean = curve === 0 ? "x" : curve === 1 ? "x^2 / 100" : `${tidy(1 - curve)} * x + ${tidy(curve)} * x^2 / 100`;
    const noise = fan === 0 ? "10" : fan === 1 ? "0.15 * x" : `${tidy(10 * (1 - fan))} + ${tidy(0.15 * fan)} * x`;
    return `x <- runif(100, 0, 100)\ny <- ${mean} +\n    rnorm(100, 0, ${noise})\n\nmodel <- lm(y ~ x)\nsummary(model)\nplot(model)`;
  },

  fit: (d) => `Multiple R-squared: <b>${f(d.model.r2, 3)}</b>, Adjusted R-squared: <b>${f(d.adjR2, 3)}</b>. Keep an eye on these numbers while you move the sliders. Do they ever tell you that something is wrong?`,

  explain: {
    good: (d) =>
      `This is our "good" data: x and y have a straight-line relationship, and the noise is the same size all the way along. Have a look at the three residual plots. In the residuals vs fitted plot the red line is roughly flat and close to zero. In the Q-Q plot the points sit close to the dashed line. And in the scale-location plot the points are evenly spread, again with a roughly flat red line. Notice that I keep saying "roughly" though! The red lines still wobble a bit and a few points stray away from the dashed line, even though we know for certain that this data meets every assumption (we made it ourselves!). That is just chance. Press "New random numbers" a few times to see how much the plots can change by chance alone, and then try moving the first slider to bend the relationship...`,
    slight: (d) =>
      `Hmm. We have changed the data a little bit, but can you actually tell from the plots? Probably not! The red lines are a bit less flat than they were, but no more than we might see by chance (press "New random numbers" a few times and see whether the pattern stays or goes away). This is much more like what you will see with real data, where problems are rarely as obvious as they were in the practical. Deciding whether a model is violating an assumption is often a judgement call. Keep moving the slider until you are sure that you can see something...`,
    curve: (d, alsoFan) =>
      `We have bent the relationship between x and y${alsoFan ? "" : ", and left the noise alone"}. Look at the residuals vs fitted plot! The red line isn't flat any more. It is above zero at both ends and below zero in the middle. You can see why in the first plot: our straight line is too low at both ends of the data and too high in the middle, so the residuals are mostly positive at the ends and mostly negative in the middle. A curved red line like this tells us that the assumption of <b>linearity</b> is violated. ${alsoFan ? "(You have moved the second slider a little as well, so the other two plots may have changed a bit too.)" : "The points in the scale-location plot are still fairly evenly spread and the Q-Q plot looks much as it did before, because we haven't changed the noise."} Now look at the model output. The coefficient for x has a t value of <b>${t(d)}</b> (so a tiny p-value) and the R-squared is <b>${r2(d)}</b>. Nothing there warns us that a straight line is the wrong shape for this data! Press the "Good" data button and then try the second slider...`,
    fan: (d, alsoCurve) =>
      `The noise now gets bigger as x gets bigger${alsoCurve ? "" : ", but the relationship is still a straight line"}. You can see the points fanning out from left to right in the first plot (this is the "fan" or "funnel" shape we talked about in the practical). Now look at the scale-location plot. The red line climbs from left to right, which tells us that the residuals are more spread out for larger fitted values. This is <b>heteroscedasticity</b>, and it means the assumption of constant variance is violated. ${alsoCurve ? "(You have moved the first slider a little as well, so the red line in the residuals vs fitted plot may not be completely flat.)" : "Notice that the red line in the residuals vs fitted plot is still roughly flat though. A straight line is still the right shape for this data. It is only the spread around the line that changes!"} Have a look at the Q-Q plot as well. The points at the two ends tend to drift away from the dashed line, because mixing small residuals with big ones gives us more extreme values than a normal distribution would. So one problem can show up in more than one plot. And the model output? A t value of <b>${t(d)}</b> and an R-squared of <b>${r2(d)}</b>. No sign of any trouble there either!`,
    both: (d, practical) =>
      `Now we have both problems at once${practical ? `, and with both sliders all the way up this is the "bad" data from the practical (the only difference is that we have divided y by 100 so that it fits on the same plot)` : ""}. The red line in the residuals vs fitted plot is curved again, so we know that the relationship isn't linear. Look at how the points are spread out in that plot as well: they are tightly packed around the red line on the left and much more spread out on the right. That is our heteroscedasticity. The scale-location and Q-Q plots are harder to read than they were with one problem at a time though! The scale-location plot is based on how far each point is from our straight line, and at the left of the plot the points are a long way from it because of the curve, even though there is hardly any noise there. So one problem can partly hide another, which is why we look at all of the plots together and why it helps to know what each problem looks like on its own. The model output still looks great though: a t value of <b>${t(d)}</b> for x and an R-squared of <b>${r2(d)}</b>. If we only looked at the p-value and the R-squared we would have no idea that anything was wrong, which is why you should <b>always</b> look at your residuals!`,
  },

  describe: {
    scatter: (d) => `Scatter plot of y against x for 100 simulated observations, with a regression line that rises by ${f(d.model.coef[1])} for each unit of x and a thin line from each point to the regression line showing its residual.`,
    fitted: (d) => `Residuals against fitted values, with a smooth line through the points that runs from ${f(d.smoothResid[0][1], 1)} at the lowest fitted value through ${f(d.smoothResid[50][1], 1)} in the middle to ${f(d.smoothResid[99][1], 1)} at the highest.`,
    qq: (d) => `Q-Q plot of the standardised residuals against the quantiles of a normal distribution. The standardised residuals run from ${f(Math.min(...d.rows.map((r) => r.std)), 1)} to ${f(Math.max(...d.rows.map((r) => r.std)), 1)}.`,
    scale: (d) => `Scale-location plot: the square root of the size of each standardised residual against the fitted values, with a smooth line through the points that runs from ${f(d.smoothScale[0][1])} at the lowest fitted value to ${f(d.smoothScale[99][1])} at the highest.`,
  },
};

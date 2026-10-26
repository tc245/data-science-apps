// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the estimates `e`, the average `truth` over 2016-2019, and the settings.

const f = (x, dp = 1) => Math.abs(x).toFixed(dp);
const dir = (x) => (x < 0 ? "fall" : "rise");
const off = (s, v) => Math.abs(v - s.truth) < 0.5 ? "close to the truth" : `${f(v - s.truth)} percentage points ${v < s.truth ? "too big a fall" : "too small a fall (or even a rise)"}`;

export const TEXT = {
  intro: `In the practical we asked whether a cap on tobacco retail licences reduced smoking during pregnancy, using <b>difference-in-differences</b>. Here we have 100 simulated treated datazones and 100 untreated ones, and because we simulated them ourselves we know the true effect of the policy. You can build the estimate one step at a time, and see what happens when its key assumption, <b>parallel trends</b>, isn't true.`,

  title: {
    1: "Step 1: the treated datazones, before and after",
    2: "Step 2: treated against untreated, after the policy",
    3: "Step 3: what would have happened without the policy?",
    4: "Step 4: the difference-in-differences",
    5: "Step 5: the event study, one estimate per year",
  },

  rows: {
    1: "1. Before and after (treated datazones only)",
    2: "2. Treated minus untreated (after 2016 only)",
    4: "4. Difference-in-differences",
    truth: "The true effect (the average for 2016 to 2019, what we simulated)",
  },

  code: {
    1: `panel %>%\n    filter(treated == 1) %>%\n    group_by(post) %>%\n    summarise(mean_smoking = mean(smoking_rate))`,
    2: `panel %>%\n    filter(post == 1) %>%\n    group_by(treated) %>%\n    summarise(mean_smoking = mean(smoking_rate))`,
    3: `# no new code: the dashed line is the untreated line,\n# moved up by the gap between the two groups before 2016`,
    4: `did_model <- lm(smoking_rate ~ treated * post, data = panel)\nsummary(did_model)`,
    5: `panel <- panel %>%\n    mutate(year_f = relevel(factor(year), ref = "2015"))\n\nevent_model <- lm(smoking_rate ~ treated * year_f, data = panel)`,
  },

  explain: {
    1: (s) => `This is the simplest comparison: smoking in the treated datazones before the policy (2012 to 2015) and after it (2016 to 2019). The dotted lines are the two means, and they differ by <b>${s.e.beforeAfter < 0 ? "−" : "+"}${f(s.e.beforeAfter)}</b> percentage points. The true effect of the policy is ${s.truth < 0 ? "−" : "+"}${f(s.truth)}, so this is ${off(s, s.e.beforeAfter)}. Why? Because smoking was falling anyway, everywhere, by about half a percentage point a year. A before and after comparison can't tell the policy apart from everything else that changed over the same years. Click on step 2.`,

    2: (s) => `Now we compare the treated and untreated datazones, but only after the policy came in. The treated ones are <b>${f(s.e.afterOnly)}</b> percentage points ${s.e.afterOnly < 0 ? "lower" : "higher"}. But look at the years before 2016: the treated datazones were already ${s.gap > 0 ? `about ${f(s.gap)} points higher, just like the city councils in the practical, which are more deprived` : "about the same"}. This comparison mixes up the effect of the policy with all of the other differences between the two groups (confounding). Try moving the "gap before the policy" slider and watch this estimate change, even though the policy hasn't changed at all. Then click on step 3.`,

    3: (s) => `Here is the key idea. The dashed orange line is our guess at what would have happened in the treated datazones <b>without</b> the policy: we take the untreated line and move it up by the gap there was between the two groups before 2016. That only works if, without the policy, the two groups would have changed by the same amount each year. This is the <b>parallel trends</b> assumption. ${s.trend === 0 ? "In this data it is true, and you can see that before 2016 the dashed line follows the orange one closely (apart from the random ups and downs). After 2016 the real treated line drops below it: that gap is the effect of the policy." : `<b>In this data it isn't true</b>: the treated datazones were already changing by an extra ${f(s.trend, 2)} points a year. Look at the years before 2016: the dashed line doesn't follow the orange one, so it is a poor guess for the years after 2016 as well.`} Click on step 4.`,

    4: (s) => `The difference-in-differences is the change in the treated datazones (${f(s.e.table[1][1] - s.e.table[1][0])} points) minus the change in the untreated ones (${f(s.e.table[0][1] - s.e.table[0][0])} points), which is <b>${s.e.diffInDiff < 0 ? "−" : "+"}${f(s.e.diffInDiff, 2)}</b>. It's the gap between the real treated line and the dashed one after 2016. The table below shows the same 2 x 2 table as the practical, and the <code>treated:post</code> coefficient from <code>lm</code> is exactly the same number. ${s.trend === 0 ? `The true effect is ${s.truth < 0 ? "−" : "+"}${f(s.truth, 2)}, so we are ${off(s, s.e.diffInDiff)}. Try changing the gap before the policy: steps 1 and 2 change, but the difference-in-differences doesn't, because each group is compared with itself.` : `But the true effect is ${s.truth < 0 ? "−" : "+"}${f(s.truth, 2)}, so we are now ${off(s, s.e.diffInDiff)}. The trends weren't parallel, so the difference-in-differences has mixed up the extra trend with the effect of the policy. Click on step 5 to see how you could spot this.`}`,

    5: (s) => `Each black dot is the gap between treated and untreated datazones in that year, minus the gap in 2015 (the reference year, so it is always 0), with its 95% confidence interval. The red circles show the true effect of the policy. ${s.trend === 0 ? `Before 2016 the dots sit around zero, which is our evidence for parallel trends. After 2016 they drop ${s.builds ? "and keep dropping, because the effect builds up over time (untick the box to make it happen all at once)" : "straight away, because the effect happens all at once"}. Now try the "extra yearly change" slider and watch the left-hand side of the plot.` : `Look at the left-hand side: before 2016 the dots are <b>not</b> around zero, they slope ${s.trend < 0 ? "downwards" : "upwards"} towards 2015. That tells us the treated datazones were already on a different trend before the policy, so the dots after 2016 carry on that trend as well as showing the effect of the policy, and they miss the red circles. If you saw this in your own data you should be very suspicious of a difference-in-differences estimate.`}`,
  },

  describe: (s) => s.step === 5
    ? `Event study: estimates for each year from 2012 to 2019 compared with 2015, with confidence intervals, and the true effect.`
    : `Mean smoking rate each year from 2012 to 2019 in the treated and untreated datazones. Before and after: ${s.e.beforeAfter.toFixed(1)}; after only: ${s.e.afterOnly.toFixed(1)}; difference-in-differences: ${s.e.diffInDiff.toFixed(1)}.`,
};

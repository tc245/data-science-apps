// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the fitted model `fit`, the settings, and which cell or reference is chosen.

const f = (x, dp = 2) => x.toFixed(dp);
const sg = (x, dp = 2) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(dp)}`;
export const CELLS = [[0, 0], [1, 0], [0, 1], [1, 1]]; // [treated, post]
const CELL_NAME = { "0,0": "untreated datazones before", "1,0": "treated datazones before", "0,1": "untreated datazones after", "1,1": "treated datazones after" };
export const cellName = ([t, p]) => CELL_NAME[`${t},${p}`];
export const other = (ref) => (ref === "Rural" ? "Urban" : "Rural");

export const TEXT = {
  intro: `In Section 6 of Practical 6 we wrote <code>treated * post</code> instead of <code>treated + post</code>, and got an extra coefficient called <code>treated:post</code>. This page lets you switch between the two and see exactly what the extra coefficient does. The first tab is the model from the practical. The second shows the same idea with a number (retailers per 1,000 people) instead of <code>post</code>, which is the kind of interaction you are most likely to need in your own projects. All of the data are simulated.`,

  howto: {
    dummies: `Switch between <code>+</code> and <code>*</code>, and click on each of the four groups (on the plot or with the buttons) to see which coefficients add up to its prediction. Then try the sliders.`,
    slopes: `Switch between <code>+</code> and <code>*</code>, then swap the reference category. Then try the sliders, especially the difference in slopes.`,
  },

  title: {
    dummies: (i) => `Mean smoking rate before and after the policy, and the model's predictions (${i ? "treated * post" : "treated + post"})`,
    slopes: (i) => `Smoking rate against tobacco retailers, with the model's lines (${i ? "retailers_adj * urban_rural_2cat" : "retailers_adj + urban_rural_2cat"})`,
  },

  code: {
    dummies: (i) => `did_model <- lm(smoking_rate ~ treated ${i ? "*" : "+"} post, data = panel)\nsummary(did_model)`,
    slopes: (i, ref) => (ref === "Urban" ? `analysis_data <- analysis_data %>%\n    mutate(urban_rural_2cat = relevel(factor(urban_rural_2cat), ref = "Urban"))\n\n` : "")
      + `interaction_model <- lm(smoking_rate ~ retailers_adj ${i ? "*" : "+"} urban_rural_2cat,\n                        data = analysis_data)\nsummary(interaction_model)`,
  },

  // What each coefficient means, for the table.
  meaning: {
    dummies: (i) => [
      "The mean for the untreated datazones before (every dummy is 0)",
      i ? "The gap between treated and untreated <b>before</b> the policy (when <code>post</code> = 0)" : "The gap between treated and untreated, assumed to be the same before and after",
      i ? "The change from before to after in the <b>untreated</b> datazones (when <code>treated</code> = 0)" : "The change from before to after, assumed to be the same in both groups",
      "The <b>extra</b> change in the treated datazones: the difference-in-differences",
    ],
    slopes: (i, ref) => [
      `The predicted smoking rate in ${ref === "Urban" ? "an" : "a"} ${ref.toLowerCase()} datazone with no retailers`,
      i ? `The slope for <b>${ref.toLowerCase()}</b> datazones only (the reference category)` : "The slope for all datazones, assumed to be the same in both groups",
      i ? `The gap between ${other(ref).toLowerCase()} and ${ref.toLowerCase()} datazones <b>where retailers_adj = 0</b>` : `The gap between ${other(ref).toLowerCase()} and ${ref.toLowerCase()} datazones, the same at every number of retailers`,
      `How much steeper the ${other(ref).toLowerCase()} line is than the ${ref.toLowerCase()} one`,
    ],
  },

  explain: {
    dummies(s) {
      const { model, means, predicted } = s.fit;
      const [b0, b1, b2, b3] = model.coef;
      const [t, p] = s.cell;
      const changeU = means[0][1] - means[0][0], changeT = means[1][1] - means[1][0];
      const did = changeT - changeU;
      let out;
      if (!s.interaction) {
        out = `This is the model <b>without</b> an interaction, <code>treated + post</code>. It only has three coefficients, so it has to make the change from before to after the <b>same</b> in both groups. That's why the two lines are parallel. Look at the rings, which are the real means: the untreated datazones changed by ${sg(changeU)} and the treated ones by ${sg(changeT)}, but the model says that both changed by ${sg(b2)}, somewhere in between. So its predictions miss all four means (the red lines). ${Math.abs(did) < 0.3 ? "Here the two changes are almost the same, so the model fits well. Try moving the effect slider away from 0." : `What's left over is the ${sg(did)} difference between the two changes, which is exactly what the interaction picks up. Click on <code>*</code> to add it.`}`;
      } else {
        out = `Now we have the interaction, <code>treated * post</code>. That gives us four coefficients for four groups, so the lines go through every mean exactly and the treated line is free to change by a different amount. The new coefficient, <code>treated:post</code> (<b>${sg(b3)}</b>), is the extra change in the treated datazones over and above the change in the untreated ones (${sg(changeT)} minus ${sg(changeU)}). That is the difference-in-differences. Adding the interaction also changes what <code>post</code> means: it's now the change in the <b>untreated</b> datazones only, not the change in everyone.`;
      }
      const sum = [`${f(b0)}`, t ? `${sg(b1)}` : "", p ? `${sg(b2)}` : "", s.interaction && t && p ? `${sg(b3)}` : ""].filter(Boolean).join(" ");
      const parts = { "0,0": `Every dummy is 0 for them, so the prediction is just the intercept (${f(b0)}). That is why the intercept is the mean for the untreated datazones before the policy.`,
        "1,0": `For them <code>treated</code> is 1 and <code>post</code> is 0, so the prediction is the intercept plus <code>treated</code>: ${sum} = ${f(predicted[1][0])}. ${s.interaction ? "So <code>treated</code> is the gap between the groups <b>before</b> the policy only, not the gap overall." : ""}`,
        "0,1": `For them <code>post</code> is 1 and <code>treated</code> is 0, so the prediction is the intercept plus <code>post</code>: ${sum} = ${f(predicted[0][1])}.`,
        "1,1": s.interaction
          ? `For them <code>treated</code>, <code>post</code> and <code>treated × post</code> (1 × 1 = 1) are all 1, so we add up all four coefficients: ${sum} = ${f(predicted[1][1])}. This is the only group where <code>treated:post</code> counts, which is how it picks out the extra change in the treated datazones after the policy.`
          : `For them <code>treated</code> and <code>post</code> are both 1, so the prediction is ${sum} = ${f(predicted[1][1])}. The real mean is ${f(means[1][1])}, so the model misses by ${f(Math.abs(means[1][1] - predicted[1][1]))}. There is no coefficient that only this group gets, so the model can't fix it.` };
      return `${out}</p><p>The arrows show the prediction for the <b>${cellName(s.cell)}</b>. ${parts[`${t},${p}`]}`;
    },

    slopes(s) {
      const { model, lines } = s.fit;
      const [b0, b1, b2, b3] = model.coef;
      const R = s.ref, O = other(R), r = R.toLowerCase(), o = O.toLowerCase();
      const cross = b3 ? -b2 / b3 : -1; // where the two lines meet
      if (!s.interaction) {
        return `Without an interaction (<code>retailers_adj + urban_rural_2cat</code>), there is only <b>one slope</b> for retailers, so the two lines are parallel. The model assumes that one extra retailer per 1,000 people goes with the same change in smoking (${sg(b1)} percentage points) in towns and in the countryside. Look at the points, though: ${Math.abs(s.slopeDiff) < 0.15 ? "here the two groups really do have about the same slope, so that's fine. Try moving the difference in slopes slider." : `the true slopes are about ${sg(s.urbanSlope)} in urban datazones and ${sg(s.urbanSlope + s.slopeDiff)} in rural ones, so the model is wrong for both groups.`} The <code>urban_rural_2cat${O}</code> coefficient (${sg(b2)}) is the gap between the two parallel lines, which is the same everywhere. Click on <code>*</code>.`;
      }
      return `With <code>retailers_adj * urban_rural_2cat</code>, each group gets its own slope, so the lines don't have to be parallel. But be careful, because the coefficients now mean something different:</p><ul>
<li><code>retailers_adj</code> (<b>${sg(b1)}</b>) is the slope for <b>${r}</b> datazones only, because ${r} is the reference category. It is <b>not</b> the effect of retailers in all datazones.</li>
<li><code>retailers_adj:urban_rural_2cat${O}</code> (<b>${sg(b3)}</b>) is how much steeper the ${o} line is. So the ${o} slope is ${f(b1)} ${sg(b3)} = ${f(lines[O === "Urban" ? 0 : 1].slope)}.</li>
<li><code>urban_rural_2cat${O}</code> (<b>${sg(b2)}</b>) is the gap between the lines where <code>retailers_adj</code> is 0 (the black arrow on the left). The lines aren't parallel, so the gap depends on where you look, and this is just the gap at one end.${cross > 0.3 && cross < 9.7 ? ` In fact the lines cross at about ${f(cross, 1)} retailers per 1,000 people, so to the right of that point the gap goes the other way! This is why you should never read this coefficient on its own as "the difference between urban and rural".` : ""}</li></ul>
<p>${R === "Rural" ? "R chose rural as the reference because it comes first in the alphabet. Now click on Urban to make it the reference, and watch which numbers change and which don't." : "Notice that the lines haven't moved at all: only the coefficients have changed, because they now describe everything starting from the urban line. This is just like changing the reference category in Practical 4."} This is the same as running separate models for the urban and rural datazones (as we did in Practical 2), except that it's one model, and the confidence interval for the interaction tells us whether the two slopes really are different.`;
    },
  },

  describe: (s) => s.tab === "dummies"
    ? `Four group means (treated and untreated, before and after) with the model's predicted lines. ${s.interaction ? "With the interaction the lines pass through every mean." : "Without the interaction the lines are parallel and miss the means."}`
    : `Scatter plot of smoking rate against retailers per 1,000 people for 150 urban and 150 rural datazones, with a fitted line for each. Urban slope ${f(s.fit.lines[0].slope)}, rural slope ${f(s.fit.lines[1].slope)}.`,
};

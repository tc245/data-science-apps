// All of the words on the page. Written in the same voice as the practical notebooks.
// `now` is the model with the ticked domains, `alone` holds each domain's model on its own and
// `full` is the practical's model with all seven, so the numbers in the text always match the page.

const f = (x, dp = 2) => { const t = x.toFixed(dp); return Number(t) === 0 ? t.replace("-", "") : t.replace("-", "−"); };
const code = (name) => `<code>${name}</code>`;
const list = (names) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

export const TEXT = {
  intro: `In Practical 2 we put all seven domains of the SIMD into one model to see which kinds of deprivation are associated with the number of tobacco retailers, and only income deprivation (income_rank) had a clear association. So does that mean that health, employment and education deprivation don't matter for tobacco retailing? Not so fast!`,

  scaleNote: (full) => `The coefficients here are for every 100 ranks, which makes them easier to read. R gives them for a single rank, so ${f(full.terms.income_rank.estimate)} here is ${f(full.terms.income_rank.estimate / 100, 4)} in your R output. Remember that rank 1 is the most deprived datazone, so a negative coefficient means more retailers in more deprived datazones.`,

  legend: {
    alone: "<b>If it was the only domain in the model.</b> These come from seven separate models, one for each domain, so they never move.",
    model: "<b>In the model you have built</b> with the tick boxes. These change every time you tick or untick a domain.",
  },
  columns: ["", "In your model", "95% CI", "As the only domain"],
  fit: (now) => `Multiple R-squared: <b>${f(now.r2, 3)}</b> &nbsp; Adjusted R-squared: <b>${f(now.adjR2, 3)}</b>`,
  code: (names) => `lm(retailers_adj ~ ${names.join(" +\n     ")},\n   data = urban_only, na.action = na.exclude)`,
  noCode: `# Tick at least one domain`,

  explain: {
    none: () => `There is nothing in the model at the moment! Tick one of the domains to get started.`,

    one: (name, now, alone) => name === "access_rank"
      ? `${code("access_rank")} is the odd one out. On its own its coefficient is ${f(now.terms[name].estimate)}, which is small and goes the other way to all of the others, and the model explains hardly any of the variation in retailers (R-squared ${f(now.r2, 3)}). Have a look at the grid underneath the plot: access deprivation is barely related to the other six domains at all. Now try one of the others...`
      : `Here ${code(name)} is the only domain in the model, and it has a clear association with tobacco retailers: its coefficient is <b>${f(now.terms[name].estimate)}</b> and the confidence interval is nowhere near zero. So datazones that are more deprived on this domain have more tobacco retailers. Now untick it and try the others one at a time (the hollow circles show you what each one looks like on its own). Nearly all of them tell the same story! If you only had one of these variables, you would say it mattered. ${name === "income_rank" ? "Now add a second domain as well..." : `Now add ${code("income_rank")} as well...`}`,

    withIncome: (now, alone, full, others, isFull, r) =>
      `${isFull ? "This is the model from the practical. " : ""}Look at what has happened to ${others.length > 1 ? "the other domains" : code(others[0])}! With ${code("income_rank")} in the model ${others.length > 1 ? "their coefficients have" : "its coefficient has"} shrunk to almost nothing and the confidence intervals now include zero, while ${code("income_rank")} itself has hardly changed (${f(now.terms.income_rank.estimate)}, compared with ${f(alone.income_rank.terms.income_rank.estimate)} on its own). So do the other kinds of deprivation not matter after all? Be careful! Have a look at the grid underneath the plot. A datazone that is income deprived is nearly always health, employment and education deprived as well (the correlation between ${code("income_rank")} and ${code("health_rank")} is ${f(r)}). These variables are telling us almost the same thing, so once one of them is in the model the others don't have much left to add. Look at the R-squared: it is ${f(alone.income_rank.r2, 3)} with income on its own and still only ${f(full.r2, 3)} with all seven. Notice as well that the confidence interval for ${code("income_rank")} is wider than it was on its own. When predictors overlap this much, the model finds it harder to separate out their effects. Now untick ${code("income_rank")} and see what happens...`,

    withoutIncome: (now, alone, full, clear) =>
      `Now ${code("income_rank")} isn't in the model, and look: ${clear.length ? `${list(clear.map(code))} ${clear.length > 1 ? "have" : "has"} a clear association with tobacco retailers again` : "the association is being shared out between the domains that are left"}! Nothing about our datazones has changed. All we have changed is which variables are in the model. With income missing, the domains that are closely related to it stand in for it. So we can't say that income deprivation is the kind of deprivation that "really" matters and the others don't. What we can say is that deprivation in general is associated with tobacco retailers, and that our data can't tell these closely related domains apart very well. Remember that a coefficient in a multiple regression is the effect of one variable holding the others constant, and that is hard to do when the variables nearly always go up and down together. (The technical name for this is <b>multicollinearity</b>.) It is always worth looking at how your predictors are related to each other before you interpret a model like this!`,
  },

  chartDescription: (names) => names.length
    ? `Coefficient plot for the seven deprivation domains. Hollow circles show each domain's coefficient when it is the only one in the model; all but access_rank are clearly negative. Filled circles show the coefficients in the chosen model, which includes ${list(names)}.`
    : `Coefficient plot for the seven deprivation domains, showing each domain's coefficient when it is the only one in the model. No domains are ticked.`,
  gridDescription: (r) => `Grid of correlations between the seven domain ranks. Income, health, employment and education are strongly correlated with each other (income and health ${f(r)}), crime and housing moderately, and access hardly at all.`,
};

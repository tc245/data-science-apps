// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the `observed` statistic, the number of shuffles `n`, how many of them
// `beaten` were at least as big as the real one, the p-value `p`, the slider value `strengthNow`, and the settings.

const f = (x, dp = 3) => x.toFixed(dp);
const pText = (s) => (s.beaten === 0 ? `1 in ${(s.n + 1).toLocaleString()}, the smallest it can be with ${s.n.toLocaleString()} shuffles` : f(s.p));

export const TEXT = {
  intro: `In the practical we used <b>Moran's I</b> to test whether smoking rates (and later our residuals) were clustered across the map, and the correlation between each residual and the one from the year before to test whether they were related over time. <code>moran.mc</code> works by <b>shuffling</b>: it deals the values out at random across the map lots of times to see what chance alone would give. Here you can do the shuffling yourself, on simulated data where you control how much autocorrelation there is.`,

  statName: { space: "Moran's I", time: "Correlation with the year before" },

  slider: {
    space: (v) => `How clustered the real map is: <b>${v === 0 ? "not at all" : v < 0.4 ? "a little" : v < 0.7 ? "quite a lot" : "a lot"}</b>`,
    time: (v) => `How much each year is like the year before: <b>${v === 0 ? "not at all" : v < 0.4 ? "a little" : v < 0.7 ? "quite a lot" : "a lot"}</b>`,
  },

  dataTitle: (s, shuffledNow) => s.mode === "space"
    ? (shuffledNow ? "A shuffled map" : "The real map")
    : (shuffledNow ? "10 areas, shuffled" : "10 of the 200 areas, over 8 years"),

  histTitle: (s) => (s.n === 0 ? "No shuffles yet" : `${s.n.toLocaleString()} shuffle${s.n === 1 ? "" : "s"}`),

  code: {
    space: `set.seed(2026)\n\nmoran.mc(map_2015$smoking_rate, weights_rowstd, nsim = 999)`,
    time: `cor.test(panel$residual, panel$residual_last_year)\n\n# the shuffling idea, by hand: deal the values out at random\nshuffled <- sample(panel$residual)`,
  },

  result: (s) => s.n === 0
    ? `${s.mode === "space" ? "Moran's I" : "The correlation"} for the real data is <b>${f(s.observed)}</b>. Shuffle to see whether that is more than chance would give.`
    : `${s.mode === "space" ? "Moran's I" : "The correlation"} for the real data is <b>${f(s.observed)}</b>. ${s.beaten.toLocaleString()} of the ${s.n.toLocaleString()} shuffles gave a value at least that big, so the p-value is (${s.beaten} + 1) / (${s.n} + 1) = <b>${f(s.p)}</b>.${s.mode === "space" && s.n === 999 ? " That's the same sum <code>moran.mc</code> does." : ""}`,

  explain: {
    space: {
      none: (s) => `Each of the 1,600 datazones has been given a simulated value: dark blue is high and light blue is low. ${s.strengthNow === 0 ? "Right now the values are completely random, so there shouldn't be any pattern at all" : "We have made neighbouring datazones alike, so dark areas tend to sit next to dark areas and light areas next to light ones (it's easiest to see in the big rural datazones)"}. Moran's I for this map is <b>${f(s.observed)}</b>. But how do we know whether that is more than we would get by chance? Press <b>Shuffle once</b>.`,
      few: (s) => `The map now shows the same 1,600 values, but dealt out at random across the datazones. Any pattern has gone, because where a value ends up has nothing to do with its neighbours. This shuffled map has a Moran's I of ${f(s.last)}, and it has been added to the chart. Keep pressing and you will see that shuffled maps nearly always give a Moran's I very close to zero. Then press <b>Shuffle 999 times</b>, which is what <code>moran.mc(..., nsim = 999)</code> does.`,
      many: (s) => s.beaten < 0.05 * s.n
        ? `The grey bars show what chance alone gives: ${s.n.toLocaleString()} shuffled maps, all with a Moran's I close to zero. The orange line is the real map, at ${f(s.observed)}, and ${s.beaten === 0 ? "<b>not one</b>" : `only ${s.beaten}`} of the shuffled maps got that high. So the p-value is ${pText(s)}, and we can be confident the clustering is real and not just chance. Now try moving the slider down to "not at all" and shuffling again.`
        : `This time the real map's Moran's I (${f(s.observed)}) sits right in among the shuffled ones: ${s.beaten.toLocaleString()} of the ${s.n.toLocaleString()} shuffled maps did at least as well. The p-value is ${f(s.p)}, so there is no evidence of clustering. That's right, because with the slider at "${s.strengthNow === 0 ? "not at all" : "a little"}" there ${s.strengthNow === 0 ? "isn't any" : "is hardly any"}. A Moran's I that isn't exactly zero doesn't mean anything on its own; it's only when it is bigger than nearly all of the shuffled values that we can say it is more than chance.`,
    },
    time: {
      none: (s) => `Now we have 200 areas, each measured in 8 years (the lines show 10 of them). ${s.strengthNow === 0 ? "Right now each year is completely unrelated to the year before, so the lines jump about at random" : "Each year is partly a repeat of the year before, so each line wanders up and down quite smoothly, and an area that is high one year tends to be high the next"}. The correlation between each value and the one from the year before is <b>${f(s.observed)}</b>. That's what we did with <code>cor.test</code> on the residuals in the practical. Press <b>Shuffle once</b>.`,
      few: (s) => `Shuffling deals all of the values out again at random, to any area and any year. Look at the lines: they now jump about, because a value has nothing to do with the one before it any more. The correlation with the year before is now ${f(s.last)}. Keep going, or press <b>Shuffle 999 times</b>.`,
      many: (s) => s.beaten < 0.05 * s.n
        ? `The shuffled data give correlations close to zero, and the real data (${f(s.observed)}) are way out on their own: ${s.beaten === 0 ? "none" : `only ${s.beaten}`} of the ${s.n.toLocaleString()} shuffles got that high, so the p-value is ${pText(s)}. The values are related over time (temporal autocorrelation). In the practical this is why 8 years of data from one datazone are not 8 separate pieces of information, and why we used clustered standard errors.`
        : `With so little year-to-year similarity, the real correlation (${f(s.observed)}) is right in among the shuffled ones (p = ${f(s.p)}), so there is no evidence of temporal autocorrelation. Move the slider up and try again.`,
    },
  },

  describe: {
    data: (s) => (s.mode === "space" ? "Map of 1,600 datazones coloured by a simulated value." : "Lines showing a simulated value over 8 years for 10 areas."),
    hist: (s) => `Histogram of ${s.n} shuffled values of the statistic, with the real value at ${f(s.observed)}.`,
  },
};

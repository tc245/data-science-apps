// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out for the page: n, p, k, the distribution `d` and the words for the things we are counting.

// Probabilities to three significant figures, like R prints them, but without e-notation.
export const prob = (v) => (v < 0.0001 ? "less than 0.0001" : v > 0.9999 && v < 1 ? "more than 0.9999" : String(+v.toPrecision(3)));
const oneIn = (v) => (v >= 0.2 || v < 1e-9 ? "" : ` (about 1 in ${Math.round(1 / v).toLocaleString("en-GB")})`);
const pct = (v) => `${+(v * 100).toFixed(1)}%`;

export const WORDS = {
  coin: { tries: "flips", tried: "times", one: "tail", many: "tails", p: "Probability that each flip lands on tails" },
  datazone: { tries: "pregnant women", tried: "pregnant women", one: "smoker", many: "smokers", p: "Probability that each woman smokes" },
};
const things = (k, w) => `${k} ${k === 1 ? w.one : w.many}`;

export const TEXT = {
  intro: `In the practical we met the <b>binomial distribution</b>, which tells us how likely each number of tails is if we flip a coin 100 times. Getting exactly 64 tails, for example, only has a probability of 0.00156. Here you can flip as many coins as you like, make the coin unfair, and see for yourself how likely each result is.`,

  explain: {
    fair: (s) =>
      `If we flip a fair coin ${s.n} times, the most likely result is ${things(s.mode, s.w)}, but even that only happens ${pct(s.d.prob[s.mode])} of the time. The probability of getting exactly ${things(s.k, s.w)} is <b>${prob(s.d.prob[s.k])}</b>${oneIn(s.d.prob[s.k])}. ${s.tail ? `That is very unlikely! ${s.k} is a long way out in the tail of the distribution, where the bars are so small you can hardly see them. If we flipped a coin ${s.n} times and got ${things(s.k, s.w)}, we might start to wonder whether the coin really was fair...` : `That's not unusual at all. Most results bunch up fairly close to ${s.n / 2}, and anything from ${s.range[0]} to ${s.range[1]} ${s.w.many} would not be surprising (95% of the time we would get a result in this range).`} Now try making the coin unfair with the second slider, or cutting the number of flips right down...`,

    few: (s) =>
      `With only ${s.n} ${s.w.tries}, there are only ${s.n + 1} possible results, so the distribution is much lumpier. Look at how spread out it is compared with the number of ${s.w.tries}. ${Math.abs(s.k / s.n - s.p) < 0.1 ? `Try picking a result a bit further from the middle with the third slider, say ${Math.max(1, Math.round(s.n * 0.8))} ${s.w.many} out of ${s.n}...` : `${things(s.k, s.w)} out of ${s.n} is ${pct(s.k / s.n)}, and the probability of getting a result at least as far ${s.k / s.n >= s.p ? "above" : "below"} ${pct(s.p)} as this is <b>${prob(s.extreme)}</b>. With 100 ${s.w.tries}, the probability of getting ${pct(s.k / s.n)} or ${s.k / s.n >= s.p ? "more" : "less"} would be ${s.extreme100 < 0.0001 ? "" : "only "}<b>${prob(s.extreme100)}</b>. This is why small numbers can give us very extreme percentages just by chance. Keep this in mind when you look at the smoking rates in datazones with only a few pregnant women!`}`,

    skew: (s) =>
      `Now the coin isn't fair: each flip lands on tails with a probability of ${s.p}. The bars now bunch up around ${+(s.n * s.p).toFixed(1)} (that's ${s.n} × ${s.p}). The probability of exactly ${things(s.k, s.w)} is <b>${prob(s.d.prob[s.k])}</b>${oneIn(s.d.prob[s.k])}. ${s.squashed ? `Notice that the distribution is no longer symmetrical. We can never get fewer than 0 ${s.w.many} or more than ${s.n}, so when the probability gets close to 0 or 1 the bars pile up against the end and the tail on the other side is longer. ` : `With this many ${s.w.tries} the distribution still looks fairly symmetrical, but try making the probability even closer to 0 or 1, or reducing the number of ${s.w.tries}... `}This is the same problem we had with our linear regression model: probabilities are stuck between 0 and 1, and things behave differently near the edges.`,

    datazone: (s) =>
      `Let's swap the coins for people. The first datazone in our data has 23 pregnant women, 2 of whom smoked, and across all of our data about 15% of pregnant women smoked. If every woman in this datazone had the same 15% chance of smoking, we would expect about ${+(s.n * s.p).toFixed(1)} smokers. But look at how wide the distribution is! Anything from ${s.range[0]} to ${s.range[1]} smokers would not be surprising (that's a smoking rate of anywhere between ${pct(s.range[0] / s.n)} and ${pct(s.range[1] / s.n)}). The probability of exactly ${things(s.k, s.w)} is <b>${prob(s.d.prob[s.k])}</b>. So even if every datazone had exactly the same chance of smoking, their smoking rates would still differ quite a lot, just by chance. This is the kind of variation that the Poisson regression at the end of the practical expects to see. If real datazones vary even more than this, that's called <b>overdispersion</b> (there's more about this at the end of the practical). Try changing the number of pregnant women and see how the range of likely smoking rates changes...`,
  },

  describe: (s) => `Bar chart of the probability of each number of ${s.w.many}, from 0 to ${s.n}, out of ${s.n} ${s.w.tries} with a probability of ${s.p} each. The tallest bar is at ${s.mode}, with a probability of ${prob(s.d.prob[s.mode])}. The highlighted bar is ${s.k}, with a probability of ${prob(s.d.prob[s.k])}.`,
};

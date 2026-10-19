// The binomial distribution: the chance of k "successes" (tails, smokers...) out of n tries,
// when each try has the same probability p. These are dbinom() and pbinom() in R.

// log(0!), log(1!), ... log(n!), so we can work out n choose k without huge numbers.
const logFact = [0];
const lfact = (n) => { for (let i = logFact.length; i <= n; i++) logFact[i] = logFact[i - 1] + Math.log(i); return logFact[n]; };

// The probability of exactly k successes.
export function dbinom(k, n, p) {
  if (k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(lfact(n) - lfact(k) - lfact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

// Every probability from 0 to n successes, and the running totals from each end.
export function distribution(n, p) {
  const prob = Array.from({ length: n + 1 }, (_, k) => dbinom(k, n, p));
  const atMost = [], atLeast = [];
  prob.reduce((s, v, k) => (atMost[k] = s + v), 0);
  prob.reduceRight((s, v, k) => (atLeast[k] = s + v), 0);
  return { prob, atMost, atLeast };
}

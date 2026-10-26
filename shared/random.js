// Random numbers we can repeat: the same seed always gives the same ones (like set.seed() in R).
export function random(seed) {
  let a = seed >>> 0;
  const uniform = () => { // mulberry32
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform());
  // rpois() in R. Fine for the small counts we have here.
  const poisson = (mu) => { const limit = Math.exp(-mu); let k = 0, p = uniform(); while (p > limit) { k++; p *= uniform(); } return k; };
  return { uniform, normal, poisson };
}

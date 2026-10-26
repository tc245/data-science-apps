// All of the words on the page. Written in the same voice as the practical notebooks.
// `s` is what app.js works out: the chosen datazone (`id`, `chosen`), its number of neighbours `n`, its own
// smoking rate `own`, the spatial `lag`, the weight `w` each neighbour gets, and the settings.

const f = (x, dp = 2) => x.toFixed(dp);

export const TEXT = {
  intro: `In the practical we defined which datazones are <b>neighbours</b>, turned those neighbours into <b>spatial weights</b>, and used the weights to calculate the <b>spatial lag</b>: the (weighted) average smoking rate of each datazone's neighbours. Here you can do all of that for any datazone you like, and see the <b>temporal lag</b> (last year's value) as well. The map shows the smoking rate in 2015, the last year before the licence cap came in.`,

  code: (s) => {
    const nb = s.rule === "knn" ? `knn_nb <- knn2nb(knearneigh(centroids, k = ${s.k}))` : `${s.rule}_nb <- poly2nb(datazones, queen = ${s.rule === "queen" ? "TRUE" : "FALSE"})`;
    const name = s.rule === "knn" ? "knn_nb" : `${s.rule}_nb`, w = s.style === "W" ? "weights_rowstd" : "weights_binary";
    return `${nb}\n${w} <- nb2listw(${name}, style = "${s.style}")\n\n# the weights and the spatial lag for datazone ${s.chosen + 1}\n${w}$weights[[${s.chosen + 1}]]\nlag.listw(${w}, map_2015$smoking_rate)[${s.chosen + 1}]`;
  },

  lag: (s) => s.style === "W"
    ? `So the neighbours of ${s.id} have an <b>average</b> smoking rate of <b>${f(s.lag)}%</b>. Its own smoking rate is ${f(s.own)}%. Notice that the spatial lag doesn't include the datazone's own value at all.`
    : `With binary weights the spatial lag is the <b>total</b> of the neighbours' smoking rates, <b>${f(s.lag)}</b>. That isn't a smoking rate at all (it can easily be more than 100!), and it gets bigger the more neighbours a datazone has.`,

  years: (now, last) => `Each datazone also has neighbours in time. The orange dot is the smoking rate in 2015 (${now}%) and the black dot is the year before (${last}%). The value from the year before is the <b>temporal lag</b>, which we made with <code>lag(smoking_rate)</code> after <code>group_by(datazone)</code>. There is no need for weights here: there is only one "last year", so it gets a weight of 1.`,

  explain: {
    queen: (s) => `These are <b>queen</b> neighbours: every datazone that shares at least one point of its boundary with ${s.id}, even if it is just a corner. It has <b>${s.n}</b> of them. The orange lines join the centre (centroid) of ${s.id} to the centre of each neighbour. Try switching to rook neighbours. For most datazones nothing changes at all, because irregular boundaries hardly ever meet at a single point (only 12 of our 1,600 datazones have a different number of queen and rook neighbours).`,
    rook: (s) => `These are <b>rook</b> neighbours: datazones that share an edge with ${s.id}, not just a corner. It has <b>${s.n}</b> of them. For most datazones this is exactly the same as the queen neighbours. On a chessboard it would make a big difference (4 neighbours instead of 8), but real boundaries are irregular and very rarely meet at a single point.`,
    knn: (s) => `These are the <b>${s.k} nearest</b> neighbours: the ${s.k} datazones whose centres are closest to the centre of ${s.id}. They don't have to share a boundary at all. Try clicking on a big rural datazone and then a tiny city one: in the countryside the nearest neighbours can be a long way away, and some of them may not even touch it. Move the slider to change k. Every datazone always gets exactly k neighbours, which can be helpful when some areas would otherwise have very few.`,
    W: (s) => `With <b>row-standardised</b> weights (<code>style = "W"</code>), each neighbour gets a weight of 1 divided by the number of neighbours (1/${s.n} = ${f(s.w, 3)}), so the weights add up to 1. Multiply each neighbour's smoking rate by its weight and add them up, and you get the <b>average</b> of the neighbours: the spatial lag, ${f(s.lag)}%.`,
    B: (s) => `With <b>binary</b> weights (<code>style = "B"</code>), every neighbour gets a weight of 1, so the spatial lag is the <b>total</b> of the neighbours' values (${f(s.lag)}). A datazone with lots of neighbours gets a much bigger number than one with only a few, even if their neighbours are just the same. That is why we use row-standardised weights in the practical.`,
  },

  describe: {
    map: (id, n) => `Map of the datazones coloured by smoking rate in 2015, with ${id} and its ${n} neighbours outlined and joined by lines.`,
    years: (id, vals) => `Smoking rate in ${id} in each year from 2012 to 2019: ${vals.join(", ")} percent.`,
  },
};

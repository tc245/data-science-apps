# Data Science for Geographers: interactive illustrations

Small web pages that go alongside the practical notebooks. They are plain HTML, CSS and JavaScript with no build step, published with GitHub Pages.

- `index.html`: the list of apps.
- `join-explorer/`: Practical 1. What each type of join does to the tobacco retailer counts, including the duplicate-postcode problem. R and Python versions of the text and code.
- `confounding/`: Practical 2. What adjusting for deprivation does to the association between tobacco retailers and smoking rates. R and Python versions of the code (the switch is in `shared/lang.js`). Its `data.js` is made by `scripts/build_app_data.py` in the course repo.
- `outliers/`: Practical 2. How much the six datazones with extremely high retailer rates change the regression, and why the exact cut-off doesn't matter. R and Python versions of the code (the switch is in `shared/lang.js`). Its `data.js` comes from the same script.
- `predictors/`: Practical 2. Why only income deprivation is associated with tobacco retailers once all seven SIMD domains are in the model (correlated predictors). R and Python versions of the code (the switch is in `shared/lang.js`). Its `data.js` comes from the same script.
- `residuals/`: Practical 3. Simulated "good" and "bad" data, as in the notebook, with one slider that bends the relationship and one that makes the noise grow with x, so each problem can be seen on its own in the residuals vs fitted, Q-Q and scale-location plots. The data are made in the browser from a seed (`diagnostics.js`), so there is no `data.js`. R code only, as Practical 3 has no Python version.
- `reference/`: Practical 4. Smoking rates by SIMD quintile for every datazone in the notebook: choose the reference category and see the intercept, the coefficients (as arrows from the reference mean) and the dummy variables change, or treat the quintile as a number to get the single straight line from "The problem". Its `data.js` comes from `scripts/build_app_data.py`. R code only.
- `binomial/`: Practical 4. The binomial distribution: sliders for the number of flips and the probability of tails, the probability of any number of tails with the matching `dbinom()` and `pbinom()` code, and a datazone example (23 pregnant women, a 15% chance each) linking it to smoking rates. Calculated in the browser (`binomial.js`), so there is no `data.js`. R code only.
- `logistic/`: Practical 4. The rural datazones from the logistic regression section: the straight line's impossible predictions against the logistic curve, the same model on the probability, odds and log-odds scales, odds ratios for 1, 100 and 1,000 ranks, and a slider that moves the 20% cut-off. Its `data.js` comes from `scripts/build_app_data.py`. R code only.
- `counts/`: Practical 4. 200 simulated datazones for the Poisson regression section: leave out the offset and the rate ratio is biased, add extra variation between datazones and the deviance/df rises while the Poisson confidence intervals stop containing the true value (checked over 200 simulated studies), and quasipoisson puts them right. The data are made in the browser from a seed (`counts.js`), so there is no `data.js`. R code only.
- `neighbours/`: Practical 6. Click any datazone to see its queen, rook or k nearest neighbours, the binary or row-standardised weights, the spatial lag worked out as a table, and its smoking rate over time with last year marked as the temporal lag. Its `data.js` (smoking rates by year) comes from `scripts/build_app_data.py`. R code only.
- `did/`: Practical 6. A difference-in-differences estimate built step by step on 100 simulated treated and 100 untreated datazones: before and after, treated vs untreated, the counterfactual line, the difference-in-differences (with the 2 x 2 table) and the event study, with sliders for the gap between the groups, the size of the effect and a non-parallel trend. Simulated in the browser from a seed (`did.js`), so there is no `data.js`. R code only.
- `autocorrelation/`: Practical 6. Permutation tests done by hand: shuffle a simulated map (with a slider for how clustered it is) and build up the distribution of Moran's I, or shuffle 200 simulated areas' values over 8 years and do the same for the correlation with the year before. Simulated in the browser (`sim.js`). R code only.
- `shared/datazones.js`: the Practical 6 datazone outlines (simplified), centroids and queen and rook neighbours (matching `poly2nb` in R), made by `scripts/build_app_data.py`.
- `shared/spatial.js`: nearest neighbours, weights, spatial lags and Moran's I for the Practical 6 apps (checked against `spdep` in `test/spatial.test.mjs`).
- `shared/random.js`: random numbers from a seed, for the apps that simulate their data.
- `shared/explain.js`: updates the "What's going on?" box and flashes it when the explanation changes.
- `shared/model.js`: linear regression (`lm`) for the Practical 2 and 4 apps, and logistic and Poisson regression (`glm`, checked against R in `test/glm.test.mjs`) for the Practical 4 apps.
- `shared/style.css`: shared colours (light and dark), typography, layout, controls, tables and charts.

All data are simulated: every datazone, postcode and retailer is fictional.

To preview locally, serve this folder (the pages use JavaScript modules, which browsers won't load from `file://`):

```sh
python -m http.server 8000
```

then open http://localhost:8000. To check the join and regression logic:

```sh
node --test test/
```

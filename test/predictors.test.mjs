// Run with: node --test test/
// Coefficients (per 100 ranks), standard errors, R-squared and correlations checked against numpy,
// and the seven-domain model against lm() in R (the third model in the Practical 2 notebook).
import test from "node:test";
import assert from "node:assert/strict";
import { DATA } from "../predictors/data.js";
import { DOMAINS, fit, correlation } from "../predictors/fit.js";

const close = (got, want, tol = 1e-3) => assert.ok(Math.abs(got - want) < tol, `${got} is not ${want}`);

test("each domain on its own", () => {
  const alone = { income_rank: [-0.259, 0.3], health_rank: [-0.226, 0.23], employment_rank: [-0.235, 0.251],
    education_rank: [-0.221, 0.218], access_rank: [0.065, 0.012], crime_rank: [-0.172, 0.126], housing_rank: [-0.152, 0.1] };
  for (const [name, [estimate, r2]] of Object.entries(alone)) {
    const m = fit(DATA, [name]);
    close(m.terms[name].estimate, estimate);
    close(m.r2, r2);
  }
});

test("all seven domains: the practical's model", () => {
  const m = fit(DATA, DOMAINS);
  close(m.terms.income_rank.estimate, -0.2291, 1e-4);
  close(m.terms.income_rank.se, 0.03064, 1e-4);
  close(m.terms.income_rank.ci[0], -0.2891631, 2e-4);
  close(m.terms.health_rank.estimate, -0.006939, 1e-4);
  close(m.terms.access_rank.estimate, 0.02462, 1e-4);
  close(m.terms.housing_rank.ci[1], 0.01522187, 2e-4);
  close(m.r2, 0.3031);
  close(m.adjR2, 0.299);
});

test("without income, the other domains pick up the association", () => {
  const m = fit(DATA, DOMAINS.filter((name) => name !== "income_rank"));
  close(m.terms.employment_rank.estimate, -0.117);
  close(m.terms.health_rank.estimate, -0.065);
  close(m.r2, 0.27);
});

test("the domains are strongly correlated with each other", () => {
  close(correlation(DATA, "income_rank", "health_rank"), 0.86, 5e-3);
  close(correlation(DATA, "income_rank", "employment_rank"), 0.9, 5e-3);
  close(correlation(DATA, "income_rank", "access_rank"), -0.12, 5e-3);
  close(correlation(DATA, "crime_rank", "housing_rank"), 0.37, 5e-3);
});

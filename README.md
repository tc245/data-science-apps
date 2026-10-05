# Data Science for Geographers: interactive illustrations

Small web pages that go alongside the practical notebooks. They are plain HTML, CSS and JavaScript with no build step, published with GitHub Pages.

- `index.html`: the list of apps.
- `join-explorer/`: Practical 1. What each type of join does to the tobacco retailer counts, including the duplicate-postcode problem. R and Python versions of the text and code.
- `confounding/`: Practical 2. What adjusting for deprivation does to the association between tobacco retailers and smoking rates. R only. Its `data.js` is made by `scripts/build_app_data.py` in the course repo.
- `outliers/`: Practical 2. How much the six datazones with extremely high retailer rates change the regression, and why the exact cut-off doesn't matter. R only. Its `data.js` comes from the same script.
- `shared/explain.js`: updates the "What's going on?" box and flashes it when the explanation changes.
- `shared/model.js`: the linear regression used by the Practical 2 apps.
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

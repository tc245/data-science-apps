# Data Science for Geographers: interactive illustrations

Small web pages that go alongside the practical notebooks. They are plain HTML, CSS and JavaScript with no build step, published with GitHub Pages.

- `index.html`: the list of apps.
- `join-explorer/`: Practical 1. What each type of join does to the tobacco retailer counts, including the duplicate-postcode problem. R and Python versions of the text and code.
- `shared/style.css`: shared colours (light and dark), typography and layout.

All data are simulated: every datazone, postcode and retailer is fictional.

To preview locally, serve this folder (the pages use JavaScript modules, which browsers won't load from `file://`):

```sh
python -m http.server 8000
```

then open http://localhost:8000. To check the join logic:

```sh
node --test test/
```

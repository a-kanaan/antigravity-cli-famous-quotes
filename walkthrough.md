# Famous Quotes Web Application — Walkthrough

## Summary of Changes

We built a complete web application using **Python (Flask)**, **HTML5**, **CSS3**, and **plain Vanilla JavaScript** to display random quotes and search/filter across **100 well-known quotes** by author or category.

### Files Created
- [requirements.txt](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/requirements.txt) & [pytest.ini](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/pytest.ini): Project dependencies (`Flask`, `pytest`) and test configuration.
- [quotes.json](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/data/quotes.json): Curated dataset of **100 well-known quotes** across 10 categories (*Wisdom*, *Inspiration*, *Philosophy*, *Science*, *Leadership*, *Literature*, *Life*, *Courage*, *Humor*, and *Success*).
- [app.py](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/app.py): Flask application providing:
  - `GET /`: Serves the main single-page HTML interface.
  - `GET /api/metadata`: Returns all unique categories and authors with quote counts.
  - `GET /api/quotes?author=<query>&category=<category>`: Filters quotes by case-insensitive author substring and/or category match.
  - `GET /api/quotes/random?author=<query>&category=<category>&exclude_id=<id>`: Returns a non-repeating random quote scoped to the active filters.
- [index.html](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/templates/index.html): Semantic HTML5 layout with a **Random Quote Spotlight** hero card, **Author Search** input with autocomplete `<datalist>`, **Category Filter Pills** & dropdown, and a responsive **Browse Quotes** grid.
- [styles.css](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/static/css/styles.css): Editorial styling, responsive grid layout, category pill states, and smooth fade transitions.
- [app.js](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/static/js/app.js): Vanilla JavaScript handling state synchronization, debounced live author search, category filtering, random quote drawing, and clipboard copying.
- [test_app.py](file:///C:/Users/akana/OneDrive/wp/proj/agy-cli-projects/famous-quotes/tests/test_app.py): Automated `pytest` suite verifying dataset integrity and all API endpoints.

---

## Verification Results

### Automated Tests (`pytest`)
All 10 automated tests passed:

```text
tests/test_app.py::test_quotes_dataset_integrity PASSED                  [ 10%]
tests/test_app.py::test_index_route PASSED                               [ 20%]
tests/test_app.py::test_metadata_endpoint PASSED                         [ 30%]
tests/test_app.py::test_get_all_quotes PASSED                            [ 40%]
tests/test_app.py::test_search_quotes_by_author PASSED                   [ 50%]
tests/test_app.py::test_search_quotes_by_category PASSED                 [ 60%]
tests/test_app.py::test_search_quotes_combined_author_and_category PASSED [ 70%]
tests/test_app.py::test_random_quote_endpoint PASSED                     [ 80%]
tests/test_app.py::test_random_quote_with_filters_and_exclude_id PASSED  [ 90%]
tests/test_app.py::test_random_quote_not_found PASSED                    [100%]

10 passed in 1.35s
```

---

## Running the Application Locally

To launch the web server locally:

```powershell
.venv\Scripts\flask.exe --app app run --debug
```

Then open `http://127.0.0.1:5000` in your browser.

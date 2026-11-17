# 100 Famous Quotes Explorer

A lightweight, full-stack web application for exploring a curated anthology of 100 famous quotes across 10 timeless categories and 55+ authors. Built with **Python (Flask)** on the backend and **Vanilla JavaScript, HTML5, and CSS3** on the frontend.

---

## Key Features

- **Random Quote Spotlight**: Highlights a random quote at the top of the page with smooth fade transitions, one-click clipboard copy, and non-repeating consecutive draws (`exclude_id`).
- **Filter-Aware Random Draws**: Drawing a new random quote automatically respects the currently active author and category filters.
- **Real-Time Author Search**: Case-insensitive partial author matching with a 200ms debounce and an auto-populated `<datalist>` showing quote counts per author.
- **Multi-Control Category Filtering**: Filter across 10 categories (*Wisdom, Inspiration, Philosophy, Science, Leadership, Literature, Life, Courage, Humor, Success*) via a dropdown, quick-filter pills, or interactive tags on any quote card.
- **Responsive Browse Grid**: Displays matching quotes in an adaptive CSS Grid with per-card **Copy to Clipboard** buttons, an **Export to CSV** utility, live result counts, and an empty-state reset view.

---

## Architecture Summary

### Project Structure

```text
famous-quotes/
├── app.py                  # Flask application factory, filtering engine, and REST API routes
├── data/
│   └── quotes.json         # Static dataset of 100 curated quotes (id, text, author, categories)
├── static/
│   ├── css/
│   │   └── styles.css      # Custom properties, dark spotlight theme, and responsive grid layout
│   └── js/
│       └── app.js          # Client-side state management, API fetching, and DOM rendering
├── templates/
│   └── index.html          # Main semantic HTML5 template served by Flask
├── tests/
│   └── test_app.py         # Pytest suite verifying dataset integrity and API behavior
├── pytest.ini              # Pytest configuration
└── requirements.txt        # Python dependencies (Flask, pytest)
```

### Server Side (`app.py` & `data/quotes.json`)

- **In-Memory Data Store**: At startup, `load_quotes()` reads `data/quotes.json` into memory (`QUOTES`) so all queries execute without disk I/O overhead.
- **Filtering Engine (`filter_quotes`)**: Combines case-insensitive substring matching for `author` and case-insensitive exact matching for `category`.
- **Application Factory (`create_app`)**: Exposes the HTML entry route and three JSON API endpoints:

| Endpoint | Method | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/` | `GET` | — | Renders `templates/index.html`. |
| `/api/metadata` | `GET` | — | Returns `total_quotes`, sorted `categories` with counts, and sorted `authors` with counts. |
| `/api/quotes` | `GET` | `author`, `category` | Returns `{ count, filters, quotes }` matching the active filters. |
| `/api/quotes/random` | `GET` | `author`, `category`, `exclude_id` | Returns a single random quote matching the filters (excluding `exclude_id` when multiple quotes match), or `404` if none match. |
| `/api/quotes/export` | `GET` | `author`, `category` | Exports matching quotes as a downloadable `famous-quotes.csv` file (`id,text,author,categories`). |

### Client Side (`templates/index.html`, `static/js/app.js`, `static/css/styles.css`)

- **State Management**: Maintains a single `state` object (`author`, `category`, `currentSpotlightQuote`, `totalQuotes`) inside an IIFE in `static/js/app.js`.
- **Bootstrap Flow**: On page load, `bootstrap()` sequentially calls `initMetadata()` (`GET /api/metadata`), `fetchRandomQuote()` (`GET /api/quotes/random`), and `fetchQuotesAndSyncSpotlight()` (`GET /api/quotes`).
- **UI Synchronization**: Selecting an author or category from any control (input field, dropdown, category pills, or quote card tags) synchronizes all filter controls, refreshes the quote grid, and updates the spotlight quote if the current spotlight no longer matches the active filter.

---

## Setup Guide

### Prerequisites

- **Python 3.10+** installed and available on your `PATH`.

### 1. Create and Activate a Virtual Environment

From the project root directory (`famous-quotes/`):

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

Install Flask and Pytest using `pip`:

```bash
pip install -r requirements.txt
```

---

## Run Steps

### Start the Application Server

You can start the development server directly with Python:

```bash
python app.py
```

Or using the Flask CLI:

```bash
flask --app app run --debug
```

Once running, open your browser and navigate to:
- **http://127.0.0.1:5000**

### Run the Test Suite

Execute the automated test suite with `pytest`:

```bash
pytest
```

For verbose test output:

```bash
pytest -v
```

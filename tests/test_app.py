from __future__ import annotations

import csv
import io

import pytest

from app import QUOTES, create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config.update({"TESTING": True})
    with app.test_client() as test_client:
        yield test_client


def test_quotes_dataset_integrity():
    assert len(QUOTES) == 100, "Dataset must contain exactly 100 quotes"
    ids = [q["id"] for q in QUOTES]
    assert len(set(ids)) == 100, "All 100 quote IDs must be unique"

    expected_categories = {
        "Wisdom",
        "Inspiration",
        "Philosophy",
        "Science",
        "Leadership",
        "Literature",
        "Life",
        "Courage",
        "Humor",
        "Success",
    }

    for quote in QUOTES:
        assert isinstance(quote.get("text"), str) and quote["text"].strip()
        assert isinstance(quote.get("author"), str) and quote["author"].strip()
        assert isinstance(quote.get("categories"), list) and len(quote["categories"]) >= 1
        for cat in quote["categories"]:
            assert cat in expected_categories, f"Unexpected category {cat} in quote {quote['id']}"


def test_index_route(client):
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "100 Famous Quotes" in html
    assert "Random Quote Spotlight" in html
    assert "Search by Author" in html
    assert "Export to CSV" in html
    assert "theme-toggle-btn" in html


def test_metadata_endpoint(client):
    response = client.get("/api/metadata")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total_quotes"] == 100
    assert len(data["categories"]) == 10
    assert len(data["authors"]) > 30
    assert all("name" in c and "count" in c for c in data["categories"])
    assert all("name" in a and "count" in a for a in data["authors"])


def test_get_all_quotes(client):
    response = client.get("/api/quotes")
    assert response.status_code == 200
    data = response.get_json()
    assert data["count"] == 100
    assert len(data["quotes"]) == 100


def test_search_quotes_by_author(client):
    # Case-insensitive partial match
    response = client.get("/api/quotes?author=einstein")
    assert response.status_code == 200
    data = response.get_json()
    assert data["count"] >= 2
    assert all("Albert Einstein" == q["author"] for q in data["quotes"])


def test_search_quotes_by_category(client):
    response = client.get("/api/quotes?category=science")
    assert response.status_code == 200
    data = response.get_json()
    assert data["count"] >= 10
    assert all(
        any(cat.lower() == "science" for cat in q["categories"])
        for q in data["quotes"]
    )


def test_search_quotes_combined_author_and_category(client):
    response = client.get("/api/quotes?author=wilde&category=humor")
    assert response.status_code == 200
    data = response.get_json()
    assert data["count"] >= 2
    for q in data["quotes"]:
        assert "Oscar Wilde" == q["author"]
        assert "Humor" in q["categories"]


def test_random_quote_endpoint(client):
    response = client.get("/api/quotes/random")
    assert response.status_code == 200
    quote = response.get_json()
    assert "id" in quote and "text" in quote and "author" in quote and "categories" in quote


def test_random_quote_with_filters_and_exclude_id(client):
    response = client.get("/api/quotes?author=Mark Twain")
    twain_quotes = response.get_json()["quotes"]
    assert len(twain_quotes) >= 2

    excluded_id = twain_quotes[0]["id"]
    for _ in range(10):
        rand_resp = client.get(
            f"/api/quotes/random?author=Mark Twain&exclude_id={excluded_id}"
        )
        assert rand_resp.status_code == 200
        rand_quote = rand_resp.get_json()
        assert rand_quote["author"] == "Mark Twain"
        assert rand_quote["id"] != excluded_id


def test_random_quote_not_found(client):
    response = client.get("/api/quotes/random?author=NonExistentAuthorXYZ")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_export_quotes_csv(client):
    response = client.get("/api/quotes/export")
    assert response.status_code == 200
    assert "text/csv" in response.content_type
    assert "famous-quotes.csv" in response.headers.get("Content-Disposition", "")

    csv_text = response.get_data(as_text=True)
    reader = list(csv.reader(io.StringIO(csv_text)))
    assert reader[0] == ["id", "text", "author", "categories"]
    assert len(reader) == 101  # 1 header + 100 quote rows


def test_export_quotes_csv_with_filters(client):
    response = client.get("/api/quotes/export?author=wilde&category=humor")
    assert response.status_code == 200
    csv_text = response.get_data(as_text=True)
    reader = list(csv.reader(io.StringIO(csv_text)))
    assert reader[0] == ["id", "text", "author", "categories"]
    assert len(reader) == 4  # 1 header + 3 Oscar Wilde humor quotes
    for row in reader[1:]:
        assert row[2] == "Oscar Wilde"
        assert "Humor" in row[3]


def test_ui_static_assets_and_theme_variables(client):
    css_resp = client.get("/static/css/styles.css")
    assert css_resp.status_code == 200
    css_text = css_resp.get_data(as_text=True)
    assert '[data-theme="dark"]' in css_text
    assert ".quote-card-copy-btn" in css_text
    assert ".btn-theme-toggle" in css_text

    js_resp = client.get("/static/js/app.js")
    assert js_resp.status_code == 200
    js_text = js_resp.get_data(as_text=True)
    assert "copyQuoteToClipboard" in js_text
    assert "exportQuotesToCsv" in js_text
    assert "applyTheme" in js_text
    assert "Copy to Clipboard" in js_text

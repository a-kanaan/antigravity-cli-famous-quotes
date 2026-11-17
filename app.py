from __future__ import annotations

import csv
import io
import json
import random
from collections import Counter
from pathlib import Path
from typing import Any

from flask import Flask, Response, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "quotes.json"


def load_quotes(path: Path = DATA_PATH) -> list[dict[str, Any]]:
    """Load the 100 well-known quotes from disk."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


QUOTES: list[dict[str, Any]] = load_quotes()


def filter_quotes(
    quotes: list[dict[str, Any]],
    author: str = "",
    category: str = "",
) -> list[dict[str, Any]]:
    """Filter quotes by author (case-insensitive substring) and/or category (case-insensitive exact)."""
    author_norm = author.strip().lower()
    category_norm = category.strip().lower()

    results = quotes
    if author_norm:
        results = [
            q for q in results if author_norm in q.get("author", "").lower()
        ]
    if category_norm:
        results = [
            q
            for q in results
            if any(cat.lower() == category_norm for cat in q.get("categories", []))
        ]
    return results


def create_app() -> Flask:
    app = Flask(__name__)

    @app.route("/", methods=["GET"])
    def index():
        return render_template("index.html")

    @app.route("/api/metadata", methods=["GET"])
    def get_metadata():
        category_counts: Counter[str] = Counter()
        author_counts: Counter[str] = Counter()

        for quote in QUOTES:
            author_counts[quote["author"]] += 1
            for cat in quote.get("categories", []):
                category_counts[cat] += 1

        categories = [
            {"name": name, "count": category_counts[name]}
            for name in sorted(category_counts.keys())
        ]
        authors = [
            {"name": name, "count": author_counts[name]}
            for name in sorted(author_counts.keys())
        ]

        return jsonify(
            {
                "total_quotes": len(QUOTES),
                "categories": categories,
                "authors": authors,
            }
        )

    @app.route("/api/quotes", methods=["GET"])
    def get_quotes():
        author = request.args.get("author", "").strip()
        category = request.args.get("category", "").strip()

        filtered = filter_quotes(QUOTES, author=author, category=category)
        return jsonify(
            {
                "count": len(filtered),
                "filters": {
                    "author": author,
                    "category": category,
                },
                "quotes": filtered,
            }
        )

    @app.route("/api/quotes/random", methods=["GET"])
    def get_random_quote():
        author = request.args.get("author", "").strip()
        category = request.args.get("category", "").strip()
        exclude_id = request.args.get("exclude_id", type=int)

        filtered = filter_quotes(QUOTES, author=author, category=category)
        if not filtered:
            return (
                jsonify(
                    {
                        "error": "No quotes found matching the given filters.",
                        "filters": {"author": author, "category": category},
                    }
                ),
                404,
            )

        candidates = (
            [q for q in filtered if q["id"] != exclude_id]
            if len(filtered) > 1 and exclude_id is not None
            else filtered
        )
        return jsonify(random.choice(candidates))

    @app.route("/api/quotes/export", methods=["GET"])
    def export_quotes_csv():
        author = request.args.get("author", "").strip()
        category = request.args.get("category", "").strip()

        filtered = filter_quotes(QUOTES, author=author, category=category)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "text", "author", "categories"])
        for q in filtered:
            writer.writerow(
                [
                    q.get("id", ""),
                    q.get("text", ""),
                    q.get("author", ""),
                    "; ".join(q.get("categories", [])),
                ]
            )

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition": 'attachment; filename="famous-quotes.csv"'
            },
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)

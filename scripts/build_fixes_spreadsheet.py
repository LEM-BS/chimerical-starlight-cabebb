#!/usr/bin/env python3
"""Generate suggested SEO titles and descriptions from the crawl export."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Iterable, List, Optional

try:  # pragma: no cover - optional dependency
    import pandas as pd  # type: ignore
except Exception:  # pragma: no cover - pandas is optional
    pd = None


def clamp(text: Optional[str], limit: int) -> str:
    if not text:
        return ""
    text = text.strip()
    return text if len(text) <= limit else text[:limit]


def suggest_title(row: dict, brand_suffix: str, limit: int) -> str:
    h1 = (row.get("H1") or row.get("Page Title") or "").strip()
    base = h1 if h1 else row.get("Page URL", "").strip()
    suggestion = f"{base}{brand_suffix}" if base else brand_suffix.strip()
    return clamp(suggestion, limit)


def suggest_description(row: dict, limit: int) -> str:
    intro = (row.get("Description") or "").strip()
    return clamp(intro, limit)


def write_csv(rows: Iterable[dict], output_path: Path) -> None:
    fieldnames = [
        "URL",
        "Current Title",
        "Suggested Title",
        "Current Description",
        "Suggested Description",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def load_rows(input_path: Path) -> List[dict]:
    if pd is not None:
        frame = pd.read_csv(input_path, sep=None, engine="python")
        return frame.to_dict(orient="records")

    with input_path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a spreadsheet of SEO title and description recommendations.",
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Path to lembuildingsurveying.co.uk_pages_YYYYMMDD.csv export.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("seo_fixes_suggestions.csv"),
        help="Where to write the suggestion CSV (default: seo_fixes_suggestions.csv).",
    )
    parser.add_argument(
        "--title-limit",
        type=int,
        default=60,
        help="Maximum length for the suggested title (default: 60 characters).",
    )
    parser.add_argument(
        "--description-limit",
        type=int,
        default=155,
        help="Maximum length for the suggested meta description (default: 155 characters).",
    )
    parser.add_argument(
        "--brand-suffix",
        default=" | LEM Building Surveying",
        help="Suffix appended to suggested titles before clamping.",
    )
    args = parser.parse_args()

    rows = load_rows(args.input)
    if not rows:
        raise SystemExit("No rows found in input export.")

    suggestions = []
    for row in rows:
        suggestions.append(
            {
                "URL": row.get("Page URL", ""),
                "Current Title": row.get("Page Title", ""),
                "Suggested Title": suggest_title(row, args.brand_suffix, args.title_limit),
                "Current Description": row.get("Description", ""),
                "Suggested Description": suggest_description(row, args.description_limit),
            }
        )

    write_csv(suggestions, args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()

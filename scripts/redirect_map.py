#!/usr/bin/env python3
"""Extract 4xx URLs from the crawl export and prepare a redirect worksheet."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Iterable, List

try:  # pragma: no cover
    import pandas as pd  # type: ignore
except Exception:  # pragma: no cover
    pd = None


FOUR_XX_COLUMNS = [
    "4xx errors",
    "4xx",
    "Status Code",
]


def load_export(path: Path) -> List[dict]:
    if pd is not None:
        frame = pd.read_csv(path, sep=None, engine="python")
        return frame.to_dict(orient="records")

    with path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def has_four_xx(row: dict) -> bool:
    for column in FOUR_XX_COLUMNS:
        if column in row:
            try:
                value = float(row[column])
            except (TypeError, ValueError):
                continue
            if value > 0:
                return True
    status = row.get("Status Code")
    return status in {"404", "410"}


def build_rows(rows: Iterable[dict]) -> List[dict]:
    seen = set()
    output: List[dict] = []
    for row in rows:
        url = (row.get("Page URL") or row.get("URL") or "").strip()
        if not url or url in seen:
            continue
        if not has_four_xx(row):
            continue
        seen.add(url)
        output.append({"URL": url, "Redirect target": ""})
    return output


def write_csv(rows: Iterable[dict], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["URL", "Redirect target"])
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a redirect map skeleton for 4xx URLs.")
    parser.add_argument(
        "input",
        type=Path,
        help="Path to lembuildingsurveying.co.uk_mega_export_YYYYMMDD.csv export.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("redirect_map.csv"),
        help="Where to write the redirect worksheet (default: redirect_map.csv).",
    )
    args = parser.parse_args()

    rows = load_export(args.input)
    filtered = build_rows(rows)
    write_csv(filtered, args.output)
    print(f"Wrote {args.output} with {len(filtered)} rows")


if __name__ == "__main__":
    main()

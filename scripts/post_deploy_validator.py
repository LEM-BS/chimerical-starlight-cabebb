#!/usr/bin/env python3
"""Check post-deployment status codes and canonical headers."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Iterable, Tuple

import requests


def read_urls(path: Path) -> Iterable[str]:
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            url = line.strip()
            if url:
                yield url


def check_url(url: str, timeout: float) -> Tuple[str, int | None, bool]:
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=False)
    except Exception:
        return url, None, False
    header = response.headers.get("link", "")
    has_canonical = 'rel="canonical"' in header.lower()
    return url, response.status_code, has_canonical


def write_report(rows: Iterable[Tuple[str, int | None, bool]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["URL", "Status", "Has canonical header?"])
        for row in rows:
            writer.writerow(row)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate response codes and canonical headers.")
    parser.add_argument(
        "input",
        type=Path,
        default=Path("urls_to_check.txt"),
        nargs="?",
        help="File containing one URL per line (default: urls_to_check.txt).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("post_deploy_status.csv"),
        help="Where to write the CSV report (default: post_deploy_status.csv).",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Request timeout in seconds (default: 10).",
    )
    args = parser.parse_args()

    urls = list(read_urls(args.input))
    if not urls:
        raise SystemExit("No URLs provided for validation.")

    results = [check_url(url, args.timeout) for url in urls]
    write_report(results, args.output)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()

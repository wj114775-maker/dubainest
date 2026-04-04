from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List
from urllib.request import Request, urlopen
from datetime import UTC, datetime

import pandas as pd


OFFICIAL_URL = (
    "https://gateway.dubailand.gov.ae/mashrooi/developers"
    "?searchRequest.sort=nameEN"
    "&consumer-id=gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F"
)


def clean(value: object) -> str:
    return str(value or "").replace("\xa0", " ").strip()


def read_official_developers() -> List[Dict[str, str]]:
    request = Request(
        OFFICIAL_URL,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        },
    )
    response = urlopen(request, timeout=30)
    payload = json.loads(response.read().decode("utf-8", "ignore"))
    developers = payload.get("response", {}).get("developers", [])
    rows = []
    for item in developers:
        rows.append(
            {
                "office_number": clean(item.get("number")),
                "english_name": clean(item.get("name", {}).get("englishName")),
                "arabic_name": clean(item.get("name", {}).get("arabicName")),
                "email": clean(item.get("contact", {}).get("email")),
                "phone_number": clean(item.get("contact", {}).get("phone") or item.get("contact", {}).get("mobile")),
                "logo_url": clean(item.get("logo", {}).get("thumbnailUrl") or item.get("logo", {}).get("mediaUrl")),
                "source": "official",
            }
        )
    return rows


def read_fallback_export(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []

    table = pd.read_html(path)[0]
    rows = []
    for record in table.fillna("").to_dict(orient="records"):
        rows.append(
            {
                "office_number": clean(record.get("Office Number")),
                "english_name": clean(record.get("Name English")),
                "arabic_name": clean(record.get("Name Arabic")),
                "email": clean(record.get("Email")),
                "phone_number": clean(record.get("Phone Number")),
                "logo_url": "",
                "source": "fallback_file",
            }
        )
    return rows


def make_key(record: Dict[str, str]) -> str:
    office_number = clean(record.get("office_number"))
    if office_number:
        return f"office:{office_number}"
    return f"name:{clean(record.get('english_name')).lower()}"


def merge_rows(official_rows: List[Dict[str, str]], fallback_rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    merged: Dict[str, Dict[str, str]] = {}

    for row in fallback_rows + official_rows:
        key = make_key(row)
        existing = merged.get(key, {})
        merged[key] = {
            "office_number": row.get("office_number") or existing.get("office_number", ""),
            "english_name": row.get("english_name") or existing.get("english_name", ""),
            "arabic_name": row.get("arabic_name") or existing.get("arabic_name", ""),
            "email": row.get("email") or existing.get("email", ""),
            "phone_number": row.get("phone_number") or existing.get("phone_number", ""),
            "logo_url": row.get("logo_url") or existing.get("logo_url", ""),
            "source": row.get("source") or existing.get("source", ""),
        }

    records = list(merged.values())
    records.sort(key=lambda item: item["english_name"].lower())
    return records


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    fallback_input = Path(r"C:\Users\Johna\Downloads\approved_developers.xls")
    output_path = repo_root / "src" / "data" / "approvedDevelopers.generated.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    official_rows = read_official_developers()
    fallback_rows = read_fallback_export(fallback_input)
    merged_rows = merge_rows(official_rows, fallback_rows)

    payload = {
        "synced_at": datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "official_url": OFFICIAL_URL,
        "official_count": len(official_rows),
        "fallback_count": len(fallback_rows),
        "count": len(merged_rows),
        "developers": merged_rows,
    }

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(merged_rows)} developers to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

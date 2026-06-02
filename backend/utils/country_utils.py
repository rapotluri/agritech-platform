from typing import List, Optional, Union

CountryValue = Union[str, List[str], None]


def normalize_country(value: CountryValue) -> Optional[str]:
    """Normalize country from Supabase (text or text[] column)."""
    if value is None:
        return None
    if isinstance(value, list):
        return value[0] if value else None
    return value


def country_for_db(country: str) -> List[str]:
    """Format country for the weather_downloads.country text[] column."""
    return [country]

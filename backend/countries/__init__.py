from typing import List, Optional

from countries import cambodia, nigeria

SUPPORTED_COUNTRIES = {
    "Cambodia": cambodia,
    "Nigeria": nigeria,
}


def get_country_module(country: str):
    module = SUPPORTED_COUNTRIES.get(country)
    if module is None:
        raise ValueError(
            f"Unsupported country: {country}. Supported countries: {list(SUPPORTED_COUNTRIES)}"
        )
    return module


def detect_country_for_province(province: str) -> Optional[str]:
    for country, module in SUPPORTED_COUNTRIES.items():
        if module.validate_location(province):
            return country
    return None


def validate_location(country: str, province: str, district: Optional[str] = None, commune: Optional[str] = None) -> bool:
    module = get_country_module(country)
    return module.validate_location(province, district, commune)


def get_all_provinces(country: str) -> List[str]:
    module = get_country_module(country)
    if country == "Nigeria":
        return module.get_all_states()
    return module.get_all_provinces()


def get_districts_for_province(country: str, province: str) -> List[str]:
    module = get_country_module(country)
    if country == "Nigeria":
        return module.get_lgas_for_state(province)
    return module.get_districts_for_province(province)


def get_communes_for_district(country: str, province: str, district: str) -> List[str]:
    module = get_country_module(country)
    return module.get_communes_for_district(province, district)


def province_to_filename(country: str, province: str) -> str:
    module = get_country_module(country)
    if country == "Nigeria":
        return module.state_to_filename(province)
    return module.province_to_filename(province)


def get_geodataframe(country: str):
    module = get_country_module(country)
    if country == "Nigeria":
        return module.get_geodataframe()
    return module.get_communes_geodataframe()


def to_climate_column_name(country: str, district: str, commune: str) -> str:
    module = get_country_module(country)
    return module.to_climate_column_name(district, commune)

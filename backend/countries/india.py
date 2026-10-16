import geopandas as gpd
import os
import json
from typing import Optional, Dict, List

_location_data_cache: Optional[Dict] = None

# GeoJSON NAME_1 values → canonical state / UT names
_STATE_NAME_MAP = {
    "AndamanandNicobar": "Andaman and Nicobar",
    "AndhraPradesh": "Andhra Pradesh",
    "ArunachalPradesh": "Arunachal Pradesh",
    "Assam": "Assam",
    "Bihar": "Bihar",
    "Chandigarh": "Chandigarh",
    "Chhattisgarh": "Chhattisgarh",
    "DadraandNagarHaveli": "Dadra and Nagar Haveli",
    "DamanandDiu": "Daman and Diu",
    "Goa": "Goa",
    "Gujarat": "Gujarat",
    "Haryana": "Haryana",
    "HimachalPradesh": "Himachal Pradesh",
    "JammuandKashmir": "Jammu and Kashmir",
    "Jharkhand": "Jharkhand",
    "Karnataka": "Karnataka",
    "Kerala": "Kerala",
    "Lakshadweep": "Lakshadweep",
    "MadhyaPradesh": "Madhya Pradesh",
    "Maharashtra": "Maharashtra",
    "Manipur": "Manipur",
    "Meghalaya": "Meghalaya",
    "Mizoram": "Mizoram",
    "NCTofDelhi": "NCT of Delhi",
    "Nagaland": "Nagaland",
    "Odisha": "Odisha",
    "Puducherry": "Puducherry",
    "Punjab": "Punjab",
    "Rajasthan": "Rajasthan",
    "Sikkim": "Sikkim",
    "TamilNadu": "Tamil Nadu",
    "Telangana": "Telangana",
    "Tripura": "Tripura",
    "UttarPradesh": "Uttar Pradesh",
    "Uttarakhand": "Uttarakhand",
    "WestBengal": "West Bengal",
}


def _load_location_data() -> Dict:
    global _location_data_cache
    if _location_data_cache is None:
        json_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "data", "india_locations.json"
        )
        with open(json_path, "r", encoding="utf-8") as f:
            _location_data_cache = json.load(f)
    return _location_data_cache


_NAME_CORRECTIONS = {
    "DadraandNagarHaveli": "Dadra and Nagar Haveli",
    "NorthandMiddleAndaman": "North and Middle Andaman",
    "SouthAndaman": "South Andaman",
    "NicobarIslands": "Nicobar Islands",
}


def _format_camel_case_name(name: str) -> str:
    """Split CamelCase GeoJSON labels into spaced canonical names."""
    if name is None:
        return ""
    name = str(name)
    if not name or name == "NA":
        return name
    if name in _NAME_CORRECTIONS:
        return _NAME_CORRECTIONS[name]
    if " " in name or name.startswith("n.a."):
        return name.replace("- ", "-").replace("  ", " ").strip()

    parts = []
    current = name[0]
    for char in name[1:]:
        if char.isupper() and not current.endswith(" "):
            parts.append(current)
            current = char
        else:
            current += char
    parts.append(current)
    return " ".join(parts)


def _format_state_name_from_geojson(name: str) -> str:
    return _STATE_NAME_MAP.get(name, _format_camel_case_name(name))


def validate_location(
    province: str, district: Optional[str] = None, commune: Optional[str] = None
) -> bool:
    """Validate state/district/taluk against canonical India location data."""
    locations = _load_location_data()

    if province not in locations:
        return False

    if district is None:
        return True

    if district not in locations[province]:
        return False

    if commune is None:
        return True

    return commune in locations[province][district]


def province_to_filename(province: str) -> str:
    return province.replace(" ", "")


def to_climate_column_name(district: str, commune: str) -> str:
    district_formatted = district.replace(" ", "")
    commune_formatted = commune.replace(" ", "")
    return f"{district_formatted}_{commune_formatted}"


def get_all_provinces() -> List[str]:
    return list(_load_location_data().keys())


def get_districts_for_province(province: str) -> List[str]:
    locations = _load_location_data()
    if province not in locations:
        return []
    return list(locations[province].keys())


def get_communes_for_district(province: str, district: str) -> List[str]:
    locations = _load_location_data()
    if province not in locations or district not in locations[province]:
        return []
    return locations[province][district]


def get_communes_geodataframe():
    """
    Load India taluk boundaries.
    NAME_1 = state/UT, NAME_2 = district, NAME_3 = taluk.
    Duplicate taluk rows within a district are dissolved so weather columns stay unique.
    """
    geojson_file = os.path.join(os.getcwd(), "boundaries", "india.geojson")
    try:
        gdf = gpd.read_file(geojson_file)
        gdf["NAME_1"] = gdf["NAME_1"].map(_format_state_name_from_geojson)
        gdf["NAME_2"] = gdf["NAME_2"].map(_format_camel_case_name)
        gdf["NAME_3"] = gdf["NAME_3"].map(_format_camel_case_name)
        gdf["normalized_NAME_1"] = gdf["NAME_1"].apply(province_to_filename)

        # Merge duplicate taluk polygons so retrieval yields one column per taluk
        gdf = gdf.dissolve(by=["NAME_1", "NAME_2", "NAME_3"], as_index=False)
        gdf["normalized_NAME_1"] = gdf["NAME_1"].apply(province_to_filename)
    except Exception as e:
        raise RuntimeError(f"Error reading India GeoJSON file: {str(e)}")
    return gdf

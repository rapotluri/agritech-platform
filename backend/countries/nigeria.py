import geopandas as gpd
import os
import json
from typing import Optional, Tuple, Dict, List

_location_data_cache: Optional[Dict] = None


def _load_location_data() -> Dict:
    global _location_data_cache
    if _location_data_cache is None:
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "nigeria_locations.json")
        with open(json_path, "r", encoding="utf-8") as f:
            _location_data_cache = json.load(f)
    return _location_data_cache


def validate_location(state: str, lga: Optional[str] = None, commune: Optional[str] = None) -> bool:
    """Validate state/LGA against canonical Nigeria location data."""
    locations = _load_location_data()

    if state not in locations:
        return False

    if lga is None:
        return True

    if lga not in locations[state]:
        return False

    if commune is None:
        return True

    return commune in locations[state][lga]


def state_to_filename(state: str) -> str:
    return state.replace(" ", "")


def to_climate_column_name(lga: str, _commune: str) -> str:
    return lga.replace(" ", "")


def get_all_states() -> List[str]:
    return list(_load_location_data().keys())


def get_lgas_for_state(state: str) -> List[str]:
    locations = _load_location_data()
    if state not in locations:
        return []
    return list(locations[state].keys())


def get_geodataframe():
    """
    Load Nigeria LGA boundaries. NAME_1 = state, NAME_2 = LGA.
    NAME_3 mirrors NAME_2 so existing weather retrieval can treat LGAs as polygon units.
    """
    geojson_file = os.path.join(os.getcwd(), "boundaries", "nigeria.geojson")
    try:
        gdf = gpd.read_file(geojson_file)
        gdf["NAME_1"] = gdf["NAME_1"].map(_format_state_name_from_geojson)
        gdf["NAME_2"] = gdf["NAME_2"].map(_format_lga_name_from_geojson)
        gdf["NAME_3"] = gdf["NAME_2"]
        gdf["normalized_NAME_1"] = gdf["NAME_1"].apply(state_to_filename)
    except Exception as e:
        raise RuntimeError(f"Error reading Nigeria GeoJSON file: {str(e)}")
    return gdf


def _format_state_name_from_geojson(name: str) -> str:
    corrections = {
        "AkwaIbom": "Akwa Ibom",
        "CrossRiver": "Cross River",
        "FederalCapitalTerritory": "Federal Capital Territory",
    }
    return corrections.get(name, name)


def _format_lga_name_from_geojson(name: str) -> str:
    if " " in name or name.isupper():
        return name.replace("- ", "-").replace("  ", " ")
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

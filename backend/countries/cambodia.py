import geopandas as gpd
import os
import json
from typing import Optional, Tuple, Dict, List

# Cache for location data from JSON
_location_data_cache: Optional[Dict] = None

def _load_location_data() -> Dict:
    """Load and cache location data from JSON file."""
    global _location_data_cache
    if _location_data_cache is None:
        json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cambodia_locations.json")
        with open(json_path, 'r', encoding='utf-8') as f:
            _location_data_cache = json.load(f)
    return _location_data_cache


def normalize_province_name(name: str) -> str:
    """
    Normalize province names for Cambodia by removing special characters,
    spaces, and applying consistent formatting.
    Example: "Kâmpóng Spœ" -> "KampongSpeu"
    
    **DEPRECATED**: This function is kept for GeoJSON compatibility and legacy code only.
    For new code, use `province_to_filename()` instead, which simply removes spaces
    from canonical format names.
    
    This function handles special character normalization (e.g., "Kâmpóng Spœ" -> "KampongSpeu")
    which is needed for processing legacy GeoJSON data that may have non-ASCII characters.
    
    Args:
        name: Province name (may contain special characters or be in various formats)
    
    Returns:
        Normalized province name without spaces or special characters
    """
    special_char_map = {
        "â": "a",
        "œ": "oe",
        "é": "e",
        "è": "e",
        "ê": "e",
        "ô": "o",
        "û": "u",
        "ç": "c",
        "î": "i",
        "ï": "i",
        "à": "a",
        "ë": "e",
        "ü": "u",
        "ù": "u",
        "ÿ": "y",
        "ñ": "n",
        "ø": "o",
        "õ": "o",
        "Ã": "A",
        "ã": "a",
        "É": "E",
        "È": "E",
        "À": "A",
        "Ó": "O",
        "ó": "o",
        "Ú": "U",
        "ú": "u",
        "ß": "ss",
        "í": "i",
    }

    # Remove special characters using the mapping
    name = "".join([special_char_map.get(char, char) for char in name])

    # Remove spaces and ensure capitalization of words
    name_parts = name.split(" ")
    name = "".join([part for part in name_parts])

    # Manually fix known discrepancies
    manual_corrections = {
        "KampongSpoe": "KampongSpeu",  # Correct to the standard format
        "Phnompenh": "PhnomPenh",
        "Tbongkhmum": "TboungKhmum",
        "Preahvihear": "PreahVihear",
        "Siemreab": "SiemReap",
        "Svayrieng": "SvayRieng",
        "Batdambang": "Battambang",
        "KampongThum": "KampongThom",
        "KaohKong": "KohKong",
        "Rotanokiri": "Ratanakiri",
        "StoengTreng": "StungTreng",
        "MondolKiri": "Mondulkiri",
        "MondulKiri": "Mondulkiri",
        "PreahSihanouk": "Sihanoukville",
        "RatanakKiri": "Ratanakiri", 
        "Siemreap": "SiemReap",
        "TboungKhmum": "TbongKhmum",
        "OtdarMeanChey": "OddarMeanchey",
        "Kracheh": "Kratie",
        "Pouthisat": "Pursat",
        "Takev": "Takeo",
        "KrongPreahSihanouk": "Sihanoukville",
        "KrongPailin": "Pailin",
    }

    # Apply manual corrections if necessary
    return manual_corrections.get(name, name)


def validate_location(province: str, district: Optional[str] = None, commune: Optional[str] = None) -> bool:
    """
    Validate that a location exists in the canonical location data.
    
    All location names must be in canonical format (with spaces preserved).
    Example: "Banteay Meanchey", "Mongkol Borei", "Banteay Neang"
    
    This is the standard format used throughout the application. The canonical format
    is defined in backend/data/cambodia_locations.json, which is the single source
    of truth for all location names.
    
    Args:
        province: Province name in canonical format (e.g., "Banteay Meanchey")
        district: Optional district name in canonical format (e.g., "Mongkol Borei")
        commune: Optional commune name in canonical format (e.g., "Banteay Neang")
    
    Returns:
        True if location exists, False otherwise
    """
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
    """
    Convert canonical province name to filename format.
    Example: "Banteay Meanchey" → "BanteayMeanchey"
    
    This function converts from the canonical format (used throughout the application)
    to the filename format (used for parquet files and GeoJSON lookups).
    
    Args:
        province: Province name in canonical format (e.g., "Banteay Meanchey")
    
    Returns:
        Province name without spaces for use in file names (e.g., "BanteayMeanchey")
    """
    return province.replace(" ", "")


def to_climate_column_name(district: str, commune: str) -> str:
    """
    Convert district and commune to climate data column format.
    Example: "Mongkol Borei" + "Banteay Neang" → "MongkolBorei_BanteayNeang"
    
    Climate data parquet files use column names in the format "DistrictName_CommuneName"
    (without spaces). This function converts from canonical format (with spaces) to
    the column name format used in parquet files.
    
    Args:
        district: District name in canonical format (e.g., "Mongkol Borei")
        commune: Commune name in canonical format (e.g., "Banteay Neang")
    
    Returns:
        Column name in format "DistrictName_CommuneName" (e.g., "MongkolBorei_BanteayNeang")
    """
    district_formatted = district.replace(" ", "")
    commune_formatted = commune.replace(" ", "")
    return f"{district_formatted}_{commune_formatted}"


def from_climate_column_name(column_name: str) -> Optional[Tuple[str, str, str]]:
    """
    Parse climate data column name back to canonical format.
    Example: "MongkolBorei_BanteayNeang" → ("Banteay Meanchey", "Mongkol Borei", "Banteay Neang")
    
    This function converts from the column name format used in parquet files
    (without spaces) back to canonical format (with spaces) used throughout the application.
    
    Args:
        column_name: Column name in format "DistrictName_CommuneName" (e.g., "MongkolBorei_BanteayNeang")
    
    Returns:
        Tuple of (province, district, commune) in canonical format, or None if not found
        Example: ("Banteay Meanchey", "Mongkol Borei", "Banteay Neang")
    """
    locations = _load_location_data()
    
    # Split column name into district and commune parts
    parts = column_name.split("_", 1)
    if len(parts) != 2:
        return None
    
    district_formatted, commune_formatted = parts
    
    # Search through all provinces and districts to find matching names
    for province, districts in locations.items():
        for district, communes in districts.items():
            district_match = district.replace(" ", "") == district_formatted
            commune_match = commune_formatted in [c.replace(" ", "") for c in communes]
            
            if district_match and commune_match:
                # Find the exact commune name
                for commune in communes:
                    if commune.replace(" ", "") == commune_formatted:
                        return (province, district, commune)
    
    return None


def get_all_provinces() -> List[str]:
    """Get list of all province names in canonical format."""
    locations = _load_location_data()
    return list(locations.keys())


def get_districts_for_province(province: str) -> List[str]:
    """Get list of all district names for a province in canonical format."""
    locations = _load_location_data()
    if province not in locations:
        return []
    return list(locations[province].keys())


def get_communes_for_district(province: str, district: str) -> List[str]:
    """Get list of all commune names for a district in canonical format."""
    locations = _load_location_data()
    if province not in locations or district not in locations[province]:
        return []
    return locations[province][district]


def get_communes_geodataframe(use_updated: bool = True):
    """
    Load the GeoDataFrame for Cambodia's communes.
    
    Args:
        use_updated: If True, use the updated GeoJSON with canonical names.
                    If False, use the original GeoJSON (for backward compatibility).
    
    Returns:
        GeoDataFrame with commune data. If using updated file, NAME_1, NAME_2, NAME_3
        are in canonical format. A normalized_NAME_1 column is added for backward
        compatibility during migration.
    """
    if use_updated:
        geojson_file = os.path.join(os.getcwd(), "boundaries", "cambodia_communes_updated.geojson")
        # Fallback to original if updated doesn't exist
        if not os.path.exists(geojson_file):
            geojson_file = os.path.join(os.getcwd(), "boundaries", "cambodia_communes.geojson")
    else:
        geojson_file = os.path.join(os.getcwd(), "boundaries", "cambodia_communes.geojson")
    
    try:
        communes_gdf = gpd.read_file(geojson_file)
        
        # Add normalized_NAME_1 column for backward compatibility during migration
        # This converts canonical province names back to filename format
        if "normalized_NAME_1" not in communes_gdf.columns:
            communes_gdf["normalized_NAME_1"] = communes_gdf["NAME_1"].apply(
                province_to_filename
            )
    except Exception as e:
        raise RuntimeError(f"Error reading GeoJSON file: {str(e)}")
    return communes_gdf

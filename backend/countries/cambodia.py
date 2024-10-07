import geopandas as gpd
import os

def normalize_province_name(name: str) -> str:
    """
    Normalize province names for Cambodia by removing special characters,
    spaces, and applying consistent formatting.
    Example: "Kâmpóng Spœ" -> "KampongSpeu"
    """
    special_char_map = {
        "â": "a", "œ": "oe", "é": "e", "è": "e", "ê": "e", "ô": "o", "û": "u", "ç": "c",
        "î": "i", "ï": "i", "à": "a", "ë": "e", "ü": "u", "ù": "u", "ÿ": "y", "ñ": "n",
        "ø": "o", "õ": "o", "Ã": "A", "ã": "a", "É": "E", "È": "E", "À": "A", "Ó": "O",
        "ó": "o", "Ú": "U", "ú": "u", "ß": "ss", "í": "i"
    }

    # Remove special characters using the mapping
    name = "".join([special_char_map.get(char, char) for char in name])

    # Remove spaces and ensure capitalization of words
    name_parts = name.split(" ")
    name = "".join([part.capitalize() for part in name_parts])

    # Manually fix known discrepancies
    manual_corrections = {
        "Kampongspoe": "KampongSpeu",     # Correct to the standard format
        "Phnompenh": "PhnomPenh",
        "Tbongkhmum": "TboungKhmum",
        "Preahvihear": "PreahVihear",
        "Siemreab": "SiemReap",
        "Svayrieng": "SvayRieng"
    }

    # Apply manual corrections if necessary
    return manual_corrections.get(name, name)

def get_communes_geodataframe():
    """
    Load the GeoDataFrame for Cambodia's communes and normalize the province names.
    """
    geojson_file = os.path.join(os.getcwd(), "boundaries", "cambodia_communes.geojson")
    try:
        communes_gdf = gpd.read_file(geojson_file)
        communes_gdf["normalized_NAME_1"] = communes_gdf["NAME_1"].apply(normalize_province_name)
    except Exception as e:
        raise RuntimeError(f"Error reading GeoJSON file: {str(e)}")
    return communes_gdf

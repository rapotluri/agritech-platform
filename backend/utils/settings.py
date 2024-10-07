import geopandas as gpd
import os
from countries.cambodia import normalize_province_name  # Import normalization function

def get_communes_geodataframe():
    """Load the GeoDataFrame for Cambodia's communes."""
    geojson_file = os.path.join(os.getcwd(), "boundaries", "cambodia_communes.geojson")
    try:
        communes_gdf = gpd.read_file(geojson_file)
        communes_gdf["normalized_NAME_1"] = communes_gdf["NAME_1"].apply(normalize_province_name)
    except Exception as e:
        raise RuntimeError(f"Error reading GeoJSON file: {str(e)}")
    return communes_gdf

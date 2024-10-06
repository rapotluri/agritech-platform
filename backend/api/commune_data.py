from fastapi import APIRouter, HTTPException
import geopandas as gpd
import pandas as pd
import ee
import os
import unicodedata  # For normalizing special characters

# Set up the FastAPI router
router = APIRouter(
    prefix="/api",
    tags=["commune-data"],
    responses={404: {"description": "Not found"}},
)

# Load the GeoJSON file containing commune boundaries
current_dir = os.getcwd()
geojson_file = os.path.join(current_dir, "boundaries", "cambodia_communes.geojson")

# Try to read the GeoJSON file
try:
    communes_gdf = gpd.read_file(geojson_file)
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error reading GeoJSON file: {str(e)}")


def normalize_province_name(name: str) -> str:
    """
    Normalize province names by removing special characters and spaces,
    and converting to a standard English format.
    Example: "Kâmpóng Spœ" -> "KampongSpeu"
    """
    # Define a dictionary for manual province name mappings
    manual_mappings = {
        "Kâmpóng Spœ": "KampongSpeu",
        "Bântéay Méanchey": "BanteayMeanChey",
        "Kâmpóng Thum": "KampongThum",
        "Kâmpóng Chhnang": "KampongChhnang",
        "Krâchéh": "Kracheh",
        "Preăh Vĭhéar": "PreahVihear",
        "Phnôm Pénh": "PhnomPenh",
    }

    # Use the manual mapping if the province name is found in the dictionary
    if name in manual_mappings:
        return manual_mappings[name]

    # Remove diacritics and special characters for general normalization
    name = unicodedata.normalize('NFKD', name).encode('ASCII', 'ignore').decode('utf-8')

    # Special case handling for Kampong Speu to ensure it maps correctly
    if "Sp" in name:
        return "KampongSpeu"

    # General replacement of spaces and capitalization
    name_parts = name.split(" ")
    name = "".join([part.capitalize() for part in name_parts])

    return name


@router.get("/commune-data")
async def get_commune_data(province: str, start_date: str, end_date: str):
    """
    Retrieve daily climate data for all communes within the specified province.
    Args:
    - province: The province name (e.g., "Kampong Speu").
    - start_date: The start date in the format 'YYYY-MM-DD'.
    - end_date: The end date in the format 'YYYY-MM-DD'.
    """

    # Normalize the input province name for matching
    normalized_province = normalize_province_name(province)
    print(f"\n[INFO] Normalized input province name: '{normalized_province}'")

    # Create a new column in the GeoDataFrame to hold the normalized province names
    communes_gdf["normalized_NAME_1"] = communes_gdf["NAME_1"].apply(normalize_province_name)

    # Check if the normalized province exists in the list
    if normalized_province not in communes_gdf["normalized_NAME_1"].unique():
        raise HTTPException(status_code=404, detail=f"No districts found for province: {province}. Check the name format.")

    # Filter the GeoDataFrame to get all districts within the specified normalized province
    province_districts = communes_gdf[communes_gdf["normalized_NAME_1"] == normalized_province]

    # Prepare an empty DataFrame to store the results
    result_df = pd.DataFrame()

    # Initialize Google Earth Engine if not already initialized
    if not ee.data._credentials:
        service_account = "accurate-596@accurate-436800.iam.gserviceaccount.com"
        file = os.path.join(current_dir, "api", "accurate-436800-37424d272a6e.json")
        credentials = ee.ServiceAccountCredentials(service_account, file)
        ee.Initialize(credentials)

    # Iterate through each district and retrieve daily data for each commune in that district
    unique_districts = province_districts["NAME_2"].unique()
    for district in unique_districts:
        print(f"Processing district: {district}")
        district_communes = province_districts[province_districts["NAME_2"] == district]

        # Retrieve data for each commune within the district
        for _, commune in district_communes.iterrows():
            commune_name = commune["NAME_3"]

            # Handle MultiPolygon and Polygon geometries
            if commune["geometry"].geom_type == "MultiPolygon":
                polygons = [ee.Geometry.Polygon(list(poly.exterior.coords)) for poly in commune["geometry"].geoms]
                commune_geometry = ee.Geometry.MultiPolygon(polygons)
            else:
                commune_geometry = ee.Geometry.Polygon(commune["geometry"]["coordinates"])

            # Fetch CHIRPS precipitation data for the commune's polygon over the specified time period
            chirps = (
                ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
                .filterDate(start_date, end_date)
                .select("precipitation")
            )

            # Add a 'date' property to each image
            chirps = chirps.map(lambda image: image.set("date", image.date().format("YYYY-MM-dd")))

            # Extract the data for each date using `reduceRegion`
            def extract_daily_data(image):
                # Calculate the mean precipitation for each date within the commune polygon
                mean_precipitation = image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=commune_geometry,
                    scale=5000,
                    maxPixels=1e13
                )
                # Return the image with mean precipitation set as a property
                return image.set("mean_precipitation", mean_precipitation.get("precipitation"))

            # Apply the `extract_daily_data` function to each image
            time_series = chirps.map(extract_daily_data).getInfo()

            # Extract daily precipitation data from the time series
            daily_data = {entry["properties"]["date"]: entry["properties"]["mean_precipitation"] for entry in time_series["features"] if "mean_precipitation" in entry["properties"]}

            # Convert the daily data dictionary to a DataFrame and merge it with the result_df
            daily_df = pd.DataFrame(list(daily_data.items()), columns=["Date", commune_name])
            if result_df.empty:
                result_df = daily_df
            else:
                result_df = pd.merge(result_df, daily_df, on="Date", how="outer")

    # Export the DataFrame to an Excel file
    excel_filename = f"{province}_climate_data.xlsx"
    result_df.to_excel(excel_filename, index=False)

    return {"message": "Data retrieved successfully", "filename": excel_filename}




import ee
import pandas as pd

def retrieve_precipitation_data(province_gdf, start_date: str, end_date: str):
    """
    Retrieve daily precipitation data for all communes within the specified province.
    Args:
    - province_gdf: GeoDataFrame containing the commune geometries.
    - start_date: The start date in the format 'YYYY-MM-DD'.
    - end_date: The end date in the format 'YYYY-MM-DD'.
    """
    result_df = pd.DataFrame()

    # Iterate through each commune
    for _, commune in province_gdf.iterrows():
        commune_name = commune["NAME_3"]

        # Define the geometry
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
            mean_precipitation = image.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=commune_geometry,
                scale=5000,
                maxPixels=1e13
            )
            return image.set("mean_precipitation", mean_precipitation.get("precipitation"))

        # Apply the `extract_daily_data` function
        time_series = chirps.map(extract_daily_data).getInfo()

        # Convert to a DataFrame
        daily_data = {entry["properties"]["date"]: entry["properties"]["mean_precipitation"] for entry in time_series["features"] if "mean_precipitation" in entry["properties"]}
        daily_df = pd.DataFrame(list(daily_data.items()), columns=["Date", commune_name])
        
        # Merge results
        result_df = pd.merge(result_df, daily_df, on="Date", how="outer") if not result_df.empty else daily_df

    return result_df

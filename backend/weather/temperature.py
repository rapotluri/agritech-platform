import ee
import pandas as pd

def retrieve_temperature_data(province_gdf, start_date: str, end_date: str):
    """
    Retrieve daily temperature data for all communes within the specified province.
    Args:
    - province_gdf: GeoDataFrame containing the commune geometries.
    - start_date: The start date in the format 'YYYY-MM-DD'.
    - end_date: The end date in the format 'YYYY-MM-DD'.
    """
    result_df = pd.DataFrame()

    # Iterate through each district in the province
    unique_districts = province_gdf["NAME_2"].unique()
    for district in unique_districts:
        print(f"[INFO] Processing district: {district}")  # Print statement to track progress

        # Filter for communes within the current district
        district_communes = province_gdf[province_gdf["NAME_2"] == district]

        # Retrieve temperature data for each commune in the district
        for _, commune in district_communes.iterrows():
            commune_name = commune["NAME_3"]

            # Define the geometry
            if commune["geometry"].geom_type == "MultiPolygon":
                polygons = [ee.Geometry.Polygon(list(poly.exterior.coords)) for poly in commune["geometry"].geoms]
                commune_geometry = ee.Geometry.MultiPolygon(polygons)
            else:
                commune_geometry = ee.Geometry.Polygon(commune["geometry"]["coordinates"])

            # Fetch ERA5 Daily Temperature data for the commune's polygon over the specified time period
            temperature = (
                ee.ImageCollection("ECMWF/ERA5/DAILY")
                .filterDate(start_date, end_date)
                .select("mean_2m_air_temperature")
            )

            # Add a 'date' property to each image
            temperature = temperature.map(lambda image: image.set("date", image.date().format("YYYY-MM-dd")))

            # Extract the data for each date using `reduceRegion`
            def extract_daily_data(image):
                # Calculate the mean temperature in Celsius (Kelvin - 273.15)
                mean_temperature_kelvin = image.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=commune_geometry,
                    scale=5000,
                    maxPixels=1e13
                )
                # Convert Kelvin to Celsius and set as a property
                mean_temperature_celsius = ee.Number(mean_temperature_kelvin.get("mean_2m_air_temperature")).subtract(273.15)
                return image.set("mean_temperature_celsius", mean_temperature_celsius)

            # Apply the `extract_daily_data` function
            time_series = temperature.map(extract_daily_data).getInfo()

            # Convert to a DataFrame
            daily_data = {entry["properties"]["date"]: entry["properties"]["mean_temperature_celsius"] for entry in time_series["features"] if "mean_temperature_celsius" in entry["properties"]}
            daily_df = pd.DataFrame(list(daily_data.items()), columns=["Date", commune_name])
            
            # Merge results
            result_df = pd.merge(result_df, daily_df, on="Date", how="outer") if not result_df.empty else daily_df

    return result_df

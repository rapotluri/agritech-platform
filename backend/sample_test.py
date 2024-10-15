from countries.cambodia import get_communes_geodataframe


provinces = [
    "BanteayMeanchey",
    "Battambang",
    "KampongCham",
    "KampongChhnang",
    "KampongSpeu",
    "KampongThom",
    "Kampot",
    "Kandal",
    "Kep",
    "KohKong",
    "Kratie",
    "Mondulkiri",
    "OddarMeanchey",
    "Pailin",
    "PhnomPenh",
    "PreahVihear",
    "PreyVeng",
    "Pursat",
    "Ratanakiri",
    "SiemReap",
    "Sihanoukville",
    "StungTreng",
    "SvayRieng",
    "TaiPoDistrict",
    "Takeo",
]


def test_provinces():
    # Load GeoDataFrame with communes
    communes_gdf = get_communes_geodataframe()
    province_with_no_geojson = []
    for province in provinces:
        province_gdf = communes_gdf[communes_gdf["normalized_NAME_1"] == province]
        if province_gdf.empty:
            province_with_no_geojson.append(province)
    print(province_with_no_geojson)

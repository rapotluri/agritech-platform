from services.insure_smart_premium_calc import calculate_insure_smart_premium

commune = "KaohChiveang"
province = "Battambang"

periods = [
    {
        "peril_type": "LRI",         # Drought
        "trigger": 120.0,            # mm
        "duration": 15,              # Trigger Days
        "unit_payout": 1.0,          # $/mm
        "max_payout": 120.0,         # $
        "allocated_si": 120.0,       # $ (set to max payout for this test)
        "start_day": 121,              # Phase Start
        "end_day": 151                # Phase End
    }
]

result = calculate_insure_smart_premium(
    commune=commune,
    province=province,
    periods=periods,
    weather_data_period=30
)

import pprint
pprint.pprint(result)
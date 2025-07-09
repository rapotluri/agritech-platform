import os
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta

# Helper: Map index type
INDEX_TYPE_MAP = {"LRI": "Low Rainfall Index", "ERI": "Excess Rainfall Index"}

# Module-level cache for weather data
_weather_data_cache = {}

def clear_weather_data_cache():
    """Clear the in-memory weather data cache."""
    _weather_data_cache.clear()

def _get_weather_data(province, data_type):
    key = (province, data_type)
    if key in _weather_data_cache:
        return _weather_data_cache[key]
    print(f"Loading weather data from disk for {province}, {data_type}")
    
    # Try Parquet first (new format)
    parquet_path = os.path.join(os.getcwd(), "climate_data", data_type, "Cambodia", f"{province}.parquet")
    if os.path.exists(parquet_path):
        print(f"Loading Parquet file: {parquet_path}")
        df = pd.read_parquet(parquet_path)
        _weather_data_cache[key] = df
        return df
    
    # Fallback to Excel (old format)
    excel_path = os.path.join(os.getcwd(), "files", data_type, "Cambodia", f"{province}.xlsx")
    if os.path.exists(excel_path):
        print(f"Loading Excel file (fallback): {excel_path}")
        df = pd.read_excel(excel_path, parse_dates=['Date'])
        _weather_data_cache[key] = df
        return df
    
    raise FileNotFoundError(f"No weather data file found for {province}. Tried: {parquet_path} and {excel_path}")

# Main function

def calculate_insure_smart_premium(
    commune: str,
    province: str,
    periods: List[Dict[str, Any]],
    sum_insured: float,
    weather_data_period: int = 30,
    data_type: str = "precipitation",
    admin_loading: float = 0.15,
    profit_loading: float = 0.075
) -> Dict[str, Any]:
    """
    Calculate premium and risk metrics for Insure Smart optimization.
    Args:
        commune: Commune name
        province: Province name
        periods: List of dicts, each with keys:
            - peril_type ("LRI" or "ERI")
            - trigger (float)
            - duration (int)
            - unit_payout (float)
            - max_payout (float)
            - allocated_si (float)
            - start_day (int, optional)
            - end_day (int, optional)
        sum_insured: Product-level sum insured (cap on total payout per year)
        weather_data_period: Number of years (default 30)
        data_type: "precipitation" (default)
        admin_loading: Admin cost loading (default 0.15)
        profit_loading: Profit loading (default 0.075)
    Returns:
        Dict with all metrics needed for scoring and constraints
    """
    # 1. Load weather data
    province = province.replace(" ", "")
    df = _get_weather_data(province, data_type)
    if commune not in df.columns:
        raise ValueError(f"Commune '{commune}' not found in data. Available: {df.columns.tolist()}")

    # 2. Get available years
    years = sorted(df['Date'].dt.year.unique())[-weather_data_period:]
    if len(years) < weather_data_period:
        raise ValueError(f"Not enough years of data for {commune} in {province}.")

    # 3. For each year, for each period, calculate payout
    yearly_results = []
    for year in years:
        year_result = {"year": year, "periods": [], "total_payout": 0.0}
        period_idx = 0
        while period_idx < len(periods):
            # Group all perils for this period
            base_period = periods[period_idx]
            # Find all perils for this period (could be 1 or 2)
            perils = []
            # Always at least one peril per period
            for peril_offset in range(2):
                idx = period_idx + peril_offset
                if idx < len(periods):
                    p = periods[idx]
                    # If start_day and end_day match, it's the same period (multi-peril)
                    if p.get("start_day", 0) == base_period.get("start_day", 0) and p.get("end_day", 364) == base_period.get("end_day", 364):
                        # Get period window (start_day, end_day) or use full year
                        start_day = p.get("start_day", 0)
                        end_day = p.get("end_day", 364)
                        year_start = datetime(year, 1, 1) + timedelta(days=start_day)
                        year_end = datetime(year, 1, 1) + timedelta(days=end_day)
                        period_data = df[(df['Date'] >= year_start) & (df['Date'] <= year_end)][commune]
                        if len(period_data) < p["duration"]:
                            payout = 0.0
                            trigger_met = False
                            actual_rainfall = None
                        else:
                            import numpy as np
                            rolling_sums = np.convolve(period_data.values, np.ones(p["duration"]), mode='valid')
                            if p["peril_type"] == "LRI":
                                min_rain = rolling_sums.min()
                                actual_rainfall = float(min_rain)
                                trigger_met = min_rain < p["trigger"]
                                if trigger_met:
                                    payout = min((p["trigger"] - min_rain) * p["unit_payout"], p["max_payout"], p["allocated_si"])
                                else:
                                    payout = 0.0
                            else:
                                max_rain = rolling_sums.max()
                                actual_rainfall = float(max_rain)
                                trigger_met = max_rain > p["trigger"]
                                if trigger_met:
                                    payout = min((max_rain - p["trigger"]) * p["unit_payout"], p["max_payout"], p["allocated_si"])
                                else:
                                    payout = 0.0
                        perils.append({
                            "peril_type": p["peril_type"],
                            "trigger": p["trigger"],
                            "duration": p["duration"],
                            "unit_payout": p["unit_payout"],
                            "max_payout": p["max_payout"],
                            "allocated_si": p["allocated_si"],
                            "trigger_met": trigger_met,
                            "payout": payout,
                            "actual_rainfall": actual_rainfall
                        })
                    else:
                        break
                else:
                    break
            # Add period with all perils
            year_result["periods"].append({
                "start_day": base_period.get("start_day", 0),
                "end_day": base_period.get("end_day", 364),
                "perils": perils
            })
            # Add payouts for all perils in this period
            year_result["total_payout"] += sum(peril["payout"] for peril in perils)
            period_idx += len(perils)
        yearly_results.append(year_result)

    # 4. Summarize payouts and calculate metrics
    yearly_total_payouts = [min(y["total_payout"], sum_insured) for y in yearly_results]
    Etotal = sum(yearly_total_payouts) / len(yearly_total_payouts) if yearly_total_payouts else 0.0
    max_payout_across_years = max(yearly_total_payouts) if yearly_total_payouts else 0.0
    payout_years = sum(1 for p in yearly_total_payouts if p > 0)
    coverage_score = payout_years / len(yearly_total_payouts) if yearly_total_payouts else 0.0
    payout_stability = pd.Series(yearly_total_payouts).std() if len(yearly_total_payouts) > 1 else 0.0
    
    # Premium calculation: expected payout as % of sum insured
    loaded_premium = Etotal * (1 + admin_loading + profit_loading)
    premium_rate = loaded_premium / sum_insured if sum_insured > 0 else 0.0
    loss_ratio = Etotal / loaded_premium if loaded_premium > 0 else 0.0
    
    # 5. Prepare breakdowns
    period_breakdown = []
    for idx, period in enumerate(periods):
        period_payouts = []
        for y in yearly_results:
            matching = next(
                (p for p in y["periods"] if p["start_day"] == period.get("start_day", 0) and p["end_day"] == period.get("end_day", 364)),
                None
            )
            if matching:
                period_payouts.append(sum(peril["payout"] for peril in matching["perils"]))
            else:
                period_payouts.append(0.0)
        period_avg = sum(period_payouts) / len(period_payouts)
        period_breakdown.append({
            "peril_type": period["peril_type"],
            "trigger": period["trigger"],
            "duration": period["duration"],
            "unit_payout": period["unit_payout"],
            "max_payout": period["max_payout"],
            "allocated_si": period["allocated_si"],
            "avg_payout": period_avg,
            "payout_years": sum(1 for p in period_payouts if p > 0)
        })

    # 6. Return all metrics
    # Calculate coverage penalty for periods with no payouts
    coverage_penalty = 0.0
    periods_with_no_payouts = 0
    total_periods = len(period_breakdown)
    
    for period in period_breakdown:
        if period["payout_years"] == 0:
            periods_with_no_payouts += 1
    
    # Coverage penalty: heavily penalize configurations with periods that never trigger
    if periods_with_no_payouts > 0:
        coverage_penalty = periods_with_no_payouts / total_periods
    
    return {
        "premium_rate": premium_rate,  # This is the pure premium as a fraction of total SI
        "avg_payout": Etotal,
        "max_payout": max_payout_across_years,
        "payout_years": payout_years,
        "coverage_score": coverage_score,
        "payout_stability_score": 1.0 / (1.0 + payout_stability),
        "period_breakdown": period_breakdown,
        "yearly_results": yearly_results,
        "valid": True,  # Remove strict validation - let scoring handle it
        "message": "OK",
        "loaded_premium": loaded_premium,
        "loss_ratio": loss_ratio,
        "coverage_penalty": coverage_penalty,
        "periods_with_no_payouts": periods_with_no_payouts
    } 
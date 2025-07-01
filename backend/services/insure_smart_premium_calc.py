import os
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime, timedelta

# Helper: Map index type
INDEX_TYPE_MAP = {"LRI": "Low Rainfall Index", "ERI": "Excess Rainfall Index"}

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
    file_path = os.path.join(os.getcwd(), "files", data_type, "Cambodia", f"{province}.xlsx")
    if not os.path.exists(file_path):
        raise ValueError(f"Weather data file not found for province '{province}' and data type '{data_type}'.")
    df = pd.read_excel(file_path, parse_dates=['Date'])
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
        for period in periods:
            # Get period window (start_day, end_day) or use full year
            start_day = period.get("start_day", 0)
            end_day = period.get("end_day", 364)
            # Get date range for this year
            year_start = datetime(year, 1, 1) + timedelta(days=start_day)
            year_end = datetime(year, 1, 1) + timedelta(days=end_day)
            period_data = df[(df['Date'] >= year_start) & (df['Date'] <= year_end)][commune]
            if len(period_data) < period["duration"]:
                # Not enough data for this period
                payout = 0.0
                trigger_met = False
            else:
                # Optimized rolling window calculation
                if len(period_data) >= period["duration"]:
                    # Use numpy for faster rolling sum
                    import numpy as np
                    rolling_sums = np.convolve(period_data.values, np.ones(period["duration"]), mode='valid')
                    
                    if period["peril_type"] == "LRI":
                        # LRI: payout if min(rolling sum) < trigger
                        min_rain = rolling_sums.min()
                        trigger_met = min_rain < period["trigger"]
                        if trigger_met:
                            payout = min((period["trigger"] - min_rain) * period["unit_payout"], period["max_payout"], period["allocated_si"])
                        else:
                            payout = 0.0
                    else:
                        # ERI: payout if max(rolling sum) > trigger
                        max_rain = rolling_sums.max()
                        trigger_met = max_rain > period["trigger"]
                        if trigger_met:
                            payout = min((max_rain - period["trigger"]) * period["unit_payout"], period["max_payout"], period["allocated_si"])
                        else:
                            payout = 0.0
                else:
                    # Not enough data for this period
                    payout = 0.0
                    trigger_met = False
            year_result["periods"].append({
                "peril_type": period["peril_type"],
                "trigger": period["trigger"],
                "duration": period["duration"],
                "unit_payout": period["unit_payout"],
                "max_payout": period["max_payout"],
                "allocated_si": period["allocated_si"],
                "trigger_met": trigger_met,
                "payout": payout
            })
            year_result["total_payout"] += payout
        yearly_results.append(year_result)

    # 4. Summarize payouts and calculate metrics
    yearly_total_payouts = [min(y["total_payout"], sum_insured) for y in yearly_results]
    Etotal = sum(yearly_total_payouts) / len(yearly_total_payouts) if yearly_total_payouts else 0.0
    max_payout_across_years = max(yearly_total_payouts) if yearly_total_payouts else 0.0
    payout_years = sum(1 for p in yearly_total_payouts if p > 0)
    coverage_score = payout_years / len(yearly_total_payouts) if yearly_total_payouts else 0.0
    payout_stability = pd.Series(yearly_total_payouts).std() if len(yearly_total_payouts) > 1 else 0.0
    
    # Premium calculation: expected payout as % of sum insured
    premium_rate = Etotal / sum_insured if sum_insured > 0 else 0.0
    loaded_premium = Etotal * (1 + admin_loading + profit_loading)
    loss_ratio = Etotal / loaded_premium if loaded_premium > 0 else 0.0
    
    # 5. Prepare breakdowns
    period_breakdown = []
    for idx, period in enumerate(periods):
        period_payouts = [y["periods"][idx]["payout"] for y in yearly_results]
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
    return {
        "premium_rate": premium_rate,  # This is the pure premium as a fraction of total SI
        "avg_payout": Etotal,
        "max_payout": max_payout_across_years,
        "payout_years": payout_years,
        "coverage_score": coverage_score,
        "payout_stability_score": 1.0 / (1.0 + payout_stability),
        "period_breakdown": period_breakdown,
        "yearly_results": yearly_results,
        "valid": all(p["payout_years"] >= 1 for p in period_breakdown),
        "message": "OK",
        "loaded_premium": loaded_premium,
        "loss_ratio": loss_ratio
    } 
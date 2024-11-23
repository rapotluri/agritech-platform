import os
from xmlrpc.client import Boolean
import pandas as pd
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from schemas.premium_schema import PremiumRequest
from fastapi import HTTPException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def map_index_type(frontend_type: str) -> str:
    """Map frontend index types to internal types"""
    type_mapping = {"Excess Rainfall": "ERI", "Drought": "LRI"}
    return type_mapping.get(frontend_type, frontend_type)


def get_aligned_dates(
    base_date: datetime, year: int, sos_start: int, sos_end: int
) -> tuple[datetime, datetime]:
    """Align the start and end dates to a specified historical year."""
    historical_date = base_date.replace(year=year)
    return (
        historical_date + timedelta(days=sos_start),
        historical_date + timedelta(days=sos_end),
    )


def analyze_phase_data(
    phase_data: pd.Series,
    consecutive_days: int,
    index_type: str,
    trigger: float,
) -> tuple[bool, float]:
    """Optimized version of rainfall data analysis for a specific phase period"""

    if len(phase_data) < consecutive_days:
        return False, 0.0

    # Calculate rolling sums
    cumulative_values = (
        phase_data.rolling(window=consecutive_days, min_periods=consecutive_days)
        .sum()
        .dropna()
        .tolist()
    )

    if not cumulative_values:
        return False, 0.0

    # Determine critical value based on index type
    mapped_type = map_index_type(index_type)
    if mapped_type == "LRI":
        critical_value = min(cumulative_values)  # Minimum cumulative rainfall
        trigger_met = critical_value < trigger
    else:  # ERI
        critical_value = max(cumulative_values)  # Maximum cumulative rainfall
        trigger_met = critical_value > trigger

    return trigger_met, float(critical_value)


def calculate_payout(
    trigger_met: Boolean,
    critical_value: float,
    trigger: float,
    unit_payout: float,
    max_payout: float,
) -> float:
    """Calculate payout amount based on trigger conditions and limits"""

    payout = abs(critical_value - trigger) * unit_payout if trigger_met else 0.0
    return min(payout, max_payout)


# REDO
def calculate_phase_summaries(results: List[dict], weather_data_period: int) -> Dict:
    """Calculate summary statistics for each phase"""
    # Initialize structure to store payouts by phase and index
    phase_index_payouts = {}

    # Collect payouts by phase and index type
    for year_result in results:
        for trigger in year_result["triggers"]:
            phase = trigger["phase"]
            index_type = trigger["index_type"]
            key = (phase, index_type)

            if key not in phase_index_payouts:
                phase_index_payouts[key] = []
            phase_index_payouts[key].append(trigger["payout"])

    # Calculate statistics for each phase-index combination
    phase_summaries = {}
    for (phase, index_type), payouts in phase_index_payouts.items():
        total_payout = sum(payouts)
        # Calculate average payout percentage (total payout divided by years)
        avg_payout_percentage = (
            total_payout / weather_data_period
        ) * 100  # Convert to percentage

        if phase not in phase_summaries:
            phase_summaries[phase] = {}

        phase_summaries[phase][index_type] = {
            "total_payout": float(total_payout),
            "average_payout_percentage": float(avg_payout_percentage),
            "max_payout": float(max(payouts)) if payouts else 0,
            "min_payout": float(min(payouts)) if payouts else 0,
        }

    return phase_summaries


# REDO
def calculate_final_premium(results: List[dict], phase_summaries: Dict) -> Dict:
    """Calculate final premium based on payouts and maximums"""

    # Get maximum total payout across all years (Q46 in Excel)
    yearly_totals = [year_result["total_payout"] for year_result in results]
    max_payout_across_years = max(yearly_totals) if yearly_totals else 0

    # Get all phase-index average percentages
    all_percentages = []
    for phase_data in phase_summaries.values():
        for index_data in phase_data.values():
            all_percentages.append(index_data["average_payout_percentage"])

    # Calculate Etotal as sum of all percentages divided by number of combinations (Q48 in Excel)
    etotal = sum(all_percentages) / len(all_percentages) if all_percentages else 0

    # Calculate final premium rate (Q49 in Excel = Q48/Q46)
    premium_rate = etotal / max_payout_across_years if max_payout_across_years else 0

    return {
        "etotal_percentage": float(etotal),
        "max_payout_across_years": float(max_payout_across_years),
        "premium_percentage": float(premium_rate),
    }


def calculate_premium(request: PremiumRequest) -> Dict:
    try:
        # Load historical rainfall data
        file_path = os.path.join(os.getcwd(), "files", "Battambang.xlsx")
        df = pd.read_excel(file_path, parse_dates=["Date"])
        series = df[request.commune]

        # Convert planting date
        if isinstance(request.plantingDate, str):
            planting_date = datetime.strptime(request.plantingDate, "%Y-%m-%d")
        else:
            planting_date = datetime.combine(request.plantingDate, datetime.min.time())

        # Verify commune exists in data
        if request.commune not in df.columns:
            raise ValueError(
                f"Commune '{request.commune}' not found in data. Available communes: {df.columns.tolist()}"
            )

        # Calculate year range based on weather data period
        end_year = 2023
        start_year = (
            end_year - request.weatherDataPeriod + 1
        )  # Add +1 to include the current year in the count

        # Log the analysis period
        logger.info(
            f"\nAnalyzing rainfall data from {start_year} to {end_year} ({end_year - start_year + 1} years)"
        )

        # Store results for each year
        results = []
        logger.info(f"\nAnalyzing rainfall data from {start_year} to {end_year}")

        total_payouts = []  # Store payouts for each year

        # Analyze each historical year
        for year in range(start_year, end_year + 1):
            year_results = {"year": year, "triggers": [], "total_payout": 0.0}
            year_payout = 0.0
            for phase in request.phases:
                phase_start, phase_end = get_aligned_dates(
                    planting_date, year, phase.sosStart, phase.sosEnd
                )
                phase_data = series[
                    (series["Date"] >= phase_start) & (series["Date"] <= phase_end)
                ].copy()
                for index in request.indexes:
                    if phase.phaseName not in index.phases:
                        continue

                    trigger_met, critical_value = analyze_phase_data(
                        phase_data,
                        index.consecutiveDays,
                        index.type,
                        index.trigger,
                    )

                    # Calculate payout if trigger is met
                    payout = calculate_payout(
                        trigger_met,
                        critical_value,
                        index.trigger,
                        index.unitPayout,
                        index.maxPayout,
                    )

                    year_payout += payout  # Add to year's total payout

                    result = {
                        "phase": phase.phaseName,
                        "index_type": index.type,
                        "trigger_met": bool(trigger_met),
                        "critical_value": float(critical_value),
                        "trigger_value": float(index.trigger),
                        "payout": float(payout),
                    }
                    year_results["triggers"].append(result)

                    if trigger_met:
                        logger.info(
                            f"{year} - {phase.phaseName} Phase - {index.type}:\n"
                            f"{'Maximum' if index.type == 'Excess Rainfall' else 'Minimum'} "
                            f"rainfall: {critical_value:.2f}mm "
                            f"({'>' if index.type == 'Excess Rainfall' else '<'} {index.trigger}mm)\n"
                            f"Payout: ${payout:.2f}"
                        )

            year_results["total_payout"] = float(year_payout)
            total_payouts.append(year_payout)
            results.append(year_results)

            if year_payout > 0:
                logger.info(f"Total payout for {year}: ${year_payout:.2f}")

        # Calculate average annual payout
        avg_annual_payout = sum(total_payouts) / len(total_payouts)

        # Calculate phase summaries
        phase_summaries = calculate_phase_summaries(results, request.weatherDataPeriod)

        # Calculate final premium
        premium_calculation = calculate_final_premium(results, phase_summaries)

        # Enhanced logging for premium calculation
        logger.info("\nPremium Calculation Summary:")
        logger.info(
            f"Etotal (Average Percentage): {premium_calculation['etotal_percentage']:.2f}%"
        )
        logger.info(
            f"Maximum Payout Across Years: ${premium_calculation['max_payout_across_years']:.2f}"
        )
        logger.info(
            f"Final Premium Rate: {premium_calculation['premium_percentage']:.2f}%"
        )

        # Log phase summaries
        logger.info("\nPhase-wise Summary:")
        for phase, index_data in phase_summaries.items():
            logger.info(f"\n{phase} Phase:")
            for index_type, summary in index_data.items():
                logger.info(f"\n{index_type}:")
                logger.info(f"Total Payout: ${summary['total_payout']:.2f}")
                logger.info(
                    f"Average Payout Percentage: {summary['average_payout_percentage']:.2f}%"
                )
                logger.info(f"Maximum Payout: ${summary['max_payout']:.2f}")
                logger.info(f"Minimum Payout: ${summary['min_payout']:.2f}")

        return {
            "status": "success",
            "premium": {
                "rate": float(premium_calculation["premium_percentage"]),
                "etotal": float(premium_calculation["etotal_percentage"]),
                "max_payout": float(premium_calculation["max_payout_across_years"]),
            },
            "phase_analysis": {
                phase: {
                    "indexes": {
                        index_type: {
                            "average_payout_percentage": summary[
                                "average_payout_percentage"
                            ],
                            "total_payout": summary["total_payout"],
                            "max_payout": summary["max_payout"],
                            "min_payout": summary["min_payout"],
                        }
                        for index_type, summary in index_data.items()
                    },
                    "total_contribution": sum(
                        summary["average_payout_percentage"]
                        for summary in index_data.values()
                    ),
                }
                for phase, index_data in phase_summaries.items()
            },
            "risk_metrics": {
                "years_analyzed": len(total_payouts),
                "payout_years": len([p for p in total_payouts if p > 0]),
                "payout_probability": len([p for p in total_payouts if p > 0])
                / len(total_payouts)
                * 100,
                "average_annual_payout": float(avg_annual_payout),
                "max_annual_payout": float(max(total_payouts)),
                "min_annual_payout": float(min(total_payouts)),
            },
            "yearly_analysis": [
                {
                    "year": result["year"],
                    "total_payout": result["total_payout"],
                    "triggers": [
                        {
                            "phase": trigger["phase"],
                            "index_type": trigger["index_type"],
                            "rainfall": trigger["critical_value"],
                            "trigger_value": trigger["trigger_value"],
                            "payout": trigger["payout"],
                        }
                        for trigger in result["triggers"]
                        if trigger["trigger_met"]
                    ],
                }
                for result in results
                if any(trigger["trigger_met"] for trigger in result["triggers"])
            ],
        }

    except Exception as e:
        logger.error(f"Error in premium calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

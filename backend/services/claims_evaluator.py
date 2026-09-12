"""
Claims payout evaluation for a single season window.

Weather must come from GEE (via claims_weather). Payout math mirrors
InsureSmart rolling-window logic for LRI/ERI/LTI/HTI. When LRI includes
exit_trigger and duration covers the full period, uses aggregate rainfall
(sold InsureSmart LRI framing).
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from schemas.claims_schema import ClaimEvaluateRequest, ClaimPeriod, ClaimPeril
from services.claims_weather import (
    PRECIP_PERILS,
    TEMP_PERILS,
    compact_daily_series,
    datasets_for_perils,
    fetch_claims_weather,
)


def _parse_date(value: str) -> datetime:
    return datetime.strptime(value[:10], "%Y-%m-%d")


def resolve_period_dates(
    period: ClaimPeriod,
    planting_date: Optional[str],
    evaluation_start: str,
    evaluation_end: str,
    day_index_mode: str = "day_of_year",
) -> Tuple[datetime, datetime]:
    """
    Resolve a period to absolute calendar dates.

    Priority:
    1. Absolute startDate/endDate on the period (from coveragePeriods)
    2. start_day/end_day interpreted by day_index_mode:
       - day_of_year (InsureSmart): 0-indexed DOY from Jan 1 of the season year
       - planting_offset (Manual Builder): days after planting_date
    3. Full evaluation window
    """
    if period.startDate and period.endDate:
        return _parse_date(period.startDate), _parse_date(period.endDate)

    if period.start_day is not None and period.end_day is not None:
        start_day = int(period.start_day)
        end_day = int(period.end_day)

        if day_index_mode == "planting_offset":
            base = (
                _parse_date(planting_date)
                if planting_date
                else _parse_date(evaluation_start)
            )
            return base + timedelta(days=start_day), base + timedelta(days=end_day)

        # InsureSmart default: day-of-year (matches insure_smart_premium_calc)
        year = _parse_date(evaluation_start).year
        if planting_date:
            year = _parse_date(planting_date).year
        start = datetime(year, 1, 1) + timedelta(days=start_day)
        end = datetime(year, 1, 1) + timedelta(days=end_day)
        return start, end

    # Fall back to full evaluation window
    return _parse_date(evaluation_start), _parse_date(evaluation_end)


def _slice_series(
    df: pd.DataFrame, start: datetime, end: datetime
) -> pd.Series:
    mask = (df["Date"] >= start) & (df["Date"] <= end)
    return df.loc[mask, "value"].astype(float)


def _evaluate_peril_on_series(
    values: pd.Series,
    peril: ClaimPeril,
    period_start: datetime,
    period_end: datetime,
    scale: float,
) -> Dict[str, Any]:
    """
    Evaluate one peril against a daily series for a single period.

    Method selection:
    - LRI with exit_trigger (or exit) and duration >= period length → aggregate
    - Otherwise → rolling window (sum for rain, mean for temp) like premium calc
    """
    unit_payout = float(peril.unit_payout) * scale
    max_payout = float(peril.max_payout) * scale
    allocated_si = (
        float(peril.allocated_si) * scale
        if peril.allocated_si is not None
        else max_payout
    )
    duration = int(peril.consecutiveDays or peril.duration)
    period_length = max(1, (period_end - period_start).days + 1)

    exit_level = peril.exit_trigger if peril.exit_trigger is not None else peril.exit
    use_aggregate_lri = (
        peril.peril_type == "LRI"
        and exit_level is not None
        and duration >= period_length
    )

    if values.empty or (not use_aggregate_lri and len(values) < duration):
        return {
            "peril_type": peril.peril_type,
            "trigger": peril.trigger,
            "duration": duration,
            "unit_payout": unit_payout,
            "max_payout": max_payout,
            "allocated_si": allocated_si,
            "method": "aggregate" if use_aggregate_lri else "rolling",
            "trigger_met": False,
            "payout": 0.0,
            "actual_value": None,
            "insufficient_data": True,
            "observations": int(len(values)),
        }

    arr = values.values.astype(float)

    if use_aggregate_lri:
        actual = float(np.nansum(arr))
        trigger = float(peril.trigger)
        exit_v = float(exit_level)
        # Aggregate LRI: payout when rainfall below trigger; full SI at/below exit
        trigger_met = actual < trigger
        if not trigger_met:
            payout = 0.0
        elif actual <= exit_v:
            payout = min(max_payout, allocated_si)
        else:
            gap = trigger - exit_v
            if gap <= 0:
                payout = min(max_payout, allocated_si) if trigger_met else 0.0
            else:
                payout = min((trigger - actual) / gap * allocated_si, max_payout, allocated_si)
        method = "aggregate"
    else:
        method = "rolling"
        if peril.peril_type in ("LRI", "ERI"):
            rolling = np.convolve(arr, np.ones(duration), mode="valid")
            if peril.peril_type == "LRI":
                actual = float(rolling.min())
                trigger_met = actual < peril.trigger
                payout = (
                    min((peril.trigger - actual) * unit_payout, max_payout, allocated_si)
                    if trigger_met
                    else 0.0
                )
            else:
                actual = float(rolling.max())
                trigger_met = actual > peril.trigger
                payout = (
                    min((actual - peril.trigger) * unit_payout, max_payout, allocated_si)
                    if trigger_met
                    else 0.0
                )
        else:
            rolling = np.convolve(arr, np.ones(duration) / duration, mode="valid")
            if peril.peril_type == "LTI":
                actual = float(rolling.min())
                trigger_met = actual < peril.trigger
                payout = (
                    min((peril.trigger - actual) * unit_payout, max_payout, allocated_si)
                    if trigger_met
                    else 0.0
                )
            else:  # HTI
                actual = float(rolling.max())
                trigger_met = actual > peril.trigger
                payout = (
                    min((actual - peril.trigger) * unit_payout, max_payout, allocated_si)
                    if trigger_met
                    else 0.0
                )

    return {
        "peril_type": peril.peril_type,
        "trigger": peril.trigger,
        "duration": duration,
        "unit_payout": unit_payout,
        "max_payout": max_payout,
        "allocated_si": allocated_si,
        "method": method,
        "trigger_met": bool(trigger_met),
        "payout": round(float(payout), 2),
        "actual_value": None if actual is None else round(float(actual), 4),
        "insufficient_data": False,
        "observations": int(len(values)),
        "exit_trigger": exit_level,
    }


def evaluate_claim(request_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full claims evaluation: GEE weather + payout engine.

    request_dict: serialized ClaimEvaluateRequest
    """
    request = ClaimEvaluateRequest(**request_dict)
    loc = request.location

    peril_types = {
        p.peril_type for period in request.termsheet.periods for p in period.perils
    }
    datasets = datasets_for_perils(peril_types)
    if not datasets:
        raise ValueError("Termsheet has no recognized peril types requiring weather data")

    # Expand fetch window to cover all resolved periods
    day_index_mode = request.termsheet.dayIndexMode or "day_of_year"
    coverage_periods = request.termsheet.coveragePeriods or []

    fetch_start = _parse_date(request.evaluation_start)
    fetch_end = _parse_date(request.evaluation_end)
    resolved_periods: List[Tuple[ClaimPeriod, datetime, datetime]] = []
    for idx, period in enumerate(request.termsheet.periods):
        # Backfill absolute dates from coveragePeriods when missing
        if (not period.startDate or not period.endDate) and idx < len(coverage_periods):
            cp = coverage_periods[idx] or {}
            if cp.get("startDate") and cp.get("endDate"):
                period = period.copy(
                    update={
                        "startDate": str(cp["startDate"])[:10],
                        "endDate": str(cp["endDate"])[:10],
                    }
                )
        p_start, p_end = resolve_period_dates(
            period,
            request.termsheet.plantingDate,
            request.evaluation_start,
            request.evaluation_end,
            day_index_mode=day_index_mode,
        )
        resolved_periods.append((period, p_start, p_end))
        if p_start < fetch_start:
            fetch_start = p_start
        if p_end > fetch_end:
            fetch_end = p_end

    series_by_dataset, weather_meta = fetch_claims_weather(
        country=loc.country,
        province=loc.province,
        district=loc.district,
        commune=loc.commune,
        date_start=fetch_start.strftime("%Y-%m-%d"),
        date_end=fetch_end.strftime("%Y-%m-%d"),
        datasets=datasets,
    )

    scale = float(request.sum_insured_scale)
    sum_insured_cap = float(request.termsheet.sumInsured) * scale

    peril_breakdown: List[Dict[str, Any]] = []
    total_payout = 0.0
    primary_trigger_value: Optional[float] = None
    primary_window: Optional[str] = None

    for idx, (period, p_start, p_end) in enumerate(resolved_periods):
        period_entry: Dict[str, Any] = {
            "period_index": idx,
            "start_date": p_start.strftime("%Y-%m-%d"),
            "end_date": p_end.strftime("%Y-%m-%d"),
            "start_day": period.start_day,
            "end_day": period.end_day,
            "perils": [],
            "period_payout": 0.0,
        }
        for peril in period.perils:
            dataset = "precipitation" if peril.peril_type in PRECIP_PERILS else "temperature"
            if dataset not in series_by_dataset:
                raise ValueError(f"Missing weather dataset '{dataset}' for {peril.peril_type}")
            values = _slice_series(series_by_dataset[dataset], p_start, p_end)
            result = _evaluate_peril_on_series(values, peril, p_start, p_end, scale)
            period_entry["perils"].append(result)
            period_entry["period_payout"] += result["payout"]
            if result["trigger_met"] and primary_trigger_value is None:
                primary_trigger_value = result["actual_value"]
                primary_window = f"{period_entry['start_date']} to {period_entry['end_date']} ({peril.peril_type})"
        period_entry["period_payout"] = round(period_entry["period_payout"], 2)
        total_payout += period_entry["period_payout"]
        peril_breakdown.append(period_entry)

    capped_payout = round(min(total_payout, sum_insured_cap), 2)
    triggered = capped_payout > 0

    if primary_window is None:
        primary_window = f"{request.evaluation_start} to {request.evaluation_end}"

    weather_snapshot = {
        **weather_meta,
        "daily": compact_daily_series(series_by_dataset),
    }

    termsheet_snapshot = {
        "termsheet": request.termsheet.dict(),
        "meta": {
            "source": request.source,
            "enrollment_id": request.enrollment_id,
            "product_id": request.product_id,
            "location": loc.dict(),
            "evaluation_start": request.evaluation_start,
            "evaluation_end": request.evaluation_end,
            "sum_insured_scale": scale,
            "sum_insured_cap": sum_insured_cap,
        },
        "weather_snapshot": weather_snapshot,
    }

    return {
        "triggered": triggered,
        "payout": capped_payout,
        "uncapped_payout": round(total_payout, 2),
        "trigger_window": primary_window,
        "trigger_value": primary_trigger_value,
        "peril_breakdown": peril_breakdown,
        "weather_snapshot": weather_snapshot,
        "termsheet_snapshot": termsheet_snapshot,
        "data_available_through": {
            ds: weather_meta["series_summary"][ds]["last_date"]
            for ds in weather_meta["series_summary"]
        },
    }

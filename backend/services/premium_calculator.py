import os
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
    type_mapping = {
        "Excess Rainfall": "ERI",
        "Drought": "LRI"
    }
    return type_mapping.get(frontend_type, frontend_type)

def get_aligned_dates(base_date: datetime, year: int, sos_start: int, sos_end: int) -> tuple:
    """Get the start and end dates aligned to the historical year"""
    historical_date = base_date.replace(year=year)
    start_date = historical_date + timedelta(days=sos_start)
    end_date = historical_date + timedelta(days=sos_end)
    return start_date, end_date

def analyze_phase_data(
    df: pd.DataFrame,
    commune: str,
    start_date: datetime,
    end_date: datetime,
    consecutive_days: int,
    index_type: str,
    trigger: float
) -> tuple[bool, float]:
    """Analyze rainfall data for a specific phase period"""
    
    # Get data for the phase period
    phase_data = df[
        (df['Date'] >= start_date) & 
        (df['Date'] <= end_date)
    ].copy()
    
    if len(phase_data) < consecutive_days:
        return False, 0.0
    
    # Calculate cumulative rainfall for each consecutive period
    cumulative_values = []
    for i in range(len(phase_data) - consecutive_days + 1):
        period = phase_data.iloc[i:i + consecutive_days]
        period_sum = float(period[commune].sum())
        cumulative_values.append(period_sum)
    
    if not cumulative_values:
        return False, 0.0
    
    # For LRI (Drought), find minimum cumulative rainfall
    # For ERI (Excess Rainfall), find maximum cumulative rainfall
    mapped_type = map_index_type(index_type)
    if mapped_type == "LRI":
        critical_value = float(min(cumulative_values))
        trigger_met = bool(critical_value < trigger)
    else:  # ERI
        critical_value = float(max(cumulative_values))
        trigger_met = bool(critical_value > trigger)
    
    return trigger_met, critical_value

def calculate_premium(request: PremiumRequest) -> Dict:
    try:
        # Load historical rainfall data
        file_path = os.path.join(os.getcwd(), "files", "Battambang.xlsx")
        df = pd.read_excel(file_path, parse_dates=['Date'])
        
        # Convert planting date
        if isinstance(request.plantingDate, str):
            planting_date = datetime.strptime(request.plantingDate, "%Y-%m-%d")
        else:
            planting_date = datetime.combine(request.plantingDate, datetime.min.time())
        
        # Verify commune exists in data
        if request.commune not in df.columns:
            raise ValueError(f"Commune '{request.commune}' not found in data. Available communes: {df.columns.tolist()}")
        
        # Calculate year range based on weather data period
        end_year = 2023
        start_year = end_year - request.weatherDataPeriod
        
        # Store results for each year
        results = []
        logger.info(f"\nAnalyzing rainfall data from {start_year} to {end_year}")
        
        # Analyze each historical year
        for year in range(start_year, end_year + 1):
            year_results = {"year": year, "triggers": []}
            
            # Process each index
            for index in request.indexes:
                # Get selected phases for this index
                selected_phases = [phase for phase in request.phases 
                                 if phase.phaseName in index.phases]
                
                # Process each selected phase for this index
                for phase in selected_phases:
                    # Get date range for this phase in the historical year
                    phase_start, phase_end = get_aligned_dates(
                        planting_date, year, phase.sosStart, phase.sosEnd
                    )
                    
                    trigger_met, critical_value = analyze_phase_data(
                        df,
                        request.commune,
                        phase_start,
                        phase_end,
                        index.consecutiveDays,
                        index.type,
                        index.trigger
                    )
                    
                    result = {
                        "phase": phase.phaseName,
                        "index_type": index.type,
                        "trigger_met": bool(trigger_met),
                        "critical_value": float(critical_value),
                        "trigger_value": float(index.trigger)
                    }
                    year_results["triggers"].append(result)
                    
                    if trigger_met:
                        logger.info(
                            f"{year} - {phase.phaseName} Phase - {index.type}:\n"
                            f"{'Maximum' if index.type == 'Excess Rainfall' else 'Minimum'} "
                            f"rainfall: {critical_value:.2f}mm "
                            f"({'>' if index.type == 'Excess Rainfall' else '<'} {index.trigger}mm)"
                        )
            
            results.append(year_results)
        
        return {
            "message": "Analysis completed",
            "status": "success",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error in premium calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 
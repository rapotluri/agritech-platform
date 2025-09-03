import optuna
import numpy as np
from typing import List, Dict, Any, Tuple
from services.insure_smart_premium_calc import calculate_insure_smart_premium, clear_weather_data_cache
import concurrent.futures
import threading

def optimize_insure_smart(request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Optimize Insure Smart product using Optuna with 3 different optimization strategies.
    
    Args:
        request_data: Dict containing:
            - product: Dict with commune, province, sumInsured, premiumCap, dataType
            - periods: List[Dict] with startDate, endDate, perilType
    
    Returns:
        List of 3 best configurations: Most Affordable, Best Coverage, Premium Choice
    """
    # Extract data from frontend format
    product = request_data["product"]
    periods_data = request_data["periods"]
    
    commune = product["commune"]
    province = product["province"]
    sum_insured = float(product["sumInsured"])
    user_premium_cap = float(product["premiumCap"])
    data_type = product.get("dataType", "precipitation")  # Extract data_type from product
    
    # Convert periods to optimizer format
    periods = convert_periods_format(periods_data)
    
    # Validate input
    if not periods:
        return [{"error": "No coverage periods specified"}]
    
    # Calculate premium cap ranges
    user_premium_ratio = user_premium_cap / sum_insured
    
    # Most Affordable: 2% to (user_cap - 0.5%)
    most_affordable_min = 0.02
    most_affordable_max = max(0.02, user_premium_ratio - 0.005)
    
    # Best Coverage: Fixed at user's cap
    best_coverage_cap = user_premium_cap
    
    # Premium Choice: (user_cap + 0.5%) to 15%
    premium_choice_min = user_premium_ratio + 0.005
    premium_choice_max = 0.15
    
    # Ensure valid ranges
    if most_affordable_max <= most_affordable_min:
        most_affordable_max = most_affordable_min + 0.01  # Add small range if needed
    
    if premium_choice_min >= premium_choice_max:
        premium_choice_min = premium_choice_max - 0.01  # Reduce range if needed
    
    # Run 3 optimizations in parallel
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        # Submit all 3 optimization tasks
        future_most_affordable = executor.submit(
            run_optimization, 
            "most_affordable", 
            commune, 
            province, 
            periods, 
            sum_insured, 
            most_affordable_min, 
            most_affordable_max,
            user_premium_cap,
            data_type
        )
        
        future_best_coverage = executor.submit(
            run_optimization, 
            "best_coverage", 
            commune, 
            province, 
            periods, 
            sum_insured, 
            best_coverage_cap, 
            best_coverage_cap,
            user_premium_cap,
            data_type
        )
        
        future_premium_choice = executor.submit(
            run_optimization, 
            "premium_choice", 
            commune, 
            province, 
            periods, 
            sum_insured, 
            premium_choice_min, 
            premium_choice_max,
            user_premium_cap,
            data_type
        )
        
        # Collect results
        try:
            most_affordable_result = future_most_affordable.result(timeout=300)  # 5 minute timeout
            if most_affordable_result:
                results.append(most_affordable_result)
        except Exception as e:
            print(f"Most Affordable optimization failed: {str(e)}")
        
        try:
            best_coverage_result = future_best_coverage.result(timeout=300)
            if best_coverage_result:
                results.append(best_coverage_result)
        except Exception as e:
            print(f"Best Coverage optimization failed: {str(e)}")
        
        try:
            premium_choice_result = future_premium_choice.result(timeout=300)
            if premium_choice_result:
                results.append(premium_choice_result)
        except Exception as e:
            print(f"Premium Choice optimization failed: {str(e)}")
    
    # Clear weather data cache to free up memory
    clear_weather_data_cache()
    
    # If no results, return error
    if not results:
        return [{"error": "No valid configurations found within constraints"}]
    
    return results

def run_optimization(option_type: str, commune: str, province: str, periods: List[Dict], 
                    sum_insured: float, min_premium_cap: float, max_premium_cap: float, user_premium_cap: float = None, data_type: str = "precipitation") -> Dict[str, Any]:
    """
    Run a single optimization with specified premium cap range.
    """
    # Create optimization study
    study = optuna.create_study(
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=42),
        pruner=optuna.pruners.MedianPruner()
    )
    
    # Define objective function
    def objective(trial):
        try:
            # For Most Affordable and Premium Choice, optimize premium cap
            if option_type in ["most_affordable", "premium_choice"]:
                # Use discrete values for premium_cap_ratio to ensure 4 decimal places
                # Create options from min to max in 0.001 steps (0.1% increments)
                step_size = 0.001
                num_steps = int((max_premium_cap - min_premium_cap) / step_size) + 1
                premium_cap_options = [round(min_premium_cap + i * step_size, 4) for i in range(num_steps)]
                premium_cap_options = [x for x in premium_cap_options if x <= max_premium_cap]
                premium_cap_ratio = trial.suggest_categorical("premium_cap_ratio", premium_cap_options)
                premium_cap = round(sum_insured * premium_cap_ratio, 2)
            else:
                # Best Coverage uses fixed premium cap
                premium_cap = min_premium_cap
            
            # Generate trial configuration
            trial_periods = generate_trial_configuration(trial, periods, sum_insured, data_type)
            
            # Calculate premium and metrics
            result = calculate_insure_smart_premium(
                commune=commune,
                province=province,
                periods=trial_periods,
                sum_insured=sum_insured,
                data_type=data_type,
                admin_loading=0.15,
                profit_loading=0.075
            )
            
            # Check premium cap constraint
            loaded_premium_cost = round(result["loaded_premium"], 2)
            if loaded_premium_cost > premium_cap:
                return -float('inf')  # Exceeds premium cap
            
            # Check payout frequency constraint to prevent over-optimization
            payout_years = result["payout_years"]
            if payout_years > 25:  # Allow up to 25 payout years out of 30
                return -float('inf')  # Too many payouts
            
            # Use the same composite scoring function for all options
            score = round(calculate_composite_score(result, loaded_premium_cost, sum_insured, result["loss_ratio"]), 4)
            
            return score
            
        except Exception as e:
            return -float('inf')
    
    # Run optimization
    study.optimize(objective, n_trials=200, n_jobs=1)  # Single job for threading compatibility
    
    # Extract best configuration
    if study.best_trial.value == -float('inf'):
        return None
    
    # Reconstruct the configuration
    trial_periods = reconstruct_configuration(study.best_trial, periods, sum_insured, data_type)
    
    # Recalculate metrics for this configuration
    result = calculate_insure_smart_premium(
        commune=commune,
        province=province,
        periods=trial_periods,
        sum_insured=sum_insured,
        data_type=data_type,
        admin_loading=0.15,
        profit_loading=0.075
    )
    
    # Format the result with consistent precision
    config = {
        "optionType": option_type,
        "label": get_option_label(option_type),
        "description": get_option_description(option_type),
        "lossRatio": round(result["loss_ratio"], 4),
        "expectedPayout": round(result["avg_payout"], 2),
        "premiumRate": round(result["premium_rate"], 4),
        "premiumCost": round(result["loaded_premium"], 2),
        "triggers": format_triggers_for_frontend(trial_periods, periods, data_type),
        "riskLevel": determine_risk_level(result["loss_ratio"]),
        "score": round(study.best_trial.value, 4),
        "periods": format_periods_for_output(trial_periods, periods),
        "period_breakdown": result.get("period_breakdown", []),
        "yearly_results": result.get("yearly_results", []),
        "max_payout": round(result.get("max_payout", 0), 2),
        "payout_years": result.get("payout_years"),
        "coverage_score": round(result.get("coverage_score", 0), 4),
        "payout_stability_score": round(result.get("payout_stability_score", 0), 4),
        "coverage_penalty": round(result.get("coverage_penalty", 0), 4),
        "periods_with_no_payouts": result.get("periods_with_no_payouts", 0)
    }
    
    # Add premium increase info for Premium Choice
    if option_type == "premium_choice" and user_premium_cap is not None:
        premium_increase = round(result["loaded_premium"], 2) - user_premium_cap
        config["premiumIncrease"] = f"+${premium_increase:.0f} ({(round(result['loaded_premium'], 2) / sum_insured * 100):.1f}% vs {(user_premium_cap / sum_insured * 100):.1f}%)"
    
    return to_python_type(config)

def get_option_label(option_type: str) -> str:
    """Get user-friendly label for option type."""
    labels = {
        "most_affordable": "Most Affordable",
        "best_coverage": "Best Coverage", 
        "premium_choice": "Premium Choice"
    }
    return labels.get(option_type, option_type)

def get_option_description(option_type: str) -> str:
    """Get description for option type."""
    descriptions = {
        "most_affordable": "Optimized for lowest cost within your budget",
        "best_coverage": "Balanced optimization for best overall value",
        "premium_choice": "Enhanced coverage with slightly higher premium"
    }
    return descriptions.get(option_type, "")

def convert_periods_format(periods_data: List[Dict]) -> List[Dict]:
    """
    Convert frontend periods format to optimizer format.
    Frontend: [{"startDate": Date, "endDate": Date, "perilType": "LRI|ERI|Both|LTI|HTI"}]
    Optimizer: [{"start_day": int, "end_day": int, "perils": [{"type": "LRI|ERI|LTI|HTI"}]}]
    """
    from datetime import datetime
    
    converted_periods = []
    
    for period in periods_data:
        # Convert dates to day-of-year
        start_date = period["startDate"]
        end_date = period["endDate"]
        
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        start_day = start_date.timetuple().tm_yday - 1  # 0-indexed
        end_day = end_date.timetuple().tm_yday - 1
        
        # Convert peril type to perils array
        peril_type = period["perilType"]
        perils = []
        
        if peril_type == "LRI":
            perils.append({"type": "LRI"})
        elif peril_type == "ERI":
            perils.append({"type": "ERI"})
        elif peril_type == "LTI":
            perils.append({"type": "LTI"})
        elif peril_type == "HTI":
            perils.append({"type": "HTI"})
        elif peril_type == "Both":
            # For "Both", we need to determine which perils to add based on context
            # This will be handled by the frontend based on data type
            # For now, default to LRI/ERI for backward compatibility
            perils.append({"type": "LRI"})
            perils.append({"type": "ERI"})
        
        converted_periods.append({
            "start_day": start_day,
            "end_day": end_day,
            "perils": perils
        })
    
    return converted_periods

def generate_trial_configuration(trial: optuna.Trial, base_periods: List[Dict], sum_insured: float, data_type: str = "precipitation") -> List[Dict]:
    """
    Generate a trial configuration by sampling parameters for each period and peril.
    SI is split between indexes (LRI, ERI) using a discrete set (40/60, 50/50, 60/40) for two indexes. If an index has multiple periods, split its SI allocation equally among its periods.
    max_payout for each period/peril is set to its SI allocation. Only trigger, duration, and unit_payout are optimized.
    """
    # First, determine which indexes are present and how many periods each has
    index_periods = {}
    for period in base_periods:
        for peril in period.get("perils", []):
            idx = peril["type"]
            if idx not in index_periods:
                index_periods[idx] = []
            index_periods[idx].append(period)
    
    indexes = list(index_periods.keys())
    n_indexes = len(indexes)
    
    # SI split logic
    si_split = {}
    if n_indexes == 1:
        si_split[indexes[0]] = 1.0
    elif n_indexes == 2:
        # Sample split for LRI/ERI or LTI/HTI from discrete set
        split_options = [0.4, 0.5, 0.6]
        lri_split = trial.suggest_categorical("lri_si_split", split_options)
        eri_split = 1.0 - lri_split
        # Assign splits based on which index is LRI/ERI or LTI/HTI
        if "LRI" in indexes and "ERI" in indexes:
            si_split["LRI"] = lri_split
            si_split["ERI"] = eri_split
        elif "LTI" in indexes and "HTI" in indexes:
            si_split["LTI"] = lri_split
            si_split["HTI"] = eri_split
        else:
            # If not standard, assign first index split, second gets remainder
            si_split[indexes[0]] = lri_split
            si_split[indexes[1]] = eri_split
    else:
        # If more than 2, split equally
        for idx in indexes:
            si_split[idx] = 1.0 / n_indexes
    
    # For each index, split its SI allocation equally among its periods
    index_period_count = {idx: len(index_periods[idx]) for idx in indexes}
    index_period_si = {idx: (sum_insured * si_split[idx]) / index_period_count[idx] for idx in indexes}
    
    trial_periods = []
    for period_idx, base_period in enumerate(base_periods):
        perils = base_period.get("perils", [])
        for peril_idx, peril in enumerate(perils):
            peril_type = peril["type"]
            # SI allocation for this period/peril
            allocated_si = index_period_si[peril_type]
            # Optimize trigger, duration, unit_payout
            if peril_type == "LRI":
                trigger = trial.suggest_int(f"lri_trigger_{period_idx}_{peril_idx}", 20, 150)
                duration = trial.suggest_int(f"lri_duration_{period_idx}_{peril_idx}", 5, 30)
                # Use discrete values for unit_payout to ensure 2 decimal places
                unit_payout_options = [round(x * 0.05, 2) for x in range(10, 61)]  # 0.50 to 3.00 in 0.05 steps
                unit_payout = trial.suggest_categorical(f"lri_unit_payout_{period_idx}_{peril_idx}", unit_payout_options)
            elif peril_type == "ERI":
                trigger = trial.suggest_int(f"eri_trigger_{period_idx}_{peril_idx}", 40, 200)
                duration = trial.suggest_int(f"eri_duration_{period_idx}_{peril_idx}", 1, 5)
                # Use discrete values for unit_payout to ensure 2 decimal places
                unit_payout_options = [round(x * 0.05, 2) for x in range(10, 61)]  # 0.50 to 3.00 in 0.05 steps
                unit_payout = trial.suggest_categorical(f"eri_unit_payout_{period_idx}_{peril_idx}", unit_payout_options)
            elif peril_type == "LTI":
                trigger = trial.suggest_int(f"lti_trigger_{period_idx}_{peril_idx}", 20, 30)
                duration = trial.suggest_int(f"lti_duration_{period_idx}_{peril_idx}", 1, 7)
                # Use discrete values for unit_payout to ensure 2 decimal places
                unit_payout_options = [round(x * 0.05, 2) for x in range(10, 61)]  # 0.50 to 3.00 in 0.05 steps
                unit_payout = trial.suggest_categorical(f"lti_unit_payout_{period_idx}_{peril_idx}", unit_payout_options)
            elif peril_type == "HTI":
                trigger = trial.suggest_int(f"hti_trigger_{period_idx}_{peril_idx}", 30, 40)
                duration = trial.suggest_int(f"hti_duration_{period_idx}_{peril_idx}", 1, 10)
                # Use discrete values for unit_payout to ensure 2 decimal places
                unit_payout_options = [round(x * 0.05, 2) for x in range(10, 61)]  # 0.50 to 3.00 in 0.05 steps
                unit_payout = trial.suggest_categorical(f"hti_unit_payout_{period_idx}_{peril_idx}", unit_payout_options)
            # max_payout is set to allocated_si
            max_payout = round(allocated_si, 2)
            trial_periods.append({
                "peril_type": peril_type,
                "trigger": trigger,
                "duration": duration,
                "unit_payout": unit_payout,
                "max_payout": max_payout,
                "allocated_si": allocated_si,
                "start_day": base_period.get("start_day", 0),
                "end_day": base_period.get("end_day", 364)
            })
    return trial_periods

def calculate_composite_score(result: Dict[str, Any], loaded_premium_cost: float, sum_insured: float, loss_ratio: float) -> float:
    """
    Calculate composite score based on the scoring function, using loaded premium and SI utilization.
    Now includes coverage penalty to heavily penalize configurations with low-coverage periods.
    """
    # Premium utilization score (how close to premium cap)
    premium_utilization_score = min(loaded_premium_cost / (loaded_premium_cost + 1), 1.0)  # Normalized
    
    # SI utilization score (how effectively sum insured is used)
    max_payout = result.get("max_payout", 0)
    si_utilization_score = max_payout / sum_insured if sum_insured > 0 else 0.0
    
    # Payout stability score
    payout_stability_score = result["payout_stability_score"]
    
    # Coverage score
    coverage_score = result["coverage_score"]
    
    # Coverage penalty - heavily penalize configurations with periods that never trigger
    coverage_penalty = result.get("coverage_penalty", 0)
    
    # Composite score with strong coverage penalty
    composite_score = (
        0.4 * premium_utilization_score +
        0.3 * si_utilization_score +
        0.2 * payout_stability_score +
        0.1 * coverage_score -
        0.5 * coverage_penalty  # Heavy penalty for low coverage
    )
    
    return round(composite_score, 4)

def to_python_type(obj):
    if isinstance(obj, dict):
        return {k: to_python_type(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_python_type(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    else:
        return obj



def reconstruct_configuration(trial: optuna.Trial, base_periods: List[Dict], sum_insured: float, data_type: str = "precipitation") -> List[Dict]:
    """
    Reconstruct the full configuration from a trial.
    Uses the same SI split and allocation logic as generate_trial_configuration.
    """
    # Determine which indexes are present and how many periods each has
    index_periods = {}
    for period in base_periods:
        for peril in period.get("perils", []):
            idx = peril["type"]
            if idx not in index_periods:
                index_periods[idx] = []
            index_periods[idx].append(period)
    indexes = list(index_periods.keys())
    n_indexes = len(indexes)
    # SI split logic (must match generate_trial_configuration)
    si_split = {}
    if n_indexes == 1:
        si_split[indexes[0]] = 1.0
    elif n_indexes == 2:
        split_options = [0.4, 0.5, 0.6]
        lri_split = trial.params["lri_si_split"]
        eri_split = 1.0 - lri_split
        if "LRI" in indexes and "ERI" in indexes:
            si_split["LRI"] = lri_split
            si_split["ERI"] = eri_split
        elif "LTI" in indexes and "HTI" in indexes:
            si_split["LTI"] = lri_split
            si_split["HTI"] = eri_split
        else:
            si_split[indexes[0]] = lri_split
            si_split[indexes[1]] = eri_split
    else:
        for idx in indexes:
            si_split[idx] = 1.0 / n_indexes
    index_period_count = {idx: len(index_periods[idx]) for idx in indexes}
    index_period_si = {idx: (sum_insured * si_split[idx]) / index_period_count[idx] for idx in indexes}
    trial_periods = []
    for period_idx, base_period in enumerate(base_periods):
        perils = base_period.get("perils", [])
        for peril_idx, peril in enumerate(perils):
            peril_type = peril["type"]
            allocated_si = index_period_si[peril_type]
            if peril_type == "LRI":
                trigger = int(trial.params[f"lri_trigger_{period_idx}_{peril_idx}"])
                duration = int(trial.params[f"lri_duration_{period_idx}_{peril_idx}"])
                unit_payout = float(trial.params[f"lri_unit_payout_{period_idx}_{peril_idx}"])  # Already rounded from categorical
            elif peril_type == "ERI":
                trigger = int(trial.params[f"eri_trigger_{period_idx}_{peril_idx}"])
                duration = int(trial.params[f"eri_duration_{period_idx}_{peril_idx}"])
                unit_payout = float(trial.params[f"eri_unit_payout_{period_idx}_{peril_idx}"])  # Already rounded from categorical
            elif peril_type == "LTI":
                trigger = int(trial.params[f"lti_trigger_{period_idx}_{peril_idx}"])
                duration = int(trial.params[f"lti_duration_{period_idx}_{peril_idx}"])
                unit_payout = float(trial.params[f"lti_unit_payout_{period_idx}_{peril_idx}"])  # Already rounded from categorical
            elif peril_type == "HTI":
                trigger = int(trial.params[f"hti_trigger_{period_idx}_{peril_idx}"])
                duration = int(trial.params[f"hti_duration_{period_idx}_{peril_idx}"])
                unit_payout = float(trial.params[f"hti_unit_payout_{period_idx}_{peril_idx}"])  # Already rounded from categorical
            max_payout = round(allocated_si, 2)
            trial_periods.append({
                "peril_type": peril_type,
                "trigger": trigger,
                "duration": duration,
                "unit_payout": unit_payout,
                "max_payout": max_payout,
                "allocated_si": allocated_si,
                "start_day": base_period.get("start_day", 0),
                "end_day": base_period.get("end_day", 364)
            })
    return trial_periods

def format_periods_for_output(trial_periods: List[Dict], base_periods: List[Dict]) -> List[Dict]:
    """
    Format periods for output, grouping perils by period.
    """
    output_periods = []
    period_idx = 0
    
    for base_period in base_periods:
        perils = base_period.get("perils", [])
        period_perils = []
        
        for peril in perils:
            # Find matching peril in trial_periods
            for trial_peril in trial_periods:
                if (trial_peril["peril_type"] == peril["type"] and
                    trial_peril.get("start_day", 0) == base_period.get("start_day", 0) and
                    trial_peril.get("end_day", 364) == base_period.get("end_day", 364)):
                    
                    period_perils.append({
                        "peril_type": trial_peril["peril_type"],
                        "trigger": int(trial_peril["trigger"]),
                        "duration": int(trial_peril["duration"]),
                        "unit_payout": round(trial_peril["unit_payout"], 2),
                        "max_payout": round(trial_peril["max_payout"], 2),
                        "allocated_si": round(trial_peril["allocated_si"], 2)
                    })
                    break
        
        if period_perils:
            output_periods.append({
                "period_name": f"Period {period_idx + 1}",
                "start_day": base_period.get("start_day", 0),
                "end_day": base_period.get("end_day", 364),
                "perils": period_perils
            })
            period_idx += 1
    
    return output_periods

def format_triggers_for_frontend(trial_periods: List[Dict], base_periods: List[Dict], data_type: str = "precipitation") -> List[Dict]:
    """
    Format triggers for frontend display.
    """
    triggers = []
    
    for trial_peril in trial_periods:
        peril_type = trial_peril["peril_type"]
        trigger = trial_peril["trigger"]
        max_payout = trial_peril["max_payout"]
        
        if peril_type == "LRI":
            triggers.append({
                "type": "Low Rainfall",
                "value": f"≤ {int(trigger)}mm",
                "payout": f"${round(max_payout, 2):.2f}"
            })
        elif peril_type == "ERI":
            triggers.append({
                "type": "High Rainfall", 
                "value": f"≥ {int(trigger)}mm",
                "payout": f"${round(max_payout, 2):.2f}"
            })
        elif peril_type == "LTI":
            triggers.append({
                "type": "Low Temperature",
                "value": f"≤ {int(trigger)}°C",
                "payout": f"${round(max_payout, 2):.2f}"
            })
        elif peril_type == "HTI":
            triggers.append({
                "type": "High Temperature", 
                "value": f"≥ {int(trigger)}°C",
                "payout": f"${round(max_payout, 2):.2f}"
            })
    
    return triggers

def determine_risk_level(loss_ratio: float) -> str:
    """
    Determine risk level based on loss ratio.
    """
    if loss_ratio < 0.7:
        return "LOW RISK"
    elif loss_ratio < 0.9:
        return "MEDIUM RISK"
    else:
        return "HIGH RISK" 
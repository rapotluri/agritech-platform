import optuna
import numpy as np
from typing import List, Dict, Any, Tuple
from services.insure_smart_premium_calc import calculate_insure_smart_premium

def optimize_insure_smart(request_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Optimize Insure Smart product using Optuna.
    
    Args:
        request_data: Dict containing:
            - product: Dict with commune, province, sumInsured, premiumCap
            - periods: List[Dict] with startDate, endDate, perilType
    
    Returns:
        List of up to 3 best configurations with full details
    """
    # Extract data from frontend format
    product = request_data["product"]
    periods_data = request_data["periods"]
    
    commune = product["commune"]
    province = product["province"]
    sum_insured = float(product["sumInsured"])
    premium_cap = float(product["premiumCap"])
    
    # Convert periods to optimizer format
    periods = convert_periods_format(periods_data)
    
    # Validate input
    if not periods:
        return [{"error": "No coverage periods specified"}]
    
    # Create optimization study
    study = optuna.create_study(
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=42),
        pruner=optuna.pruners.MedianPruner()
    )
    
    # Define objective function
    def objective(trial):
        try:
            # Generate trial configuration
            trial_periods = generate_trial_configuration(trial, periods, sum_insured)
            
            # Calculate premium and metrics
            result = calculate_insure_smart_premium(
                commune=commune,
                province=province,
                periods=trial_periods,
                sum_insured=sum_insured,
                admin_loading=0.15,
                profit_loading=0.075
            )
            
            # Check premium cap constraint (keep this as it's a business requirement)
            loaded_premium_cost = result["loaded_premium"]
            if loaded_premium_cost > premium_cap:
                print(f"Trial {trial.number}: Loaded premium cost ${loaded_premium_cost:.2f} exceeds cap ${premium_cap}")
                return -float('inf')  # Exceeds premium cap
            
            # Check payout frequency constraint to prevent over-optimization
            payout_years = result["payout_years"]
            if payout_years > 25:  # Allow up to 25 payout years out of 30
                print(f"Trial {trial.number}: Too many payout years ({payout_years}/30) - over-optimized")
                return -float('inf')  # Too many payouts
            
            # Use loss ratio from result
            loss_ratio = result["loss_ratio"]
            
            # Calculate composite score with coverage penalty
            score = calculate_composite_score(result, loaded_premium_cost, sum_insured, loss_ratio)
            
            print(f"Trial {trial.number}: Valid! Loaded Premium=${loaded_premium_cost:.2f}, Score={score:.4f}, Coverage Penalty={result.get('coverage_penalty', 0):.3f}")
            return score
            
        except Exception as e:
            print(f"Trial {trial.number}: Exception - {str(e)}")
            return -float('inf')
    
    # Run optimization
    study.optimize(objective, n_trials=200, n_jobs=-1)  # Single job for Celery compatibility
    
    # Extract best configurations
    best_configs = extract_best_configurations(study, commune, province, periods, sum_insured)
    
    return best_configs

def convert_periods_format(periods_data: List[Dict]) -> List[Dict]:
    """
    Convert frontend periods format to optimizer format.
    Frontend: [{"startDate": Date, "endDate": Date, "perilType": "LRI|ERI|Both"}]
    Optimizer: [{"start_day": int, "end_day": int, "perils": [{"type": "LRI|ERI"}]}]
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
        elif peril_type == "Both":
            perils.append({"type": "LRI"})
            perils.append({"type": "ERI"})
        
        converted_periods.append({
            "start_day": start_day,
            "end_day": end_day,
            "perils": perils
        })
    
    return converted_periods

def generate_trial_configuration(trial: optuna.Trial, base_periods: List[Dict], sum_insured: float) -> List[Dict]:
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
        # Sample split for LRI/ERI from discrete set
        split_options = [0.4, 0.5, 0.6]
        lri_split = trial.suggest_categorical("lri_si_split", split_options)
        eri_split = 1.0 - lri_split
        # Assign splits based on which index is LRI/ERI
        if "LRI" in indexes and "ERI" in indexes:
            si_split["LRI"] = lri_split
            si_split["ERI"] = eri_split
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
                trigger = trial.suggest_float(f"lri_trigger_{period_idx}_{peril_idx}", 20, 150)
                duration = trial.suggest_int(f"lri_duration_{period_idx}_{peril_idx}", 5, 30)
                unit_payout = trial.suggest_float(f"lri_unit_payout_{period_idx}_{peril_idx}", 0.5, 3.0)
            else:  # ERI
                trigger = trial.suggest_float(f"eri_trigger_{period_idx}_{peril_idx}", 40, 200)
                duration = trial.suggest_int(f"eri_duration_{period_idx}_{peril_idx}", 1, 5)
                unit_payout = trial.suggest_float(f"eri_unit_payout_{period_idx}_{peril_idx}", 0.5, 3.0)
            # max_payout is set to allocated_si
            max_payout = allocated_si
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
    
    return composite_score

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

def extract_best_configurations(study: optuna.Study, commune: str, province: str, 
                              base_periods: List[Dict], sum_insured: float) -> List[Dict[str, Any]]:
    """
    Extract the best configurations from the optimization study.
    """
    best_configs = []
    
    # Get top trials
    top_trials = sorted(study.trials, key=lambda t: t.value, reverse=True)[:3]
    
    for trial in top_trials:
        if trial.value == -float('inf'):
            continue  # Skip invalid trials
            
        # Reconstruct the configuration
        trial_periods = reconstruct_configuration(trial, base_periods, sum_insured)
        
        # Recalculate metrics for this configuration
        result = calculate_insure_smart_premium(
            commune=commune,
            province=province,
            periods=trial_periods,
            sum_insured=sum_insured,
            admin_loading=0.15,
            profit_loading=0.075
        )
        
        # Use loaded premium for premium cost
        loaded_premium_cost = result["loaded_premium"]
        
        # Format the result to match frontend expectations
        config = {
            "lossRatio": result["loss_ratio"],
            "expectedPayout": result["avg_payout"],
            "premiumRate": result["premium_rate"],
            "premiumCost": result["loaded_premium"],
            "triggers": format_triggers_for_frontend(trial_periods, base_periods),
            "riskLevel": determine_risk_level(result["loss_ratio"]),
            "score": trial.value,
            "periods": format_periods_for_output(trial_periods, base_periods),
            # Add detailed breakdowns for frontend analysis
            "period_breakdown": result.get("period_breakdown", []),
            "yearly_results": result.get("yearly_results", []),
            "max_payout": result.get("max_payout"),
            "payout_years": result.get("payout_years"),
            "coverage_score": result.get("coverage_score"),
            "payout_stability_score": result.get("payout_stability_score"),
            "coverage_penalty": result.get("coverage_penalty", 0),
            "periods_with_no_payouts": result.get("periods_with_no_payouts", 0)
        }
        
        best_configs.append(to_python_type(config))
    
    if not best_configs:
        return [{"error": "No valid configurations found within constraints"}]
    
    return best_configs

def reconstruct_configuration(trial: optuna.Trial, base_periods: List[Dict], sum_insured: float) -> List[Dict]:
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
                trigger = trial.params[f"lri_trigger_{period_idx}_{peril_idx}"]
                duration = trial.params[f"lri_duration_{period_idx}_{peril_idx}"]
                unit_payout = trial.params[f"lri_unit_payout_{period_idx}_{peril_idx}"]
            else:  # ERI
                trigger = trial.params[f"eri_trigger_{period_idx}_{peril_idx}"]
                duration = trial.params[f"eri_duration_{period_idx}_{peril_idx}"]
                unit_payout = trial.params[f"eri_unit_payout_{period_idx}_{peril_idx}"]
            max_payout = allocated_si
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
                        "trigger": trial_peril["trigger"],
                        "duration": trial_peril["duration"],
                        "unit_payout": trial_peril["unit_payout"],
                        "max_payout": trial_peril["max_payout"],
                        "allocated_si": trial_peril["allocated_si"]
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

def format_triggers_for_frontend(trial_periods: List[Dict], base_periods: List[Dict]) -> List[Dict]:
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
                "value": f"≤ {trigger:.0f}mm",
                "payout": f"${max_payout:.0f}"
            })
        else:  # ERI
            triggers.append({
                "type": "High Rainfall", 
                "value": f"≥ {trigger:.0f}mm",
                "payout": f"${max_payout:.0f}"
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
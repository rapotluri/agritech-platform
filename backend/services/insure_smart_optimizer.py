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
                sum_insured=sum_insured
            )
            
            if not result["valid"]:
                print(f"Trial {trial.number}: Invalid configuration - {result.get('message', 'No message')}")
                return -float('inf')  # Invalid configuration
            
            # Calculate premium cost
            premium_cost = result["premium_rate"] * sum_insured
            
            # Check premium cap constraint
            if premium_cost > premium_cap:
                print(f"Trial {trial.number}: Premium cost ${premium_cost:.2f} exceeds cap ${premium_cap}")
                return -float('inf')  # Exceeds premium cap
            
            # Calculate composite score
            score = calculate_composite_score(result, premium_cost, sum_insured)
            
            print(f"Trial {trial.number}: Valid! Premium=${premium_cost:.2f}, Score={score:.4f}")
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
    """
    trial_periods = []
    total_allocated = 0.0
    
    for period_idx, base_period in enumerate(base_periods):
        period_config = {
            "start_day": base_period.get("start_day", 0),
            "end_day": base_period.get("end_day", 364)
        }
        
        # Get perils for this period (user-selected)
        perils = base_period.get("perils", [])
        if not perils:
            continue
            
        period_perils = []
        period_si_remaining = sum_insured - total_allocated
        
        for peril_idx, peril in enumerate(perils):
            peril_type = peril["type"]  # "ERI" or "LRI"
            
            # Sample parameters for this peril
            if peril_type == "LRI":
                trigger = trial.suggest_float(f"lri_trigger_{period_idx}_{peril_idx}", 20, 150)
                duration = trial.suggest_int(f"lri_duration_{period_idx}_{peril_idx}", 5, 30)
                unit_payout = trial.suggest_float(f"lri_unit_payout_{period_idx}_{peril_idx}", 0.5, 3.0)
                max_payout = trial.suggest_float(f"lri_max_payout_{period_idx}_{peril_idx}", 50, 300)
            else:  # ERI
                trigger = trial.suggest_float(f"eri_trigger_{period_idx}_{peril_idx}", 40, 200)
                duration = trial.suggest_int(f"eri_duration_{period_idx}_{peril_idx}", 1, 5)
                unit_payout = trial.suggest_float(f"eri_unit_payout_{period_idx}_{peril_idx}", 0.5, 3.0)
                max_payout = trial.suggest_float(f"eri_max_payout_{period_idx}_{peril_idx}", 50, 300)
            
            # Allocate SI for this peril
            if peril_idx == len(perils) - 1:
                # Last peril in period gets remaining SI
                allocated_si = period_si_remaining
            else:
                # Allocate portion of remaining SI
                allocation_ratio = trial.suggest_float(f"si_allocation_{period_idx}_{peril_idx}", 0.2, 0.8)
                allocated_si = period_si_remaining * allocation_ratio
            
            # Ensure reasonable allocation
            allocated_si = max(allocated_si, 10.0)  # Minimum $10
            allocated_si = min(allocated_si, period_si_remaining)
            
            period_perils.append({
                "peril_type": peril_type,
                "trigger": trigger,
                "duration": duration,
                "unit_payout": unit_payout,
                "max_payout": max_payout,
                "allocated_si": allocated_si
            })
            
            total_allocated += allocated_si
            period_si_remaining -= allocated_si
        
        trial_periods.extend(period_perils)
    
    return trial_periods

def calculate_composite_score(result: Dict[str, Any], premium_cost: float, sum_insured: float) -> float:
    """
    Calculate composite score based on the scoring function.
    """
    # Premium utilization score (how close to premium cap)
    premium_utilization_score = min(premium_cost / (premium_cost + 1), 1.0)  # Normalized
    
    # Loss ratio score (lower is better, so invert)
    loss_ratio = result["avg_payout"] / premium_cost if premium_cost > 0 else 0
    loss_ratio_score = max(0, 1 - loss_ratio)  # Inverted, capped at 1
    
    # Payout stability score
    payout_stability_score = result["payout_stability_score"]
    
    # Coverage score
    coverage_score = result["coverage_score"]
    
    # Composite score
    composite_score = (
        0.4 * premium_utilization_score +
        0.3 * loss_ratio_score +
        0.2 * payout_stability_score +
        0.1 * coverage_score
    )
    
    return composite_score

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
            sum_insured=sum_insured
        )
        
        premium_cost = result["premium_rate"] * sum_insured
        
        # Format the result to match frontend expectations
        config = {
            "lossRatio": result["avg_payout"] / premium_cost if premium_cost > 0 else 0,
            "expectedPayout": result["avg_payout"],
            "premiumRate": result["premium_rate"],
            "premiumCost": premium_cost,
            "triggers": format_triggers_for_frontend(trial_periods, base_periods),
            "riskLevel": determine_risk_level(result["avg_payout"] / premium_cost if premium_cost > 0 else 0),
            "score": trial.value,
            "periods": format_periods_for_output(trial_periods, base_periods)
        }
        
        best_configs.append(config)
    
    if not best_configs:
        return [{"error": "No valid configurations found within constraints"}]
    
    return best_configs

def reconstruct_configuration(trial: optuna.Trial, base_periods: List[Dict], sum_insured: float) -> List[Dict]:
    """
    Reconstruct the full configuration from a trial.
    """
    trial_periods = []
    total_allocated = 0.0
    
    for period_idx, base_period in enumerate(base_periods):
        perils = base_period.get("perils", [])
        period_si_remaining = sum_insured - total_allocated
        
        for peril_idx, peril in enumerate(perils):
            peril_type = peril["type"]
            
            # Extract parameters from trial
            if peril_type == "LRI":
                trigger = trial.params[f"lri_trigger_{period_idx}_{peril_idx}"]
                duration = trial.params[f"lri_duration_{period_idx}_{peril_idx}"]
                unit_payout = trial.params[f"lri_unit_payout_{period_idx}_{peril_idx}"]
                max_payout = trial.params[f"lri_max_payout_{period_idx}_{peril_idx}"]
            else:  # ERI
                trigger = trial.params[f"eri_trigger_{period_idx}_{peril_idx}"]
                duration = trial.params[f"eri_duration_{period_idx}_{peril_idx}"]
                unit_payout = trial.params[f"eri_unit_payout_{period_idx}_{peril_idx}"]
                max_payout = trial.params[f"eri_max_payout_{period_idx}_{peril_idx}"]
            
            # Reconstruct SI allocation
            if peril_idx == len(perils) - 1:
                allocated_si = period_si_remaining
            else:
                allocation_ratio = trial.params[f"si_allocation_{period_idx}_{peril_idx}"]
                allocated_si = period_si_remaining * allocation_ratio
            
            allocated_si = max(allocated_si, 10.0)
            allocated_si = min(allocated_si, period_si_remaining)
            
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
            
            total_allocated += allocated_si
            period_si_remaining -= allocated_si
    
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
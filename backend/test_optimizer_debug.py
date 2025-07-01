from services.insure_smart_optimizer import optimize_insure_smart
from services.insure_smart_premium_calc import calculate_insure_smart_premium
from pprint import pprint
from services.insure_smart_premium_calc import clear_weather_data_cache
import time
import cProfile
import pstats


# Test with a single, simple configuration first
def test_single_calculation():
    print("=== Testing Single Premium Calculation ===")
    clear_weather_data_cache()
    
    # Simple test case
    test_periods = [
        {
            "peril_type": "LRI",
            "trigger": 20,  # Lower trigger, less likely to pay out
            "duration": 10,
            "unit_payout": 0.1,  # Lower payout per mm
            "max_payout": 20,
            "allocated_si": 100,
            "start_day": 0,
            "end_day": 30
        }
    ]
    
    profiler = cProfile.Profile()
    profiler.enable()
    start_time = time.time()
    try:
        result = calculate_insure_smart_premium(
            commune="KampongCham",
            province="KampongCham", 
            periods=test_periods,
            sum_insured=250
        )
        end_time = time.time()
        profiler.disable()
        
        print(f"Calculation took: {end_time - start_time:.2f} seconds")
        print("Result:")
        pprint(result)
        
        stats = pstats.Stats(profiler).sort_stats('cumtime')
        print("\n--- Single Calculation Profile (Top 30) ---")
        stats.print_stats(30)
        
        # Check if result is valid
        if result["valid"]:
            print("✅ Result is valid")
            premium_cost = result["premium_rate"] * 250  # sum_insured
            print(f"Premium cost: ${premium_cost:.2f}")
            print(f"Premium rate: {result['premium_rate']:.4f}")
            print(f"Avg payout: ${result['avg_payout']:.2f}")
        else:
            print("❌ Result is invalid")
            print(f"Message: {result.get('message', 'No message')}")
            
    except Exception as e:
        profiler.disable()
        print(f"❌ Error in calculation: {str(e)}")
        import traceback
        traceback.print_exc()

# Test the optimizer with debugging
def test_optimizer_with_debug():
    print("\n=== Testing Optimizer with Debug ===")
    
    payload = {
        "product": {
            "commune": "KampongCham",
            "province": "KampongCham",
            "sumInsured": 250,
            "premiumCap": 55  # More generous
        },
        "periods": [
            {
                "startDate": "2023-06-01T00:00:00Z",
                "endDate": "2023-06-30T00:00:00Z",
                "perilType": "LRI"
            }
        ]
    }
    
    profiler = cProfile.Profile()
    profiler.enable()
    print("Running optimizer with debug...")
    start_time = time.time()
    results = optimize_insure_smart(payload)
    end_time = time.time()
    profiler.disable()
    
    print(f"Total optimization time: {end_time - start_time:.2f} seconds")
    print("\nOptimizer Results:")
    pprint(results)
    
    stats = pstats.Stats(profiler).sort_stats('cumtime')
    print("\n--- Optimizer Profile (Top 30) ---")
    stats.print_stats(30)

if __name__ == "__main__":
    test_single_calculation()
    test_optimizer_with_debug() 
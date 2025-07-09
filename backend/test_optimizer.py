from services.insure_smart_optimizer import optimize_insure_smart
from pprint import pprint

# Example payload matching frontend structure
payload = {
    "product": {
        "commune": "KampongCham",
        "province": "KampongCham",
        "sumInsured": 250,
        "premiumCap": 55  # Slightly more flexible than $10
    },
    "periods": [
        {
            "startDate": "2023-07-01T00:00:00Z",
            "endDate": "2023-08-15T00:00:00Z",
            "perilType": "Both"
        },
        {
            "startDate": "2023-08-16T00:00:00Z",
            "endDate": "2023-09-30T00:00:00Z",
            "perilType": "LRI"
        }
    ]
}


print("Running optimizer with sample payload...")
results = optimize_insure_smart(payload)
print("\nOptimizer Results:")
pprint(results) 
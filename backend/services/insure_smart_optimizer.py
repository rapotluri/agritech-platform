def optimize_insure_smart(request_data):
    # Placeholder: return mock results
    return [
        {
            "lossRatio": 0.85,
            "expectedPayout": 212.5,
            "premiumRate": 0.04,
            "premiumCost": 16.0,
            "triggers": [
                {"type": "Low Rainfall", "value": "≤ 75mm", "payout": "$150"},
                {"type": "High Rainfall", "value": "≥ 200mm", "payout": "$100"},
            ],
            "riskLevel": "MEDIUM RISK",
        },
        {
            "lossRatio": 0.78,
            "expectedPayout": 195,
            "premiumRate": 0.038,
            "premiumCost": 15.2,
            "triggers": [
                {"type": "Low Rainfall", "value": "≤ 80mm", "payout": "$125"},
                {"type": "High Rainfall", "value": "≥ 180mm", "payout": "$125"},
            ],
            "riskLevel": "LOW RISK",
        },
        {
            "lossRatio": 0.92,
            "expectedPayout": 230,
            "premiumRate": 0.042,
            "premiumCost": 16.8,
            "triggers": [
                {"type": "Low Rainfall", "value": "≤ 70mm", "payout": "$175"},
                {"type": "High Rainfall", "value": "≥ 220mm", "payout": "$75"},
            ],
            "riskLevel": "HIGH RISK",
        },
    ] 
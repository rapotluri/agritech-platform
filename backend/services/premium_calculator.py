from typing import Dict
from schemas.premium import PremiumRequest

def calculate_premium(request: PremiumRequest) -> Dict:
    # Example logic using plantingDate
    planting_date = request.plantingDate
    # Placeholder logic for premium calculation
    # Replace with actual calculation logic
    premium = 100.0  # Example premium value
    return {
        "premium": premium,
        "message": "Premium calculated successfully",
        "plantingDate": planting_date  # Return the planting date for confirmation
    } 
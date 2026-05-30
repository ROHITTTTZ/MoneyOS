from .rules import categorize_by_rules
from .ai_categorizer import categorize_with_ai

def categorize(merchant: str) -> str:
    """Two-layer categorization: rules first, AI fallback."""
    # Layer 1: fast rules
    category = categorize_by_rules(merchant)
    if category:
        return category

    # Layer 2: AI fallback (slower, used only for unknowns)
    return categorize_with_ai(merchant)
    # return "Other"  # For now, we can skip AI categorization to avoid latency

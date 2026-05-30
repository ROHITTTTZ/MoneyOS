import requests
import json

CATEGORIES = ["Food", "Travel", "Shopping", "Subscriptions", "Bills", "Entertainment", "Health", "Investment", "Other"]

def categorize_with_ai(merchant: str) -> str:
    """Use local Llama 3 to categorize an unknown merchant."""
    prompt = f"""You are a financial transaction categorizer.
Given a merchant name, classify it into exactly ONE of these categories:
Food, Travel, Shopping, Subscriptions, Bills, Entertainment, Health, Investment, Other

Merchant: {merchant}

Rules:
- Reply with ONLY the category name, nothing else.
- No punctuation, no explanation, just the category.

Category:"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": prompt, "stream": False},
            timeout=10
        )
        result = response.json()["response"].strip()
        print(f"{merchant} -> {result}")
        # Validate the response is one of our categories
        for cat in CATEGORIES:
            if cat.lower() in result.lower():
                return cat
        return "Other"
    except Exception:
        return "Other"  # Graceful fallback if Ollama is not running

CATEGORY_RULES = {
    # Food & Dining
    "zomato": "Food", "swiggy": "Food", "dominos": "Food", "pizza": "Food",
    "mcdonalds": "Food", "kfc": "Food", "subway": "Food", "starbucks": "Food",
    "cafe": "Food", "restaurant": "Food", "biryani": "Food", "diner": "Food",

    # Travel & Transport
    "uber": "Travel", "ola": "Travel", "rapido": "Travel", "irctc": "Travel",
    "makemytrip": "Travel", "goibibo": "Travel", "indigo": "Travel",
    "air india": "Travel", "metro": "Travel", "namma metro": "Travel",

    # Shopping
    "amazon": "Shopping", "flipkart": "Shopping", "myntra": "Shopping",
    "ajio": "Shopping", "meesho": "Shopping", "nykaa": "Shopping",
    "reliance": "Shopping", "dmart": "Shopping", "big bazaar": "Shopping",

    # Subscriptions
    "netflix": "Subscriptions", "spotify": "Subscriptions", "hotstar": "Subscriptions",
    "prime video": "Subscriptions", "youtube premium": "Subscriptions",
    "zee5": "Subscriptions", "sony liv": "Subscriptions", "apple": "Subscriptions",

    # Bills & Utilities
    "bescom": "Bills", "bwssb": "Bills", "tata power": "Bills", "electricity": "Bills",
    "jio": "Bills", "airtel": "Bills", "vodafone": "Bills", "bsnl": "Bills",
    "gas": "Bills", "water": "Bills", "broadband": "Bills",

    # Health
    "pharmacy": "Health", "hospital": "Health", "clinic": "Health",
    "apollo": "Health", "medplus": "Health", "1mg": "Health", "practo": "Health",

    # Entertainment
    "pvr": "Entertainment", "inox": "Entertainment", "bookmyshow": "Entertainment",
    "gaming": "Entertainment", "steam": "Entertainment",

    # Investments
    "zerodha": "Investment", "groww": "Investment", "upstox": "Investment",
    "lic": "Investment", "mutual fund": "Investment", "sip": "Investment",
    "fd": "Investment", "ppf": "Investment",
}


def categorize_by_rules(merchant: str) -> str | None:
    """Return category from keyword rules, or None if no match."""
    merchant_lower = merchant.lower().strip()
    for keyword, category in CATEGORY_RULES.items():
        if keyword in merchant_lower:
            return category
    return None

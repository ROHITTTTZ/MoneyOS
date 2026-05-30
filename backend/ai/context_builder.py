from supabase import Client
from datetime import date
from collections import defaultdict

def build_financial_context(user_id: str, supabase: Client) -> str:
    """Build a text summary of the user's finances for the AI."""
    # month = date.today().strftime("%Y-%m")
    month = "2026-04"

    # Get this month's transactions
    result = supabase.table("transactions").select("*") \
        .eq("user_id", user_id) \
        .gte("transaction_date", f"{month}-01") \
        .lte("transaction_date", f"{month}-30") \
        .execute()

    transactions = result.data
    if not transactions:
        return "The user has no transaction data available for this month."

    income = sum(t["amount"] for t in transactions if t["transaction_type"] == "credit")
    expenses = sum(t["amount"] for t in transactions if t["transaction_type"] == "debit")
    savings = income - expenses
    savings_rate = round(savings / income * 100, 1) if income > 0 else 0

    # Category breakdown
    cats = defaultdict(float)
    for t in transactions:
        if t["transaction_type"] == "debit":
            cats[t["category"]] += t["amount"]

    top_cats = sorted(cats.items(), key=lambda x: -x[1])[:5]
    cat_str = ", ".join(f"₹{round(v):,} on {k}" for k, v in top_cats)

    # Last 5 transactions for context
    recent = sorted(transactions, key=lambda x: x["transaction_date"], reverse=True)[:5]
    recent_str = "; ".join(f"{t['merchant']} ₹{t['amount']}" for t in recent)

    return f"""Current month: {month}
Monthly income: ₹{income:,.0f}
Monthly expenses: ₹{expenses:,.0f}
Monthly savings: ₹{savings:,.0f}
Savings rate: {savings_rate}%
Top spending categories: {cat_str}
Recent transactions: {recent_str}
"""

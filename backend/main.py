from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from parser.pdf_parser import parse_pdf
import os
from dotenv import load_dotenv
from categorizer.categorizer import categorize
from datetime import datetime
from calendar import monthrange
from ai.context_builder import build_financial_context
import requests as http_requests
from pydantic import BaseModel
from datetime import date, datetime

load_dotenv()
class ChatRequest(BaseModel):
    message: str

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    deadline: str  # YYYY-MM-DD


app = FastAPI(title="MoneyOS API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


async def get_user_id(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")

    try:
        response = supabase.auth.get_user(token)

        print("AUTH USER:", response.user.id)

        return response.user.id

    except Exception as e:
        print("AUTH ERROR:", e)
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_user_id)):
    context = build_financial_context(user_id, supabase)

    system_prompt = f"""You are MoneyOS, a personal finance AI assistant.
You have access to the user's real financial data. Use it to give specific, accurate answers.
Keep answers concise (2-4 sentences). Use Indian Rupee (₹) amounts.
Do not make up numbers — only use the data provided.

--- USER FINANCIAL DATA ---
{context}
--- END DATA ---"""

    full_prompt = f"{system_prompt}\n\nUser question: {req.message}\n\nYour answer:"

    try:
        response = http_requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "llama3", "prompt": full_prompt, "stream": False},
            timeout=30
        )
        answer = response.json()["response"].strip()
    except Exception as e:
        answer = "Sorry, the AI service is not available right now. Make sure Ollama is running."

    return {"answer": answer, "context_used": context[:200] + "..."}


@app.get("/dashboard/summary")
async def dashboard_summary(month: str = None, user_id: str = Depends(get_user_id)):
    """Return income, expenses, savings for a given month (YYYY-MM)."""

    from datetime import date

    if not month:
        month = date.today().strftime("%Y-%m")

    year, month_num = map(int, month.split("-"))

    start_date = f"{year}-{month_num:02d}-01"

    last_day = monthrange(year, month_num)[1]

    end_date = f"{year}-{month_num:02d}-{last_day:02d}"

    result = (
        supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .gte("transaction_date", start_date)
        .lte("transaction_date", end_date)
        .execute()
    )

    transactions = result.data

    income = sum(
        t["amount"]
        for t in transactions
        if t["transaction_type"] == "credit"
    )

    expenses = sum(
        t["amount"]
        for t in transactions
        if t["transaction_type"] == "debit"
    )

    savings = income - expenses

    savings_rate = round(
        (savings / income * 100) if income > 0 else 0,
        1
    )

    return {
        "month": month,
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "savings": round(savings, 2),
        "savings_rate": savings_rate,
        "transaction_count": len(transactions)
    }

@app.get("/dashboard/categories")
async def dashboard_categories(month: str = None, user_id: str = Depends(get_user_id)):

    from datetime import date
    from collections import defaultdict

    if not month:
        month = date.today().strftime("%Y-%m")

    year, month_num = map(int, month.split("-"))

    start_date = f"{year}-{month_num:02d}-01"

    last_day = monthrange(year, month_num)[1]

    end_date = f"{year}-{month_num:02d}-{last_day:02d}"

    result = (
        supabase.table("transactions")
        .select("category,amount")
        .eq("user_id", user_id)
        .eq("transaction_type", "debit")
        .gte("transaction_date", start_date)
        .lte("transaction_date", end_date)
        .execute()
    )

    totals = defaultdict(float)

    for t in result.data:
        totals[t["category"]] += t["amount"]

    return [
        {
            "category": category,
            "amount": round(amount, 2)
        }
        for category, amount in sorted(
            totals.items(),
            key=lambda x: -x[1]
        )
    ]

@app.get("/dashboard/health_score")
async def health_score(user_id: str = Depends(get_user_id)):
    from datetime import date
    month = date.today().strftime("%Y-%m")

    summary = await dashboard_summary(month=month, user_id=user_id)
    savings_rate = summary["savings_rate"]

    # Score formula (0-100)
    # Savings rate: ideal is 20%+ = full 50 points
    savings_score = min(savings_rate / 20, 1) * 50

    # Diversity: are they overspending in one category?
    cats = await dashboard_categories(month=month, user_id=user_id)
    total_expense = sum(c["amount"] for c in cats)
    max_cat_pct = (max((c["amount"] for c in cats), default=0) / total_expense * 100) if total_expense > 0 else 0
    diversity_score = max(0, 30 - (max_cat_pct - 40) * 0.5) if max_cat_pct > 40 else 30

    # Positive activity: having transactions = 20 points
    activity_score = 20 if summary["transaction_count"] > 0 else 0

    total = round(savings_score + diversity_score + activity_score)
    label = "Excellent" if total >= 80 else "Good" if total >= 60 else "Fair" if total >= 40 else "Needs Work"

    return {"score": min(total, 100), "label": label,
            "savings_score": round(savings_score), "diversity_score": round(diversity_score)}

@app.post("/goals")
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_user_id)):
    result = supabase.table("goals").insert({
        "user_id": user_id,
        "name": goal.name,
        "target_amount": goal.target_amount,
        "deadline": goal.deadline,
    }).execute()
    return result.data[0]


@app.get("/goals")
async def get_goals(user_id: str = Depends(get_user_id)):
    result = supabase.table("goals").select("*").eq("user_id", user_id).execute()
    goals = result.data

    # Calculate monthly savings needed and progress for each goal
    today = datetime.today().date()
    # Get total savings this month
    month = today.strftime("%Y-%m")

    year, month_num = map(int, month.split("-"))

    start_date = f"{year}-{month_num:02d}-01"

    last_day = monthrange(year, month_num)[1]

    end_date = f"{year}-{month_num:02d}-{last_day:02d}"

    txns = (
        supabase.table("transactions")
        .select("amount,transaction_type")
        .eq("user_id", user_id)
        .gte("transaction_date", start_date)
        .lte("transaction_date", end_date)
        .execute()
        .data
    )
    monthly_savings = sum(t["amount"] for t in txns if t["transaction_type"]=="credit") - \
                      sum(t["amount"] for t in txns if t["transaction_type"]=="debit")

    enriched = []
    for g in goals:
        deadline = date.fromisoformat(g["deadline"])
        months_left = max(1, (deadline.year - today.year) * 12 + deadline.month - today.month)
        needed = round((g["target_amount"] - g["current_amount"]) / months_left, 0)
        progress_pct = round(g["current_amount"] / g["target_amount"] * 100, 1)
        on_track = monthly_savings >= needed
        enriched.append({**g, "monthly_needed": needed, "progress_pct": progress_pct, "on_track": on_track})

    return enriched


@app.patch("/goals/{goal_id}/deposit")
async def deposit_to_goal(goal_id: str, amount: float, user_id: str = Depends(get_user_id)):
    goal = supabase.table("goals").select("*").eq("id", goal_id).single().execute().data
    new_amount = goal["current_amount"] + amount
    supabase.table("goals").update({"current_amount": new_amount}).eq("id", goal_id).execute()
    return {"current_amount": new_amount}


@app.post("/upload")
async def upload_statement(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    file_bytes = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".pdf"):
            import io
            transactions = parse_pdf(io.BytesIO(file_bytes))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as e:
        print("\n========== PARSER ERROR ==========")
        print(type(e).__name__)
        print(str(e))
        print("=================================\n")

        raise HTTPException(
            status_code=422,
            detail=str(e)
        )

    if not transactions:
        raise HTTPException(status_code=422, detail="No transactions found in file")

    # Add user_id to each transaction
    rows = [{
        "user_id": user_id,
        "merchant": t["merchant"][:200],
        "amount": t["amount"],
        "transaction_date": t["date"],
        "transaction_type": t["type"],
        "category": categorize(t["merchant"]),
    } for t in transactions]

    # Batch insert into Supabase
    result = supabase.table("transactions").insert(rows).execute()
    return {"inserted": len(result.data), "message": "Success"}

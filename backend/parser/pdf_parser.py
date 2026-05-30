import pdfplumber
import re


def clean_merchant(name):

    # Insert spaces between words
    name = re.sub(
        r'([a-z])([A-Z])',
        r'\1 \2',
        name
    )

    # Handle long uppercase sequences
    name = re.sub(
        r'([A-Z]{2,})([A-Z][a-z])',
        r'\1 \2',
        name
    )

    # Remove extra spaces
    name = re.sub(
        r'\s+',
        ' ',
        name
    )

    return name.strip()


def parse_pdf(file_obj):

    transactions = []

    with pdfplumber.open(file_obj) as pdf:

        full_text = ""

        for page in pdf.pages:

            extracted = page.extract_text()

            if extracted:
                full_text += extracted + "\n"

    # Match:
    # 01Apr,2026 PaidtoSwiggy ₹234
    # 26Apr,2026 ReceivedfromAnusree ₹650

    pattern = re.compile(
        r'(\d{2}[A-Za-z]{3},\d{4})'
        r'.*?'
        r'(Paidto|Receivedfrom)'
        r'(.*?)'
        r'₹([\d,]+(?:\.\d+)?)',
        re.S
    )

    matches = pattern.findall(full_text)

    print("\n========================")
    print("MATCHES FOUND:", len(matches))
    print("========================\n")

    seen = set()

    for date, tx_type, merchant, amount in matches:

        merchant = clean_merchant(
            merchant
        )

        amount = float(
            amount.replace(",", "")
        )

        transaction = {
            "date": date,
            "merchant": merchant[:200],
            "amount": amount,
            "type": (
                "credit"
                if tx_type == "Receivedfrom"
                else "debit"
            )
        }

        # avoid duplicates
        key = (
            transaction["date"],
            transaction["merchant"],
            transaction["amount"]
        )

        if key not in seen:

            seen.add(key)

            transactions.append(
                transaction
            )

    print(
        "FINAL TRANSACTIONS:",
        len(transactions)
    )

    print(
        transactions[:5]
    )

    return transactions
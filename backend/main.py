import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import analytics
import pandas as pd
import numpy as np
from datetime import date

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinSight Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUIRED_COLS = {"date", "description", "category", "amount"}


def generate_personal_spending_df(months: int = 6, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    end_month_start = pd.Timestamp(date.today()).replace(day=1)
    month_starts = pd.date_range(end=end_month_start, periods=months, freq="MS")

    rows = []
    for m in month_starts:
        rows.append({"date": m + pd.Timedelta(days=0), "description": "Rent payment", "category": "Rent", "amount": 1800.00})

        for d in [5, 18]:
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Utilities bill",
                "category": "Utilities",
                "amount": float(np.clip(rng.normal(160, 25), 80, 260)),
            })

        subs = [
            (3, "Streaming subscription", 15.99),
            (10, "Music subscription", 10.99),
            (22, "Cloud storage", 2.99),
        ]
        for d, name, amt in subs:
            rows.append({"date": m + pd.Timedelta(days=d), "description": name, "category": "Subscriptions", "amount": float(amt)})

        for _ in range(int(rng.integers(6, 10))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Grocery store",
                "category": "Groceries",
                "amount": float(np.clip(rng.normal(95, 30), 25, 220)),
            })

        for _ in range(int(rng.integers(4, 9))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Restaurant / coffee",
                "category": "Dining",
                "amount": float(np.clip(rng.normal(38, 18), 8, 120)),
            })

        for _ in range(int(rng.integers(8, 15))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Transit / gas",
                "category": "Transport",
                "amount": float(np.clip(rng.normal(18, 9), 3, 60)),
            })

        for _ in range(int(rng.integers(1, 5))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Shopping",
                "category": "Shopping",
                "amount": float(np.clip(rng.normal(75, 40), 15, 260)),
            })

        for _ in range(int(rng.integers(0, 3))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Pharmacy / health",
                "category": "Health",
                "amount": float(np.clip(rng.normal(35, 25), 8, 160)),
            })

        for _ in range(int(rng.integers(1, 4))):
            d = int(rng.integers(2, 28))
            rows.append({
                "date": m + pd.Timedelta(days=d),
                "description": "Entertainment",
                "category": "Entertainment",
                "amount": float(np.clip(rng.normal(45, 20), 10, 140)),
            })

    df = pd.DataFrame(rows)
    return df[["date", "description", "category", "amount"]]


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    contents = await file.read()

    try:
        df = analytics.process_csv(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {sorted(list(missing))}")

    # Create UploadedFile record
    new_file = models.UploadedFile(filename=file.filename)
    db.add(new_file)
    db.flush() # Get the ID before committing

    inserted = 0
    for _, row in df.iterrows():
        tx_date = pd.to_datetime(row["date"]).date()
        desc = str(row["description"])
        cat = str(row["category"])
        amt = float(row["amount"])

        exists = db.query(models.Transaction).filter(
            models.Transaction.date == tx_date,
            models.Transaction.description == desc,
            models.Transaction.category == cat,
            models.Transaction.amount == amt
        ).first()

        if exists:
            continue

        db.add(models.Transaction(
            date=tx_date,
            description=desc,
            category=cat,
            amount=amt,
            file_id=new_file.id
        ))
        inserted += 1

    db.commit()
    return {"message": f"Uploaded. Added {inserted} new transactions."}


@app.get("/dashboard-data")
def get_dashboard_data(db: Session = Depends(get_db)):
    query = db.query(models.Transaction)
    df = pd.read_sql(query.statement, engine)

    if df.empty:
        return {
            "spending_by_category": [],
            "monthly_trend": [],
            "growth_rate": 0,
            "total_spending": 0,
            "forecast_next_month": 0,
            "months_count": 0,
        }

    df["date"] = pd.to_datetime(df["date"])
    months_count = int(df["date"].dt.to_period("M").nunique())

    cat_spending = analytics.calculate_category_spending(df)
    growth = analytics.calculate_monthly_growth(df)
    trend_with_prediction = analytics.predict_spending(df)

    forecast_next = 0.0
    predicted = [p for p in trend_with_prediction if p.get("type") == "predicted"]
    if predicted:
        forecast_next = float(predicted[-1].get("amount", 0.0))

    spending_chart = [{"name": k, "value": float(v)} for k, v in cat_spending.items()]

    return {
        "spending_by_category": spending_chart,
        "monthly_trend": trend_with_prediction,
        "growth_rate": float(growth),
        "total_spending": float(df["amount"].sum()),
        "forecast_next_month": float(forecast_next),
        "months_count": months_count,
    }


@app.post("/clear")
def clear_all_data(db: Session = Depends(get_db)):
    db.query(models.Transaction).delete()
    db.query(models.UploadedFile).delete()
    db.commit()
    return {"message": "All data cleared."}


@app.post("/simulate")
def simulate_data(db: Session = Depends(get_db)):
    df = generate_personal_spending_df(months=6, seed=42)

    db.query(models.Transaction).delete()
    db.query(models.UploadedFile).delete()
    db.commit()

    # Create a dummy file record for simulated data
    sim_file = models.UploadedFile(filename="simulated_data.csv")
    db.add(sim_file)
    db.flush()

    transactions = []
    for _, row in df.iterrows():
        transactions.append(models.Transaction(
            date=pd.to_datetime(row["date"]).date(),
            description=str(row["description"]),
            category=str(row["category"]),
            amount=float(row["amount"]),
            file_id=sim_file.id
        ))

    db.add_all(transactions)
    db.commit()
    return {"message": f"Simulated {len(transactions)} transactions."}
@app.get("/export-pdf")
def export_pdf(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).all()
    transactions = db.query(models.Transaction).all()
    

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter


    p.setFont("Helvetica-Bold", 24)
    p.setStrokeColor(colors.indigo)
    p.drawString(100, height - 50, "FinSight Engine: Financial Report")
    
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 70, f"Generated on: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')}")
    p.line(100, height - 75, 500, height - 75)


    total = sum(t.amount for t in transactions)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(100, height - 110, f"Total Spending: ${total:,.2f}")


    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, height - 150, "Recent Transactions")
    
    y = height - 170
    p.setFont("Helvetica", 10)
    p.drawString(100, y, "Date")
    p.drawString(200, y, "Category")
    p.drawString(350, y, "Amount")
    p.line(100, y-2, 500, y-2)
    
    y -= 20
    for tx in transactions[:20]:
        p.drawString(100, y, str(tx.date))
        p.drawString(200, y, tx.category)
        p.drawString(350, y, f"${tx.amount:,.2f}")
        y -= 15
        if y < 50:
            p.showPage()
            y = height - 50

    p.save()
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={
        "Content-Disposition": "attachment; filename=FinSight_Report.pdf"
    })


@app.get("/analytics/recurring")
def get_recurring_transactions(db: Session = Depends(get_db)):
    query = db.query(models.Transaction)
    df = pd.read_sql(query.statement, engine)

    if df.empty:
        return []

    # Detect patterns
    recurring_patterns = analytics.find_recurring_patterns(df)

    # Tag transactions in DB
    all_recurring_ids = []
    for pattern in recurring_patterns:
        all_recurring_ids.extend(pattern.get("transaction_ids", []))

    if all_recurring_ids:
        # Reset all first (or just update the ones found)
        db.query(models.Transaction).update({models.Transaction.is_recurring: 0})
        db.query(models.Transaction).filter(models.Transaction.id.in_(all_recurring_ids)).update(
            {models.Transaction.is_recurring: 1}, synchronize_session=False
        )
        db.commit()

    return recurring_patterns


@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).order_by(models.Transaction.date.desc()).all()
    return transactions


@app.get("/uploaded-files")
def get_uploaded_files(db: Session = Depends(get_db)):
    files = db.query(models.UploadedFile).order_by(models.UploadedFile.upload_date.desc()).all()
    return files


@app.delete("/uploaded-files/{file_id}")
def delete_uploaded_file(file_id: int, db: Session = Depends(get_db)):
    file_record = db.query(models.UploadedFile).filter(models.UploadedFile.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    db.delete(file_record) # This will cascade delete linked transactions
    db.commit()
    return {"message": "File and associated transactions deleted."}
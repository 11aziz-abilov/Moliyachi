import os
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
from database import engine, get_db, Base
import ai_service
import advisor_service

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Finance AI - Backend API",
    description="Smart Finance AI (Moliyachi) platformasining asinxron FastAPI backend API xizmati",
    version="1.0.0"
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default Demo User ID
DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

def ensure_seed_data(db: Session):
    user = db.query(models.User).filter(models.User.id == DEMO_USER_ID).first()
    if not user:
        user = models.User(
            id=DEMO_USER_ID,
            full_name="Azizbek Rahimov",
            email="azizbek@smartfinance.uz",
            password_hash="mock_hash_demo",
            main_currency="UZS"
        )
        db.add(user)
        db.commit()

        # Seed Wallets
        w1 = models.Wallet(id=str(uuid.uuid4()), user_id=DEMO_USER_ID, name="Uzcard Asaka", type="card", balance=4850000.0, currency="UZS")
        w2 = models.Wallet(id=str(uuid.uuid4()), user_id=DEMO_USER_ID, name="Humo Kapital", type="card", balance=12400000.0, currency="UZS")
        w3 = models.Wallet(id=str(uuid.uuid4()), user_id=DEMO_USER_ID, name="Naqd Pul", type="cash", balance=1200000.0, currency="UZS")
        w4 = models.Wallet(id=str(uuid.uuid4()), user_id=DEMO_USER_ID, name="Omonat Depozit (Ipak Yo'li)", type="savings", balance=18500000.0, currency="UZS")
        db.add_all([w1, w2, w3, w4])
        db.commit()

        # Seed Transactions
        today = date.today()
        txs = [
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w2.id, type="income", category="Maosh", amount=16500000.0, description="Oylik maosh - Sentabr", date=today - timedelta(days=12)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w1.id, type="income", category="Frilans", amount=4200000.0, description="Web loyiha gonorari", date=today - timedelta(days=5)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w1.id, type="expense", category="Oziq-ovqat", amount=480000.0, description="Korzinka supermarket xaridi", date=today - timedelta(days=2)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w3.id, type="expense", category="Oziq-ovqat", amount=65000.0, description="Tushlik (somsa va choy)", date=today - timedelta(days=1)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w1.id, type="expense", category="Transport", amount=180000.0, description="Yandex Go taksi haftalik", date=today - timedelta(days=3)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w2.id, type="expense", category="Transport", amount=350000.0, description="Avtomobilga benzin (Ai-95)", date=today - timedelta(days=4)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w2.id, type="expense", category="Kommunal", amount=240000.0, description="Elektr va gaz to'lovi", date=today - timedelta(days=8)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w1.id, type="expense", category="Ko'ngilochar", amount=310000.0, description="Kinoteatr va kofe", date=today - timedelta(days=6)),
            models.Transaction(user_id=DEMO_USER_ID, wallet_id=w3.id, type="expense", category="Salomatlik", amount=145000.0, description="Dorixona xaridi", date=today - timedelta(days=7)),
        ]
        db.add_all(txs)

        # Seed Debts
        d1 = models.Debt(
            user_id=DEMO_USER_ID,
            person_name="Jasur Komilov",
            type="lend",
            total_amount=2000000.0,
            paid_amount=500000.0,
            due_date=today + timedelta(days=20),
            status="active"
        )
        d2 = models.Debt(
            user_id=DEMO_USER_ID,
            person_name="Sherzodbek",
            type="lend",
            total_amount=800000.0,
            paid_amount=0.0,
            due_date=today + timedelta(days=10),
            status="active"
        )
        d3 = models.Debt(
            user_id=DEMO_USER_ID,
            person_name="Anvar aka (Mebel uchun)",
            type="borrow",
            total_amount=3500000.0,
            paid_amount=1500000.0,
            due_date=today + timedelta(days=25),
            status="active"
        )
        db.add_all([d1, d2, d3])

        # Seed Savings Goals
        g1 = models.SavingsGoal(
            user_id=DEMO_USER_ID,
            wallet_id=w4.id,
            title="Yangi Noutbuk (MacBook M3 Pro)",
            target_amount=24000000.0,
            current_amount=14500000.0,
            deadline=today + timedelta(days=60),
            status="in_progress"
        )
        g2 = models.SavingsGoal(
            user_id=DEMO_USER_ID,
            wallet_id=w4.id,
            title="Favqulodda Jamg'arma (Emergency Fund)",
            target_amount=30000000.0,
            current_amount=12000000.0,
            deadline=today + timedelta(days=150),
            status="in_progress"
        )
        db.add_all([g1, g2])

        # Seed initial Input Log
        log1 = models.InputLog(
            user_id=DEMO_USER_ID,
            input_type="voice",
            raw_content="Bugun 45 000 so'mga tushlik qildim va Jasurga benzinga 200 000 so'm qarz berdim",
            parsed_json={"operations": [
                {"target_table": "transactions", "type": "expense", "amount": 45000, "category": "Oziq-ovqat", "description": "Tushlik"},
                {"target_table": "debts", "type": "lend", "amount": 200000, "person_name": "Jasur", "description": "Benzinga qarz"}
            ]},
            status="confirmed"
        )
        db.add(log1)

        db.commit()


@app.on_event("startup")
def startup_populate():
    db = next(get_db())
    try:
        ensure_seed_data(db)
    finally:
        db.close()


# ---------------- SUMMARY / DASHBOARD KPI ----------------
@app.get("/api/summary")
def get_summary(db: Session = Depends(get_db)):
    wallets = db.query(models.Wallet).filter(models.Wallet.user_id == DEMO_USER_ID).all()
    total_balance = sum(float(w.balance) for w in wallets)

    # Monthly transactions (current calendar month)
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == DEMO_USER_ID,
        models.Transaction.date >= start_of_month
    ).all()

    monthly_income = sum(float(t.amount) for t in transactions if t.type == "income")
    monthly_expense = sum(float(t.amount) for t in transactions if t.type == "expense")

    # Debts
    debts = db.query(models.Debt).filter(models.Debt.user_id == DEMO_USER_ID, models.Debt.status == "active").all()
    lent_to_others = sum(float(d.total_amount - d.paid_amount) for d in debts if d.type == "lend")
    borrowed_from_others = sum(float(d.total_amount - d.paid_amount) for d in debts if d.type == "borrow")
    net_debt_balance = lent_to_others - borrowed_from_others

    # DTI Ratio
    monthly_debt_obligation = (borrowed_from_others / 3) if borrowed_from_others > 0 else 0
    dti_ratio = (monthly_debt_obligation / monthly_income * 100) if monthly_income > 0 else 0

    return {
        "total_net_worth": total_balance,
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "net_debt_balance": net_debt_balance,
        "lent_to_others": lent_to_others,
        "borrowed_from_others": borrowed_from_others,
        "dti_ratio": round(dti_ratio, 1),
        "wallets_count": len(wallets)
    }


# ---------------- WALLETS ----------------
@app.get("/api/wallets", response_model=List[schemas.WalletResponse])
def get_wallets(db: Session = Depends(get_db)):
    return db.query(models.Wallet).filter(models.Wallet.user_id == DEMO_USER_ID).all()

@app.post("/api/wallets", response_model=schemas.WalletResponse)
def create_wallet(req: schemas.WalletCreate, db: Session = Depends(get_db)):
    w = models.Wallet(
        user_id=DEMO_USER_ID,
        name=req.name,
        type=req.type,
        balance=req.balance,
        currency=req.currency
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@app.post("/api/wallets/transfer")
def transfer_between_wallets(req: schemas.WalletTransferRequest, db: Session = Depends(get_db)):
    source = db.query(models.Wallet).filter(models.Wallet.id == req.from_wallet_id, models.Wallet.user_id == DEMO_USER_ID).first()
    target = db.query(models.Wallet).filter(models.Wallet.id == req.to_wallet_id, models.Wallet.user_id == DEMO_USER_ID).first()

    if not source or not target:
        raise HTTPException(status_code=404, detail="Hamyon topilmadi")

    if float(source.balance) < req.amount:
        raise HTTPException(status_code=400, detail="Mablag' yetarli emas")

    source.balance = float(source.balance) - req.amount
    target.balance = float(target.balance) + req.amount

    # Log internal transfer transaction
    tx_out = models.Transaction(
        user_id=DEMO_USER_ID,
        wallet_id=source.id,
        type="expense",
        category="Transfer",
        amount=req.amount,
        description=f"{target.name} ga o'tkazma: {req.description}",
        date=date.today()
    )
    tx_in = models.Transaction(
        user_id=DEMO_USER_ID,
        wallet_id=target.id,
        type="income",
        category="Transfer",
        amount=req.amount,
        description=f"{source.name} dan o'tkazma: {req.description}",
        date=date.today()
    )
    db.add_all([tx_out, tx_in])
    db.commit()
    return {"message": "O'tkazma muvaffaqiyatli bajarildi", "from_balance": float(source.balance), "to_balance": float(target.balance)}


# ---------------- TRANSACTIONS ----------------
@app.get("/api/transactions")
def get_transactions(
    type: Optional[str] = None,
    category: Optional[str] = None,
    wallet_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction).filter(models.Transaction.user_id == DEMO_USER_ID)
    if type and type != "all":
        query = query.filter(models.Transaction.type == type)
    if category and category != "all":
        query = query.filter(models.Transaction.category == category)
    if wallet_id and wallet_id != "all":
        query = query.filter(models.Transaction.wallet_id == wallet_id)

    items = query.order_by(desc(models.Transaction.date), desc(models.Transaction.created_at)).all()
    results = []
    for item in items:
        results.append({
            "id": item.id,
            "user_id": item.user_id,
            "wallet_id": item.wallet_id,
            "wallet_name": item.wallet.name if item.wallet else "Noma'lum",
            "type": item.type,
            "category": item.category,
            "amount": float(item.amount),
            "description": item.description,
            "date": item.date.isoformat(),
            "created_at": item.created_at.isoformat()
        })
    return results

@app.post("/api/transactions")
def create_transaction(req: schemas.TransactionCreate, db: Session = Depends(get_db)):
    tx = models.Transaction(
        user_id=DEMO_USER_ID,
        wallet_id=req.wallet_id,
        type=req.type,
        category=req.category,
        amount=req.amount,
        description=req.description,
        date=req.date or date.today()
    )
    db.add(tx)

    # Adjust wallet balance
    if req.wallet_id:
        wallet = db.query(models.Wallet).filter(models.Wallet.id == req.wallet_id).first()
        if wallet:
            if req.type == "income":
                wallet.balance = float(wallet.balance) + req.amount
            elif req.type == "expense":
                wallet.balance = float(wallet.balance) - req.amount

    db.commit()
    db.refresh(tx)
    return {"id": tx.id, "message": "Tranzaksiya muvaffaqiyatli saqlandi"}

@app.delete("/api/transactions/{id}")
def delete_transaction(id: str, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == id, models.Transaction.user_id == DEMO_USER_ID).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Tranzaksiya topilmadi")

    # Reverse wallet balance
    if tx.wallet_id:
        wallet = db.query(models.Wallet).filter(models.Wallet.id == tx.wallet_id).first()
        if wallet:
            if tx.type == "income":
                wallet.balance = float(wallet.balance) - float(tx.amount)
            elif tx.type == "expense":
                wallet.balance = float(wallet.balance) + float(tx.amount)

    db.delete(tx)
    db.commit()
    return {"message": "Tranzaksiya o'chirildi"}


# ---------------- DEBTS ----------------
@app.get("/api/debts")
def get_debts(db: Session = Depends(get_db)):
    items = db.query(models.Debt).filter(models.Debt.user_id == DEMO_USER_ID).order_by(desc(models.Debt.created_at)).all()
    results = []
    for d in items:
        total = float(d.total_amount)
        paid = float(d.paid_amount)
        remaining = max(0.0, total - paid)
        results.append({
            "id": d.id,
            "person_name": d.person_name,
            "type": d.type,
            "total_amount": total,
            "paid_amount": paid,
            "remaining_amount": remaining,
            "due_date": d.due_date.isoformat() if d.due_date else None,
            "status": d.status,
            "created_at": d.created_at.isoformat()
        })
    return results

@app.post("/api/debts")
def create_debt(req: schemas.DebtCreate, db: Session = Depends(get_db)):
    d = models.Debt(
        user_id=DEMO_USER_ID,
        person_name=req.person_name,
        type=req.type,
        total_amount=req.total_amount,
        paid_amount=req.paid_amount,
        due_date=req.due_date,
        status="active"
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@app.post("/api/debts/{id}/pay")
def pay_debt(id: str, req: schemas.DebtPayRequest, db: Session = Depends(get_db)):
    debt = db.query(models.Debt).filter(models.Debt.id == id, models.Debt.user_id == DEMO_USER_ID).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Qarz topilmadi")

    new_paid = float(debt.paid_amount) + req.payment_amount
    debt.paid_amount = min(float(debt.total_amount), new_paid)
    if debt.paid_amount >= float(debt.total_amount):
        debt.status = "settled"

    # Wallet adjustment if provided
    if req.wallet_id:
        wallet = db.query(models.Wallet).filter(models.Wallet.id == req.wallet_id).first()
        if wallet:
            if debt.type == "borrow":
                # Paying back our debt = expense
                wallet.balance = float(wallet.balance) - req.payment_amount
            else:
                # Other person paying us back = income
                wallet.balance = float(wallet.balance) + req.payment_amount

    db.commit()
    return {"message": "To'lov qabul qilindi", "status": debt.status, "paid_amount": float(debt.paid_amount)}


# ---------------- SAVINGS GOALS ----------------
@app.get("/api/savings")
def get_savings(db: Session = Depends(get_db)):
    goals = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == DEMO_USER_ID).all()
    results = []
    for g in goals:
        target = float(g.target_amount)
        current = float(g.current_amount)
        pct = (current / target * 100) if target > 0 else 0
        results.append({
            "id": g.id,
            "title": g.title,
            "wallet_id": g.wallet_id,
            "wallet_name": g.wallet.name if g.wallet else None,
            "target_amount": target,
            "current_amount": current,
            "percentage": min(100.0, round(pct, 1)),
            "deadline": g.deadline.isoformat() if g.deadline else None,
            "status": g.status,
            "created_at": g.created_at.isoformat()
        })
    return results

@app.post("/api/savings")
def create_savings(req: schemas.SavingsGoalCreate, db: Session = Depends(get_db)):
    g = models.SavingsGoal(
        user_id=DEMO_USER_ID,
        wallet_id=req.wallet_id,
        title=req.title,
        target_amount=req.target_amount,
        current_amount=req.current_amount,
        deadline=req.deadline,
        status="in_progress"
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@app.post("/api/savings/{id}/deposit")
def deposit_to_savings(id: str, req: schemas.SavingsDepositRequest, db: Session = Depends(get_db)):
    goal = db.query(models.SavingsGoal).filter(models.SavingsGoal.id == id, models.SavingsGoal.user_id == DEMO_USER_ID).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Maqsad topilmadi")

    goal.current_amount = float(goal.current_amount) + req.amount
    if goal.current_amount >= float(goal.target_amount):
        goal.status = "completed"

    if req.wallet_id:
        wallet = db.query(models.Wallet).filter(models.Wallet.id == req.wallet_id).first()
        if wallet:
            wallet.balance = float(wallet.balance) - req.amount

    db.commit()
    return {"message": "Mablag' qo'shildi", "current_amount": float(goal.current_amount), "status": goal.status}


# ---------------- AI INGESTION & PIPELINE ----------------
@app.post("/api/ai/ingest-text")
async def ingest_text(req: schemas.IngestTextRequest, db: Session = Depends(get_db)):
    operations = await ai_service.extract_operations_with_llm(req.text, req.api_key)

    # Log in input_logs
    log = models.InputLog(
        user_id=DEMO_USER_ID,
        input_type="text",
        raw_content=req.text,
        parsed_json={"operations": operations},
        status="pending"
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "log_id": log.id,
        "raw_text": req.text,
        "operations": operations
    }

@app.post("/api/ai/ingest-audio")
async def ingest_audio(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Save audio temporarily
    temp_path = f"temp_audio_{uuid.uuid4().hex}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        transcription = await ai_service.transcribe_audio_file(temp_path, api_key)
        operations = await ai_service.extract_operations_with_llm(transcription, api_key)

        log = models.InputLog(
            user_id=DEMO_USER_ID,
            input_type="voice",
            raw_content=transcription,
            parsed_json={"operations": operations},
            status="pending"
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "log_id": log.id,
            "raw_text": transcription,
            "operations": operations
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ---------------- CONFIRMATION & ATOMIC COMMIT ----------------
@app.post("/api/ai/confirm")
def confirm_operations(req: schemas.ConfirmOperationsRequest, db: Session = Depends(get_db)):
    """
    Section 4.1: LLM results are NOT saved immediately.
    Frontend provides interactive cards for user review (amount, category, wallet).
    Upon 'Tasdiqlash', operations are written atomically to the DB and wallet balances updated!
    """
    log = db.query(models.InputLog).filter(models.InputLog.id == req.log_id, models.InputLog.user_id == DEMO_USER_ID).first()
    if log:
        log.status = "confirmed"

    # Default wallet if none selected
    default_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == DEMO_USER_ID).first()

    for op in req.operations:
        wallet_to_use = None
        if op.wallet_id:
            wallet_to_use = db.query(models.Wallet).filter(models.Wallet.id == op.wallet_id).first()
        if not wallet_to_use:
            wallet_to_use = default_wallet

        if op.target_table == "transactions":
            tx = models.Transaction(
                user_id=DEMO_USER_ID,
                wallet_id=wallet_to_use.id if wallet_to_use else None,
                type=op.type if op.type in ["income", "expense"] else "expense",
                category=op.category or "Boshqa",
                amount=op.amount,
                description=op.description or "Smart kiritish orqali",
                date=date.today()
            )
            db.add(tx)
            if wallet_to_use:
                if tx.type == "income":
                    wallet_to_use.balance = float(wallet_to_use.balance) + op.amount
                else:
                    wallet_to_use.balance = float(wallet_to_use.balance) - op.amount

        elif op.target_table == "debts":
            d_type = "lend" if op.type in ["lend", "berdim"] else "borrow"
            debt = models.Debt(
                user_id=DEMO_USER_ID,
                person_name=op.person_name or "Noma'lum shaxs",
                type=d_type,
                total_amount=op.amount,
                paid_amount=0.0,
                due_date=date.today() + timedelta(days=30),
                status="active"
            )
            db.add(debt)
            # If we lent money to someone, deduct from wallet
            if wallet_to_use and d_type == "lend":
                wallet_to_use.balance = float(wallet_to_use.balance) - op.amount
            elif wallet_to_use and d_type == "borrow":
                # We borrowed money, cash enters wallet
                wallet_to_use.balance = float(wallet_to_use.balance) + op.amount

        elif op.target_table == "savings_goals":
            goal = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == DEMO_USER_ID, models.SavingsGoal.status == "in_progress").first()
            if goal:
                goal.current_amount = float(goal.current_amount) + op.amount
                if wallet_to_use:
                    wallet_to_use.balance = float(wallet_to_use.balance) - op.amount

    db.commit()
    return {"message": "Barcha operatsiyalar muvaffaqiyatli saqlandi va hamyonlar yangilandi!", "count": len(req.operations)}


# ---------------- AI FINANCIAL ADVISOR & CHAT ----------------
@app.get("/api/ai/advisor")
def get_advisor_insights(db: Session = Depends(get_db)):
    return advisor_service.calculate_financial_health_and_insights(db, DEMO_USER_ID)

@app.post("/api/ai/chat")
async def chat_with_advisor(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    reply = await advisor_service.answer_financial_chat(db, DEMO_USER_ID, req.message, req.api_key)
    return {"response": reply}


# ---------------- INPUT LOGS ----------------
@app.get("/api/input-logs")
def get_input_logs(db: Session = Depends(get_db)):
    logs = db.query(models.InputLog).filter(models.InputLog.user_id == DEMO_USER_ID).order_by(desc(models.InputLog.created_at)).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "input_type": l.input_type,
            "raw_content": l.raw_content,
            "parsed_json": l.parsed_json,
            "status": l.status,
            "created_at": l.created_at.isoformat()
        })
    return results


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

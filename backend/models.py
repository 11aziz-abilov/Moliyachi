import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Numeric, DateTime, Date, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    main_currency = Column(String(10), default="UZS")
    created_at = Column(DateTime, default=datetime.utcnow)

    wallets = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    input_logs = relationship("InputLog", back_populates="user", cascade="all, delete-orphan")


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # "Uzcard", "Humo", "Naqd pul", "Omonat"
    type = Column(String(30), nullable=False)   # 'card', 'cash', 'savings'
    balance = Column(Numeric(15, 2), default=0.00)
    currency = Column(String(10), default="UZS")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wallets")
    transactions = relationship("Transaction", back_populates="wallet")
    savings_goals = relationship("SavingsGoal", back_populates="wallet")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(20), nullable=False)  # 'income' yoki 'expense'
    category = Column(String(100), nullable=False)  # 'Oziq-ovqat', 'Transport', 'Maosh', 'Kommunal', etc.
    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    wallet = relationship("Wallet", back_populates="transactions")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    person_name = Column(String(150), nullable=False)
    type = Column(String(20), nullable=False)  # 'borrow' (oldim), 'lend' (berdim)
    total_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0.00)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="active")  # 'active', 'settled'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="debts")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    current_amount = Column(Numeric(15, 2), default=0.00)
    deadline = Column(Date, nullable=True)
    status = Column(String(20), default="in_progress")  # 'in_progress', 'completed'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="savings_goals")
    wallet = relationship("Wallet", back_populates="savings_goals")


class InputLog(Base):
    __tablename__ = "input_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    input_type = Column(String(20), nullable=False)  # 'text' yoki 'voice'
    raw_content = Column(Text, nullable=True)
    parsed_json = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")  # 'pending', 'confirmed', 'rejected'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="input_logs")

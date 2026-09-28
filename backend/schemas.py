from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime

class WalletBase(BaseModel):
    name: str
    type: str  # card, cash, savings
    balance: float = 0.0
    currency: str = "UZS"

class WalletCreate(WalletBase):
    pass

class WalletResponse(WalletBase):
    id: str
    user_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class WalletTransferRequest(BaseModel):
    from_wallet_id: str
    to_wallet_id: str
    amount: float
    description: Optional[str] = "Hamyonlararo o'tkazma"

class TransactionBase(BaseModel):
    wallet_id: Optional[str] = None
    type: str  # income, expense
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[date] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    wallet_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DebtBase(BaseModel):
    person_name: str
    type: str  # borrow (oldim), lend (berdim)
    total_amount: float
    paid_amount: float = 0.0
    due_date: Optional[date] = None
    status: str = "active"  # active, settled

class DebtCreate(DebtBase):
    pass

class DebtPayRequest(BaseModel):
    payment_amount: float
    wallet_id: Optional[str] = None

class DebtResponse(DebtBase):
    id: str
    user_id: str
    remaining_amount: float = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

class SavingsGoalBase(BaseModel):
    wallet_id: Optional[str] = None
    title: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[date] = None
    status: str = "in_progress"

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsDepositRequest(BaseModel):
    amount: float
    wallet_id: Optional[str] = None

class SavingsGoalResponse(SavingsGoalBase):
    id: str
    user_id: str
    percentage: float = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

class InputLogResponse(BaseModel):
    id: str
    input_type: str
    raw_content: Optional[str] = None
    parsed_json: Optional[Any] = None
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class IngestTextRequest(BaseModel):
    text: str
    api_key: Optional[str] = None

class OperationItem(BaseModel):
    target_table: str  # 'transactions' yoki 'debts' yoki 'savings_goals'
    type: str  # expense, income, lend, borrow, deposit
    amount: float
    currency: str = "UZS"
    category: Optional[str] = None
    description: Optional[str] = None
    person_name: Optional[str] = None
    wallet_id: Optional[str] = None
    due_date: Optional[str] = None

class ExtractionResponse(BaseModel):
    log_id: str
    raw_text: str
    operations: List[OperationItem]

class ConfirmOperationsRequest(BaseModel):
    log_id: str
    operations: List[OperationItem]

class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None

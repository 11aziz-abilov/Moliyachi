// Smart Finance AI API Client and Data Types

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: "card" | "cash" | "savings";
  balance: number;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id?: string;
  wallet_name?: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

export interface Debt {
  id: string;
  person_name: string;
  type: "lend" | "borrow"; // lend = Men berdim, borrow = Men oldim
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date?: string;
  status: "active" | "settled";
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  wallet_id?: string;
  wallet_name?: string;
  target_amount: number;
  current_amount: number;
  percentage: number;
  deadline?: string;
  status: "in_progress" | "completed";
  created_at: string;
}

export interface InputLog {
  id: string;
  input_type: "text" | "voice";
  raw_content: string;
  parsed_json: any;
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
}

export interface DashboardSummary {
  total_net_worth: number;
  monthly_income: number;
  monthly_expense: number;
  net_debt_balance: number;
  lent_to_others: number;
  borrowed_from_others: number;
  dti_ratio: number;
  wallets_count: number;
}

export interface OperationItem {
  target_table: "transactions" | "debts" | "savings_goals";
  type: string; // expense, income, lend, borrow, deposit
  amount: number;
  currency: string;
  category?: string;
  description?: string;
  person_name?: string;
  wallet_id?: string;
  due_date?: string;
}

export interface AdvisorInsights {
  health_score: number;
  monthly_income: number;
  monthly_expense: number;
  net_savings: number;
  dti_ratio: number;
  dti_level: "safe" | "warning" | "critical";
  dti_warning: string;
  impulsive_total: number;
  impulsive_percentage: number;
  impulsive_status: "ideal" | "moderate" | "high";
  impulsive_advice: string;
  category_breakdown: { category: string; amount: number }[];
  savings_goals_insights: {
    goal_id: string;
    title: string;
    current_amount: number;
    target_amount: number;
    percentage: number;
    advice: string;
  }[];
}

export function formatCurrency(amount: number, currency: string = "UZS"): string {
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Client API Methods with error resilience
export const api = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/summary`);
    if (!res.ok) throw new Error("Summary yuklanmadi");
    return res.json();
  },

  async getWallets(): Promise<Wallet[]> {
    const res = await fetch(`${API_BASE}/wallets`);
    if (!res.ok) throw new Error("Hamyonlar yuklanmadi");
    return res.json();
  },

  async createWallet(data: { name: string; type: string; balance: number; currency: string }): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/wallets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Hamyon yaratilmadi");
    return res.json();
  },

  async transferWallets(data: { from_wallet_id: string; to_wallet_id: string; amount: number; description?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/wallets/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "O'tkazma bajarilmadi");
    }
    return res.json();
  },

  async getTransactions(filters?: { type?: string; category?: string; wallet_id?: string }): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== "all") params.append("type", filters.type);
    if (filters?.category && filters.category !== "all") params.append("category", filters.category);
    if (filters?.wallet_id && filters.wallet_id !== "all") params.append("wallet_id", filters.wallet_id);

    const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
    if (!res.ok) throw new Error("Tranzaksiyalar yuklanmadi");
    return res.json();
  },

  async createTransaction(data: {
    wallet_id?: string;
    type: string;
    category: string;
    amount: number;
    description?: string;
    date?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Tranzaksiya saqlanmadi");
    return res.json();
  },

  async deleteTransaction(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Tranzaksiya o'chirilmadi");
    return res.json();
  },

  async getDebts(): Promise<Debt[]> {
    const res = await fetch(`${API_BASE}/debts`);
    if (!res.ok) throw new Error("Qarzlar yuklanmadi");
    return res.json();
  },

  async createDebt(data: {
    person_name: string;
    type: string;
    total_amount: number;
    paid_amount?: number;
    due_date?: string;
  }): Promise<Debt> {
    const res = await fetch(`${API_BASE}/debts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Qarz saqlanmadi");
    return res.json();
  },

  async payDebt(id: string, payment_amount: number, wallet_id?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/debts/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_amount, wallet_id }),
    });
    if (!res.ok) throw new Error("Qarz to'lovi saqlanmadi");
    return res.json();
  },

  async getSavings(): Promise<SavingsGoal[]> {
    const res = await fetch(`${API_BASE}/savings`);
    if (!res.ok) throw new Error("Omonatlar yuklanmadi");
    return res.json();
  },

  async createSavings(data: {
    title: string;
    target_amount: number;
    current_amount?: number;
    wallet_id?: string;
    deadline?: string;
  }): Promise<SavingsGoal> {
    const res = await fetch(`${API_BASE}/savings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Omonat maqsadi saqlanmadi");
    return res.json();
  },

  async depositSavings(id: string, amount: number, wallet_id?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/savings/${id}/deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, wallet_id }),
    });
    if (!res.ok) throw new Error("Mablag' qo'shilmadi");
    return res.json();
  },

  // AI Pipeline
  async ingestText(text: string, apiKey?: string): Promise<{ log_id: string; raw_text: string; operations: OperationItem[] }> {
    const res = await fetch(`${API_BASE}/ai/ingest-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, api_key: apiKey }),
    });
    if (!res.ok) throw new Error("Matn tahlil qilinmadi");
    return res.json();
  },

  async ingestAudio(blob: Blob, apiKey?: string): Promise<{ log_id: string; raw_text: string; operations: OperationItem[] }> {
    const formData = new FormData();
    formData.append("file", blob, "voice_input.webm");
    if (apiKey) formData.append("api_key", apiKey);

    const res = await fetch(`${API_BASE}/ai/ingest-audio`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Ovozli so'rov tahlil qilinmadi");
    return res.json();
  },

  async confirmOperations(log_id: string, operations: OperationItem[]): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log_id, operations }),
    });
    if (!res.ok) throw new Error("Operatsiyalar tasdiqlanmadi");
    return res.json();
  },

  async getAdvisorInsights(): Promise<AdvisorInsights> {
    const res = await fetch(`${API_BASE}/ai/advisor`);
    if (!res.ok) throw new Error("AI tahlillari yuklanmadi");
    return res.json();
  },

  async chatAdvisor(message: string, apiKey?: string): Promise<{ response: string }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, api_key: apiKey }),
    });
    if (!res.ok) throw new Error("AI javob bermadi");
    return res.json();
  },

  async getInputLogs(): Promise<InputLog[]> {
    const res = await fetch(`${API_BASE}/input-logs`);
    if (!res.ok) throw new Error("Loglar yuklanmadi");
    return res.json();
  },
};

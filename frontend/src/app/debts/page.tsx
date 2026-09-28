"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck,
  Calendar,
  X,
  Loader2,
  DollarSign
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { Debt, api, formatCurrency, formatDate } from "@/lib/api";

export default function DebtsPage() {
  const { refreshTrigger, triggerRefresh, wallets } = useFinance();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "lend" | "borrow">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Pay Modal
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payWalletId, setPayWalletId] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  // Add Debt Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [newType, setNewType] = useState<"lend" | "borrow">("lend");
  const [newTotal, setNewTotal] = useState<number>(0);
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setIsLoading(true);
        const data = await api.getDebts();
        setDebts(data);
      } catch (err) {
        console.warn("Using layout debts", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDebts();
  }, [refreshTrigger]);

  const lentDebts = debts.filter((d) => d.type === "lend");
  const borrowedDebts = debts.filter((d) => d.type === "borrow");

  const totalLent = lentDebts.reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0);
  const totalBorrowed = borrowedDebts.reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0);

  const displayedDebts = debts.filter((d) => {
    if (activeTab === "all") return true;
    return d.type === activeTab;
  });

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || payAmount <= 0) return;

    setPayLoading(true);
    try {
      await api.payDebt(selectedDebt.id, payAmount, payWalletId || undefined);
      setSelectedDebt(null);
      setPayAmount(0);
      triggerRefresh();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPerson.trim() || newTotal <= 0) return;

    setAddLoading(true);
    try {
      await api.createDebt({
        person_name: newPerson.trim(),
        type: newType,
        total_amount: newTotal,
        due_date: newDueDate,
      });
      setIsAddOpen(false);
      setNewPerson("");
      setNewTotal(0);
      triggerRefresh();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Qarzlar Daftari
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            "Menga qarzdorlar" va "Mening qarzlarim" hisobi, muddatlar va to'lov progressi.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Qarz Yozish</span>
        </button>
      </div>

      {/* DTI & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lent Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" />
              <span>Menga Qarzdorlar (Qarz berganman)</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(totalLent)}
            </div>
            <span className="text-[11px] text-slate-500">
              {lentDebts.filter((d) => d.status === "active").length} kishi hali qaytarmagan
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Borrowed Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4" />
              <span>Mening Qarzlarim (Qarz olganman)</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(totalBorrowed)}
            </div>
            <span className="text-[11px] text-slate-500">
              {borrowedDebts.filter((d) => d.status === "active").length} ta to'lanishi kerak bo'lgan qarz
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Barchasi ({debts.length})
        </button>
        <button
          onClick={() => setActiveTab("lend")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "lend"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Menga Qarzdorlar ({lentDebts.length})
        </button>
        <button
          onClick={() => setActiveTab("borrow")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "borrow"
              ? "bg-rose-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Mening Qarzlarim ({borrowedDebts.length})
        </button>
      </div>

      {/* Debts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedDebts.map((debt) => {
          const isLend = debt.type === "lend";
          const remaining = Math.max(0, debt.total_amount - debt.paid_amount);
          const percentPaid = Math.min(100, Math.round((debt.paid_amount / debt.total_amount) * 100));
          const isSettled = debt.status === "settled" || remaining <= 0;

          return (
            <div
              key={debt.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border ${
                isSettled
                  ? "border-emerald-500/30 opacity-80"
                  : "border-slate-200/80 dark:border-slate-800"
              } shadow-sm space-y-4 relative overflow-hidden`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isLend
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isLend ? "Qarz Berganman" : "Qarz Olganman"}
                    </span>
                    {isSettled && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                        To'liq To'langan
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {debt.person_name}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Jami Qarz:</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(debt.total_amount)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">To'langan: {formatCurrency(debt.paid_amount)}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{percentPaid}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLend ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
              </div>

              {/* Remaining & Due Date */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Qolgan summa:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(remaining)}
                  </div>
                </div>

                {debt.due_date && (
                  <div className="text-right">
                    <span className="text-slate-400">Muddat:</span>
                    <div className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(debt.due_date)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isSettled && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedDebt(debt);
                      setPayAmount(remaining);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>To'lov Qayd Qilish</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pay Debt Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Qarz To'lovini Qayd Qilish
              </h3>
              <button onClick={() => setSelectedDebt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div className="text-slate-500">Shaxs: <strong>{selectedDebt.person_name}</strong></div>
                <div className="text-slate-500">Qolgan qarz: <strong>{formatCurrency(selectedDebt.total_amount - selectedDebt.paid_amount)}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To'lanayotgan Summa (UZS)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hamyon Balansiga Ta'siri (Ixtiyoriy)
                </label>
                <select
                  value={payWalletId}
                  onChange={(e) => setPayWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Hamyon balansini o'zgartirmaslik</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Agar hamyon tanlansa, qarz qaytarilishi bilan hamyon balansi ham mos ravishda yangilanadi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Debt Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Yangi Qarz Qayd Qilish</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebt} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewType("lend")}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    newType === "lend"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Qarz berdim (Menga qarzdor)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("borrow")}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    newType === "borrow"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Qarz oldim (Men qarzdorman)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shaxs Ismi
                </label>
                <input
                  type="text"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  placeholder="Masalan: Dilshod, Akmal aka..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qarz Summasi (UZS)
                </label>
                <input
                  type="number"
                  value={newTotal}
                  onChange={(e) => setNewTotal(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytarish Muddati
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

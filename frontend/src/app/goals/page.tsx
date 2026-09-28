"use client";

import { useState, useEffect } from "react";
import { 
  Target, 
  Plus, 
  PiggyBank, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  TrendingUp, 
  X, 
  Loader2,
  ArrowUpRight
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { SavingsGoal, api, formatCurrency, formatDate } from "@/lib/api";

export default function GoalsPage() {
  const { refreshTrigger, triggerRefresh, wallets } = useFinance();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Deposit Modal
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositWalletId, setDepositWalletId] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Add Goal Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState<number>(0);
  const [newInitial, setNewInitial] = useState<number>(0);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0]
  );
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSavings();
        setGoals(data);
      } catch (err) {
        console.warn("Using layout goals", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGoals();
  }, [refreshTrigger]);

  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || depositAmount <= 0) return;

    setDepositLoading(true);
    try {
      await api.depositSavings(selectedGoal.id, depositAmount, depositWalletId || undefined);
      setSelectedGoal(null);
      setDepositAmount(0);
      triggerRefresh();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTarget <= 0) return;

    setAddLoading(true);
    try {
      await api.createSavings({
        title: newTitle.trim(),
        target_amount: newTarget,
        current_amount: newInitial,
        deadline: newDeadline,
      });
      setIsAddOpen(false);
      setNewTitle("");
      setNewTarget(0);
      setNewInitial(0);
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
            Omonat & Maqsadlar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Orzularingiz uchun jamg'arilayotgan mablag'lar, progress barlar va AI tezlatish tavsiyalari.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Maqsad Yaratish</span>
        </button>
      </div>

      {/* AI Strategy Recommendation Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>AI Moliyachi Tavsiyasi: Maqsadlarni Tezlashtirish</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              O'rtacha jamg'arish sur'atiga ko'ra, har kuni <strong>25 000 so'm</strong> orttirilsa (oyiga 750 000 UZS), faol maqsadlaringizga rejadagidan <strong>2 oy oldinroq</strong> erishishingiz mumkin!
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">Umumiy Progress:</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {overallPercentage}% To'plandi
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percent = goal.percentage || Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
          const isCompleted = goal.status === "completed" || percent >= 100;
          const remaining = Math.max(0, goal.target_amount - goal.current_amount);

          return (
            <div
              key={goal.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border ${
                isCompleted ? "border-emerald-500/40" : "border-slate-200/80 dark:border-slate-800"
              } shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                      }`}
                    >
                      {isCompleted ? "Erishildi 🎉" : "Jarayonda"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {goal.title}
                  </h3>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              {/* Progress & Amount */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    {formatCurrency(goal.current_amount)}
                  </div>
                  <div className="text-xs text-slate-400">
                    / {formatCurrency(goal.target_amount)}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Qoldi: {formatCurrency(remaining)}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{percent}%</span>
                  </div>
                </div>
              </div>

              {/* Deadline & Deposit Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {goal.deadline ? (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(goal.deadline)}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Muddatsiz</span>
                )}

                {!isCompleted ? (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setDepositAmount(500000);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold border border-emerald-500/20 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mablag' Qo'shish</span>
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Bajarildi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Omonatga Mablag' Qo'shish
              </h3>
              <button onClick={() => setSelectedGoal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <div className="text-slate-500">Maqsad: <strong>{selectedGoal.title}</strong></div>
                <div className="text-slate-500">
                  Joriy holat: {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qo'shilayotgan Summa (UZS)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaysi Hamyondan Yechilsin? (Ixtiyoriy)
                </label>
                <select
                  value={depositWalletId}
                  onChange={(e) => setDepositWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Hamyon balansini o'zgartirmaslik</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {depositLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Mablag' Qo'shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Yangi Moliyaviy Maqsad</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maqsad Nomi
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Masalan: Umra safari, Yangi mashina, Uy..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kutilayotgan Maqsad Summasi (UZS)
                </label>
                <input
                  type="number"
                  value={newTarget}
                  onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Boshlang'ich Jamg'arilgan Summa (UZS)
                </label>
                <input
                  type="number"
                  value={newInitial}
                  onChange={(e) => setNewInitial(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kutilayotgan Erishish Sanasi
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
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

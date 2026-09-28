"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Banknote, 
  PiggyBank, 
  Plus, 
  ArrowLeftRight, 
  CheckCircle2, 
  Sparkles,
  TrendingUp,
  X,
  Loader2
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { Wallet, api, formatCurrency } from "@/lib/api";

export default function WalletsPage() {
  const { refreshTrigger, triggerRefresh, wallets: globalWallets } = useFinance();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferDesc, setTransferDesc] = useState("Hamyonlararo o'tkazma");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Add Wallet Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"card" | "cash" | "savings">("card");
  const [newBalance, setNewBalance] = useState<number>(0);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setIsLoading(true);
        const data = await api.getWallets();
        setWallets(data);
        if (data.length >= 2) {
          setFromWalletId(data[0].id);
          setToWalletId(data[1].id);
        }
      } catch (err) {
        console.warn("Using layout wallets", err);
        setWallets(globalWallets);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWallets();
  }, [refreshTrigger]);

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || transferAmount <= 0) {
      setTransferError("Ikkita turli hamyon va to'g'ri summa tanlang");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    try {
      await api.transferWallets({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount: transferAmount,
        description: transferDesc
      });
      setIsTransferOpen(false);
      setTransferAmount(0);
      triggerRefresh();
    } catch (err: any) {
      setTransferError(err.message || "O'tkazmada xatolik");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAddLoading(true);
    try {
      await api.createWallet({
        name: newName.trim(),
        type: newType,
        balance: newBalance,
        currency: "UZS"
      });
      setIsAddOpen(false);
      setNewName("");
      setNewBalance(0);
      triggerRefresh();
    } catch (err: any) {
      alert("Hamyon yaratilmadi: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Hamyonlar & Hisoblar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcha bank kartalari, naqd pullar va omonatlaringiz yagona xavfsiz boshqaruvda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
            <span>O'tkazma Qilish</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Hamyon</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-emerald-600/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
            Jami Jamg'arilgan Balans (Barcha Hisoblar)
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight">
            {formatCurrency(totalBalance)}
          </div>
          <div className="text-xs text-emerald-100/90 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Taxminan: ${(totalBalance / 12800).toFixed(0)} USD ekvivalentida</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium">
            {wallets.length} ta faol hamyon
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Wallets Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => {
          const isCard = wallet.type === "card";
          const isCash = wallet.type === "cash";
          const isSavings = wallet.type === "savings";

          return (
            <div
              key={wallet.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-6 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isCard
                        ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white"
                        : isCash
                        ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white"
                        : "bg-gradient-to-tr from-cyan-500 to-blue-500 text-white"
                    }`}
                  >
                    {isCard && <CreditCard className="w-6 h-6" />}
                    {isCash && <Banknote className="w-6 h-6" />}
                    {isSavings && <PiggyBank className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                      {wallet.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      {isCard ? "Plastik Karta" : isCash ? "Naqd Mablag'" : "Omonat Hisob"}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {wallet.currency}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1">Mavjud Balans:</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Holati: Faol</span>
                <button
                  onClick={() => {
                    setFromWalletId(wallet.id);
                    setIsTransferOpen(true);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  O'tkazish →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
                <span>Hamyonlararo O'tkazma</span>
              </h3>
              <button onClick={() => setIsTransferOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaysi hamyondan (Chiqim)
                </label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaysi hamyonga (Kirim)
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  O'tkazma Summasi (UZS)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {transferError && (
                <div className="text-xs text-rose-500 font-medium">
                  {transferError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {transferLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>O'tkazish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Yangi Hamyon Qo'shish</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hamyon Nomi
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masalan: Humo Anorbank, Naqd hamyon..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hamyon Turi
                </label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="card">Bank Plastik Kartasi (Card)</option>
                  <option value="cash">Naqd Pul (Cash)</option>
                  <option value="savings">Omonat / Jamg'arma (Savings)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Boshlang'ich Balans (UZS)
                </label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100"
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
                  <span>Qo'shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

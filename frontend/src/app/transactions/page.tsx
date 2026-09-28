"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { Transaction, api, formatCurrency, formatDate } from "@/lib/api";

const categories = [
  "Hammasi",
  "Oziq-ovqat",
  "Transport",
  "Kommunal",
  "Maosh",
  "Frilans",
  "Ko'ngilochar",
  "Salomatlik",
  "Kiyim-kechak",
  "Ta'lim",
  "Transfer",
  "Boshqa"
];

export default function TransactionsPage() {
  const { refreshTrigger, triggerRefresh, wallets } = useFinance();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("Hammasi");
  const [filterWallet, setFilterWallet] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Transaction Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newCategory, setNewCategory] = useState("Oziq-ovqat");
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newWalletId, setNewWalletId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const fetchTxs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getTransactions({
          type: filterType,
          category: filterCategory === "Hammasi" ? undefined : filterCategory,
          wallet_id: filterWallet,
        });
        setTransactions(data);
      } catch (err) {
        console.warn("Using sample txs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTxs();
  }, [refreshTrigger, filterType, filterCategory, filterWallet]);

  // Client-side search filter
  const filteredTxs = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      tx.category.toLowerCase().includes(q) ||
      (tx.wallet_name && tx.wallet_name.toLowerCase().includes(q))
    );
  });

  const totalIncome = filteredTxs.filter((t) => t.type === "income").reduce((acc, c) => acc + c.amount, 0);
  const totalExpense = filteredTxs.filter((t) => t.type === "expense").reduce((acc, c) => acc + c.amount, 0);

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatan ham ushbu tranzaksiyani o'chirmoqchimisiz? Hamyon balansi qayta hisoblanadi.")) return;
    try {
      await api.deleteTransaction(id);
      triggerRefresh();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Sana", "Tur", "Kategoriya", "Hamyon", "Miqdor (UZS)", "Tavsif"];
    const rows = filteredTxs.map((t) => [
      t.date,
      t.type === "income" ? "Kirim" : "Chiqim",
      t.category,
      t.wallet_name || "Noma'lum",
      t.amount,
      `"${(t.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tranzaksiyalar_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0) return;

    setAddLoading(true);
    try {
      await api.createTransaction({
        type: newType,
        category: newCategory,
        amount: newAmount,
        wallet_id: newWalletId || wallets[0]?.id,
        description: newDesc.trim() || newCategory,
        date: newDate,
      });
      setIsAddOpen(false);
      setNewAmount(0);
      setNewDesc("");
      triggerRefresh();
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Tranzaksiyalar Daftari
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Barcha kirim va chiqim operatsiyalarini filtrlash, tahlil qilish va eksport qilish.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'lda Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv (nomi, izoh)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">Barcha Turlar (Kirim & Chiqim)</option>
              <option value="income">Faqat Kirim (Daromad)</option>
              <option value="expense">Faqat Chiqim (Xarajat)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Kategoriya: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet Filter */}
          <div>
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">Barcha Hamyonlar</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Filtered Statistics Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-500">
            Topildi: <strong className="text-slate-800 dark:text-slate-200">{filteredTxs.length} ta</strong> tranzaksiya
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Sana</th>
                <th className="py-3.5 px-4">Tur</th>
                <th className="py-3.5 px-4">Kategoriya</th>
                <th className="py-3.5 px-4">Tavsif</th>
                <th className="py-3.5 px-4">Hamyon</th>
                <th className="py-3.5 px-6 text-right">Miqdor</th>
                <th className="py-3.5 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTxs.length > 0 ? (
                filteredTxs.map((tx) => {
                  const isIncome = tx.type === "income";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{isIncome ? "Kirim" : "Chiqim"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {tx.description || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {tx.wallet_name || "Noma'lum"}
                      </td>
                      <td
                        className={`py-3 px-6 text-right font-bold whitespace-nowrap ${
                          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="O'chirish"
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tranzaksiyalar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Yangi Tranzaksiya Qo'shish</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewType("expense")}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    newType === "expense"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Chiqim (Xarajat)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType("income")}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    newType === "income"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Kirim (Daromad)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Summa (UZS)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                  required
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategoriya
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                >
                  {categories.filter((c) => c !== "Hammasi").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hamyon
                </label>
                <select
                  value={newWalletId}
                  onChange={(e) => setNewWalletId(e.target.value)}
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
                  Tavsif (Izoh)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Xarid tafsiloti..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sana
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
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

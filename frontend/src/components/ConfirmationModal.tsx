"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  X, 
  Trash2, 
  Plus, 
  Wallet as WalletIcon, 
  ArrowDownRight, 
  ArrowUpRight, 
  Users, 
  Target,
  Sparkles,
  Loader2,
  Calendar
} from "lucide-react";
import { OperationItem, Wallet, formatCurrency, api } from "@/lib/api";

interface ConfirmationModalProps {
  isOpen: boolean;
  logId: string;
  rawText: string;
  initialOperations: OperationItem[];
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: () => void;
}

const categoriesList = [
  "Oziq-ovqat",
  "Transport",
  "Kommunal",
  "Maosh",
  "Frilans",
  "Ko'ngilochar",
  "Salomatlik",
  "Kiyim-kechak",
  "Ta'lim",
  "Boshqa"
];

export default function ConfirmationModal({
  isOpen,
  logId,
  rawText,
  initialOperations,
  wallets,
  onClose,
  onSuccess
}: ConfirmationModalProps) {
  const [operations, setOperations] = useState<OperationItem[]>(initialOperations);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateOp = (index: number, fields: Partial<OperationItem>) => {
    const updated = [...operations];
    updated[index] = { ...updated[index], ...fields };
    setOperations(updated);
  };

  const handleRemoveOp = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index));
  };

  const handleAddOp = () => {
    const newOp: OperationItem = {
      target_table: "transactions",
      type: "expense",
      amount: 10000,
      currency: "UZS",
      category: "Boshqa",
      description: "Qo'shimcha operatsiya",
      wallet_id: wallets[0]?.id
    };
    setOperations([...operations, newOp]);
  };

  const handleConfirm = async () => {
    if (operations.length === 0) {
      setErrorMsg("Kamida bitta operatsiya bo'lishi kerak");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.confirmOperations(logId, operations);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Operatsiyalarni saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                AI Operatsiyalarni Tasdiqlash
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI matndan quyidagi operatsiyalarni aniqladi. Ma'lumotlarni tekshiring yoki o'zgartiring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Raw text quote */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-2">
            <span className="font-semibold not-italic text-slate-400">Asl so'rov:</span>
            &ldquo;{rawText}&rdquo;
          </div>
        </div>

        {/* Operations list */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {operations.map((op, idx) => {
            const isExpense = op.type === "expense";
            const isIncome = op.type === "income";
            const isDebt = op.target_table === "debts";
            const isSavings = op.target_table === "savings_goals";

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500/30 transition-all space-y-3"
              >
                {/* Card Top Row: Type & Delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isExpense
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : isIncome
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : isDebt
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {isExpense && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isIncome && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {isDebt && <Users className="w-3.5 h-3.5" />}
                      {isSavings && <Target className="w-3.5 h-3.5" />}

                      {op.target_table === "transactions" && (isExpense ? "Chiqim" : "Kirim")}
                      {op.target_table === "debts" && (op.type === "lend" ? "Qarz berdim" : "Qarz oldim")}
                      {op.target_table === "savings_goals" && "Omonatga qo'shish"}
                    </span>

                    <span className="text-xs text-slate-400">Operatsiya #{idx + 1}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveOp(idx)}
                    title="Operatsiyani olib tashlash"
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Amount Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Miqdor (UZS)
                    </label>
                    <input
                      type="number"
                      value={op.amount}
                      onChange={(e) => handleUpdateOp(idx, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                    />
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(op.amount)}
                    </div>
                  </div>

                  {/* Category or Person Name Field */}
                  {isDebt ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Shaxs Ismi (Qarzdor)
                      </label>
                      <input
                        type="text"
                        value={op.person_name || ""}
                        onChange={(e) => handleUpdateOp(idx, { person_name: e.target.value })}
                        placeholder="Masalan: Jasur"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Toifa (Kategoriya)
                      </label>
                      <select
                        value={op.category || "Boshqa"}
                        onChange={(e) => handleUpdateOp(idx, { category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                      >
                        {categoriesList.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Wallet Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Hamyon / Hisob
                    </label>
                    <select
                      value={op.wallet_id || wallets[0]?.id || ""}
                      onChange={(e) => handleUpdateOp(idx, { wallet_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatCurrency(w.balance)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Tavsif (Izoh)
                    </label>
                    <input
                      type="text"
                      value={op.description || ""}
                      onChange={(e) => handleUpdateOp(idx, { description: e.target.value })}
                      placeholder="Izoh..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add another operation button */}
          <button
            type="button"
            onClick={handleAddOp}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yana operatsiya qo'shish</span>
          </button>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="px-6 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40">
            {errorMsg}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Jami: <span className="font-bold text-slate-800 dark:text-slate-200">{operations.length} ta</span> operatsiya tasdiqlanadi va hamyon balansi avtomatik hisoblanadi.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Bekor qilish
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || operations.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Bazaga yozilmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tasdiqlash & Bazaga Saqlash</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

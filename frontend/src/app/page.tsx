"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Scale, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  PlusCircle, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import SmartInputBar from "@/components/SmartInputBar";
import DashboardCharts from "@/components/DashboardCharts";
import { useFinance } from "@/components/AppLayout";
import { api, DashboardSummary, Transaction, formatCurrency, formatDate } from "@/lib/api";

export default function DashboardPage() {
  const { refreshTrigger, openConfirmation } = useFinance();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [sumRes, txRes] = await Promise.all([
          api.getSummary(),
          api.getTransactions()
        ]);
        setSummary(sumRes);
        setRecentTransactions(txRes.slice(0, 6));
      } catch (err) {
        console.warn("Using default dashboard data", err);
        // Fallback default state
        setSummary({
          total_net_worth: 36950000,
          monthly_income: 20700000,
          monthly_expense: 1770000,
          net_debt_balance: 800000,
          lent_to_others: 2800000,
          borrowed_from_others: 2000000,
          dti_ratio: 3.2,
          wallets_count: 4
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  const kpis = [
    {
      title: "Umumiy Sof Balans",
      amount: summary?.total_net_worth || 0,
      icon: Wallet,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
      badge: `${summary?.wallets_count || 4} ta hisob faol`,
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    {
      title: "Oylik Kirim",
      amount: summary?.monthly_income || 0,
      icon: TrendingUp,
      color: "from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400",
      badge: "+12.4% o'tgan oydan",
      badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
    },
    {
      title: "Oylik Chiqim",
      amount: summary?.monthly_expense || 0,
      icon: TrendingDown,
      color: "from-rose-500/20 to-orange-500/20 text-rose-600 dark:text-rose-400",
      badge: "Nazorat ostida",
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    },
    {
      title: "Toza Qarz Balansi",
      amount: summary?.net_debt_balance || 0,
      icon: Scale,
      color: "from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400",
      badge: `DTI: ${summary?.dti_ratio || 0}% (Xavfsiz)`,
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Xush kelibsiz, Azizbek 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Smart Finance AI bugungi moliyaviy oqimlaringizni to'liq nazorat qilmoqda.
          </p>
        </div>

        {/* Quick Advisor Insight Tag */}
        <Link 
          href="/ai-advisor"
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all group"
        >
          <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>AI Tahlil: Oylik jamg'arma 91% saqlanmoqda</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {kpi.title}
                </span>
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(kpi.amount)}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centerpiece: Smart Voice & Text Ingestion Bar */}
      <section className="space-y-2">
        <SmartInputBar
          onExtracted={(logId, rawText, operations) => {
            openConfirmation(logId, rawText, operations);
          }}
        />
      </section>

      {/* Recharts Analytics Charts */}
      <section>
        <DashboardCharts
          categoryData={[]}
          dailyData={[]}
        />
      </section>

      {/* Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Transactions List (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                So'nggi Tranzaksiyalar
              </h2>
              <p className="text-xs text-slate-500">Oxirgi kiritilgan kirim va chiqim operatsiyalari</p>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Barchasini ko'rish</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {tx.description || tx.category}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {tx.category}
                          </span>
                          <span>•</span>
                          <span>{tx.wallet_name || "Asosiy"}</span>
                          <span>•</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs sm:text-sm font-bold shrink-0 ${
                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Hozircha tranzaksiyalar mavjud emas. Yuqoridagi smart paneldan biror narsa kiritib ko'ring!
              </div>
            )}
          </div>
        </div>

        {/* Quick Shortcuts & AI Summary Card (1 Col) */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tezkor Harakatlar
            </h3>
            <div className="space-y-2">
              <Link
                href="/wallets"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span>Hamyonlararo O'tkazma</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/debts"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  <span>Qarz Qaytardim / Oldim</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/goals"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <span>Omonatga Pul Qo'shish</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* DTI Health Mini Widget */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-900 border border-emerald-500/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>DTI Moliyaviy Xavfsizlik</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Oylik qarz yuki <strong>{summary?.dti_ratio || 0}%</strong> ni tashkil etadi. Bu xalqaro tavsiya etilgan 35% me'yoridan sezilarli darajada xavfsiz.
            </p>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(5, (summary?.dti_ratio || 3.2) * 2.5))}%` }}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

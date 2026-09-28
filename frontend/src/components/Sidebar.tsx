"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowLeftRight, 
  Users, 
  Target, 
  Bot, 
  History,
  Sparkles,
  TrendingUp
} from "lucide-react";

const navItems = [
  { href: "/", label: "Boshqaruv Paneli", icon: LayoutDashboard },
  { href: "/wallets", label: "Hamyonlar & Kartalar", icon: Wallet },
  { href: "/transactions", label: "Tranzaksiyalar", icon: ArrowLeftRight },
  { href: "/debts", label: "Qarzlar Daftari", icon: Users },
  { href: "/goals", label: "Omonat & Maqsadlar", icon: Target },
  { href: "/ai-advisor", label: "AI Moliyachi Tahlili", icon: Bot, badge: "AI" },
  { href: "/logs", label: "Kiritish Tarixi", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 dark:from-white dark:via-emerald-400 dark:to-slate-200 bg-clip-text text-transparent">
              Smart Finance
            </div>
            <div className="text-[11px] font-medium tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
              <span>AI Moliyachi</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Quick Card */}
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-emerald-900/10 via-teal-900/5 to-transparent dark:from-emerald-950/40 dark:via-slate-900/60 border border-emerald-500/20">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Moliyaviy Maslahat</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Ovozli yoki matnli erkin kiritish orqali barcha tranzaksiyalarni bir zumda boshqaring.
        </p>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center ring-2 ring-emerald-500/20">
            AR
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Azizbek R.</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Premium Foydalanuvchi</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

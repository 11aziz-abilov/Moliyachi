"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Settings, Activity, ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/api";

interface HeaderProps {
  onOpenSettings: () => void;
  netWorth?: number;
}

export default function Header({ onOpenSettings, netWorth }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"connected" | "connecting" | "offline">("connecting");

  useEffect(() => {
    // Check initial dark mode
    const isDarkMode = localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Ping backend
    const checkBackend = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/summary", { cache: "no-store" });
        if (res.ok) setBackendStatus("connected");
        else setBackendStatus("offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left side: Backend connection badge & title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span className="relative flex h-2 w-2">
            {backendStatus === "connected" && (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            )}
            {backendStatus === "connecting" && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
            )}
            {backendStatus === "offline" && (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span className="text-[11px]">
            {backendStatus === "connected" && "FastAPI Backend: Faol"}
            {backendStatus === "connecting" && "Backend: Ulanmoqda..."}
            {backendStatus === "offline" && "Lokal Rejim (Offline)"}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ACID Tranzaksiyalar Himoyasi</span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {netWorth !== undefined && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Sof Balans:</span>
            <span>{formatCurrency(netWorth)}</span>
          </div>
        )}

        {/* Theme switch button */}
        <button
          onClick={toggleTheme}
          title="Mavzuni o'zgartirish (Dark / Light)"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="Sozlamalar va OpenAI API Kaliti"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Sozlamalar</span>
        </button>
      </div>
    </header>
  );
}

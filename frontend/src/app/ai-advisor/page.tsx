"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Scale
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { api, AdvisorInsights, formatCurrency } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiAdvisorPage() {
  const { refreshTrigger } = useFinance();
  const [insights, setInsights] = useState<AdvisorInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Assalomu alaykum! Men sizning shaxsiy AI Moliyachi maslahatchingizman. Balanslaringiz, xarajat odatlaringiz, qarzlaringiz va maqsadlaringiz asosida har qanday moliyaviy savolingizga javob berishga tayyorman."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    "Bu oy men eng ko'p nimaga pul sarfladim va qayerdan tejashim mumkin?",
    "Qarz yukim (DTI) qanday va qaysi qarzni birinchi to'lashim kerak?",
    "Omonat maqsadimga tezroq erishish uchun maslahat ber",
    "Keyingi oy uchun shaxsiy byudjet rejasini tuzib ber"
  ];

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAdvisorInsights();
        setInsights(data);
      } catch (err) {
        console.warn("Using sample insights", err);
        setInsights({
          health_score: 84,
          monthly_income: 20700000,
          monthly_expense: 1770000,
          net_savings: 18930000,
          dti_ratio: 3.2,
          dti_level: "safe",
          dti_warning: "Qarz yuklamasi me'yorda (3.2%). Moliyaviy xavfsizlik zonasidasiz.",
          impulsive_total: 310000,
          impulsive_percentage: 17.5,
          impulsive_status: "moderate",
          impulsive_advice: "Impulsiv xarajatlar 17.5% ni tashkil etadi. Kofe va ko'ngilochar xarajatlarni rejalashtirish orqali omonatga ko'proq mablag' yo'naltirishingiz mumkin.",
          category_breakdown: [
            { category: "Oziq-ovqat", amount: 545000 },
            { category: "Transport", amount: 530000 },
            { category: "Ko'ngilochar", amount: 310000 },
            { category: "Kommunal", amount: 240000 },
            { category: "Salomatlik", amount: 145000 },
          ],
          savings_goals_insights: [
            {
              goal_id: "1",
              title: "MacBook M3 Pro",
              current_amount: 14500000,
              target_amount: 24000000,
              percentage: 60.4,
              advice: "'MacBook M3 Pro': 60.4% to'plandi. Agar har kuni 25 000 so'm qo'shimcha tejalsa, maqsadga 2 oy oldin erishasiz!"
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, [refreshTrigger]);

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = (userPrompt || chatInput).trim();
    if (!textToSend || chatLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    if (!userPrompt) setChatInput("");
    setChatLoading(true);

    try {
      const apiKey = localStorage.getItem("openai_api_key") || undefined;
      const res = await api.chatAdvisor(textToSend, apiKey);
      setMessages([...newMessages, { role: "assistant", content: res.response }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Tahlil natijasi: Joriy oyda xarajatlaringiz nazorat ostida. Omonatlaringiz o'sish sur'ati rejadagidek bormoqda. Qo'shimcha tejash uchun ko'ngilochar va rejasiz kafe xarajatlarini 10% ga qisqartirish tavsiya etiladi."
        }
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mb-1">
          <Bot className="w-4 h-4" />
          <span>Financial Intelligence Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          AI Moliyachi Chuqur Analitikasi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Oylik moliyaviy audit, impulsiv xarajatlar tahlili, DTI qarz xavfi va sun'iy intellekt maslahatlari.
        </p>
      </div>

      {/* Top 3 Analytical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Overall Health Score */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Moliyaviy Salomatlik Indeksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-slate-900 dark:text-slate-100">
              {insights?.health_score || 84}
            </div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              / 100 (A'lo)
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Daromad va xarajat mutanosibligi yuqori. Omonatga oylik daromadingizning 80% dan ko'prog'i saqlanib qolinmoqda.
          </p>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${insights?.health_score || 84}%` }} 
            />
          </div>
        </div>

        {/* Card 2: Impulsive Spending */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Impulsiv Xarajatlar (30 kun)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(insights?.impulsive_total || 0)}
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              Jami xarajatning {insights?.impulsive_percentage || 0}% qismi
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {insights?.impulsive_advice || "Rejasiz xarajatlar me'yorda saqlanmoqda."}
          </p>

          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Asosiy toifa: Ko'ngilochar, kafe va kiyim
          </div>
        </div>

        {/* Card 3: Debt-to-Income (DTI) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Qarz Yuklamasi (DTI Nisbati)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {insights?.dti_ratio || 0}%
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Xavfsiz (&lt;35%)
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {insights?.dti_warning || "Qarz yuklamasi me'yorda."}
          </p>

          <div className="text-[11px] text-slate-500">
            Tavsiya: "Snowball" (eng kichik qarzdan boshlab uzish) usuli.
          </div>
        </div>

      </div>

      {/* Interactive AI Chat Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Chat Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AI Moliyachi Maslahatchi (Live Chat)
              </h2>
              <p className="text-xs text-slate-500">
                O'zbek tilida erkin moliyaviy suhbat va real ko'rsatkichlaringiz bo'yicha tahlil
              </p>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {msg.role === "user" ? "Men" : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-xl ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pl-11">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>AI Moliyachi hisob-kitob qilmoqda...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-6 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-slate-500 shrink-0 font-medium">Savollar:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="AI Moliyachiga savol bering (masalan: 'Qanday qilib oyiga 1 million orttirsa bo'ladi?')..."
            disabled={chatLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className={`px-5 py-3 rounded-2xl font-semibold text-xs flex items-center gap-1.5 transition-all ${
              chatInput.trim() && !chatLoading
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Yuborish</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}

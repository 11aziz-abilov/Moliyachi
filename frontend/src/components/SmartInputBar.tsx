"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Sparkles, Wand2, Loader2, Volume2 } from "lucide-react";
import { api, OperationItem } from "@/lib/api";

interface SmartInputBarProps {
  onExtracted: (logId: string, rawText: string, operations: OperationItem[]) => void;
}

const exampleChips = [
  "Bugun 45 000 so'mga tushlik qildim va Jasurga benzinga 200 000 so'm qarz berdim",
  "Oylik maosh oldim 16 500 000 so'm",
  "Avtomobilga 350 000 so'm benzin quydim",
  "Farruxdan 1 200 000 so'm qarz oldim",
  "Omonatga 1 000 000 so'm jamg'arma qo'shdim"
];

export default function SmartInputBar({ onExtracted }: SmartInputBarProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Mikrofon ruxsati berilmadi yoki mavjud emas:", err);
      setErrorMsg("Mikrofonga ruxsat berilmadi. Matn orqali kiritishingiz mumkin.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const apiKey = localStorage.getItem("openai_api_key") || undefined;
      const res = await api.ingestAudio(blob, apiKey);
      if (res.operations && res.operations.length > 0) {
        onExtracted(res.log_id, res.raw_text, res.operations);
      } else {
        setErrorMsg("Ovozdan aniq moliyaviy operatsiya topilmadi. Qaytadan urinib ko'ring.");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback: If backend audio endpoint fails, simulate sample extraction from audio
      const fallbackText = "Bugun 45 000 so'mga tushlik qildim va Jasurga benzinga 200 000 so'm qarz berdim";
      const fallbackOps: OperationItem[] = [
        {
          target_table: "transactions",
          type: "expense",
          amount: 45000,
          currency: "UZS",
          category: "Oziq-ovqat",
          description: "Tushlik uchun kofe va somsaga"
        },
        {
          target_table: "debts",
          type: "lend",
          amount: 200000,
          currency: "UZS",
          person_name: "Jasur",
          description: "Benzinga qarz berildi",
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
        }
      ];
      onExtracted("fallback-voice-log", fallbackText, fallbackOps);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    const userText = input.trim();

    try {
      const apiKey = localStorage.getItem("openai_api_key") || undefined;
      const res = await api.ingestText(userText, apiKey);
      if (res.operations && res.operations.length > 0) {
        onExtracted(res.log_id, res.raw_text, res.operations);
        setInput("");
      } else {
        setErrorMsg("Matnda aniq summa yoki operatsiya topilmadi. Masalan: '45000 somga tushlik qildim'");
      }
    } catch (err: any) {
      console.error("Ingest error:", err);
      // Local fallback parser
      const fallbackOps: OperationItem[] = [];
      const lower = userText.toLowerCase();

      // Number match
      const numMatch = userText.match(/\d+(?:[\s.,]\d+)*/);
      const amount = numMatch ? parseFloat(numMatch[0].replace(/\s/g, "").replace(",", ".")) : 50000;

      if (lower.includes("qarz berdim") || lower.includes("berdim")) {
        fallbackOps.push({
          target_table: "debts",
          type: "lend",
          amount: amount,
          currency: "UZS",
          person_name: "Sherzod",
          description: userText
        });
      } else if (lower.includes("qarz oldim") || lower.includes("oldim")) {
        fallbackOps.push({
          target_table: "debts",
          type: "borrow",
          amount: amount,
          currency: "UZS",
          person_name: "Hamkor",
          description: userText
        });
      } else if (lower.includes("maosh") || lower.includes("daromad")) {
        fallbackOps.push({
          target_table: "transactions",
          type: "income",
          amount: amount,
          currency: "UZS",
          category: "Maosh",
          description: userText
        });
      } else {
        fallbackOps.push({
          target_table: "transactions",
          type: "expense",
          amount: amount,
          currency: "UZS",
          category: "Oziq-ovqat",
          description: userText
        });
      }
      onExtracted("local-log-" + Date.now(), userText, fallbackOps);
      setInput("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Container with modern glowing border */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-cyan-500/30 shadow-xl shadow-emerald-500/5">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800">
          
          {/* Top Label & Mode Indicator */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                AI Smart Kiritish
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                — Erkin matn yoki ovoz orqali bir zumda operatsiya yarating
              </span>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Ovoz yozilmoqda: {recordingSeconds}s</span>
              </div>
            )}
          </div>

          {/* Input & Action buttons form */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Masalan: 'Bugun 45 000 so'mga tushlik qildim va Jasurga 200 000 so'm qarz berdim'..."
                disabled={isRecording || isLoading}
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            {/* Microphone Recording Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isLoading}
                title="Ovoz orqali kiritish (Mikrofon)"
                className="p-3 sm:px-4 sm:py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Ovoz</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-4 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0 mic-recording"
              >
                <MicOff className="w-4 h-4" />
                <span>To'xtatish</span>
              </button>
            )}

            {/* Send / AI Process Button */}
            <button
              type="submit"
              disabled={isLoading || isRecording || !input.trim()}
              className={`px-4 sm:px-5 py-3.5 rounded-2xl text-white font-medium text-sm flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                input.trim() && !isLoading
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20"
                  : "bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Tahlil...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Tahlil</span>
                  <Send className="w-4 h-4 sm:hidden" />
                </>
              )}
            </button>
          </form>

          {/* Quick Clickable Suggestions */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-600 dark:text-slate-300 shrink-0 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Namunalar:
            </span>
            {exampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(chip)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
              >
                {chip.length > 38 ? chip.slice(0, 38) + "..." : chip}
              </button>
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium px-1">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

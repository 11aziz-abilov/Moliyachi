"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Mic, 
  Type, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Code2, 
  X,
  FileText
} from "lucide-react";
import { useFinance } from "@/components/AppLayout";
import { InputLog, api, formatDate } from "@/lib/api";

export default function LogsPage() {
  const { refreshTrigger } = useFinance();
  const [logs, setLogs] = useState<InputLog[]>([]);
  const [selectedJson, setSelectedJson] = useState<{ title: string; json: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getInputLogs();
        setLogs(data);
      } catch (err) {
        console.warn("Using sample logs", err);
        setLogs([
          {
            id: "1",
            input_type: "voice",
            raw_content: "Bugun 45 000 so'mga tushlik qildim va Jasurga benzinga 200 000 so'm qarz berdim",
            parsed_json: {
              operations: [
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
                  description: "Benzinga qarz berildi"
                }
              ]
            },
            status: "confirmed",
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [refreshTrigger]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Kiritish Tarixi & AI Loglar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ovozli va matnli barcha so'rovlar, Whisper transkripsiyalari va LLM strukturalash arxivi.
        </p>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Sana</th>
                <th className="py-3.5 px-4">Kiritish Turi</th>
                <th className="py-3.5 px-4">Asl Mazmun (Raw Content)</th>
                <th className="py-3.5 px-4">Holati</th>
                <th className="py-3.5 px-6 text-center">Strukturalangan JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isVoice = log.input_type === "voice";
                  const isConfirmed = log.status === "confirmed";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 text-slate-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {isVoice ? (
                            <>
                              <Mic className="w-3.5 h-3.5 text-rose-500" />
                              <span>Ovozli</span>
                            </>
                          ) : (
                            <>
                              <Type className="w-3.5 h-3.5 text-teal-500" />
                              <span>Matnli</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-md">
                        &ldquo;{log.raw_content}&rdquo;
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isConfirmed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isConfirmed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tasdiqlangan</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Kutilmoqda</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-center">
                        <button
                          onClick={() => setSelectedJson({ title: log.raw_content, json: log.parsed_json })}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                        >
                          <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>JSON Ko'rish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Kiritish loglari hozircha mavjud emas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>LLM Chiqargan JSON Operatsiyalari</span>
              </h3>
              <button onClick={() => setSelectedJson(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
              &ldquo;{selectedJson.title}&rdquo;
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
              {JSON.stringify(selectedJson.json, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJson(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";
import { formatCurrency } from "@/lib/api";

interface DashboardChartsProps {
  categoryData: { category: string; amount: number }[];
  dailyData: { day: string; amount: number }[];
}

const COLORS = [
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

export default function DashboardCharts({ categoryData, dailyData }: DashboardChartsProps) {
  const formattedCategoryData = categoryData.length > 0 
    ? categoryData 
    : [
        { category: "Oziq-ovqat", amount: 545000 },
        { category: "Transport", amount: 530000 },
        { category: "Kommunal", amount: 240000 },
        { category: "Ko'ngilochar", amount: 310000 },
        { category: "Salomatlik", amount: 145000 },
      ];

  const formattedDailyData = dailyData.length > 0 
    ? dailyData 
    : [
        { day: "Dush", amount: 145000 },
        { day: "Sesh", amount: 240000 },
        { day: "Chor", amount: 350000 },
        { day: "Pay", amount: 180000 },
        { day: "Juma", amount: 480000 },
        { day: "Shan", amount: 375000 },
        { day: "Yak", amount: 220000 },
      ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Category Donut Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Xarajatlar Taqsimoti (Kategoriyalar)
            </h3>
            <p className="text-xs text-slate-500">Oylik xarajatlar toifalari nisbati</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Donut Tahlil
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedCategoryData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
              >
                {formattedCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), "Summa"]}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {formattedCategoryData.slice(0, 6).map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-slate-600 dark:text-slate-400 truncate">{item.category}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Spending Bar Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Kunlik Xarajatlar Dinamikasi
            </h3>
            <p className="text-xs text-slate-500">Haftalik xarajatlar tebranishi</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            Haftalik Bar
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), "Xarajat"]}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
          Kunlik o'rtacha xarajat: <strong className="text-slate-800 dark:text-slate-200">
            {formatCurrency(
              formattedDailyData.reduce((acc, curr) => acc + curr.amount, 0) / (formattedDailyData.length || 1)
            )}
          </strong>
        </div>
      </div>

    </div>
  );
}

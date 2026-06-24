"use client";

import { useRouter, usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function CenterReportPeriodSelector({ mode, period }: { mode: "month" | "year"; period: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(value: string) {
    router.push(`${pathname}?period=${value}`);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const monthValue = mode === "month" ? period : `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearValue = mode === "year" ? period : String(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="rounded-xl border border-gold-200 bg-cream-50 px-3 py-3">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="h-4 w-4 text-gold-600" />
        <span className="text-xs font-semibold text-gold-700">ช่วงเวลารายงาน</span>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => go(monthValue)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${mode === "month" ? "bg-gold-600 text-white" : "bg-white text-gold-600 border border-gold-200"}`}
        >
          รายเดือน
        </button>
        <button
          type="button"
          onClick={() => go(yearValue)}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors ${mode === "year" ? "bg-gold-600 text-white" : "bg-white text-gold-600 border border-gold-200"}`}
        >
          รายปี
        </button>
      </div>

      {mode === "month" ? (
        <input
          type="month"
          value={monthValue}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="w-full rounded-lg border border-gold-300 bg-white px-3 py-2 text-sm text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      ) : (
        <select
          value={yearValue}
          onChange={(e) => go(e.target.value)}
          className="w-full rounded-lg border border-gold-300 bg-white px-3 py-2 text-sm text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
        >
          {years.map((y) => (
            <option key={y} value={String(y)}>
              ปี พ.ศ. {y + 543}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

const MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function daysInMonth(month: number, beYear: number): number {
  if (!month || !beYear) return 31;
  const ceYear = beYear - 543;
  return new Date(ceYear, month, 0).getDate();
}

interface Props {
  /** CE ISO string "YYYY-MM-DD" stored in DB */
  value: string;
  /** Called with CE ISO string "YYYY-MM-DD" */
  onChange: (iso: string) => void;
  required?: boolean;
}

/** Converts CE ISO date from DB → display state */
function fromISO(iso: string) {
  if (!iso) return { day: 0, month: 0, beYear: 0 };
  const [y, m, d] = iso.split("-").map(Number);
  return { day: d || 0, month: m || 0, beYear: (y || 0) + 543 };
}

/** Converts user selections → CE ISO string */
function toISO(day: number, month: number, beYear: number): string {
  if (!day || !month || !beYear) return "";
  const ceYear = beYear - 543;
  return `${ceYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const sel =
  "px-2 py-2.5 rounded-xl border border-gold-200 bg-white text-gold-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 appearance-none";

export default function ThaiDateInput({ value, onChange, required }: Props) {
  const init = fromISO(value);
  const [day, setDay]       = useState(init.day);
  const [month, setMonth]   = useState(init.month);
  const [beYear, setBeYear] = useState(init.beYear);

  // Sync when parent resets value
  useEffect(() => {
    const p = fromISO(value);
    setDay(p.day);
    setMonth(p.month);
    setBeYear(p.beYear);
  }, [value]);

  function emit(d: number, m: number, y: number) {
    const iso = toISO(d, m, y);
    if (iso) onChange(iso);
  }

  const maxDay = daysInMonth(month, beYear);
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <div className="flex gap-1.5 items-center">
      {/* Day */}
      <select
        value={day || ""}
        onChange={e => { const v = Number(e.target.value); setDay(v); emit(v, month, beYear); }}
        className={`${sel} w-[64px] text-center`}
        required={required}
      >
        <option value="">วัน</option>
        {dayOptions.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={month || ""}
        onChange={e => { const v = Number(e.target.value); setMonth(v); emit(day, v, beYear); }}
        className={`${sel} flex-1`}
        required={required}
      >
        <option value="">เดือน</option>
        {MONTHS.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>

      {/* BE Year */}
      <div className="relative">
        <input
          type="number"
          value={beYear || ""}
          onChange={e => {
            const v = Number(e.target.value);
            setBeYear(v);
            emit(day, month, v);
          }}
          placeholder="พ.ศ."
          min={2440}
          max={2700}
          className={`${sel} w-[90px] text-center pr-8`}
          required={required}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gold-400 pointer-events-none">พ.ศ.</span>
      </div>
    </div>
  );
}

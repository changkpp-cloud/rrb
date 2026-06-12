"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Download } from "lucide-react";

type Props = {
  geoLevel: string; geoVal: string; period: string; type: string;
  geoOptions: {
    regions: string[];
    provinces: string[];
    amphoes: string[];
    centers: { id: string; name: string }[];
  };
};

const GEO_LEVELS = [
  { v: "country", l: "ทั้งประเทศ" }, { v: "region", l: "ภาค" },
  { v: "province", l: "จังหวัด" }, { v: "amphoe", l: "อำเภอ" },
  { v: "center", l: "ศูนย์" },
];
const PERIODS = [
  { v: "all", l: "ทั้งหมด" }, { v: "year", l: "ปีนี้" },
  { v: "6m", l: "6 เดือน" }, { v: "3m", l: "3 เดือน" },
  { v: "1m", l: "เดือนนี้" }, { v: "week", l: "สัปดาห์" },
  { v: "q1", l: "ไตรมาส 1" }, { v: "q2", l: "ไตรมาส 2" },
  { v: "q3", l: "ไตรมาส 3" }, { v: "q4", l: "ไตรมาส 4" },
];
const TYPES = [
  { v: "overview", l: "ภาพรวม" }, { v: "esg", l: "ESG" },
  { v: "centers", l: "ศูนย์" }, { v: "hosts", l: "เจ้าภาพ" },
  { v: "finance", l: "การเงิน" },
];

export default function AnalyticsFilters({ geoLevel: ig, geoVal: iv, period: ip, type: it, geoOptions }: Props) {
  const [geoLevel, setGeoLevel] = useState(ig);
  const [geoVal, setGeoVal] = useState(iv);
  const [period, setPeriod] = useState(ip);
  const [type, setType] = useState(it);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function apply() {
    const p = new URLSearchParams({ geoLevel, period, type });
    if (geoVal && geoLevel !== "country") p.set("geo", geoVal);
    router.push(`/dashboard/admin/analytics?${p.toString()}`);
    setOpen(false);
  }

  const exportUrl = `/api/admin/export?geoLevel=${geoLevel}&geo=${geoVal}&period=${period}&type=${type}`;

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold-600" />
          <span className="text-sm font-semibold text-gold-800">ตัวกรองรายงาน</span>
          <span className="text-[10px] text-gold-500">
            {GEO_LEVELS.find(g => g.v === ig)?.l} · {PERIODS.find(p => p.v === ip)?.l} · {TYPES.find(t => t.v === it)?.l}
          </span>
        </div>
        <span className="text-xs text-gold-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gold-100 pt-3">

          {/* ─ Geo level ─ */}
          <div>
            <p className="text-[10px] font-semibold text-gold-600 mb-1.5">ระดับพื้นที่</p>
            <div className="flex flex-wrap gap-1.5">
              {GEO_LEVELS.map(({ v, l }) => (
                <button key={v} onClick={() => { setGeoLevel(v); setGeoVal(""); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    geoLevel === v ? "bg-gold-700 text-white border-gold-700" : "bg-white text-gold-600 border-gold-300 hover:bg-gold-50"
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* ─ Geo value selector ─ */}
          {geoLevel !== "country" && (
            <div>
              <p className="text-[10px] font-semibold text-gold-600 mb-1.5">เลือก{GEO_LEVELS.find(g => g.v === geoLevel)?.l}</p>
              <select value={geoVal} onChange={e => setGeoVal(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl gold-border bg-white text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400">
                <option value="">ทั้งหมด</option>
                {geoLevel === "region" && geoOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
                {geoLevel === "province" && geoOptions.provinces.map(p => <option key={p} value={p}>{p}</option>)}
                {geoLevel === "amphoe" && geoOptions.amphoes.map(a => <option key={a} value={a}>{a}</option>)}
                {geoLevel === "center" && geoOptions.centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* ─ Period ─ */}
          <div>
            <p className="text-[10px] font-semibold text-gold-600 mb-1.5">ช่วงเวลา</p>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map(({ v, l }) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    period === v ? "bg-gold-700 text-white border-gold-700" : "bg-white text-gold-600 border-gold-300 hover:bg-gold-50"
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* ─ Report type ─ */}
          <div>
            <p className="text-[10px] font-semibold text-gold-600 mb-1.5">ประเภทรายงาน</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(({ v, l }) => (
                <button key={v} onClick={() => setType(v)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    type === v ? "bg-gold-700 text-white border-gold-700" : "bg-white text-gold-600 border-gold-300 hover:bg-gold-50"
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          {/* ─ Actions ─ */}
          <div className="flex gap-2 pt-1">
            <button onClick={apply}
              className="flex-1 gold-gradient text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-all">
              แสดงรายงาน
            </button>
            <a href={exportUrl} download="report.csv"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gold-400 text-gold-700 text-xs font-semibold hover:bg-gold-50 transition-colors whitespace-nowrap">
              <Download className="w-3.5 h-3.5" />
              CSV
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

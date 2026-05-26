"use client";

import Link from "next/link";
import { ArrowLeft, Monitor, Printer, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState } from "react";

type EquipmentItem = {
  id: string;
  type: "board" | "printer";
  name: string;
  location: string;
  status: "active" | "maintenance" | "offline";
  last_checked: string;
};

const DEMO_EQUIPMENT: EquipmentItem[] = [
  { id: "1", type: "board", name: "บอร์ดแสดงชื่อ A", location: "ห้องโถง 1", status: "active", last_checked: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", type: "board", name: "บอร์ดแสดงชื่อ B", location: "ห้องโถง 2", status: "active", last_checked: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", type: "printer", name: "เครื่องพิมพ์ 1", location: "ห้องควบคุม", status: "active", last_checked: new Date(Date.now() - 1800000).toISOString() },
  { id: "4", type: "printer", name: "เครื่องพิมพ์ 2 (สำรอง)", location: "คลังอุปกรณ์", status: "maintenance", last_checked: new Date(Date.now() - 86400000).toISOString() },
];

const STATUS_LABELS: Record<string, string> = {
  active: "ใช้งานได้", maintenance: "ซ่อมบำรุง", offline: "ออฟไลน์",
};
const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 border-emerald-200",
  maintenance: "text-amber-700 bg-amber-50 border-amber-200",
  offline: "text-red-600 bg-red-50 border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(DEMO_EQUIPMENT);
  const [updating, setUpdating] = useState<string | null>(null);

  const boards = equipment.filter(e => e.type === "board");
  const printers = equipment.filter(e => e.type === "printer");
  const activeCount = equipment.filter(e => e.status === "active").length;
  const maintenanceCount = equipment.filter(e => e.status === "maintenance").length;

  function cycleStatus(id: string) {
    setUpdating(id);
    setTimeout(() => {
      setEquipment(prev => prev.map(e => {
        if (e.id !== id) return e;
        const next: Record<string, EquipmentItem["status"]> = { active: "maintenance", maintenance: "offline", offline: "active" };
        return { ...e, status: next[e.status], last_checked: new Date().toISOString() };
      }));
      setUpdating(null);
    }, 500);
  }

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard/center" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">จัดการอุปกรณ์</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Equipment</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-3 py-3 text-center">
            <p className="text-xl font-bold text-gold-800">{equipment.length}</p>
            <p className="text-[9px] text-gold-500">ทั้งหมด</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl card-shadow px-3 py-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
            <p className="text-[9px] text-emerald-600">ใช้งานได้</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl card-shadow px-3 py-3 text-center">
            <p className="text-xl font-bold text-amber-700">{maintenanceCount}</p>
            <p className="text-[9px] text-amber-600">ซ่อมบำรุง</p>
          </div>
        </div>

        {/* Boards */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Monitor className="w-4 h-4 text-gold-500" />
            <p className="text-xs font-bold text-gold-700 uppercase tracking-wider">บอร์ดแสดงชื่อ</p>
          </div>
          {boards.map(e => (
            <EquipmentCard key={e.id} item={e} updating={updating === e.id} onCycle={() => cycleStatus(e.id)} />
          ))}
        </div>

        {/* Printers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Printer className="w-4 h-4 text-gold-500" />
            <p className="text-xs font-bold text-gold-700 uppercase tracking-wider">เครื่องพิมพ์</p>
          </div>
          {printers.map(e => (
            <EquipmentCard key={e.id} item={e} updating={updating === e.id} onCycle={() => cycleStatus(e.id)} />
          ))}
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
}

function EquipmentCard({ item, updating, onCycle }: { item: EquipmentItem; updating: boolean; onCycle: () => void }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0">
        {item.type === "board" ? <Monitor className="w-5 h-5 text-gold-600" /> : <Printer className="w-5 h-5 text-gold-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gold-800 leading-tight">{item.name}</p>
        <p className="text-[10px] text-gold-500">{item.location}</p>
        <p className="text-[9px] text-gold-400 mt-0.5">ตรวจล่าสุด: {formatDate(item.last_checked)}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-[9px] font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        <button
          onClick={onCycle}
          disabled={updating}
          className="flex items-center gap-1 text-[10px] text-gold-500 hover:text-gold-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${updating ? "animate-spin" : ""}`} />
          อัปเดต
        </button>
      </div>
    </div>
  );
}

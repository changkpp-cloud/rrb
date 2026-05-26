"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState } from "react";
import type { Donation } from "@/lib/supabase/types";

const DEMO_PENDING: Donation[] = [
  { id: "2", memorial_id: "demo", donor_name: "นางสาวมาลี รักดี", donor_title: null, amount: 300, message: "ด้วยความอาลัย", slip_url: null, status: "pending", nameplate_status: "pending", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "5", memorial_id: "demo", donor_name: "นายอนุชา สมบัติ", donor_title: null, amount: 500, message: "ขอแสดงความเสียใจอย่างสุดซึ้ง", slip_url: null, status: "pending", nameplate_status: "pending", created_at: new Date(Date.now() - 1800000).toISOString() },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SlipsPage() {
  const [items, setItems] = useState<(Donation & { decided?: "confirmed" | "rejected" })[]>(DEMO_PENDING);

  function decide(id: string, status: "confirmed" | "rejected") {
    setItems(prev => prev.map(d => d.id === id ? { ...d, decided: status } : d));
  }

  const pending = items.filter(d => !d.decided);
  const decided = items.filter(d => d.decided);

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text tracking-wide">ยืนยันสลิป</p>
              <p className="text-[9px] text-gold-500 tracking-widest uppercase -mt-0.5">Slip Review</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Pending count */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gold-700">รอการยืนยัน</p>
          <span className="text-lg font-bold text-gold-800">{pending.length} <span className="text-xs font-normal text-gold-500">รายการ</span></span>
        </div>

        {/* Pending slips */}
        {pending.length === 0 && (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gold-700">ไม่มีสลิปรอตรวจสอบ</p>
            <p className="text-xs text-gold-400 mt-1">สลิปทั้งหมดได้รับการตรวจสอบแล้ว</p>
          </div>
        )}

        {pending.map(d => (
          <div key={d.id} className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gold-800">{d.donor_name}</p>
                <p className="text-xs text-gold-500 mt-0.5">{formatDate(d.created_at)}</p>
              </div>
              <p className="text-lg font-bold text-gold-700">{d.amount.toLocaleString()} ฿</p>
            </div>

            {d.message && (
              <p className="text-xs text-gold-600 bg-cream-100 rounded-xl px-3 py-2">{d.message}</p>
            )}

            {/* Slip image placeholder */}
            <div className="w-full h-36 rounded-xl border-2 border-dashed border-gold-200 bg-cream-100 flex flex-col items-center justify-center gap-1 text-gold-300">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">{d.slip_url ? "ดูสลิป" : "ไม่มีรูปสลิป"}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => decide(d.id, "rejected")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 active:scale-[0.98] transition-all"
              >
                <XCircle className="w-4 h-4" />
                ปฏิเสธ
              </button>
              <button
                onClick={() => decide(d.id, "confirmed")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                ยืนยัน
              </button>
            </div>
          </div>
        ))}

        {/* Already decided */}
        {decided.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gold-500 px-1">ดำเนินการแล้ว</p>
            {decided.map(d => (
              <div key={d.id} className="bg-cream-50 rounded-2xl gold-border px-4 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm font-medium text-gold-700">{d.donor_name}</p>
                  <p className="text-xs text-gold-400">{d.amount.toLocaleString()} บาท</p>
                </div>
                {d.decided === "confirmed" ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                    <XCircle className="w-3 h-3" /> ปฏิเสธ
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="h-2" />
      </main>
    </div>
  );
}

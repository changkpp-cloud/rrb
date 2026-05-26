"use client";

import Link from "next/link";
import { ArrowLeft, Download, Users } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import type { Donation } from "@/lib/supabase/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
}

export default function HostSummaryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [memorialName, setMemorialName] = useState("งานมงคล");
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const [donRes, memRes] = await Promise.all([
          fetch(`/api/donations?memorial_id=${id}`),
          fetch(`/api/memorial?id=${id}`),
        ]);
        const donData = await donRes.json();
        const memData = await memRes.json();
        setDonations(Array.isArray(donData) ? donData.filter((d: Donation) => d.status === "confirmed") : []);
        if (memData?.name) setMemorialName(memData.name);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  const total = donations.reduce((s, d) => s + d.amount, 0);
  const fee = donations.length * 100;
  const net = Math.max(0, total - fee);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200 print:hidden">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href={`/dashboard/host/${id}`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">สรุปพิธีกร</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">MC Summary</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <button onClick={handlePrint} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gold-400 text-sm">กำลังโหลด...</div>
        ) : (
          <div ref={printRef} className="space-y-4">

            {/* Print header */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
              <p className="text-xs text-gold-500 uppercase tracking-wider mb-1">สรุปรายชื่อผู้ร่วมบุญ</p>
              <p className="text-lg font-bold text-gold-800">{memorialName}</p>
              <p className="text-[10px] text-gold-400 mt-1">พิมพ์วันที่ {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>

            {/* Financial summary */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4">
              <p className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-3">สรุปยอดเงิน</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gold-600">ยอดร่วมบุญรวม</span>
                  <span className="font-bold text-gold-800">{total.toLocaleString()} ฿</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gold-600">ค่าดำเนินการ ({donations.length} ราย × 100 ฿)</span>
                  <span className="font-bold text-red-500">-{fee.toLocaleString()} ฿</span>
                </div>
                <div className="border-t border-gold-200 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-gold-700">สุทธิเจ้าภาพรับ</span>
                  <span className="font-bold text-emerald-700 text-base">{net.toLocaleString()} ฿</span>
                </div>
              </div>
            </div>

            {/* Donor table */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">รายชื่อผู้ร่วมบุญ</p>
                <div className="flex items-center gap-1 text-xs text-gold-500">
                  <Users className="w-3 h-3" />
                  <span>{donations.length} ราย</span>
                </div>
              </div>
              <div className="space-y-0">
                {donations.map((d, i) => (
                  <div key={d.id} className={`flex items-start gap-3 py-2.5 ${i < donations.length - 1 ? "border-b border-gold-100" : ""}`}>
                    <span className="text-[11px] font-semibold text-gold-400 w-6 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
                      {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
                      {d.message && <p className="text-[10px] text-gold-400 italic">"{d.message}"</p>}
                    </div>
                    <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p className="text-sm text-gold-400 text-center py-6">ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว</p>
                )}
              </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-[10px] text-gold-400 pb-2">
              เอกสารนี้ออกโดยระบบหรีดร่วมบุญ · ใช้สำหรับพิธีกรอ่านรายชื่อ
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

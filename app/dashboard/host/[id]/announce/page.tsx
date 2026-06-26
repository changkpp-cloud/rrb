"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Mic } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import type { Donation } from "@/lib/supabase/types";

export default function HostAnnouncePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [memorialName, setMemorialName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [donRes, memRes] = await Promise.all([
          fetch(`/api/donations?memorial_id=${id}`),
          fetch(`/api/memorial?id=${id}`),
        ]);
        const donData = await donRes.json();
        const memData = await memRes.json();
        setDonations(
          Array.isArray(donData)
            ? donData.filter((d: Donation) => d.status === "confirmed")
            : []
        );
        if (memData?.name) setMemorialName(memData.name);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  // oldest first (ลำดับตามที่ร่วมบุญ)
  const ordered = [...donations].reverse();

  return (
    <div className="min-h-screen bg-white">
      {/* Header — hidden on print */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200 print:hidden">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">รายชื่อสำหรับพิธีกร</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Announce List</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <button
            onClick={() => window.print()}
            className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-gold-400 text-sm">กำลังโหลด...</div>
        ) : (
          <>
            {/* Title card */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center print:border print:rounded-none print:shadow-none">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Mic className="w-4 h-4 text-gold-500 print:hidden" />
                <p className="text-xs text-gold-500 uppercase tracking-wider">รายชื่อผู้มอบหรีดร่วมบุญ</p>
              </div>
              {memorialName && (
                <p className="text-lg font-bold text-gold-800">งานพระราชทานเพลิงศพ {memorialName}</p>
              )}
              <p className="text-[10px] text-gold-400 mt-1">
                รวม {ordered.length} ราย · พิมพ์วันที่{" "}
                {new Date().toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Name list */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 print:border print:rounded-none print:shadow-none">
              {ordered.length === 0 ? (
                <p className="text-sm text-gold-400 text-center py-6">
                  ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว
                </p>
              ) : (
                <div className="space-y-0">
                  {ordered.map((d, i) => (
                    <div
                      key={d.id}
                      className={`flex items-baseline gap-3 py-2.5 ${
                        i < ordered.length - 1 ? "border-b border-gold-100" : ""
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-gold-400 w-6 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gold-800 leading-snug">
                          {d.donor_title ? `${d.donor_title} ` : ""}
                          {d.donor_name}
                        </p>
                        {d.message && (
                          <p className="text-[10px] text-gold-400 italic mt-0.5">
                            &ldquo;{d.message}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-[10px] text-gold-400 pb-2 print:block">
              เอกสารนี้ออกโดยระบบหรีดร่วมบุญ · สำหรับพิธีกรอ่านขอบคุณผู้ร่วมบุญ
            </p>
          </>
        )}
      </main>
    </div>
  );
}

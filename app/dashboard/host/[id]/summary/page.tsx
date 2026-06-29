"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Users, ImageDown, Share2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import type { Donation } from "@/lib/supabase/types";
import { systemFee, netToHost } from "@/lib/fee";

export default function HostSummaryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [donations, setDonations] = useState<Donation[]>([]);
  const [memorialName, setMemorialName] = useState("งานมงคล");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
  const fee = systemFee(total);
  const net = netToHost(total);

  async function handleSaveImage() {
    if (!contentRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(contentRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `สรุปการเงิน-${memorialName || id}.png`;
      a.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    const url = window.location.href;
    const text = `สรุปการเงิน — ${memorialName}`;
    if (navigator.share) {
      await navigator.share({ title: text, url }).catch(() => {});
    } else {
      window.open(
        `https://line.me/R/msg/text/?${encodeURIComponent(text + "\n" + url)}`,
        "_blank"
      );
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Header — ไม่ติดไปในภาพ */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">สรุปการเงิน</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Financial Summary</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg gold-border bg-cream-50 text-xs text-gold-700 font-semibold hover:bg-cream-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              แชร์
            </button>
            <button
              onClick={handleSaveImage}
              disabled={saving}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg gold-border bg-cream-50 text-xs text-gold-700 font-semibold hover:bg-cream-100 transition-colors disabled:opacity-50"
            >
              <ImageDown className="w-3.5 h-3.5" />
              {saving ? "กำลังบันทึก..." : "บันทึกภาพ"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="text-center py-16 text-gold-400 text-sm">กำลังโหลด...</div>
        ) : (
          /* contentRef ครอบเฉพาะเนื้อหา — ส่วนนี้เท่านั้นที่ถ่ายเป็นภาพ */
          <div ref={contentRef} className="space-y-4 bg-white px-1 py-2">
            {/* Title */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 text-center">
              <p className="text-xs text-gold-500 uppercase tracking-wider mb-1">สรุปการเงิน</p>
              <p className="text-lg font-bold text-gold-800">{memorialName}</p>
              <p className="text-[10px] text-gold-400 mt-1">
                {new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
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
                  <span className="text-gold-600">ค่าดำเนินการ (10% ของยอดร่วมบุญ)</span>
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
                {[...donations].reverse().map((d, i) => (
                  <div key={d.id} className={`flex items-start gap-3 py-2.5 ${i < donations.length - 1 ? "border-b border-gold-100" : ""}`}>
                    <span className="text-[11px] font-semibold text-gold-400 w-6 shrink-0 mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
                      {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
                      {d.message && <p className="text-[10px] text-gold-400 italic">&ldquo;{d.message}&rdquo;</p>}
                    </div>
                    <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p className="text-sm text-gold-400 text-center py-6">ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว</p>
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-gold-400 pb-1">
              หรีดร่วมบุญ · สรุปการเงินสำหรับเจ้าภาพ
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

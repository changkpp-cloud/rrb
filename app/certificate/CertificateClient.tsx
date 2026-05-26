"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Download, Share2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import type { Memorial } from "@/lib/supabase/types";

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
function thaiDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function CertificateClient({ memorial }: { memorial: Memorial }) {
  const params  = useSearchParams();
  const name    = params.get("name")    ?? "";
  const title   = params.get("title")   ?? "";
  const amount  = params.get("amount")  ?? "";
  const message = params.get("message") ?? "";

  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const amountNum = parseFloat(amount);
  const amountDisplay = amount.trim() && !isNaN(amountNum)
    ? amountNum.toLocaleString() + " บาท"
    : amount.trim() ? amount.trim() + " บาท" : "";

  const deceasedName     = memorial.name;
  const ceremonyDate     = thaiDate(memorial.ceremony_date);
  const ceremonyLocation = [memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ");

  async function handleSave() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: "#fdf8ee" });
      const link = document.createElement("a");
      link.download = `หลักฐานหรีดร่วมบุญ-${name || "certificate"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "หลักฐานการมอบหรีดร่วมบุญ Zero Waste",
        text: `${name || "ผู้ร่วมบุญ"} ได้ร่วมมอบหรีดร่วมบุญ Zero Waste`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <LotusIcon className="w-6 h-6 text-gold-600" />
            <div className="text-center">
              <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
              <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">Zero Waste</p>
            </div>
            <LotusIcon className="w-6 h-6 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

          {/* Certificate card */}
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#fdf8ee 0%,#f0e0b8 50%,#fdf8ee 100%)",
              border: "2px solid #c9a84c",
              boxShadow: "0 8px 32px rgba(184,134,11,0.22)",
            }}
          >
            <div className="gold-gradient px-4 py-2.5 flex items-center justify-center gap-2">
              <LotusIcon className="w-4 h-4 text-white/90" />
              <span className="text-white font-semibold text-xs tracking-[0.18em]">หลักฐานการมอบหรีดร่วมบุญ</span>
              <LotusIcon className="w-4 h-4 text-white/90 scale-x-[-1]" />
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-center gap-2 select-none">
                <div className="flex-1 h-px bg-gold-300/60" />
                <LotusIcon className="w-3.5 h-3.5 text-gold-400" />
                <span className="text-gold-400 text-[9px]">✦</span>
                <LotusIcon className="w-3.5 h-3.5 text-gold-400 scale-x-[-1]" />
                <div className="flex-1 h-px bg-gold-300/60" />
              </div>

              <p className="text-[11px] text-gold-500 tracking-[0.20em] text-center">— ขอรับรองว่า —</p>

              <div className="text-center space-y-1">
                <p className="text-xs text-gold-600">ผู้มอบหรีดร่วมบุญ</p>
                <p className="text-xl font-bold text-gold-800 leading-snug">{name || "ผู้ร่วมบุญ"}</p>
                {title && <p className="text-sm text-gold-600">{title}</p>}
              </div>

              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-gold-300/50" />
                <span className="text-gold-400 text-[8px]">◆</span>
                <div className="flex-1 h-px bg-gold-300/50" />
              </div>

              <div className="space-y-2 text-center">
                <p className="text-xs text-gold-700 leading-relaxed">
                  ได้ร่วมมอบ <span className="font-semibold text-gold-800">หรีดร่วมบุญ Zero Waste</span>
                </p>
                <p className="text-xs text-gold-700 leading-relaxed">
                  เป็นจำนวนเงิน <span className="font-semibold text-gold-800">{amountDisplay || "—"}</span>
                </p>
                <p className="text-xs text-gold-700">แสดงความอาลัยแด่</p>
                <p className="font-bold text-gold-800 text-sm">{deceasedName}</p>
                <p className="text-xs text-gold-600">ฌาปนกิจ {ceremonyDate}</p>
                <p className="text-[10px] text-gold-500">{ceremonyLocation}</p>
              </div>

              {message && (
                <div className="text-center pt-1">
                  <p className="text-xs text-gold-600 italic">"{message}"</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-1 pt-2 select-none">
                <LotusIcon className="w-3 h-3 text-gold-300" />
                <span className="text-gold-300 text-[7px]">◆</span>
                <LotusIcon className="w-3 h-3 text-gold-300 scale-x-[-1]" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกเป็นรูปภาพ"}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              แชร์หลักฐาน
            </button>
          </div>

          <Link
            href={`/ecard?${new URLSearchParams({ name, title, amount, message }).toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            ย้อนกลับ
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

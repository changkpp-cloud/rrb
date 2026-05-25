"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, FileText } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

const DECEASED_NAME = "นางสาว สุภาพร ปทุมานนท์";
const CEREMONY_DATE = "20 มีนาคม 2559";
const CEREMONY_LOCATION = "วัดไตรภูมิ ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร";

export default function CertificatePage() {
  return (
    <Suspense>
      <CertificateInner />
    </Suspense>
  );
}

function CertificateInner() {
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const title = params.get("title") ?? "";
  const amount = params.get("amount") ?? "";
  const message = params.get("message") ?? "";

  const amountDisplay = amount
    ? Number(amount).toLocaleString("th-TH") + " บาท"
    : "";

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
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

              {/* Ornament */}
              <div className="flex items-center justify-center gap-2 select-none">
                <div className="flex-1 h-px bg-gold-300/60" />
                <LotusIcon className="w-3.5 h-3.5 text-gold-400" />
                <span className="text-gold-400 text-[9px]">✦</span>
                <LotusIcon className="w-3.5 h-3.5 text-gold-400 scale-x-[-1]" />
                <div className="flex-1 h-px bg-gold-300/60" />
              </div>

              <p className="text-[11px] text-gold-500 tracking-[0.20em] text-center">— ขอรับรองว่า —</p>

              {/* Donor info */}
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

              {/* Details */}
              <div className="space-y-2 text-center">
                <p className="text-xs text-gold-700 leading-relaxed">
                  ได้ร่วมมอบ <span className="font-semibold text-gold-800">หรีดร่วมบุญ Zero Waste</span>
                </p>
                {amountDisplay && (
                  <p className="text-xs text-gold-700 leading-relaxed">
                    เป็นจำนวนเงิน <span className="font-semibold text-gold-800">{amountDisplay}</span>
                  </p>
                )}
                <p className="text-xs text-gold-700">แสดงความอาลัยแด่</p>
                <p className="font-bold text-gold-800 text-sm">{DECEASED_NAME}</p>
                <p className="text-xs text-gold-600">ฌาปนกิจ {CEREMONY_DATE}</p>
                <p className="text-[10px] text-gold-500">{CEREMONY_LOCATION}</p>
              </div>

              {message && (
                <div className="text-center pt-1">
                  <p className="text-xs text-gold-600 italic">"{message}"</p>
                </div>
              )}

              {/* Bottom ornament */}
              <div className="flex items-center justify-center gap-1 pt-2 select-none">
                <LotusIcon className="w-3 h-3 text-gold-300" />
                <span className="text-gold-300 text-[7px]">◆</span>
                <LotusIcon className="w-3 h-3 text-gold-300 scale-x-[-1]" />
              </div>
            </div>
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

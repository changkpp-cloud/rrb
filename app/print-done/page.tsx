"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, FileText, Flower2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

export default function PrintDonePage() {
  return (
    <Suspense>
      <PrintDoneInner />
    </Suspense>
  );
}

function PrintDoneInner() {
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const title = params.get("title") ?? "";
  const amount = params.get("amount") ?? "";

  const extraParams = new URLSearchParams({ name, title, amount }).toString();

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <LotusIcon className="w-6 h-6 text-gold-600" />
          <div className="text-center">
            <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
            <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">Zero Waste</p>
          </div>
          <LotusIcon className="w-6 h-6 text-gold-600 scale-x-[-1]" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-5">

          {/* Success icon */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,rgba(245,222,170,0.5) 0%,rgba(201,152,60,0.2) 100%)",
              border: "2px solid rgba(201,152,60,0.5)",
              boxShadow: "0 8px 32px rgba(184,134,11,0.18)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-gold-600">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gold-800">ส่งพิมพ์สำเร็จ</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gold-300/60" />
              <LotusIcon className="w-3 h-3 text-gold-400" />
              <div className="h-px w-12 bg-gold-300/60" />
            </div>
            {name && (
              <p className="text-sm text-gold-700 mt-1">
                ขอบคุณ <span className="font-semibold">{name}</span>
              </p>
            )}
            <p className="text-xs text-gold-500 leading-relaxed">
              ป้ายหรีดร่วมบุญของคุณถูกส่งพิมพ์เรียบร้อยแล้ว
            </p>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3 mt-2">
            <Link
              href={`/ecard?${extraParams}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <FileText className="w-4 h-4" />
              ดูอีการ์ด / หลักฐานการมอบ
            </Link>

            <Link
              href={`/mock-wreath?${extraParams}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Flower2 className="w-4 h-4" />
              จำลองภาพมอบหรีด
            </Link>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" />
              กลับหน้าหลัก
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

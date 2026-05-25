"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Flower2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

export default function MockWreathPage() {
  return (
    <Suspense>
      <MockWreathInner />
    </Suspense>
  );
}

function MockWreathInner() {
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const title = params.get("title") ?? "";
  const message = params.get("message") ?? "";

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
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gold-800">จำลองภาพมอบหรีด</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-300" />
              <span className="text-gold-400 text-xs">❖</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-300" />
            </div>
          </div>

          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            style={{
              background: "rgba(255,252,248,0.70)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(222,184,110,0.36)",
              boxShadow: "0 6px 28px rgba(176,120,32,0.09), inset 0 1px 0 rgba(255,255,255,0.75)",
            }}
          >
            <Flower2 className="w-16 h-16 text-gold-300" />
            <p className="text-gold-600 font-medium">กำลังพัฒนาฟีเจอร์นี้</p>
            <p className="text-gold-500 text-sm">จำลองภาพมอบหรีดสำหรับ<br /><span className="font-semibold text-gold-700">{name || "ผู้ร่วมบุญ"}</span></p>
          </div>

          <Link
            href={`/ecard?${new URLSearchParams({ name, title, message }).toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-gold-300 bg-cream-50 text-gold-600 font-medium text-sm hover:bg-cream-100 transition-colors"
          >
            ย้อนกลับ
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-gold-300 bg-cream-50 text-gold-600 font-medium text-sm hover:bg-cream-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>

        </div>
      </main>
    </div>
  );
}

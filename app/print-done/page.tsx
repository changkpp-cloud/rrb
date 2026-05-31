"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, FileText, Flower2, Image as ImageIcon } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
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

  function buildECardHref(view: "ai" | "ecard" | "certificate") {
    const q = new URLSearchParams({ name, title, amount });
    q.set("view", view);
    return `/ecard?${q.toString()}`;
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <IosPageHeader title="หรีดร่วมบุญ" subtitle="Zero Waste" />

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
              href={buildECardHref("ai")}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Flower2 className="w-4 h-4" />
              AI จำลองมอบหรีด
            </Link>

            <Link
              href={buildECardHref("ecard")}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <ImageIcon className="w-4 h-4" />
              E-Card ขอบคุณ
            </Link>

            <Link
              href={buildECardHref("certificate")}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              เอกสารมอบหรีด
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

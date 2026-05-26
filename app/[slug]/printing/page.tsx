"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import LotusIcon from "@/components/LotusIcon";

const STEPS = ["กำลังส่งข้อมูลป้าย", "กำลังประมวลผล", "ส่งพิมพ์สำเร็จ"];

function PrinterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M6 9V3h12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="9" width="20" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 14h12v7H6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="13.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export default function SlugPrintingPage() {
  return (
    <Suspense>
      <PrintingInner />
    </Suspense>
  );
}

function PrintingInner() {
  const [stepIndex, setStepIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const name = params.get("name") ?? "";
  const title = params.get("title") ?? "";
  const amount = params.get("amount") ?? "";
  const message = params.get("message") ?? "";

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => { timers.push(setTimeout(() => setStepIndex(i), i * 1100)); });
    timers.push(setTimeout(() => setShowSuccess(true), STEPS.length * 1100 + 400));
    timers.push(setTimeout(() => {
      const q = new URLSearchParams({ name, title, amount, message });
      router.push(`/${slug}/ecard?${q.toString()}`);
    }, STEPS.length * 1100 + 400 + 3000));
    return () => timers.forEach(clearTimeout);
  }, [router, name, title, amount, message, slug]);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="shrink-0 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <LotusIcon className="w-6 h-6 text-gold-600" />
          <div className="text-center">
            <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
            <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">Zero Waste</p>
          </div>
          <LotusIcon className="w-6 h-6 text-gold-600 scale-x-[-1]" />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm bg-cream-50 rounded-3xl gold-border card-shadow px-6 py-10 flex flex-col items-center gap-6">
          {!showSuccess && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-32 h-32 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#c9a84c", borderRightColor: "#e8c05a44", animationDuration: "1.2s" }} />
                <div className="absolute w-24 h-24 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "#b8860b", borderLeftColor: "#c9a84c66", animationDuration: "1.8s", animationDirection: "reverse" }} />
                <div className="w-16 h-16 rounded-full bg-cream-100 border border-gold-200 flex items-center justify-center">
                  <PrinterIcon className="w-8 h-8 text-gold-500" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-gold-800">กำลังส่งพิมพ์ป้าย</p>
                <p className="text-xs text-gold-500">ระบบกำลังดำเนินการพิมพ์ป้ายของคุณ</p>
              </div>
              <div className="w-full space-y-2">
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex;
                  const isDone = i < stepIndex;
                  return (
                    <div key={step} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${isActive ? "bg-gold-50 border border-gold-300" : isDone ? "bg-cream-100 border border-gold-100" : "opacity-30"}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-gold-500 animate-pulse scale-125" : isDone ? "bg-gold-400" : "bg-gold-200"}`} />
                      <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-gold-800" : isDone ? "text-gold-600" : "text-gold-300"}`}>{step}</span>
                      {isActive && (<span className="ml-auto flex gap-0.5">{[0, 1, 2].map((d) => (<span key={d} className="w-1 h-1 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />))}</span>)}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gold-400 text-center">กรุณารอสักครู่...</p>
            </>
          )}
        </div>
      </main>
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs flex flex-col items-center gap-4 px-8 py-10 rounded-3xl" style={{ background: "linear-gradient(160deg,#fdf8ee 0%,#f0e0b8 50%,#fdf8ee 100%)", border: "2px solid #c9a84c", boxShadow: "0 8px 40px rgba(184,134,11,0.30)" }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(245,222,170,0.6) 0%,rgba(201,152,60,0.25) 100%)", border: "2px solid rgba(201,152,60,0.55)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-gold-600">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-gold-800">ส่งพิมพ์สำเร็จ</p>
              {name && <p className="text-sm text-gold-600">ขอบคุณ <span className="font-semibold">{name}</span></p>}
              <p className="text-xs text-gold-500 mt-1">กำลังแสดงอีการ์ดขอบคุณ...</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((d) => (<span key={d} className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${d * 0.2}s` }} />))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

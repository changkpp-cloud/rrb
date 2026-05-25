"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LotusIcon from "@/components/LotusIcon";

const STEPS = [
  "รับสลิปเรียบร้อย",
  "กำลังตรวจสอบข้อมูล",
  "กำลังยืนยันการโอน",
];

export default function VerifyingPage() {
  return (
    <Suspense>
      <VerifyingInner />
    </Suspense>
  );
}

function VerifyingInner() {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get("amount") ?? "";

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStepIndex(i), i * 1200));
    });

    // Navigate to print-name after all steps
    timers.push(
      setTimeout(() => {
        setDone(true);
        const q = new URLSearchParams({ amount });
        router.push(`/print-name?${q.toString()}`);
      }, STEPS.length * 1200 + 400)
    );

    return () => timers.forEach(clearTimeout);
  }, [router, amount]);

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      {/* Header */}
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

          {!done && (
            /* ── กำลังตรวจสอบ ── */
            <>
              {/* Spinner */}
              <div className="relative flex items-center justify-center">
                {/* Outer spinning ring */}
                <div
                  className="absolute w-32 h-32 rounded-full border-4 border-transparent animate-spin"
                  style={{
                    borderTopColor: "#c9a84c",
                    borderRightColor: "#e8c05a44",
                    animationDuration: "1.2s",
                  }}
                />
                {/* Middle ring */}
                <div
                  className="absolute w-24 h-24 rounded-full border-2 border-transparent animate-spin"
                  style={{
                    borderTopColor: "#b8860b",
                    borderLeftColor: "#c9a84c66",
                    animationDuration: "1.8s",
                    animationDirection: "reverse",
                  }}
                />
                {/* Center lotus */}
                <div className="w-16 h-16 rounded-full bg-cream-100 border border-gold-200 flex items-center justify-center">
                  <LotusIcon className="w-8 h-8 text-gold-500 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-gold-800">กำลังตรวจสอบสลิป</p>
                <p className="text-xs text-gold-500">ระบบกำลังตรวจสอบการโอนเงินของคุณ</p>
              </div>

              {/* Step indicators */}
              <div className="w-full space-y-2">
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex;
                  const isDone = i < stepIndex || (done && i <= stepIndex);
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                        isActive
                          ? "bg-gold-50 border border-gold-300"
                          : isDone
                          ? "bg-cream-100 border border-gold-100"
                          : "opacity-30"
                      }`}
                    >
                      {/* Step dot */}
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                          isActive
                            ? "bg-gold-500 animate-pulse scale-125"
                            : isDone
                            ? "bg-gold-400"
                            : "bg-gold-200"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium transition-colors duration-300 ${
                          isActive ? "text-gold-800" : isDone ? "text-gold-600" : "text-gold-300"
                        }`}
                      >
                        {step}
                      </span>
                      {/* Animated dots for active step */}
                      {isActive && (
                        <span className="ml-auto flex gap-0.5">
                          {[0, 1, 2].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-gold-400 animate-bounce"
                              style={{ animationDelay: `${d * 0.15}s` }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gold-400 text-center">กรุณารอสักครู่...</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

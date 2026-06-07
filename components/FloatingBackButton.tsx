"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function FloatingBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      title="ย้อนกลับ"
      aria-label="ย้อนกลับ"
      onClick={() => router.back()}
      id="floating-back-btn"
      className="fixed right-4 bottom-[76px] z-50 flex h-11 w-11 items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
      style={{
        background: "rgba(14, 9, 2, 0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "0.5px solid rgba(255,255,255,0.10)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <ChevronLeft className="h-5 w-5 text-gold-300" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

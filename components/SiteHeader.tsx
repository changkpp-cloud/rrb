import Link from "next/link";
import LotusIcon from "./LotusIcon";

export default function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(255,248,241,0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottomColor: "rgba(222,184,110,0.35)",
        boxShadow: "0 1px 24px rgba(176,120,32,0.07), 0 0 0 1px rgba(245,222,170,0.18), inset 0 -1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
        <div className="w-8" />

        <div className="flex items-center gap-2">
          <LotusIcon className="w-6 h-6 text-gold-500 animate-pulse-glow" />
          <div className="text-center">
            <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">
              หรีดร่วมบุญ
            </h1>
            <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">
              Zero Waste
            </p>
          </div>
          <LotusIcon className="w-6 h-6 text-gold-500 scale-x-[-1] animate-pulse-glow" />
        </div>

        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gold-600 active:scale-95 transition-all duration-150"
          style={{
            background: "rgba(255,252,248,0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(201,152,60,0.38)",
            boxShadow: "0 2px 12px rgba(176,120,32,0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
          title="แดชบอร์ดเจ้าภาพ"
        >
          <span className="text-lg leading-none font-light">+</span>
        </Link>
      </div>
    </header>
  );
}

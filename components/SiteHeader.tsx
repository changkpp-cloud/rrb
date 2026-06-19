import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-center px-4 pt-3 pb-2">

      {/* Dynamic Island — dark floating pill */}
      <div className="ios-dynamic-island flex items-center gap-2.5 px-5 py-[9px]">
        <span className="text-gold-400 text-sm select-none">❖</span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-white leading-none">
            หรีดร่วมบุญ
          </span>
          <span className="text-sm font-bold text-gold-400 uppercase leading-none">
            Zero Waste
          </span>
        </div>
        <span className="text-gold-400 text-sm select-none">❖</span>
      </div>

      {/* Dashboard button — floating right */}
      <Link
        href="/dashboard"
        title="แดชบอร์ด"
        className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full active:scale-90 transition-transform duration-150"
        style={{
          background: "rgba(14, 9, 2, 0.72)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "0.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-gold-300 text-base leading-none font-light select-none" style={{ fontSize: "17px" }}>+</span>
      </Link>

    </header>
  );
}

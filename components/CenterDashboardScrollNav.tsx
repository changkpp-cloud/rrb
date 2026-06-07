"use client";

import { useEffect, useState } from "react";
import { BarChart3, Plus, ScrollText, Settings } from "lucide-react";

type SectionId = "open" | "active" | "reports" | "settings";

const ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "open", label: "เปิดงานใหม่", icon: Plus },
  { id: "active", label: "งานเปิดอยู่", icon: ScrollText },
  { id: "reports", label: "รายงานศูนย์", icon: BarChart3 },
  { id: "settings", label: "ตั้งค่าศูนย์", icon: Settings },
];

export default function CenterDashboardScrollNav() {
  const [active, setActive] = useState<SectionId>("open");

  useEffect(() => {
    const sections = ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-96px 0px -45% 0px", threshold: [0.12, 0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: SectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-200 bg-white/95 px-1.5 py-1.5 shadow-[0_-8px_28px_rgba(176,120,32,0.10)] backdrop-blur-md"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}
      aria-label="เมนูแดชบอร์ดศูนย์บริหาร"
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-4 gap-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`flex min-h-[50px] min-w-0 flex-col items-center justify-center rounded-xl border px-0.5 py-1.5 text-center transition-colors ${
                isActive
                  ? "border-gold-600 bg-gold-600 text-white shadow-sm"
                  : "border-gold-200 bg-cream-50 text-gold-600 hover:bg-gold-50"
              }`}
            >
              <Icon className="mb-0.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="block max-w-full truncate text-[9px] font-semibold leading-tight sm:text-[11px]">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Banknote, ClipboardCheck, Info, Printer, ScrollText, Users } from "lucide-react";

type SectionId = "overview" | "slips" | "print" | "donors" | "finance" | "close";

const ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "ภาพรวมงาน", icon: Info },
  { id: "slips", label: "สลิป/เตือน", icon: ClipboardCheck },
  { id: "print", label: "คิวพิมพ์ป้าย", icon: Printer },
  { id: "donors", label: "รายชื่อผู้ร่วมบุญ", icon: Users },
  { id: "finance", label: "การเงิน", icon: Banknote },
  { id: "close", label: "ปิดงาน", icon: ScrollText },
];

export default function CenterMemorialScrollNav() {
  const [active, setActive] = useState<SectionId>("overview");

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
      { rootMargin: "-96px 0px -55% 0px", threshold: [0.12, 0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: SectionId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="sticky top-[76px] z-30 -mx-4 bg-white/92 backdrop-blur-md border-y border-gold-100 px-4 py-2">
      <div className="grid grid-cols-3 gap-1.5">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`min-h-[58px] rounded-xl border px-1.5 py-2 transition-colors ${
                isActive
                  ? "bg-gold-600 border-gold-600 text-white shadow-sm"
                  : "bg-cream-50 border-gold-200 text-gold-600 hover:bg-gold-50"
              }`}
            >
              <Icon className="w-4 h-4 mx-auto mb-1" />
              <span className="block text-[10px] font-semibold leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

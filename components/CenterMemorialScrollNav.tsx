"use client";

import { useEffect, useState } from "react";
import { Banknote, Camera, ClipboardCheck, Clock, Info, Printer, ScrollText, ShieldCheck, Users } from "lucide-react";

type SectionId = "overview" | "verify" | "slips" | "print" | "donors" | "persons" | "host-verify" | "finance" | "close";

const ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "ภาพรวม", icon: Info },
  { id: "verify", label: "รอตรวจ", icon: Clock },
  { id: "slips", label: "สลิปซ้ำ", icon: ClipboardCheck },
  { id: "print", label: "พิมพ์ป้าย", icon: Printer },
  { id: "donors", label: "รายชื่อ", icon: Users },
  { id: "persons", label: "บุคคลภาพ", icon: Camera },
  { id: "host-verify", label: "เจ้าภาพ", icon: ShieldCheck },
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
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`flex-none min-w-[60px] rounded-xl border px-2 py-2 transition-colors text-center ${
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

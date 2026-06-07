"use client";

import { useState } from "react";
import { BarChart3, Plus, ScrollText, Settings } from "lucide-react";

type SectionId = "open" | "active" | "reports" | "settings";

type Props = Record<SectionId, React.ReactNode>;

const ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "open", label: "เปิดงานใหม่", icon: Plus },
  { id: "active", label: "งานเปิดอยู่", icon: ScrollText },
  { id: "reports", label: "รายงานศูนย์", icon: BarChart3 },
  { id: "settings", label: "ตั้งค่าศูนย์", icon: Settings },
];

export default function CenterDashboardScrollNav({ open, active, reports, settings }: Props) {
  const [current, setCurrent] = useState<SectionId>("open");
  const pages: Props = { open, active, reports, settings };

  function showPage(id: SectionId) {
    setCurrent(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div key={current}>{pages[current]}</div>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-gold-200 bg-white/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="เมนูแดชบอร์ดศูนย์บริหาร"
      >
        <div className="mx-auto flex max-w-lg">
          {ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = current === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => showPage(id)}
                className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                  isActive ? "text-gold-700" : "text-stone-400"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-0.5 rounded-b-full bg-gold-500" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? "text-gold-600" : "text-stone-400"}`} />
                <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-gold-700" : "text-stone-400"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

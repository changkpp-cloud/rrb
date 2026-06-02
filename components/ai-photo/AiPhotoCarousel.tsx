"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

const TEMPLATES: { key: AiPhotoTemplateKey; label: string; desc: string; emoji: string }[] = [
  { key: "standing_with_label", label: "ยืนถือป้ายหรีดร่วมบุญ", desc: "ผู้มอบยืนถือป้ายด้วยความสุภาพ", emoji: "🧍" },
  { key: "mourning_wai",        label: "ไหว้อาลัยหน้าบอร์ด",   desc: "ผู้มอบยกมือไหว้แสดงความอาลัย", emoji: "🙏" },
  { key: "host_receiving",      label: "เจ้าภาพรับมอบจากผู้มอบ", desc: "ส่งมอบป้ายให้เจ้าภาพอย่างสุภาพ", emoji: "🤝" },
  { key: "organization_board",  label: "ในนามองค์กร / หน่วยงาน", desc: "ภาพบอร์ดในนามองค์กรหรือกลุ่ม",  emoji: "🏢" },
];

interface Props {
  selected: AiPhotoTemplateKey;
  onChange: (key: AiPhotoTemplateKey) => void;
}

export default function AiPhotoCarousel({ selected, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gold-700">เลือกแบบภาพจำลอง</p>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className="relative flex-none snap-center rounded-2xl border-2 transition-all active:scale-95 text-left"
              style={{
                minWidth: "72%",
                borderColor: isSelected ? "#c9a84c" : "rgba(201,168,76,0.25)",
                background: isSelected ? "rgba(245,222,170,0.18)" : "#fdfaf3",
                boxShadow: isSelected ? "0 0 0 2px rgba(201,168,76,0.3)" : "none",
              }}
            >
              {/* Preview area */}
              <div
                className="w-full flex items-center justify-center rounded-t-xl"
                style={{ height: 120, background: "linear-gradient(135deg,#fdf8ee,#f0e0b8)" }}
              >
                <span style={{ fontSize: 52 }}>{t.emoji}</span>
              </div>

              {/* Label */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-bold text-gold-800 leading-snug">{t.label}</p>
                <p className="text-[11px] text-gold-500 mt-0.5">{t.desc}</p>
              </div>

              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-gold-400 text-center">ปัดซ้าย / ขวา เพื่อดูแบบภาพทั้งหมด</p>
    </div>
  );
}

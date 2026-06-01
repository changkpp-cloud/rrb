"use client";

import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

interface Props {
  selected: AiPhotoTemplateKey;
  onChange: (key: AiPhotoTemplateKey) => void;
}

const TEMPLATES: Array<{
  key: AiPhotoTemplateKey;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: "standing_with_label",
    label: "ยืนถือป้าย",
    icon: (
      <svg viewBox="0 0 32 42" fill="none" className="w-8 h-10">
        <circle cx="16" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M9 14l7 3 7-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l-2.5-2M23 14l2.5-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="6.5" y="10" width="19" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="12.5" x2="22" y2="12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <line x1="10" y1="14.5" x2="18" y2="14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <path d="M16 17v9M12 26l-3 8M20 26l3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "mourning_wai",
    label: "ไหว้อาลัย",
    icon: (
      <svg viewBox="0 0 32 42" fill="none" className="w-8 h-10">
        <circle cx="16" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 14l4 3 4-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12l-3 6M20 12l3 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13 17l3-2 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 13.5l1.5-2 1.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M16 17v9M12 26l-3 8M20 26l3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "host_receiving",
    label: "มอบให้เจ้าภาพ",
    icon: (
      <svg viewBox="0 0 40 42" fill="none" className="w-10 h-10">
        <circle cx="10" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="30" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 10v7M30 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 14l4 3M14 14l-4 3M26 14l4 3M34 14l-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="14" y="13" width="12" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16.5" y1="15" x2="23.5" y2="15" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
        <path d="M10 17v8M7 25l-2 8M13 25l2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M30 17v8M27 25l-2 8M33 25l2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "organization_board",
    label: "ในนามองค์กร",
    icon: (
      <svg viewBox="0 0 40 42" fill="none" className="w-10 h-10">
        <rect x="6" y="4" width="28" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <line x1="11" y1="10" x2="29" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="11" y1="14" x2="25" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        <line x1="11" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M20 22v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 30h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 30l-3 8M28 30l3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AiPhotoTemplateSelector({ selected, onChange }: Props) {
  return (
    <div>
      <p className="text-xs font-semibold text-gold-600 mb-2">เลือกรูปแบบภาพ</p>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((t) => {
          const isSelected = t.key === selected;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`rounded-xl border-2 py-2.5 px-2 flex items-center gap-2.5 transition-all active:scale-95 ${
                isSelected
                  ? "border-gold-500 bg-gold-50 shadow-sm"
                  : "border-gold-200 bg-white hover:border-gold-300"
              }`}
            >
              <div className={`shrink-0 ${isSelected ? "text-gold-600" : "text-gold-300"}`}>
                {t.icon}
              </div>
              <span className="text-[11px] font-semibold text-gold-700 text-left leading-tight">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

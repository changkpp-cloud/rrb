"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

const TEMPLATES: { key: AiPhotoTemplateKey; label: string; desc: string; emoji: string }[] = [
  {
    key: "standing_with_label",
    label: "ยืนถือป้าย",
    desc: "ผู้มอบยืนถือป้ายด้วยความสุภาพ",
    emoji: "🧍",
  },
  {
    key: "mourning_wai",
    label: "ไหว้อาลัย",
    desc: "ผู้มอบยกมือไหว้แสดงความอาลัย",
    emoji: "🙏",
  },
  {
    key: "host_receiving",
    label: "เจ้าภาพรับมอบ",
    desc: "ส่งมอบป้ายให้เจ้าภาพอย่างสุภาพ",
    emoji: "🤝",
  },
  {
    key: "organization_board",
    label: "ในนามองค์กร",
    desc: "ภาพบอร์ดในนามองค์กรหรือหน่วยงาน",
    emoji: "🏢",
  },
];

interface Props {
  selected: AiPhotoTemplateKey;
  onChange: (key: AiPhotoTemplateKey) => void;
}

function realIndexFromPosition(position: number) {
  return (position - 1 + TEMPLATES.length) % TEMPLATES.length;
}

export default function AiPhotoCarousel({ selected, onChange }: Props) {
  const selectedIndex = Math.max(0, TEMPLATES.findIndex((item) => item.key === selected));
  const slides = useMemo(() => [TEMPLATES[TEMPLATES.length - 1], ...TEMPLATES, TEMPLATES[0]], []);
  const [position, setPosition] = useState(selectedIndex + 1);
  const [withTransition, setWithTransition] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    setWithTransition(true);
    setPosition(selectedIndex + 1);
  }, [selectedIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setWithTransition(true);
      setPosition((current) => {
        const next = current + 1;
        const realIndex = realIndexFromPosition(next);
        onChange(TEMPLATES[realIndex].key);
        return next;
      });
    }, 4200);

    return () => window.clearInterval(timer);
  }, [onChange]);

  function selectPosition(nextPosition: number) {
    const realIndex = realIndexFromPosition(nextPosition);
    onChange(TEMPLATES[realIndex].key);
  }

  function move(direction: 1 | -1, userInitiated = true) {
    if (userInitiated) pauseUntilRef.current = Date.now() + 2800;
    setWithTransition(true);
    setPosition((current) => {
      const next = current + direction;
      selectPosition(next);
      return next;
    });
  }

  function goTo(index: number) {
    pauseUntilRef.current = Date.now() + 2800;
    setWithTransition(true);
    setPosition(index + 1);
    onChange(TEMPLATES[index].key);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 32) return;
    move(delta < 0 ? 1 : -1);
  }

  function handleTransitionEnd() {
    if (position === 0) {
      setWithTransition(false);
      setPosition(TEMPLATES.length);
    }

    if (position === TEMPLATES.length + 1) {
      setWithTransition(false);
      setPosition(1);
    }
  }

  const activeIndex = realIndexFromPosition(position);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gold-700">เลือกแบบภาพจำลอง</p>

      <div
        className="overflow-hidden rounded-2xl"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
          pauseUntilRef.current = Date.now() + 2800;
        }}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          touchStartX.current = event.clientX;
          pauseUntilRef.current = Date.now() + 2800;
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "mouse") return;
          handleTouchEnd(event.clientX);
        }}
      >
        <div
          className={`flex ${withTransition ? "transition-transform duration-1000 ease-out" : ""}`}
          style={{ transform: `translateX(-${position * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((template, index) => {
            const isSelected = selected === template.key;
            return (
              <button
                key={`${template.key}-${index}`}
                type="button"
                onClick={() => goTo(TEMPLATES.findIndex((item) => item.key === template.key))}
                className="relative w-full shrink-0 rounded-2xl border-2 text-left transition-all active:scale-[0.99]"
                style={{
                  borderColor: isSelected ? "#c9a84c" : "rgba(201,168,76,0.25)",
                  background: isSelected ? "rgba(245,222,170,0.18)" : "#fdfaf3",
                  boxShadow: isSelected ? "0 0 0 2px rgba(201,168,76,0.3)" : "none",
                }}
              >
                <div
                  className="flex h-[120px] w-full items-center justify-center rounded-t-xl"
                  style={{ background: "linear-gradient(135deg,#fdf8ee,#f0e0b8)" }}
                >
                  <span className="text-[52px]">{template.emoji}</span>
                </div>

                <div className="px-3 py-2.5">
                  <p className="text-sm font-bold leading-snug text-gold-800">{template.label}</p>
                  <p className="mt-0.5 text-[11px] text-gold-500">{template.desc}</p>
                </div>

                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {TEMPLATES.map((template, index) => (
          <button
            key={template.key}
            type="button"
            aria-label={template.label}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-5 bg-gold-500" : "w-1.5 bg-gold-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

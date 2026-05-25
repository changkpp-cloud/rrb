"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Briefcase } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

export default function PrintNamePage() {
  return (
    <Suspense>
      <PrintNameInner />
    </Suspense>
  );
}

function PrintNameInner() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get("amount") ?? "";

  function handleSend() {
    const q = new URLSearchParams({ name: name.trim(), title: title.trim(), amount });
    router.push(`/print-confirm?${q.toString()}`);
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <LotusIcon className="w-6 h-6 text-gold-600" />
            <div className="text-center">
              <h1 className="text-lg font-bold leading-tight gold-gradient-text tracking-wide">หรีดร่วมบุญ</h1>
              <p className="text-[9px] font-medium text-gold-500 tracking-[0.25em] uppercase -mt-0.5">Zero Waste</p>
            </div>
            <LotusIcon className="w-6 h-6 text-gold-600 scale-x-[-1]" />
          </div>
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-[54px] h-[54px] -mr-2 active:scale-95 transition-all"
          >
            <span className="w-9 h-9 rounded-full border-[1.5px] border-gold-400 bg-cream-50 flex items-center justify-center text-gold-600 card-shadow">
              <span className="text-xl leading-none font-light select-none">+</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">

          {/* ── Preview ── */}
          <SignPreview name={name} title={title} />

          {/* ── กล่องกรอกข้อมูล ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-3">

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-gold-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">ชื่อผู้มอบ</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
                className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
              />
            </div>

            <div className="h-px bg-gold-200/50" />

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-gold-700">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-semibold">ตำแหน่ง / ข้อความแสดงอาลัย</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ตำแหน่ง / ขอแสดงความอาลัย"
                className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
              />
            </div>

          </div>

          {/* ── แสดงก่อนส่งพิมพ์ ── */}
          <button
            onClick={() => setShowModal(true)}
            disabled={!name.trim()}
            className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base disabled:opacity-40 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            แสดงก่อนส่งพิมพ์
          </button>

          <Link
            href="/payment"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            ย้อนกลับ
          </Link>

          <div className="h-1" />
        </div>
      </main>

      {/* ── Modal Preview ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-white/80 text-sm tracking-wide">ตัวอย่างป้ายที่จะพิมพ์</p>
            <SignPreview name={name} title={title} />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-white/40 bg-white/10 text-white font-semibold text-sm active:scale-[0.98] transition-all"
              >
                แก้ไขข้อความ
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
              >
                ส่งพิมพ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BASE_W = 288;
const BASE_H = 80;

function SignPreview({ name, title }: { name: string; title: string }) {
  const displayName = name.trim() || "ชื่อผู้มอบ";
  const displayTitle = title.trim() || "ตำแหน่ง / ข้อความแสดงอาลัย";
  const isNamePlaceholder = !name.trim();
  const isTitlePlaceholder = !title.trim();

  const cardRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const [cardWidth, setCardWidth] = useState(BASE_W);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = cardWidth / BASE_W;

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const MAX = 26 * scale;
    const avail = cardWidth - 24;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(6 * scale, Math.min(MAX, (avail / tw) * MAX)) + "px";
  }, [displayName, cardWidth, scale]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const MAX = 16 * scale;
    const avail = cardWidth - 68;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(5 * scale, Math.min(MAX, (avail / tw) * MAX)) + "px";
  }, [displayTitle, cardWidth, scale]);

  const titleMargin = Math.round(34 * scale);
  const titleBottom = Math.round(5 * scale);

  return (
    <div
      ref={cardRef}
      className="relative w-full rounded-xl overflow-hidden"
      style={{
        aspectRatio: `${BASE_W} / ${BASE_H}`,
        background: "linear-gradient(135deg,#fdf8ee 0%,#f9f0d8 100%)",
        border: "1.5px solid #c9a84c",
        boxShadow: "0 4px 20px rgba(184,134,11,0.18), inset 0 0 0 3px #fdf8ee, inset 0 0 0 4px #c9a84c44",
      }}
    >
      <div
        className="absolute left-3 right-3 flex justify-center"
        style={{ top: "40%", transform: "translateY(-50%)" }}
      >
        <p ref={nameRef} className={`font-bold whitespace-nowrap leading-tight text-center ${isNamePlaceholder ? "text-gold-300" : "text-gold-800"}`}>
          {displayName}
        </p>
      </div>

      <div
        className="absolute flex justify-center"
        style={{ bottom: titleBottom + "px", left: titleMargin + "px", right: titleMargin + "px" }}
      >
        <p ref={titleRef} className={`whitespace-nowrap leading-tight text-center ${isTitlePlaceholder ? "text-gold-300" : "text-gold-600"}`}>
          {displayTitle}
        </p>
      </div>
    </div>
  );
}

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
  const router = useRouter();
  const params = useSearchParams();
  const amount = params.get("amount") ?? "";

  function handleConfirm() {
    if (!name.trim()) return;
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

          {/* ── Preview อยู่ด้านบนสุด ── */}
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

          {/* ── ยืนยัน ── */}
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base disabled:opacity-40 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            ยืนยันข้อมูลส่งปริ้น
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
    </div>
  );
}

const CARD_W = 288;
const CARD_H = 80;
const NAME_AVAILABLE = CARD_W - 24;
const TITLE_AVAILABLE = 240;

function SignPreview({ name, title }: { name: string; title: string }) {
  const displayName = name.trim() || "ชื่อผู้มอบ";
  const displayTitle = title.trim() || "ตำแหน่ง / ข้อความแสดงอาลัย";
  const isNamePlaceholder = !name.trim();
  const isTitlePlaceholder = !title.trim();
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const MAX = 26;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(6, Math.min(MAX, (NAME_AVAILABLE / tw) * MAX)) + "px";
  }, [displayName]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const MAX = 16;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(5, Math.min(MAX, (TITLE_AVAILABLE / tw) * MAX)) + "px";
  }, [displayTitle]);

  return (
    <div className="flex justify-center">
      <div
        className="relative flex-shrink-0 rounded-xl overflow-hidden"
        style={{
          width: CARD_W,
          height: CARD_H,
          background: "linear-gradient(135deg,#fdf8ee 0%,#f9f0d8 100%)",
          border: "1.5px solid #c9a84c",
          boxShadow: "0 4px 20px rgba(184,134,11,0.18), inset 0 0 0 3px #fdf8ee, inset 0 0 0 4px #c9a84c44",
        }}
      >
        <span className="absolute top-1 left-1.5 text-gold-400 text-xs select-none leading-none">❧</span>
        <span className="absolute top-1 right-1.5 text-gold-400 text-xs select-none leading-none scale-x-[-1] inline-block">❧</span>
        <span className="absolute bottom-1 left-1.5 text-gold-400 text-xs select-none leading-none scale-y-[-1] inline-block">❧</span>
        <span className="absolute bottom-1 right-1.5 text-gold-400 text-xs select-none leading-none rotate-180 inline-block">❧</span>

        {/* ชื่อ: ปกติอยู่ที่ 40%, ถ้า auto-fit ลดขนาด → กึ่งกลาง 50% */}
        <div
          className="absolute left-3 right-3 flex justify-center"
          style={{ top: "40%", transform: "translateY(-50%)" }}
        >
          <p ref={nameRef} className={`font-bold whitespace-nowrap leading-tight text-center ${isNamePlaceholder ? "text-gold-300" : "text-gold-800"}`}>
            {displayName}
          </p>
        </div>

        <div className="absolute bottom-[5px] flex justify-center" style={{ left: "34px", right: "34px" }}>
          <p ref={titleRef} className={`whitespace-nowrap leading-tight text-center ${isTitlePlaceholder ? "text-gold-300" : "text-gold-600"}`}>
            {displayTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

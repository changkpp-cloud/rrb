"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Briefcase, Minus, Plus, ChevronUp, ChevronDown } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

export default function PrintNamePage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [nameZoom, setNameZoom] = useState(1.0);
  const [titleZoom, setTitleZoom] = useState(1.0);
  const [nameY, setNameY] = useState(6);
  const [titleY, setTitleY] = useState(28);
  const [nameAtCap, setNameAtCap] = useState(false);
  const [titleAtCap, setTitleAtCap] = useState(false);
  const router = useRouter();

  function stepZoom(current: number, delta: number) {
    return parseFloat(Math.min(2.0, Math.max(0.3, current + delta)).toFixed(1));
  }
  function stepY(current: number, delta: number) {
    return Math.min(58, Math.max(2, current + delta));
  }

  function handleConfirm() {
    if (!name.trim()) return;
    const q = new URLSearchParams({
      name: name.trim(),
      title: title.trim(),
      nameZoom: String(nameZoom),
      titleZoom: String(titleZoom),
      nameY: String(nameY),
      titleY: String(titleY),
    });
    router.push(`/print-confirm?${q.toString()}`);
  }

  const btnBase = "w-7 h-7 rounded-lg border flex items-center justify-center transition-all";
  const btnActive = "border-gold-300 bg-white text-gold-600 hover:bg-gold-50 active:scale-95";
  const btnDisabled = "border-gold-200 bg-gray-50 text-gold-300 cursor-not-allowed";

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
            className="w-8 h-8 rounded-full border border-gold-400 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 active:scale-95 transition-all card-shadow"
          >
            <span className="text-lg leading-none font-light">+</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

          {/* Page title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gold-800">พิมพ์ชื่อในป้าย</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-300" />
              <span className="text-gold-400 text-xs">❖</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-300" />
            </div>
          </div>

          {/* ── กล่องกรอกข้อมูล ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-4">

            {/* ชื่อผู้มอบ */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">ชื่อผู้มอบ</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300 text-xs">›</span>
              </div>
            </div>

            <div className="h-px bg-gold-200/50" />

            {/* ตำแหน่ง */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gold-700">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-semibold">ตำแหน่ง (ถ้ามี)</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="กรอกตำแหน่ง/องค์กร"
                  className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300 text-xs">›</span>
              </div>
            </div>
          </div>

          {/* ── Preview ── */}
          <SignPreview
            name={name} title={title}
            nameZoom={nameZoom} titleZoom={titleZoom}
            nameY={nameY} titleY={titleY}
            onNameAtCap={setNameAtCap} onTitleAtCap={setTitleAtCap}
          />

          {/* ── ปรับขนาดและตำแหน่ง ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-3">
            <p className="text-xs font-semibold text-gold-700">ปรับขนาดและตำแหน่งตัวอักษร</p>

            {/* ชื่อ */}
            <div className="space-y-1.5">
              <span className="text-xs text-gold-600 font-medium">ชื่อ</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gold-400 w-10 flex-shrink-0">แนวตั้ง</span>
                <button onClick={() => setNameY(y => stepY(y, -2))} className={`${btnBase} ${btnActive}`}><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => setNameY(y => stepY(y, 2))}  className={`${btnBase} ${btnActive}`}><ChevronDown className="w-3.5 h-3.5" /></button>
                <div className="w-px h-4 bg-gold-200 mx-1 flex-shrink-0" />
                <span className="text-[10px] text-gold-400 w-6 flex-shrink-0">ขนาด</span>
                <button onClick={() => setNameZoom(z => stepZoom(z, -0.1))} className={`${btnBase} ${btnActive}`}><Minus className="w-3.5 h-3.5" /></button>
                <span className="text-xs text-gold-700 font-medium w-8 text-center">
                  {nameAtCap ? "100" : Math.round(nameZoom * 100)}%
                </span>
                <button
                  onClick={() => !nameAtCap && setNameZoom(z => stepZoom(z, 0.1))}
                  disabled={nameAtCap}
                  className={`${btnBase} ${nameAtCap ? btnDisabled : btnActive}`}
                ><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* ตำแหน่ง (แสดงเมื่อมีข้อมูล) */}
            {title.trim() && (
              <div className="space-y-1.5">
                <span className="text-xs text-gold-600 font-medium">ตำแหน่ง</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gold-400 w-10 flex-shrink-0">แนวตั้ง</span>
                  <button onClick={() => setTitleY(y => stepY(y, -2))} className={`${btnBase} ${btnActive}`}><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setTitleY(y => stepY(y, 2))}  className={`${btnBase} ${btnActive}`}><ChevronDown className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-gold-200 mx-1 flex-shrink-0" />
                  <span className="text-[10px] text-gold-400 w-6 flex-shrink-0">ขนาด</span>
                  <button onClick={() => setTitleZoom(z => stepZoom(z, -0.1))} className={`${btnBase} ${btnActive}`}><Minus className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-gold-700 font-medium w-8 text-center">
                    {titleAtCap ? "100" : Math.round(titleZoom * 100)}%
                  </span>
                  <button
                    onClick={() => !titleAtCap && setTitleZoom(z => stepZoom(z, 0.1))}
                    disabled={titleAtCap}
                    className={`${btnBase} ${titleAtCap ? btnDisabled : btnActive}`}
                  ><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>

          {/* ── ยืนยัน ── */}
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-base disabled:opacity-40 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            ยืนยันข้อมูลส่งปริ้น
          </button>

          <Link
            href="/payment"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl border border-gold-300 bg-cream-50 text-gold-600 font-medium text-sm hover:bg-cream-100 transition-colors"
          >
            ย้อนกลับ
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

/* ── Sign card constants ── */
const CARD_W = 288;
const CARD_H = 80;
/* ชื่อ: margin 12px แต่ละด้าน | ตำแหน่ง: margin 24px แต่ละด้าน (แคบกว่า) */
const NAME_AVAILABLE = CARD_W - 24;
const TITLE_AVAILABLE = CARD_W - 48;

function SignPreview({
  name, title,
  nameZoom, titleZoom,
  nameY, titleY,
  onNameAtCap, onTitleAtCap,
}: {
  name: string; title: string;
  nameZoom: number; titleZoom: number;
  nameY: number; titleY: number;
  onNameAtCap: (v: boolean) => void;
  onTitleAtCap: (v: boolean) => void;
}) {
  const displayName = name.trim() || "ชื่อผู้มอบ";
  const displayTitle = title.trim();
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const MAX = 26 * nameZoom;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) {
      const ratio = NAME_AVAILABLE / tw;
      onNameAtCap(ratio < 1);
      el.style.fontSize = Math.max(6, Math.min(MAX, ratio * MAX)) + "px";
    } else {
      onNameAtCap(false);
    }
  }, [displayName, nameZoom, onNameAtCap]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const MAX = 14 * titleZoom;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) {
      const ratio = TITLE_AVAILABLE / tw;
      onTitleAtCap(ratio < 1);
      el.style.fontSize = Math.max(5, Math.min(MAX, ratio * MAX)) + "px";
    } else {
      onTitleAtCap(false);
    }
  }, [displayTitle, titleZoom, onTitleAtCap]);

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

        <div className="relative h-full">
          {/* ชื่อ — margin 12px */}
          <div className="absolute left-3 right-3 flex justify-center" style={{ top: `${nameY}px` }}>
            <p ref={nameRef} className="font-bold text-gold-800 whitespace-nowrap leading-tight text-center">
              {displayName}
            </p>
          </div>
          {/* ตำแหน่ง — margin 24px (แคบกว่าชื่อ) */}
          {displayTitle && (
            <div className="absolute left-6 right-6 flex justify-center" style={{ top: `${titleY}px` }}>
              <p ref={titleRef} className="text-gold-600 whitespace-nowrap leading-tight text-center">
                {displayTitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

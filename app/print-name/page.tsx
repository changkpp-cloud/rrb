"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Briefcase, Check, Minus, Plus } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

const MESSAGES = [
  "ขอแสดงความเสียใจอย่างสุดซึ้ง",
  "ด้วยความอาลัย",
];

export default function PrintNamePage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState(MESSAGES[0]);
  const [nameZoom, setNameZoom] = useState(1.0);
  const [titleZoom, setTitleZoom] = useState(1.0);
  const router = useRouter();

  function stepZoom(current: number, delta: number) {
    return parseFloat(Math.min(2.0, Math.max(0.3, current + delta)).toFixed(1));
  }

  function handleConfirm() {
    if (!name.trim()) return;
    const q = new URLSearchParams({ name: name.trim(), title: title.trim(), message });
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
          {/* + button */}
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

          {/* Preview card */}
          <SignPreview name={name} title={title} message={message} nameZoom={nameZoom} titleZoom={titleZoom} />

          {/* ── ปรับขนาดตัวอักษร ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-gold-700">ปรับขนาดตัวอักษร</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gold-600 w-10 flex-shrink-0">ชื่อ</span>
              <button
                onClick={() => setNameZoom(z => stepZoom(z, -0.1))}
                className="w-8 h-8 rounded-lg border border-gold-300 bg-white text-gold-700 font-bold flex items-center justify-center hover:bg-gold-50 active:scale-95 transition-all"
              ><Minus className="w-3.5 h-3.5" /></button>
              <span className="flex-1 text-center text-xs text-gold-700 font-medium">{Math.round(nameZoom * 100)}%</span>
              <button
                onClick={() => setNameZoom(z => stepZoom(z, 0.1))}
                className="w-8 h-8 rounded-lg border border-gold-300 bg-white text-gold-700 font-bold flex items-center justify-center hover:bg-gold-50 active:scale-95 transition-all"
              ><Plus className="w-3.5 h-3.5" /></button>
            </div>
            {title.trim() && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gold-600 w-10 flex-shrink-0">ตำแหน่ง</span>
                <button
                  onClick={() => setTitleZoom(z => stepZoom(z, -0.1))}
                  className="w-8 h-8 rounded-lg border border-gold-300 bg-white text-gold-700 font-bold flex items-center justify-center hover:bg-gold-50 active:scale-95 transition-all"
                ><Minus className="w-3.5 h-3.5" /></button>
                <span className="flex-1 text-center text-xs text-gold-700 font-medium">{Math.round(titleZoom * 100)}%</span>
                <button
                  onClick={() => setTitleZoom(z => stepZoom(z, 0.1))}
                  className="w-8 h-8 rounded-lg border border-gold-300 bg-white text-gold-700 font-bold flex items-center justify-center hover:bg-gold-50 active:scale-95 transition-all"
                ><Plus className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* ── ชื่อผู้มอบ ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2">
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

          {/* ── ตำแหน่ง ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2">
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

          {/* ── ข้อความอาลัย ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-3">
            <div className="flex items-center gap-2 text-gold-700">
              <LotusIcon className="w-4 h-4 text-gold-600" />
              <span className="text-sm font-semibold">ข้อความแสดงความอาลัย</span>
            </div>
            <div className="flex flex-col gap-2">
              {MESSAGES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMessage(m)}
                  className={`relative w-full px-4 py-2.5 rounded-xl border text-sm text-left transition-all flex items-center gap-2 ${
                    message === m && MESSAGES.includes(message)
                      ? "gold-gradient text-white border-transparent shadow"
                      : "bg-white text-gold-700 border-gold-300 hover:border-gold-500"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    message === m && MESSAGES.includes(message)
                      ? "border-white bg-white/30"
                      : "border-gold-300"
                  }`}>
                    {message === m && MESSAGES.includes(message) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </span>
                  {m}
                </button>
              ))}
            </div>
            {/* ช่องกรอกข้อความเอง */}
            <div className="relative">
              <input
                type="text"
                value={MESSAGES.includes(message) ? "" : message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => { if (MESSAGES.includes(message)) setMessage(""); }}
                placeholder="หรือพิมพ์ข้อความอาลัยเอง..."
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm pr-8 transition-all ${
                  !MESSAGES.includes(message) && message
                    ? "border-gold-500 ring-1 ring-gold-400"
                    : "border-gold-300"
                }`}
              />
              {!MESSAGES.includes(message) && message && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
          </div>

          {/* ── Buttons ── */}
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

/* ── Preview card ── */
/* ขนาดจริง 9×24 นิ้ว → scale 12px/inch → 288×108px (ล็อคคงที่) */
const CARD_W = 288;
const CARD_H = 80;

function SignPreview({ name, title, message, nameZoom, titleZoom }: {
  name: string; title: string; message: string; nameZoom: number; titleZoom: number;
}) {
  const displayName = name.trim() || "ชื่อผู้มอบ";
  const displayTitle = title.trim();
  const nameRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  const available = CARD_W - 12;

  useEffect(() => {
    const nameEl = nameRef.current;
    if (!nameEl) return;
    const MAX_PX = 26 * nameZoom;
    nameEl.style.fontSize = MAX_PX + "px";
    nameEl.style.width = "max-content";
    const textW = nameEl.getBoundingClientRect().width;
    nameEl.style.width = "";
    if (textW > 0) {
      const size = Math.max(6, Math.min(MAX_PX, (available / textW) * MAX_PX));
      nameEl.style.fontSize = size + "px";
    }
  }, [displayName, available, nameZoom]);

  useEffect(() => {
    const titleEl = titleRef.current;
    if (!titleEl) return;
    const MAX_PX = 11 * titleZoom;
    titleEl.style.fontSize = MAX_PX + "px";
    titleEl.style.width = "max-content";
    const textW = titleEl.getBoundingClientRect().width;
    titleEl.style.width = "";
    if (textW > 0) {
      const size = Math.max(5, Math.min(MAX_PX, (available / textW) * MAX_PX));
      titleEl.style.fontSize = size + "px";
    }
  }, [displayTitle, available, titleZoom]);

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
          {/* ชื่อ + ตำแหน่ง — flex column ยึดบน ชื่อไม่ขยับเมื่อเพิ่มตำแหน่ง */}
          <div className="absolute left-2 right-2 top-[6px] flex flex-col items-center gap-0.5">
            <p ref={nameRef} className="font-bold text-gold-800 whitespace-nowrap leading-tight text-center">
              {displayName}
            </p>
            {displayTitle && (
              <p ref={titleRef} className="text-gold-600 whitespace-nowrap leading-tight text-center">
                {displayTitle}
              </p>
            )}
          </div>
          {/* ข้อความ — ยึดตำแหน่งล่างคงที่ */}
          <div className="absolute left-2 right-2 bottom-[5px]">
            <div className="flex items-center gap-1 w-full mb-0.5">
              <div className="flex-1 h-px bg-gold-300/60" />
              <span className="text-gold-400 text-[6px]">◆</span>
              <div className="flex-1 h-px bg-gold-300/60" />
            </div>
            <p className="text-[12px] text-gold-700 text-center leading-tight">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

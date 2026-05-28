"use client";

import { useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import AiPhotoSection from "@/components/ai-photo/AiPhotoSection";
import type { Memorial } from "@/lib/supabase/types";

const SIGN_W = 260;
const SIGN_H = 72;
const NAME_AVAILABLE = SIGN_W - 24;
const TITLE_AVAILABLE = 220;

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
function thaiDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function ECardClient({ memorial, basePath = "" }: { memorial: Memorial; basePath?: string }) {
  const params = useSearchParams();
  const name    = params.get("name")    ?? "";
  const title   = params.get("title")   ?? "";
  const amount  = params.get("amount")  ?? "";
  const message = params.get("message") ?? "";

  const cardRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving]           = useState(false);
  const [showAmount, setShowAmount]   = useState(false);
  const [blinking, setBlinking]       = useState(false);
  const [cardWidth, setCardWidth]     = useState(360);

  function handleStyleChange(withAmount: boolean) {
    setShowAmount(withAmount);
    setBlinking(true);
    setTimeout(() => setBlinking(false), 1000);
  }

  const deceasedName = memorial.name;
  const birthDate    = memorial.birth_date ? thaiDate(memorial.birth_date) : "";
  const deathDate    = memorial.death_date ? thaiDate(memorial.death_date) : "";
  const ceremonyDate = thaiDate(memorial.ceremony_date);
  const ceremonyLocation = [memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ");

  async function handleSaveCard() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `E-card-${name || "ecard"}-${showAmount ? "แสดงยอด" : "ไม่แสดงยอด"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {}
    setSaving(false);
  }

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = cardWidth / 360;
  // sign proportions mirror SignPreview (BASE_W=288)
  const signW = cardWidth - 2 * Math.round(16 * s);
  const sf = signW / 288;

  return (
    <>
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "#ffffff" }}
    >
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
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

          {/* ── SECTION 1: E-Card ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <LotusIcon className="w-4 h-4 text-gold-500" />
              <span className="text-sm font-semibold text-gold-700">E-card ขอบคุณ</span>
            </div>

            {/* Style toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => handleStyleChange(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                  !showAmount ? "gold-gradient text-white border-transparent shadow-sm" : "bg-white border-gold-200 text-gold-600 hover:border-gold-300"
                }`}
              >
                ไม่แสดงยอดเงิน
              </button>
              <button
                onClick={() => handleStyleChange(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                  showAmount ? "gold-gradient text-white border-transparent shadow-sm" : "bg-white border-gold-200 text-gold-600 hover:border-gold-300"
                }`}
              >
                แสดงยอดเงิน
              </button>
            </div>

            {/* E-card — fixed 1080×1350 px saved (360×450 element × pixelRatio 3) */}
            <div
              ref={cardRef}
              style={{
                width: "100%",
                height: Math.round(cardWidth * 5 / 4),
                background: "linear-gradient(170deg,#fdf8ee 0%,#f5e4b5 35%,#fdf8ee 65%,#eedfa8 100%)",
                border: "1.5px solid #e8c97a",
                borderRadius: 0,
                boxShadow: "0 8px 32px rgba(184,134,11,0.10)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "'Sarabun', sans-serif",
              }}
            >
              {/* Header — 50px element = 150px saved */}
              <div style={{ background: "linear-gradient(90deg,#c4a052,#e0c070,#eacf80,#e0c070,#c4a052)", padding: `${Math.round(15*s)}px ${Math.round(16*s)}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(8*s), flexShrink: 0 }}>
                <span style={{ display: "inline-flex", width: Math.round(20*s), height: Math.round(20*s), color: "rgba(255,255,255,0.9)" }}><LotusIcon className="w-full h-full" /></span>
                <span style={{ color: "white", fontWeight: 700, fontSize: Math.round(15*s), letterSpacing: "0.22em", fontFamily: "'Sarabun', sans-serif" }}>หรีดร่วมบุญ · Zero Waste</span>
                <span style={{ display: "inline-flex", width: Math.round(20*s), height: Math.round(20*s), color: "rgba(255,255,255,0.9)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
              </div>

              {/* ── Content (safe zone) — fills remaining space between header and bottom zone ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", padding: `0 ${Math.round(16*s)}px`, overflow: "hidden" }}>

                {/* ส่วนที่ 1: ผู้มอบ */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(4*s), width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: Math.round(6*s) }}>
                    <span style={{ display: "inline-flex", width: Math.round(14*s), height: Math.round(14*s), color: "#e0c070" }}><LotusIcon className="w-full h-full" /></span>
                    <p style={{ fontSize: Math.round(12*s), color: "#92400e", letterSpacing: "0.1em", margin: 0 }}>เจ้าภาพขอขอบพระคุณ</p>
                    <span style={{ display: "inline-flex", width: Math.round(14*s), height: Math.round(14*s), color: "#e0c070" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
                  </div>
                  <p style={{ fontWeight: 700, color: "#78350f", fontSize: Math.round(22*s), lineHeight: 1.25, margin: 0, textAlign: "center" }}>
                    {name || "ชื่อ หรือ องค์กร"}
                  </p>
                  {title && (
                    <p style={{ fontSize: Math.round(12*s), color: "#92400e", margin: 0, textAlign: "center", lineHeight: 1.4 }}>{title}</p>
                  )}
                  <p style={{ fontSize: Math.round(12*s), color: "#92400e", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
                    {showAmount
                      ? <>ร่วมมอบหรีดร่วมบุญ <span style={{ fontWeight: 700, color: "#78350f" }}>{amount ? parseInt(amount).toLocaleString() : "500"} บาท</span></>
                      : "ร่วมมอบหรีดร่วมบุญ"
                    }
                  </p>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: Math.round(8*s), width: "100%" }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #e0c070)" }} />
                  <span style={{ color: "#e0c070", fontSize: Math.round(13*s) }}>❖</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #e0c070)" }} />
                </div>

                {/* ส่วนที่ 2: ผู้วายชนม์ */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(5*s) }}>
                  <p style={{ fontSize: Math.round(11*s), color: "#a16207", letterSpacing: "0.12em", margin: 0 }}>แด่ผู้วายชนม์</p>

                  <div style={{ width: Math.round(64*s), height: Math.round(76*s), borderRadius: "50% / 45%", overflow: "hidden", border: "1.5px solid #e8c97a", boxShadow: "0 3px 10px rgba(184,134,11,0.10), 0 0 0 3px rgba(253,248,238,0.8), 0 0 0 5px rgba(201,168,76,0.10)" }}>
                    {memorial.photo_url ? (
                      <img src={memorial.photo_url} alt={deceasedName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ display: "inline-flex", width: Math.round(30*s), height: Math.round(30*s), color: "#e0c070" }}><LotusIcon className="w-full h-full" /></span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontWeight: 700, color: "#78350f", fontSize: Math.round(16*s), lineHeight: 1.3, margin: 0 }}>{deceasedName}</p>
                    {(birthDate || deathDate) && (
                      <p style={{ fontSize: Math.round(10*s), color: "#92400e", margin: `${Math.round(3*s)}px 0 0`, lineHeight: 1.7 }}>
                        {birthDate && <>ชาตะ {birthDate}{deathDate ? "  ·  " : ""}</>}{deathDate && <>มรณะ {deathDate}</>}
                      </p>
                    )}
                    {memorial.age > 0 && (
                      <p style={{ fontSize: Math.round(11*s), color: "#a16207", margin: `${Math.round(2*s)}px 0 0` }}>อายุ {memorial.age} ปี</p>
                    )}
                    <p style={{ fontSize: Math.round(13*s), color: "#92400e", fontWeight: 600, margin: `${Math.round(6*s)}px 0 0` }}>ฌาปนกิจ {ceremonyDate}</p>
                    {ceremonyLocation && <p style={{ fontSize: Math.round(10*s), color: "#a16207", margin: `${Math.round(2*s)}px 0 0` }}>{ceremonyLocation}</p>}
                  </div>
                </div>

              </div>

              {/* ── Bottom zone — 50px element = 150px saved, ทองเข้มเหมือน header ── */}
              <div style={{ height: Math.round(50*s), flexShrink: 0, background: "linear-gradient(90deg,#c4a052,#e0c070,#eacf80,#e0c070,#c4a052)", display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(10*s) }}>
                <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "rgba(255,255,255,0.5)" }}><LotusIcon className="w-full h-full" /></span>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: Math.round(10*s), letterSpacing: "0.35em" }}>❖ ❖ ❖</span>
                <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "rgba(255,255,255,0.5)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
              </div>
            </div>

            <button
              onClick={handleSaveCard}
              disabled={saving}
              className={`w-full gold-gradient text-white font-semibold py-3 rounded-xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${blinking ? "animate-pulse ring-4 ring-gold-400 ring-offset-1" : ""}`}
            >
              <Download className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึก E-card"}
            </button>
          </div>

          {/* ── SECTION 2: AI Photo Template System ── */}
          <AiPhotoSection
            donorName={name}
            donorPosition={title}
            condolenceText={message}
            deceasedName={deceasedName}
            funeralPlace={ceremonyLocation}
          />

          {/* Back */}
          <Link
            href={`${basePath}/print-name?${new URLSearchParams({ name, title, amount, message }).toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            ← ย้อนกลับ
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
    </>
  );
}

function ECardDonorSign({ name, title }: { name: string; title: string }) {
  const displayName  = name || "ผู้ร่วมบุญ";
  const displayTitle = title.trim();
  const nameRef  = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = nameRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const MAX = 18;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    const avail = container.getBoundingClientRect().width - 16;
    el.style.width = "";
    if (tw > 0 && avail > 0) {
      el.style.fontSize = Math.max(8, Math.min(MAX, (avail / tw) * MAX)) + "px";
    }
  }, [displayName]);

  useEffect(() => {
    const el = titleRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const MAX = 12;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    const avail = container.getBoundingClientRect().width - 16;
    el.style.width = "";
    if (tw > 0 && avail > 0) {
      el.style.fontSize = Math.max(6, Math.min(MAX, (avail / tw) * MAX)) + "px";
    }
  }, [displayTitle]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg,#fdf8ee 0%,#f9f0d8 100%)",
        border: "1.5px solid #c9a84c",
        boxShadow: "0 2px 10px rgba(184,134,11,0.15), inset 0 0 0 2px #fdf8ee, inset 0 0 0 3px #c9a84c33",
        minHeight: 52,
        padding: "8px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <p ref={nameRef} className="font-bold text-gold-800 whitespace-nowrap text-center w-full">
        {displayName}
      </p>
      {displayTitle && (
        <p ref={titleRef} className="text-gold-600 whitespace-nowrap text-center w-full">
          {displayTitle}
        </p>
      )}
    </div>
  );
}

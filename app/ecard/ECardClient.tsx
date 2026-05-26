"use client";

import { useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
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

type Pose = "stand" | "bow" | "kneel";

const POSES: { id: Pose; label: string; icon: React.ReactNode }[] = [
  {
    id: "stand",
    label: "ยืนถือป้าย",
    icon: (
      <svg viewBox="0 0 32 40" fill="none" className="w-7 h-9">
        <circle cx="16" cy="6" r="4.5" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="18" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 12v6M16 26v8M10 30l-4 8M22 30l4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 18l-3-3M22 18l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "bow",
    label: "ไหว้อาลัย",
    icon: (
      <svg viewBox="0 0 32 40" fill="none" className="w-7 h-9">
        <circle cx="16" cy="6" r="4.5" stroke="currentColor" strokeWidth="2" />
        <path d="M16 12v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 19s2 2 6 2 6-2 6-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 17l-5 2M20 17l5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13 21v10M19 21v10M13 31l-3 6M19 31l3 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11 21l3-1.5M21 21l-3-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "kneel",
    label: "นั่งคุกเข่า",
    icon: (
      <svg viewBox="0 0 32 40" fill="none" className="w-7 h-9">
        <circle cx="16" cy="6" r="4.5" stroke="currentColor" strokeWidth="2" />
        <path d="M16 12v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 16l6 4 6-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 16l-3 4M22 16l3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 20v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 28l-5 3M19 28l5 3M8 31h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function ECardClient({ memorial }: { memorial: Memorial }) {
  const params = useSearchParams();
  const name    = params.get("name")    ?? "";
  const title   = params.get("title")   ?? "";
  const amount  = params.get("amount")  ?? "";
  const message = params.get("message") ?? "";

  const cardRef     = useRef<HTMLDivElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving]           = useState(false);
  const [showAmount, setShowAmount]   = useState(false);
  const [blinking, setBlinking]       = useState(false);
  const [pose, setPose]               = useState<Pose>("stand");
  const [faceUrl, setFaceUrl]         = useState<string | null>(null);
  const [generating, setGenerating]   = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [savingMock, setSavingMock]   = useState(false);
  const [genError, setGenError]       = useState("");
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
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: "#fdf8ee" });
      const link = document.createElement("a");
      link.download = `E-card-ขอบคุณ-${name || "ecard"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSaving(false);
  }

  function handleFaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFaceUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/generate-wreath", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pose, donorName: name || "ผู้ร่วมบุญ", donorTitle: title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setGeneratedImg(data.url);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
  }

  async function handleSaveMock() {
    if (!generatedImg) return;
    setSavingMock(true);
    try {
      const canvas = document.createElement("canvas");
      const W = 800, H = 1067; // 3:4
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background image
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = generatedImg;
      await new Promise<void>((res, rej) => { bgImg.onload = () => res(); bgImg.onerror = rej; });
      ctx.drawImage(bgImg, 0, 0, W, H);

      // Face overlay if uploaded
      if (faceUrl) {
        const faceImg = new Image();
        faceImg.src = faceUrl;
        await new Promise<void>(res => { faceImg.onload = () => res(); });
        const headY = pose === "stand" ? 0.13 : pose === "bow" ? 0.16 : 0.24;
        const cx = W * 0.5, cy = H * headY;
        const rx = W * 0.11, ry = W * 0.13;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();
        const fz = rx * 2.6;
        ctx.drawImage(faceImg, cx - fz / 2, cy - ry, fz, fz * 1.2);
        ctx.restore();
      }

      // Name card overlay
      const cardH = H * 0.10;
      const cardY = H - cardH - H * 0.04;
      const cardX = W * 0.10;
      const cardW = W * 0.80;
      const r = 12;

      ctx.beginPath();
      ctx.moveTo(cardX + r, cardY);
      ctx.lineTo(cardX + cardW - r, cardY);
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
      ctx.lineTo(cardX + cardW, cardY + cardH - r);
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
      ctx.lineTo(cardX + r, cardY + cardH);
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
      ctx.lineTo(cardX, cardY + r);
      ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
      ctx.closePath();
      ctx.fillStyle = "rgba(253,248,238,0.94)";
      ctx.fill();
      ctx.strokeStyle = "#c9a84c";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.textAlign = "center";
      const displayName = name || "ผู้ร่วมบุญ";
      ctx.font = `bold 28px Sarabun, sans-serif`;
      ctx.fillStyle = "#78350f";
      ctx.fillText(displayName, W / 2, cardY + cardH * 0.48 + 12);
      if (title) {
        ctx.font = `18px Sarabun, sans-serif`;
        ctx.fillStyle = "#92400e";
        ctx.fillText(title, W / 2, cardY + cardH * 0.78 + 8);
      }

      const link = document.createElement("a");
      link.download = `หรีดร่วมบุญ-จำลอง-${name || "image"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSavingMock(false);
  }

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCardWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = cardWidth / 360;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
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

          {/* Page title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gold-800">ขอบคุณ</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-300" />
              <span className="text-gold-400 text-xs">❖</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-300" />
            </div>
          </div>

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

            {/* Portrait E-card 3:4 — all sizes scale with card width via s = cardWidth/360 */}
            <div
              ref={cardRef}
              style={{
                width: "100%",
                aspectRatio: "3/4",
                background: "linear-gradient(170deg,#fdf8ee 0%,#f5e4b5 35%,#fdf8ee 65%,#eedfa8 100%)",
                border: "2px solid #c9a84c",
                borderRadius: 20,
                boxShadow: "0 12px 40px rgba(184,134,11,0.28)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{ background: "linear-gradient(90deg,#8B6914,#c9a84c,#d4a832,#c9a84c,#8B6914)", padding: `${Math.round(10*s)}px ${Math.round(16*s)}px`, display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(8*s), flexShrink: 0 }}>
                <span style={{ display: "inline-flex", width: Math.round(20*s), height: Math.round(20*s), color: "rgba(255,255,255,0.9)" }}><LotusIcon className="w-full h-full" /></span>
                <span style={{ color: "white", fontWeight: 700, fontSize: Math.round(15*s), letterSpacing: "0.22em", fontFamily: "sans-serif" }}>หรีดร่วมบุญ · Zero Waste</span>
                <span style={{ display: "inline-flex", width: Math.round(20*s), height: Math.round(20*s), color: "rgba(255,255,255,0.9)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
              </div>

              {/* Body */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly", padding: `${Math.round(8*s)}px ${Math.round(16*s)}px` }}>

                {/* Deceased photo + info */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(4*s) }}>
                  <div style={{ width: Math.round(72*s), height: Math.round(86*s), borderRadius: "50% / 45%", overflow: "hidden", border: "2.5px solid #c9a84c", boxShadow: "0 6px 20px rgba(184,134,11,0.35), 0 0 0 4px rgba(253,248,238,0.8), 0 0 0 6px rgba(201,168,76,0.3)" }}>
                    {memorial.photo_url ? (
                      <img src={memorial.photo_url} alt={deceasedName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ display: "inline-flex", width: Math.round(36*s), height: Math.round(36*s), color: "#c9a84c" }}><LotusIcon className="w-full h-full" /></span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontWeight: 700, color: "#78350f", fontSize: Math.round(18*s), lineHeight: 1.3, margin: 0 }}>{deceasedName}</p>
                    {(birthDate || deathDate) && (
                      <p style={{ fontSize: Math.round(11*s), color: "#92400e", marginTop: Math.round(4*s), lineHeight: 1.6 }}>
                        {birthDate && <>ชาตะ {birthDate}<br /></>}
                        {deathDate && <>มรณะ {deathDate}</>}
                      </p>
                    )}
                    {memorial.age ? <p style={{ fontSize: Math.round(11*s), color: "#a16207", marginTop: Math.round(2*s) }}>อายุ {memorial.age} ปี</p> : null}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: Math.round(8*s), width: "100%" }}>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #c9a84c)" }} />
                  <span style={{ color: "#c9a84c", fontSize: Math.round(14*s) }}>❖</span>
                  <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #c9a84c)" }} />
                </div>

                {/* Donor section */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(6*s), width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: Math.round(6*s) }}>
                    <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "#c9a84c" }}><LotusIcon className="w-full h-full" /></span>
                    <p style={{ fontSize: Math.round(13*s), color: "#92400e", letterSpacing: "0.12em", margin: 0 }}>เจ้าภาพขอขอบพระคุณ</p>
                    <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "#c9a84c" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
                  </div>

                  <div style={{ width: "100%", background: "linear-gradient(135deg,#fdf8ee,#f9f0d8)", border: "1.5px solid #c9a84c", borderRadius: Math.round(10*s), padding: `${Math.round(8*s)}px ${Math.round(12*s)}px`, textAlign: "center", boxShadow: "0 2px 12px rgba(184,134,11,0.18), inset 0 0 0 2px #fdf8ee, inset 0 0 0 3px rgba(201,168,76,0.25)" }}>
                    <p style={{ fontWeight: 700, color: "#78350f", fontSize: Math.round(22*s), margin: 0, lineHeight: 1.25 }}>{name || "ผู้ร่วมบุญ"}</p>
                    {title && <p style={{ color: "#92400e", fontSize: Math.round(13*s), marginTop: Math.round(4*s), lineHeight: 1.3 }}>{title}</p>}
                  </div>

                  {showAmount && amount && (
                    <div style={{ textAlign: "center", background: "rgba(253,248,238,0.7)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: Math.round(8*s), padding: `${Math.round(5*s)}px ${Math.round(20*s)}px` }}>
                      <p style={{ fontSize: Math.round(11*s), color: "#a16207", margin: 0 }}>ยอดร่วมบุญ</p>
                      <p style={{ fontSize: Math.round(22*s), fontWeight: 700, color: "#78350f", margin: 0 }}>฿{parseInt(amount).toLocaleString()}</p>
                    </div>
                  )}

                  <p style={{ fontSize: Math.round(13*s), color: "#92400e", textAlign: "center", lineHeight: 1.7, margin: 0 }}>
                    ที่ร่วมอาลัย และร่วมทำบุญในครั้งนี้
                  </p>
                </div>

                {/* Lotus row */}
                <div style={{ display: "flex", gap: Math.round(8*s), alignItems: "center" }}>
                  <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "rgba(201,168,76,0.5)" }}><LotusIcon className="w-full h-full" /></span>
                  <span style={{ display: "inline-flex", width: Math.round(24*s), height: Math.round(24*s), color: "#c9a84c" }}><LotusIcon className="w-full h-full" /></span>
                  <span style={{ display: "inline-flex", width: Math.round(16*s), height: Math.round(16*s), color: "rgba(201,168,76,0.5)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
                </div>

              </div>

              {/* Footer */}
              <div style={{ borderTop: "1px solid rgba(201,168,76,0.35)", background: "rgba(253,248,238,0.85)", padding: `${Math.round(8*s)}px ${Math.round(14*s)}px`, textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: Math.round(13*s), color: "#92400e", fontWeight: 600, margin: 0 }}>ฌาปนกิจ {ceremonyDate}</p>
                {ceremonyLocation && <p style={{ fontSize: Math.round(10*s), color: "#a16207", marginTop: Math.round(2*s) }}>{ceremonyLocation}</p>}
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

          {/* ── SECTION 2: Mock wreath AI ── */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span className="text-sm font-semibold text-gold-700">จำลองภาพมอบหรีดร่วมบุญ</span>
            </div>
            <p className="text-xs text-gold-500 -mt-1">เลือกท่าทาง แล้วกดแนบรูปเพื่อสร้างภาพที่ระลึก</p>

            {/* 3 pose boxes */}
            <div className="grid grid-cols-3 gap-2">
              {POSES.map(p => {
                const isSelected = pose === p.id;
                const hasResult = isSelected && generatedImg;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setPose(p.id); faceInputRef.current?.click(); }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                      isSelected ? "border-gold-500" : "border-gold-200 hover:border-gold-300"
                    }`}
                    style={{ aspectRatio: "3/4" }}
                  >
                    {/* Background */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: isSelected
                          ? "linear-gradient(160deg,#fdf4dd 0%,#f5e0a0 50%,#fdf4dd 100%)"
                          : "linear-gradient(160deg,#fdf8ee 0%,#f5edd8 100%)",
                      }}
                    />

                    {/* Generated image */}
                    {hasResult && (
                      <img src={generatedImg!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}

                    {/* Content overlay */}
                    <div className="relative flex flex-col items-center justify-between h-full py-3 px-1">
                      {/* Pose illustration */}
                      <div className={`flex flex-col items-center gap-1 flex-1 justify-center ${hasResult ? "opacity-0" : ""}`}>
                        <div className={isSelected ? "text-gold-600" : "text-gold-300"}>{p.icon}</div>
                        <span className="text-[9px] font-medium text-gold-500 text-center leading-tight">{p.label}</span>
                      </div>

                      {/* CTA */}
                      {!hasResult && (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-6 h-6 rounded-full bg-white border border-gold-300 flex items-center justify-center shadow-sm">
                            <span className="text-gold-500 text-base leading-none font-light">+</span>
                          </div>
                          <p className="text-[8px] text-gold-400 text-center leading-tight mt-0.5">กดแนบรูป<br/>เพื่อสร้างภาพนี้</p>
                        </div>
                      )}
                    </div>

                    {/* Face badge */}
                    {isSelected && faceUrl && !hasResult && (
                      <div className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full overflow-hidden border-2 border-gold-400 shadow">
                        <img src={faceUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <input ref={faceInputRef} type="file" accept="image/*" className="hidden" onChange={handleFaceChange} />

            {/* Generate button — shows after face uploaded */}
            {faceUrl && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-60 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "กำลังสร้างภาพ..." : "สร้างภาพที่ระลึก"}
              </button>
            )}

            {genError && <p className="text-xs text-red-400 text-center">{genError}</p>}

            {generatedImg && (
              <button
                onClick={handleSaveMock}
                disabled={savingMock}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gold-300 bg-white text-gold-700 text-sm font-medium hover:bg-gold-50 disabled:opacity-40 transition-all"
              >
                <Download className="w-4 h-4" />
                {savingMock ? "กำลังบันทึก..." : "บันทึกภาพ"}
              </button>
            )}
          </div>

          {/* Back */}
          <Link
            href={`/print-name?${new URLSearchParams({ name, title, amount, message }).toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            ← ย้อนกลับ
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
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

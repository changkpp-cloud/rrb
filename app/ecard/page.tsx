"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Share2, Home, Download, Flower2, FileText } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

const DECEASED_NAME = "นางสาว สุภาพร ปทุมานนท์";
const CEREMONY_DATE = "20 มีนาคม 2559";
const CEREMONY_LOCATION = "วัดไตรภูมิ ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร";

const SIGN_W = 288;
const SIGN_H = 80;
const NAME_AVAILABLE = SIGN_W - 24;
const TITLE_AVAILABLE = SIGN_W - 48;

export default function ECardPage() {
  return (
    <Suspense>
      <ECardInner />
    </Suspense>
  );
}

function ECardInner() {
  const params = useSearchParams();
  const name = params.get("name") ?? "";
  const title = params.get("title") ?? "";
  const nameZoom = parseFloat(params.get("nameZoom") ?? "1");
  const titleZoom = parseFloat(params.get("titleZoom") ?? "1");
  const nameY = parseInt(params.get("nameY") ?? "6");
  const titleY = parseInt(params.get("titleY") ?? "28");

  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const extraParams = new URLSearchParams({
    name, title,
    nameZoom: String(nameZoom), titleZoom: String(titleZoom),
    nameY: String(nameY), titleY: String(titleY),
  }).toString();

  async function handleSave() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#fdf8ee",
      });
      const link = document.createElement("a");
      link.download = `หรีดร่วมบุญ-${name || "ecard"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {}
    setSaving(false);
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "หรีดร่วมบุญ Zero Waste",
          text: `${name || "ผู้ร่วมบุญ"} ขอร่วมแสดงความอาลัยแด่ ${DECEASED_NAME}`,
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
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
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

          {/* Page title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gold-800">ภาพมอบหรีดร่วมบุญ</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-300" />
              <span className="text-gold-400 text-xs">❖</span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-300" />
            </div>
          </div>

          {/* ── E-Card ── */}
          <div
            ref={cardRef}
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#fdf8ee 0%,#f0e0b8 50%,#fdf8ee 100%)",
              border: "2px solid #c9a84c",
              boxShadow: "0 8px 32px rgba(184,134,11,0.22)",
            }}
          >
            {/* Gold header strip */}
            <div className="gold-gradient px-4 py-2.5 flex items-center justify-center gap-2">
              <LotusIcon className="w-4 h-4 text-white/90" />
              <span className="text-white font-semibold text-xs tracking-[0.18em]">หรีดร่วมบุญ · Zero Waste</span>
              <LotusIcon className="w-4 h-4 text-white/90 scale-x-[-1]" />
            </div>

            {/* ── เจ้าภาพขอขอบพระคุณ ── */}
            <div className="pt-5 pb-3 px-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-3 select-none">
                <div className="flex-1 h-px bg-gold-300/60" />
                <LotusIcon className="w-3.5 h-3.5 text-gold-400" />
                <span className="text-gold-400 text-[9px]">✦</span>
                <LotusIcon className="w-3.5 h-3.5 text-gold-400 scale-x-[-1]" />
                <div className="flex-1 h-px bg-gold-300/60" />
              </div>

              <p className="text-[11px] text-gold-500 tracking-[0.30em] uppercase mb-1">— ด้วยความซาบซึ้งใจ —</p>
              <h3
                className="font-bold text-gold-800 leading-snug"
                style={{ fontSize: "22px" }}
              >
                เจ้าภาพขอขอบพระคุณ
              </h3>
            </div>

            {/* ── ป้ายชื่อหรีด ── */}
            <div className="flex justify-center pb-4 px-3">
              <DonorSign
                name={name} title={title}
                nameZoom={nameZoom} titleZoom={titleZoom}
                nameY={nameY} titleY={titleY}
              />
            </div>

            {/* ── divider ── */}
            <div className="mx-5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gold-300/50" />
                <LotusIcon className="w-3 h-3 text-gold-400" />
                <div className="flex-1 h-px bg-gold-300/50" />
              </div>
            </div>

            {/* ── ข้อมูลผู้วายชนม์ ── */}
            <div className="px-5 py-4 text-center space-y-1">
              <p className="text-xs text-gold-700 leading-relaxed">เป็นอย่างสูงที่ร่วม</p>
              <p className="font-bold text-gold-600 text-sm tracking-wide">หรีดร่วมบุญ Zero Waste</p>
              <p className="text-xs text-gold-700 leading-relaxed">แสดงความอาลัยแด่</p>
              <p className="font-bold text-gold-800 text-sm pt-0.5">{DECEASED_NAME}</p>
              <p className="text-xs text-gold-600">ฌาปนกิจ {CEREMONY_DATE}</p>
              <p className="text-[10px] text-gold-500">{CEREMONY_LOCATION}</p>
            </div>

            {/* Bottom ornament */}
            <div className="pb-4 flex items-center justify-center gap-1 select-none">
              <LotusIcon className="w-3 h-3 text-gold-300" />
              <span className="text-gold-300 text-[7px]">◆</span>
              <LotusIcon className="w-3 h-3 text-gold-300 scale-x-[-1]" />
            </div>

          </div>

          {/* Save + Share buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกอีการ์ด"}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              แชร์
            </button>
          </div>

          {/* Extra menu buttons */}
          <div className="flex gap-3">
            <Link
              href={`/mock-wreath?${extraParams}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <Flower2 className="w-4 h-4" />
              จำลองภาพมอบหรีด
            </Link>
            <Link
              href={`/certificate?${extraParams}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-gold-400 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              ออกหลักฐานการมอบ
            </Link>
          </div>

          {/* Home button */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-gold-300 bg-cream-50 text-gold-600 font-medium text-sm hover:bg-cream-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

function DonorSign({
  name, title,
  nameZoom, titleZoom,
  nameY, titleY,
}: {
  name: string; title: string;
  nameZoom: number; titleZoom: number;
  nameY: number; titleY: number;
}) {
  const displayName = name || "ผู้ร่วมบุญ";
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
    if (tw > 0) el.style.fontSize = Math.max(6, Math.min(MAX, (NAME_AVAILABLE / tw) * MAX)) + "px";
  }, [displayName, nameZoom]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const MAX = 14 * titleZoom;
    el.style.fontSize = MAX + "px";
    el.style.width = "max-content";
    const tw = el.getBoundingClientRect().width;
    el.style.width = "";
    if (tw > 0) el.style.fontSize = Math.max(5, Math.min(MAX, (TITLE_AVAILABLE / tw) * MAX)) + "px";
  }, [displayTitle, titleZoom]);

  return (
    <div
      className="relative flex-shrink-0 rounded-xl overflow-hidden"
      style={{
        width: SIGN_W,
        height: SIGN_H,
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
        <div className="absolute left-3 right-3 flex justify-center" style={{ top: `${nameY}px` }}>
          <p ref={nameRef} className="font-bold text-gold-800 whitespace-nowrap leading-tight text-center">
            {displayName}
          </p>
        </div>
        {displayTitle && (
          <div className="absolute left-6 right-6 flex justify-center" style={{ top: `${titleY}px` }}>
            <p ref={titleRef} className="text-gold-600 whitespace-nowrap leading-tight text-center">
              {displayTitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

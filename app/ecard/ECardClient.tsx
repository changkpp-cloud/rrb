"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Camera, Check, Download, FileText, Image as ImageIcon, Share2 } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import IosPageHeader from "@/components/IosPageHeader";
import AiPhotoSectionV2 from "@/components/ai-photo/AiPhotoSectionV2";
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
  const name       = params.get("name")        ?? "";
  const title      = params.get("title")       ?? "";
  const amount     = params.get("amount")      ?? "";
  const message    = params.get("message")     ?? "";
  const donationId = params.get("donation_id") ?? "";

  const cardRef = useRef<HTMLDivElement>(null);

  const [saving, setSaving]       = useState(false);
  const [sharing, setSharing]     = useState(false);
  const [shared, setShared]       = useState(false);
  const [cardWidth, setCardWidth] = useState(360);
  const [memorialPhotoSrc, setMemorialPhotoSrc] = useState(memorial.photo_url ?? "");

  const requestedView = params.get("view");
  const activeView =
    requestedView === "ai" || requestedView === "certificate"
      ? requestedView
      : "ecard";
  const showAmount = activeView === "certificate";
  const memorialPhotoCacheKey = useMemo(
    () => `rrb:ecard:memorial-photo:${memorial.id}`,
    [memorial.id]
  );

  const deceasedName = memorial.name;
  const birthDate    = memorial.birth_date ? thaiDate(memorial.birth_date) : "";
  const deathDate    = memorial.death_date ? thaiDate(memorial.death_date) : "";
  const ceremonyDate = thaiDate(memorial.ceremony_date);
  const ceremonyLocation = [memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ");

  function buildViewHref(view: "ai" | "ecard" | "certificate") {
    const q = new URLSearchParams({ name, title, amount, message });
    if (donationId) q.set("donation_id", donationId);
    q.set("view", view);
    return `${basePath}/ecard?${q.toString()}`;
  }

  async function handleShareLine() {
    setSharing(true);
    const shareUrl = window.location.href;
    const shareTitle = showAmount
      ? `เอกสารมอบหรีด — ${name}${title ? ` (${title})` : ""} ยอด ${parseInt(amount).toLocaleString()} บาท`
      : `E-Card ขอบคุณ — ${name}${title ? ` · ${title}` : ""}`;
    const shareText = `ร่วมมอบหรีดร่วมบุญในงานของ ${deceasedName} 🌸\n#หรีดร่วมบุญ #ZeroWaste`;

    // Try Web Share API (works natively on mobile LINE browser)
    if (navigator.share) {
      try {
        // Try sharing the card as an image file first
        if (cardRef.current && !sharing) {
          const { toPng } = await import("html-to-image");
          const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const filename = showAmount ? "เอกสารมอบหรีด.png" : "E-card-ขอบคุณ.png";
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: shareTitle, text: shareText });
            setShared(true); setTimeout(() => setShared(false), 2500);
            setSharing(false); return;
          }
        }
        await navigator.share({ url: shareUrl, title: shareTitle, text: shareText });
        setShared(true); setTimeout(() => setShared(false), 2500);
        setSharing(false); return;
      } catch (e) {
        if ((e as Error).name === "AbortError") { setSharing(false); return; }
      }
    }

    // Fallback: open LINE share URL
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank", "noopener");
    setShared(true); setTimeout(() => setShared(false), 2500);
    setSharing(false);
  }

  async function handleSaveCard() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = showAmount
        ? `เอกสารมอบหรีด-${name || "document"}.png`
        : `E-card-ขอบคุณ-${name || "ecard"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {}
    setSaving(false);
  }

  useEffect(() => {
    if (!memorial.photo_url) {
      setMemorialPhotoSrc("");
      return;
    }

    const cached = window.sessionStorage.getItem(memorialPhotoCacheKey);
    if (cached) {
      setMemorialPhotoSrc(cached);
      return;
    }

    let cancelled = false;
    setMemorialPhotoSrc(memorial.photo_url);

    fetch(memorial.photo_url)
      .then((response) => {
        if (!response.ok) throw new Error("photo fetch failed");
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("photo read failed"));
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUrl) => {
        if (cancelled) return;
        setMemorialPhotoSrc(dataUrl);
        try {
          window.sessionStorage.setItem(memorialPhotoCacheKey, dataUrl);
        } catch {}
      })
      .catch(() => {
        if (!cancelled) setMemorialPhotoSrc(memorial.photo_url ?? "");
      });

    return () => {
      cancelled = true;
    };
  }, [memorial.photo_url, memorialPhotoCacheKey]);

  useEffect(() => {
    if (activeView === "ai") return;

    let ro: ResizeObserver | null = null;
    let frame = 0;

    const bindCardSize = () => {
      const el = cardRef.current;
      if (!el) {
        frame = requestAnimationFrame(bindCardSize);
        return;
      }

      const width = el.getBoundingClientRect().width;
      if (width > 0) setCardWidth(width);

      ro = new ResizeObserver(([entry]) => {
        if (entry.contentRect.width > 0) setCardWidth(entry.contentRect.width);
      });
      ro.observe(el);
    };

    frame = requestAnimationFrame(bindCardSize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, [activeView]);

  const s = cardWidth / 360;
  // sign proportions mirror SignPreview (BASE_W=288)
  const signW = cardWidth - 2 * Math.round(16 * s);
  const sf = signW / 288;

  return (
    <>
    <div className="min-h-dvh flex flex-col">
      <IosPageHeader title="หรีดร่วมบุญ" subtitle="Zero Waste" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

          <div className="grid gap-2 grid-cols-3">
            <MenuLink
              href={buildViewHref("ecard")}
              active={activeView === "ecard"}
              icon={<ImageIcon className="w-4 h-4" />}
              label="E-Card ขอบคุณ"
            />
            <MenuLink
              href={buildViewHref("certificate")}
              active={activeView === "certificate"}
              icon={<FileText className="w-4 h-4" />}
              label="หลักฐานร่วมบุญ"
            />
            <MenuLink
              href={buildViewHref("ai")}
              active={activeView === "ai"}
              icon={<Camera className="w-4 h-4" />}
              label="จำลองมอบหรีด"
            />
          </div>

          {activeView === "ai" && (
          <AiPhotoSectionV2
            donorName={name}
            donorPosition={title}
            condolenceText={message}
            deceasedName={deceasedName}
            funeralPlace={ceremonyLocation}
            donationId={donationId || undefined}
            memorialId={memorial.id}
          />
          )}

          {activeView !== "ai" && (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-3">
            <div className="flex items-center gap-1.5">
              {showAmount ? (
                <FileText className="w-4 h-4 text-gold-500" />
              ) : (
                <LotusIcon className="w-4 h-4 text-gold-500" />
              )}
              <span className="text-sm font-semibold text-gold-700">
                {showAmount ? "เอกสารมอบหรีด" : "เจ้าภาพขอขอบคุณ"}
              </span>
            </div>
            <p className="text-xs text-gold-500 -mt-1">
              {showAmount ? "อีการ์ดแสดงยอดเงิน" : "E-Card ขอบคุณ ไม่แสดงยอดเงิน"}
            </p>

            {/* E-card — 1080×1350 px saved (360×450 × pixelRatio 3) */}
            <div
              ref={cardRef}
              style={{
                width: "100%",
                height: Math.round(cardWidth * 5 / 4),
                background: "linear-gradient(165deg,#fefaf0 0%,#fdf4de 40%,#fefaf0 70%,#fdf0d0 100%)",
                border: `${Math.round(2*s)}px solid #c9a050`,
                position: "relative",
                overflow: "hidden",
                fontFamily: "'Sarabun', sans-serif",
                boxShadow: "0 8px 32px rgba(184,134,11,0.12)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Inner thin border frame */}
              <div style={{ position: "absolute", inset: Math.round(5*s), border: `0.5px solid rgba(201,160,80,0.30)`, pointerEvents: "none", zIndex: 5 }} />

              {/* Corner floral — top right */}
              <ECardCornerFloral s={s} topRight />
              {/* Corner floral — bottom left */}
              <ECardCornerFloral s={s} />

              {/* ── Brand badge (pill) ── */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: Math.round(12*s), paddingBottom: Math.round(2*s), flexShrink: 0, position: "relative", zIndex: 6 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(7*s), background: "linear-gradient(90deg,#c4a052,#d8b860,#e4ca70,#d8b860,#c4a052)", border: `${Math.round(1.5*s)}px solid rgba(180,140,40,0.5)`, borderRadius: 999, padding: `${Math.round(5*s)}px ${Math.round(16*s)}px`, boxShadow: `0 ${Math.round(2*s)}px ${Math.round(8*s)}px rgba(180,140,40,0.20)` }}>
                  <span style={{ display: "inline-flex", width: Math.round(15*s), height: Math.round(15*s), color: "rgba(255,255,255,0.92)" }}><LotusIcon className="w-full h-full" /></span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: Math.round(12*s), letterSpacing: "0.16em", fontFamily: "'Sarabun',sans-serif" }}>หรีดร่วมบุญ · Zero Waste</span>
                  <span style={{ display: "inline-flex", width: Math.round(15*s), height: Math.round(15*s), color: "rgba(255,255,255,0.92)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
                </div>
              </div>

              {/* ── Donor section ── */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `${Math.round(8*s)}px ${Math.round(18*s)}px ${Math.round(6*s)}px`, position: "relative", zIndex: 6 }}>
                {/* Section label */}
                <div style={{ display: "flex", alignItems: "center", gap: Math.round(5*s), marginBottom: Math.round(4*s) }}>
                  <div style={{ flex: 1, height: Math.round(0.5*s), minWidth: Math.round(20*s), background: "rgba(201,160,80,0.35)" }} />
                  <span style={{ fontSize: Math.round(9*s), color: "#92400e", letterSpacing: "0.08em", fontFamily: "'Sarabun',sans-serif", whiteSpace: "nowrap" }}>❖ เจ้าภาพขอขอบคุณ ❖</span>
                  <div style={{ flex: 1, height: Math.round(0.5*s), minWidth: Math.round(20*s), background: "rgba(201,160,80,0.35)" }} />
                </div>
                {/* Donor name — large */}
                <p style={{ fontWeight: 800, color: "#4a1f08", fontSize: Math.round(30*s), lineHeight: 1.15, margin: 0, textAlign: "center", letterSpacing: "-0.01em" }}>
                  {name || "ชื่อ หรือ องค์กร"}
                </p>
                {/* Title */}
                {title && (
                  <p style={{ fontSize: Math.round(12*s), color: "#78350f", fontWeight: 600, margin: `${Math.round(2*s)}px 0 0`, textAlign: "center", lineHeight: 1.3 }}>{title}</p>
                )}
                {/* Action label */}
                <p style={{ fontSize: Math.round(10*s), color: "#92400e", textAlign: "center", lineHeight: 1.55, margin: `${Math.round(3*s)}px 0 0` }}>
                  {showAmount
                    ? <>ขอแสดงความอาลัย · ร่วมมอบหรีดร่วมบุญ{" "}<span style={{ fontWeight: 700, color: "#5c2d0e" }}>{amount ? parseInt(amount).toLocaleString() : "500"} บาท</span></>
                    : <>ขอแสดงความอาลัย · ร่วมมอบหรีดร่วมบุญ</>
                  }
                </p>
              </div>

              {/* ── Gold divider ── */}
              <div style={{ display: "flex", alignItems: "center", padding: `0 ${Math.round(16*s)}px`, marginBottom: Math.round(3*s), position: "relative", zIndex: 6 }}>
                <div style={{ flex: 1, height: Math.round(0.75*s), background: "linear-gradient(to right,transparent,#c9a050 30%,#e0c070 50%,#c9a050 70%,transparent)" }} />
                <div style={{ width: Math.round(7*s), height: Math.round(7*s), background: "linear-gradient(135deg,#c9a050,#e8c070)", transform: "rotate(45deg)", margin: `0 ${Math.round(5*s)}px`, boxShadow: `0 0 ${Math.round(3*s)}px rgba(201,160,80,0.35)` }} />
                <div style={{ flex: 1, height: Math.round(0.75*s), background: "linear-gradient(to left,transparent,#c9a050 30%,#e0c070 50%,#c9a050 70%,transparent)" }} />
              </div>

              {/* ── Deceased section ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: `0 ${Math.round(16*s)}px`, position: "relative", zIndex: 6, overflow: "hidden" }}>
                <p style={{ fontSize: Math.round(9*s), color: "#a16207", letterSpacing: "0.10em", margin: `0 0 ${Math.round(5*s)}px`, fontFamily: "'Sarabun',sans-serif" }}>❖ แด่ผู้วายชนม์ ❖</p>

                {/* Photo with floral frame */}
                <div style={{ position: "relative", marginBottom: Math.round(6*s) }}>
                  {/* Floral wreath SVG */}
                  <svg width={Math.round(106*s)} height={Math.round(50*s)} viewBox="0 0 106 50"
                    style={{ position: "absolute", bottom: Math.round(-6*s), left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
                    <g transform="translate(18,28)">
                      {[0,60,120,180,240,300].map((a,i)=><ellipse key={i} cx="0" cy="-8" rx="5" ry="9" fill="#f5edd8" opacity={0.88-i*0.04} transform={`rotate(${a})`}/>)}
                      <circle cx="0" cy="0" r="3.5" fill="#eed888"/>
                    </g>
                    <g transform="translate(88,28)">
                      {[0,60,120,180,240,300].map((a,i)=><ellipse key={i} cx="0" cy="-8" rx="5" ry="9" fill="#f5edd8" opacity={0.88-i*0.04} transform={`rotate(${a})`}/>)}
                      <circle cx="0" cy="0" r="3.5" fill="#eed888"/>
                    </g>
                    <polygon points="53,18 55,23 60,23 56,26 58,31 53,28 48,31 50,26 46,23 51,23" fill="#c9a050" opacity="0.60"/>
                    <circle cx="32" cy="38" r="2.5" fill="#f8f2e0" stroke="#e0c060" strokeWidth="0.4" opacity="0.82"/>
                    <circle cx="74" cy="38" r="2.5" fill="#f8f2e0" stroke="#e0c060" strokeWidth="0.4" opacity="0.82"/>
                    <path d="M 30 32 Q 24 26 18 22" stroke="#b89040" strokeWidth="0.7" fill="none" opacity="0.38"/>
                    <path d="M 76 32 Q 82 26 88 22" stroke="#b89040" strokeWidth="0.7" fill="none" opacity="0.38"/>
                  </svg>
                  {/* Oval photo */}
                  <div style={{ width: Math.round(76*s), height: Math.round(90*s), borderRadius: "50% / 45%", overflow: "hidden", border: `${Math.round(2*s)}px solid #e8c97a`, boxShadow: `0 ${Math.round(3*s)}px ${Math.round(12*s)}px rgba(184,134,11,0.15), 0 0 0 ${Math.round(3*s)}px rgba(253,248,238,0.85), 0 0 0 ${Math.round(6*s)}px rgba(201,168,76,0.15)`, position: "relative", zIndex: 2 }}>
                    {memorialPhotoSrc ? (
                      <img src={memorialPhotoSrc} alt={deceasedName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin={memorialPhotoSrc.startsWith("data:") ? undefined : "anonymous"} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ display: "inline-flex", width: Math.round(32*s), height: Math.round(32*s), color: "#e0c070" }}><LotusIcon className="w-full h-full" /></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deceased info */}
                <p style={{ fontWeight: 700, color: "#4a1f08", fontSize: Math.round(17*s), lineHeight: 1.25, margin: 0, textAlign: "center" }}>{deceasedName}</p>
                {(birthDate || deathDate) && (
                  <p style={{ fontSize: Math.round(9*s), color: "#92400e", margin: `${Math.round(3*s)}px 0 0`, lineHeight: 1.6, textAlign: "center" }}>
                    {birthDate && <>ชาตะ {birthDate}{deathDate ? "  ·  " : ""}</>}{deathDate && <>มรณะ {deathDate}</>}
                  </p>
                )}
                {memorial.age > 0 && (
                  <p style={{ fontSize: Math.round(10*s), color: "#a16207", margin: `${Math.round(2*s)}px 0 0` }}>อายุ {memorial.age} ปี</p>
                )}
              </div>

              {/* ── Ceremony section ── */}
              <div style={{ textAlign: "center", padding: `${Math.round(6*s)}px ${Math.round(16*s)}px ${Math.round(6*s)}px`, borderTop: `${Math.round(0.75*s)}px solid rgba(201,160,80,0.30)`, position: "relative", zIndex: 6 }}>
                <p style={{ fontWeight: 700, color: "#78350f", fontSize: Math.round(13*s), margin: 0, letterSpacing: "0.02em" }}>
                  ❖ ฌาปนกิจ {ceremonyDate} ❖
                </p>
                {ceremonyLocation && (
                  <p style={{ fontSize: Math.round(9*s), color: "#a16207", margin: `${Math.round(3*s)}px 0 0`, lineHeight: 1.45 }}>{ceremonyLocation}</p>
                )}
              </div>

              {/* ── Bottom gold strip ── */}
              <div style={{ height: Math.round(28*s), flexShrink: 0, background: "linear-gradient(90deg,#c4a052,#d8b860,#e4ca70,#d8b860,#c4a052)", display: "flex", alignItems: "center", justifyContent: "center", gap: Math.round(10*s), position: "relative", zIndex: 6 }}>
                <span style={{ display: "inline-flex", width: Math.round(12*s), height: Math.round(12*s), color: "rgba(255,255,255,0.55)" }}><LotusIcon className="w-full h-full" /></span>
                <span style={{ color: "rgba(255,255,255,0.42)", fontSize: Math.round(8*s), letterSpacing: "0.38em" }}>❖ ❖ ❖</span>
                <span style={{ display: "inline-flex", width: Math.round(12*s), height: Math.round(12*s), color: "rgba(255,255,255,0.55)" }}><LotusIcon className="w-full h-full scale-x-[-1]" /></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSaveCard}
                disabled={saving || sharing}
                className="gold-gradient text-white font-semibold py-3 rounded-xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {saving ? "กำลังบันทึก..." : "บันทึกภาพ"}
              </button>
              <button
                onClick={handleShareLine}
                disabled={saving || sharing}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border-2 border-gold-300 bg-white text-gold-700 hover:bg-gold-50 active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ borderColor: shared ? "#00b900" : undefined, color: shared ? "#00b900" : undefined }}
              >
                {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {shared ? "แชร์แล้ว!" : "แชร์ LINE"}
              </button>
            </div>
          </div>
          )}

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

function MenuLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`min-h-[76px] rounded-2xl border-2 px-2 py-3 flex flex-col items-center justify-center gap-1.5 text-center text-[11px] font-semibold leading-snug transition-all ${
        active
          ? "gold-gradient text-white border-transparent shadow-md"
          : "bg-cream-50 border-gold-200 text-gold-700 hover:border-gold-300"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function ECardCornerFloral({ s, topRight = false }: { s: number; topRight?: boolean }) {
  const size = Math.round(108 * s);
  return (
    <div style={{
      position: "absolute",
      top: topRight ? 0 : undefined,
      bottom: topRight ? undefined : 0,
      right: topRight ? 0 : undefined,
      left: topRight ? undefined : 0,
      width: size, height: size,
      pointerEvents: "none", zIndex: 3,
    }}>
      <svg width={size} height={size} viewBox="0 0 108 108"
           style={{ display: "block", transform: topRight ? "none" : "rotate(180deg)" }}>
        {/* Gold stems */}
        <path d="M106 2 Q82 36 56 56" stroke="#c4a050" strokeWidth="1.2" fill="none" opacity="0.40"/>
        <path d="M100 2 Q78 32 54 50" stroke="#b89040" strokeWidth="0.8" fill="none" opacity="0.30"/>
        <path d="M106 12 Q88 42 68 60" stroke="#c4a050" strokeWidth="0.7" fill="none" opacity="0.25"/>
        {/* Eucalyptus leaves */}
        <ellipse cx="88" cy="44" rx="5" ry="10" fill="#cfc888" opacity="0.38" transform="rotate(28 88 44)"/>
        <ellipse cx="95" cy="35" rx="4" ry="8" fill="#c8c080" opacity="0.30" transform="rotate(18 95 35)"/>
        <ellipse cx="80" cy="52" rx="4" ry="8" fill="#d0ca88" opacity="0.28" transform="rotate(38 80 52)"/>
        {/* Large rose */}
        <g transform="translate(78,22)">
          {[0,51,102,154,206,257,309].map((a,i)=>(
            <ellipse key={i} cx="0" cy="-14" rx="9" ry="16"
              fill={i%2===0?"#f5edd8":"#efe5cc"} opacity={0.90-i*0.04}
              transform={`rotate(${a})`}/>
          ))}
          <circle cx="0" cy="0" r="6" fill="#e8d090"/>
        </g>
        {/* Medium rose */}
        <g transform="translate(40,55)">
          {[0,60,120,180,240,300].map((a,i)=>(
            <ellipse key={i} cx="0" cy="-10" rx="7" ry="11"
              fill="#faf3e2" opacity={0.88-i*0.04}
              transform={`rotate(${a})`}/>
          ))}
          <circle cx="0" cy="0" r="4.5" fill="#edd888"/>
        </g>
        {/* Small accent flowers */}
        <circle cx="57" cy="18" r="4" fill="#f8f2e2" stroke="#e0c060" strokeWidth="0.4" opacity="0.88"/>
        <circle cx="65" cy="10" r="3" fill="#f8f2e2" stroke="#e0c060" strokeWidth="0.4" opacity="0.82"/>
        <circle cx="50" cy="28" r="2.5" fill="#f8f2e2" stroke="#e0c060" strokeWidth="0.3" opacity="0.75"/>
        <circle cx="72" cy="22" r="2" fill="#f8f2e2" opacity="0.68"/>
        {/* Gypsophila tiny dots */}
        {[[62,30],[68,38],[56,36],[74,28],[60,40]].map(([cx,cy],i)=>(
          <circle key={i} cx={cx} cy={cy} r="1.8" fill="#faf8f0" stroke="#e8d880" strokeWidth="0.3" opacity={0.72-i*0.05}/>
        ))}
      </svg>
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

"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Copy, Check, CloudUpload, Download, User, Briefcase } from "lucide-react";
import PromptPayQR from "./PromptPayQR";
import Button from "@/components/ui/Button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
  basePath?: string;
  promptpayPhone?: string | null;
}

const BANK_LINKS = [
  { label: "K PLUS", scheme: "kplus://", bg: "#1ba345", text: "#fff" },
  { label: "SCB", scheme: "scbeasy://", bg: "#4b2d7f", text: "#fff" },
  { label: "KTB", scheme: "krungthainext://", bg: "#009fe3", text: "#fff" },
  { label: "BBL", scheme: "bmapp://", bg: "#1e3a8a", text: "#fff" },
  { label: "BAY", scheme: "mobilebanking.krungsri://", bg: "#f4a91e", text: "#fff" },
  { label: "TTB", scheme: "ttbtouch://", bg: "#009ade", text: "#fff" },
];

export default function PaymentPageClient({ memorial, basePath = "", promptpayPhone }: Props) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorTitle, setDonorTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedQR, setSavedQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-scroll to name input when slip is attached
  useEffect(() => {
    if (slipFile && nameRef.current) {
      setTimeout(() => nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    }
  }, [slipFile]);

  function handleSlipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setError("");
  }

  function copyPromptPay() {
    const text = promptpayPhone ?? memorial.bank_account_number ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveQR() {
    try {
      let blob: Blob | null = null;
      if (memorial.bank_account_image_url) {
        const res = await fetch(memorial.bank_account_image_url);
        blob = await res.blob();
      } else {
        const svg = qrRef.current?.querySelector("svg");
        if (!svg) return;
        const svgText = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = document.createElement("img");
        img.src = url;
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); });
        const canvas = document.createElement("canvas");
        canvas.width = 720; canvas.height = 720;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 720, 720);
        ctx.drawImage(img, 48, 48, 624, 624);
        URL.revokeObjectURL(url);
        blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
      }
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "QR-code.png";
      link.click();
    } catch {
      if (memorial.bank_account_image_url) window.open(memorial.bank_account_image_url, "_blank");
    }
    setSavedQR(true);
    setTimeout(() => setSavedQR(false), 2000);
  }

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = slipFile && parsedAmount > 0 && donorName.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    // 1. Upload slip
    let slipUrl = "";
    let slipHash = "";
    let duplicate = false;
    try {
      const form = new FormData();
      form.append("memorial_id", memorial.id);
      form.append("slip", slipFile!);
      const res = await fetch("/api/upload-slip", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 409 || data?.duplicate
          ? "สลิปนี้ถูกใช้แล้ว กรุณาใช้สลิปใหม่"
          : "อัปโหลดสลิปไม่สำเร็จ กรุณาลองอีกครั้ง");
        setSubmitting(false);
        return;
      }
      slipUrl = data?.slip_url ?? "";
      slipHash = data?.slip_hash ?? "";
      duplicate = Boolean(data?.duplicate);
    } catch {
      setError("อัปโหลดสลิปไม่สำเร็จ กรุณาลองอีกครั้ง");
      setSubmitting(false);
      return;
    }

    // 2. Create donation
    let donationId = "";
    try {
      const body: Record<string, unknown> = {
        memorial_id: memorial.id,
        donor_name: donorName.trim(),
        amount: parsedAmount,
        slip_url: slipUrl,
        slip_hash: slipHash,
        slip_duplicate_warning: duplicate,
      };
      if (donorTitle.trim()) body.donor_title = donorTitle.trim();
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
        setSubmitting(false);
        return;
      }
      donationId = data?.donation?.id ?? "";
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    const q = new URLSearchParams({
      name: donorName.trim(),
      title: donorTitle.trim(),
      amount: String(parsedAmount),
    });
    if (donationId) q.set("donation_id", donationId);
    setTimeout(() => router.push(`${basePath}/success?${q.toString()}`), 900);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

            {/* ─── 1: QR + บัญชี ─── */}
            <Card>
              <OrnamentTitle>ร่วมมอบ หรีดร่วมบุญ</OrnamentTitle>

              <div className="mt-3 flex items-stretch">
                {/* QR */}
                <div className="shrink-0 pr-4 flex items-center justify-center">
                  <div ref={qrRef} className="relative w-28 h-28 rounded-xl gold-border bg-white flex items-center justify-center overflow-hidden p-1.5">
                    {promptpayPhone ? (
                      <PromptPayQR phone={promptpayPhone} />
                    ) : memorial.bank_account_image_url ? (
                      <Image src={memorial.bank_account_image_url} alt="QR" fill className="object-contain p-1" />
                    ) : (
                      <QRPlaceholder />
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="shrink-0 relative w-4 self-stretch">
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gold-300 to-transparent" />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 text-[10px] leading-none bg-cream-50 px-0.5">❖</span>
                </div>

                {/* Bank info */}
                <div className="flex-1 pl-4 flex flex-col justify-center space-y-2">
                  <div>
                    <p className="text-[10px] text-gold-500 font-medium">ชื่อบัญชี</p>
                    <p className="text-base font-bold text-gold-800 leading-tight">ศูนย์หรีดร่วมบุญ</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gold-500 font-medium">ธนาคาร</p>
                    <p className="text-sm font-semibold text-gold-700">{(memorial.bank_name ?? "").split("\n")[1] ?? memorial.bank_name ?? ""}</p>
                  </div>
                  {promptpayPhone && (
                    <div>
                      <p className="text-[10px] text-gold-500 font-medium">เลขพร้อมเพย์</p>
                      <p className="text-base font-bold text-gold-800 tracking-widest">{promptpayPhone}</p>
                    </div>
                  )}
                  {!promptpayPhone && (
                    <div>
                      <p className="text-[10px] text-gold-500 font-medium">เลขบัญชี</p>
                      <p className="text-base font-bold text-gold-800 tracking-widest">{memorial.bank_account_number}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(promptpayPhone || memorial.bank_account_image_url) && (
                  <button type="button" onClick={saveQR} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-gold-200 bg-white text-gold-700 hover:bg-cream-50">
                    {savedQR ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
                    {savedQR ? "บันทึกแล้ว" : "บันทึก QR"}
                  </button>
                )}
                <button type="button" onClick={copyPromptPay} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-gold-200 bg-white text-gold-700 hover:bg-cream-50">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกเลขพร้อมเพย์"}
                </button>
              </div>

              {/* Bank deep links */}
              <div className="mt-3">
                <p className="text-[10px] text-gold-400 mb-2 text-center">เปิดแอปธนาคารเพื่อโอนเงิน</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {BANK_LINKS.map(b => (
                    <a
                      key={b.label}
                      href={b.scheme}
                      className="flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-bold transition-opacity active:opacity-70"
                      style={{ background: b.bg, color: b.text }}
                    >
                      {b.label}
                    </a>
                  ))}
                </div>
              </div>
            </Card>

            {/* ─── 2: อัปโหลดสลิป + ยอดเงิน ─── */}
            <Card>
              <OrnamentTitle>โอนแล้ว — แนบสลิป</OrnamentTitle>

              <div className="mt-3">
                {slipPreview ? (
                  <label className="block cursor-pointer">
                    <div className="w-full rounded-xl overflow-hidden border border-gold-200 bg-cream-50 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slipPreview} alt="สลิป" style={{ maxWidth: "100%", maxHeight: "50dvh", width: "auto", height: "auto", display: "block" }} />
                    </div>
                    <p className="text-center text-[11px] text-gold-400 mt-1.5">แตะเพื่อเปลี่ยนรูป</p>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleSlipFile} className="hidden" />
                  </label>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors">
                    <div className="flex flex-col items-center gap-1 text-gold-400">
                      <CloudUpload className="w-7 h-7" />
                      <span className="text-xs">แนบสลิปการโอน (JPG, PNG)</span>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleSlipFile} className="hidden" />
                  </label>
                )}
              </div>

              {slipPreview && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gold-700 mb-1.5">ยอดเงินที่โอน</p>
                  <div className="relative">
                    <input
                      type="number" inputMode="numeric" min="1"
                      value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="กรอกจำนวนเงิน"
                      className="w-full px-4 py-3 pr-10 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-lg font-bold text-center tracking-wide"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 text-sm font-semibold pointer-events-none">฿</span>
                  </div>
                </div>
              )}
            </Card>

            {/* ─── 3: ชื่อผู้ร่วมบุญ (แสดงเมื่อแนบสลิปแล้ว) ─── */}
            {slipFile && (
              <Card>
                <OrnamentTitle>ชื่อบนป้ายหรีด</OrnamentTitle>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gold-700">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-semibold">ชื่อ / หน่วยงาน <span className="text-red-400">*</span></span>
                    </div>
                    <input
                      ref={nameRef}
                      type="text" value={donorName} onChange={e => setDonorName(e.target.value)}
                      placeholder="เช่น ครอบครัวสมชาย / บจก.เอบีซี"
                      className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gold-700">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm font-semibold">ตำแหน่ง / ข้อความแสดงอาลัย</span>
                    </div>
                    <input
                      type="text" value={donorTitle} onChange={e => setDonorTitle(e.target.value)}
                      placeholder="เช่น ผู้อำนวยการ / ขอแสดงความเสียใจอย่างสุดซึ้ง"
                      className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
                    />
                  </div>

                  {/* Nameplate preview */}
                  {donorName.trim() && (
                    <div className="pt-1">
                      <p className="text-[10px] text-gold-400 text-center mb-2">ตัวอย่างป้ายหรีด</p>
                      <SignPreview name={donorName} title={donorTitle} />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 text-center">{error}</div>
            )}

            <Button
              type="submit"
              fullWidth variant="primary" size="lg"
              loading={submitting}
              disabled={!canSubmit}
            >
              {submitting ? "กำลังส่งข้อมูล..." : "ส่งข้อมูลและสร้างป้ายชื่อ"}
            </Button>

            <div className="h-20" />
          </div>
        </form>
      </main>

      <LoadingOverlay show={submitting && !success} message="กำลังบันทึกและส่งพิมพ์..." />

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-gold-900/25 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-cream-50 gold-border card-shadow px-7 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-gold-800">ส่งพิมพ์สำเร็จแล้ว!</p>
            <p className="text-xs text-gold-500 mt-1">กำลังไปหน้า E-Card...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">{children}</div>;
}

function OrnamentTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-gold-300 text-sm select-none">❖</span>
      <span className="font-bold text-gold-800 tracking-wide text-sm">{children}</span>
      <span className="text-gold-300 text-sm select-none">❖</span>
    </div>
  );
}

function QRPlaceholder() {
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20 text-gold-700" fill="currentColor">
      <rect x="4" y="4" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="10" width="16" height="16" rx="1" />
      <rect x="48" y="4" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="54" y="10" width="16" height="16" rx="1" />
      <rect x="4" y="48" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="10" y="54" width="16" height="16" rx="1" />
      <rect x="48" y="48" width="8" height="8" rx="1" /><rect x="60" y="48" width="8" height="8" rx="1" />
      <rect x="48" y="60" width="8" height="8" rx="1" /><rect x="60" y="60" width="16" height="16" rx="1" />
      <rect x="38" y="4" width="6" height="6" /><rect x="38" y="14" width="6" height="6" /><rect x="38" y="24" width="6" height="6" />
      <rect x="4" y="38" width="6" height="6" /><rect x="14" y="38" width="6" height="6" /><rect x="24" y="38" width="6" height="6" />
      <rect x="38" y="38" width="6" height="6" /><rect x="48" y="38" width="6" height="6" /><rect x="58" y="38" width="6" height="6" /><rect x="68" y="38" width="8" height="6" />
    </svg>
  );
}

const BASE_W = 288;
const BASE_H = 80;

function SignPreview({ name, title }: { name: string; title: string }) {
  const displayName = name.trim() || "ชื่อ หรือ องค์กร";
  const displayTitle = title.trim() || "ตำแหน่ง หรือ ข้อความแสดงอาลัย";
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
    <div ref={cardRef} className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: `${BASE_W} / ${BASE_H}`, background: "linear-gradient(135deg,#fdf8ee 0%,#f9f0d8 100%)", border: "1.5px solid #c9a84c", boxShadow: "0 4px 20px rgba(184,134,11,0.18), inset 0 0 0 3px #fdf8ee, inset 0 0 0 4px #c9a84c44" }}>
      <div className="absolute left-3 right-3 flex justify-center" style={{ top: "40%", transform: "translateY(-50%)" }}>
        <p ref={nameRef} className={`font-bold whitespace-nowrap leading-tight text-center ${isNamePlaceholder ? "text-gold-300" : "text-gold-800"}`}>{displayName}</p>
      </div>
      <div className="absolute flex justify-center" style={{ bottom: titleBottom + "px", left: titleMargin + "px", right: titleMargin + "px" }}>
        <p ref={titleRef} className={`whitespace-nowrap leading-tight text-center ${isTitlePlaceholder ? "text-gold-300" : "text-gold-600"}`}>{displayTitle}</p>
      </div>
    </div>
  );
}

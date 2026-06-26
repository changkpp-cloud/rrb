"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Copy, Check, CloudUpload, Download, ExternalLink } from "lucide-react";
import PromptPayQR from "./PromptPayQR";
import Button from "@/components/ui/Button";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { savePaidData } from "@/components/SlugBottomNav";
import { compressImage } from "@/lib/compress-image";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
  basePath?: string;
  promptpayPhone?: string | null;
}

// scheme = custom URL scheme ของแอป (เปิดแอปธนาคารในเบราว์เซอร์จริง)
// ยืนยันแน่นอน: kplus, scbeasy, bualuangmbanking · ยังไม่ยืนยันทางการ: ktbnext, kma, ttbtouch (รอเทสต์เครื่องจริง)
const BANK_LINKS = [
  { label: "K PLUS", scheme: "kplus", bg: "#1ba345", text: "#fff" },
  { label: "SCB", scheme: "scbeasy", bg: "#4b2d7f", text: "#fff" },
  { label: "KTB", scheme: "ktbnext", bg: "#009fe3", text: "#fff" },
  { label: "BBL", scheme: "bualuangmbanking", bg: "#1e3a8a", text: "#fff" },
  { label: "BAY", scheme: "kma", bg: "#f4a91e", text: "#fff" },
  { label: "TTB", scheme: "ttbtouch", bg: "#009ade", text: "#fff" },
];

export default function PaymentPageClient({ memorial, basePath = "", promptpayPhone }: Props) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedQR, setSavedQR] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  // ตรวจจับ in-app browser ของ LINE/Facebook — ที่นี่ปุ่ม deep link แอปธนาคารใช้ไม่ได้ (Android 11+ package visibility)
  const [inAppBrowser, setInAppBrowser] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    setInAppBrowser(/Line\/|FBAN|FBAV|FB_IAB|Instagram/i.test(ua));
  }, []);

  // เปิดแอปธนาคารด้วย custom scheme — แอปที่ติดตั้งจะเปิดทันที
  // ถ้าแอปไม่เปิดใน ~1.5 วิ (scheme ไม่ตรง/ไม่ได้ติดตั้ง) แสดงคำแนะนำให้คัดลอกเลขพร้อมเพย์แทน
  const [bankHint, setBankHint] = useState(false);
  // banner แจ้งให้อัปโหลดสลิปเมื่อกลับจากแอปธนาคาร
  const [returnBanner, setReturnBanner] = useState(false);
  const slipSectionRef = useRef<HTMLDivElement>(null);
  // ref กันไม่ให้ banner ขึ้นซ้ำถ้าผู้ใช้กลับมาโดยไม่ได้กดปุ่มแอปธนาคาร
  const wentToBankApp = useRef(false);

  function openBankApp(b: (typeof BANK_LINKS)[number]) {
    setBankHint(false);
    setReturnBanner(false);
    wentToBankApp.current = false;

    const onHidden = () => {
      if (document.hidden) wentToBankApp.current = true;
    };
    const onReturn = () => {
      if (!document.hidden && wentToBankApp.current && !slipFile) {
        setReturnBanner(true);
      }
    };
    document.addEventListener("visibilitychange", onHidden, { once: true });
    document.addEventListener("visibilitychange", onReturn);
    // ล้าง listener onReturn เมื่อ component unmount
    const cleanup = () => document.removeEventListener("visibilitychange", onReturn);
    window.addEventListener("pagehide", cleanup, { once: true });

    window.location.href = `${b.scheme}://`;
    window.setTimeout(() => {
      if (!wentToBankApp.current && !document.hidden) setBankHint(true);
    }, 1500);
  }

  function dismissReturnBanner() {
    setReturnBanner(false);
    wentToBankApp.current = false;
  }

  function handleReturnBannerTap() {
    dismissReturnBanner();
    slipSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => fileRef.current?.click(), 400);
  }

  // เด้งออกไปเปิดหน้านี้ในเบราว์เซอร์จริง (Chrome) ที่ deep link แอปธนาคารทำงานได้
  function openInExternalBrowser() {
    const ua = navigator.userAgent || "";
    const url = window.location.href;
    if (/Line\//i.test(ua)) {
      // LINE รองรับ param พิเศษ openExternalBrowser=1
      const sep = url.includes("?") ? "&" : "?";
      window.location.href = `${url}${sep}openExternalBrowser=1`;
      return;
    }
    if (/android/i.test(ua)) {
      // Facebook/IG บน Android — บังคับเปิดด้วย Chrome ผ่าน intent
      const noScheme = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }
    // iOS อื่นๆ — เปิดแท็บใหม่ (ผู้ใช้อาจต้องกดเมนู "เปิดในเบราว์เซอร์" เอง)
    window.open(url, "_blank");
  }

  async function handleSlipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // ย่อสลิปให้โหลดเร็ว แต่คงความละเอียดพออ่านตัวเลขออก
    let img = f;
    try { img = await compressImage(f, { maxDim: 1600 }); } catch { /* ใช้ไฟล์เดิม */ }
    setSlipFile(img);
    setSlipPreview(URL.createObjectURL(img));
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
  const canSubmit = slipFile && parsedAmount > 0;
  const base = basePath || (slug ? `/${slug}` : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    // Upload slip — donation จะถูกสร้างทีหลังในหน้ากรอกชื่อ (สร้างครั้งเดียวตอนมีชื่อจริง)
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

    // ปลดล็อก tab ป้ายชื่อ/ขอบคุณ ใน bottom nav
    if (slug) savePaidData(slug, { memorial_id: memorial.id, slip_url: slipUrl, amount: String(parsedAmount) });

    // ไปหน้ากรอกชื่อบนป้าย (หน้า 3)
    const q = new URLSearchParams({
      memorial_id: memorial.id,
      slip_url: slipUrl,
      amount: String(parsedAmount),
    });
    if (slipHash) q.set("slip_hash", slipHash);
    if (duplicate) q.set("duplicate", "true");
    router.push(`${base}/print-name?${q.toString()}`);
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
                {inAppBrowser && (
                  <button
                    type="button"
                    onClick={openInExternalBrowser}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 active:opacity-80"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    เปิดในเบราว์เซอร์เพื่อกดเข้าแอปธนาคาร
                  </button>
                )}
                <p className="text-[10px] text-gold-400 mb-2 text-center">เปิดแอปธนาคารเพื่อโอนเงิน</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {BANK_LINKS.map(b => (
                    <a
                      key={b.label}
                      href={`${b.scheme}://`}
                      onClick={(e) => { e.preventDefault(); openBankApp(b); }}
                      className="flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-bold transition-opacity active:opacity-70"
                      style={{ background: b.bg, color: b.text }}
                    >
                      {b.label}
                    </a>
                  ))}
                </div>
                {bankHint && (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 text-center">
                    ถ้าแอปธนาคารไม่เปิด — กด <span className="font-bold">“คัดลอกเลขพร้อมเพย์”</span> ด้านบน แล้วเปิดแอปธนาคารเอง เพื่อสแกน QR หรือวางเลขโอนเงิน
                  </div>
                )}
              </div>
            </Card>

            {/* ─── banner กลับจากแอปธนาคาร ─── */}
            {returnBanner && (
              <button
                type="button"
                onClick={handleReturnBannerTap}
                className="flex w-full items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-left shadow-sm active:opacity-80"
              >
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">โอนเสร็จแล้วใช่ไหม?</p>
                  <p className="text-xs text-emerald-600">แตะที่นี่เพื่ออัปโหลดสลิปได้เลย</p>
                </div>
                <span className="text-emerald-400 text-lg">›</span>
              </button>
            )}

            {/* ─── 2: อัปโหลดสลิป + ยอดเงิน ─── */}
            <div ref={slipSectionRef}>
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
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 text-center">{error}</div>
            )}

            <Button
              type="submit"
              fullWidth variant="primary" size="lg"
              loading={submitting}
              disabled={!canSubmit}
            >
              {submitting ? "กำลังอัปโหลดสลิป..." : "ส่งตรวจสอบสลิป"}
            </Button>

            <div className="h-20" />
          </div>
        </form>
      </main>

      <LoadingOverlay show={submitting} message="กำลังอัปโหลดสลิป..." />
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

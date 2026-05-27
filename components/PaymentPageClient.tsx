"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Copy, Check, CloudUpload, Download } from "lucide-react";
import LotusIcon from "./LotusIcon";
import type { Memorial } from "@/lib/supabase/types";

const SYSTEM_FEE = 100;

interface Props {
  memorial: Memorial;
  basePath?: string;
}

export default function PaymentPageClient({ memorial, basePath = "" }: Props) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedQR, setSavedQR] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSlipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSlipFile(f);
    setSlipPreview(URL.createObjectURL(f));
    setVerifying(false);
  }

  function copyAccount() {
    navigator.clipboard.writeText(memorial.bank_account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveQR() {
    if (!memorial.bank_account_image_url) return;
    try {
      const res = await fetch(memorial.bank_account_image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "QR-code.png";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(memorial.bank_account_image_url, "_blank");
    }
    setSavedQR(true);
    setTimeout(() => setSavedQR(false), 2000);
  }

  const parsedAmount = parseFloat(amount) || 0;

  async function handleVerify() {
    if (!slipFile || parsedAmount <= 0) return;
    setVerifying(true);

    // Upload slip first, defer donation creation until user enters name
    let slipUrl = "";
    try {
      const form = new FormData();
      form.append("memorial_id", memorial.id);
      form.append("slip", slipFile);
      const res = await fetch("/api/upload-slip", { method: "POST", body: form });
      const data = await res.json();
      slipUrl = data?.slip_url ?? "";
    } catch { /* slip upload failed — continue without URL */ }

    const q = new URLSearchParams({
      memorial_id: memorial.id,
      amount: String(parsedAmount),
      slip_url: slipUrl,
    });
    router.push(`${basePath}/verifying?${q.toString()}`);
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "#ffffff" }}
    >
      {/* Header */}
      <header className="shrink-0 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
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

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

          {/* ─── กล่อง 1: ร่วมมอบหรีดร่วมบุญ ─── */}
          <Card>
            <OrnamentTitle small>ร่วมมอบ หรีดร่วมบุญ</OrnamentTitle>

            {/* QR | divider | bank info */}
            <div className="mt-3 flex items-stretch">
              {/* QR side */}
              <div className="shrink-0 pr-4 flex items-center justify-center">
                <div className="relative w-28 h-28 rounded-xl gold-border bg-white flex items-center justify-center overflow-hidden">
                  {memorial.bank_account_image_url ? (
                    <Image src={memorial.bank_account_image_url} alt="QR" fill className="object-contain p-1" />
                  ) : (
                    <QRPlaceholder />
                  )}
                </div>
              </div>

              {/* Vertical divider — ❖ pinned at exact center */}
              <div className="shrink-0 relative w-4 self-stretch">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gold-300 to-transparent" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 text-[10px] leading-none bg-cream-50 px-0.5">❖</span>
              </div>

              {/* Bank info side */}
              <div className="flex-1 pl-4 flex flex-col justify-center space-y-1.5">
                <p className="text-[11px] font-semibold text-gold-800 leading-snug">
                  มูลนิธิ หรีดร่วมบุญ
                </p>
                <p className="text-[11px] text-gold-600">{memorial.bank_name.split("\n")[1] ?? memorial.bank_name}</p>
                <p className="text-sm font-bold text-gold-800 tracking-widest pt-0.5">
                  {memorial.bank_account_number}
                </p>
              </div>
            </div>

            {/* Buttons row */}
            <div className="mt-3 flex gap-2">
              {memorial.bank_account_image_url && (
                <button
                  onClick={saveQR}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-border bg-cream-50 hover:bg-cream-100 active:scale-95 transition-all text-sm text-gold-700 font-semibold shadow-sm"
                >
                  {savedQR ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Download className="w-3.5 h-3.5" />}
                  {savedQR ? "บันทึกแล้ว" : "บันทึก QR โค้ด"}
                </button>
              )}
              <button
                onClick={copyAccount}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl gold-border bg-cream-50 hover:bg-cream-100 active:scale-95 transition-all text-sm text-gold-700 font-semibold shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "คัดลอกแล้ว" : "คัดลอกเลขบัญชี"}
              </button>
            </div>
          </Card>

          {/* ─── กล่อง 2: โอนแล้วแนบสลิป ─── */}
          <Card>
            <OrnamentTitle small>โอนแล้วแนบสลิป</OrnamentTitle>

            {/* Slip upload */}
            <div className="mt-3">
              {slipPreview ? (
                <label className="block cursor-pointer">
                  <div className="w-full rounded-xl overflow-hidden border border-gold-200 bg-cream-50 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slipPreview}
                      alt="สลิปการโอน"
                      style={{ maxWidth: "100%", maxHeight: "58dvh", width: "auto", height: "auto", display: "block" }}
                    />
                  </div>
                  <p className="text-center text-[11px] text-gold-400 mt-1.5">แตะเพื่อเปลี่ยนรูป</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleSlipFile} className="hidden" />
                </label>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors">
                  <div className="flex flex-col items-center gap-1 text-gold-400">
                    <CloudUpload className="w-7 h-7" />
                    <span className="text-xs">แนบสลิปการโอน / รองรับไฟล์ JPG, PNG</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleSlipFile} className="hidden" />
                </label>
              )}
            </div>

            {/* Amount input — shows after slip is attached */}
            {slipPreview && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gold-700 mb-1.5">ยอดเงินที่โอน</p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="กรอกจำนวนเงิน"
                    className="w-full px-4 py-3 pr-10 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-lg font-bold text-center tracking-wide"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500 text-sm font-semibold pointer-events-none">฿</span>
                </div>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={!slipFile || parsedAmount <= 0 || verifying}
              className="mt-3 w-full gold-gradient text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity"
            >
              {verifying ? "กำลังส่ง..." : "ตรวจสอบสลิป"}
            </button>

          </Card>


          {/* ─── Back button ─── */}
          <Link
            href={basePath || "/"}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
      {children}
    </div>
  );
}

function OrnamentTitle({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-gold-300 text-sm select-none">❖</span>
      <span className={`font-bold text-gold-800 tracking-wide ${small ? "text-sm" : "text-base"}`}>
        {children}
      </span>
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
      <rect x="48" y="48" width="8" height="8" rx="1" />
      <rect x="60" y="48" width="8" height="8" rx="1" />
      <rect x="48" y="60" width="8" height="8" rx="1" />
      <rect x="60" y="60" width="16" height="16" rx="1" />
      <rect x="38" y="4" width="6" height="6" />
      <rect x="38" y="14" width="6" height="6" />
      <rect x="38" y="24" width="6" height="6" />
      <rect x="4" y="38" width="6" height="6" />
      <rect x="14" y="38" width="6" height="6" />
      <rect x="24" y="38" width="6" height="6" />
      <rect x="38" y="38" width="6" height="6" />
      <rect x="48" y="38" width="6" height="6" />
      <rect x="58" y="38" width="6" height="6" />
      <rect x="68" y="38" width="8" height="6" />
    </svg>
  );
}

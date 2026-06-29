"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send, ShieldCheck, Smartphone } from "lucide-react";

interface Props {
  memorialId: string;
  initialPhone: string | null;
  initialVerified: boolean;
}

// ยืนยันเบอร์/บัญชีเจ้าภาพด้วย OTP — เจ้าหน้าที่ศูนย์ทำตอนเปิดงาน/หน้าเคาน์เตอร์
// เบอร์ที่ยืนยันแล้วจะถูกใช้สร้าง PromptPay QR หน้าโอน (เงินเข้าบัญชีเจ้าภาพโดยตรง)
export default function HostPhoneVerify({ memorialId, initialPhone, initialVerified }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ส่งรหัสไม่สำเร็จ");
      setDevCode(data.devCode ?? null);
      setStep("code");
      setVerified(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "ยืนยันไม่สำเร็จ");
      setVerified(true);
      setStep("phone");
      setCode("");
      setDevCode(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-gold-500" />
        <p className="text-xs font-semibold text-gold-700">ยืนยันบัญชีเจ้าภาพ (OTP)</p>
        {verified && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <ShieldCheck className="w-3 h-3" />
            ยืนยันแล้ว
          </span>
        )}
      </div>

      <p className="text-[10px] text-gold-500 leading-relaxed">
        เบอร์ที่ยืนยันแล้วจะใช้สร้าง QR พร้อมเพย์หน้าโอน — เงินผู้ร่วมบุญเข้าบัญชีเจ้าภาพโดยตรง
      </p>

      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); }}
          placeholder="08x-xxx-xxxx"
          className="flex-1 px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm tracking-wider"
        />
        <button
          onClick={sendOtp}
          disabled={loading || !phone}
          className="shrink-0 flex items-center gap-1.5 px-3 rounded-xl gold-gradient text-white text-xs font-semibold disabled:opacity-50"
        >
          {loading && step === "phone" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {verified ? "ส่งรหัสใหม่" : "ส่งรหัส"}
        </button>
      </div>

      {step === "code" && (
        <div className="space-y-2 bg-white rounded-xl border border-gold-200 px-4 py-3">
          {devCode && (
            <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
              ⚠️ โหมดทดสอบ (ยังไม่ส่ง SMS จริง) — รหัส OTP คือ <span className="font-bold tracking-widest">{devCode}</span>
            </p>
          )}
          <p className="text-xs font-semibold text-gold-700">กรอกรหัส 6 หลักที่ส่งไปยัง {phone}</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="______"
              className="flex-1 px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-lg font-bold text-center tracking-[0.5em]"
            />
            <button
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
              className="shrink-0 flex items-center gap-1.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading && step === "code" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  );
}

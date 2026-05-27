"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, AlertTriangle, Banknote } from "lucide-react";

interface Props {
  memorialId: string;
  totalAmount: number;
  hostBankName: string | null;
  hostBankAccount: string | null;
  hostBankAccountName: string | null;
  systemFee: number;
  isClosed: boolean;
}

export default function CloseMemorialButton({
  memorialId,
  totalAmount,
  hostBankName,
  hostBankAccount,
  hostBankAccountName,
  systemFee,
  isClosed,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const netAmount = Math.max(totalAmount - systemFee, 0);

  async function handleClose() {
    setStep("loading");
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}/close`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setStep("done");
      setTimeout(() => router.refresh(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setStep("confirm");
    }
  }

  if (isClosed) {
    return (
      <div className="flex items-center gap-2 bg-gold-50 border border-gold-200 rounded-2xl px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0" />
        <p className="text-sm font-semibold text-gold-700">ปิดงานแล้ว</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        <p className="text-sm font-semibold text-emerald-700">ปิดงานสำเร็จแล้ว</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Banknote className="w-4 h-4 text-gold-500" />
        <p className="text-xs font-semibold text-gold-700">โอนเงินให้เจ้าภาพ / ปิดงาน</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gold-200 px-4 py-3 space-y-1.5">
        <Row label="ยอดร่วมบุญทั้งหมด" value={`${totalAmount.toLocaleString()} บาท`} />
        <Row label="ค่าดำเนินการระบบ" value={`- ${systemFee.toLocaleString()} บาท`} muted />
        <div className="border-t border-gold-100 pt-1.5 mt-1">
          <Row label="ยอดสุทธิที่โอนให้เจ้าภาพ" value={`${netAmount.toLocaleString()} บาท`} highlight />
        </div>
      </div>

      {/* Host bank account */}
      {(hostBankAccount || hostBankName) ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-[10px] text-emerald-700 font-semibold mb-1">บัญชีเจ้าภาพที่ต้องโอนเงินให้</p>
          {hostBankName && <Row label="ธนาคาร" value={hostBankName} small />}
          {hostBankAccount && <Row label="เลขบัญชี" value={hostBankAccount} small mono />}
          {hostBankAccountName && <Row label="ชื่อบัญชี" value={hostBankAccountName} small />}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-700">ยังไม่มีข้อมูลบัญชีเจ้าภาพ — ตรวจสอบก่อนโอนเงิน</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Confirm step */}
      {step === "confirm" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-700">ยืนยันปิดงาน?</p>
          </div>
          <p className="text-[11px] text-red-600 leading-relaxed">
            หลังปิดแล้วจะ<strong>ไม่สามารถรับสลิปใหม่ได้</strong><br />
            และสถานะงานจะเปลี่ยนเป็น "ปิดแล้ว" ถาวร
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setStep("idle")}
              className="flex-1 py-2.5 rounded-xl border border-gold-300 text-gold-600 text-sm font-semibold hover:bg-cream-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              ยืนยันปิดงาน
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="flex items-center justify-center gap-2 py-3 text-gold-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          กำลังปิดงาน...
        </div>
      )}

      {step === "idle" && (
        <button
          onClick={() => setStep("confirm")}
          className="w-full py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          โอนเงินให้เจ้าภาพแล้ว / ปิดงาน
        </button>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  muted,
  small,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  small?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`${small ? "text-[10px]" : "text-xs"} text-gold-500`}>{label}</span>
      <span
        className={`${small ? "text-[10px]" : "text-xs"} font-bold ${
          highlight ? "text-emerald-600 text-sm" : muted ? "text-gold-400" : "text-gold-800"
        } ${mono ? "font-mono tracking-wider" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

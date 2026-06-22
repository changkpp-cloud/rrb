"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, SendHorizonal } from "lucide-react";

interface Props {
  memorialId: string;
  transferConfirmedAt: string | null;
  transferConfirmedBy: string | null;
  hostBankAccount: string | null;
  isClosed: boolean;
}

function formatThaiDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransferConfirmButton({
  memorialId,
  transferConfirmedAt,
  transferConfirmedBy,
  hostBankAccount,
  isClosed,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(Boolean(transferConfirmedAt));
  const [confirmedAt, setConfirmedAt] = useState(transferConfirmedAt);
  const [confirmedBy, setConfirmedBy] = useState(transferConfirmedBy);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  if (confirmed && confirmedAt) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800">ยืนยันการโอนเงินแล้ว</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {formatThaiDateTime(confirmedAt)}
            {confirmedBy && ` · โดย ${confirmedBy}`}
          </p>
        </div>
      </div>
    );
  }

  if (!isClosed) {
    return (
      <p className="text-[11px] text-gold-400 text-center">ปิดงานก่อนแล้วจึงยืนยันการโอนเงินได้</p>
    );
  }

  if (!hostBankAccount) {
    return (
      <p className="text-[11px] text-amber-600 text-center">เจ้าภาพยังไม่ได้กรอกบัญชีรับเงิน</p>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memorials/${memorialId}/confirm-transfer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setConfirmed(true);
      setConfirmedAt(new Date().toISOString());
      setConfirmedBy(data.confirmedBy ?? null);
      setShowConfirm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  if (showConfirm) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
        <p className="text-sm font-bold text-amber-800">ยืนยันการโอนเงิน?</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          กดยืนยันเมื่อโอนเงินสุทธิให้เจ้าภาพเรียบร้อยแล้ว<br />
          การยืนยันนี้ไม่สามารถยกเลิกได้
        </p>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 rounded-xl border border-gold-300 bg-white px-3 py-2.5 text-sm font-semibold text-gold-600 hover:bg-gold-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? "กำลังยืนยัน..." : "ยืนยันแล้ว"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold-800 px-4 py-3 text-sm font-semibold text-white hover:bg-gold-700 active:scale-[0.98] transition-all"
    >
      <SendHorizonal className="w-4 h-4" />
      ยืนยันว่าโอนเงินให้เจ้าภาพแล้ว
    </button>
  );
}

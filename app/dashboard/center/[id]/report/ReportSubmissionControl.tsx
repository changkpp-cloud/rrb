"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";

interface Props {
  centerId: string;
  periodType: "month" | "year";
  periodKey: string;
  periodLabel: string;
  submittedAt: string | null;
  submittedBy: string | null;
  canMark: boolean;
}

// แสดง/บันทึกสถานะ "ส่งรายงานงวดนี้ให้เทศบาลแล้ว"
// ศูนย์ (canMark) กดทำเครื่องหมาย/ยกเลิกได้ · ตัวแทนเทศบาลเห็นสถานะอย่างเดียว
export default function ReportSubmissionControl({
  centerId, periodType, periodKey, periodLabel, submittedAt, submittedBy, canMark,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function setSubmitted(submitted: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/centers/${centerId}/report-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_type: periodType, period_key: periodKey, submitted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  if (submittedAt) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-800">ส่งรายงาน{periodLabel}ให้เทศบาลแล้ว</p>
          <p className="text-[10px] text-emerald-600">
            {new Date(submittedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
            {submittedBy ? ` · โดย ${submittedBy}` : ""}
          </p>
        </div>
        {canMark && (
          <button
            onClick={() => setSubmitted(false)}
            disabled={loading}
            className="shrink-0 text-[11px] text-gold-500 underline disabled:opacity-50"
          >
            {loading ? "..." : "ยกเลิก"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Clock3 className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-xs font-semibold text-amber-800">ยังไม่ได้ทำเครื่องหมายว่าส่งรายงาน{periodLabel}ให้เทศบาล</p>
      </div>
      {canMark && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl gold-gradient px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          ทำเครื่องหมายว่าส่งให้เทศบาลแล้ว
        </button>
      )}
      {error && <p className="text-[11px] text-red-600 text-center">{error}</p>}
    </div>
  );
}

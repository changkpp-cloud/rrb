"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import type { Donation } from "@/lib/supabase/types";

interface Props {
  donations: Donation[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

export default function PendingDonationReview({ donations }: Props) {
  if (donations.length === 0) {
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
        <p className="text-sm text-gold-400">ไม่มีรายการรอตรวจสอบ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {donations.map((d, i) => (
        <PendingRow key={d.id} donation={d} index={i + 1} />
      ))}
    </div>
  );
}

function PendingRow({ donation: d, index }: { donation: Donation; index: number }) {
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const [done, setDone] = useState<"confirmed" | "rejected" | null>(null);
  const router = useRouter();

  async function handleAction(status: "confirmed" | "rejected") {
    setLoading(status === "confirmed" ? "confirm" : "reject");
    try {
      const res = await fetch(`/api/donations/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setDone(status);
        setTimeout(() => router.refresh(), 600);
      }
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return (
      <div className={`rounded-2xl px-4 py-3 border ${done === "confirmed" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <p className={`text-xs font-semibold ${done === "confirmed" ? "text-emerald-700" : "text-red-700"}`}>
          {done === "confirmed" ? "✓ ยืนยันแล้ว — ส่งพิมพ์" : "✕ ปฏิเสธแล้ว"}
        </p>
        <p className="text-[11px] text-gold-500 mt-0.5">{d.donor_name}</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-amber-700">{index}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
          {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
          <p className="text-[9px] text-gold-400 mt-0.5">{formatDate(d.created_at)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gold-700">{d.amount.toLocaleString()} บาท</p>
          {d.slip_duplicate_warning && (
            <span className="mt-0.5 inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              สลิปซ้ำ
            </span>
          )}
        </div>
      </div>

      {/* Slip image */}
      {d.slip_url && (
        <div className="ml-10">
          <a
            href={`/api/donations/${d.id}/slip`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-blue-500 underline"
          >
            ดูสลิป
          </a>
        </div>
      )}

      {/* Action buttons */}
      <div className="ml-10 flex gap-2">
        <button
          onClick={() => handleAction("confirmed")}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {loading === "confirm" ? "กำลังยืนยัน..." : "ยืนยัน + ส่งพิมพ์"}
        </button>
        <button
          onClick={() => handleAction("rejected")}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-60"
        >
          <XCircle className="w-3.5 h-3.5" />
          {loading === "reject" ? "..." : "ปฏิเสธ"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, Eye, FileText } from "lucide-react";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
}

export default function HostVerificationReview({ memorial }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone]       = useState<"approved" | "rejected" | null>(null);
  const router                = useRouter();

  const isVerified    = Boolean(memorial.host_verified);
  const hasDeathCert  = Boolean(memorial.death_certificate_url);
  const hasIdCard     = Boolean(memorial.host_id_card_url);
  const hasAnyDoc     = hasDeathCert || hasIdCard;

  async function handleVerify(verified: boolean) {
    setLoading(verified ? "approve" : "reject");
    try {
      const form = new FormData();
      form.append("host_verified", verified ? "true" : "false");
      const res = await fetch(`/api/memorials/${memorial.id}`, { method: "PATCH", body: form });
      if (res.ok) {
        setDone(verified ? "approved" : "rejected");
        setTimeout(() => router.refresh(), 700);
      }
    } finally {
      setLoading(null);
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">ยืนยันสิทธิ์เจ้าภาพแล้ว</p>
          <p className="text-xs text-emerald-600">เจ้าภาพสามารถกรอกบัญชีรับเงินได้แล้ว</p>
        </div>
        <button
          onClick={() => handleVerify(false)}
          disabled={loading !== null}
          className="ml-auto text-[11px] text-red-500 underline disabled:opacity-60"
        >
          เพิกถอน
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className={`rounded-2xl border px-4 py-3 ${done === "approved" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
        <p className={`text-sm font-bold ${done === "approved" ? "text-emerald-800" : "text-red-700"}`}>
          {done === "approved" ? "✓ ยืนยันสิทธิ์แล้ว" : "✕ เพิกถอนสิทธิ์แล้ว"}
        </p>
      </div>
    );
  }

  if (!hasAnyDoc) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gold-200 bg-cream-50 px-4 py-3">
        <FileText className="w-5 h-5 text-gold-400 shrink-0" />
        <p className="text-sm text-gold-500">เจ้าภาพยังไม่ได้อัปโหลดเอกสาร</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* เอกสารที่ส่งมา */}
      <div className="rounded-2xl gold-border bg-cream-50 px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-gold-600 mb-1">เอกสารจากเจ้าภาพ</p>
        {hasDeathCert && (
          <DocRow
            label="ใบมรณะบัตร"
            url={memorial.death_certificate_url!}
          />
        )}
        {hasIdCard && (
          <DocRow
            label="บัตรประชาชนเจ้าภาพ"
            url={memorial.host_id_card_url!}
          />
        )}
      </div>

      {/* ปุ่มยืนยัน / ปฏิเสธ */}
      <div className="flex gap-3">
        <button
          onClick={() => handleVerify(true)}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <ShieldCheck className="w-4 h-4" />
          {loading === "approve" ? "กำลังยืนยัน..." : "ยืนยันสิทธิ์เจ้าภาพ"}
        </button>
        <button
          onClick={() => handleVerify(false)}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <ShieldX className="w-4 h-4" />
          {loading === "reject" ? "..." : "ปฏิเสธ"}
        </button>
      </div>
    </div>
  );
}

function DocRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gold-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-gold-700 font-medium">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-500 underline">
        <Eye className="w-3 h-3" />ดูไฟล์
      </a>
    </div>
  );
}

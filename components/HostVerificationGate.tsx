"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Clock, Upload, Eye, ShieldCheck } from "lucide-react";
import type { Memorial } from "@/lib/supabase/types";
import HostBankForm from "./HostBankForm";

interface Props {
  memorial: Memorial;
}

export default function HostVerificationGate({ memorial }: Props) {
  const isVerified = Boolean(memorial.host_verified);
  const hasDocs = Boolean(memorial.death_certificate_url);

  return (
    <div className="space-y-4">
      {/* ── Step indicator ── */}
      <div className="flex items-center gap-0">
        <StepDot done={hasDocs} active={!hasDocs} label="อัปโหลดเอกสาร" num={1} />
        <div className={`flex-1 h-px mx-1 ${hasDocs ? "bg-gold-400" : "bg-gold-200"}`} />
        <StepDot done={isVerified} active={hasDocs && !isVerified} label="รอตรวจสอบ" num={2} />
        <div className={`flex-1 h-px mx-1 ${isVerified ? "bg-gold-400" : "bg-gold-200"}`} />
        <StepDot done={false} active={isVerified} label="กรอกบัญชี" num={3} />
      </div>

      {/* ── Phase 1: ยังไม่ได้อัปโหลด ── */}
      {!hasDocs && (
        <DocUploadPanel memorialId={memorial.id} />
      )}

      {/* ── Phase 2: อัปโหลดแล้ว รอตรวจ ── */}
      {hasDocs && !isVerified && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">รอเจ้าหน้าที่ศูนย์ตรวจสอบ</p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                ส่งเอกสารเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ศูนย์ตรวจสอบและยืนยันสิทธิ์<br/>
                เมื่อยืนยันแล้วจะสามารถกรอกบัญชีรับเงินได้
              </p>
            </div>
          </div>
          {/* แสดง docs ที่ upload แล้ว */}
          <div className="rounded-2xl border border-gold-200 bg-cream-50 px-4 py-3">
            <p className="text-xs font-semibold text-gold-600 mb-2">เอกสารที่ส่งแล้ว</p>
            <DocPreviewRow label="ใบมรณะบัตร" url={memorial.death_certificate_url} />
            <DocPreviewRow label="บัตรประชาชนเจ้าภาพ" url={memorial.host_id_card_url} />
          </div>
          {/* อัปโหลดเพิ่มเติม */}
          <DocUploadPanel memorialId={memorial.id} compact />
        </div>
      )}

      {/* ── Phase 3: ยืนยันแล้ว → แสดงฟอร์มบัญชี ── */}
      {isVerified && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">ยืนยันสิทธิ์เจ้าภาพแล้ว</p>
              <p className="text-xs text-emerald-600">สามารถกรอกบัญชีธนาคารเพื่อรับโอนยอดสุทธิได้เลย</p>
            </div>
          </div>
          <HostBankForm memorial={memorial} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Doc upload panel (phase 1 + compact re-upload in phase 2)
// ──────────────────────────────────────────────────────────────────────────────

function DocUploadPanel({ memorialId, compact = false }: { memorialId: string; compact?: boolean }) {
  const [deathFile, setDeathFile]   = useState<File | null>(null);
  const [idFile, setIdFile]         = useState<File | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");
  const deathRef                    = useRef<HTMLInputElement>(null);
  const idRef                       = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!deathFile && !idFile) { setError("กรุณาแนบเอกสารอย่างน้อย 1 รายการ"); return; }
    setSaving(true); setError("");
    const form = new FormData();
    if (deathFile) form.append("death_cert", deathFile);
    if (idFile)    form.append("id_card",    idFile);
    try {
      const res = await fetch(`/api/memorials/${memorialId}`, { method: "PATCH", body: form });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "บันทึกไม่สำเร็จ"); return; }
      setSaved(true);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  if (compact) {
    return (
      <div className="rounded-2xl border border-gold-200 bg-white px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-gold-600">อัปโหลดเอกสารเพิ่มเติม (ถ้าต้องการ)</p>
        <DocFileRow label="ใบมรณะบัตร" fileRef={deathRef} file={deathFile} onChange={setDeathFile} />
        <DocFileRow label="บัตรประชาชนเจ้าภาพ" fileRef={idRef} file={idFile} onChange={setIdFile} />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit} disabled={saving || saved}
          className="w-full py-2 rounded-xl bg-gold-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saved ? <><CheckCircle2 className="w-4 h-4" />อัปโหลดแล้ว</> : saving ? "กำลังอัปโหลด..." : "อัปโหลดเพิ่มเติม"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl gold-border card-shadow bg-cream-50 px-4 py-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <Upload className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gold-800">ยืนยันสิทธิ์เจ้าภาพ</p>
          <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">
            อัปโหลด "ใบมรณะบัตร" และ "บัตรประชาชนเจ้าภาพ" เพื่อให้ศูนย์ตรวจสอบ<br/>
            เมื่อยืนยันแล้วจะปลดล็อกให้กรอกบัญชีรับเงิน
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <DocFileRow label="ใบมรณะบัตร *" fileRef={deathRef} file={deathFile} onChange={setDeathFile} required />
        <DocFileRow label="บัตรประชาชนเจ้าภาพ" fileRef={idRef} file={idFile} onChange={setIdFile} />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <button
        onClick={handleSubmit} disabled={saving || saved}
        className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saved ? (
          <><CheckCircle2 className="w-4 h-4" />ส่งเอกสารแล้ว รอตรวจสอบ</>
        ) : saving ? "กำลังอัปโหลด..." : "ส่งเอกสารเพื่อยืนยันสิทธิ์"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function DocFileRow({
  label, fileRef, file, onChange, required,
}: {
  label: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  onChange: (f: File) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${file ? "border-emerald-300 bg-emerald-50" : "border-gold-200 bg-white"}`}>
        {file
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          : <Upload className="w-4 h-4 text-gold-400 shrink-0" />}
        <span className={`text-xs flex-1 truncate ${file ? "text-emerald-700 font-semibold" : "text-gold-500"}`}>
          {file ? file.name : `${label}${required ? "" : " (ไม่บังคับ)"}`}
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }}
      />
    </label>
  );
}

function DocPreviewRow({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gold-100 last:border-0">
      <span className="text-xs text-gold-600">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-500 underline">
        <Eye className="w-3 h-3" />ดูไฟล์
      </a>
    </div>
  );
}

function StepDot({ done, active, label, num }: { done: boolean; active: boolean; label: string; num: number }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
        done    ? "bg-gold-500 text-white" :
        active  ? "bg-amber-400 text-white" :
                  "bg-gold-100 text-gold-400"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : num}
      </div>
      <span className={`text-[9px] whitespace-nowrap ${active || done ? "text-gold-700" : "text-gold-300"}`}>{label}</span>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Clock, Upload, Eye, ShieldCheck } from "lucide-react";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
}

export default function HostVerificationGate({ memorial }: Props) {
  const isVerified = Boolean(memorial.host_verified);
  const hasDocs    = Boolean(memorial.death_certificate_url);

  // ── ยืนยันแล้ว ──────────────────────────────────────────────────────────
  if (isVerified) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">ยืนยันสิทธิ์เจ้าภาพแล้ว</p>
            <p className="text-xs text-emerald-600">ศูนย์ตรวจสอบเอกสารและบัญชีรับเงินเรียบร้อยแล้ว</p>
          </div>
        </div>
        {/* แสดงบัญชีที่บันทึกไว้ */}
        {memorial.host_bank_account_number && (
          <div className="rounded-2xl border border-gold-200 bg-cream-50 px-4 py-3 space-y-1">
            <p className="text-[11px] font-semibold text-gold-500">บัญชีรับเงิน</p>
            <p className="text-sm font-bold text-gold-800">{memorial.host_bank_name}</p>
            <p className="text-sm text-gold-700 font-mono tracking-widest">{memorial.host_bank_account_number}</p>
            <p className="text-xs text-gold-600">{memorial.host_bank_account_name}</p>
          </div>
        )}
      </div>
    );
  }

  // ── ส่งเอกสารแล้ว รอตรวจ ───────────────────────────────────────────────
  if (hasDocs) {
    return <PendingPanel memorial={memorial} />;
  }

  // ── ยังไม่ได้ส่ง → ฟอร์มรวม ────────────────────────────────────────────
  return <SubmitPanel memorialId={memorial.id} />;
}

// ── ฟอร์มรวม: เอกสาร + บัญชี ─────────────────────────────────────────────
function SubmitPanel({ memorialId }: { memorialId: string }) {
  const [deathFile,    setDeathFile]    = useState<File | null>(null);
  const [bankBookFile, setBankBookFile] = useState<File | null>(null);
  const [bankName,     setBankName]     = useState("");
  const [accNumber,    setAccNumber]    = useState("");
  const [accName,      setAccName]      = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const deathRef   = useRef<HTMLInputElement>(null);
  const bankRef    = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!deathFile)    { setError("กรุณาแนบใบมรณะบัตร"); return; }
    if (!bankBookFile) { setError("กรุณาแนบสมุดธนาคาร (หน้าแรก)"); return; }
    if (!bankName.trim())   { setError("กรุณากรอกชื่อธนาคาร"); return; }
    if (!accNumber.trim())  { setError("กรุณากรอกเลขบัญชี"); return; }
    if (!accName.trim())    { setError("กรุณากรอกชื่อบัญชี"); return; }

    setSaving(true);
    setError("");
    const form = new FormData();
    form.append("death_cert",               deathFile);
    form.append("passbook",                 bankBookFile);
    form.append("host_bank_name",           bankName.trim());
    form.append("host_bank_account_number", accNumber.trim());
    form.append("host_bank_account_name",   accName.trim());

    try {
      const res = await fetch(`/api/memorials/${memorialId}`, { method: "PATCH", body: form });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "บันทึกไม่สำเร็จ"); return; }
      window.location.reload();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl gold-border card-shadow bg-cream-50 px-4 py-4 space-y-4">
      <div>
        <p className="text-sm font-bold text-gold-800">ยืนยันสิทธิ์เจ้าภาพ</p>
        <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">
          แนบเอกสารและกรอกบัญชีรับเงิน เพื่อให้ศูนย์ตรวจสอบและอนุมัติ
        </p>
      </div>

      {/* เอกสาร */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gold-700">เอกสารที่ต้องแนบ</p>
        <FilePickRow
          label="ใบมรณะบัตร"
          required
          file={deathFile}
          fileRef={deathRef}
          onChange={setDeathFile}
        />
        <FilePickRow
          label="สมุดธนาคาร (หน้าแรก)"
          required
          file={bankBookFile}
          fileRef={bankRef}
          onChange={setBankBookFile}
        />
      </div>

      {/* บัญชี */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gold-700">บัญชีธนาคารรับเงิน</p>
        <input
          type="text"
          value={bankName}
          onChange={e => setBankName(e.target.value)}
          placeholder="ธนาคาร เช่น ธนาคารกรุงไทย"
          className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
        />
        <input
          type="text"
          value={accNumber}
          onChange={e => setAccNumber(e.target.value)}
          placeholder="เลขบัญชี เช่น 123-4-56789-0"
          className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono tracking-widest"
        />
        <input
          type="text"
          value={accName}
          onChange={e => setAccName(e.target.value)}
          placeholder="ชื่อบัญชี (ชื่อ-นามสกุลเจ้าของบัญชี)"
          className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? "กำลังส่งเอกสาร..." : "ส่งเอกสารเพื่อยืนยันสิทธิ์"}
      </button>
    </div>
  );
}

// ── รอตรวจสอบ ──────────────────────────────────────────────────────────────
function PendingPanel({ memorial }: { memorial: Memorial }) {
  const [showReupload, setShowReupload] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
        <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800">รอเจ้าหน้าที่ศูนย์ตรวจสอบ</p>
          <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
            ส่งเอกสารและข้อมูลบัญชีแล้ว กรุณารอการตรวจสอบจากศูนย์
          </p>
        </div>
      </div>

      {/* สรุปข้อมูลที่ส่ง */}
      <div className="rounded-2xl border border-gold-200 bg-cream-50 px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-gold-600 mb-1">ข้อมูลที่ส่งแล้ว</p>
        <DocPreviewRow label="ใบมรณะบัตร" url={memorial.death_certificate_url} />
        <DocPreviewRow label="สมุดธนาคาร (หน้าแรก)" url={memorial.host_id_card_url} />
        {memorial.host_bank_account_number && (
          <div className="pt-1 border-t border-gold-100 mt-1">
            <p className="text-[10px] text-gold-500">บัญชีรับเงิน</p>
            <p className="text-xs font-semibold text-gold-700 mt-0.5">{memorial.host_bank_name} · {memorial.host_bank_account_number}</p>
            <p className="text-xs text-gold-600">{memorial.host_bank_account_name}</p>
          </div>
        )}
      </div>

      {/* อัปโหลดซ้ำถ้าต้องการแก้ไข */}
      {!showReupload ? (
        <button
          onClick={() => setShowReupload(true)}
          className="w-full py-2.5 rounded-xl border border-gold-200 bg-white text-xs text-gold-600 font-semibold hover:bg-cream-50 transition-colors"
        >
          แก้ไขข้อมูล / อัปโหลดเอกสารใหม่
        </button>
      ) : (
        <SubmitPanel memorialId={memorial.id} />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function FilePickRow({
  label, required, file, fileRef, onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onChange: (f: File) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
        file ? "border-emerald-300 bg-emerald-50" : "border-gold-200 bg-white"
      }`}>
        {file
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          : <Upload className="w-4 h-4 text-gold-400 shrink-0" />}
        <span className={`text-xs flex-1 truncate ${file ? "text-emerald-700 font-semibold" : "text-gold-500"}`}>
          {file ? file.name : `${label}${required ? " *" : ""}`}
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

function DocPreviewRow({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) return (
    <div className="flex items-center justify-between py-1.5 border-b border-gold-100 last:border-0">
      <span className="text-xs text-gold-400">{label}</span>
      <span className="text-[10px] text-gold-300">ยังไม่ได้แนบ</span>
    </div>
  );
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gold-100 last:border-0">
      <span className="text-xs text-gold-600 font-medium">{label}</span>
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-500 underline">
        <Eye className="w-3 h-3" />ดูไฟล์
      </a>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import type { Memorial } from "@/lib/supabase/types";

// ย่อเฉพาะไฟล์รูป (≤1600px พออ่านตัวหนังสือออก) — ไฟล์ PDF จะ throw แล้วคืนไฟล์เดิม
async function shrinkDoc(f: File | null): Promise<File | null> {
  if (!f) return null;
  try { return await compressImage(f, { maxDim: 1600 }); } catch { return f; }
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gold-200 bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

function DocPicker({
  label, file, currentUrl, onFile,
}: { label: string; file: File | null; currentUrl: string | null; onFile: (f: File | null) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gold-600">{label}</label>
        {currentUrl && !file && (
          <a href={currentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-500 underline">
            <Eye className="w-3 h-3" />ดูไฟล์เดิม
          </a>
        )}
      </div>
      <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 px-3 py-2.5 cursor-pointer hover:bg-cream-100 transition-colors">
        <Upload className="w-4 h-4 text-gold-400 shrink-0" />
        <span className="text-xs text-gold-500 truncate">
          {file ? file.name : currentUrl ? "แตะเพื่อเปลี่ยนไฟล์" : "แตะเพื่ออัปโหลด (รูป/ไฟล์)"}
        </span>
        <input type="file" accept="image/*,application/pdf" className="hidden"
          onChange={e => onFile(e.target.files?.[0] ?? null)} />
      </label>
    </div>
  );
}

/** ฟอร์มให้ "ศูนย์" เพิ่ม/แก้เอกสาร (ใบมรณะบัตร, บัตร ปชช.) และบัญชีรับเงินเจ้าภาพ */
export default function CenterMemorialDocsForm({ memorial }: { memorial: Memorial }) {
  const router = useRouter();
  const [bankName, setBankName] = useState(memorial.host_bank_name ?? "");
  const [accNo, setAccNo]       = useState(memorial.host_bank_account_number ?? "");
  const [accName, setAccName]   = useState(memorial.host_bank_account_name ?? "");
  const [deathCert, setDeathCert] = useState<File | null>(null);
  const [idCard, setIdCard]       = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const form = new FormData();
      // ส่งค่าบัญชีปัจจุบันกลับไปด้วย เพื่อไม่ให้ถูกล้างตอนอัปโหลดเอกสารอย่างเดียว
      form.append("host_bank_name", bankName.trim());
      form.append("host_bank_account_number", accNo.trim());
      form.append("host_bank_account_name", accName.trim());
      if (deathCert) form.append("death_cert", deathCert);
      if (idCard)    form.append("id_card", idCard);

      const res = await fetch(`/api/memorials/${memorial.id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setSaved(true);
      setDeathCert(null);
      setIdCard(null);
      setTimeout(() => router.refresh(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl gold-border bg-cream-50 card-shadow px-4 py-4 space-y-3">
      <p className="text-xs font-semibold text-gold-600">เพิ่ม / แก้ไขเอกสารและบัญชีเจ้าภาพ (โดยศูนย์)</p>

      <DocPicker label="ใบมรณะบัตร" file={deathCert} currentUrl={memorial.death_certificate_url ?? null} onFile={async f => setDeathCert(await shrinkDoc(f))} />
      <DocPicker label="บัตรประชาชน / สมุดบัญชีเจ้าภาพ" file={idCard} currentUrl={memorial.host_id_card_url ?? null} onFile={async f => setIdCard(await shrinkDoc(f))} />

      <div className="border-t border-gold-100 pt-3 space-y-3">
        <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide">บัญชีรับเงินโอนเจ้าภาพ</p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">ธนาคาร</label>
          <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="เช่น ธนาคารกรุงไทย" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">เลขที่บัญชี</label>
          <input type="text" inputMode="numeric" value={accNo} onChange={e => setAccNo(e.target.value)} placeholder="เลขบัญชี" className={`${inputClass} font-mono tracking-widest`} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">ชื่อบัญชี</label>
          <input type="text" value={accName} onChange={e => setAccName(e.target.value)} placeholder="ชื่อเจ้าของบัญชี" className={inputClass} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-semibold">บันทึกสำเร็จ</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gold-gradient text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-50 shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "กำลังบันทึก..." : "บันทึกเอกสาร / บัญชี"}
      </button>
    </div>
  );
}

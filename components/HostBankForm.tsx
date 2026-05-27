"use client";

import { useState, useRef } from "react";
import { Check, Upload, Eye } from "lucide-react";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
}

interface DocField {
  key: "passbook" | "death_cert" | "id_card";
  label: string;
  hint: string;
  currentUrl?: string | null;
}

export default function HostBankForm({ memorial }: Props) {
  const [phone,     setPhone]     = useState(memorial.host_phone ?? "");
  const [bankName,  setBankName]  = useState(memorial.host_bank_name ?? "");
  const [accNumber, setAccNumber] = useState(memorial.host_bank_account_number ?? "");
  const [accName,   setAccName]   = useState(memorial.host_bank_account_name ?? "");

  const [previews,  setPreviews]  = useState<Record<string, string>>({});
  const [files,     setFiles]     = useState<Record<string, File>>({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const fileRefs = {
    passbook:   useRef<HTMLInputElement>(null),
    death_cert: useRef<HTMLInputElement>(null),
    id_card:    useRef<HTMLInputElement>(null),
  };

  const docs: DocField[] = [
    { key: "passbook",   label: "สมุดบัญชีธนาคาร (หน้าแรก)", hint: "หน้าที่แสดงชื่อและเลขบัญชี", currentUrl: (memorial as Record<string, unknown>).host_bank_passbook_url as string | null },
    { key: "death_cert", label: "ใบมรณะบัตร",                 hint: "เอกสารรับรองการเสียชีวิต",   currentUrl: memorial.death_certificate_url },
    { key: "id_card",    label: "บัตรประชาชนเจ้าภาพ",          hint: "ชื่อตรงกับใบมรณะและบัญชี",  currentUrl: memorial.host_id_card_url },
  ];

  function handleFile(key: DocField["key"], file: File) {
    setFiles(prev => ({ ...prev, [key]: file }));
    setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const form = new FormData();
    form.append("host_phone",               phone);
    form.append("host_bank_name",           bankName);
    form.append("host_bank_account_number", accNumber);
    form.append("host_bank_account_name",   accName);
    if (files.passbook)   form.append("passbook",   files.passbook);
    if (files.death_cert) form.append("death_cert", files.death_cert);
    if (files.id_card)    form.append("id_card",    files.id_card);

    try {
      const res  = await fetch(`/api/memorials/${memorial.id}`, { method: "PATCH", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "บันทึกไม่สำเร็จ"); setSaving(false); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">

      {/* Phone */}
      <Field label="เบอร์โทรเจ้าภาพ">
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="08x-xxx-xxxx"
          className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
        />
      </Field>

      {/* Bank name */}
      <Field label="ธนาคาร">
        <input
          type="text"
          value={bankName}
          onChange={e => setBankName(e.target.value)}
          placeholder="เช่น ธนาคารกรุงไทย"
          className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
        />
      </Field>

      {/* Account number */}
      <Field label="เลขบัญชี">
        <input
          type="text"
          value={accNumber}
          onChange={e => setAccNumber(e.target.value)}
          placeholder="xxx-x-xxxxx-x"
          className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm tracking-widest"
        />
      </Field>

      {/* Account name */}
      <Field label="ชื่อบัญชี (ต้องตรงกับบัตรประชาชน)">
        <input
          type="text"
          value={accName}
          onChange={e => setAccName(e.target.value)}
          placeholder="ชื่อ-นามสกุล เจ้าของบัญชี"
          className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
        />
      </Field>

      {/* Document uploads */}
      <div className="pt-1">
        <p className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-3">เอกสารประกอบ</p>
        <div className="space-y-3">
          {docs.map(doc => {
            const previewUrl = previews[doc.key] ?? doc.currentUrl ?? null;
            return (
              <div key={doc.key} className="bg-white rounded-xl gold-border p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-gold-800">{doc.label}</p>
                    <p className="text-[10px] text-gold-400">{doc.hint}</p>
                  </div>
                  {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-gold-500 hover:text-gold-700">
                      <Eye className="w-3 h-3" />
                      ดูไฟล์
                    </a>
                  )}
                </div>

                {previewUrl ? (
                  <label className="block cursor-pointer">
                    <img
                      src={previewUrl}
                      alt={doc.label}
                      className="w-full max-h-32 object-contain rounded-lg border border-gold-100 bg-cream-50"
                    />
                    <p className="text-center text-[10px] text-gold-400 mt-1">แตะเพื่อเปลี่ยนรูป</p>
                    <input
                      ref={fileRefs[doc.key]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(doc.key, f); }}
                    />
                  </label>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full h-16 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors">
                    <Upload className="w-4 h-4 text-gold-400" />
                    <span className="text-xs text-gold-400">แนบรูปภาพ / JPG, PNG</span>
                    <input
                      ref={fileRefs[doc.key]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(doc.key, f); }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
      >
        {saved ? (
          <><Check className="w-4 h-4" />บันทึกแล้ว</>
        ) : saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gold-700">{label}</p>
      {children}
    </div>
  );
}

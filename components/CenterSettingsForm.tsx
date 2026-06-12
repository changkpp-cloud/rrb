"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, QrCode, Save, Upload } from "lucide-react";
import Image from "next/image";

type EditableCenter = {
  id: string;
  name: string;
  center_code?: string | null;
  official_lgo_code?: string | null;
  access_code?: string | null;
  province?: string | null;
  amphoe?: string | null;
  tambon?: string | null;
  municipality?: string | null;
  manager_name?: string | null;
  phone?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_account_image_url?: string | null;
};

const inputClass =
  "w-full rounded-xl gold-border bg-white px-3 py-2.5 text-sm text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400";

export default function CenterSettingsForm({ center }: { center: EditableCenter }) {
  const [form, setForm] = useState({
    name: center.name ?? "",
    center_code: center.center_code ?? "",
    official_lgo_code: center.official_lgo_code ?? "",
    access_code: center.access_code ?? "",
    province: center.province ?? "",
    amphoe: center.amphoe ?? "",
    tambon: center.tambon ?? "",
    municipality: center.municipality ?? "",
    manager_name: center.manager_name ?? "",
    phone: center.phone ?? "",
    bank_name: center.bank_name ?? "",
    bank_account_number: center.bank_account_number ?? "",
    bank_account_name: center.bank_account_name ?? "",
    bank_account_image_url: center.bank_account_image_url ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const qrInputRef = useRef<HTMLInputElement>(null);

  function set(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };
  }

  async function uploadQr(file: File) {
    setUploadingQr(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/centers/${center.id}/upload-qr`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดล้มเหลว");
      setForm(prev => ({ ...prev, bank_account_image_url: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดล้มเหลว");
    }
    setUploadingQr(false);
  }

  async function save() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/centers/${center.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกข้อมูลศูนย์ไม่สำเร็จ");
      setMessage("บันทึกข้อมูลศูนย์เรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อมูลศูนย์ไม่สำเร็จ");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* ── ข้อมูลศูนย์ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-gold-700">ข้อมูลศูนย์</p>
        <div className="grid grid-cols-1 gap-3">
          <Field label="ชื่อศูนย์">
            <input className={inputClass} value={form.name} onChange={set("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="รหัสศูนย์">
              <input className={`${inputClass} font-mono`} value={form.center_code} onChange={set("center_code")} />
            </Field>
            <Field label="รหัสเข้าใช้งาน">
              <input className={`${inputClass} font-mono`} value={form.access_code} onChange={set("access_code")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="จังหวัด">
              <input className={inputClass} value={form.province} onChange={set("province")} />
            </Field>
            <Field label="อำเภอ">
              <input className={inputClass} value={form.amphoe} onChange={set("amphoe")} />
            </Field>
          </div>
          <Field label="ตำบล">
            <input className={inputClass} value={form.tambon} onChange={set("tambon")} />
          </Field>
          <Field label="เทศบาล / อบต.">
            <input className={inputClass} value={form.municipality} onChange={set("municipality")} />
          </Field>
          <Field label="ผู้จัดการศูนย์">
            <input className={inputClass} value={form.manager_name} onChange={set("manager_name")} />
          </Field>
          <Field label="โทรศัพท์ / PromptPay">
            <input inputMode="tel" className={inputClass} value={form.phone} onChange={set("phone")} />
          </Field>
        </div>
      </div>

      {/* ── บัญชีรับเงินประจำศูนย์ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-bold text-gold-700">บัญชีรับเงินประจำศูนย์</p>
        </div>
        <p className="text-[10px] text-gold-400 -mt-1">ข้อมูลนี้จะดึงอัตโนมัติเมื่อเปิดงานใหม่ ไม่ต้องกรอกซ้ำทุกงาน</p>

        <Field label="ธนาคาร">
          <input
            className={inputClass}
            value={form.bank_name}
            onChange={set("bank_name")}
            placeholder="เช่น ธนาคารกรุงไทย"
          />
        </Field>
        <Field label="เลขบัญชี">
          <input
            inputMode="numeric"
            className={`${inputClass} font-mono tracking-wider`}
            value={form.bank_account_number}
            onChange={set("bank_account_number")}
            placeholder="เช่น 6200358257"
          />
        </Field>
        <Field label="ชื่อบัญชี">
          <input
            className={inputClass}
            value={form.bank_account_name}
            onChange={set("bank_account_name")}
            placeholder="เช่น ศูนย์บริหารหรีดร่วมบุญ อบต.นิคมทุ่งโพธิ์ทะเล"
          />
        </Field>

        {/* QR Code upload */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gold-700">QR Code รับเงิน</p>
          <div className="flex items-start gap-3">
            {form.bank_account_image_url ? (
              <div className="relative w-20 h-20 rounded-xl border border-gold-200 overflow-hidden shrink-0 bg-white">
                <Image
                  src={form.bank_account_image_url}
                  alt="QR Code"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8 text-gold-300" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadQr(f); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                disabled={uploadingQr}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl gold-border bg-white text-xs font-semibold text-gold-700 hover:bg-cream-50 transition-colors disabled:opacity-50"
              >
                {uploadingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingQr ? "กำลังอัปโหลด..." : "อัปโหลด QR"}
              </button>
              {form.bank_account_image_url && (
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, bank_account_image_url: "" }))}
                  className="block text-[10px] text-red-400 hover:text-red-600"
                >
                  ลบ QR
                </button>
              )}
              <p className="text-[10px] text-gold-400 leading-relaxed">
                QR พร้อมเพย์หรือ QR ธนาคาร<br />แสดงในหน้าชำระเงินทุกงานของศูนย์
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={loading || !form.name.trim()}
        className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลศูนย์"}
      </button>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gold-700">{label}</span>
      {children}
    </label>
  );
}

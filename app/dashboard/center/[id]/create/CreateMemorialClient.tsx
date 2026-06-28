"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Copy, Check, ExternalLink } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import LotusIcon from "@/components/LotusIcon";
import ThaiDateInput from "@/components/ThaiDateInput";
import ThaiAddressSelect, { type ThaiAddressValue } from "@/components/ThaiAddressSelect";
import { romanizeThaiFirstName } from "@/lib/thai-romanize";
import { getSiteUrl } from "@/lib/site-url";
import { compressImage } from "@/lib/compress-image";

interface CenterBank {
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_account_image_url?: string | null;
}

interface Props {
  centerId: string;
  embedded?: boolean;
  centerBank?: CenterBank;
  /** รหัสประจำศูนย์ (อปท.) นำหน้า slug — ใช้แสดง preview URL */
  slugPrefix?: string;
}

interface Result {
  eventCode: string;
  hostCode: string;
  slug: string;
  memorialId: string;
}

// ── QR Code Component ──────────────────────────────────────────────────────
function QRCodeDisplay({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(url, {
        width: 240,
        margin: 2,
        color: { dark: "#78350f", light: "#fdf8ee" },
      }).then(setDataUrl);
    });
  }, [url]);

  if (!dataUrl) return (
    <div className="w-[120px] h-[120px] mx-auto rounded-xl bg-cream-100 border border-gold-200 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="QR Code" className="w-[160px] h-[160px] rounded-xl border-2 border-gold-300" />
      <a
        href={dataUrl}
        download={`qr-${url.split("/").pop()}.png`}
        className="flex items-center gap-1.5 text-xs text-gold-600 underline"
      >
        ดาวน์โหลด QR Code
      </a>
    </div>
  );
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen({ embedded = false, result }: { embedded?: boolean; result: Result; centerId: string }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  // ใช้โดเมนที่ตั้งไว้ (rrb.center) เสมอ ไม่ใช่โดเมนที่กำลังเปิด (อาจเป็น vercel.app)
  // openExternalBrowser=1 ให้ลิงก์เปิดในเบราว์เซอร์จริง ไม่เปิดในแอป LINE
  const publicUrl = `${getSiteUrl()}/${result.slug}?openExternalBrowser=1`;

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className={embedded ? "flex flex-col" : "min-h-screen flex flex-col"}>
      <IosPageHeader title="เปิดงานสำเร็จ" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          <div className="flex flex-col items-center gap-3 py-2">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-emerald-600">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gold-800">เปิดงานศพสำเร็จ!</p>
              <p className="text-xs text-gold-500 mt-1">หน้างานพร้อมให้ผู้ร่วมบุญสแกนได้ทันที</p>
            </div>
          </div>

          {/* QR Code + URL */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-gold-600 mb-3">QR Code สำหรับติดหน้างาน</p>
              <QRCodeDisplay url={publicUrl} />
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-gold-600">ลิงก์หน้างาน</p>
              <div className="bg-white rounded-xl border border-gold-200 px-3 py-2.5 flex items-center gap-2">
                <p className="flex-1 text-xs text-gold-700 break-all font-mono">{publicUrl}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(publicUrl, setCopiedUrl)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-border bg-cream-50 text-gold-700 text-xs font-semibold hover:bg-cream-100 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-white text-xs font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดหน้างาน
                </a>
              </div>
            </div>
          </div>

          {/* Codes */}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gold-400">รหัสงานศพ</p>
                <p className="text-base font-bold text-gold-800 tracking-wider">{result.eventCode}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gold-400">รหัสเจ้าภาพ</p>
                <p className="text-base font-bold text-gold-800 tracking-wider">{result.hostCode}</p>
              </div>
            </div>
            <button
              onClick={() => copy(result.hostCode, setCopiedCode)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-border bg-cream-50 text-gold-700 text-xs font-semibold hover:bg-cream-100 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? "คัดลอกรหัสเจ้าภาพแล้ว" : "คัดลอกรหัสเจ้าภาพ"}
            </button>
            <p className="text-[10px] text-gold-400 text-center">แจ้งรหัสเจ้าภาพแก่เจ้าภาพเพื่อเข้าดู Dashboard และยืนยันบัญชีรับเงิน</p>
          </div>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

// ── Photo Upload ───────────────────────────────────────────────────────────
function PhotoUpload({
  label, required, preview, onFile, compact = false,
}: {
  label: string; required?: boolean; preview: string | null; onFile: (f: File) => void; compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gold-600">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {preview ? (
        <label className="block cursor-pointer">
          <div className={`${compact ? "w-20 h-20" : "w-28 h-32"} rounded-xl overflow-hidden border border-gold-200 mx-auto`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full h-full object-cover" />
          </div>
          <p className="text-center text-[10px] text-gold-400 mt-1">แตะเพื่อเปลี่ยน</p>
          <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
        </label>
      ) : (
        <label className={`flex flex-col items-center justify-center ${compact ? "h-16" : "h-24"} rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors`}>
          <Upload className={`${compact ? "w-5 h-5" : "w-6 h-6"} text-gold-400`} />
          <span className="text-xs text-gold-400 mt-1">อัปโหลดรูป</span>
          <input ref={ref} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
        </label>
      )}
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
function Section({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow overflow-hidden">
      <div className="w-full px-4 py-3.5 flex items-center gap-2.5">
        <span className="text-gold-500">{icon}</span>
        <span className="flex-1 text-sm font-bold text-gold-800">{title}</span>
        {badge && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-600 font-medium">{badge}</span>
        )}
      </div>
      <div className="px-4 pb-4 space-y-3 border-t border-gold-100">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gold-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

// ── Main Form ──────────────────────────────────────────────────────────────
export default function CreateMemorialClient({ centerId, embedded = false, centerBank, slugPrefix = "" }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<Result | null>(null);
  const [error, setError]           = useState("");
  const [consent, setConsent]       = useState(false);

  // Deceased
  const [name, setName]               = useState("");
  const [slugPart, setSlugPart]       = useState("");
  const [slugEdited, setSlugEdited]   = useState(false);
  const [birthDate, setBirthDate]     = useState("");
  const [deathDate, setDeathDate]     = useState("");
  const [age, setAge]                 = useState("");
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Ceremony
  const [ceremonyDate, setCeremonyDate]         = useState("");
  const [ceremonyTime, setCeremonyTime]         = useState("");
  const [ceremonyLocation, setCeremonyLocation] = useState("");
  const [ceremonyHall, setCeremonyHall]         = useState("");
  const [ceremonyAddr, setCeremonyAddr]         = useState<ThaiAddressValue>({});

  // Prayer
  const [prayerSchedule, setPrayerSchedule] = useState("");
  const [prayerText, setPrayerText]         = useState("");

  // PrintNode
  const [printerId, setPrinterId] = useState("");

  // Host info
  const [hostName, setHostName]                 = useState("");
  const [hostPhone, setHostPhone]               = useState("");
  const [hostRelationship, setHostRelationship] = useState("");

  // Auto-fill slug จากชื่อจริง (จนกว่าผู้ใช้จะแก้เอง)
  useEffect(() => {
    if (!slugEdited) setSlugPart(romanizeThaiFirstName(name));
  }, [name, slugEdited]);

  // Auto-calculate age
  useEffect(() => {
    if (!birthDate || !deathDate) return;
    const b = new Date(birthDate);
    const d = new Date(deathDate);
    const a = d.getFullYear() - b.getFullYear() -
      (d < new Date(d.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
    if (a >= 0 && a < 150) setAge(String(a));
  }, [birthDate, deathDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoFile) { setError("กรุณาอัปโหลดรูปถ่ายผู้วายชนม์"); return; }
    if (!consent) { setError("กรุณายืนยันว่าได้รับอนุญาตจากเจ้าภาพ"); return; }

    setSubmitting(true);
    setError("");

    const form = new FormData();
    form.append("center_id", centerId);
    form.append("name", name.trim());
    form.append("slug_part", slugPart.trim());
    form.append("birth_date", birthDate);
    form.append("death_date", deathDate);
    form.append("age", age || "0");
    form.append("ceremony_date", ceremonyDate);
    form.append("ceremony_time", ceremonyTime);
    form.append("ceremony_location", ceremonyLocation);
    if (ceremonyHall)    form.append("ceremony_hall", ceremonyHall);
    if (ceremonyAddr.provinceCode)    form.append("ceremony_province_code", String(ceremonyAddr.provinceCode));
    if (ceremonyAddr.provinceName)    form.append("ceremony_province_name", ceremonyAddr.provinceName);
    if (ceremonyAddr.districtCode)    form.append("ceremony_district_code", String(ceremonyAddr.districtCode));
    if (ceremonyAddr.districtName)    form.append("ceremony_district_name", ceremonyAddr.districtName);
    if (ceremonyAddr.subdistrictCode) form.append("ceremony_subdistrict_code", String(ceremonyAddr.subdistrictCode));
    if (ceremonyAddr.subdistrictName) form.append("ceremony_subdistrict_name", ceremonyAddr.subdistrictName);
    if (ceremonyAddr.postalCode)      form.append("ceremony_postal_code", String(ceremonyAddr.postalCode));
    if (prayerText)      form.append("prayer_text", prayerText);
    if (prayerSchedule)  form.append("prayer_schedule", prayerSchedule);
    if (hostName)        form.append("host_name", hostName);
    if (hostPhone)       form.append("host_phone", hostPhone);
    if (hostRelationship) form.append("host_relationship", hostRelationship);
    form.append("consent_confirmed", "true");
    form.append("bank_name", centerBank?.bank_name || "");
    form.append("bank_account_number", centerBank?.bank_account_number || "");
    form.append("bank_account_name", centerBank?.bank_account_name || "");
    if (centerBank?.bank_account_image_url) form.append("qr_image_url", centerBank.bank_account_image_url);
    if (printerId.trim()) form.append("printer_id", printerId.trim());
    form.append("photo", photoFile);

    try {
      const res = await fetch("/api/memorials/create", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setResult({ eventCode: data.eventCode, hostCode: data.hostCode, slug: data.slug, memorialId: data.memorial.id });
      router.refresh(); // ให้รายการ "งานเปิดอยู่" ในแดชบอร์ดอัปเดตทันที
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  }

  const missingFields = [
    !photoFile && "รูปถ่ายผู้วายชนม์",
    !name && "ชื่อผู้วายชนม์",
    !birthDate && "วันเกิด",
    !deathDate && "วันเสียชีวิต",
    !ceremonyDate && "วันฌาปนกิจ",
    !ceremonyAddr.subdistrictCode && "ที่ตั้งงาน (จังหวัด/อำเภอ/ตำบล)",
    !hostName && "ชื่อเจ้าภาพ",
    !hostPhone && "เบอร์เจ้าภาพ",
    !consent && "ยืนยันการยินยอมของเจ้าภาพ",
  ].filter(Boolean) as string[];
  const canSubmit = missingFields.length === 0;

  if (result) return <SuccessScreen embedded={embedded} result={result} centerId={centerId} />;

  return (
    <div className={embedded ? "flex flex-col" : "min-h-screen flex flex-col"} style={{ background: "#ffffff" }}>
      {!embedded && <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">เปิดงานศพใหม่</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Create Memorial</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>}

      <main className={embedded ? "" : "flex-1 overflow-y-auto"}>
        <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "max-w-lg mx-auto px-4 py-5 space-y-4"}>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs text-emerald-700 leading-relaxed">
            <p className="font-semibold mb-0.5">กรอกข้อมูลงานศพ → เปิดงานได้ทันที</p>
            <p className="text-emerald-600">เจ้าภาพจะยืนยันตัวตนและบัญชีรับเงินเองผ่าน Dashboard เจ้าภาพ</p>
          </div>

          {/* ── ผู้วายชนม์ ─────────────────────────────────────────────── */}
          <Section icon={<LotusIcon className="w-4 h-4" />} title="ข้อมูลผู้วายชนม์" badge="บังคับ">
            <div className="pt-1">
              <PhotoUpload
                label="รูปถ่ายผู้วายชนม์"
                required
                preview={photoPreview}
                onFile={async f => {
                  // ย่อรูปก่อนเก็บ — กันรูปใหญ่เกินลิมิต iOS ในหน้า e-card
                  let img = f;
                  try { img = await compressImage(f); } catch { /* ใช้ไฟล์เดิม */ }
                  setPhotoFile(img);
                  setPhotoPreview(URL.createObjectURL(img));
                }}
              />
            </div>

            <Field label="ชื่อ-นามสกุลผู้วายชนม์" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="เช่น นางสาว สุภาพร ปทุมานนท์" className={inputClass} />
            </Field>

            <Field label="URL หน้างาน (แก้ไขได้ — เติมเลข/ตัวอักษรเมื่อชื่อซ้ำ)">
              <div className="flex items-stretch gold-border rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-gold-400">
                {slugPrefix && (
                  <span className="flex items-center px-2.5 bg-cream-100 text-gold-500 text-sm font-mono border-r border-gold-200 whitespace-nowrap">
                    {slugPrefix}-
                  </span>
                )}
                <input
                  type="text"
                  value={slugPart}
                  onChange={e => {
                    setSlugPart(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSlugEdited(true);
                  }}
                  placeholder="suphaphon"
                  className="flex-1 min-w-0 px-3 py-2.5 bg-white text-gold-800 placeholder-gold-300 focus:outline-none text-sm font-mono"
                />
              </div>
              <p className="text-[10px] text-gold-400 mt-1 break-all">
                ตัวอย่าง: ruamboon.online/{[slugPrefix, slugPart].filter(Boolean).join("-") || "…"}
              </p>
            </Field>

            <Field label="วันเกิด (ชาตะ)" required>
              <ThaiDateInput value={birthDate} onChange={setBirthDate} required />
            </Field>
            <Field label="วันเสียชีวิต (มรณะ)" required>
              <ThaiDateInput value={deathDate} onChange={setDeathDate} required />
            </Field>

            <Field label="อายุ (ปี)">
              <input type="number" value={age} onChange={e => setAge(e.target.value)}
                placeholder="คำนวณอัตโนมัติ" className={inputClass} min="0" max="150" />
            </Field>
          </Section>

          {/* ── กำหนดการ ─────────────────────────────────────────────── */}
          <Section icon={<span className="text-sm">📅</span>} title="กำหนดการ" badge="บังคับ">
            <div className="pt-1 space-y-3">
              <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide">สวดพระอภิธรรม</p>
              <Field label="วัน/เวลาสวดพระอภิธรรม">
                <input type="text" value={prayerText} onChange={e => setPrayerText(e.target.value)}
                  placeholder="เช่น 17–19 มีนาคม 2568 เวลา 19.00 น." className={inputClass} />
              </Field>
              <Field label="สถานที่สวดพระอภิธรรม">
                <input type="text" value={prayerSchedule} onChange={e => setPrayerSchedule(e.target.value)}
                  placeholder="เช่น วัดวังเพชร หรือ บ้านเลขที่ 123" className={inputClass} />
                <p className="text-[10px] text-gold-400 mt-0.5">ถ้าว่างจะใช้สถานที่ฌาปนกิจแทน</p>
              </Field>

              <div className="border-t border-gold-100 pt-2">
                <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide mb-2">ฌาปนกิจ</p>
              </div>

              <Field label="วันฌาปนกิจ" required>
                <ThaiDateInput value={ceremonyDate} onChange={setCeremonyDate} required />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="เวลาฌาปนกิจ">
                  <input type="text" value={ceremonyTime} onChange={e => setCeremonyTime(e.target.value)}
                    placeholder="เช่น 16.00 น." className={inputClass} />
                </Field>
                <Field label="อาคาร / ศาลา">
                  <input type="text" value={ceremonyHall} onChange={e => setCeremonyHall(e.target.value)}
                    placeholder="เช่น ศาลา 1" className={inputClass} />
                </Field>
              </div>

              <Field label="ชื่อวัด / สถานที่ฌาปนกิจ" required>
                <input type="text" value={ceremonyLocation} onChange={e => setCeremonyLocation(e.target.value)} required
                  placeholder="เช่น วัดวังเพชร" className={inputClass} />
              </Field>

              <div className="pt-1">
                <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide mb-2">ที่ตั้ง (จังหวัด / อำเภอ / ตำบล)</p>
                <ThaiAddressSelect value={ceremonyAddr} onChange={setCeremonyAddr} required />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-3 space-y-2">
                <p className="text-[11px] font-bold text-blue-800">🖨️ เครื่องพิมพ์ป้ายชื่ออัตโนมัติ (PrintNode)</p>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  ระบุ Printer ID จาก PrintNode เพื่อสั่งพิมพ์ป้ายชื่ออัตโนมัติเมื่อมีผู้ร่วมบุญ
                </p>
                <input
                  type="number"
                  value={printerId}
                  onChange={e => setPrinterId(e.target.value)}
                  placeholder="เช่น 78945 (ดูได้จาก printnode.com)"
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-300 bg-white text-blue-900 placeholder-blue-300 focus:outline-none text-sm font-mono"
                />
              </div>
            </div>
          </Section>

          {/* ── เจ้าภาพ ─────────────────────────────────────────────── */}
          <Section icon={<span className="text-sm">👤</span>} title="ข้อมูลเจ้าภาพ" badge="บังคับ">
            <div className="pt-1 space-y-3">
              <Field label="ชื่อเจ้าภาพ / ผู้ติดต่อหลัก" required>
                <input type="text" value={hostName} onChange={e => setHostName(e.target.value)} required
                  placeholder="เช่น นาย สมชาย ใจดี" className={inputClass} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="เบอร์โทรศัพท์" required>
                  <input type="tel" value={hostPhone} onChange={e => setHostPhone(e.target.value)} required
                    placeholder="081-234-5678" className={inputClass} />
                </Field>
                <Field label="ความสัมพันธ์">
                  <input type="text" value={hostRelationship} onChange={e => setHostRelationship(e.target.value)}
                    placeholder="เช่น บุตร / ภรรยา" className={inputClass} />
                </Field>
              </div>

              <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-gold-600 shrink-0"
                />
                <span className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">ยืนยัน</span> ว่าเจ้าภาพได้ให้ความยินยอมแก่ศูนย์บริหารในการเปิดหน้างานนี้ในระบบแล้ว <span className="text-red-500 font-semibold">*</span>
                </span>
              </label>
            </div>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">
              {error}
            </div>
          )}

          {!canSubmit && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              <p className="font-semibold mb-1">กรอกข้อมูลให้ครบเพื่อสร้างลิงก์และ QR Code:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                {missingFields.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full gold-gradient text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {submitting ? "กำลังสร้างหน้างาน..." : "เปิดงานศพ · สร้างลิงก์และ QR Code"}
          </button>

          <p className="text-center text-[10px] text-gold-400 pb-2">
            หลังเปิดงาน เจ้าภาพจะยืนยันตัวตนและบัญชีรับเงินผ่าน Dashboard เจ้าภาพ
          </p>
        </form>
      </main>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Copy, Check, ExternalLink,
  ChevronDown, ChevronUp, Shield, CreditCard, FileText,
} from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import LotusIcon from "@/components/LotusIcon";
import ThaiDateInput from "@/components/ThaiDateInput";

interface Props { centerId: string; }

interface Result {
  eventCode: string;
  hostCode: string;
  slug: string;
  memorialId: string;
}

const CENTRAL_BANK    = "ธนาคารกรุงไทย";
const CENTRAL_ACCOUNT = "6200358257";
const CENTRAL_NAME    = "มูลนิธิ หรีดร่วมบุญ ESG Zero Waste";
const SERVICE_FEE     = 100;

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
function SuccessScreen({ result, centerId }: { result: Result; centerId: string }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${result.slug}`
    : `/${result.slug}`;

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <IosPageHeader title="เปิดงานสำเร็จ" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          {/* Success icon */}
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
            <p className="text-[10px] text-gold-400 text-center">แจ้งรหัสเจ้าภาพแก่เจ้าภาพเพื่อเข้าดู Dashboard ของตัวเอง</p>
          </div>

          {/* Back */}
          <Link
            href={`/dashboard/center/${centerId}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลักศูนย์
          </Link>

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
function Section({
  icon, title, badge, children, collapsible = false, defaultOpen = true,
}: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode;
  collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow overflow-hidden">
      <button
        type="button"
        className="w-full px-4 py-3.5 flex items-center gap-2.5 text-left"
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <span className="text-gold-500">{icon}</span>
        <span className="flex-1 text-sm font-bold text-gold-800">{title}</span>
        {badge && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-600 font-medium">{badge}</span>
        )}
        {collapsible && (
          <span className="text-gold-400">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gold-100">
          {children}
        </div>
      )}
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
const inputReadonly = `${inputClass} opacity-50 cursor-not-allowed`;

// ── Main Form ──────────────────────────────────────────────────────────────
export default function CreateMemorialClient({ centerId }: Props) {
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<Result | null>(null);
  const [error, setError]             = useState("");
  const [consent, setConsent]         = useState(false);
  const [showLevelC, setShowLevelC]   = useState(false);

  // Level A - deceased
  const [name, setName]               = useState("");
  const [birthDate, setBirthDate]     = useState("");
  const [deathDate, setDeathDate]     = useState("");
  const [age, setAge]                 = useState("");
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ceremony
  const [ceremonyDate, setCeremonyDate]         = useState("");
  const [ceremonyTime, setCeremonyTime]         = useState("");
  const [ceremonyLocation, setCeremonyLocation] = useState("");
  const [ceremonyHall, setCeremonyHall]         = useState("");

  // prayer
  const [prayerSchedule, setPrayerSchedule] = useState("");   // สถานที่สวด → prayer_location
  const [prayerText, setPrayerText]         = useState("");   // กำหนดการ/เวลา → prayer_date

  // Level A - host
  const [hostName, setHostName]               = useState("");
  const [hostPhone, setHostPhone]             = useState("");
  const [hostRelationship, setHostRelationship] = useState("");

  // Level B - central bank (pre-filled, read-only)
  const [accountNumber, setAccountNumber] = useState(CENTRAL_ACCOUNT);

  // Level C - host payout
  const [hostBankName, setHostBankName]           = useState("");
  const [hostBankAccount, setHostBankAccount]     = useState("");
  const [hostBankAccountName, setHostBankAccountName] = useState("");

  // Level C - documents
  const [certFile, setCertFile]         = useState<File | null>(null);
  const [certPreview, setCertPreview]   = useState<string | null>(null);
  const [idCardFile, setIdCardFile]     = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [qrFile, setQrFile]             = useState<File | null>(null);
  const [qrPreview, setQrPreview]       = useState<string | null>(null);

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
    form.append("birth_date", birthDate);
    form.append("death_date", deathDate);
    form.append("age", age || "0");
    form.append("ceremony_date", ceremonyDate);
    form.append("ceremony_time", ceremonyTime);
    form.append("ceremony_location", ceremonyLocation);
    if (ceremonyHall) form.append("ceremony_hall", ceremonyHall);
    if (prayerText)     form.append("prayer_text", prayerText);
    if (prayerSchedule) form.append("prayer_schedule", prayerSchedule);
    if (hostName) form.append("host_name", hostName);
    if (hostPhone) form.append("host_phone", hostPhone);
    if (hostRelationship) form.append("host_relationship", hostRelationship);
    form.append("consent_confirmed", "true");
    form.append("bank_name", `ธนาคารกรุงไทย\nKrungthai Bank`);
    form.append("bank_account_number", accountNumber);
    form.append("bank_account_name", CENTRAL_NAME);
    if (hostBankName) form.append("host_bank_name", hostBankName);
    if (hostBankAccount) form.append("host_bank_account_number", hostBankAccount);
    if (hostBankAccountName) form.append("host_bank_account_name", hostBankAccountName);
    form.append("photo", photoFile);
    if (qrFile) form.append("qr_image", qrFile);
    if (certFile) form.append("death_certificate", certFile);
    if (idCardFile) form.append("host_id_card", idCardFile);

    try {
      const res = await fetch("/api/memorials/create", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setResult({ eventCode: data.eventCode, hostCode: data.hostCode, slug: data.slug, memorialId: data.memorial.id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  }

  if (result) return <SuccessScreen result={result} centerId={centerId} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href={`/dashboard/center/${centerId}`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
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
      </header>

      <main className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4">

          {/* Instruction banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs text-emerald-700 leading-relaxed">
            <p className="font-semibold mb-0.5">กรอกข้อมูลขั้นต่ำ → เปิดงานได้ทันที</p>
            <p className="text-emerald-600">ระดับ A: ข้อมูลบังคับ · ระดับ B: บัญชีกลาง · ระดับ C: เอกสารยืนยัน (เพิ่มทีหลังได้)</p>
          </div>

          {/* ── LEVEL A: ผู้วายชนม์ ───────────────────────────────────────── */}
          <Section icon={<LotusIcon className="w-4 h-4" />} title="ข้อมูลผู้วายชนม์" badge="ระดับ A · บังคับ">
            <div className="pt-1">
              <PhotoUpload
                label="รูปถ่ายผู้วายชนม์"
                required
                preview={photoPreview}
                onFile={f => { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); }}
              />
            </div>

            <Field label="ชื่อ-นามสกุลผู้วายชนม์" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="เช่น นางสาว สุภาพร ปทุมานนท์" className={inputClass} />
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

          {/* ── LEVEL A: กำหนดการ ────────────────────────────────────────── */}
          <Section icon={<span className="text-sm">📅</span>} title="กำหนดการ" badge="ระดับ A · บังคับ">
            <div className="pt-1 space-y-3">

              {/* สวดพระอภิธรรม */}
              <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide">กำหนดการ สวดพระอภิธรรม</p>
              <Field label="กำหนดการสวดพระอภิธรรม (วัน/เวลา)">
                <input type="text" value={prayerText} onChange={e => setPrayerText(e.target.value)}
                  placeholder="เช่น 17–19 มีนาคม 2568 เวลา 19.00 น."
                  className={inputClass} />
              </Field>
              <Field label="สถานที่สวดพระอภิธรรม">
                <input type="text" value={prayerSchedule} onChange={e => setPrayerSchedule(e.target.value)}
                  placeholder="เช่น บ้านเลขที่ 123 หมู่ 5 ต.พรานกระต่าย / วัดวังเพชร"
                  className={inputClass} />
                <p className="text-[10px] text-gold-400 mt-0.5">ถ้าว่างจะใช้สถานที่ฌาปนกิจแทน</p>
              </Field>

              <div className="border-t border-gold-100 pt-2">
                <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-wide mb-2">กำหนดการ ฌาปนกิจ</p>
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

              <Field label="สถานที่ฌาปนกิจ (วัด / สถานที่)" required>
                <input type="text" value={ceremonyLocation} onChange={e => setCeremonyLocation(e.target.value)} required
                  placeholder="เช่น วัดวังเพชร ต.นิคมทุ่งโพธิ์ทะเล อ.เมือง จ.กำแพงเพชร" className={inputClass} />
              </Field>
            </div>
          </Section>

          {/* ── LEVEL A: เจ้าภาพ ─────────────────────────────────────────── */}
          <Section icon={<span className="text-sm">👤</span>} title="ข้อมูลเจ้าภาพ" badge="ระดับ A · บังคับ">
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

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-gold-600 shrink-0"
                />
                <span className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">ยืนยัน</span> ว่าเจ้าภาพได้ให้ความยินยอมแก่ศูนย์บริหารในการเปิดหน้างานนี้ในระบบหรีดร่วมบุญ Zero Waste แล้ว <span className="text-red-500 font-semibold">*</span>
                </span>
              </label>
            </div>
          </Section>

          {/* ── LEVEL B: บัญชีกลาง ───────────────────────────────────────── */}
          <Section icon={<CreditCard className="w-4 h-4" />} title="บัญชีกลางรับเงิน" badge="ระดับ B · บัญชีมูลนิธิ">
            <div className="pt-1 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
                ผู้ร่วมบุญโอนเงินมาที่บัญชีกลางของมูลนิธิ ศูนย์จะสรุปยอดและนำส่งเจ้าภาพหลังปิดงาน
                (หัก {SERVICE_FEE} บาท/รายการ สำหรับกระดาษ หมึก และจิตอาสา)
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-gold-100">
                  <span className="text-xs text-gold-500">ธนาคาร</span>
                  <span className="font-semibold text-gold-800">{CENTRAL_BANK}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gold-100">
                  <span className="text-xs text-gold-500">เลขบัญชี</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      className="w-32 px-2 py-1 rounded-lg border border-gold-200 text-right text-sm font-bold text-gold-800 bg-white focus:outline-none focus:ring-1 focus:ring-gold-400"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-gold-500">ชื่อบัญชี</span>
                  <span className="text-xs text-gold-700 text-right max-w-[180px]">{CENTRAL_NAME}</span>
                </div>
              </div>

              <Field label="อัปโหลด QR Code บัญชี (ถ้ามี)">
                <PhotoUpload
                  label=""
                  preview={qrPreview}
                  compact
                  onFile={f => { setQrFile(f); setQrPreview(URL.createObjectURL(f)); }}
                />
              </Field>
            </div>
          </Section>

          {/* ── LEVEL C: เอกสาร (collapsible) ────────────────────────────── */}
          <div className="space-y-0">
            <button
              type="button"
              onClick={() => setShowLevelC(o => !o)}
              className="w-full flex items-center gap-2 text-xs text-gold-500 py-2 px-1 hover:text-gold-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">ระดับ C: เอกสารยืนยันและบัญชีนำส่งเจ้าภาพ (ไม่บังคับ เพิ่มทีหลังได้)</span>
              {showLevelC ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showLevelC && (
              <Section icon={<Shield className="w-4 h-4" />} title="เอกสารยืนยัน + บัญชีนำส่ง" badge="ระดับ C · หลังบ้านเท่านั้น">
                <div className="pt-1 space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[10px] text-gray-500">
                    ข้อมูลชุดนี้ไม่แสดงบนหน้า Public จัดเก็บไว้สำหรับศูนย์และแอดมินเท่านั้น
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PhotoUpload
                      label="ใบมรณะบัตร"
                      preview={certPreview}
                      compact
                      onFile={f => { setCertFile(f); setCertPreview(URL.createObjectURL(f)); }}
                    />
                    <PhotoUpload
                      label="สำเนาบัตรประชาชนเจ้าภาพ"
                      preview={idCardPreview}
                      compact
                      onFile={f => { setIdCardFile(f); setIdCardPreview(URL.createObjectURL(f)); }}
                    />
                  </div>

                  <p className="text-xs font-semibold text-gold-700">บัญชีรับเงินนำส่งเจ้าภาพ</p>

                  <Field label="ธนาคารเจ้าภาพ">
                    <input type="text" value={hostBankName} onChange={e => setHostBankName(e.target.value)}
                      placeholder="เช่น ธนาคารกรุงไทย" className={inputClass} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="เลขบัญชีเจ้าภาพ">
                      <input type="text" value={hostBankAccount} onChange={e => setHostBankAccount(e.target.value)}
                        placeholder="123-4-56789-0" className={inputClass} />
                    </Field>
                    <Field label="ชื่อบัญชีเจ้าภาพ">
                      <input type="text" value={hostBankAccountName} onChange={e => setHostBankAccountName(e.target.value)}
                        placeholder="ชื่อ-นามสกุล" className={inputClass} />
                    </Field>
                  </div>
                </div>
              </Section>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !consent || !name || !birthDate || !deathDate || !ceremonyDate || !photoFile}
            className="w-full gold-gradient text-white font-bold py-4 rounded-2xl text-base disabled:opacity-40 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {submitting ? "กำลังสร้างหน้างาน..." : "เปิดงานศพ · สร้างลิงก์และ QR Code"}
          </button>

          <p className="text-center text-[10px] text-gold-400 pb-2">
            หลังเปิดงาน ระบบจะสร้างลิงก์ QR Code และรหัสเจ้าภาพให้ทันที
          </p>
        </form>
      </main>
    </div>
  );
}

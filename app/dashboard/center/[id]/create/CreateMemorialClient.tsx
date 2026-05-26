"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

interface Props { centerId: string; }

interface Result {
  slug: string;
  hostCode: string;
  publicUrl: string;
  memorialId: string;
}

const DEFAULT_BANK_NAME = "ธนาคารกรุงไทย\nKrungthai Bank";
const DEFAULT_ACCOUNT_NUMBER = "6200358257";
const DEFAULT_ACCOUNT_NAME = "มูลนิธิ หรีดร่วมบุญ ESG Zero Waste";

export default function CreateMemorialClient({ centerId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [age, setAge] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [ceremonyDate, setCeremonyDate] = useState("");
  const [ceremonyTime, setCeremonyTime] = useState("");
  const [ceremonyLocation, setCeremonyLocation] = useState("");
  const [ceremonyHall, setCeremonyHall] = useState("");
  const [prayerDate, setPrayerDate] = useState("");
  const [prayerLocation, setPrayerLocation] = useState("");
  const [hostName, setHostName] = useState("");
  const [hostPhone, setHostPhone] = useState("");
  const [bankName] = useState(DEFAULT_BANK_NAME);
  const [accountNumber, setAccountNumber] = useState(DEFAULT_ACCOUNT_NUMBER);
  const [accountName] = useState(DEFAULT_ACCOUNT_NAME);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const photoRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  // Auto-calculate age when dates change
  useEffect(() => {
    if (birthDate && deathDate) {
      const b = new Date(birthDate);
      const d = new Date(deathDate);
      const a = d.getFullYear() - b.getFullYear() - (d < new Date(d.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
      if (a >= 0 && a < 150) setAge(String(a));
    }
  }, [birthDate, deathDate]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  function handleQr(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthDate || !deathDate || !ceremonyDate || !accountNumber.trim()) {
      setError("กรุณากรอกข้อมูลที่จำเป็น: ชื่อ วันเกิด วันเสียชีวิต วันฌาปนกิจ เลขบัญชี");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("center_id", centerId);
      form.append("name", name.trim());
      form.append("birth_date", birthDate);
      form.append("death_date", deathDate);
      form.append("age", age || "0");
      form.append("ceremony_date", ceremonyDate);
      form.append("ceremony_time", ceremonyTime);
      form.append("ceremony_location", ceremonyLocation);
      form.append("ceremony_hall", ceremonyHall);
      form.append("prayer_date", prayerDate);
      form.append("prayer_location", prayerLocation);
      form.append("host_name", hostName);
      form.append("host_phone", hostPhone);
      form.append("bank_name", bankName);
      form.append("bank_account_number", accountNumber);
      form.append("bank_account_name", accountName);
      if (photoFile) form.append("photo", photoFile);
      if (qrFile) form.append("qr_image", qrFile);

      const res = await fetch("/api/memorials/create", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

      const origin = window.location.origin;
      setResult({
        slug: data.slug,
        hostCode: data.hostCode,
        publicUrl: `${origin}/${data.slug}`,
        memorialId: data.memorial.id,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  }

  function copyUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  function copyCode() {
    if (!result) return;
    navigator.clipboard.writeText(result.hostCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
        <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
          <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
            <div className="w-8" />
            <div className="flex items-center gap-2">
              <LotusIcon className="w-5 h-5 text-gold-600" />
              <p className="text-sm font-bold gold-gradient-text">สร้างหน้างานสำเร็จ</p>
              <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
            </div>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm space-y-4">
            {/* Success icon */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-emerald-600">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gold-800">สร้างหน้างานสำเร็จ!</p>
                <p className="text-xs text-gold-500 mt-1">หน้างานพร้อมให้ผู้ร่วมบุญสแกนแล้ว</p>
              </div>
            </div>

            {/* Public URL */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
              <p className="text-xs font-semibold text-gold-700">ลิงก์หน้างาน (สำหรับทำ QR Code)</p>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-gold-200 px-3 py-2.5">
                <p className="flex-1 text-xs text-gold-700 break-all font-mono">{result.publicUrl}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyUrl} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-border bg-cream-50 text-gold-700 text-xs font-semibold hover:bg-cream-100 transition-colors">
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUrl ? "คัดลอกแล้ว" : "คัดลอก"}
                </button>
                <a href={result.publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl gold-gradient text-white text-xs font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดหน้างาน
                </a>
              </div>
            </div>

            {/* Host code */}
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
              <p className="text-xs font-semibold text-gold-700">รหัสเจ้าภาพ (สำหรับเข้า Dashboard เจ้าภาพ)</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-gold-800 tracking-[0.3em]">{result.hostCode}</p>
                <button onClick={copyCode} className="p-2 rounded-lg gold-border bg-cream-50 text-gold-600 hover:bg-cream-100 transition-colors">
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gold-400 text-center">แจ้งรหัสนี้แก่เจ้าภาพเพื่อเข้าดูรายชื่อผู้ร่วมบุญ</p>
            </div>

            <Link href={`/dashboard/center/${centerId}`} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              กลับหน้าหลักศูนย์
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
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

          {/* Section 1: ผู้วายชนม์ */}
          <Section title="ข้อมูลผู้วายชนม์">
            <Field label="ชื่อ-นามสกุล *">
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="เช่น นางสาว สุภาพร ปทุมานนท์" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันเกิด *">
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="วันเสียชีวิต *">
                <input type="date" value={deathDate} onChange={e => setDeathDate(e.target.value)} required className={inputClass} />
              </Field>
            </div>
            <Field label="อายุ (ปี)">
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="คำนวณอัตโนมัติ" className={inputClass} min="0" max="150" />
            </Field>
            <Field label="รูปถ่าย">
              {photoPreview ? (
                <label className="block cursor-pointer">
                  <div className="w-28 h-32 rounded-xl overflow-hidden border border-gold-200 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-center text-[11px] text-gold-400 mt-1">แตะเพื่อเปลี่ยน</p>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors">
                  <Upload className="w-6 h-6 text-gold-400" />
                  <span className="text-xs text-gold-400 mt-1">อัปโหลดรูปถ่าย</span>
                  <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
              )}
            </Field>
          </Section>

          {/* Section 2: กำหนดการ */}
          <Section title="กำหนดการ">
            <Field label="วันฌาปนกิจ *">
              <input type="date" value={ceremonyDate} onChange={e => setCeremonyDate(e.target.value)} required className={inputClass} />
            </Field>
            <Field label="เวลาฌาปนกิจ">
              <input type="text" value={ceremonyTime} onChange={e => setCeremonyTime(e.target.value)} placeholder="เช่น 16.00 น." className={inputClass} />
            </Field>
            <Field label="สถานที่ฌาปนกิจ">
              <input type="text" value={ceremonyLocation} onChange={e => setCeremonyLocation(e.target.value)} placeholder="เช่น วัดไตรภูมิ ต.พรานกระต่าย" className={inputClass} />
            </Field>
            <Field label="ชื่ออาคาร / ศาลา (ถ้ามี)">
              <input type="text" value={ceremonyHall} onChange={e => setCeremonyHall(e.target.value)} placeholder="เช่น ศาลา 3" className={inputClass} />
            </Field>
            <Field label="ช่วงสวดอภิธรรม (ถ้ามี)">
              <input type="text" value={prayerDate} onChange={e => setPrayerDate(e.target.value)} placeholder="เช่น 16-19 มีนาคม 2559" className={inputClass} />
            </Field>
            <Field label="สถานที่สวดอภิธรรม (ถ้ามี)">
              <input type="text" value={prayerLocation} onChange={e => setPrayerLocation(e.target.value)} placeholder="เช่น บ้านป่าแดงกลาง" className={inputClass} />
            </Field>
          </Section>

          {/* Section 3: เจ้าภาพ */}
          <Section title="ข้อมูลเจ้าภาพ">
            <Field label="ชื่อเจ้าภาพ">
              <input type="text" value={hostName} onChange={e => setHostName(e.target.value)} placeholder="เช่น นาย สมชาย ใจดี" className={inputClass} />
            </Field>
            <Field label="เบอร์โทรศัพท์เจ้าภาพ">
              <input type="tel" value={hostPhone} onChange={e => setHostPhone(e.target.value)} placeholder="เช่น 081-234-5678" className={inputClass} />
            </Field>
          </Section>

          {/* Section 4: บัญชีรับเงิน */}
          <Section title="บัญชีรับเงิน">
            <Field label="ธนาคาร">
              <input type="text" value={bankName.split("\n")[0]} readOnly className={`${inputClass} opacity-60`} />
            </Field>
            <Field label="เลขที่บัญชี *">
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} required placeholder="เช่น 6200358257" className={inputClass} />
            </Field>
            <Field label="ชื่อบัญชี">
              <input type="text" value={accountName} readOnly className={`${inputClass} opacity-60`} />
            </Field>
            <Field label="รูป QR Code ธนาคาร (ถ้ามี)">
              {qrPreview ? (
                <label className="block cursor-pointer">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-gold-200 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrPreview} alt="" className="w-full h-full object-contain" />
                  </div>
                  <p className="text-center text-[11px] text-gold-400 mt-1">แตะเพื่อเปลี่ยน</p>
                  <input ref={qrRef} type="file" accept="image/*" onChange={handleQr} className="hidden" />
                </label>
              ) : (
                <label className="flex flex-col items-center justify-center h-20 rounded-xl border-2 border-dashed border-gold-300 bg-cream-50 cursor-pointer hover:bg-cream-100 transition-colors">
                  <Upload className="w-5 h-5 text-gold-400" />
                  <span className="text-xs text-gold-400 mt-1">อัปโหลด QR Code</span>
                  <input ref={qrRef} type="file" accept="image/*" onChange={handleQr} className="hidden" />
                </label>
              )}
            </Field>
          </Section>

          {error && <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-base disabled:opacity-50 shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {submitting ? "กำลังสร้างหน้างาน..." : "สร้างหน้างาน"}
          </button>

          <div className="h-2" />
        </form>
      </main>
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-gold-300 text-xs">❖</span>
        <p className="text-sm font-bold text-gold-800">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gold-600">{label}</label>
      {children}
    </div>
  );
}

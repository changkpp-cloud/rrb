"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import LotusIcon from "./LotusIcon";
import ThaiDateInput from "./ThaiDateInput";
import Link from "next/link";
import type { Memorial } from "@/lib/supabase/types";

interface Props {
  memorial: Memorial;
  backHref: string;
  actorType: "center" | "host" | "admin";
  hostCode?: string;
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gold-200 bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gold-100">
        <p className="text-sm font-bold text-gold-800">{title}</p>
      </div>
      <div className="px-4 py-4 space-y-3">{children}</div>
    </div>
  );
}

export default function EditMemorialInfoForm({ memorial, backHref, actorType, hostCode }: Props) {
  const router = useRouter();
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  const [name, setName]                         = useState(memorial.name);
  const [birthDate, setBirthDate]               = useState(memorial.birth_date);
  const [deathDate, setDeathDate]               = useState(memorial.death_date);
  const [age, setAge]                           = useState(String(memorial.age));
  const [ceremonyDate, setCeremonyDate]         = useState(memorial.ceremony_date);
  const [ceremonyTime, setCeremonyTime]         = useState(memorial.ceremony_time);
  const [ceremonyLocation, setCeremonyLocation] = useState(memorial.ceremony_location);
  const [ceremonyHall, setCeremonyHall]         = useState(memorial.ceremony_hall ?? "");
  const [prayerSchedule, setPrayerSchedule]     = useState(memorial.prayer_location ?? "");
  const [hostName, setHostName]                 = useState(memorial.host_name ?? "");
  const [hostPhone, setHostPhone]               = useState(memorial.host_phone ?? "");
  const [hostRelationship, setHostRelationship] = useState(memorial.host_relationship ?? "");

  // Auto-calculate age
  useEffect(() => {
    if (!birthDate || !deathDate) return;
    const b = new Date(birthDate);
    const d = new Date(deathDate);
    const a = d.getFullYear() - b.getFullYear() -
      (d < new Date(d.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
    if (a >= 0 && a < 150) setAge(String(a));
  }, [birthDate, deathDate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        birth_date: birthDate,
        death_date: deathDate,
        age: parseInt(age) || 0,
        ceremony_date: ceremonyDate,
        ceremony_time: ceremonyTime,
        ceremony_location: ceremonyLocation.trim(),
        ceremony_hall: ceremonyHall.trim() || null,
        prayer_location: prayerSchedule.trim() || null,
        host_name: hostName.trim() || null,
        host_phone: hostPhone.trim() || null,
        host_relationship: hostRelationship.trim() || null,
      };
      if (actorType === "host" && hostCode) body.host_code = hostCode;

      const res = await fetch(`/api/memorials/${memorial.id}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setSaved(true);
      setTimeout(() => router.push(backHref), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href={backHref} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">แก้ไขข้อมูลงาน</p>
              <p className="text-[9px] text-gold-500 -mt-0.5 truncate max-w-[120px]">{memorial.name}</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Actor badge */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <span className="text-[10px] text-blue-600 font-medium">
              {actorType === "center" ? "แก้ไขโดย: ศูนย์บริหาร" : actorType === "host" ? "แก้ไขโดย: เจ้าภาพ" : "แก้ไขโดย: แอดมิน"}
            </span>
            <span className="text-[10px] text-blue-400">· ระบบบันทึกทุกการแก้ไข</span>
          </div>

          {/* ข้อมูลผู้วายชนม์ */}
          <Section title="ข้อมูลผู้วายชนม์">
            <Field label="ชื่อ-นามสกุลผู้วายชนม์" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className={inputClass} placeholder="ชื่อ-นามสกุล" />
            </Field>
            <Field label="วันเกิด (ชาตะ)" required>
              <ThaiDateInput value={birthDate} onChange={setBirthDate} required />
            </Field>
            <Field label="วันเสียชีวิต (มรณะ)" required>
              <ThaiDateInput value={deathDate} onChange={setDeathDate} required />
            </Field>
            <Field label="อายุ (ปี)">
              <input type="number" value={age} onChange={e => setAge(e.target.value)}
                className={inputClass} min="0" max="150" placeholder="คำนวณอัตโนมัติ" />
            </Field>
          </Section>

          {/* กำหนดการ */}
          <Section title="กำหนดการ">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-[11px] text-blue-700">
              วันสวดจะแสดงอัตโนมัติ = วันฌาปนกิจ ลบ 3 วัน — ใส่วันฌาปนกิจให้ถูกต้องก็พอ
            </div>
            <Field label="วันฌาปนกิจ" required>
              <ThaiDateInput value={ceremonyDate} onChange={setCeremonyDate} required />
            </Field>
            {ceremonyDate && (
              <div className="bg-cream-50 border border-gold-200 rounded-xl px-3 py-2 text-[11px] text-gold-700">
                วันสวดจะแสดงเป็น: <strong>
                  {(() => {
                    const [y, m, d] = ceremonyDate.split("-").map(Number);
                    const ceremony = new Date(y, m - 1, d);
                    const monthsShort = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
                    const start = new Date(ceremony); start.setDate(ceremony.getDate() - 3);
                    const end = new Date(ceremony); end.setDate(ceremony.getDate() - 1);
                    return `${start.getDate()}–${end.getDate()} ${monthsShort[end.getMonth()]} พ.ศ. ${end.getFullYear() + 543}`;
                  })()}
                </strong>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="เวลาฌาปนกิจ">
                <input type="text" value={ceremonyTime} onChange={e => setCeremonyTime(e.target.value)}
                  className={inputClass} placeholder="เช่น 16.00 น." />
              </Field>
              <Field label="ชื่ออาคาร / ศาลา">
                <input type="text" value={ceremonyHall} onChange={e => setCeremonyHall(e.target.value)}
                  className={inputClass} placeholder="เช่น ศาลา 1" />
              </Field>
            </div>
            <Field label="สถานที่จัดงาน / วัด" required>
              <input type="text" value={ceremonyLocation} onChange={e => setCeremonyLocation(e.target.value)} required
                className={inputClass} placeholder="วัด / สถานที่" />
            </Field>
          </Section>

          {/* เจ้าภาพ */}
          <Section title="ข้อมูลเจ้าภาพ">
            <Field label="ชื่อเจ้าภาพ">
              <input type="text" value={hostName} onChange={e => setHostName(e.target.value)}
                className={inputClass} placeholder="ชื่อ-นามสกุล" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="เบอร์โทรศัพท์">
                <input type="tel" value={hostPhone} onChange={e => setHostPhone(e.target.value)}
                  className={inputClass} placeholder="081-234-5678" />
              </Field>
              <Field label="ความสัมพันธ์">
                <input type="text" value={hostRelationship} onChange={e => setHostRelationship(e.target.value)}
                  className={inputClass} placeholder="เช่น บุตร / ภรรยา" />
              </Field>
            </div>
          </Section>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 font-semibold">บันทึกสำเร็จ — กำลังกลับ...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving || saved}
            className="w-full gold-gradient text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-50 shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>

          <div className="h-2" />
        </form>
      </main>
    </div>
  );
}

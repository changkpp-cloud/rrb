"use client";

import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { useState } from "react";

const DEMO = {
  name: "นางสาว สุภาพร ปทุมานนท์",
  birth_date: "1988-06-19",
  death_date: "2016-03-16",
  age: "28",
  ceremony_date: "2016-03-20",
  ceremony_time: "13:00",
  ceremony_location: "วัดไตรภูมิ",
  ceremony_hall: "ต.พรานกระต่าย อ.พรานกระต่าย จ.กำแพงเพชร",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gold-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm";

export default function SettingsPage() {
  const [form, setForm] = useState(DEMO);
  const [saved, setSaved] = useState(false);

  function set(key: keyof typeof DEMO) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text tracking-wide">ตั้งค่างาน</p>
              <p className="text-[9px] text-gold-500 tracking-widest uppercase -mt-0.5">Memorial Settings</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Deceased info */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">
          <div className="flex items-center gap-2 text-gold-700 pb-1 border-b border-gold-200">
            <LotusIcon className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-bold">ข้อมูลผู้วายชนม์</span>
          </div>

          <Field label="ชื่อ-นามสกุล">
            <input type="text" value={form.name} onChange={set("name")} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="วันเกิด">
              <input type="date" value={form.birth_date} onChange={set("birth_date")} className={inputCls} />
            </Field>
            <Field label="วันถึงแก่กรรม">
              <input type="date" value={form.death_date} onChange={set("death_date")} className={inputCls} />
            </Field>
          </div>

          <Field label="อายุ (ปี)">
            <input type="number" value={form.age} onChange={set("age")} className={inputCls} />
          </Field>
        </div>

        {/* Ceremony info */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">
          <div className="flex items-center gap-2 text-gold-700 pb-1 border-b border-gold-200">
            <LotusIcon className="w-4 h-4 text-gold-500" />
            <span className="text-sm font-bold">ข้อมูลพิธีฌาปนกิจ</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="วันที่พิธี">
              <input type="date" value={form.ceremony_date} onChange={set("ceremony_date")} className={inputCls} />
            </Field>
            <Field label="เวลา">
              <input type="time" value={form.ceremony_time} onChange={set("ceremony_time")} className={inputCls} />
            </Field>
          </div>

          <Field label="วัด / สถานที่">
            <input type="text" value={form.ceremony_location} onChange={set("ceremony_location")} className={inputCls} />
          </Field>

          <Field label="ที่อยู่สถานที่">
            <input type="text" value={form.ceremony_hall} onChange={set("ceremony_hall")} className={inputCls} />
          </Field>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gold-400 bg-cream-50 border border-gold-200 rounded-xl px-3 py-2.5">
          <span>💡</span>
          <span>การแก้ไขต้องเชื่อมต่อ Supabase ก่อน — ข้อมูลนี้แสดงตัวอย่างเท่านั้น</span>
        </div>

        <button
          onClick={handleSave}
          className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saved ? "บันทึกแล้ว ✓" : "บันทึกการตั้งค่า"}
        </button>

        <div className="h-2" />
      </main>
    </div>
  );
}

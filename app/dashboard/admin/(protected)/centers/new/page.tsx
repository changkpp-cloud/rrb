"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Check, Loader2, MapPin, Phone, User } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

interface FormState {
  name: string;
  center_code: string;
  province: string;
  amphoe: string;
  tambon: string;
  municipality: string;
  manager_name: string;
  phone: string;
}

const INITIAL: FormState = {
  name: "",
  center_code: "",
  province: "",
  amphoe: "",
  tambon: "",
  municipality: "",
  manager_name: "",
  phone: "",
};

export default function NewCenterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อศูนย์"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/admin/centers"), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/admin/centers"
          className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-gold-800">เปิดศูนย์ใหม่</h2>
          <p className="text-[11px] text-gold-500">สร้างโดย Super Admin เท่านั้น</p>
        </div>
      </div>

      {/* Success state */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">สร้างศูนย์สำเร็จ</p>
            <p className="text-[11px] text-emerald-600">กำลังกลับไปหน้ารายการศูนย์...</p>
          </div>
        </div>
      )}

      {/* ── กลุ่ม 1: ข้อมูลหลัก ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">ข้อมูลหลัก</p>
        </div>

        <FieldRow label="ชื่อศูนย์ *" hint="เช่น ศูนย์บริหารหรีดร่วมบุญประจำตำบลนิคมทุ่งโพธิ์ทะเล">
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="ชื่อศูนย์บริหาร"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
          />
        </FieldRow>

        <FieldRow label="รหัสศูนย์" hint="เช่น CTR-KPP-001 (ไม่บังคับ)">
          <input
            type="text"
            value={form.center_code}
            onChange={set("center_code")}
            placeholder="CTR-XXX-001"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono"
          />
        </FieldRow>
      </div>

      {/* ── กลุ่ม 2: ที่ตั้ง ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">พื้นที่รับผิดชอบ</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="จังหวัด">
            <input
              type="text"
              value={form.province}
              onChange={set("province")}
              placeholder="กำแพงเพชร"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
            />
          </FieldRow>
          <FieldRow label="อำเภอ">
            <input
              type="text"
              value={form.amphoe}
              onChange={set("amphoe")}
              placeholder="เมือง"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
            />
          </FieldRow>
        </div>

        <FieldRow label="ตำบล">
          <input
            type="text"
            value={form.tambon}
            onChange={set("tambon")}
            placeholder="นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
          />
        </FieldRow>

        <FieldRow label="เทศบาล / อบต." hint="ชื่อหน่วยงานท้องถิ่น">
          <input
            type="text"
            value={form.municipality}
            onChange={set("municipality")}
            placeholder="อบต.นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
          />
        </FieldRow>
      </div>

      {/* ── กลุ่ม 3: ผู้รับผิดชอบ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">ผู้จัดการศูนย์ (Center Manager)</p>
        </div>

        <FieldRow label="ชื่อผู้รับผิดชอบ">
          <input
            type="text"
            value={form.manager_name}
            onChange={set("manager_name")}
            placeholder="ชื่อ-นามสกุล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
          />
        </FieldRow>

        <FieldRow label="เบอร์โทร / PromptPay" hint="ใช้สร้าง QR รับเงินอัตโนมัติในทุกงานของศูนย์">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gold-400 shrink-0" />
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={set("phone")}
              placeholder="0812345678"
              className="flex-1 px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono"
            />
          </div>
          <p className="text-[10px] text-gold-400 mt-1 pl-6">
            QR PromptPay จะถูกสร้างจากเบอร์นี้โดยอัตโนมัติในหน้าชำระเงินทุกงาน
          </p>
        </FieldRow>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || success}
        className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างศูนย์...</>
          : success
          ? <><Check className="w-4 h-4" /> สร้างสำเร็จแล้ว</>
          : <><Building2 className="w-4 h-4" /> เปิดศูนย์ใหม่</>
        }
      </button>

      <p className="text-center text-[10px] text-gold-400 leading-relaxed">
        ศูนย์ที่สร้างจะมีสถานะ "เปิดใช้งาน" ทันที<br />
        สามารถแก้ไขหรือปิดศูนย์ได้ในหน้ารายละเอียดภายหลัง
      </p>

      <div className="h-2" />
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gold-700">{label}</p>
      {children}
      {hint && <p className="text-[10px] text-gold-400">{hint}</p>}
    </div>
  );
}

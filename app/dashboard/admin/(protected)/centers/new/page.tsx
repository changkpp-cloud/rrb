"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, Hash, Info, Loader2, MapPin, Phone, User } from "lucide-react";

const LGO_TYPES: Record<string, string> = {
  "01": "ท้องถิ่นรูปแบบพิเศษ (กทม./พัทยา)",
  "02": "อบจ.",
  "03": "เทศบาลนคร",
  "04": "เทศบาลเมือง",
  "05": "เทศบาลตำบล",
  "06": "อบต.",
};

function parseLgoCode(code: string) {
  const d = code.replace(/\D/g, "");
  if (d.length !== 8) return null;
  return {
    type: LGO_TYPES[d.slice(0, 2)] ?? `ประเภท ${d.slice(0, 2)}`,
    province: d.slice(2, 4),
    district: d.slice(4, 6),
    seq: d.slice(6, 8),
    centerCode: `RRB-${d}`,
  };
}

interface FormState {
  name: string;
  official_lgo_code: string;
  province: string;
  amphoe: string;
  tambon: string;
  municipality: string;
  manager_name: string;
  phone: string;
}

const INITIAL: FormState = {
  name: "", official_lgo_code: "",
  province: "", amphoe: "", tambon: "", municipality: "",
  manager_name: "", phone: "",
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

  const parsed = parseLgoCode(form.official_lgo_code);

  async function handleSubmit() {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อศูนย์"); return; }
    setLoading(true); setError("");
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
        <div>
          <h2 className="text-base font-bold text-gold-800">เปิดศูนย์ใหม่</h2>
          <p className="text-[11px] text-gold-500">สร้างโดย Super Admin เท่านั้น</p>
        </div>
      </div>

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

      {/* ── กลุ่ม 1: รหัส อปท. ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">รหัส อปท. (มาตรฐานกระทรวงมหาดไทย)</p>
        </div>

        <FieldRow
          label="รหัส อปท. 8 หลัก"
          hint="รูปแบบ TT PP DD LL เช่น 05810109 = เทศบาลตำบล / จ.กระบี่ / อ.เมือง / ลำดับ 09"
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={form.official_lgo_code}
            onChange={set("official_lgo_code")}
            placeholder="05810109"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono tracking-widest"
          />
        </FieldRow>

        {/* Preview */}
        {parsed ? (
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-semibold text-gold-700">ตรวจสอบรหัส อปท.</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <p className="text-[10px] text-gold-600">ประเภท: <span className="font-medium">{parsed.type}</span></p>
              <p className="text-[10px] text-gold-600">จังหวัด: <span className="font-medium">รหัส {parsed.province}</span></p>
              <p className="text-[10px] text-gold-600">อำเภอ: <span className="font-medium">รหัส {parsed.district}</span></p>
              <p className="text-[10px] text-gold-600">ลำดับ: <span className="font-medium">{parsed.seq}</span></p>
            </div>
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gold-200">
              <p className="text-[10px] text-gold-500">รหัสศูนย์ที่จะได้:</p>
              <span className="text-xs font-bold text-gold-800 font-mono tracking-wider">{parsed.centerCode}</span>
            </div>
          </div>
        ) : form.official_lgo_code.length > 0 ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">รหัส อปท. ต้องเป็นตัวเลข 8 หลัก</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-600">
              ถ้าไม่มีรหัส อปท. ปล่อยว่างได้ — ระบบจะกำหนด <span className="font-mono font-semibold">RRB-CEN-NNNNNN</span> ให้อัตโนมัติ
            </p>
          </div>
        )}
      </div>

      {/* ── กลุ่ม 2: ข้อมูลหลัก ── */}
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
      </div>

      {/* ── กลุ่ม 3: ที่ตั้ง ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">พื้นที่รับผิดชอบ</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="จังหวัด">
            <input type="text" value={form.province} onChange={set("province")}
              placeholder="กำแพงเพชร"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
          </FieldRow>
          <FieldRow label="อำเภอ">
            <input type="text" value={form.amphoe} onChange={set("amphoe")}
              placeholder="เมือง"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
          </FieldRow>
        </div>
        <FieldRow label="ตำบล">
          <input type="text" value={form.tambon} onChange={set("tambon")}
            placeholder="นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
        <FieldRow label="เทศบาล / อบต." hint="ชื่อหน่วยงานท้องถิ่น">
          <input type="text" value={form.municipality} onChange={set("municipality")}
            placeholder="อบต.นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
      </div>

      {/* ── กลุ่ม 4: ผู้รับผิดชอบ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">ผู้จัดการศูนย์</p>
        </div>
        <FieldRow label="ชื่อผู้รับผิดชอบ">
          <input type="text" value={form.manager_name} onChange={set("manager_name")}
            placeholder="ชื่อ-นามสกุล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
        <FieldRow label="เบอร์โทร / PromptPay" hint="ใช้สร้าง QR รับเงินอัตโนมัติในทุกงานของศูนย์">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gold-400 shrink-0" />
            <input type="tel" inputMode="numeric" value={form.phone} onChange={set("phone")}
              placeholder="0812345678"
              className="flex-1 px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono" />
          </div>
        </FieldRow>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading || success}
        className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างศูนย์...</>
          : success ? <><Check className="w-4 h-4" /> สร้างสำเร็จแล้ว</>
          : <><Building2 className="w-4 h-4" /> เปิดศูนย์ใหม่</>}
      </button>

      <p className="text-center text-[10px] text-gold-400 leading-relaxed">
        รหัสศูนย์จะถูกกำหนดอัตโนมัติจากรหัส อปท.<br />
        login เข้าศูนย์ใช้บัญชีผู้ใช้รายคน ไม่ใช้รหัสศูนย์เป็นรหัสผ่าน
      </p>
      <div className="h-2" />
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gold-700">{label}</p>
      {children}
      {hint && <p className="text-[10px] text-gold-400">{hint}</p>}
    </div>
  );
}

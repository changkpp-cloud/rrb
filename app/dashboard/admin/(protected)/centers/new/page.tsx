"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Check, CheckCircle2, Copy,
  Hash, Info, KeyRound, Loader2, MapPin, Phone, User,
} from "lucide-react";

const LGO_TYPES: Record<string, string> = {
  "01": "ท้องถิ่นรูปแบบพิเศษ (กทม./พัทยา)",
  "02": "อบจ.",
  "03": "เทศบาลนคร",
  "04": "เทศบาลเมือง",
  "05": "เทศบาลตำบล",
  "06": "อบต.",
};

function parseCenterCode(code: string) {
  const d = code.replace(/\D/g, "");
  if (d.length !== 8) return null;
  return {
    type: LGO_TYPES[d.slice(0, 2)] ?? `ประเภท ${d.slice(0, 2)}`,
    province: d.slice(2, 4),
    district: d.slice(4, 6),
    seq: d.slice(6, 8),
  };
}

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

interface SuccessData {
  centerName: string;
  centerCode: string;
  accessCode: string;
}

const INITIAL: FormState = {
  name: "", center_code: "",
  province: "", amphoe: "", tambon: "", municipality: "",
  manager_name: "", phone: "",
};

export default function NewCenterPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  const parsed = parseCenterCode(form.center_code);

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
      setSuccessData({
        centerName: data.center.name,
        centerCode: data.center.center_code,
        accessCode: data.center.access_code,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setLoading(false);
  }

  async function copyCredentials(sd: SuccessData) {
    const text = [
      `ศูนย์: ${sd.centerName}`,
      `รหัสเข้าระบบ: ${sd.accessCode}`,
      `URL เข้าระบบ: https://ruamboon.online/dashboard/center`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success screen ──
  if (successData) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">เปิดศูนย์สำเร็จแล้ว</p>
              <p className="text-[11px] text-emerald-600">{successData.centerName}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-emerald-200 px-4 py-3 space-y-3">
            <p className="text-xs font-bold text-gold-700">ส่งข้อมูลนี้ให้เจ้าหน้าที่ศูนย์</p>
            <InfoRow label="URL เข้าระบบ" value="ruamboon.online/dashboard/center" mono />
            <InfoRow label="รหัสประจำศูนย์" value={successData.centerCode} mono />
            <div>
              <p className="text-[10px] text-gold-500 mb-1.5">รหัสเข้าระบบ (ใช้ login ที่หน้าศูนย์)</p>
              <div className="flex items-center justify-between bg-gold-50 border border-gold-200 rounded-xl px-4 py-3">
                <span className="text-2xl font-bold text-gold-800 font-mono tracking-[0.15em]">
                  {successData.accessCode}
                </span>
                <KeyRound className="w-5 h-5 text-gold-400 shrink-0" />
              </div>
              <p className="text-[10px] text-gold-400 mt-1.5">เปลี่ยนได้ภายหลังที่หน้ารายละเอียดศูนย์</p>
            </div>
          </div>

          <button
            onClick={() => copyCredentials(successData)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-300 bg-white text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "คัดลอกแล้ว" : "คัดลอกข้อมูลทั้งหมด"}
          </button>
        </div>

        <Link
          href="/dashboard/admin/centers"
          className="block text-center w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-sm shadow-md"
        >
          ไปหน้ารายการศูนย์
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gold-800">เปิดศูนย์ใหม่</h2>
        <p className="text-[11px] text-gold-500">สร้างโดย Super Admin เท่านั้น</p>
      </div>

      {/* ── กลุ่ม 1: รหัสศูนย์ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">รหัสศูนย์</p>
        </div>
        <FieldRow
          label="รหัสศูนย์ (รหัส อปท. 8 หลัก)"
          hint="เช่น 05620601 — รหัสประจำศูนย์สำหรับรายงาน (รหัส login จะสร้างแยกต่างหากอัตโนมัติ)"
        >
          <input
            type="text" inputMode="numeric" maxLength={8}
            value={form.center_code} onChange={set("center_code")}
            placeholder="05620601"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm font-mono tracking-widest"
          />
        </FieldRow>
        {parsed ? (
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-3 py-2.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <p className="text-[10px] text-gold-600">ประเภท: <span className="font-medium">{parsed.type}</span></p>
              <p className="text-[10px] text-gold-600">รหัสจังหวัด: <span className="font-medium">{parsed.province}</span></p>
              <p className="text-[10px] text-gold-600">รหัสอำเภอ: <span className="font-medium">{parsed.district}</span></p>
              <p className="text-[10px] text-gold-600">ลำดับ: <span className="font-medium">{parsed.seq}</span></p>
            </div>
          </div>
        ) : form.center_code.length > 0 ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">รหัสศูนย์ต้องเป็นตัวเลข 8 หลัก</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-600">
              ถ้าไม่มีรหัส อปท. ปล่อยว่างได้ — ระบบกำหนด <span className="font-mono font-semibold">CEN-NNNNNN</span> ให้
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
        <FieldRow label="ชื่อศูนย์ *" hint="เช่น ศูนย์บริหารหรีดร่วมบุญ อบต.นิคมทุ่งโพธิ์ทะเล">
          <input type="text" value={form.name} onChange={set("name")}
            placeholder="ชื่อศูนย์บริหาร"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
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
            <input type="text" value={form.province} onChange={set("province")} placeholder="กำแพงเพชร"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
          </FieldRow>
          <FieldRow label="อำเภอ">
            <input type="text" value={form.amphoe} onChange={set("amphoe")} placeholder="เมือง"
              className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
          </FieldRow>
        </div>
        <FieldRow label="ตำบล">
          <input type="text" value={form.tambon} onChange={set("tambon")} placeholder="นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
        <FieldRow label="เทศบาล / อบต." hint="ชื่อหน่วยงานท้องถิ่น">
          <input type="text" value={form.municipality} onChange={set("municipality")} placeholder="อบต.นิคมทุ่งโพธิ์ทะเล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
      </div>

      {/* ── กลุ่ม 4: ผู้จัดการ ── */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-gold-500" />
          <p className="text-xs font-semibold text-gold-700">ผู้จัดการศูนย์</p>
        </div>
        <FieldRow label="ชื่อผู้รับผิดชอบ">
          <input type="text" value={form.manager_name} onChange={set("manager_name")} placeholder="ชื่อ-นามสกุล"
            className="w-full px-4 py-2.5 rounded-xl gold-border bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm" />
        </FieldRow>
        <FieldRow label="เบอร์โทร / PromptPay" hint="ใช้สร้าง QR รับเงินอัตโนมัติในทุกงานของศูนย์">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-border bg-white">
            <Phone className="w-4 h-4 text-gold-400 shrink-0" />
            <input type="tel" inputMode="numeric" value={form.phone} onChange={set("phone")} placeholder="0812345678"
              className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm font-mono" />
          </div>
        </FieldRow>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading}
        className="w-full gold-gradient text-white font-semibold py-4 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างศูนย์...</>
          : <><Building2 className="w-4 h-4" /> เปิดศูนย์ใหม่</>}
      </button>
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-gold-500 shrink-0">{label}</span>
      <span className={`text-[11px] font-semibold text-gold-800 text-right break-all ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>
    </div>
  );
}

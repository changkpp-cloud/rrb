"use client";

import { useState } from "react";
import { CheckCircle2, Copy, KeyRound, Phone, ShieldCheck, User } from "lucide-react";
import { roleLabel } from "@/lib/iam-utils";
import type { AppRole } from "@/lib/iam-utils";

type Center = { id: string; name: string };

const ROLES: AppRole[] = ["center_manager", "lgo_observer"];

type FormState = {
  display_name: string;
  phone: string;
  password: string;
  center_id: string;
  role: AppRole;
};

type CreatedLogin = {
  centerName: string;
  displayName: string;
  password: string;
  phone: string;
  role: AppRole;
};

function empty(): FormState {
  return {
    display_name: "",
    phone: "",
    password: "",
    center_id: "",
    role: "center_manager",
  };
}

function recipientLabel(role: AppRole) {
  return role === "lgo_observer" ? "ตัวแทน อปท. ประจำศูนย์" : "แอดมินศูนย์";
}

function generateLoginCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `RRB-${part(4)}-${part(4)}`;
}

export default function CreateCenterUserForm({ centers }: { centers: Center[] }) {
  const [form, setForm] = useState<FormState>(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLogin, setCreatedLogin] = useState<CreatedLogin | null>(null);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
      setSuccess("");
      setCreatedLogin(null);
    };
  }

  function fillGeneratedPassword() {
    setForm((f) => ({ ...f, password: generateLoginCode() }));
    setError("");
    setSuccess("");
    setCreatedLogin(null);
  }

  async function copyLogin() {
    if (!createdLogin) return;
    const text = [
      "ข้อมูลเข้าใช้งานระบบหรีดร่วมบุญ",
      `ศูนย์: ${createdLogin.centerName}`,
      `ชื่อผู้ใช้: ${createdLogin.displayName}`,
      `สิทธิ์: ${roleLabel(createdLogin.role)}`,
      `เข้าใช้งาน: /dashboard/center`,
      `เบอร์มือถือ: ${createdLogin.phone}`,
      `รหัสผ่าน: ${createdLogin.password}`,
      "เลือกแท็บ “บัญชีผู้ใช้” แล้วกรอกเบอร์มือถือพร้อมรหัสผ่านนี้",
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(text);
    setSuccess(`คัดลอกข้อมูลล็อกอินสำหรับส่งให้${recipientLabel(createdLogin.role)}แล้ว`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.center_id) { setError("กรุณาเลือกศูนย์"); return; }
    if (!form.display_name.trim()) { setError("กรุณากรอกชื่อผู้ใช้"); return; }
    if (!form.phone.trim()) { setError("กรุณากรอกเบอร์มือถือ"); return; }
    if (form.password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }

    setLoading(true);
    setError("");
    try {
      const selectedCenter = centers.find((c) => c.id === form.center_id);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setCreatedLogin({
        centerName: selectedCenter?.name ?? form.center_id,
        displayName: form.display_name.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
      });
      setSuccess(`สร้างผู้ใช้ ${form.display_name} สำเร็จ`);
      setForm(empty());
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-cream-50 gold-border card-shadow px-4 py-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-gold-800">สร้างรหัสเข้าศูนย์</p>
        <p className="text-[11px] text-gold-500">เลือกศูนย์ เลือกสิทธิ์ แล้วสร้างรหัสสำหรับส่งให้แอดมินศูนย์หรือตัวแทน อปท. ประจำศูนย์</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {createdLogin && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-bold text-emerald-800">ข้อมูลสำหรับส่งให้{recipientLabel(createdLogin.role)}</p>
            <p className="text-[10px] text-emerald-700">บัญชีนี้ถูกผูกกับศูนย์ที่เลือกแล้ว: {roleLabel(createdLogin.role)}</p>
          </div>
          <div className="rounded-xl bg-white/80 px-3 py-2 text-[11px] text-gold-700 space-y-1">
            <p><span className="font-semibold">ศูนย์:</span> {createdLogin.centerName}</p>
            <p><span className="font-semibold">สิทธิ์:</span> {roleLabel(createdLogin.role)}</p>
            <p><span className="font-semibold">เบอร์มือถือ:</span> {createdLogin.phone}</p>
            <p><span className="font-semibold">รหัสผ่าน:</span> <span className="font-mono tracking-wide">{createdLogin.password}</span></p>
          </div>
          <button
            type="button"
            onClick={copyLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white active:scale-[0.98] transition-transform"
          >
            <Copy className="w-3.5 h-3.5" />
            คัดลอกข้อความส่งให้{recipientLabel(createdLogin.role)}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Center */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">ศูนย์ *</span>
          <select
            value={form.center_id}
            onChange={set("center_id")}
            className="w-full rounded-xl gold-border bg-white px-3 py-2.5 text-xs text-gold-800 focus:outline-none"
            required
          >
            <option value="">— เลือกศูนย์ —</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        {/* Display name */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">ชื่อ-นามสกุล *</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <User className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <input
              type="text"
              value={form.display_name}
              onChange={set("display_name")}
              placeholder="ชื่อผู้ใช้งาน"
              className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
              required
            />
          </div>
        </label>

        {/* Phone */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">เบอร์มือถือ *</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <Phone className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="0812345678"
              className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
              required
            />
          </div>
        </label>

        {/* Password */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">รหัสผ่าน * (อย่างน้อย 8 ตัว)</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <KeyRound className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              autoComplete="new-password"
              className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={fillGeneratedPassword}
              className="shrink-0 rounded-lg bg-gold-50 px-2 py-1 text-[10px] font-semibold text-gold-700 active:scale-[0.98] transition-transform"
            >
              สร้างรหัส
            </button>
          </div>
          {form.password && (
            <p className="text-[10px] text-gold-500">
              รหัสนี้จะใช้เข้าแท็บบัญชีผู้ใช้ของศูนย์ และจะแสดงให้คัดลอกหลังสร้างบัญชีสำเร็จ
            </p>
          )}
        </label>

        {/* Role */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">สิทธิ์ *</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <select
              value={form.role}
              onChange={set("role")}
              className="flex-1 bg-transparent text-xs text-gold-800 focus:outline-none appearance-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
          {form.role === "center_manager" && (
            <p className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-[10px] leading-relaxed text-amber-700">
              สิทธิ์แอดมินศูนย์: เปิดงานใหม่ แก้ไขงาน ตรวจรายการ พิมพ์/จัดการป้าย ยืนยันข้อมูล และปิดงานของศูนย์นี้ได้
            </p>
          )}
          {form.role === "lgo_observer" && (
            <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-[10px] leading-relaxed text-emerald-700">
              สิทธิ์ตัวแทน อปท. ประจำศูนย์: เข้าดูหน้าศูนย์ รายงาน และรายละเอียดงานได้ แต่แก้ไข เปิดงาน ยืนยันสลิป พิมพ์ป้าย ปิดงาน หรือเปลี่ยนข้อมูลใด ๆ ไม่ได้
            </p>
          )}
        </label>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full gold-gradient rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              กำลังสร้าง...
            </>
          ) : (
            "สร้างรหัสและให้สิทธิ์"
          )}
        </button>
      </form>
    </section>
  );
}

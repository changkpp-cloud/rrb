"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { roleLabel } from "@/lib/iam-utils";
import type { AppRole } from "@/lib/iam-utils";

type Center = { id: string; name: string };

const ROLES: AppRole[] = ["center_manager", "center_staff", "center_viewer"];

type FormState = {
  display_name: string;
  email: string;
  phone: string;
  password: string;
  center_id: string;
  role: AppRole;
};

function empty(): FormState {
  return {
    display_name: "",
    email: "",
    phone: "",
    password: "",
    center_id: "",
    role: "center_staff",
  };
}

export default function CreateCenterUserForm({ centers }: { centers: Center[] }) {
  const [form, setForm] = useState<FormState>(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
      setSuccess("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.center_id) { setError("กรุณาเลือกศูนย์"); return; }
    if (!form.display_name.trim()) { setError("กรุณากรอกชื่อผู้ใช้"); return; }
    if (!form.email.trim()) { setError("กรุณากรอกอีเมล"); return; }
    if (form.password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
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
        <p className="text-sm font-bold text-gold-800">เพิ่มผู้ใช้ศูนย์โดยแอดมินกลาง</p>
        <p className="text-[11px] text-gold-500">สร้างบัญชีให้เจ้าหน้าที่โดยตรง ไม่ต้องรอสมัครเอง</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">{success}</p>
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

        {/* Email */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">อีเมล *</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <Mail className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="email@example.com"
              autoComplete="off"
              className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
              required
            />
          </div>
        </label>

        {/* Phone */}
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-gold-600">เบอร์โทร</span>
          <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
            <Phone className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="0812345678 (ไม่บังคับ)"
              className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
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
          </div>
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
            "สร้างผู้ใช้และให้สิทธิ์"
          )}
        </button>
      </form>
    </section>
  );
}

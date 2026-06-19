"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next.length < 8) { setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (next !== confirm) { setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/center/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-gold-800">เปลี่ยนรหัสผ่าน</p>
        <p className="text-[11px] text-gold-500">เปลี่ยนรหัสผ่านของบัญชีตัวเอง สิทธิ์การเข้าถึงยังคงเดิม</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">เปลี่ยนรหัสผ่านสำเร็จแล้ว</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <PasswordField
          label="รหัสผ่านปัจจุบัน *"
          value={current}
          onChange={setCurrent}
          placeholder="รหัสผ่านที่ใช้อยู่ตอนนี้"
          autoComplete="current-password"
        />
        <PasswordField
          label="รหัสผ่านใหม่ * (อย่างน้อย 8 ตัว)"
          value={next}
          onChange={setNext}
          placeholder="รหัสผ่านใหม่"
          autoComplete="new-password"
        />
        <PasswordField
          label="ยืนยันรหัสผ่านใหม่ *"
          value={confirm}
          onChange={setConfirm}
          placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
          autoComplete="new-password"
        />

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 text-center">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !current || !next || !confirm}
          className="w-full gold-gradient rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              กำลังเปลี่ยน...
            </>
          ) : (
            "ยืนยันเปลี่ยนรหัสผ่าน"
          )}
        </button>
      </form>
    </div>
  );
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (v: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold text-gold-600">{label}</span>
      <div className="flex items-center gap-2 rounded-xl gold-border bg-white px-3 py-2.5">
        <KeyRound className="w-3.5 h-3.5 text-gold-400 shrink-0" />
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-xs text-gold-800 placeholder-gold-300 focus:outline-none"
        />
      </div>
    </label>
  );
}

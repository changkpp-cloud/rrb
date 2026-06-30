"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, KeyRound, Phone, User } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";

type Center = { id: string; name: string; province: string | null };

interface Props {
  centers: Center[];
}

type FormState = {
  centerId: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

const empty = (): FormState => ({
  centerId: "",
  displayName: "",
  password: "",
  confirmPassword: "",
  phone: "",
});

export default function CenterRegisterClient({ centers }: Props) {
  const [form, setForm] = useState<FormState>(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate(): string {
    if (!form.centerId) return "กรุณาเลือกศูนย์/อปท.";
    if (!form.displayName.trim()) return "กรุณากรอกชื่อ-นามสกุล";
    if (!form.phone.trim()) return "กรุณากรอกเบอร์มือถือ";
    if (form.password.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (form.password !== form.confirmPassword) return "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน";
    return "";
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/center/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          center_id: form.centerId,
          display_name: form.displayName.trim(),
          password: form.password,
          phone: form.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/center"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <IosPageHeader
        title="สมัครใช้งานศูนย์"
        subtitle="Center Registration"
        backHref="/dashboard/center"
      />

      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm space-y-5">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gold-100 border-2 border-gold-300 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-gold-600" />
            </div>
            <h2 className="text-xl font-bold text-gold-800">สมัครใช้งาน</h2>
            <p className="text-xs text-gold-500 leading-relaxed">
              กรอกข้อมูลเพื่อขอสิทธิ์เข้าใช้ระบบ<br />
              ผู้ดูแลระบบจะอนุมัติภายใน 1–2 วันทำการ
            </p>
          </div>

          {success ? (
            /* ── Success state ── */
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-base font-bold text-gold-800">ส่งคำขอสำเร็จ</p>
              <p className="text-xs text-gold-500 leading-relaxed">
                คำขอสมัครของคุณถูกบันทึกแล้ว<br />
                รอผู้ดูแลระบบอนุมัติก่อนเข้าใช้งาน
              </p>
              <p className="text-[11px] text-gold-400">กำลังพาคุณไปหน้าล็อกอิน...</p>
            </div>
          ) : (
            /* ── Registration form ── */
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-5 space-y-4">

              {/* Center selector */}
              <Field label="ศูนย์/อปท. *" icon={<Building2 className="w-4 h-4 text-gold-400 shrink-0" />}>
                <select
                  value={form.centerId}
                  onChange={set("centerId")}
                  className="flex-1 bg-transparent text-gold-800 focus:outline-none text-sm appearance-none"
                >
                  <option value="">-- เลือกศูนย์/อปท. --</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.province ? ` (${c.province})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Display name */}
              <Field label="ชื่อ-นามสกุล *" icon={<User className="w-4 h-4 text-gold-400 shrink-0" />}>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={set("displayName")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="ชื่อ-นามสกุลจริง"
                  autoComplete="name"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                />
              </Field>

              {/* Phone */}
              <Field label="เบอร์มือถือ *" icon={<Phone className="w-4 h-4 text-gold-400 shrink-0" />}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="0812345678"
                  autoComplete="tel"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                />
              </Field>

              {/* Password */}
              <Field label="รหัสผ่าน * (อย่างน้อย 8 ตัว)" icon={<KeyRound className="w-4 h-4 text-gold-400 shrink-0" />}>
                <input
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                />
              </Field>

              {/* Confirm password */}
              <Field label="ยืนยันรหัสผ่าน *" icon={<KeyRound className="w-4 h-4 text-gold-400 shrink-0" />}>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="flex-1 bg-transparent text-gold-800 placeholder-gold-300 focus:outline-none text-sm"
                />
              </Field>

              {error && (
                <p className="text-xs text-red-500 text-center bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    กำลังส่งคำขอ...
                  </>
                ) : (
                  "ส่งคำขอสมัคร"
                )}
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-gold-400 leading-relaxed">
            มีบัญชีแล้ว?{" "}
            <a href="/dashboard/center" className="text-gold-600 underline underline-offset-2 font-semibold">
              เข้าสู่ระบบ
            </a>
          </p>

        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gold-700">{label}</span>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl gold-border bg-white">
        {icon}
        {children}
      </div>
    </label>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";

type EditableCenter = {
  id: string;
  name: string;
  center_code?: string | null;
  official_lgo_code?: string | null;
  access_code?: string | null;
  province?: string | null;
  amphoe?: string | null;
  tambon?: string | null;
  municipality?: string | null;
  manager_name?: string | null;
  phone?: string | null;
};

const inputClass =
  "w-full rounded-xl gold-border bg-white px-3 py-2.5 text-sm text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400";

export default function CenterSettingsForm({ center }: { center: EditableCenter }) {
  const [form, setForm] = useState({
    name: center.name ?? "",
    center_code: center.center_code ?? "",
    official_lgo_code: center.official_lgo_code ?? "",
    access_code: center.access_code ?? "",
    province: center.province ?? "",
    amphoe: center.amphoe ?? "",
    tambon: center.tambon ?? "",
    municipality: center.municipality ?? "",
    manager_name: center.manager_name ?? "",
    phone: center.phone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set(key: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };
  }

  async function save() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/centers/${center.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกข้อมูลศูนย์ไม่สำเร็จ");
      setMessage("บันทึกข้อมูลศูนย์เรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อมูลศูนย์ไม่สำเร็จ");
    }

    setLoading(false);
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <Field label="ชื่อศูนย์">
          <input className={inputClass} value={form.name} onChange={set("name")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="รหัสศูนย์">
            <input className={`${inputClass} font-mono`} value={form.center_code} onChange={set("center_code")} />
          </Field>
          <Field label="รหัสเข้าใช้งาน">
            <input className={`${inputClass} font-mono`} value={form.access_code} onChange={set("access_code")} />
          </Field>
        </div>

        <Field label="รหัส อปท.">
          <input inputMode="numeric" maxLength={8} className={`${inputClass} font-mono`} value={form.official_lgo_code} onChange={set("official_lgo_code")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="จังหวัด">
            <input className={inputClass} value={form.province} onChange={set("province")} />
          </Field>
          <Field label="อำเภอ">
            <input className={inputClass} value={form.amphoe} onChange={set("amphoe")} />
          </Field>
        </div>

        <Field label="ตำบล">
          <input className={inputClass} value={form.tambon} onChange={set("tambon")} />
        </Field>

        <Field label="เทศบาล / อบต.">
          <input className={inputClass} value={form.municipality} onChange={set("municipality")} />
        </Field>

        <Field label="ผู้จัดการศูนย์">
          <input className={inputClass} value={form.manager_name} onChange={set("manager_name")} />
        </Field>

        <Field label="โทรศัพท์ / PromptPay">
          <input inputMode="tel" className={inputClass} value={form.phone} onChange={set("phone")} />
        </Field>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={loading || !form.name.trim()}
        className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {loading ? "กำลังบันทึก..." : "บันทึกข้อมูลศูนย์"}
      </button>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gold-700">{label}</span>
      {children}
    </label>
  );
}

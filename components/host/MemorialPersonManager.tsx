"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import type { MemorialPerson } from "@/components/ai-photo/HostPersonPicker";

interface Props {
  memorialId: string;
}

const ROLE_OPTIONS = [
  "เจ้าภาพหลัก", "ผู้รับมอบ", "ลูกของผู้วายชนม์",
  "สามีของผู้วายชนม์", "ภรรยาของผู้วายชนม์",
  "พ่อของผู้วายชนม์", "แม่ของผู้วายชนม์",
  "ญาติใกล้ชิด", "ผู้แทนครอบครัว",
];

const RELATIONSHIP_OPTIONS = [
  "สามี", "ภรรยา", "ลูกชาย", "ลูกสาว", "พ่อ", "แม่",
  "พี่ชาย", "พี่สาว", "น้องชาย", "น้องสาว",
  "ญาติ", "เพื่อน", "ผู้แทนครอบครัว",
];

type FormData = {
  display_name: string;
  relationship: string;
  role_in_photo: string;
  allow_in_sim: boolean;
  is_primary: boolean;
  photo: File | null;
  photoPreview: string | null;
};

const emptyForm = (): FormData => ({
  display_name: "", relationship: "", role_in_photo: "ผู้รับมอบ",
  allow_in_sim: true, is_primary: false, photo: null, photoPreview: null,
});

export default function MemorialPersonManager({ memorialId }: Props) {
  const [persons, setPersons] = useState<MemorialPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPersons() {
    setLoading(true);
    const res = await fetch(`/api/memorials/${memorialId}/persons?all=1`);
    const d = await res.json();
    setPersons(d.persons ?? []);
    setLoading(false);
  }

  useEffect(() => { loadPersons(); }, [memorialId]);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(p: MemorialPerson) {
    setEditId(p.id);
    setForm({
      display_name: p.display_name,
      relationship: p.relationship,
      role_in_photo: p.role_in_photo,
      allow_in_sim: p.allow_in_sim ?? true,
      is_primary: p.is_primary,
      photo: null,
      photoPreview: p.photo_url,
    });
    setError("");
    setShowForm(true);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // ย่อรูปก่อนเก็บ — โหลดเร็ว + ส่งเข้า AI ง่ายขึ้น
    let img = file;
    try { img = await compressImage(file); } catch { /* ใช้ไฟล์เดิม (เช่น HEIC ที่ decode ไม่ได้) */ }
    const preview = URL.createObjectURL(img);
    setForm(f => ({ ...f, photo: img, photoPreview: preview }));
  }

  async function handleSave() {
    if (!form.display_name.trim() || !form.relationship.trim()) {
      setError("กรุณากรอกชื่อและความสัมพันธ์");
      return;
    }
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("display_name", form.display_name.trim());
      fd.append("relationship", form.relationship.trim());
      fd.append("role_in_photo", form.role_in_photo);
      fd.append("allow_in_sim", String(form.allow_in_sim));
      fd.append("is_primary", String(form.is_primary));
      if (form.photo) fd.append("photo", form.photo);

      let res: Response;
      if (editId) {
        res = await fetch(`/api/memorials/${memorialId}/persons/${editId}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/memorials/${memorialId}/persons`, { method: "POST", body: fd });
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "บันทึกไม่สำเร็จ");
      }
      await loadPersons();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  }

  async function handleToggleAllow(p: MemorialPerson) {
    await fetch(`/api/memorials/${memorialId}/persons/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allow_in_sim: !p.allow_in_sim }),
    });
    await loadPersons();
  }

  async function handleDelete(p: MemorialPerson) {
    if (!confirm(`ลบ "${p.display_name}" ออกจากระบบ?`)) return;
    await fetch(`/api/memorials/${memorialId}/persons/${p.id}`, { method: "DELETE" });
    await loadPersons();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gold-800">จัดการบุคคลสำหรับภาพจำลอง</p>
          <p className="text-[11px] text-gold-500">ผู้ร่วมบุญสามารถเลือกให้บุคคลเหล่านี้ปรากฏในภาพ AI</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-white shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-gold-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">กำลังโหลด...</span>
        </div>
      ) : persons.length === 0 ? (
        <div className="bg-cream-50 gold-border rounded-2xl px-4 py-6 text-center space-y-2">
          <p className="text-xs text-gold-500">ยังไม่มีบุคคลที่เพิ่มไว้</p>
          <button type="button" onClick={openAdd}
            className="text-xs font-semibold text-gold-600 underline underline-offset-2">
            + เพิ่มบุคคลแรก
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {persons.map(p => (
            <div key={p.id}
              className="bg-cream-50 gold-border rounded-2xl px-3 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-300 shrink-0 bg-cream-100">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-500 text-sm font-bold">
                    {p.display_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gold-800 truncate">{p.display_name}</p>
                  {p.is_primary && <Star className="w-3 h-3 text-gold-500 fill-gold-500 shrink-0" />}
                </div>
                <p className="text-[10px] text-gold-500">{p.relationship} · {p.role_in_photo}</p>
                <button type="button" onClick={() => handleToggleAllow(p)}
                  className={`text-[10px] font-semibold mt-0.5 ${p.allow_in_sim ? "text-emerald-600" : "text-red-400"}`}>
                  {p.allow_in_sim ? "✓ อนุญาตใช้ภาพ" : "✕ ปิดการใช้ภาพ"}
                </button>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(p)}
                  className="w-7 h-7 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 active:scale-90 transition-all">
                  <Pencil className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => handleDelete(p)}
                  className="w-7 h-7 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 active:scale-90 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
          <div className="w-full max-w-sm bg-white rounded-3xl card-shadow space-y-4 px-5 py-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gold-800">{editId ? "แก้ไขบุคคล" : "เพิ่มบุคคลใหม่"}</p>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-full border border-gold-300 flex items-center justify-center text-gold-500 hover:bg-gold-50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo upload */}
            <input ref={fileRef} type="file" accept="image/*,image/heic" className="hidden" onChange={handlePhotoChange} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gold-300 rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-gold-50 active:scale-[0.98] transition-all">
              {form.photoPreview ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400">
                  <img src={form.photoPreview} className="w-full h-full object-cover" />
                </div>
              ) : (
                <Camera className="w-7 h-7 text-gold-300" />
              )}
              <p className="text-xs font-semibold text-gold-600">{form.photoPreview ? "เปลี่ยนรูป" : "แนบรูปภาพ"}</p>
            </button>

            <Field label="ชื่อ *">
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="ชื่อ-นามสกุล"
                className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 text-sm" />
            </Field>

            <Field label="ความสัมพันธ์กับผู้วายชนม์ *">
              <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 text-sm">
                <option value="">-- เลือก --</option>
                {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <Field label="บทบาทในภาพ">
              <select value={form.role_in_photo} onChange={e => setForm(f => ({ ...f, role_in_photo: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 text-sm">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allow_in_sim}
                  onChange={e => setForm(f => ({ ...f, allow_in_sim: e.target.checked }))}
                  className="w-4 h-4 accent-amber-600" />
                <span className="text-xs text-gold-700">อนุญาตให้ใช้ในภาพจำลอง</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_primary}
                  onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
                  className="w-4 h-4 accent-amber-600" />
                <span className="text-xs text-gold-700">เจ้าภาพหลัก</span>
              </label>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="button" onClick={handleSave} disabled={saving}
              className="w-full gold-gradient text-white font-semibold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gold-700">{label}</p>
      {children}
    </div>
  );
}

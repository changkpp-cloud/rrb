"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Save, Loader2, CheckCircle2, XCircle, Trash2, ImageIcon } from "lucide-react";

interface Props {
  currentImageUrl: string | null;
  currentCaption: string;
}

export default function BoardBannerAdmin({ currentImageUrl, currentCaption }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState(currentCaption);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function pick(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      form.append("caption", caption.trim());
      const res = await fetch("/api/admin/site-settings/board", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setSaved(true);
      setFile(null);
      setPreview(null);
      setTimeout(() => router.refresh(), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("ลบภาพแบนเนอร์ออกจากทุกหน้างาน?")) return;
    setRemoving(true); setError("");
    try {
      const form = new FormData();
      form.append("remove", "true");
      const res = await fetch("/api/admin/site-settings/board", { method: "POST", body: form });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      setTimeout(() => router.refresh(), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      setRemoving(false);
    }
  }

  const shown = preview ?? currentImageUrl;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gold-800">แบนเนอร์บอร์ดหน้างาน</h1>
        <p className="text-xs text-gold-500 mt-0.5 leading-relaxed">
          ภาพตัวอย่างบอร์ดหรีดร่วมบุญที่แสดงบนหน้าแรกของ <strong>ทุกงานศพ</strong> —
          ใช้เป็นแบนเนอร์ผู้สนับสนุนโครงการ (บริษัท/ห้างร้านด้านลดขยะ) เปลี่ยนได้ที่นี่ที่เดียว
        </p>
      </div>

      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-5 space-y-4">
        {/* preview */}
        <div className="rounded-xl border border-gold-200 bg-white overflow-hidden">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="ตัวอย่างบอร์ดหรีดร่วมบุญ" className="w-full object-contain max-h-72" />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gold-300">
              <ImageIcon className="w-10 h-10 mb-2" />
              <p className="text-xs">ยังไม่มีภาพแบนเนอร์</p>
            </div>
          )}
        </div>

        {/* file picker */}
        <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gold-300 bg-white px-4 py-3 cursor-pointer hover:bg-cream-100 transition-colors">
          <Upload className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-xs text-gold-600 truncate">{file ? file.name : "เลือกภาพใหม่ (รูปแนวนอน แนะนำ 1200×400)"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => pick(e.target.files?.[0] ?? null)} />
        </label>

        {/* caption */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">ข้อความใต้ภาพ (เช่น สนับสนุนโดย ...)</label>
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="เช่น สนับสนุนโครงการโดย บริษัท กรีนรีไซเคิล จำกัด"
            className="w-full px-3 py-2.5 rounded-xl border border-gold-200 bg-white text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 font-semibold">บันทึกแล้ว — แสดงบนทุกหน้างาน</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving || (!file && caption.trim() === currentCaption.trim())}
            className="flex-1 gold-gradient text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-50 shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "กำลังบันทึก..." : "บันทึกแบนเนอร์"}
          </button>
          {currentImageUrl && (
            <button
              onClick={remove}
              disabled={removing}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ลบ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera, CheckCircle2, ImageIcon, Loader2, Sparkles, XCircle,
} from "lucide-react";
import AiPhotoResult from "./AiPhotoResult";
import AiPhotoTemplateSelector from "./AiPhotoTemplateSelector";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

interface Props {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
  deceasedName?: string;
  funeralPlace?: string;
  donationId?: string;   // pass to enable 1-free-per-donation credit system
  memorialId?: string;
}

type CreditState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "can_generate" }
  | { status: "used"; existingImageUrl: string | null };

export default function AiPhotoSection({
  donorName,
  donorPosition,
  condolenceText,
  deceasedName,
  funeralPlace,
  donationId,
  memorialId,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState<AiPhotoTemplateKey>("standing_with_label");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [credit, setCredit] = useState<CreditState>({ status: "idle" });

  // Check credit on mount when donationId is provided
  useEffect(() => {
    if (!donationId) return;
    setCredit({ status: "checking" });
    fetch(`/api/ai-photo/credits?donation_id=${donationId}`)
      .then(r => r.json())
      .then((data: { canGenerate: boolean; existingImageUrl?: string | null }) => {
        if (data.canGenerate) {
          setCredit({ status: "can_generate" });
        } else {
          setCredit({ status: "used", existingImageUrl: data.existingImageUrl ?? null });
          if (data.existingImageUrl) setImages([data.existingImageUrl]);
        }
      })
      .catch(() => setCredit({ status: "can_generate" })); // fallback: allow on error
  }, [donationId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setImages([]);
    setError("");
    e.target.value = "";
  }

  async function handleGenerate() {
    if (!photoFile) return;
    setGenerating(true);
    setError("");
    setImages([]);

    try {
      const form = new FormData();
      if (donationId) form.append("donation_id", donationId);
      if (memorialId) form.append("memorial_id", memorialId);
      form.append("donor_photo", photoFile);
      form.append("template_key", templateKey);
      form.append("donor_name", donorName || "ผู้ร่วมบุญ");
      form.append("donor_position", donorPosition ?? "");
      form.append("condolence_text", condolenceText ?? "ร่วมอาลัยและร่วมทำบุญ");
      form.append("deceased_name", deceasedName ?? "");
      form.append("funeral_place", funeralPlace ?? "");

      // Use credit-aware endpoint when donationId present, otherwise free endpoint
      const endpoint = donationId ? "/api/ai-photo/generate" : "/api/generate-wreath";

      const res = await fetch(endpoint, { method: "POST", body: form });
      const text = await res.text();
      if (!text) throw new Error(`[${res.status}] response ว่าง — ระบบ AI อาจ timeout`);
      let data: Record<string, unknown>;
      try { data = JSON.parse(text); }
      catch { throw new Error(`[${res.status}] parse error: ${text.slice(0, 300)}`); }

      // 429 = credit exhausted (race condition check)
      if (res.status === 429) {
        const existingUrl = typeof data.existingImageUrl === "string" ? data.existingImageUrl : null;
        setCredit({ status: "used", existingImageUrl: existingUrl });
        if (existingUrl) setImages([existingUrl]);
        setError("คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป");
        setGenerating(false);
        return;
      }

      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "เกิดข้อผิดพลาด");

      // credit-aware endpoint returns { imageUrl }, free endpoint returns { images, url }
      const imgs: string[] = typeof data.imageUrl === "string"
        ? [data.imageUrl]
        : Array.isArray(data.images) && data.images.length > 0
        ? (data.images as string[])
        : typeof data.url === "string"
        ? [data.url]
        : [];

      if (imgs.length === 0) throw new Error("ไม่ได้รับภาพจาก AI กรุณาลองใหม่");
      setImages(imgs);
      setSelectedIdx(0);

      // Update credit state to "used" after successful generation with donationId
      if (donationId) {
        setCredit({ status: "used", existingImageUrl: imgs[0] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
  }

  async function handleDownload() {
    const img = images[selectedIdx];
    if (!img) return;
    setDownloading(true);
    try {
      const filename = `หรีดร่วมบุญ-AI-${donorName || "photo"}.png`;
      if (img.startsWith("data:")) {
        const res = await fetch(img);
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = href;
        link.click();
        URL.revokeObjectURL(href);
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = img;
        link.target = "_blank";
        link.click();
      }
    } catch {}
    setDownloading(false);
  }

  // ── Credit check state: still loading ──────────────────────────────
  if (donationId && credit.status === "checking") {
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4">
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
          <span className="text-xs text-gold-400">กำลังตรวจสอบสิทธิ์...</span>
        </div>
      </div>
    );
  }

  // ── Credit used + existing image ────────────────────────────────────
  if (donationId && credit.status === "used" && (images.length > 0 || credit.existingImageUrl)) {
    const displayImages = images.length > 0 ? images : credit.existingImageUrl ? [credit.existingImageUrl] : [];
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึกจาก AI</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">
            สร้างภาพที่ระลึกเรียบร้อยแล้ว — บันทึกหรือแชร์ภาพด้านล่าง
          </p>
        </div>
        {displayImages.length > 0 && (
          <AiPhotoResult
            images={displayImages}
            selectedIdx={Math.min(selectedIdx, displayImages.length - 1)}
            onSelect={setSelectedIdx}
            onDownload={handleDownload}
            downloading={downloading}
            donorName={donorName}
          />
        )}
      </div>
    );
  }

  // ── Credit used but no image recoverable ────────────────────────────
  if (donationId && credit.status === "used") {
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gold-500" />
          <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึกจาก AI</span>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป</p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              แต่ละการร่วมบุญได้รับสิทธิ์สร้างภาพฟรี 1 รูปเท่านั้น
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal generate UI (can_generate or no donationId) ─────────────
  const isLimited = Boolean(donationId);

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Camera className="w-4 h-4 text-gold-500" />
        <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึกจาก AI</span>
      </div>
      <div className="flex items-start gap-2 -mt-2">
        <p className="text-xs text-gold-500 flex-1">
          แนบรูปผู้มอบ · เลือกรูปแบบ · ให้ AI สร้างภาพที่ระลึกสมจริง
        </p>
        {isLimited && (
          <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            ฟรี 1 รูป
          </span>
        )}
      </div>

      {/* Photo upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-gold-300 rounded-xl py-4 px-3 flex flex-col items-center gap-2 hover:bg-gold-50 transition-colors active:scale-[0.98]"
      >
        {photoPreview ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold-400 shrink-0">
              <img src={photoPreview} alt="รูปผู้มอบ" className="w-full h-full object-cover" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-semibold text-gold-700">เปลี่ยนรูปผู้มอบ</p>
              <p className="text-[10px] text-gold-400 truncate">{photoFile?.name}</p>
            </div>
          </div>
        ) : (
          <>
            <Camera className="w-8 h-8 text-gold-300" />
            <p className="text-xs font-semibold text-gold-600">แตะเพื่อแนบรูปผู้มอบ</p>
            <p className="text-[10px] text-gold-400 text-center">
              ใช้รูปจริงเพื่อให้ AI สร้างภาพใกล้เคียงหน้าตา
            </p>
          </>
        )}
      </button>

      {/* Template selector */}
      <AiPhotoTemplateSelector selected={templateKey} onChange={setTemplateKey} />

      {/* Context info */}
      {(donorName || deceasedName) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-0.5">
          {donorName && (
            <p className="text-[11px] text-blue-700">
              ผู้มอบ: <strong>{donorName}</strong>
              {donorPosition ? ` · ${donorPosition}` : ""}
            </p>
          )}
          {deceasedName && (
            <p className="text-[11px] text-blue-600">งานของ: <strong>{deceasedName}</strong></p>
          )}
          {funeralPlace && <p className="text-[11px] text-blue-500">{funeralPlace}</p>}
        </div>
      )}

      {/* Generate button */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!photoFile || generating}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating
            ? "กำลังสร้างภาพ AI..."
            : isLimited
            ? "สร้างภาพที่ระลึกฟรี 1 รูป"
            : "สร้างภาพที่ระลึก"}
        </button>
        {!photoFile && (
          <p className="text-[10px] text-gold-400 text-center">กรุณาแนบรูปผู้มอบก่อนสร้างภาพ</p>
        )}
        {generating && (
          <p className="text-[10px] text-gold-500 text-center animate-pulse">
            AI กำลังประมวลผล อาจใช้เวลา 20–60 วินาที...
          </p>
        )}
        {isLimited && !generating && photoFile && (
          <p className="text-[10px] text-amber-500 text-center">
            ⚠ สิทธิ์นี้ใช้ได้ 1 รูปต่อ 1 รายการร่วมบุญ
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && credit.status !== "used" && (
        <AiPhotoResult
          images={images}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          onDownload={handleDownload}
          downloading={downloading}
          donorName={donorName}
        />
      )}
    </div>
  );
}

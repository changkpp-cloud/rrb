"use client";

import { useState, useRef } from "react";
import { Camera, Sparkles, Loader2, XCircle } from "lucide-react";
import AiPhotoTemplateSelector from "./AiPhotoTemplateSelector";
import AiPhotoResult from "./AiPhotoResult";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

interface Props {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
  deceasedName?: string;
  funeralPlace?: string;
}

export default function AiPhotoSection({
  donorName,
  donorPosition,
  condolenceText,
  deceasedName,
  funeralPlace,
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
      form.append("donor_photo", photoFile);
      form.append("template_key", templateKey);
      form.append("donor_name", donorName || "ผู้ร่วมบุญ");
      form.append("donor_position", donorPosition ?? "");
      form.append("condolence_text", condolenceText ?? "ร่วมอาลัยและร่วมทำบุญ");
      form.append("deceased_name", deceasedName ?? "");
      form.append("funeral_place", funeralPlace ?? "");
      form.append("count", "3");

      const res = await fetch("/api/generate-wreath", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");

      const imgs: string[] = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : data.url
        ? [data.url]
        : [];
      if (imgs.length === 0) throw new Error("ไม่ได้รับภาพจาก AI กรุณาลองใหม่");
      setImages(imgs);
      setSelectedIdx(0);
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

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Camera className="w-4 h-4 text-gold-500" />
        <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึกจาก AI</span>
      </div>
      <p className="text-xs text-gold-500 -mt-2">
        แนบรูปผู้มอบ · เลือกรูปแบบ · ให้ AI สร้างภาพที่ระลึกสมจริง
      </p>

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
              <img
                src={photoPreview}
                alt="รูปผู้มอบ"
                className="w-full h-full object-cover"
              />
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

      {/* Context info badge */}
      {(donorName || deceasedName) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-0.5">
          {donorName && (
            <p className="text-[11px] text-blue-700">
              ผู้มอบ: <strong>{donorName}</strong>
              {donorPosition ? ` · ${donorPosition}` : ""}
            </p>
          )}
          {deceasedName && (
            <p className="text-[11px] text-blue-600">
              งานของ: <strong>{deceasedName}</strong>
            </p>
          )}
          {funeralPlace && (
            <p className="text-[11px] text-blue-500">{funeralPlace}</p>
          )}
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
          {generating ? "กำลังสร้างภาพ AI..." : "สร้างภาพที่ระลึก"}
        </button>
        {!photoFile && (
          <p className="text-[10px] text-gold-400 text-center">
            กรุณาแนบรูปผู้มอบก่อนสร้างภาพ
          </p>
        )}
        {generating && (
          <p className="text-[10px] text-gold-500 text-center animate-pulse">
            AI กำลังประมวลผล อาจใช้เวลา 20–60 วินาที...
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
      {images.length > 0 && (
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

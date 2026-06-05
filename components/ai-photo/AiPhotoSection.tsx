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

const AI_PHOTO_MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const AI_PHOTO_MAX_DIMENSION = 1536;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("ไม่สามารถบีบอัดรูปได้"));
      },
      "image/jpeg",
      quality
    );
  });
}

async function compressAiPhotoUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(
      1,
      AI_PHOTO_MAX_DIMENSION / Math.max(image.width, image.height)
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ไม่สามารถเตรียมรูปก่อนส่งได้");
    ctx.drawImage(image, 0, 0, width, height);

    let blob = await canvasToBlob(canvas, 0.82);
    for (const quality of [0.74, 0.66, 0.58]) {
      if (blob.size <= AI_PHOTO_MAX_UPLOAD_BYTES) break;
      blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size > AI_PHOTO_MAX_UPLOAD_BYTES) {
      throw new Error("รูปมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลงหรือครอปรูปก่อนอัปโหลด");
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "donor-photo";
    return new File([blob], `${name}-ai-photo.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

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
  const [compressing, setCompressing] = useState(false);
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setCompressing(true);
    setImages([]);
    try {
      const compressedFile = await compressAiPhotoUpload(file);
      setPhotoFile(compressedFile);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(compressedFile);
    } catch (e) {
      setPhotoFile(null);
      setPhotoPreview(null);
      setError(e instanceof Error ? e.message : "เตรียมรูปไม่สำเร็จ กรุณาลองใหม่");
    }
    setCompressing(false);
    e.target.value = "";
  }

  async function handleGenerate() {
    if (!photoFile) return;
    setGenerating(true);
    setError("");
    setImages([]);

    try {
      // Step 1 — Get auth token + built prompt from Next.js (fast, < 1s)
      const tokenForm = new FormData();
      if (donationId) tokenForm.append("donation_id", donationId);
      if (memorialId) tokenForm.append("memorial_id", memorialId);
      tokenForm.append("template_key", templateKey);
      tokenForm.append("donor_name", donorName || "ผู้ร่วมบุญ");
      tokenForm.append("donor_position", donorPosition ?? "");
      tokenForm.append("condolence_text", condolenceText ?? "ร่วมอาลัยและร่วมทำบุญ");
      tokenForm.append("deceased_name", deceasedName ?? "");
      tokenForm.append("funeral_place", funeralPlace ?? "");

      const tokenRes = await fetch("/api/ai-photo/auth-token", {
        method: "POST",
        body: tokenForm,
      });
      const tokenText = await tokenRes.text();
      if (!tokenText) throw new Error(`[${tokenRes.status}] response ว่าง`);
      let tokenData: Record<string, unknown>;
      try { tokenData = JSON.parse(tokenText); }
      catch { throw new Error("เกิดข้อผิดพลาดในการรับข้อมูล กรุณาลองใหม่"); }

      if (tokenRes.status === 429) {
        const existingUrl = typeof tokenData.existingImageUrl === "string" ? tokenData.existingImageUrl : null;
        setCredit({ status: "used", existingImageUrl: existingUrl });
        if (existingUrl) setImages([existingUrl]);
        setError("คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป");
        setGenerating(false);
        return;
      }
      if (!tokenRes.ok) throw new Error(typeof tokenData.error === "string" ? tokenData.error : "เกิดข้อผิดพลาด");

      const { token, serviceUrl, prompt: builtPrompt, donationId: checkedDonationId, memorialId: checkedMemorialId } =
        tokenData as { token: string; serviceUrl: string; prompt: string; donationId: string | null; memorialId: string | null };

      // Step 2 — Call external AI service directly (30-90s, no Vercel timeout)
      const genForm = new FormData();
      genForm.append("prompt", builtPrompt);
      genForm.append("count", "1");
      genForm.append("donor_photo", photoFile);

      const genRes = await fetch(serviceUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: genForm,
      });
      const genText = await genRes.text();
      if (!genText) throw new Error(`[${genRes.status}] response ว่าง — ระบบ AI อาจ timeout`);
      let genData: Record<string, unknown>;
      try { genData = JSON.parse(genText); }
      catch {
        if (!genRes.ok) throw new Error(`[${genRes.status}] ${genText.slice(0, 300)}`);
        throw new Error("เกิดข้อผิดพลาดในการรับข้อมูล กรุณาลองใหม่");
      }
      if (!genRes.ok) throw new Error(typeof genData.error === "string" ? genData.error : "เกิดข้อผิดพลาด");

      const imgs: string[] = Array.isArray(genData.images) && genData.images.length > 0
        ? (genData.images as string[])
        : typeof genData.url === "string"
        ? [genData.url as string]
        : [];
      if (imgs.length === 0) throw new Error("ไม่ได้รับภาพจาก AI กรุณาลองใหม่");

      // Step 3 — Save result to DB (fire-and-forget, < 1s)
      fetch("/api/ai-photo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId: checkedDonationId,
          memorialId: checkedMemorialId,
          imageUrl: imgs[0],
          templateKey,
          prompt: builtPrompt,
        }),
      }).catch(() => {});

      setImages(imgs);
      setSelectedIdx(0);
      if (donationId) setCredit({ status: "used", existingImageUrl: imgs[0] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
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
          disabled={!photoFile || generating || compressing}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {generating || compressing ? (
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
          donorName={donorName}
        />
      )}
    </div>
  );
}

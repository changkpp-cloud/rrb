"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import IosPageHeader from "@/components/IosPageHeader";
import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import {
  buildAiPhotoPrompt,
  buildWreathLabelText,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";

const MOCK_WREATH_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MOCK_WREATH_MAX_DIMENSION = 1024;
const MOCK_WREATH_TIMEOUT_MS = 240_000;

const DONOR_GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "non-binary", label: "ไม่ระบุ/อื่น ๆ" },
];

const DONOR_AGE_OPTIONS = [
  { value: "18-30 years old", label: "18-30 ปี" },
  { value: "31-45 years old", label: "31-45 ปี" },
  { value: "46-60 years old", label: "46-60 ปี" },
  { value: "61-75 years old", label: "61-75 ปี" },
  { value: "76+ years old", label: "76 ปีขึ้นไป" },
];

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("ไม่สามารถเตรียมรูปก่อนส่งได้"));
      },
      "image/jpeg",
      quality
    );
  });
}

async function compressMockWreathUpload(file: File) {
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
      MOCK_WREATH_MAX_DIMENSION / Math.max(image.width, image.height)
    );
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ไม่สามารถเตรียมรูปก่อนส่งได้");
    ctx.drawImage(image, 0, 0, width, height);

    let blob = await canvasToJpegBlob(canvas, 0.92);
    for (const quality of [0.86, 0.8, 0.72]) {
      if (blob.size <= MOCK_WREATH_MAX_UPLOAD_BYTES) break;
      blob = await canvasToJpegBlob(canvas, quality);
    }

    if (blob.size > MOCK_WREATH_MAX_UPLOAD_BYTES) {
      throw new Error("รูปมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลงหรือครอปรูปก่อนแนบ");
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "donor-photo";
    return new File([blob], `${name}-mock-wreath.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function MockWreathPage() {
  return (
    <Suspense>
      <MockWreathInner />
    </Suspense>
  );
}

function MockWreathInner() {
  const params = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftReadyRef = useRef(false);

  const templateKey: AiPhotoTemplateKey = "standing_with_label";
  const [donorPhoto, setDonorPhoto] = useState<File | null>(null);
  const [donorPhotoPreview, setDonorPhotoPreview] = useState("");
  const [donorName, setDonorName] = useState(params.get("name") ?? "");
  const [donorPosition, setDonorPosition] = useState(params.get("title") ?? "");
  const [condolenceText, setCondolenceText] = useState(
    params.get("message") ?? "ร่วมอาลัยและร่วมทำบุญ"
  );
  const [deceasedName, setDeceasedName] = useState(params.get("deceased_name") ?? "");
  const [funeralPlace, setFuneralPlace] = useState(params.get("funeral_place") ?? "");
  const [donorGender, setDonorGender] = useState(params.get("donor_gender") ?? "male");
  const [donorAgeRange, setDonorAgeRange] = useState(params.get("donor_age_range") ?? "46-60 years old");
  const memorialPhotoUrl = params.get("memorial_photo") ?? "";
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const draftKey = useMemo(
    () =>
      [
        "rrb:mock-wreath-draft",
        params.get("donation_id") || "guest",
        params.get("name") || "anonymous",
        params.get("deceased_name") || "memorial",
      ].join(":"),
    [params]
  );

  const selectedTemplate = getAiPhotoTemplate(templateKey);

  const wreathLabelText = useMemo(
    () => buildWreathLabelText({ donorName, donorPosition, condolenceText }),
    [donorName, donorPosition, condolenceText]
  );

  const promptPreview = useMemo(
    () =>
      buildAiPhotoPrompt({
        templateKey,
        donorName,
        donorPosition,
        condolenceText,
        deceasedName,
        funeralPlace,
        donorGender,
        donorAgeRange,
      }),
    [donorName, donorPosition, condolenceText, deceasedName, funeralPlace, donorGender, donorAgeRange]
  );

  useEffect(() => {
    draftReadyRef.current = false;
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as {
          donorPhotoPreview?: string;
          donorName?: string;
          donorPosition?: string;
          condolenceText?: string;
          deceasedName?: string;
          funeralPlace?: string;
          donorGender?: string;
          donorAgeRange?: string;
          generatedImages?: string[];
          selectedImage?: string;
        };

        if (draft.donorPhotoPreview) setDonorPhotoPreview(draft.donorPhotoPreview);
        if (typeof draft.donorName === "string") setDonorName(draft.donorName);
        if (typeof draft.donorPosition === "string") setDonorPosition(draft.donorPosition);
        if (typeof draft.condolenceText === "string") setCondolenceText(draft.condolenceText);
        if (typeof draft.deceasedName === "string") setDeceasedName(draft.deceasedName);
        if (typeof draft.funeralPlace === "string") setFuneralPlace(draft.funeralPlace);
        if (typeof draft.donorGender === "string") setDonorGender(draft.donorGender);
        if (typeof draft.donorAgeRange === "string") setDonorAgeRange(draft.donorAgeRange);
        if (Array.isArray(draft.generatedImages)) setGeneratedImages(draft.generatedImages);
        if (typeof draft.selectedImage === "string") setSelectedImage(draft.selectedImage);
      }
    } catch {}
    draftReadyRef.current = true;
  }, [draftKey]);

  useEffect(() => {
    if (!draftReadyRef.current) return;

    try {
      window.sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          donorPhotoPreview,
          donorName,
          donorPosition,
          condolenceText,
          deceasedName,
          funeralPlace,
          donorGender,
          donorAgeRange,
          generatedImages,
          selectedImage,
        })
      );
    } catch {}
  }, [
    draftKey,
    donorPhotoPreview,
    donorName,
    donorPosition,
    condolenceText,
    deceasedName,
    funeralPlace,
    donorGender,
    donorAgeRange,
    generatedImages,
    selectedImage,
  ]);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setError("");
    try {
      const compressed = await compressMockWreathUpload(file);
      setDonorPhoto(compressed);
      setDonorPhotoPreview(URL.createObjectURL(compressed));
      setGeneratedImages([]);
      setSelectedImage("");
    } catch (err) {
      setDonorPhoto(null);
      setDonorPhotoPreview("");
      setGeneratedImages([]);
      setSelectedImage("");
      setError(err instanceof Error ? err.message : "เตรียมรูปไม่สำเร็จ กรุณาลองเลือกรูปใหม่");
    } finally {
      setCompressing(false);
      event.target.value = "";
    }
  }

  async function handleGenerate() {
    if (!donorPhoto) {
      setError("กรุณาแนบรูปผู้มอบก่อนสร้างภาพ");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("donor_photo", donorPhoto);
      form.append("template_key", templateKey);
      form.append("donor_name", donorName || "ผู้ร่วมบุญ");
      form.append("donor_position", donorPosition);
      form.append("condolence_text", condolenceText);
      form.append("deceased_name", deceasedName);
      form.append("funeral_place", funeralPlace);
      form.append("donor_gender", donorGender);
      form.append("donor_age_range", donorAgeRange);
      form.append("count", "2");

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), MOCK_WREATH_TIMEOUT_MS);
      const res = await fetch("/api/generate-wreath", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สร้างภาพไม่สำเร็จ");

      const images = ((data.images ?? []).filter(Boolean) as string[]).slice(0, 2);
      setGeneratedImages(images);
      setSelectedImage(images[0] ?? "");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("บริการสร้างภาพใช้เวลานานเกินไป กรุณาลองใหม่ หรือใช้รูปที่เล็กลง");
      } else if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        setError("เชื่อมต่อบริการสร้างภาพไม่ได้ อาจเกิดจากรูปใหญ่เกินไป เน็ตหลุด หรือบริการ AI ไม่ตอบสนอง");
      } else {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(imageUrl = selectedImage) {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `mock-wreath-${donorName || "image"}.png`;
    link.click();
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator
        .share({
          title: "จำลองภาพมอบหรีดร่วมบุญ",
          text: `${donorName || "ผู้ร่วมบุญ"} ร่วมมอบหรีดร่วมบุญ`,
          url: window.location.href,
        })
        .catch(() => {});
      return;
    }

    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  }

  const canGenerate = Boolean(donorPhoto) && Boolean(donorName.trim()) && !compressing;

  return (
    <div className="min-h-dvh flex flex-col">
      <IosPageHeader title="จำลองมอบหรีดร่วมบุญ" subtitle="AI Photo" backHref={`/ecard?${new URLSearchParams({ ...Object.fromEntries(params.entries()), view: "ai" }).toString()}`} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <StepCard step="1" title="แนบรูปผู้มอบ / เจ้าภาพ">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={compressing}
              className="w-full rounded-2xl border-2 border-dashed border-gold-300 bg-white px-4 py-4 text-left hover:bg-cream-50 transition-colors disabled:opacity-60"
            >
              {compressing ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gold-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-semibold">กำลังเตรียมรูปก่อนส่ง...</span>
                </div>
              ) : donorPhotoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gold-200 bg-cream-50 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={donorPhotoPreview}
                      alt="รูปผู้มอบ"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gold-800 truncate">
                      {donorPhoto?.name}
                    </p>
                    <p className="text-xs text-gold-500 mt-1">
                      แตะเพื่อเปลี่ยนรูปอ้างอิง
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-gold-500">
                  <Camera className="w-9 h-9" />
                  <p className="text-sm font-semibold text-gold-700">
                    แนบรูปหน้าผู้มอบหรือเจ้าภาพ
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    ใช้เป็น reference ให้ AI สร้างภาพที่ระลึกในท่าทางที่เลือก
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </button>
          </StepCard>

          <StepCard step="2" title="เพศและช่วงอายุผู้มอบ">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gold-700">เพศผู้มอบ</span>
                <select
                  value={donorGender}
                  onChange={(event) => setDonorGender(event.target.value)}
                  className="w-full rounded-xl gold-border bg-white px-3 py-2.5 text-sm font-semibold text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {DONOR_GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gold-700">ช่วงอายุ</span>
                <select
                  value={donorAgeRange}
                  onChange={(event) => setDonorAgeRange(event.target.value)}
                  className="w-full rounded-xl gold-border bg-white px-3 py-2.5 text-sm font-semibold text-gold-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {DONOR_AGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </StepCard>

          <StepCard step="3" title="ข้อมูลจากงานศพและป้าย">
            <div className="space-y-3">
              <Field
                label="ชื่อผู้มอบ"
                value={donorName}
                onChange={setDonorName}
                placeholder="เช่น คุณสมชาย ใจดี"
              />
              <Field
                label="ตำแหน่ง / ในนาม"
                value={donorPosition}
                onChange={setDonorPosition}
                placeholder="เช่น กรรมการผู้จัดการ บริษัท..."
              />
              <Field
                label="ข้อความแสดงความเสียใจ"
                value={condolenceText}
                onChange={setCondolenceText}
                placeholder="ร่วมอาลัยและร่วมทำบุญ"
              />
              <Field
                label="ชื่อผู้วายชนม์"
                value={deceasedName}
                onChange={setDeceasedName}
                placeholder="ดึงจากงานศพได้เมื่อส่ง query มา"
              />
              <Field
                label="สถานที่จัดงาน"
                value={funeralPlace}
                onChange={setFuneralPlace}
                placeholder="เช่น วัด / ศาลา / จังหวัด"
              />
              <div className="rounded-xl bg-white border border-gold-100 px-3 py-2">
                <p className="text-[10px] font-semibold text-gold-500 mb-1">
                  ข้อความบนป้ายหรีดร่วมบุญ
                </p>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-gold-800">
                  {wreathLabelText}
                </pre>
              </div>
            </div>
          </StepCard>

          <StepCard step="4" title="Prompt Template ที่ระบบล็อกไว้">
            <div className="rounded-xl bg-gold-50 border border-gold-100 px-3 py-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-bold text-gold-700">
                  {selectedTemplate.templateName}
                </p>
                <span className="text-[10px] text-gold-500 shrink-0">
                  ผู้ใช้แก้ prompt ไม่ได้
                </span>
              </div>
              <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-gold-700">
                {promptPreview}
              </pre>
            </div>
          </StepCard>

          <StepCard step="5" title="สร้างภาพจำลองและเลือกภาพ">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className="w-full gold-gradient text-white font-semibold py-3.5 rounded-2xl text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้างภาพจำลอง...
                </>
              ) : generatedImages.length > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  สร้างใหม่อีกครั้ง
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  สร้างภาพจำลอง 3 แบบ
                </>
              )}
            </button>

            {!canGenerate && !loading && (
              <p className="text-[11px] text-gold-400 text-center">
                ต้องมีรูปผู้มอบและชื่อผู้มอบก่อนสร้างภาพ
              </p>
            )}

            {loading && (
              <div className="rounded-2xl border border-gold-200 bg-white px-4 py-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-gold-500 shrink-0" />
                  <p className="text-sm font-bold text-gold-800">ใช้เวลา 2–5 นาทีในการเจนภาพ</p>
                </div>
                <p className="text-xs leading-5 text-gold-600">
                  ระบบกำลังประมวลผลภาพ กรุณารอสักครู่ หน้านี้จะแสดงผลภาพเมื่อเจนเสร็จ
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((imageUrl, index) => {
                    const isSelected = selectedImage === imageUrl;
                    return (
                      <button
                        key={imageUrl}
                        type="button"
                        onClick={() => setSelectedImage(imageUrl)}
                        className={`relative rounded-xl overflow-hidden border-2 bg-cream-50 ${
                          isSelected ? "border-gold-500" : "border-gold-100"
                        }`}
                        style={{ aspectRatio: "3 / 4" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`ภาพจำลอง ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full gold-gradient flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload()}
                    className="flex items-center justify-center gap-2 rounded-xl gold-gradient py-3 text-sm font-semibold text-white"
                  >
                    <Download className="w-4 h-4" />
                    บันทึกภาพ
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-gold-300 bg-white py-3 text-sm font-semibold text-gold-700"
                  >
                    <Share2 className="w-4 h-4" />
                    {shared ? "พร้อมแชร์แล้ว" : "แชร์"}
                  </button>
                </div>
              </div>
            )}
          </StepCard>

          <Link
            href={`/ecard?${new URLSearchParams({ ...Object.fromEntries(params.entries()), view: "ai" }).toString()}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-gold-300 bg-cream-50 text-gold-700 font-semibold text-sm hover:bg-cream-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไป E-card
          </Link>

          <div className="h-2" />
        </div>
      </main>
    </div>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full gold-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <h2 className="text-sm font-bold text-gold-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gold-600 mb-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl gold-border bg-white px-3 py-2.5 text-sm text-gold-800 placeholder-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
      />
    </label>
  );
}

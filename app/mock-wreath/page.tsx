"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import IosPageHeader from "@/components/IosPageHeader";
import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
} from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import {
  AI_PHOTO_TEMPLATES,
  buildAiPhotoPrompt,
  buildWreathLabelText,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";

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

  const [donorPhoto, setDonorPhoto] = useState<File | null>(null);
  const [donorPhotoPreview, setDonorPhotoPreview] = useState("");
  const [templateKey, setTemplateKey] =
    useState<AiPhotoTemplateKey>("standing_with_label");
  const [donorName, setDonorName] = useState(params.get("name") ?? "");
  const [donorPosition, setDonorPosition] = useState(params.get("title") ?? "");
  const [condolenceText, setCondolenceText] = useState(
    params.get("message") ?? "ร่วมอาลัยและร่วมทำบุญ"
  );
  const [deceasedName, setDeceasedName] = useState(params.get("deceased_name") ?? "");
  const [funeralPlace, setFuneralPlace] = useState(params.get("funeral_place") ?? "");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);

  const selectedTemplate =
    AI_PHOTO_TEMPLATES.find((template) => template.templateKey === templateKey) ??
    AI_PHOTO_TEMPLATES[0];

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
      }),
    [templateKey, donorName, donorPosition, condolenceText, deceasedName, funeralPlace]
  );

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDonorPhoto(file);
    setDonorPhotoPreview(URL.createObjectURL(file));
    setGeneratedImages([]);
    setSelectedImage("");
    setError("");
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
      form.append("count", "3");

      const res = await fetch("/api/generate-wreath", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สร้างภาพไม่สำเร็จ");

      const images = (data.images ?? []).filter(Boolean) as string[];
      setGeneratedImages(images);
      setSelectedImage(images[0] ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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

  const canGenerate = Boolean(donorPhoto) && Boolean(donorName.trim());

  return (
    <div className="min-h-dvh flex flex-col">
      <IosPageHeader title="จำลองมอบหรีดร่วมบุญ" subtitle="AI Photo" backHref={`/ecard?${new URLSearchParams({ ...Object.fromEntries(params.entries()), view: "ai" }).toString()}`} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <StepCard step="1" title="แนบรูปผู้มอบ / เจ้าภาพ">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-gold-300 bg-white px-4 py-4 text-left hover:bg-cream-50 transition-colors"
            >
              {donorPhotoPreview ? (
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

          <StepCard step="2" title="เลือกแบบภาพ">
            <div className="grid grid-cols-1 gap-2">
              {AI_PHOTO_TEMPLATES.map((template) => {
                const isSelected = template.templateKey === templateKey;
                return (
                  <button
                    key={template.templateKey}
                    type="button"
                    onClick={() => {
                      setTemplateKey(template.templateKey);
                      setGeneratedImages([]);
                      setSelectedImage("");
                      setError("");
                    }}
                    className={`flex items-start gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                      isSelected
                        ? "border-gold-500 bg-gold-50"
                        : "border-gold-100 bg-white hover:border-gold-300"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "gold-gradient text-white" : "bg-cream-100 text-gold-500"
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gold-800">
                        {template.templateName}
                      </p>
                      <p className="text-[11px] text-gold-500 leading-relaxed mt-0.5">
                        {template.description}
                      </p>
                    </div>
                  </button>
                );
              })}
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

            {!canGenerate && (
              <p className="text-[11px] text-gold-400 text-center">
                ต้องมีรูปผู้มอบและชื่อผู้มอบก่อนสร้างภาพ
              </p>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
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

                {selectedImage && (
                  <div className="rounded-2xl overflow-hidden border border-gold-200 bg-cream-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedImage} alt="ภาพที่เลือก" className="w-full object-cover" />
                  </div>
                )}

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
                    {shared ? "คัดลอกลิงก์แล้ว" : "แชร์"}
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

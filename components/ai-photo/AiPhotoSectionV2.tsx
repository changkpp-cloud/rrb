"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import AiPhotoResult from "./AiPhotoResult";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";
import { compressImage } from "@/lib/compress-image";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DIM = 1024;
const MOBILE_IMAGE_ACCEPT = "image/*,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,image/heic,image/heif";

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

interface Props {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
  deceasedName?: string;
  funeralPlace?: string;
  memorialPhotoUrl?: string;
  birthDate?: string;
  deathDate?: string;
  age?: string | number | null;
  ceremonyDate?: string;
  memorialId: string;
  donationId?: string;
}

type AiPhotoJobState = {
  jobId: string;
  jobUrl: string;
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl: string | null;
  error?: string | null;
};

function requestAiPhotoNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function notifyAiPhotoComplete() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const notification = new Notification("ภาพมอบหรีดพร้อมแล้ว", {
    body: "แชร์",
    tag: "rrb-ai-photo-ready",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export default function AiPhotoSectionV2({
  donorName, donorPosition, condolenceText,
  deceasedName, funeralPlace, memorialPhotoUrl, memorialId, donationId,
  birthDate, deathDate, age, ceremonyDate,
}: Props) {
  const draftReadyRef = useRef(false);
  const memorialBackgroundRef = useRef<HTMLDivElement>(null);
  const templateKey: AiPhotoTemplateKey = "standing_with_label";
  const [donorFile, setDonorFile] = useState<File | null>(null);
  const [donorPreview, setDonorPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [donorGender, setDonorGender] = useState("male");
  const [donorAgeRange, setDonorAgeRange] = useState("46-60 years old");
  const [consent, setConsent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState("");
  const [activeJob, setActiveJob] = useState<AiPhotoJobState | null>(null);
  const donorRef = useRef<HTMLInputElement>(null);
  const draftKey = useMemo(
    () =>
      [
        "rrb:ai-photo-draft",
        memorialId,
        donationId || "guest",
        donorName || "anonymous",
        deceasedName || "memorial",
      ].join(":"),
    [memorialId, donationId, donorName, deceasedName]
  );

  useEffect(() => {
    draftReadyRef.current = false;
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as {
          donorPreview?: string | null;
          images?: string[];
          selectedIdx?: number;
          donorGender?: string;
          donorAgeRange?: string;
          consent?: boolean;
          activeJob?: AiPhotoJobState | null;
        };

        if (draft.donorPreview) setDonorPreview(draft.donorPreview);
        if (Array.isArray(draft.images)) setImages(draft.images);
        if (typeof draft.selectedIdx === "number") setSelectedIdx(draft.selectedIdx);
        if (typeof draft.donorGender === "string") setDonorGender(draft.donorGender);
        if (typeof draft.donorAgeRange === "string") setDonorAgeRange(draft.donorAgeRange);
        if (typeof draft.consent === "boolean") setConsent(draft.consent);
        if (draft.activeJob) setActiveJob(draft.activeJob);
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
          templateKey,
          donorPreview,
          images,
          selectedIdx,
          donorGender,
          donorAgeRange,
          consent,
          activeJob,
        })
      );
    } catch {}
  }, [draftKey, donorPreview, images, selectedIdx, donorGender, donorAgeRange, consent, activeJob]);

  async function handleDonorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true); setError("");
    try {
      const compressed = await compressImage(file, {
        maxDim: MAX_DIM,
        maxBytes: MAX_UPLOAD_BYTES,
        fallbackToOriginalOnDecodeError: true,
      });
      setDonorFile(compressed);
      const reader = new FileReader();
      reader.onload = () => setDonorPreview(reader.result as string);
      reader.readAsDataURL(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เตรียมรูปไม่สำเร็จ");
    }
    setCompressing(false);
    e.target.value = "";
  }

  async function buildMemorialBackgroundFile() {
    const node = memorialBackgroundRef.current;
    if (!node) return null;

    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fdf8ee",
      });
      if (!blob) return null;
      return new File([blob], "memorial-first-page-background.png", {
        type: "image/png",
        lastModified: Date.now(),
      });
    } catch {
      return null;
    }
  }

  async function handleGenerate() {
    if (!donorFile) { setError("กรุณาแนบรูปผู้มอบก่อน"); return; }
    if (!consent) { setError("กรุณายืนยันสิทธิ์การใช้รูปภาพก่อน"); return; }
    requestAiPhotoNotificationPermission();
    setGenerating(true); setError(""); setImages([]);

    try {
      // Step 1: Get auth token + built prompt
      const tokenForm = new FormData();
      if (donationId) tokenForm.append("donation_id", donationId);
      tokenForm.append("memorial_id", memorialId);
      tokenForm.append("template_key", templateKey);
      tokenForm.append("donor_name", donorName || "ผู้ร่วมบุญ");
      tokenForm.append("donor_position", donorPosition ?? "");
      tokenForm.append("condolence_text", condolenceText ?? "ร่วมอาลัยและร่วมทำบุญ");
      tokenForm.append("deceased_name", deceasedName ?? "");
      tokenForm.append("funeral_place", funeralPlace ?? "");
      tokenForm.append("donor_gender", donorGender);
      tokenForm.append("donor_age_range", donorAgeRange);

      const tokenRes = await fetch("/api/ai-photo/auth-token", { method: "POST", body: tokenForm });
      const tokenText = await tokenRes.text();
      if (!tokenText) throw new Error("ไม่ได้รับ token");
      const tokenData = JSON.parse(tokenText);

      if (!tokenRes.ok) throw new Error(tokenData.error ?? "เกิดข้อผิดพลาด");

      const { token, serviceUrl, prompt: builtPrompt } = tokenData as {
        token: string; serviceUrl: string; prompt: string;
        donationId: string | null; memorialId: string | null;
      };

      // Step 2: Call AI service
      const genForm = new FormData();
      genForm.append("prompt", builtPrompt);
      genForm.append("count", "1");
      genForm.append("donor_photo", donorFile);
      const memorialBackgroundFile = await buildMemorialBackgroundFile();
      if (memorialBackgroundFile) {
        genForm.append("memorial_background_photo", memorialBackgroundFile);
      }

      const genRes = await fetch(serviceUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: genForm,
      });
      const genText = await genRes.text();
      if (!genText) throw new Error("response ว่าง — AI อาจ timeout");
      const genData = JSON.parse(genText);
      if (!genRes.ok) throw new Error(genData.error ?? "เกิดข้อผิดพลาด");

      const imgs: string[] = Array.isArray(genData.images) ? genData.images
        : typeof genData.url === "string" ? [genData.url] : [];
      if (imgs.length === 0) throw new Error("ไม่ได้รับภาพจาก AI");

      // Step 3: Save result (fire-and-forget)
      fetch("/api/ai-photo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, memorialId, imageUrl: imgs[0], templateKey, prompt: builtPrompt }),
      }).catch(() => {});

      setImages(imgs); setSelectedIdx(0);
      notifyAiPhotoComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
  }


  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== "pending" && activeJob.status !== "processing") return;

    const jobId = activeJob.jobId;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function pollJob() {
      try {
        const res = await fetch(`/api/ai-photo/jobs/${jobId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok) {
          const nextJob = data as AiPhotoJobState;
          setActiveJob(nextJob);

          if (nextJob.status === "completed" && nextJob.imageUrl) {
            setImages([nextJob.imageUrl]);
            setSelectedIdx(0);
            notifyAiPhotoComplete();
            setGenerating(false);
            return;
          }

          if (nextJob.status === "failed") {
            setError(nextJob.error || "Image generation failed. Please try again.");
            setGenerating(false);
            return;
          }

          timer = setTimeout(pollJob, 7000);
        }
      } catch {
        if (!cancelled) timer = setTimeout(pollJob, 10000);
      }
    }

    timer = setTimeout(pollJob, 5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeJob]);

  async function handleGenerateJob() {
    if (!donorFile) { setError("Please attach a donor photo first."); return; }
    if (!consent) { setError("Please confirm photo usage consent first."); return; }
    requestAiPhotoNotificationPermission();
    setGenerating(true); setError(""); setImages([]);

    try {
      const jobForm = new FormData();
      if (donationId) jobForm.append("donation_id", donationId);
      jobForm.append("memorial_id", memorialId);
      jobForm.append("template_key", templateKey);
      jobForm.append("donor_name", donorName || "ผู้ร่วมบุญ");
      jobForm.append("donor_position", donorPosition ?? "");
      jobForm.append("condolence_text", condolenceText ?? "ร่วมอาลัยและร่วมทำบุญ");
      jobForm.append("deceased_name", deceasedName ?? "");
      jobForm.append("funeral_place", funeralPlace ?? "");
      jobForm.append("donor_gender", donorGender);
      jobForm.append("donor_age_range", donorAgeRange);
      jobForm.append("donor_photo", donorFile);

      const res = await fetch("/api/ai-photo/jobs", {
        method: "POST",
        body: jobForm,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start image generation job.");

      const nextJob = data as AiPhotoJobState;
      setActiveJob(nextJob);

      if (nextJob.status === "completed" && nextJob.imageUrl) {
        setImages([nextJob.imageUrl]);
        setSelectedIdx(0);
        setGenerating(false);
      }
    } catch (e) {
      console.warn("AI photo server job failed; falling back to direct generation.", e);
      await handleGenerate();
    }
  }

  // เมื่อเจนภาพสำเร็จแล้ว → แสดงเฉพาะรูปที่เจนได้ (+ ปุ่มบันทึก/แชร์)
  // ซ่อนฟอร์มแนบรูป/ตัวเลือกเพศ-อายุ/consent/ปุ่มสร้าง/กล่องสถานะทั้งหมด
  if (images.length > 0 && !generating) {
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึก</span>
        </div>
        <AiPhotoResult
          images={images}
          selectedIdx={Math.min(selectedIdx, images.length - 1)}
          onSelect={setSelectedIdx}
          donorName={donorName}
        />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-gold-500" />
        <span className="text-sm font-semibold text-gold-700">จำลองการมอบหรีดร่วมบุญ</span>
      </div>

      {/* Donor photo */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gold-700">แนบรูปผู้มอบ</p>
        <p className="text-[10px] text-gold-400">กรุณาแนบรูปที่เห็นใบหน้าชัดเจน เพื่อให้ภาพจำลองใกล้เคียงตัวจริงมากที่สุด</p>
        <input ref={donorRef} type="file" accept={MOBILE_IMAGE_ACCEPT} className="hidden" onChange={handleDonorChange} />
        <button type="button" onClick={() => donorRef.current?.click()}
          disabled={compressing}
          className="w-full border-2 border-dashed border-gold-300 rounded-xl py-3 px-3 flex items-center gap-3 hover:bg-gold-50 active:scale-[0.98] transition-all">
          {donorPreview ? (
            <>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold-400 shrink-0">
                <img src={donorPreview} alt="รูปผู้มอบ" className="w-full h-full object-cover" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-semibold text-gold-700">เปลี่ยนรูปผู้มอบ</p>
                <p className="text-[10px] text-gold-400">{donorFile?.name}</p>
              </div>
            </>
          ) : (
            <>
              <Camera className="w-7 h-7 text-gold-300 shrink-0" />
              <p className="text-xs font-semibold text-gold-600">แตะเพื่อแนบรูปผู้มอบ</p>
            </>
          )}
          {compressing && <Loader2 className="w-4 h-4 animate-spin text-gold-400 shrink-0" />}
        </button>
      </div>

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

      {/* Consent */}
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0" />
        <p className="text-[11px] text-gold-600 leading-relaxed">
          ข้าพเจ้ายืนยันว่ามีสิทธิ์ใช้รูปภาพที่แนบ และยินยอมให้ระบบนำรูปภาพนี้ไปใช้สร้างภาพจำลองเพื่อเป็นที่ระลึกในงานนี้เท่านั้น
        </p>
      </label>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}



      {activeJob && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 space-y-2">
          <div className="flex items-start gap-2">
            {activeJob.status === "completed" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-800">
                {activeJob.status === "completed"
                  ? "ภาพมอบหรีดพร้อมแล้ว"
                  : "เริ่มสร้างภาพบนระบบแล้ว"}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-emerald-700">
                {activeJob.status === "completed"
                  ? "ภาพพร้อมแล้ว สามารถบันทึกหรือแชร์ภาพจากส่วนผลลัพธ์ด้านล่างได้"
                  : "ระบบกำลังประมวลผลภาพ กรุณารอสักครู่ หน้านี้จะแสดงผลภาพเมื่อเจนเสร็จ"}
              </p>
            </div>
          </div>
          {activeJob.status !== "completed" && (
            <p className="text-[10px] text-emerald-700">
              หน้านี้จะอัปเดตสถานะอัตโนมัติ แต่ไม่จำเป็นต้องเปิดค้างไว้
            </p>
          )}
        </div>
      )}

      {/* Generate button */}
      <div className="space-y-1">
        <button type="button" onClick={handleGenerateJob}
          disabled={!donorFile || !consent || generating || compressing}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "กำลังสร้างภาพ AI..." : "สร้างภาพที่ระลึก"}
        </button>
        {generating && (
          <p className="text-[10px] text-gold-500 text-center animate-pulse">AI กำลังประมวลผล อาจใช้เวลา 30–90 วินาที สามารถเปลี่ยนไปหน้าอื่นในแอพได้ เมื่อเสร็จระบบจะแจ้งเตือนถ้าเบราว์เซอร์อนุญาต</p>
        )}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[10000px] top-0 overflow-hidden"
      >
        <div
          ref={memorialBackgroundRef}
          style={{
            width: 390,
            minHeight: 640,
            background: "linear-gradient(170deg,#fdfaf3 0%,#f7f0e0 42%,#faf4eb 72%,#fdfaf3 100%)",
            color: "#5b3f17",
            fontFamily: "Arial, sans-serif",
            padding: 28,
            boxSizing: "border-box",
          }}
        >
          <div style={{ textAlign: "center", border: "2px solid #c9983c", borderRadius: 22, padding: 20, background: "rgba(255,252,248,0.9)" }}>
            <div style={{ width: 170, height: 220, margin: "0 auto 18px", border: "4px solid #d6ad4d", borderRadius: 18, overflow: "hidden", background: "#f7ead1" }}>
              {memorialPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memorialPhotoUrl} alt="" crossOrigin={memorialPhotoUrl.startsWith("data:") ? undefined : "anonymous"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9983c", fontSize: 44 }}>+</div>
              )}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, marginBottom: 16 }}>{deceasedName || "ผู้วายชนม์"}</div>
            <div style={{ display: "grid", gap: 8, fontSize: 18, fontWeight: 700, lineHeight: 1.35 }}>
              {birthDate && <div><span style={{ color: "#b9892d" }}>ชาตะ</span> {birthDate}</div>}
              {deathDate && <div><span style={{ color: "#b9892d" }}>มรณะ</span> {deathDate}</div>}
              {age != null && age !== "" && <div><span style={{ color: "#b9892d" }}>อายุ</span> {age} ปี</div>}
              {ceremonyDate && <div><span style={{ color: "#b9892d" }}>กำหนดฌาปนกิจ</span> {ceremonyDate}</div>}
            </div>
            {funeralPlace && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(201,152,60,0.35)", fontSize: 17, fontWeight: 700, lineHeight: 1.45 }}>
                {funeralPlace}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

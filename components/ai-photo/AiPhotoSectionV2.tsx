"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import AiPhotoCarousel from "./AiPhotoCarousel";
import HostPersonPicker, { type MemorialPerson } from "./HostPersonPicker";
import AiPhotoResult from "./AiPhotoResult";
import type { AiPhotoTemplateKey } from "@/lib/ai-photo-templates";

const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;
const MAX_DIM = 1536;

function canvasToBlob(canvas: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error("compress fail")), "image/jpeg", q)
  );
}

async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("กรุณาเลือกไฟล์รูปภาพ");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async"; img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    let blob = await canvasToBlob(canvas, 0.82);
    for (const q of [0.74, 0.66, 0.58]) {
      if (blob.size <= MAX_UPLOAD_BYTES) break;
      blob = await canvasToBlob(canvas, q);
    }
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } finally { URL.revokeObjectURL(url); }
}

interface Props {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
  deceasedName?: string;
  funeralPlace?: string;
  memorialId: string;
  donationId?: string;
}

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
    body: "กลับมาที่หน้านี้เพื่อบันทึกภาพหรือแชร์ LINE",
    tag: "rrb-ai-photo-ready",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export default function AiPhotoSectionV2({
  donorName, donorPosition, condolenceText,
  deceasedName, funeralPlace, memorialId, donationId,
}: Props) {
  const draftReadyRef = useRef(false);
  const [templateKey, setTemplateKey] = useState<AiPhotoTemplateKey>("standing_with_label");
  const [donorFile, setDonorFile] = useState<File | null>(null);
  const [donorPreview, setDonorPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [donorGender, setDonorGender] = useState<"male" | "female">("female");
  const [donorAgeRange, setDonorAgeRange] = useState("");
  const [hostPerson, setHostPerson] = useState<MemorialPerson | null>(null);
  const [consent, setConsent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState("");
  const [creditUsed, setCreditUsed] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
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
          templateKey?: AiPhotoTemplateKey;
          donorPreview?: string | null;
          donorGender?: "male" | "female";
          donorAgeRange?: string;
          images?: string[];
          selectedIdx?: number;
          consent?: boolean;
          creditUsed?: boolean;
          existingImageUrl?: string | null;
        };

        if (draft.templateKey) setTemplateKey(draft.templateKey);
        if (draft.donorPreview) setDonorPreview(draft.donorPreview);
        if (draft.donorGender) setDonorGender(draft.donorGender);
        if (typeof draft.donorAgeRange === "string") setDonorAgeRange(draft.donorAgeRange);
        if (Array.isArray(draft.images)) setImages(draft.images);
        if (typeof draft.selectedIdx === "number") setSelectedIdx(draft.selectedIdx);
        if (typeof draft.consent === "boolean") setConsent(draft.consent);
        if (typeof draft.creditUsed === "boolean") setCreditUsed(draft.creditUsed);
        if (typeof draft.existingImageUrl === "string") setExistingImageUrl(draft.existingImageUrl);
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
          donorGender,
          donorAgeRange,
          images,
          selectedIdx,
          consent,
          creditUsed,
          existingImageUrl,
        })
      );
    } catch {}
  }, [draftKey, templateKey, donorPreview, donorGender, donorAgeRange, images, selectedIdx, consent, creditUsed, existingImageUrl]);

  async function handleDonorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true); setError("");
    try {
      const compressed = await compressPhoto(file);
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
      tokenForm.append("donor_age_range", donorAgeRange || "35–50 years old");
      if (hostPerson?.id) tokenForm.append("host_person_id", hostPerson.id);

      const tokenRes = await fetch("/api/ai-photo/auth-token", { method: "POST", body: tokenForm });
      const tokenText = await tokenRes.text();
      if (!tokenText) throw new Error("ไม่ได้รับ token");
      const tokenData = JSON.parse(tokenText);

      if (tokenRes.status === 429) {
        const url = typeof tokenData.existingImageUrl === "string" ? tokenData.existingImageUrl : null;
        setCreditUsed(true); setExistingImageUrl(url);
        if (url) setImages([url]);
        setError("คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป");
        setGenerating(false); return;
      }
      if (!tokenRes.ok) throw new Error(tokenData.error ?? "เกิดข้อผิดพลาด");

      const { token, serviceUrl, prompt: builtPrompt, hostPhotoUrl } = tokenData as {
        token: string; serviceUrl: string; prompt: string;
        donationId: string | null; memorialId: string | null;
        hostPhotoUrl?: string | null;
      };

      // Step 2: Call AI service
      const genForm = new FormData();
      genForm.append("prompt", builtPrompt);
      genForm.append("count", "1");
      genForm.append("donor_photo", donorFile);

      // Fetch host photo if available
      if (hostPhotoUrl) {
        try {
          const hostBlob = await fetch(hostPhotoUrl).then(r => r.blob());
          const hostFile = new File([hostBlob], "host-photo.jpg", { type: "image/jpeg" });
          genForm.append("host_photo", hostFile);
        } catch { /* proceed without host photo */ }
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
      if (donationId) { setCreditUsed(true); setExistingImageUrl(imgs[0]); }
      notifyAiPhotoComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
  }


  // ── Credit used + existing image ──
  if (creditUsed && (images.length > 0 || existingImageUrl)) {
    const displayImages = images.length > 0 ? images : existingImageUrl ? [existingImageUrl] : [];
    return (
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gold-700">ภาพที่ระลึก</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">สร้างภาพที่ระลึกเรียบร้อยแล้ว</p>
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

  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-gold-500" />
        <span className="text-sm font-semibold text-gold-700">จำลองการมอบหรีดร่วมบุญ</span>
      </div>

      {/* Step 1: Carousel */}
      <AiPhotoCarousel selected={templateKey} onChange={setTemplateKey} />

      {/* Step 2: Donor photo */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gold-700">แนบรูปผู้มอบ</p>
        <p className="text-[10px] text-gold-400">กรุณาแนบรูปที่เห็นใบหน้าชัดเจน เพื่อให้ภาพจำลองใกล้เคียงตัวจริงมากที่สุด</p>
        <input ref={donorRef} type="file" accept="image/*,image/heic" className="hidden" onChange={handleDonorChange} />
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

      {/* Step 2b: Gender + Age (template 1 only uses these, but collect for all) */}
      {templateKey === "standing_with_label" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Gender */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gold-700">เพศผู้มอบ</p>
            <div className="flex gap-2">
              {(["female", "male"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDonorGender(g)}
                  className={[
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-all border-2 active:scale-[0.97]",
                    donorGender === g
                      ? "gold-gradient text-white border-transparent shadow-sm"
                      : "bg-cream-50 border-gold-300 text-gold-700 hover:bg-cream-100",
                  ].join(" ")}
                >
                  {g === "female" ? "หญิง" : "ชาย"}
                </button>
              ))}
            </div>
          </div>
          {/* Age range */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gold-700">ช่วงอายุ (ไม่บังคับ)</p>
            <select
              value={donorAgeRange}
              onChange={(e) => setDonorAgeRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl gold-border bg-white text-gold-800 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="">ไม่ระบุ</option>
              <option value="18–25 years old">18–25 ปี</option>
              <option value="26–35 years old">26–35 ปี</option>
              <option value="36–45 years old">36–45 ปี</option>
              <option value="46–55 years old">46–55 ปี</option>
              <option value="56–65 years old">56–65 ปี</option>
              <option value="65+ years old">65+ ปี</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Host/family picker */}
      <HostPersonPicker
        memorialId={memorialId}
        selectedId={hostPerson?.id ?? null}
        onChange={setHostPerson}
      />

      {/* Context preview */}
      {(donorName || deceasedName) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-0.5">
          {donorName && <p className="text-[11px] text-blue-700">ผู้มอบ: <strong>{donorName}</strong>{donorPosition ? ` · ${donorPosition}` : ""}</p>}
          {deceasedName && <p className="text-[11px] text-blue-600">งานของ: <strong>{deceasedName}</strong></p>}
          {funeralPlace && <p className="text-[11px] text-blue-500">{funeralPlace}</p>}
        </div>
      )}

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

      {/* Generate button */}
      <div className="space-y-1">
        {donationId && (
          <p className="text-[10px] text-gold-500 text-center">สร้างภาพที่ระลึกได้ฟรี 1 ภาพสำหรับรายการร่วมบุญนี้</p>
        )}
        <button type="button" onClick={handleGenerate}
          disabled={!donorFile || !consent || generating || compressing}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "กำลังสร้างภาพ AI..." : "สร้างภาพที่ระลึก"}
        </button>
        {generating && (
          <p className="text-[10px] text-gold-500 text-center animate-pulse">AI กำลังประมวลผล อาจใช้เวลา 30–90 วินาที สามารถเปลี่ยนไปหน้าอื่นในแอพได้ เมื่อเสร็จระบบจะแจ้งเตือนถ้าเบราว์เซอร์อนุญาต</p>
        )}
      </div>

      {/* Result */}
      {images.length > 0 && !creditUsed && (
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

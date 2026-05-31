"use client";

import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";

interface Props {
  images: string[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onDownload: () => void;
  downloading: boolean;
  donorName?: string;
}

export default function AiPhotoResult({
  images,
  selectedIdx,
  onSelect,
  onDownload,
  downloading,
  donorName,
}: Props) {
  const mainImg = images[selectedIdx];
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleShareLine() {
    setSharing(true);
    const shareTitle = `ภาพที่ระลึก AI — ${donorName ?? "ผู้ร่วมบุญ"} ร่วมมอบหรีดร่วมบุญ 🌸`;
    const shareText = `#หรีดร่วมบุญ #ZeroWaste`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        if (mainImg) {
          // Share the image file if supported
          if (mainImg.startsWith("data:")) {
            const res = await fetch(mainImg);
            const blob = await res.blob();
            const file = new File([blob], `หรีดร่วมบุญ-AI-${donorName ?? "photo"}.png`, { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({ files: [file], title: shareTitle, text: shareText });
              setShared(true); setTimeout(() => setShared(false), 2500);
              setSharing(false); return;
            }
          }
        }
        await navigator.share({ url: shareUrl, title: shareTitle, text: shareText });
        setShared(true); setTimeout(() => setShared(false), 2500);
        setSharing(false); return;
      } catch (e) {
        if ((e as Error).name === "AbortError") { setSharing(false); return; }
      }
    }

    // Fallback: LINE share URL
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank", "noopener");
    setShared(true); setTimeout(() => setShared(false), 2500);
    setSharing(false);
  }

  return (
    <div className="space-y-2.5">
      {/* Main preview */}
      <div
        className="relative rounded-xl overflow-hidden border border-gold-200 bg-cream-50"
        style={{ aspectRatio: "2/3" }}
      >
        {mainImg && (
          <img
            src={mainImg}
            alt="ภาพ AI ที่สร้าง"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={`grid gap-1.5 ${images.length === 2 ? "grid-cols-2" : images.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                idx === selectedIdx ? "border-gold-500" : "border-gold-200 hover:border-gold-300"
              }`}
              style={{ aspectRatio: "2/3" }}
            >
              <img src={img} alt={`ภาพ ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === selectedIdx && (
                <div className="absolute inset-0 ring-2 ring-gold-500 ring-inset rounded-lg pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Download + Share row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading || sharing}
          className="flex items-center justify-center gap-2 py-3 rounded-xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          {downloading ? "กำลังบันทึก..." : "บันทึกภาพ"}
        </button>
        <button
          type="button"
          onClick={handleShareLine}
          disabled={downloading || sharing}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
          style={{
            borderColor: shared ? "#00b900" : "rgba(201,152,60,0.40)",
            color: shared ? "#00b900" : "#92400e",
            background: "white",
          }}
        >
          {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          {shared ? "แชร์แล้ว!" : "แชร์ LINE"}
        </button>
      </div>
    </div>
  );
}

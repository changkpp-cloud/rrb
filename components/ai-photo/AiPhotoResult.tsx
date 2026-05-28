"use client";

import { Download } from "lucide-react";

interface Props {
  images: string[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function AiPhotoResult({
  images,
  selectedIdx,
  onSelect,
  onDownload,
  downloading,
}: Props) {
  const mainImg = images[selectedIdx];

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

      {/* Thumbnails (shows if multiple images) */}
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

      {/* Download */}
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gold-300 bg-white text-gold-700 text-sm font-medium hover:bg-gold-50 disabled:opacity-40 transition-all active:scale-[0.98]"
      >
        <Download className="w-4 h-4" />
        {downloading ? "กำลังบันทึก..." : "บันทึกภาพที่ระลึก"}
      </button>
    </div>
  );
}

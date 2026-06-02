"use client";

import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";

export interface AiPhotoOverlayData {
  donorName: string;
  donorPosition?: string;
  condolenceText?: string;
}

interface Props {
  images: string[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  donorName?: string;
  overlayData?: AiPhotoOverlayData;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function compositeWithOverlay(
  imageUrl: string,
  overlay: AiPhotoOverlayData
): Promise<string> {
  await document.fonts.ready;

  const img = new Image();
  let objectUrl: string | null = null;

  if (imageUrl.startsWith("data:")) {
    img.src = imageUrl;
  } else {
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();
      objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;
    } catch {
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
    }
  }

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("ไม่สามารถสร้าง canvas ได้");

  ctx.drawImage(img, 0, 0);

  const W = canvas.width;
  const H = canvas.height;

  const lines: { text: string; size: number; bold: boolean; color: string }[] =
    [
      {
        text: overlay.donorName || "ผู้ร่วมบุญ",
        size: W * 0.042,
        bold: true,
        color: "#ffffff",
      },
      ...(overlay.donorPosition
        ? [
            {
              text: overlay.donorPosition,
              size: W * 0.031,
              bold: false,
              color: "rgba(255,255,255,0.85)",
            },
          ]
        : []),
      ...(overlay.condolenceText
        ? [
            {
              text: overlay.condolenceText,
              size: W * 0.03,
              bold: false,
              color: "#e8c05a",
            },
          ]
        : []),
    ];

  const lineHeight = W * 0.054;
  const padH = W * 0.038;
  const padV = W * 0.028;
  const boxH = lines.length * lineHeight + padV * 2;
  const boxW = W * 0.78;
  const boxX = (W - boxW) / 2;
  const boxY = H * 0.75 - boxH / 2;

  ctx.fillStyle = "rgba(10, 5, 0, 0.68)";
  drawRoundRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.fill();

  ctx.strokeStyle = "rgba(232, 192, 90, 0.45)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let textY = boxY + padV + lineHeight / 2;
  for (const line of lines) {
    ctx.font = `${line.bold ? "bold " : ""}${line.size}px Sarabun, sans-serif`;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, W / 2, textY, boxW - padH * 2);
    textY += lineHeight;
  }

  if (objectUrl) URL.revokeObjectURL(objectUrl);
  return canvas.toDataURL("image/png");
}

export default function AiPhotoResult({
  images,
  selectedIdx,
  onSelect,
  donorName,
  overlayData,
}: Props) {
  const mainImg = images[selectedIdx];
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!mainImg) return;
    setDownloading(true);
    try {
      const dataUrl = overlayData
        ? await compositeWithOverlay(mainImg, overlayData)
        : mainImg;

      const filename = `หรีดร่วมบุญ-AI-${donorName || "photo"}.png`;
      if (dataUrl.startsWith("data:")) {
        const res = await fetch(dataUrl);
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
        link.href = dataUrl;
        link.target = "_blank";
        link.click();
      }
    } catch {
      // fallback: download original without overlay
      const link = document.createElement("a");
      link.download = `หรีดร่วมบุญ-AI-${donorName || "photo"}.png`;
      link.href = mainImg;
      link.target = "_blank";
      link.click();
    }
    setDownloading(false);
  }

  async function handleShareLine() {
    setSharing(true);
    const shareTitle = `ภาพที่ระลึก AI — ${donorName ?? "ผู้ร่วมบุญ"} ร่วมมอบหรีดร่วมบุญ 🌸`;
    const shareText = `#หรีดร่วมบุญ #ZeroWaste`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        if (mainImg) {
          const dataUrl = overlayData
            ? await compositeWithOverlay(mainImg, overlayData).catch(
                () => mainImg
              )
            : mainImg;
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File(
            [blob],
            `หรีดร่วมบุญ-AI-${donorName ?? "photo"}.png`,
            { type: "image/png" }
          );
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: shareText,
            });
            setShared(true);
            setTimeout(() => setShared(false), 2500);
            setSharing(false);
            return;
          }
        }
        await navigator.share({ url: shareUrl, title: shareTitle, text: shareText });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        setSharing(false);
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setSharing(false);
          return;
        }
      }
    }

    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(lineUrl, "_blank", "noopener");
    setShared(true);
    setTimeout(() => setShared(false), 2500);
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
          <>
            <img
              src={mainImg}
              alt="ภาพ AI ที่สร้าง"
              className="w-full h-full object-cover"
            />
            {overlayData && (
              <div className="absolute inset-x-0 flex justify-center pointer-events-none px-5"
                style={{ bottom: "10%" }}>
                <div
                  className="rounded-xl px-4 py-2.5 text-center w-full max-w-xs"
                  style={{
                    background: "rgba(10,5,0,0.68)",
                    border: "1px solid rgba(232,192,90,0.45)",
                  }}
                >
                  <p
                    className="text-white font-bold text-sm leading-snug"
                    style={{ fontFamily: "Sarabun, sans-serif" }}
                  >
                    {overlayData.donorName || "ผู้ร่วมบุญ"}
                  </p>
                  {overlayData.donorPosition && (
                    <p
                      className="text-xs mt-0.5"
                      style={{
                        fontFamily: "Sarabun, sans-serif",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      {overlayData.donorPosition}
                    </p>
                  )}
                  {overlayData.condolenceText && (
                    <p
                      className="text-xs mt-0.5 italic"
                      style={{
                        fontFamily: "Sarabun, sans-serif",
                        color: "#e8c05a",
                      }}
                    >
                      {overlayData.condolenceText}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className={`grid gap-1.5 ${
            images.length === 2
              ? "grid-cols-2"
              : images.length === 3
              ? "grid-cols-3"
              : "grid-cols-4"
          }`}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(idx)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                idx === selectedIdx
                  ? "border-gold-500"
                  : "border-gold-200 hover:border-gold-300"
              }`}
              style={{ aspectRatio: "2/3" }}
            >
              <img
                src={img}
                alt={`ภาพ ${idx + 1}`}
                className="w-full h-full object-cover"
              />
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
          onClick={handleDownload}
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

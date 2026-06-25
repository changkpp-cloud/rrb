// บีบ/ย่อรูปฝั่ง client ก่อนอัปโหลด — เก็บไฟล์ขนาดพอเหมาะตั้งแต่ต้นทาง
// เหตุผล: รูปจากกล้องมือถือมักใหญ่ ~12MP เกินลิมิต decode/canvas ของ iOS Safari
// ทำให้ html-to-image (e-card) ทิ้งรูปบน iPhone — ย่อตรงนี้จบที่รากเดียว
// + อัปโหลดเร็วขึ้น (ดู pattern เดียวกันใน AiPhotoSectionV2.compressPhoto)

const DEFAULT_MAX_DIM = 1280;
const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("compress fail"))),
      "image/jpeg",
      quality,
    ),
  );
}

/**
 * ย่อรูปเป็น JPEG ที่ด้านยาวสุด ≤ maxDim และขนาดไฟล์ ≤ maxBytes
 * ถ้าไม่ใช่ไฟล์รูปจะ throw — ผู้เรียกควร try/catch แล้ว fallback เป็นไฟล์เดิม
 */
export async function compressImage(
  file: File,
  { maxDim = DEFAULT_MAX_DIM, maxBytes = DEFAULT_MAX_BYTES } = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("กรุณาเลือกไฟล์รูปภาพ");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

    let blob = await canvasToBlob(canvas, 0.9);
    for (const q of [0.85, 0.8, 0.72]) {
      if (blob.size <= maxBytes) break;
      blob = await canvasToBlob(canvas, q);
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

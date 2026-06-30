const DEFAULT_MAX_DIM = 1280;
const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif"]);

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function isLikelyImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXTENSIONS.has(fileExtension(file));
}

function isHeicLike(file: File) {
  const ext = fileExtension(file);
  return file.type === "image/heic" || file.type === "image/heif" || ext === "heic" || ext === "heif";
}

function isDecodeFailure(error: unknown) {
  // img.decode() rejects with a DOMException (EncodingError) ที่บางเบราว์เซอร์ไม่นับเป็น instanceof Error
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "EncodingError" || /decode|source image|image source/i.test(error.message);
  }
  if (!(error instanceof Error)) return false;
  return /decode|source image|image source/i.test(error.message);
}

async function convertHeicToJpegFile(file: File) {
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) throw new Error("HEIC conversion produced no image.");

  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified || Date.now(),
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("compress fail"))),
      "image/jpeg",
      quality,
    ),
  );
}

async function loadDrawableImage(file: File) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
        },
      };
    } catch {
      // Some mobile browsers support camera formats in only one decode path.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      width: img.width,
      height: img.height,
      draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.drawImage(img, 0, 0, width, height);
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(
  file: File,
  {
    maxDim = DEFAULT_MAX_DIM,
    maxBytes = DEFAULT_MAX_BYTES,
    background = "#ffffff",
    fallbackToOriginalOnDecodeError = false,
  } = {},
): Promise<File> {
  if (!isLikelyImageFile(file)) throw new Error("Please choose an image file.");

  try {
    const sourceFile = isHeicLike(file) ? await convertHeicToJpegFile(file) : file;
    const image = await loadDrawableImage(sourceFile);
    const scale = Math.min(1, maxDim / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    image.draw(ctx, width, height);

    let blob = await canvasToBlob(canvas, 0.9);
    for (const quality of [0.85, 0.8, 0.72]) {
      if (blob.size <= maxBytes) break;
      blob = await canvasToBlob(canvas, quality);
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
  } catch (error) {
    if (isHeicLike(file)) {
      throw new Error("This HEIC/HEIF photo could not be converted. Please try another photo or choose a JPEG/PNG copy.");
    }
    if (fallbackToOriginalOnDecodeError && isDecodeFailure(error)) return file;
    throw error;
  }
}

"use client";

export function isSocialInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|FB_IAB|Instagram|Line|MicroMessenger|Twitter|TikTok/i.test(navigator.userAgent);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function openUrl(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}

export async function openImageForManualSave(imageUrl: string) {
  if (!imageUrl) return;
  if (imageUrl.startsWith("data:")) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    openUrl(objectUrl);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return;
  }
  openUrl(imageUrl);
}

export async function downloadOrOpenImage(imageUrl: string, filename: string) {
  if (!imageUrl) return;

  if (isSocialInAppBrowser()) {
    await openImageForManualSave(imageUrl);
    return;
  }

  if (imageUrl.startsWith("data:")) {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = objectUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return;
  }

  const link = document.createElement("a");
  link.download = filename;
  link.href = imageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
}

export async function shareOrCopyUrl(params: { url: string; title: string; text: string }) {
  if (navigator.share) {
    try {
      await navigator.share(params);
      return "shared" as const;
    } catch (error) {
      if ((error as Error).name === "AbortError") return "cancelled" as const;
    }
  }

  const copied = await copyText(params.url);
  return copied ? ("copied" as const) : ("failed" as const);
}

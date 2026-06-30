import { createAdminClient } from "@/lib/supabase/admin";
import { editOpenAIImage, generateOpenAIImage } from "@/lib/openai-image";
import { createHmac } from "crypto";

type AiPhotoRequestRow = {
  id: string;
  final_prompt: string | null;
  reference_image_url: string | null;
  generated_image_url: string | null;
  donation_id: string | null;
  memorial_id: string | null;
  template_key: string | null;
  status: "pending" | "processing" | "completed" | "failed";
};

function extFromContentType(contentType: string | null) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  return "jpg";
}

async function uploadGeneratedImage(jobId: string, imageUrl: string) {
  const supabase = createAdminClient();
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("โหลดภาพที่สร้างสำเร็จเพื่อบันทึกไม่สำเร็จ");

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const bytes = await response.arrayBuffer();
  const path = `ai-photo/generated/${jobId}.${extFromContentType(contentType)}`;

  const { data, error } = await supabase.storage
    .from("donations")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;

  return supabase.storage.from("donations").getPublicUrl(data.path).data.publicUrl;
}

async function fileFromPublicUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("โหลดรูปผู้มอบเพื่อเจนภาพไม่สำเร็จ");

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const blob = await response.blob();
  return new File([blob], `donor-photo.${extFromContentType(contentType)}`, {
    type: contentType,
  });
}

function storagePathFromReference(reference: string) {
  if (!/^https?:\/\//i.test(reference)) return reference;

  try {
    const url = new URL(reference);
    const marker = "/storage/v1/object/public/donations/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    }
  } catch {}

  return null;
}

async function fileFromDonationStorageReference(reference: string) {
  const supabase = createAdminClient();
  const path = storagePathFromReference(reference);

  if (path) {
    const { data, error } = await supabase.storage.from("donations").download(path);
    if (!error && data) {
      const contentType = data.type || "image/jpeg";
      return new File([data], `donor-photo.${extFromContentType(contentType)}`, {
        type: contentType,
      });
    }
  }

  if (/^https?:\/\//i.test(reference)) return fileFromPublicUrl(reference);

  throw new Error("โหลดรูปผู้มอบเพื่อเจนภาพไม่สำเร็จ");
}

function createServiceToken(): string {
  const secret = process.env.AI_SERVICE_SECRET;
  if (!secret) throw new Error("AI_SERVICE_SECRET ยังไม่ได้ตั้งค่า");

  const exp = Math.floor(Date.now() / 1000) + 180;
  const payload = `ai-gen:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

async function generateViaExternalService(prompt: string, donorFile: File | null) {
  const serviceUrl = process.env.AI_SERVICE_URL;
  if (!serviceUrl) return null;

  const form = new FormData();
  form.append("prompt", prompt);
  form.append("count", "1");
  if (donorFile) form.append("donor_photo", donorFile);

  const res = await fetch(`${serviceUrl}/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${createServiceToken()}` },
    body: form,
  });
  const data = await res.json().catch(() => null) as { images?: string[]; url?: string; error?: string } | null;
  if (!res.ok) throw new Error(data?.error || "AI service สร้างภาพไม่สำเร็จ");

  const image = Array.isArray(data?.images) ? data?.images[0] : data?.url;
  if (!image) throw new Error("ไม่ได้รับภาพจาก AI service");
  return image;
}

async function markCreditUsed(donationId: string) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("ai_photo_credits")
    .select("used_count")
    .eq("donation_id", donationId)
    .single();

  if (existing) {
    await supabase.from("ai_photo_credits")
      .update({
        used_count: Math.max(1, (existing as { used_count: number }).used_count),
        updated_at: new Date().toISOString(),
      })
      .eq("donation_id", donationId);
  } else {
    await supabase.from("ai_photo_credits").insert({
      donation_id: donationId,
      free_quota: 1,
      used_count: 1,
    });
  }
}

export async function processAiPhotoJob(jobId: string) {
  const supabase = createAdminClient();

  const { data: job } = await supabase.from("ai_photo_requests")
    .select("id, final_prompt, reference_image_url, generated_image_url, donation_id, memorial_id, template_key, status")
    .eq("id", jobId)
    .single();

  const row = job as AiPhotoRequestRow | null;
  if (!row || row.status === "completed") return;

  await supabase.from("ai_photo_requests")
    .update({ status: "processing", error_message: null })
    .eq("id", jobId);

  try {
    if (!row.final_prompt) throw new Error("ไม่มี prompt สำหรับสร้างภาพ");

    const donorFile = row.reference_image_url
      ? await fileFromDonationStorageReference(row.reference_image_url)
      : null;

    let externalImage: string | null = null;
    try {
      externalImage = await generateViaExternalService(row.final_prompt, donorFile);
    } catch (error) {
      console.warn(
        "External AI image service failed; falling back to direct OpenAI generation.",
        error
      );
    }

    const images = externalImage
      ? [externalImage]
      : donorFile && donorFile.size > 0
      ? await editOpenAIImage(row.final_prompt, donorFile, 1)
      : await generateOpenAIImage(row.final_prompt, 1);

    const generated = images[0];
    if (!generated) throw new Error("ไม่ได้รับภาพจาก AI");

    const storedUrl = await uploadGeneratedImage(jobId, generated);

    await supabase.from("ai_photo_requests")
      .update({
        generated_image_url: storedUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", jobId);

    if (row.donation_id) await markCreditUsed(row.donation_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "สร้างภาพไม่สำเร็จ";
    await supabase.from("ai_photo_requests")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

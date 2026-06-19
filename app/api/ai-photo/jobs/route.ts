import { after, NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";
import { processAiPhotoJob } from "@/lib/ai-photo-jobs";
import { getSiteUrl } from "@/lib/site-url";
import { AI_PHOTO_SCHEMA_ERROR, isMissingAiPhotoSchemaError } from "@/lib/ai-photo-schema";

export const maxDuration = 300;

function extFromFile(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName) return fromName.toLowerCase();
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

function absoluteJobUrl(req: NextRequest, jobId: string) {
  const origin =
    getSiteUrl() ||
    req.headers.get("origin") ||
    new URL(req.url).origin;
  return `${origin}/ai-photo/jobs/${jobId}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const donationId = (form.get("donation_id") as string | null) || null;
  const memorialId = (form.get("memorial_id") as string | null) || null;
  const templateKey =
    (form.get("template_key") as AiPhotoTemplateKey | null) ??
    "standing_with_label";
  const donorPhoto = form.get("donor_photo") as File | null;
  const donorName = (form.get("donor_name") as string | null) ?? "ผู้ร่วมบุญ";
  const donorPosition = (form.get("donor_position") as string | null) ?? "";
  const condolenceText =
    (form.get("condolence_text") as string | null) ??
    "ร่วมอาลัยและร่วมทำบุญ";
  const deceasedName = (form.get("deceased_name") as string | null) ?? "";
  const funeralPlace = (form.get("funeral_place") as string | null) ?? "";
  const donorGender = (form.get("donor_gender") as string | null) ?? "male";
  const donorAgeRange = (form.get("donor_age_range") as string | null) ?? "46-60 years old";

  if (!donorPhoto || donorPhoto.size === 0) {
    return NextResponse.json({ error: "กรุณาแนบรูปผู้มอบก่อน" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (donationId) {
    const { data: existingJob, error: existingJobError } = await supabase.from("ai_photo_requests")
      .select("id, status, generated_image_url")
      .eq("donation_id", donationId)
      .in("status", ["pending", "processing", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingJobError && isMissingAiPhotoSchemaError(existingJobError)) {
      return NextResponse.json({ error: AI_PHOTO_SCHEMA_ERROR }, { status: 503 });
    }

    const row = existingJob as { id: string; status: string; generated_image_url?: string | null } | null;
    if (row?.id) {
      return NextResponse.json({
        jobId: row.id,
        jobUrl: absoluteJobUrl(req, row.id),
        status: row.status,
        imageUrl: row.generated_image_url ?? null,
        existing: true,
      });
    }
  }

  const template = getAiPhotoTemplate(templateKey);
  let promptOverride: string | undefined;
  let negativeOverride: string | undefined;
  try {
    const { data } = await supabase.from("ai_photo_templates")
      .select("prompt_template, negative_prompt")
      .eq("template_key", template.templateKey)
      .eq("is_active", true)
      .maybeSingle();
    const row = data as { prompt_template?: string | null; negative_prompt?: string | null } | null;
    promptOverride = row?.prompt_template ?? undefined;
    negativeOverride = row?.negative_prompt ?? undefined;
  } catch {}

  const finalPrompt = buildAiPhotoPrompt({
    templateKey: template.templateKey,
    donorName,
    donorPosition,
    condolenceText,
    deceasedName,
    funeralPlace,
    donorGender,
    donorAgeRange,
    promptTemplate: promptOverride,
    negativePrompt: negativeOverride,
  });

  const jobId = randomUUID();
  const refPath = `ai-photo/reference/${jobId}.${extFromFile(donorPhoto)}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("donations")
    .upload(refPath, await donorPhoto.arrayBuffer(), {
      contentType: donorPhoto.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "อัปโหลดรูปผู้มอบไม่สำเร็จ" }, { status: 500 });
  }

  const referenceImageUrl = supabase.storage
    .from("donations")
    .getPublicUrl(uploadData.path).data.publicUrl;

  const { error: insertError } = await supabase.from("ai_photo_requests")
    .insert({
      id: jobId,
      donation_id: donationId,
      memorial_id: memorialId,
      template_key: template.templateKey,
      final_prompt: finalPrompt,
      reference_image_url: referenceImageUrl,
      status: "pending",
    });

  if (insertError) {
    console.error("AI photo job insert failed", insertError);
    if (isMissingAiPhotoSchemaError(insertError)) {
      return NextResponse.json({ error: AI_PHOTO_SCHEMA_ERROR }, { status: 503 });
    }
    return NextResponse.json({ error: "สร้างงานเจนภาพไม่สำเร็จ" }, { status: 500 });
  }

  after(() => processAiPhotoJob(jobId));

  return NextResponse.json({
    jobId,
    jobUrl: absoluteJobUrl(req, jobId),
    status: "pending",
    imageUrl: null,
  });
}

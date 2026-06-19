import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";
import { editOpenAIImage, generateOpenAIImage } from "@/lib/openai-image";

// Allow enough time for GPT Image requests on Vercel.
export const maxDuration = 300;

/**
 * POST /api/ai-photo/generate  (multipart/form-data)
 *
 * Fields:
 *   donation_id       string   (optional, enables credit tracking)
 *   memorial_id       string   (optional)
 *   template_key      string
 *   donor_photo       File     (optional, used as the person reference)
 *   donor_name        string
 *   donor_position    string
 *   condolence_text   string
 *   deceased_name     string
 *   funeral_place     string
 */
export async function POST(req: NextRequest) {
  try {
    return await handleAiPhotoGenerate(req);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "เกิดข้อผิดพลาดระหว่างสร้างภาพ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleAiPhotoGenerate(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    const where =
      process.env.NODE_ENV === "production"
        ? "Vercel > Settings > Environment Variables"
        : ".env.local";
    return NextResponse.json(
      { error: `ไม่มี OPENAI_API_KEY กรุณาตั้งค่าใน ${where}` },
      { status: 503 }
    );
  }

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

  const supabase = createAdminClient();

  if (donationId) {
    const { data: credit } = await supabase.from("ai_photo_credits")
      .select("free_quota, used_count")
      .eq("donation_id", donationId)
      .single();

    const c = credit as { free_quota: number; used_count: number } | null;
    if (c && c.used_count >= c.free_quota) {
      const { data: prev } = await supabase.from("ai_photo_requests")
        .select("generated_image_url")
        .eq("donation_id", donationId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const existingImageUrl =
        (prev as { generated_image_url?: string } | null)?.generated_image_url ??
        null;

      return NextResponse.json(
        {
          error: "คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป",
          used: true,
          existingImageUrl,
        },
        { status: 429 }
      );
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
  } catch {
    promptOverride = undefined;
    negativeOverride = undefined;
  }
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

  let generatedImageUrl: string | null = null;
  let errorMessage: string | null = null;

  try {
    const images =
      donorPhoto && donorPhoto.size > 0
        ? await editOpenAIImage(finalPrompt, donorPhoto, 1)
        : await generateOpenAIImage(finalPrompt, 1);
    generatedImageUrl = images[0] ?? null;
  } catch (e) {
    errorMessage = (e as Error).message;
  }

  try {
    await supabase.from("ai_photo_requests").insert({
      donation_id: donationId,
      memorial_id: memorialId,
      template_key: template.templateKey,
      final_prompt: finalPrompt,
      generated_image_url: generatedImageUrl,
      status: generatedImageUrl ? "completed" : "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    });
  } catch {
    // Logging should never block the user from receiving the generated image.
  }

  if (donationId && generatedImageUrl) {
    const { data: existing } = await supabase.from("ai_photo_credits")
      .select("used_count")
      .eq("donation_id", donationId)
      .single();

    if (existing) {
      await supabase.from("ai_photo_credits")
        .update({
          used_count: (existing as { used_count: number }).used_count + 1,
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

  if (!generatedImageUrl) {
    return NextResponse.json(
      { error: errorMessage ?? "สร้างภาพไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    imageUrl: generatedImageUrl,
    templateKey: template.templateKey,
    creditUsed: Boolean(donationId),
  });
}

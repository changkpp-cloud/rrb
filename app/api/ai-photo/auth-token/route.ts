import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";
import { checkRateLimit } from "@/lib/rate-limit";

const TOKEN_TTL_SECONDS = 180; // 3 minutes — enough to reach the external service

function createServiceToken(): string {
  const secret = process.env.AI_SERVICE_SECRET;
  if (!secret) throw new Error("AI_SERVICE_SECRET ยังไม่ได้ตั้งค่า");
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `ai-gen:${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  // Rate limit: max 5 tokens per IP per 10 minutes
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = checkRateLimit(`ai-token:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "พยายามสร้างภาพมากเกินไป กรุณารอสักครู่" },
      { status: 429 }
    );
  }

  const serviceUrl = process.env.AI_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json(
      { error: "AI_SERVICE_URL ยังไม่ได้ตั้งค่าใน environment variables" },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const donationId = (form.get("donation_id") as string | null) || null;
  const memorialId = (form.get("memorial_id") as string | null) || null;
  const templateKey =
    (form.get("template_key") as AiPhotoTemplateKey | null) ??
    "standing_with_label";
  const donorName =
    (form.get("donor_name") as string | null) ?? "ผู้ร่วมบุญ";
  const donorPosition = (form.get("donor_position") as string | null) ?? "";
  const condolenceText =
    (form.get("condolence_text") as string | null) ??
    "ร่วมอาลัยและร่วมทำบุญ";
  const deceasedName = (form.get("deceased_name") as string | null) ?? "";
  const funeralPlace = (form.get("funeral_place") as string | null) ?? "";

  const supabase = createAdminClient();

  // Credit check (only when donationId provided)
  if (donationId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: credit } = await (supabase.from("ai_photo_credits") as any)
      .select("free_quota, used_count")
      .eq("donation_id", donationId)
      .single();

    const c = credit as { free_quota: number; used_count: number } | null;
    if (c && c.used_count >= c.free_quota) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prev } = await (supabase.from("ai_photo_requests") as any)
        .select("generated_image_url")
        .eq("donation_id", donationId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json(
        {
          error: "คุณใช้สิทธิ์สร้างภาพที่ระลึกฟรีแล้ว 1 รูป",
          used: true,
          existingImageUrl:
            (prev as { generated_image_url?: string } | null)
              ?.generated_image_url ?? null,
        },
        { status: 429 }
      );
    }
  }

  // Build prompt server-side (fast, no AI call)
  const template = getAiPhotoTemplate(templateKey);
  let promptOverride: string | undefined;
  let negativeOverride: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("ai_photo_templates") as any)
      .select("prompt_template, negative_prompt")
      .eq("template_key", template.templateKey)
      .eq("is_active", true)
      .maybeSingle();
    const row = data as {
      prompt_template?: string | null;
      negative_prompt?: string | null;
    } | null;
    promptOverride = row?.prompt_template ?? undefined;
    negativeOverride = row?.negative_prompt ?? undefined;
  } catch {
    // Use code defaults
  }

  const prompt = buildAiPhotoPrompt({
    templateKey: template.templateKey,
    donorName,
    donorPosition,
    condolenceText,
    deceasedName,
    funeralPlace,
    promptTemplate: promptOverride,
    negativePrompt: negativeOverride,
  });

  const token = createServiceToken();

  return NextResponse.json({
    token,
    serviceUrl: `${serviceUrl}/generate`,
    prompt,
    templateKey: template.templateKey,
    donationId,
    memorialId,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";

// Vercel Pro: ให้เวลา AI สร้างภาพได้นานสูงสุด 300 วินาที
export const maxDuration = 300;

/**
 * POST /api/ai-photo/generate  (multipart/form-data)
 *
 * ใช้ DALL-E 3 (text-to-image) — เร็ว 5-15 วินาที
 *
 * Fields:
 *   donation_id       string   (optional — credit tracking)
 *   memorial_id       string   (optional)
 *   template_key      string
 *   donor_photo       File     (optional — เก็บไว้แต่ยังไม่ใช้สำหรับ face-edit)
 *   donor_name        string
 *   donor_position    string
 *   condolence_text   string
 *   deceased_name     string
 *   funeral_place     string
 */
export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    const where = process.env.NODE_ENV === "production"
      ? "Vercel → Settings → Environment Variables"
      : ".env.local";
    return NextResponse.json(
      { error: `ไม่มี OPENAI_API_KEY กรุณาตั้งค่าใน ${where}` },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const donationId     = (form.get("donation_id")    as string | null) || null;
  const memorialId     = (form.get("memorial_id")    as string | null) || null;
  const templateKey    = (form.get("template_key")   as AiPhotoTemplateKey | null) ?? "standing_with_label";
  const donorName      = (form.get("donor_name")     as string | null) ?? "ผู้ร่วมบุญ";
  const donorPosition  = (form.get("donor_position") as string | null) ?? "";
  const condolenceText = (form.get("condolence_text") as string | null) ?? "ร่วมอาลัยและร่วมทำบุญ";
  const deceasedName   = (form.get("deceased_name")  as string | null) ?? "";
  const funeralPlace   = (form.get("funeral_place")  as string | null) ?? "";

  const supabase = createAdminClient();

  // ── Credit check ───────────────────────────────────────────────────
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

      const existingImageUrl =
        (prev as { generated_image_url?: string } | null)?.generated_image_url ?? null;

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

  // ── Build prompt ────────────────────────────────────────────────────
  const template = getAiPhotoTemplate(templateKey);
  const finalPrompt = buildAiPhotoPrompt({
    templateKey: template.templateKey,
    donorName,
    donorPosition,
    condolenceText,
    deceasedName,
    funeralPlace,
  });

  // ── Call DALL-E 3 (text-to-image) — เร็ว 5-15 วินาที ───────────────
  let generatedImageUrl: string | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1792",
        quality: "standard",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `OpenAI ${res.status}`);

    const item = (data.data ?? [])[0] as { url?: string; b64_json?: string } | undefined;
    if (item?.b64_json) {
      generatedImageUrl = `data:image/png;base64,${item.b64_json}`;
    } else if (item?.url) {
      generatedImageUrl = item.url;
    } else {
      throw new Error("ไม่ได้รับภาพจาก AI กรุณาลองใหม่");
    }
  } catch (e) {
    errorMessage = (e as Error).message;
  }

  // ── Record request log ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("ai_photo_requests") as any).insert({
    donation_id:         donationId,
    memorial_id:         memorialId,
    template_key:        templateKey,
    final_prompt:        finalPrompt,
    generated_image_url: generatedImageUrl,
    status:              generatedImageUrl ? "completed" : "failed",
    error_message:       errorMessage,
    completed_at:        new Date().toISOString(),
  }).catch(() => {});

  // ── Update credit on success ────────────────────────────────────────
  if (donationId && generatedImageUrl) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("ai_photo_credits") as any)
      .select("used_count")
      .eq("donation_id", donationId)
      .single();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("ai_photo_credits") as any)
        .update({ used_count: (existing as { used_count: number }).used_count + 1, updated_at: new Date().toISOString() })
        .eq("donation_id", donationId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("ai_photo_credits") as any)
        .insert({ donation_id: donationId, free_quota: 1, used_count: 1 });
    }
  }

  if (!generatedImageUrl) {
    return NextResponse.json(
      { error: errorMessage ?? "สร้างภาพไม่สำเร็จ กรุณาลองใหม่" },
      { status: 500 }
    );
  }

  return NextResponse.json({ imageUrl: generatedImageUrl, templateKey, creditUsed: Boolean(donationId) });
}

import { NextRequest, NextResponse } from "next/server";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";
import { editOpenAIImage, generateOpenAIImage } from "@/lib/openai-image";

// Allow enough time for GPT Image requests on Vercel.
export const runtime = "nodejs";
export const maxDuration = 300;

const STYLE_PROMPTS: Record<string, string> = {
  temple:
    "Photorealistic Thai Buddhist funeral ceremony hall interior. Elegant white chrysanthemum flower arrangements, soft warm candlelight, ornate golden altar with incense burner and framed portrait, cream and gold color palette, cinematic lighting, no people present.",
  garden:
    "Serene Thai memorial garden at dawn. White lotus and chrysanthemum flower arrangements lining a stone path, soft diffused morning light filtering through trees, traditional Thai garden lanterns, peaceful white and green tones, no people present.",
  pavilion:
    "Traditional Thai open temple pavilion, ornate carved wooden architecture painted red and gold, white floral garlands draped across beams, soft golden hour sunlight, blue sky, no people present.",
  luxury:
    "Grand luxurious Thai funeral reception hall. Towering white floral arrangements in marble vases, warm amber lighting, polished teak wood walls, white silk curtains, crystal chandeliers, no people present.",
  river:
    "Peaceful Thai riverside at golden sunset. White lotus flowers floating on still water, warm orange and gold reflections, traditional wooden boats, white jasmine garlands, serene memorial atmosphere.",
  royal:
    "Majestic Thai royal crematorium architecture. Multi-tiered golden spires, intricate gilded floral ornamentation, white jasmine garlands, dramatic cinematic lighting, sacred ceremonial atmosphere, no people present.",
};

const POSE_TO_TEMPLATE: Record<string, AiPhotoTemplateKey> = {
  stand: "standing_with_label",
  bow: "mourning_wai",
  kneel: "host_receiving",
};

async function handleTemplateForm(request: NextRequest) {
  const form = await request.formData();
  const donorPhoto = form.get("donor_photo") as File | null;
  const templateKey =
    (form.get("template_key") as AiPhotoTemplateKey | null) ??
    "standing_with_label";
  const donorName = (form.get("donor_name") as string | null) ?? "ผู้ร่วมบุญ";
  const donorPosition = (form.get("donor_position") as string | null) ?? "";
  const condolenceText =
    (form.get("condolence_text") as string | null) ??
    "ร่วมอาลัยและร่วมทำบุญ";
  const deceasedName = (form.get("deceased_name") as string | null) ?? "";
  const funeralPlace = (form.get("funeral_place") as string | null) ?? "";
  const donorGender = (form.get("donor_gender") as string | null) ?? "male";
  const donorAgeRange = (form.get("donor_age_range") as string | null) ?? "46-60 years old";
  const requestedCount = Number(form.get("count") ?? 1);
  const normalizedCount = Math.max(
    1,
    Number.isFinite(requestedCount) ? requestedCount : 1
  );
  const count =
    donorPhoto && donorPhoto.size > 0
      ? Math.min(2, normalizedCount)
      : Math.min(4, normalizedCount);

  const template = getAiPhotoTemplate(templateKey);
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  let promptOverride: string | undefined;
  let negativeOverride: string | undefined;
  try {
    const { data } = await (supabase.from("ai_photo_templates") as any)
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
  const prompt = buildAiPhotoPrompt({
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

  const images =
    donorPhoto && donorPhoto.size > 0
      ? await editOpenAIImage(prompt, donorPhoto, count)
      : await generateOpenAIImage(prompt, count);

  return NextResponse.json({
    images,
    url: images[0] ?? "",
    prompt,
    templateKey: template.templateKey,
  });
}

async function handleLegacyJson(request: NextRequest) {
  const body = await request.json();
  const styleId = body.styleId as string | undefined;
  const pose = body.pose as string | undefined;

  const prompt = styleId
    ? STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS.temple
    : buildAiPhotoPrompt({
        templateKey: POSE_TO_TEMPLATE[pose ?? "stand"] ?? "standing_with_label",
        donorName: body.donorName ?? "ผู้ร่วมบุญ",
        donorPosition: body.donorTitle ?? "",
        condolenceText: body.message ?? "ร่วมอาลัยและร่วมทำบุญ",
        deceasedName: body.deceasedName ?? "",
        funeralPlace: body.funeralPlace ?? "",
        donorGender: body.donorGender ?? "male",
        donorAgeRange: body.donorAgeRange ?? "46-60 years old",
      });

  const images = await generateOpenAIImage(prompt, 1);
  return NextResponse.json({ url: images[0] ?? "", images, prompt });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "ไม่มี OPENAI_API_KEY กรุณาตั้งค่าใน .env.local" },
      { status: 503 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      return await handleTemplateForm(req);
    }
    return await handleLegacyJson(req);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาดระหว่างสร้างภาพ",
      },
      { status: 500 }
    );
  }
}

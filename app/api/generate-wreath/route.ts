import { NextRequest, NextResponse } from "next/server";
import {
  buildAiPhotoPrompt,
  getAiPhotoTemplate,
  type AiPhotoTemplateKey,
} from "@/lib/ai-photo-templates";

// ต้องอยู่บนสุด — Vercel Pro รองรับสูงสุด 300 วินาที
export const maxDuration = 300;

const STYLE_PROMPTS: Record<string, string> = {
  temple:
    "Photorealistic Thai Buddhist funeral ceremony hall interior. Elegant white chrysanthemum flower arrangements, soft warm candlelight, ornate golden altar with incense burner and framed portrait, cream and gold color palette, cinematic dramatic lighting, no people present. Ultra high detail, 4K quality.",
  garden:
    "Serene Thai memorial garden at dawn. White lotus and chrysanthemum flower arrangements lining a stone path, soft diffused morning light filtering through trees, traditional Thai garden lanterns, peaceful white and green tones, no people present. Ultra high detail, 4K quality.",
  pavilion:
    "Traditional Thai open temple pavilion, ornate carved wooden architecture painted red and gold, white floral garlands draped across beams, soft golden hour sunlight, blue sky with light clouds, no people present. Ultra high detail, 4K quality.",
  luxury:
    "Grand luxurious Thai funeral reception hall. Towering white floral arrangements in marble vases, warm sophisticated amber lighting, dark polished teak wood walls, draped white silk curtains, crystal chandeliers casting golden light, no people present. Ultra high detail, 4K quality.",
  river:
    "Peaceful Thai riverside at golden sunset. White lotus flowers floating on still water, warm orange and gold reflections on river surface, traditional wooden boats, white jasmine garlands, serene memorial atmosphere, no people present. Ultra high detail, 4K quality.",
  royal:
    "Majestic Thai royal crematorium architecture. Multi-tiered golden spires, intricate gilded floral ornamentation, white jasmine garlands draped across golden frames, dramatic cinematic lighting, sacred ceremonial atmosphere, no people present. Ultra high detail, 4K quality.",
};

const POSE_TO_TEMPLATE: Record<string, AiPhotoTemplateKey> = {
  stand: "standing_with_label",
  bow: "mourning_wai",
  kneel: "host_receiving",
};

function imageResultToUrl(item: { b64_json?: string; url?: string }) {
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  return item.url ?? "";
}

// DALL-E 3 text-to-image (เร็ว 5-15 วิ)
async function callDallE3(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1792",
      quality: "standard",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI image generation failed");
  return ((data.data ?? []) as Array<{ b64_json?: string; url?: string }>)
    .map(imageResultToUrl)
    .filter(Boolean);
}

// gpt-image-1 edit with donor photo (ช้า แต่มี face reference)
async function callOpenAIEdit(prompt: string, donorPhoto: File, n = 1) {
  const body = new FormData();
  body.append("model", process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1");
  body.append("prompt", prompt);
  body.append("n", String(n));
  body.append("size", "1024x1536");
  body.append("quality", "medium");
  body.append("image", donorPhoto, donorPhoto.name || "donor-photo.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "OpenAI image edit failed");
  return ((data.data ?? []) as Array<{ b64_json?: string; url?: string }>)
    .map(imageResultToUrl)
    .filter(Boolean);
}

async function handleTemplateForm(request: NextRequest) {
  const form = await request.formData();
  const donorPhoto    = form.get("donor_photo") as File | null;
  const templateKey   = (form.get("template_key") as AiPhotoTemplateKey | null) ?? "standing_with_label";
  const donorName     = (form.get("donor_name")     as string | null) ?? "ผู้ร่วมบุญ";
  const donorPosition = (form.get("donor_position") as string | null) ?? "";
  const condolenceText = (form.get("condolence_text") as string | null) ?? "";
  const deceasedName  = (form.get("deceased_name")  as string | null) ?? "";
  const funeralPlace  = (form.get("funeral_place")  as string | null) ?? "";
  const requestedCount = Number(form.get("count") ?? 3);
  const count = Math.min(4, Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 3));

  const template = getAiPhotoTemplate(templateKey);
  const prompt = buildAiPhotoPrompt({ templateKey: template.templateKey, donorName, donorPosition, condolenceText, deceasedName, funeralPlace });

  // ถ้ามีรูปผู้มอบ → ใช้ edit API (face reference), ไม่มี → ใช้ DALL-E 3
  let images: string[];
  if (donorPhoto && donorPhoto.size > 0) {
    images = await callOpenAIEdit(prompt, donorPhoto, count);
  } else {
    const img = await callDallE3(prompt);
    images = Array(count).fill(img[0] ?? "").filter(Boolean);
  }

  return NextResponse.json({ images, url: images[0] ?? "", prompt, templateKey: template.templateKey });
}

async function handleLegacyJson(request: NextRequest) {
  const body = await request.json();
  const styleId = body.styleId as string | undefined;
  const pose    = body.pose    as string | undefined;

  const prompt = styleId
    ? STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS.temple
    : buildAiPhotoPrompt({
        templateKey: POSE_TO_TEMPLATE[pose ?? "stand"] ?? "standing_with_label",
        donorName: body.donorName ?? "ผู้ร่วมบุญ",
        donorPosition: body.donorTitle ?? "",
        condolenceText: body.message ?? "ร่วมอาลัยและร่วมทำบุญ",
        deceasedName: body.deceasedName ?? "",
        funeralPlace: body.funeralPlace ?? "",
      });

  const images = await callDallE3(prompt);
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
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

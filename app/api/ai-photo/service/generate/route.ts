/**
 * Local AI service endpoint — used when AI_SERVICE_URL is not configured.
 * Accepts the same format as the external AI service:
 *   POST multipart/form-data: { prompt, count?, donor_photo?, host_photo? }
 * Returns: { images: string[] }
 *
 * This route calls OpenAI directly using OPENAI_API_KEY.
 */

import { NextRequest, NextResponse } from "next/server";
import { editOpenAIImage, generateOpenAIImage } from "@/lib/openai-image";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบ request ไม่ถูกต้อง" }, { status: 400 });
  }

  const prompt = (form.get("prompt") as string | null)?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "ไม่มี prompt" }, { status: 400 });
  }

  const donorPhoto = form.get("donor_photo") as File | null;

  try {
    let images: string[];

    if (donorPhoto && donorPhoto.size > 0) {
      images = await editOpenAIImage(prompt, donorPhoto, 1);
    } else {
      images = await generateOpenAIImage(prompt, 1);
    }

    return NextResponse.json({ images });
  } catch (e) {
    const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาดระหว่างสร้างภาพ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

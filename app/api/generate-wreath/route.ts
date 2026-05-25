import { NextRequest, NextResponse } from "next/server";

const POSE_PROMPTS: Record<string, string> = {
  stand: "A Thai man in formal black suit standing upright and holding a rectangular white sign/placard with both hands at chest height. Full body visible, head clearly at top 15% of the image frame. The person faces forward.",
  bow: "A Thai man in formal black suit standing with hands pressed together in a respectful Thai wai gesture (prayer hands). Head bowed slightly, full body visible, head at top 18% of the image.",
  kneel: "A Thai man in formal black suit kneeling respectfully on one knee with hands folded. Full figure visible, head at top 28% of the image frame.",
};

export async function POST(req: NextRequest) {
  const { pose = "stand", donorName = "", donorTitle = "" } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ไม่มี OPENAI_API_KEY — กรุณาตั้งค่าใน .env.local" },
      { status: 503 }
    );
  }

  const poseDesc = POSE_PROMPTS[pose] ?? POSE_PROMPTS.stand;
  const nameDesc = donorName ? `The sign reads "${donorName}${donorTitle ? ` — ${donorTitle}` : ""}"` : "The sign has Thai text on it";

  const prompt = `Photorealistic image of a Thai Buddhist funeral ceremony hall interior. Elegant white chrysanthemum flower arrangements, soft warm candlelight, golden altar in the background with a framed portrait. ${poseDesc} ${nameDesc}. Portrait orientation (3:4), respectful and dignified atmosphere, cream and gold tones, cinematic lighting. No other people visible.`;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
    if (!res.ok) throw new Error(data.error?.message ?? "OpenAI API error");

    const imageUrl: string = data.data[0].url;
    const imgRes = await fetch(imageUrl);
    const imgBuf = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuf).toString("base64");

    return NextResponse.json({ url: `data:image/png;base64,${base64}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

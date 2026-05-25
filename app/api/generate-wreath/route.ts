import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ไม่มี OPENAI_API_KEY — กรุณาตั้งค่าใน .env.local" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Thai Buddhist funeral ceremony background for a memorial wreath display board. ${prompt}. Photorealistic, respectful and serene atmosphere, soft lighting, no text, no people faces visible.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message ?? "OpenAI API error");
    }

    const imageUrl: string = data.data[0].url;

    // Fetch and convert to base64 so html2canvas can capture it without CORS issues
    const imgRes = await fetch(imageUrl);
    const imgBuf = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuf).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ url: dataUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}

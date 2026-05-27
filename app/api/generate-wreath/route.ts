import { NextRequest, NextResponse } from "next/server";

const STYLE_PROMPTS: Record<string, string> = {
  temple:
    "Photorealistic Thai Buddhist funeral ceremony hall interior. Elegant white chrysanthemum flower arrangements, soft warm candlelight, ornate golden altar with incense burner and framed portrait, cream and gold color palette, cinematic dramatic lighting, no people present. Ultra high detail, 4K quality.",
  garden:
    "Serene Thai memorial garden at dawn. White lotus and chrysanthemum flower arrangements lining a stone path, soft diffused morning light filtering through trees, traditional Thai garden lanterns, peaceful white and green tones, no people present. Ultra high detail, 4K quality.",
  pavilion:
    "Traditional Thai open temple pavilion (sala), ornate carved wooden architecture painted red and gold, white floral garlands draped across beams, soft golden hour sunlight, blue sky with light clouds, no people present. Ultra high detail, 4K quality.",
  luxury:
    "Grand luxurious Thai funeral reception hall. Towering white floral arrangements in marble vases, warm sophisticated amber lighting, dark polished teak wood walls, draped white silk curtains, crystal chandeliers casting golden light, no people present. Ultra high detail, 4K quality.",
  river:
    "Peaceful Thai riverside at golden sunset. White lotus flowers floating on still water, warm orange and gold reflections on river surface, traditional wooden boats, white jasmine garlands, serene memorial atmosphere, no people present. Ultra high detail, 4K quality.",
  royal:
    "Majestic Thai royal crematorium architecture (Phra Meru Mas). Multi-tiered golden spires, intricate gilded floral ornamentation, white jasmine garlands draped across golden frames, dramatic cinematic lighting, sacred ceremonial atmosphere, no people present. Ultra high detail, 4K quality.",
};

export async function POST(req: NextRequest) {
  const { styleId = "temple" } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ไม่มี OPENAI_API_KEY — กรุณาตั้งค่าใน .env.local" },
      { status: 503 }
    );
  }

  const prompt = STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS.temple;

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
        size: "1024x1024",
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

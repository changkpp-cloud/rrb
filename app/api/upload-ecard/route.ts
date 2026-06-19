import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { imageDataUrl?: string; memorialId?: string };
    const { imageDataUrl, memorialId } = body;

    if (!imageDataUrl || !memorialId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const base64 = imageDataUrl.replace(/^data:image\/[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const supabase = createAdminClient();
    const path = `ecards/${memorialId}.png`;

    const { error } = await supabase.storage
      .from("memorials")
      .upload(path, buffer, { contentType: "image/png", upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: signed } = await supabase.storage
      .from("memorials")
      .createSignedUrl(path, 3600);

    return NextResponse.json({ url: signed?.signedUrl ?? null });
  } catch (err) {
    console.error("upload-ecard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

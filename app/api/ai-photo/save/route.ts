import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { donationId, memorialId, imageUrl, templateKey, prompt } =
    await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Log request (best-effort — errors ignored)
  await supabase.from("ai_photo_requests").insert({
    donation_id: donationId || null,
    memorial_id: memorialId || null,
    template_key: templateKey || null,
    final_prompt: prompt || null,
    generated_image_url: imageUrl,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ saved: true });
}

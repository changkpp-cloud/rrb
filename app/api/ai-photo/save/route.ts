import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { donationId, memorialId, imageUrl, templateKey, prompt } =
    await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Log request (best-effort)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("ai_photo_requests") as any)
    .insert({
      donation_id: donationId || null,
      memorial_id: memorialId || null,
      template_key: templateKey || null,
      final_prompt: prompt || null,
      generated_image_url: imageUrl,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .catch(() => {});

  // Update credit (only when donationId provided)
  if (donationId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("ai_photo_credits") as any)
      .select("used_count")
      .eq("donation_id", donationId)
      .single();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("ai_photo_credits") as any)
        .update({
          used_count:
            (existing as { used_count: number }).used_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("donation_id", donationId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("ai_photo_credits") as any).insert({
        donation_id: donationId,
        free_quota: 1,
        used_count: 1,
      });
    }
  }

  return NextResponse.json({ saved: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/ai-photo/credits?donation_id={uuid}
 *
 * Returns the credit status for a given donation:
 * - canGenerate: boolean  (true = free quota available)
 * - usedCount: number
 * - freeQuota: number     (always 1)
 * - existingImageUrl: string | null  (previously generated image)
 */
export async function GET(req: NextRequest) {
  const donationId = req.nextUrl.searchParams.get("donation_id");
  if (!donationId) {
    return NextResponse.json({ error: "donation_id required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: credit } = await (supabase.from("ai_photo_credits") as any)
    .select("*")
    .eq("donation_id", donationId)
    .single();

  if (!credit) {
    return NextResponse.json({
      canGenerate: true,
      usedCount: 0,
      freeQuota: 1,
      existingImageUrl: null,
    });
  }

  const c = credit as { free_quota: number; used_count: number };

  // Fetch existing image if already generated
  let existingImageUrl: string | null = null;
  if (c.used_count >= c.free_quota) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prev } = await (supabase.from("ai_photo_requests") as any)
      .select("generated_image_url")
      .eq("donation_id", donationId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    existingImageUrl =
      (prev as { generated_image_url?: string } | null)?.generated_image_url ?? null;
  }

  return NextResponse.json({
    canGenerate: c.used_count < c.free_quota,
    usedCount: c.used_count,
    freeQuota: c.free_quota,
    existingImageUrl,
  });
}

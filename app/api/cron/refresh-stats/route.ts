import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Bangkok is UTC+7 — derive today's date server-side without a timezone library.
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: centers, error: centersError } = await supabase
    .from("centers")
    .select("id")
    .eq("status", "active");

  if (centersError) {
    return NextResponse.json({ error: centersError.message }, { status: 500 });
  }

  const rows = centers ?? [];

  const results = await Promise.allSettled(
    rows.map((center) =>
      supabase.rpc("refresh_center_daily_stats", {
        p_center_id: center.id,
        p_report_date: today,
      })
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    refreshed: rows.length,
    failed,
    date: today,
  });
}

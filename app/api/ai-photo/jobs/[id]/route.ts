import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

function absoluteJobUrl(req: NextRequest, jobId: string) {
  const origin =
    getSiteUrl() ||
    req.headers.get("origin") ||
    new URL(req.url).origin;
  return `${origin}/ai-photo/jobs/${jobId}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("ai_photo_requests") as any)
    .select("id, status, generated_image_url, error_message, created_at, completed_at, template_key")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "ไม่พบงานเจนภาพนี้" }, { status: 404 });
  }

  const row = data as {
    id: string;
    status: string;
    generated_image_url?: string | null;
    error_message?: string | null;
    created_at?: string;
    completed_at?: string | null;
    template_key?: string | null;
  };

  return NextResponse.json({
    jobId: row.id,
    jobUrl: absoluteJobUrl(req, row.id),
    status: row.status,
    imageUrl: row.generated_image_url ?? null,
    error: row.error_message ?? null,
    createdAt: row.created_at ?? null,
    completedAt: row.completed_at ?? null,
    templateKey: row.template_key ?? null,
  });
}

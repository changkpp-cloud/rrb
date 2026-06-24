import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createAdminClient();

  // Verify memorial exists and is active
  const { data: memorial, error: fetchErr } = await supabase
    .from("memorials")
    .select("id, funeral_status, center_id")
    .eq("id", id)
    .single();

  if (fetchErr || !memorial) {
    return NextResponse.json({ error: "ไม่พบงานศพ" }, { status: 404 });
  }

  // ตรวจสิทธิ์: ต้องเป็นศูนย์เจ้าของงาน (หรือแอดมิน)
  const access = await getCenterAccess((memorial as { center_id?: string | null }).center_id ?? "");
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ปิดงานนี้" }, { status: 403 });
  }
  if (memorial.funeral_status === "closed") {
    return NextResponse.json({ error: "ปิดงานนี้ไปแล้ว" }, { status: 400 });
  }

  const hostExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("memorials")
    .update({ funeral_status: "closed", host_expires_at: hostExpiresAt })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, host_expires_at: hostExpiresAt });
}

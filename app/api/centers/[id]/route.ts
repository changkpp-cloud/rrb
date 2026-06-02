import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Block deletion if center has active memorials
  const { data: active } = await supabase
    .from("memorials")
    .select("id")
    .eq("center_id", id)
    .eq("funeral_status", "active")
    .limit(1);

  if (active && active.length > 0) {
    return NextResponse.json(
      { error: "ไม่สามารถลบได้ — ยังมีงานศพที่เปิดอยู่ในศูนย์นี้ กรุณาปิดงานก่อน" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("centers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

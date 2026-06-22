import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Get all memorial ids for this center
  const { data: memorials } = await supabase
    .from("memorials")
    .select("id")
    .eq("center_id", id);

  const memorialIds = (memorials ?? []).map((m) => m.id);

  if (memorialIds.length > 0) {
    // Delete donations
    await supabase.from("donations").delete().in("memorial_id", memorialIds);
    // Delete print_jobs
    await supabase.from("print_jobs").delete().in("memorial_id", memorialIds);
    // Delete memorials
    await supabase.from("memorials").delete().in("id", memorialIds);
  }

  // Delete center
  const { error } = await supabase.from("centers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, deletedMemorials: memorialIds.length });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, funeral_status")
    .eq("id", id)
    .single();

  if (fetchErr || !memorial) {
    return NextResponse.json({ error: "ไม่พบงานศพ" }, { status: 404 });
  }
  if (memorial.funeral_status === "closed") {
    return NextResponse.json({ error: "ปิดงานนี้ไปแล้ว" }, { status: 400 });
  }

  const { error } = await supabase
    .from("memorials")
    .update({ funeral_status: "closed" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

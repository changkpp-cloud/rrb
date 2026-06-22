import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess } from "@/lib/iam";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memorialId } = await params;

  const supabase = createAdminClient();
  const { data: memorial } = await supabase
    .from("memorials")
    .select("id, center_id, funeral_status, host_bank_account_number, transfer_confirmed_at")
    .eq("id", memorialId)
    .maybeSingle();

  if (!memorial) {
    return NextResponse.json({ error: "ไม่พบงานศพ" }, { status: 404 });
  }

  const centerId = memorial.center_id;
  if (!centerId) {
    return NextResponse.json({ error: "งานนี้ไม่ได้ผูกกับศูนย์" }, { status: 400 });
  }

  const access = await getCenterAccess(centerId);
  if (!access.allowed) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  if (memorial.funeral_status !== "closed") {
    return NextResponse.json({ error: "ต้องปิดงานก่อนยืนยันการโอนเงิน" }, { status: 400 });
  }

  if (!memorial.host_bank_account_number) {
    return NextResponse.json({ error: "เจ้าภาพยังไม่ได้กรอกบัญชีรับเงิน" }, { status: 400 });
  }

  if (memorial.transfer_confirmed_at) {
    return NextResponse.json({ error: "ยืนยันการโอนเงินแล้ว" }, { status: 409 });
  }

  const confirmedBy = access.user?.display_name ?? (access.legacy ? "center" : "admin");

  const { error } = await supabase
    .from("memorials")
    .update({
      transfer_confirmed_at: new Date().toISOString(),
      transfer_confirmed_by: confirmedBy,
    })
    .eq("id", memorialId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, confirmedBy });
}

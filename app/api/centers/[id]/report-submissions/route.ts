import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork, roleLabel } from "@/lib/iam";

// ศูนย์ทำเครื่องหมายว่า "ส่งรายงานงวดนี้ให้ อปท. แล้ว" (หรือยกเลิก) → ใช้ทำ compliance tracker
// อปท. (lgo_observer) ดูสถานะอย่างเดียว — เปลี่ยนสถานะไม่ได้ (canEditCenterWork = false)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing center id" }, { status: 400 });

  const access = await getCenterAccess(id);
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์บันทึกการส่งรายงานของศูนย์นี้" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const periodType = String((body as { period_type?: string }).period_type ?? "");
  const periodKey = String((body as { period_key?: string }).period_key ?? "").trim();
  const submitted = (body as { submitted?: boolean }).submitted !== false; // default = mark submitted

  if (periodType !== "month" && periodType !== "year") {
    return NextResponse.json({ error: "period_type ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!periodKey) {
    return NextResponse.json({ error: "ไม่พบงวดเวลา" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (!submitted) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("center_report_submissions")
      .delete()
      .eq("center_id", id)
      .eq("period_type", periodType)
      .eq("period_key", periodKey);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, submitted: false });
  }

  const submittedBy = access.user?.display_name ?? roleLabel(access.role);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("center_report_submissions")
    .upsert(
      {
        center_id: id,
        period_type: periodType,
        period_key: periodKey,
        submitted_at: new Date().toISOString(),
        submitted_by: submittedBy,
      },
      { onConflict: "center_id,period_type,period_key" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, submitted: true });
}

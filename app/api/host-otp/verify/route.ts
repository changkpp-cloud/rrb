import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";
import { normalizePhone } from "@/lib/otp";

// ยืนยัน OTP เบอร์เจ้าภาพ "ก่อนเปิดงาน" → mark verified_at
// create API จะเช็กแถวที่ verified แล้ว (ภายใน OTP_VERIFY_WINDOW_MS) ก่อนตั้ง host_phone_verified
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const centerId = String((body as { center_id?: string }).center_id ?? "");
  const phone = normalizePhone((body as { phone?: string }).phone ?? "");
  const code = String((body as { code?: string }).code ?? "").trim();
  if (!centerId) return NextResponse.json({ error: "ไม่พบศูนย์ที่เปิดงาน" }, { status: 400 });
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "กรุณากรอกรหัส 6 หลัก" }, { status: 400 });

  const access = await getCenterAccess(centerId);
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เปิดงานในศูนย์นี้" }, { status: 403 });
  }

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any).from("host_otp_requests")
    .select("id, code, expires_at")
    .eq("center_id", centerId)
    .eq("phone", phone)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "ยังไม่ได้ขอรหัส OTP กรุณากด \"ส่งรหัส\" ก่อน" }, { status: 400 });
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่" }, { status: 400 });
  }
  if (row.code !== code) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("host_otp_requests")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

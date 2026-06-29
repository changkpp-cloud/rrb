import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";

// ยืนยัน OTP เบอร์เจ้าภาพ → host_phone_verified = true (ใช้เบอร์นี้สร้าง PromptPay QR หน้าโอน)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const code = String((body as { code?: string }).code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "กรุณากรอกรหัส 6 หลัก" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: memorial, error: fetchErr } = await supabase
    .from("memorials")
    .select("id, center_id, host_otp_code, host_otp_expires_at")
    .eq("id", id)
    .single();
  if (fetchErr || !memorial) return NextResponse.json({ error: "ไม่พบงานศพ" }, { status: 404 });

  const access = await getCenterAccess((memorial as { center_id?: string | null }).center_id ?? "");
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ยืนยันบัญชีงานนี้" }, { status: 403 });
  }

  const m = memorial as { host_otp_code: string | null; host_otp_expires_at: string | null };
  if (!m.host_otp_code) {
    return NextResponse.json({ error: "ยังไม่ได้ขอรหัส OTP กรุณากด \"ส่งรหัส\" ก่อน" }, { status: 400 });
  }
  if (m.host_otp_expires_at && new Date(m.host_otp_expires_at) < new Date()) {
    return NextResponse.json({ error: "รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่" }, { status: 400 });
  }
  if (m.host_otp_code !== code) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
  }

  const { error } = await supabase
    .from("memorials")
    .update({
      host_phone_verified: true,
      host_otp_code: null,
      host_otp_expires_at: null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

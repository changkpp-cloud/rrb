import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";
import { generateOtp, normalizePhone, isValidThaiMobile, OTP_TTL_MS } from "@/lib/otp";
import { isSmsConfigured, sendOtpSms } from "@/lib/sms";

// ส่ง OTP ไปเบอร์เจ้าภาพ (เจ้าหน้าที่ศูนย์ช่วยทำตอนเปิดงาน/หน้าเคาน์เตอร์ หรือแก้บัญชีภายหลัง)
// ส่ง SMS จริงผ่าน ThaiBulkSMS ถ้าตั้ง env ครบ · ถ้าไม่ตั้ง → โหมดทดสอบ (คืน devCode ให้โชว์บนจอ)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone((body as { phone?: string }).phone ?? "");
  if (!isValidThaiMobile(phone)) {
    return NextResponse.json({ error: "เบอร์มือถือไม่ถูกต้อง (ต้องเป็น 0 ตามด้วย 9 หลัก)" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: memorial, error: fetchErr } = await supabase
    .from("memorials")
    .select("id, center_id")
    .eq("id", id)
    .single();
  if (fetchErr || !memorial) return NextResponse.json({ error: "ไม่พบงานศพ" }, { status: 404 });

  const access = await getCenterAccess((memorial as { center_id?: string | null }).center_id ?? "");
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์ยืนยันบัญชีงานนี้" }, { status: 403 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error } = await supabase
    .from("memorials")
    .update({
      host_phone: phone,
      host_phone_verified: false,
      host_otp_code: code,
      host_otp_expires_at: expiresAt,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const configured = isSmsConfigured();
  if (configured) {
    const sms = await sendOtpSms(phone, code);
    if (!sms.sent) {
      return NextResponse.json(
        { error: `ส่งรหัส OTP ไม่สำเร็จ: ${sms.reason === "error" ? sms.error : "ระบบ SMS ยังไม่พร้อม"}` },
        { status: 502 },
      );
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[OTP] memorial=${id} phone=${phone} code=${code} (โหมดทดสอบ — ยังไม่ตั้งค่า SMS)`);
  }

  return NextResponse.json({
    success: true,
    expiresAt,
    // โหมดทดสอบเท่านั้น: ส่งรหัสกลับให้ UI แสดง · เมื่อตั้งค่า SMS จริงแล้วจะไม่ส่ง devCode
    ...(configured ? {} : { devCode: code }),
  });
}

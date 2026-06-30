import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";
import { generateOtp, normalizePhone, isValidThaiMobile, OTP_TTL_MS } from "@/lib/otp";
import { isSmsConfigured, sendOtpSms } from "@/lib/sms";

// ส่ง OTP ยืนยันเบอร์เจ้าภาพ "ก่อนเปิดงาน" — ตอนกรอกฟอร์มยังไม่มี memorial → ผูกกับ (ศูนย์ + เบอร์)
// ส่ง SMS จริงผ่าน ThaiBulkSMS ถ้าตั้ง env ครบ · ถ้าไม่ตั้ง → โหมดทดสอบ (คืน devCode ให้โชว์บนจอ)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const centerId = String((body as { center_id?: string }).center_id ?? "");
  const phone = normalizePhone((body as { phone?: string }).phone ?? "");
  if (!centerId) return NextResponse.json({ error: "ไม่พบศูนย์ที่เปิดงาน" }, { status: 400 });
  if (!isValidThaiMobile(phone)) {
    return NextResponse.json({ error: "เบอร์มือถือไม่ถูกต้อง (ต้องเป็น 0 ตามด้วย 9 หลัก)" }, { status: 400 });
  }

  const access = await getCenterAccess(centerId);
  if (!access.allowed || !canEditCenterWork(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เปิดงานในศูนย์นี้" }, { status: 403 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const supabase = createAdminClient();
  // host_otp_requests ยังไม่มีใน generated types — cast client ตามแพทเทิร์น repo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("host_otp_requests").insert({
    center_id: centerId,
    phone,
    code,
    expires_at: expiresAt,
  });
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
    console.log(`[OTP] center=${centerId} phone=${phone} code=${code} (โหมดทดสอบ — ยังไม่ตั้งค่า SMS)`);
  }

  return NextResponse.json({
    success: true,
    expiresAt,
    // โหมดทดสอบเท่านั้น: ส่งรหัสกลับให้ UI แสดง · เมื่อตั้งค่า SMS จริงแล้วจะไม่ส่ง devCode
    ...(configured ? {} : { devCode: code }),
  });
}

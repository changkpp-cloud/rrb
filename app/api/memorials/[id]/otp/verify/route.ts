import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canEditCenterWork } from "@/lib/iam";
import type { Database } from "@/lib/supabase/types";

type MemorialUpdate = Database["public"]["Tables"]["memorials"]["Update"];

// ยืนยัน OTP เบอร์เจ้าภาพ → host_phone_verified = true (ใช้เบอร์นี้สร้าง PromptPay QR หน้าโอน)
// + commit บัญชีรับเงินเจ้าภาพ (ชื่อธนาคาร/เลขบัญชี/ชื่อบัญชี) พร้อมกัน — แก้บัญชีต้องผ่าน OTP ทุกครั้ง
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

  const b = body as {
    host_bank_name?: string;
    host_bank_account_number?: string;
    host_bank_account_name?: string;
  };

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

  const update: MemorialUpdate = {
    host_phone_verified: true,
    host_otp_code: null,
    host_otp_expires_at: null,
  };
  if (typeof b.host_bank_name === "string") update.host_bank_name = b.host_bank_name.trim();
  if (typeof b.host_bank_account_number === "string") update.host_bank_account_number = b.host_bank_account_number.trim();
  if (typeof b.host_bank_account_name === "string") update.host_bank_account_name = b.host_bank_account_name.trim();

  const { error } = await supabase
    .from("memorials")
    .update(update)
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

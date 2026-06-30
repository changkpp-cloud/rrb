import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const centerId = String(body.center_id ?? "").trim();
  const displayName = String(body.display_name ?? "").trim();
  const phone = normalizePhone(String(body.phone ?? "").trim());
  const password = String(body.password ?? "");

  if (!centerId || !phone || !displayName || password.length < 8) {
    return NextResponse.json(
      { error: "กรุณากรอกศูนย์ เบอร์มือถือ ชื่อ และรหัสผ่านอย่างน้อย 8 ตัวอักษร" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: center } = await supabase
    .from("centers")
    .select("id")
    .eq("id", centerId)
    .eq("status", "active")
    .maybeSingle();

  if (!center) return NextResponse.json({ error: "ไม่พบศูนย์ที่เลือก" }, { status: 404 });

  const { data: existingUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("phone", phone)
    .limit(1);

  if (existingUser?.[0]) {
    return NextResponse.json({ error: "เบอร์มือถือนี้มีบัญชีในระบบแล้ว กรุณาให้แอดมินเพิ่มสิทธิ์ศูนย์" }, { status: 409 });
  }

  const { data: existingRequest } = await (supabase.from("center_user_requests") as any)
    .select("id")
    .eq("phone", phone)
    .eq("center_id", centerId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json({ error: "มีคำขอสมัครรออนุมัติอยู่แล้ว" }, { status: 409 });
  }

  const { error } = await (supabase.from("center_user_requests") as any).insert({
    center_id: centerId,
    display_name: displayName,
    phone,
    requested_role: "center_manager",
    auth_provider: "password",
    password_hash: hashPassword(password),
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

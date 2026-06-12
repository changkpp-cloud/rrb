import { NextRequest, NextResponse } from "next/server";
import { setCenterUserSession, verifyPassword } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("center_memberships")
    .select("center_id, role, centers(id, name, status)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!membership?.center_id) {
    return NextResponse.json({ error: "บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าศูนย์" }, { status: 403 });
  }

  await setCenterUserSession(user.id);
  await supabase.from("app_users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  const center = Array.isArray(membership.centers) ? membership.centers[0] : membership.centers;
  return NextResponse.json({
    id: membership.center_id,
    name: center?.name ?? "ศูนย์บริหาร",
    role: membership.role,
    user: { id: user.id, display_name: user.display_name, email: user.email },
  });
}

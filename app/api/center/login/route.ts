import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { setCenterUserSession, verifyPassword } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (email || password) return loginWithUser(email, password);
  return loginWithLegacyCenterCode(String(body.code ?? "").trim().toUpperCase());
}

async function loginWithUser(email: string, password: string) {
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

async function loginWithLegacyCenterCode(code: string) {
  if (!code) return NextResponse.json({ error: "กรุณากรอกรหัสศูนย์" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("centers")
    .select("*")
    .eq("center_code", code)
    .eq("status", "active")
    .single();

  if (!data) return NextResponse.json({ error: "ไม่พบรหัสศูนย์นี้" }, { status: 404 });

  const cookieStore = await cookies();
  cookieStore.set("center_session", data.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ id: data.id, name: data.name, legacy: true });
}

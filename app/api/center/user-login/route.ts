import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword, setCenterUserSession } from "@/lib/iam";
import { getCenterRouteKey } from "@/lib/center-route";

export async function POST(req: NextRequest) {
  let body: { email?: unknown; phone?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const identifier = String(body.email ?? body.phone ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมล/เบอร์โทรและรหัสผ่าน" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("app_users")
    .select("*")
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .eq("status", "active")
    .maybeSingle();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "อีเมล/เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const { data: memberships } = await supabase
    .from("center_memberships")
    .select("center_id, role, centers!inner(id, name, center_code, status)")
    .eq("user_id", user.id)
    .eq("status", "active");

  type MembershipWithCenter = {
    center_id: string;
    role: string;
    centers: { id: string; name: string; center_code: string | null; status: string };
  };
  const activeMemberships = ((memberships ?? []) as unknown as MembershipWithCenter[]).filter(
    (m) => m.centers?.status === "active"
  );

  if (activeMemberships.length === 0) {
    return NextResponse.json({ error: "บัญชีนี้ยังไม่มีสิทธิ์เข้าถึงศูนย์ใด กรุณาติดต่อผู้ดูแลระบบ" }, { status: 403 });
  }

  await setCenterUserSession(user.id);

  const centers = activeMemberships.map((m) => ({
    id: m.centers.id,
    name: m.centers.name,
    role: m.role,
    routeKey: getCenterRouteKey(m.centers as { id: string; center_code: string | null }),
  }));

  if (centers.length === 1) {
    return NextResponse.json({ centerId: centers[0].id, routeKey: centers[0].routeKey, name: centers[0].name });
  }

  return NextResponse.json({ centers });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setCenterUserSession, verifyPassword } from "@/lib/iam";

// Dev fallback: if password_hash is stored as plain text (not scrypt:…), compare directly
function checkPassword(input: string, stored: string | null): boolean {
  if (!stored) return false;
  if (!stored.startsWith("scrypt:")) return stored === input;
  return verifyPassword(input, stored);
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Verify credentials against app_users
  const { data: user } = await supabase
    .from("app_users")
    .select("id, email, display_name, password_hash, status")
    .eq("email", email)
    .maybeSingle();

  if (!user || user.status !== "active" || !checkPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  // 2. Get active center memberships (staff-level and above)
  const { data: memberships } = await supabase
    .from("center_memberships")
    .select("center_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["super_admin", "center_manager", "center_staff"]);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ error: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงศูนย์ใด" }, { status: 403 });
  }

  // 3. Fetch details for those centers (active only)
  const centerIds = memberships.map((m) => m.center_id);
  const { data: centers } = await supabase
    .from("centers")
    .select("id, name, center_code, status")
    .in("id", centerIds)
    .eq("status", "active");

  const activeCenters = (centers ?? []).map((c) => {
    const membership = memberships.find((m) => m.center_id === c.id)!;
    return {
      centerId: c.id,
      name: c.name,
      role: membership.role,
      routeKey: c.center_code ?? c.id,
    };
  });

  if (activeCenters.length === 0) {
    return NextResponse.json(
      { error: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงศูนย์ที่เปิดใช้งาน" },
      { status: 403 },
    );
  }

  // 4. Create IAM session — sets center_user_session cookie, verified by getCenterAccess()
  await setCenterUserSession(user.id);

  // 5. Update last login timestamp (best-effort)
  await supabase
    .from("app_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  return NextResponse.json({
    centers: activeCenters,
    user: { id: user.id, displayName: user.display_name, email: user.email },
  });
}

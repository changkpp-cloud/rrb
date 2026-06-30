import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/iam";
import type { AppRole } from "@/lib/iam-utils";

const VALID_ROLES: AppRole[] = ["center_manager", "lgo_observer"];

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { display_name, password, center_id, role, phone } = body as Record<string, string>;
  const normalizedPhone = normalizePhone(phone ?? "");

  if (!normalizedPhone || !display_name?.trim() || !password || !center_id || !role) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role as AppRole)) {
    return NextResponse.json({ error: "สิทธิ์ไม่ถูกต้อง" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: center } = await supabase
    .from("centers")
    .select("id")
    .eq("id", center_id)
    .eq("status", "active")
    .maybeSingle();

  if (!center) {
    return NextResponse.json({ error: "ไม่พบศูนย์ที่เลือก" }, { status: 400 });
  }

  const { data: existingRows } = await supabase
    .from("app_users")
    .select("id, status")
    .eq("phone", normalizedPhone)
    .limit(1);
  const existing = existingRows?.[0];

  if (existing?.status === "active") {
    const { data: membership } = await supabase
      .from("center_memberships")
      .select("id")
      .eq("center_id", center_id)
      .eq("user_id", existing.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      return NextResponse.json({ error: "เบอร์มือถือนี้มีสิทธิ์เข้าศูนย์นี้แล้ว" }, { status: 409 });
    }
  }

  const now = new Date().toISOString();

  const userPayload = {
    display_name: display_name.trim(),
    phone: normalizedPhone,
    password_hash: hashPassword(password),
    auth_provider: "password" as const,
    status: "active" as const,
    approved_at: now,
  };

  const { data: user, error: userError } = existing
    ? await supabase
        .from("app_users")
        .update(userPayload)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase
        .from("app_users")
        .insert(userPayload)
        .select("id")
        .single();

  if (userError || !user) {
    return NextResponse.json({ error: "ไม่สามารถสร้างผู้ใช้ได้" }, { status: 500 });
  }

  const { error: memberError } = await supabase
    .from("center_memberships")
    .upsert(
      {
        center_id,
        user_id: user.id,
        role: role as AppRole,
        status: "active",
        approved_at: now,
      },
      { onConflict: "center_id,user_id" },
    );

  if (memberError) {
    return NextResponse.json({ error: "สร้างผู้ใช้สำเร็จแต่กำหนดสิทธิ์ไม่ได้" }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: user.id });
}

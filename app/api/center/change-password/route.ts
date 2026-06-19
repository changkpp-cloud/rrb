import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterUserSession, verifyPassword, hashPassword } from "@/lib/iam";

export async function POST(req: NextRequest) {
  const session = await getCenterUserSession();
  if (!session) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { current_password, new_password } = body as Record<string, string>;

  if (!current_password || !new_password) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const { user, sessionId } = session;

  if (!verifyPassword(current_password, user.password_hash)) {
    return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
  }

  if (current_password === new_password) {
    return NextResponse.json({ error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error: updateError } = await supabase
    .from("app_users")
    .update({ password_hash: hashPassword(new_password) })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "ไม่สามารถเปลี่ยนรหัสผ่านได้" }, { status: 500 });
  }

  // Invalidate all other sessions (keep current session active)
  await supabase
    .from("app_user_sessions")
    .delete()
    .eq("user_id", user.id)
    .neq("id", sessionId);

  return NextResponse.json({ success: true });
}

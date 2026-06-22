import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: { access_code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const code = String(body.access_code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "กรุณากรอกรหัสเข้าระบบ" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: center } = await supabase
    .from("centers")
    .select("id, name, center_code, status")
    .eq("access_code", code)
    .eq("status", "active")
    .maybeSingle();

  if (!center) {
    return NextResponse.json({ error: "รหัสไม่ถูกต้องหรือศูนย์ไม่ได้เปิดใช้งาน" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("center_session", center.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return NextResponse.json({
    centerId: center.id,
    name: center.name,
    routeKey: center.center_code ?? center.id,
  });
}

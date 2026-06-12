import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "กรุณากรอกรหัสศูนย์" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "กรุณากรอกรหัสศูนย์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase.from("centers") as any)
    .select("id, name, status, center_code, official_lgo_code")
    .or(`access_code.ilike.${code},center_code.ilike.${code},official_lgo_code.ilike.${code}`)
    .maybeSingle();

  if (!center || center.status !== "active") {
    return NextResponse.json({ error: "รหัสศูนย์ไม่ถูกต้องหรือศูนย์ไม่ได้เปิดใช้งาน" }, { status: 401 });
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
    id: center.id,
    name: center.name,
    routeKey: center.center_code || center.official_lgo_code || center.id,
  });
}

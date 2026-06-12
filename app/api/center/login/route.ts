import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.code ?? "").trim();

  if (!code) {
    return NextResponse.json({ error: "กรุณากรอกรหัสเข้าระบบ" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const codeFilter = [
    `access_code.ilike.${code}`,
    `center_code.ilike.${code}`,
    `official_lgo_code.ilike.${code}`,
  ].join(",");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase.from("centers") as any)
    .select("id, name, status")
    .or(codeFilter)
    .maybeSingle();

  if (!center || center.status !== "active") {
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

  return NextResponse.json({ id: center.id, name: center.name });
}

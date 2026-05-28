import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = body.code?.trim().toUpperCase();
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

  return NextResponse.json({ id: data.id, name: data.name });
}

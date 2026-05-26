import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "กรุณากรอกรหัสศูนย์" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("centers")
    .select("*")
    .eq("center_code", code.toUpperCase())
    .eq("status", "active")
    .single();

  if (!data) return NextResponse.json({ error: "ไม่พบรหัสศูนย์นี้" }, { status: 404 });
  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const body = await req.json();
  const { name, center_code, province, amphoe, tambon, municipality, manager_name, phone } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกชื่อศูนย์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("centers")
    .insert({
      name: name.trim(),
      center_code: center_code?.trim().toUpperCase() || null,
      province: province?.trim() || null,
      amphoe: amphoe?.trim() || null,
      tambon: tambon?.trim() || null,
      municipality: municipality?.trim() || null,
      manager_name: manager_name?.trim() || null,
      phone: phone?.trim() || null,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ center: data });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

async function buildCenterCode(
  centerCode: string | null | undefined,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string> {
  const digits = centerCode?.replace(/\D/g, "");
  if (digits?.length === 8) return digits;

  const { count } = await supabase
    .from("centers")
    .select("id", { count: "exact", head: true })
    .like("center_code", "CEN-%");
  const seq = String((count ?? 0) + 1).padStart(6, "0");
  return `CEN-${seq}`;
}

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RRB-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, center_code: rawCenterCode,
    province, amphoe, tambon, municipality,
    manager_name, phone,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกชื่อศูนย์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const center_code = await buildCenterCode(rawCenterCode, supabase);
  const access_code = generateAccessCode();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center, error } = await (supabase.from("centers") as any)
    .insert({
      name: name.trim(),
      official_lgo_code: center_code.length === 8 && /^\d+$/.test(center_code) ? center_code : null,
      center_code,
      access_code,
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

  return NextResponse.json({ center });
}

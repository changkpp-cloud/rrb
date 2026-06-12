import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Generate center_code: อปท 8-digit code, or CEN-NNNNNN for non-อปท centers
async function buildCenterCode(
  officialLgoCode: string | null | undefined,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string> {
  const lgo = officialLgoCode?.replace(/\D/g, "");
  if (lgo?.length === 8) return lgo;

  // Auto-sequence for non-อปท centers
  const { count } = await supabase
    .from("centers")
    .select("id", { count: "exact", head: true })
    .like("center_code", "CEN-%");
  const seq = String((count ?? 0) + 1).padStart(6, "0");
  return `CEN-${seq}`;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    official_lgo_code,
    province,
    amphoe,
    tambon,
    municipality,
    manager_name,
    phone,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกชื่อศูนย์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const center_code = await buildCenterCode(official_lgo_code, supabase);

  const lgoCode = official_lgo_code?.replace(/\D/g, "").slice(0, 8) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("centers") as any)
    .insert({
      name: name.trim(),
      official_lgo_code: lgoCode,
      center_code,
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

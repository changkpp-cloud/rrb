import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/iam";

async function buildCenterCode(
  officialLgoCode: string | null | undefined,
  supabase: ReturnType<typeof createAdminClient>
): Promise<string> {
  const lgo = officialLgoCode?.replace(/\D/g, "");
  if (lgo?.length === 8) return lgo;

  const { count } = await supabase
    .from("centers")
    .select("id", { count: "exact", head: true })
    .like("center_code", "CEN-%");
  const seq = String((count ?? 0) + 1).padStart(6, "0");
  return `CEN-${seq}`;
}

async function createManagerAccount(
  supabase: ReturnType<typeof createAdminClient>,
  centerId: string,
  managerName: string | null,
  email: string,
  password: string,
): Promise<{ iamSkipped: boolean }> {
  try {
    const { data: user, error: userError } = await supabase
      .from("app_users")
      .upsert({
        email,
        display_name: managerName || email.split("@")[0],
        auth_provider: "password",
        password_hash: hashPassword(password),
        status: "active",
        approved_at: new Date().toISOString(),
      }, { onConflict: "email" })
      .select("id")
      .single();

    if (userError || !user?.id) return { iamSkipped: true };

    await supabase.from("center_memberships").upsert({
      center_id: centerId,
      user_id: user.id,
      role: "center_manager",
      status: "active",
      approved_at: new Date().toISOString(),
    }, { onConflict: "center_id,user_id" });

    return { iamSkipped: false };
  } catch {
    return { iamSkipped: true };
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, official_lgo_code,
    province, amphoe, tambon, municipality,
    manager_name, phone,
    manager_email, manager_password,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกชื่อศูนย์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const center_code = await buildCenterCode(official_lgo_code, supabase);
  const lgoCode = official_lgo_code?.replace(/\D/g, "").slice(0, 8) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center, error } = await (supabase.from("centers") as any)
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

  // สร้างบัญชีผู้จัดการถ้ากรอก email+password ไว้
  let iamSkipped = false;
  const email = manager_email?.trim().toLowerCase();
  const password = manager_password ?? "";
  if (email && password.length >= 8) {
    const result = await createManagerAccount(
      supabase, center.id, manager_name?.trim() || null, email, password
    );
    iamSkipped = result.iamSkipped;
  }

  return NextResponse.json({ center, iamSkipped });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemorial } from "@/lib/memorial";
import type { Database } from "@/lib/supabase/types";

type MemorialUpdate = Database["public"]["Tables"]["memorials"]["Update"];

export async function GET() {
  const memorial = await getMemorial();
  return NextResponse.json(memorial);
}

export async function PATCH(req: NextRequest) {
  // legacy endpoint (แก้งาน active ล่าสุด) — จำกัดเฉพาะแอดมิน
  const adminOk = (await cookies()).get("admin_session")?.value === "ok";
  if (!adminOk) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const body = await req.json();

  const allowed = [
    "name", "birth_date", "death_date", "age",
    "ceremony_date", "ceremony_time", "ceremony_location", "ceremony_hall",
    "bank_name", "bank_account_number", "bank_account_name",
  ] as const;

  const updates: MemorialUpdate = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะบันทึก" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("memorials")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const existingMemorial = existing as { id: string } | null;
    if (!existingMemorial) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const { error } = await (supabase.from("memorials") as any)
      .update(updates)
      .eq("id", existingMemorial.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

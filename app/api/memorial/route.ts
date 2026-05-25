import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getMemorial } from "@/lib/memorial";

// Untyped client used only for the admin PATCH to avoid a Supabase generic
// resolution bug where `.update()` infers its parameter as `never`.
function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  const memorial = await getMemorial();
  return NextResponse.json(memorial);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();

  const allowed = [
    "name", "birth_date", "death_date", "age",
    "ceremony_date", "ceremony_time", "ceremony_location", "ceremony_hall",
    "bank_name", "bank_account_number", "bank_account_name",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะบันทึก" }, { status: 400 });
  }

  try {
    const supabase = adminClient();

    const { data: existing } = await supabase
      .from("memorials")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!existing) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const { error } = await supabase
      .from("memorials")
      .update(updates)
      .eq("id", existing.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

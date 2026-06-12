import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeHostCode } from "@/lib/memorial";
import type { Database } from "@/lib/supabase/types";

type MemorialUpdate = Database["public"]["Tables"]["memorials"]["Update"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const cookieStore = await cookies();
  const centerSession = cookieStore.get("center_session")?.value ?? null;
  const adminSession  = cookieStore.get("admin_session")?.value ?? null;

  const body = await req.json() as {
    host_code?: string;
    name?: string;
    birth_date?: string;
    death_date?: string;
    age?: number;
    ceremony_date?: string;
    ceremony_time?: string;
    ceremony_location?: string;
    ceremony_hall?: string | null;
    prayer_date?: string | null;
    prayer_location?: string | null;
    host_name?: string | null;
    host_phone?: string | null;
    host_relationship?: string | null;
  };

  // Determine actor
  let actorType: "center" | "host" | "admin" | null = null;
  let actorId = "";

  if (adminSession === "ok") {
    actorType = "admin";
    actorId = "admin";
  } else if (centerSession) {
    actorType = "center";
    actorId = centerSession;
  } else if (body.host_code) {
    const { data: mem } = await supabase
      .from("memorials")
      .select("host_code")
      .eq("id", id)
      .single();
    if (mem?.host_code && normalizeHostCode(mem.host_code) === normalizeHostCode(body.host_code)) {
      actorType = "host";
      actorId = normalizeHostCode(body.host_code);
    }
  }

  if (!actorType) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข" }, { status: 401 });
  }

  const update: MemorialUpdate = {};
  if (body.name !== undefined)               update.name               = body.name;
  if (body.birth_date !== undefined)         update.birth_date         = body.birth_date;
  if (body.death_date !== undefined)         update.death_date         = body.death_date;
  if (body.age !== undefined)               update.age                = body.age;
  if (body.ceremony_date !== undefined)     update.ceremony_date      = body.ceremony_date;
  if (body.ceremony_time !== undefined)     update.ceremony_time      = body.ceremony_time;
  if (body.ceremony_location !== undefined) update.ceremony_location  = body.ceremony_location;
  if (body.ceremony_hall !== undefined)     update.ceremony_hall      = body.ceremony_hall;
  if (body.prayer_date !== undefined)       update.prayer_date        = body.prayer_date;
  if (body.prayer_location !== undefined)   update.prayer_location    = body.prayer_location;
  if (body.host_name !== undefined)         update.host_name          = body.host_name;
  if (body.host_phone !== undefined)        update.host_phone         = body.host_phone;
  if (body.host_relationship !== undefined) update.host_relationship  = body.host_relationship;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องอัปเดต" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("memorials")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log — best-effort (schema unknown, cast to any)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_logs") as any).insert({
      memorial_id: id,
      actor_type: actorType,
      actor_id: actorId,
      action: "edit_memorial_info",
      details: update,
      created_at: new Date().toISOString(),
    });
  } catch { /* audit failure must not block response */ }

  return NextResponse.json({ success: true, memorial: updated });
}

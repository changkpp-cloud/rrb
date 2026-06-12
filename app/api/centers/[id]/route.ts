import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageCenterSettings, getCenterAccess } from "@/lib/iam";

const EDITABLE_CENTER_FIELDS = [
  "name",
  "official_lgo_code",
  "center_code",
  "access_code",
  "province",
  "amphoe",
  "tambon",
  "municipality",
  "manager_name",
  "phone",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
  "bank_account_image_url",
] as const;

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getCenterAccess(id);

  if (!access.allowed || !canManageCenterSettings(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขข้อมูลศูนย์" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, string | null> = {};

  for (const field of EDITABLE_CENTER_FIELDS) {
    if (field in body) update[field] = cleanText(body[field]);
  }

  if (update.name === null) {
    return NextResponse.json({ error: "กรุณากรอกชื่อศูนย์" }, { status: 400 });
  }

  if (update.official_lgo_code) {
    const officialCode = update.official_lgo_code.replace(/\D/g, "").slice(0, 8);
    update.official_lgo_code = officialCode || null;
  }

  if (update.center_code) update.center_code = update.center_code.toUpperCase();
  if (update.access_code) update.access_code = update.access_code.toUpperCase();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่ต้องอัปเดต" }, { status: 400 });
  }

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("centers") as any)
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, center: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Block deletion if center has active memorials
  const { data: active } = await supabase
    .from("memorials")
    .select("id")
    .eq("center_id", id)
    .eq("funeral_status", "active")
    .limit(1);

  if (active && active.length > 0) {
    return NextResponse.json(
      { error: "ไม่สามารถลบได้ — ยังมีงานศพที่เปิดอยู่ในศูนย์นี้ กรุณาปิดงานก่อน" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("centers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

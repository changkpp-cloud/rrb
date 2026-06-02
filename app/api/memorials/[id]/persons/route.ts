import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string }> };

async function isAuthorized(memorialId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const admin = cookieStore.get("admin_session")?.value;
  if (admin === "ok") return true;
  const center = cookieStore.get("center_session")?.value;
  if (center) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("center_id")
      .eq("id", memorialId)
      .single();
    return !!data;
  }
  // host_code validated via query param for public reads
  return false;
}

// GET — public (donors read allowed-persons)
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const onlyAllowed = req.nextUrl.searchParams.get("all") !== "1";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("memorial_persons") as any)
    .select("id, display_name, relationship, role_in_photo, photo_url, allow_in_sim, is_primary, sort_order")
    .eq("memorial_id", id)
    .order("sort_order", { ascending: true });

  if (onlyAllowed) query = query.eq("allow_in_sim", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ persons: data ?? [] });
}

// POST — add person (host / center / admin)
export async function POST(
  req: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const admin = cookieStore.get("admin_session")?.value;
  const center = cookieStore.get("center_session")?.value;
  if (admin !== "ok" && !center) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });
  }

  const form = await req.formData();
  const display_name = (form.get("display_name") as string | null)?.trim();
  const relationship = (form.get("relationship") as string | null)?.trim();
  const role_in_photo = (form.get("role_in_photo") as string | null)?.trim() ?? "ผู้รับมอบ";
  const allow_in_sim = form.get("allow_in_sim") !== "false";
  const is_primary = form.get("is_primary") === "true";
  const sort_order = parseInt(form.get("sort_order") as string ?? "0", 10);
  const photoFile = form.get("photo") as File | null;

  if (!display_name || !relationship) {
    return NextResponse.json({ error: "กรุณากรอกชื่อและความสัมพันธ์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  let photo_url: string | null = null;

  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `persons/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("memorials")
      .upload(path, photoFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("memorials").getPublicUrl(path);
      photo_url = urlData.publicUrl;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("memorial_persons") as any).insert({
    memorial_id: id,
    display_name,
    relationship,
    role_in_photo,
    photo_url,
    allow_in_sim,
    is_primary,
    sort_order,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ person: data });
}

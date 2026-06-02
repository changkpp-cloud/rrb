import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ id: string; personId: string }> };

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "ok" ||
    !!cookieStore.get("center_session")?.value;
}

// PATCH — update person
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await checkAuth())) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const { id, personId } = await params;
  const supabase = createAdminClient();

  const contentType = req.headers.get("content-type") ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let update: Record<string, any> = {};
  let photoFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    if (form.has("display_name")) update.display_name = (form.get("display_name") as string).trim();
    if (form.has("relationship")) update.relationship = (form.get("relationship") as string).trim();
    if (form.has("role_in_photo")) update.role_in_photo = (form.get("role_in_photo") as string).trim();
    if (form.has("allow_in_sim")) update.allow_in_sim = form.get("allow_in_sim") !== "false";
    if (form.has("is_primary")) update.is_primary = form.get("is_primary") === "true";
    if (form.has("sort_order")) update.sort_order = parseInt(form.get("sort_order") as string, 10);
    photoFile = form.get("photo") as File | null;
  } else {
    update = await req.json();
  }

  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `persons/${id}/${personId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("memorials")
      .upload(path, photoFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("memorials").getPublicUrl(path);
      update.photo_url = urlData.publicUrl;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("memorial_persons") as any)
    .update(update)
    .eq("id", personId)
    .eq("memorial_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ person: data });
}

// DELETE — remove person
export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await checkAuth())) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });

  const { id, personId } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("memorial_persons") as any)
    .delete()
    .eq("id", personId)
    .eq("memorial_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

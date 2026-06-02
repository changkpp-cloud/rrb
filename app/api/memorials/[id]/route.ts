import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminToken } from "@/lib/admin-session";
import type { Database } from "@/lib/supabase/types";

type MemorialUpdate = Database["public"]["Tables"]["memorials"]["Update"];
type Supabase = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

async function uploadDoc(supabase: Supabase, file: File, path: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() ?? "jpg";
  const fullPath = `${path}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("memorials")
    .upload(fullPath, buffer, { contentType: file.type, upsert: true });
  if (error) { console.error("upload error:", error); return null; }
  return supabase.storage.from("memorials").getPublicUrl(fullPath).data.publicUrl;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const formData = await request.formData();
    const supabase = createAdminClient();

    const host_phone               = formData.get("host_phone") as string | null;
    const host_bank_name           = formData.get("host_bank_name") as string | null;
    const host_bank_account_number = formData.get("host_bank_account_number") as string | null;
    const host_bank_account_name   = formData.get("host_bank_account_name") as string | null;

    const passkookFile  = formData.get("passbook")   as File | null;
    const deathCertFile = formData.get("death_cert") as File | null;
    const idCardFile    = formData.get("id_card")    as File | null;

    const [passbook_url, death_cert_url, id_card_url] = await Promise.all([
      passkookFile?.size  ? uploadDoc(supabase, passkookFile,  `host-docs/${id}/passbook`)   : Promise.resolve(null),
      deathCertFile?.size ? uploadDoc(supabase, deathCertFile, `host-docs/${id}/death-cert`) : Promise.resolve(null),
      idCardFile?.size    ? uploadDoc(supabase, idCardFile,    `host-docs/${id}/id-card`)    : Promise.resolve(null),
    ]);

    // Build typed update — only include fields that were provided
    const update: MemorialUpdate = {};
    if (host_phone               !== null) update.host_phone               = host_phone;
    if (host_bank_name           !== null) update.host_bank_name           = host_bank_name;
    if (host_bank_account_number !== null) update.host_bank_account_number = host_bank_account_number;
    if (host_bank_account_name   !== null) update.host_bank_account_name   = host_bank_account_name;
    if (death_cert_url) update.death_certificate_url = death_cert_url;
    if (id_card_url)    update.host_id_card_url      = id_card_url;

    if (Object.keys(update).length === 0 && !passbook_url) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Try with passbook (may not exist in DB yet)
    const updateWithPassbook = passbook_url
      ? { ...update, host_bank_passbook_url: passbook_url } as MemorialUpdate
      : update;

    let { data, error } = await supabase
      .from("memorials")
      .update(updateWithPassbook)
      .eq("id", id)
      .select()
      .single();

    // Fallback: retry without passbook if column doesn't exist
    if (error && error.message.includes("Could not find") && passbook_url) {
      ({ data, error } = await supabase
        .from("memorials")
        .update(update)
        .eq("id", id)
        .select()
        .single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, memorial: data });
  } catch (err) {
    console.error("memorial PATCH error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const centerSession = cookieStore.get("center_session");
  const adminToken = cookieStore.get("admin_session")?.value;
  if (!centerSession?.value && !verifyAdminToken(adminToken)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("memorials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Text fields
    const host_phone               = formData.get("host_phone") as string | null;
    const host_bank_name           = formData.get("host_bank_name") as string | null;
    const host_bank_account_number = formData.get("host_bank_account_number") as string | null;
    const host_bank_account_name   = formData.get("host_bank_account_name") as string | null;

    // File uploads
    const passkookFile  = formData.get("passbook")    as File | null;
    const deathCertFile = formData.get("death_cert")  as File | null;
    const idCardFile    = formData.get("id_card")     as File | null;

    const [passbook_url, death_cert_url, id_card_url] = await Promise.all([
      passkookFile?.size  ? uploadDoc(supabase, passkookFile,  `host-docs/${id}/passbook`)   : Promise.resolve(null),
      deathCertFile?.size ? uploadDoc(supabase, deathCertFile, `host-docs/${id}/death-cert`) : Promise.resolve(null),
      idCardFile?.size    ? uploadDoc(supabase, idCardFile,    `host-docs/${id}/id-card`)    : Promise.resolve(null),
    ]);

    // Build update payload (only send fields that were provided)
    const update: Record<string, unknown> = {};
    if (host_phone               !== null) update.host_phone = host_phone;
    if (host_bank_name           !== null) update.host_bank_name = host_bank_name;
    if (host_bank_account_number !== null) update.host_bank_account_number = host_bank_account_number;
    if (host_bank_account_name   !== null) update.host_bank_account_name = host_bank_account_name;
    if (passbook_url)   update.host_bank_passbook_url  = passbook_url;
    if (death_cert_url) update.death_certificate_url   = death_cert_url;
    if (id_card_url)    update.host_id_card_url        = id_card_url;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    let { data, error } = await supabase
      .from("memorials")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    // Fallback: if passbook column not migrated yet, retry without it
    if (error && error.message.includes("Could not find") && update.host_bank_passbook_url) {
      delete update.host_bank_passbook_url;
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

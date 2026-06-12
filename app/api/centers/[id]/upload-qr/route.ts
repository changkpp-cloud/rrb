import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess, canManageCenterSettings } from "@/lib/iam";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await getCenterAccess(id);
  if (!access.allowed || !canManageCenterSettings(access.role)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `center-qr/${id}/${Date.now()}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("memorials")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("memorials").getPublicUrl(uploaded.path);
  return NextResponse.json({ url: pub.publicUrl });
}

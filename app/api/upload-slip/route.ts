import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SLIP_SIZE = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memorial_id = formData.get("memorial_id") as string;
    const slipFile = formData.get("slip") as File | null;

    if (!memorial_id || !slipFile || slipFile.size === 0) {
      return NextResponse.json({ error: "Missing slip file or memorial_id" }, { status: 400 });
    }

    if (slipFile.size > MAX_SLIP_SIZE) {
      return NextResponse.json({ error: "Slip file is too large" }, { status: 413 });
    }

    if (!ALLOWED_SLIP_TYPES.has(slipFile.type)) {
      return NextResponse.json({ error: "Unsupported slip file type" }, { status: 415 });
    }

    const supabase = createAdminClient();
    const rawExt = slipFile.name.split(".").pop()?.toLowerCase();
    const ext = rawExt && /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
    const fileName = `slips/${memorial_id}/${crypto.randomUUID()}.${ext}`;
    const buffer = await slipFile.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("donations")
      .upload(fileName, buffer, { contentType: slipFile.type, upsert: false });

    if (uploadError) {
      console.error("Slip upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ slip_url: uploadData.path });
  } catch (err) {
    console.error("upload-slip error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

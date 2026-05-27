import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const memorial_id = formData.get("memorial_id") as string;
    const slipFile = formData.get("slip") as File | null;

    if (!memorial_id || !slipFile || slipFile.size === 0) {
      return NextResponse.json({ error: "Missing slip file or memorial_id" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ext = slipFile.name.split(".").pop() ?? "jpg";
    const fileName = `slips/${memorial_id}/${Date.now()}.${ext}`;
    const buffer = await slipFile.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("donations")
      .upload(fileName, buffer, { contentType: slipFile.type, upsert: false });

    if (uploadError) {
      console.error("Slip upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from("donations")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({ slip_url: publicUrl.publicUrl });
  } catch (err) {
    console.error("upload-slip error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

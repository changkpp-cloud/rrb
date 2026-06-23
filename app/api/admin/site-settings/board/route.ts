import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSiteSetting, HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY } from "@/lib/site-settings";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "ok";
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 401 });
  }

  const form = await req.formData();
  const file    = form.get("file") as File | null;
  const caption = form.get("caption");
  const remove  = form.get("remove") === "true";

  const supabase = createAdminClient();

  // ลบภาพแบนเนอร์
  if (remove) {
    await setSiteSetting(HOME_BOARD_IMAGE_KEY, null);
    return NextResponse.json({ success: true, removed: true });
  }

  let imageUrl: string | null = null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `banners/board-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();
    const { data: uploaded, error } = await supabase.storage
      .from("memorials")
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    imageUrl = supabase.storage.from("memorials").getPublicUrl(uploaded.path).data.publicUrl;
    await setSiteSetting(HOME_BOARD_IMAGE_KEY, imageUrl);
  }

  // caption แยกต่างหาก (ส่งมาเมื่อไหร่ก็อัปเดต)
  if (caption !== null) {
    await setSiteSetting(HOME_BOARD_CAPTION_KEY, String(caption).trim());
  }

  return NextResponse.json({ success: true, imageUrl });
}

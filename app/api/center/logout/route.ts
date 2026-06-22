import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashSessionToken } from "@/lib/iam";

export async function POST() {
  const cookieStore = await cookies();

  const iamToken = cookieStore.get("center_user_session")?.value;
  if (iamToken) {
    const supabase = createAdminClient();
    await supabase
      .from("app_user_sessions")
      .delete()
      .eq("token_hash", hashSessionToken(iamToken));
    cookieStore.delete("center_user_session");
  }

  cookieStore.delete("center_session");

  return NextResponse.json({ ok: true });
}

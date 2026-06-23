import { createAdminClient } from "@/lib/supabase/admin";

export const HOME_BOARD_IMAGE_KEY = "home_board_image_url";
export const HOME_BOARD_CAPTION_KEY = "home_board_caption";

/** อ่านค่า site_settings หลาย key พร้อมกัน — คืน {} ถ้าตารางยังไม่มี/ผิดพลาด */
export async function getSiteSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("key, value")
      .in("key", keys);
    const out: Record<string, string> = {};
    for (const row of (data ?? []) as { key: string; value: string | null }[]) {
      if (row.value) out[row.key] = row.value;
    }
    return out;
  } catch {
    return {};
  }
}

/** เขียนค่า site_settings (upsert) */
export async function setSiteSetting(key: string, value: string | null): Promise<void> {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("site_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
}

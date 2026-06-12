import { createAdminClient } from "@/lib/supabase/admin";
import type { Center } from "@/lib/supabase/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getCenterRouteKey(center: Pick<Center, "id" | "center_code"> & { official_lgo_code?: string | null }) {
  return center.center_code || center.official_lgo_code || center.id;
}

export async function getCenterByRouteKey(key: string): Promise<Center | null> {
  const supabase = createAdminClient();

  if (uuidPattern.test(key)) {
    const { data } = await supabase.from("centers").select("*").eq("id", key).maybeSingle();
    return data as Center | null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("centers") as any)
    .select("*")
    .or(`center_code.ilike.${key},official_lgo_code.ilike.${key}`)
    .maybeSingle();

  return data as Center | null;
}

import { createClient } from "@supabase/supabase-js";

// Service-role client bypasses RLS and is used server-side only.
// Keep it dynamic because admin routes also touch migration-era tables that may
// not be present in generated Supabase types yet.
export function createAdminClient() {
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

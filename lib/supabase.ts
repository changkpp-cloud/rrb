import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Typed as `any` so it can access migration-era tables not yet in generated types.
type AdminClient = SupabaseClient<any>;

let _admin: AdminClient | null = null;

// Singleton admin client — reused across warm serverless invocations.
// Uses the HTTP API (PostgREST) which is already connection-pooled.
export function getAdminClient(): AdminClient {
  if (!_admin) {
    _admin = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return _admin;
}

// Direct Postgres connection string for Supavisor transaction mode (port 6543).
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// Used with the `postgres` package for raw SQL when needed outside of RPC.
// Add SUPABASE_DB_POOL_URL to .env.local and Vercel env to enable.
export const poolerUrl = process.env.SUPABASE_DB_POOL_URL ?? null;

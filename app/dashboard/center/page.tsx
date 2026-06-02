import CenterLoginClient from "@/components/CenterLoginClient";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CenterLoginPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("centers")
    .select("id, name, province, amphoe, status")
    .eq("status", "active")
    .order("name", { ascending: true });

  return <CenterLoginClient centers={data ?? []} />;
}

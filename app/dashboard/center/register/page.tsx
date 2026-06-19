import { createAdminClient } from "@/lib/supabase/admin";
import CenterRegisterClient from "@/components/CenterRegisterClient";

export const dynamic = "force-dynamic";

export default async function CenterRegisterPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("centers")
    .select("id, name, province")
    .eq("status", "active")
    .order("name");

  return <CenterRegisterClient centers={data ?? []} />;
}

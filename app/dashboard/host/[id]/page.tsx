import { createAdminClient } from "@/lib/supabase/admin";
import type { Donation } from "@/lib/supabase/types";
import { getMemorialById } from "@/lib/memorial";
import HostDashboardClient from "@/components/HostDashboardClient";
import { hasHostSession } from "@/lib/host-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? [];
  } catch { return []; }
}

export default async function HostFuneralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = await getMemorialById(id);
  if (!memorial) return null;
  if (!(await hasHostSession(memorial.id))) redirect("/dashboard/host");
  const donations = await getDonations(memorial.id);
  return <HostDashboardClient memorial={memorial} donations={donations} id={id} />;
}

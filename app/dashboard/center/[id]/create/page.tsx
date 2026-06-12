import CreateMemorialClient from "./CreateMemorialClient";
import { redirect } from "next/navigation";
import { canEditCenterWork, getCenterAccess } from "@/lib/iam";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey } from "@/lib/center-route";

export default async function CreateMemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const routeCenter = await getCenterByRouteKey(routeKey);
  if (!routeCenter) redirect("/dashboard/center");
  const id = routeCenter.id;
  const access = await getCenterAccess(id);
  if (!access.allowed || !canEditCenterWork(access.role)) redirect("/dashboard/center");

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: center } = await (supabase.from("centers") as any)
    .select("bank_name, bank_account_number, bank_account_name, bank_account_image_url, phone")
    .eq("id", id)
    .maybeSingle();

  return (
    <CreateMemorialClient
      centerId={id}
      centerBank={{
        bank_name: center?.bank_name ?? null,
        bank_account_number: center?.bank_account_number ?? null,
        bank_account_name: center?.bank_account_name ?? null,
        bank_account_image_url: center?.bank_account_image_url ?? null,
      }}
    />
  );
}

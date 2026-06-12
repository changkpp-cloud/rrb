import { getMemorialById } from "@/lib/memorial";
import EditMemorialInfoForm from "@/components/EditMemorialInfoForm";
import { notFound, redirect } from "next/navigation";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { canEditCenterWork, getCenterAccess } from "@/lib/iam";

export const dynamic = "force-dynamic";

export default async function CenterEditMemorialPage({
  params,
}: {
  params: Promise<{ id: string; memId: string }>;
}) {
  const { id: routeKey, memId } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed || !canEditCenterWork(access.role)) redirect("/dashboard/center");

  const memorial = await getMemorialById(memId);
  if (!memorial) notFound();
  if (memorial.center_id !== id) redirect(`/dashboard/center/${centerRouteKey}`);

  return (
    <EditMemorialInfoForm
      memorial={memorial}
      backHref={`/dashboard/center/${centerRouteKey}/memorial/${memId}`}
      actorType="center"
    />
  );
}

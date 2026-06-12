import { getMemorialById } from "@/lib/memorial";
import EditMemorialInfoForm from "@/components/EditMemorialInfoForm";
import { notFound, redirect } from "next/navigation";
import { canEditCenterWork, getCenterAccess } from "@/lib/iam";

export const dynamic = "force-dynamic";

export default async function CenterEditMemorialPage({
  params,
}: {
  params: Promise<{ id: string; memId: string }>;
}) {
  const { id, memId } = await params;
  const access = await getCenterAccess(id);
  if (!access.allowed || !canEditCenterWork(access.role)) redirect("/dashboard/center");

  const memorial = await getMemorialById(memId);
  if (!memorial) notFound();
  if (memorial.center_id !== id) redirect(`/dashboard/center/${id}`);

  return (
    <EditMemorialInfoForm
      memorial={memorial}
      backHref={`/dashboard/center/${id}/memorial/${memId}`}
      actorType="center"
    />
  );
}

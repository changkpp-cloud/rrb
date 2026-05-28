import { getMemorialById } from "@/lib/memorial";
import EditMemorialInfoForm from "@/components/EditMemorialInfoForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CenterEditMemorialPage({
  params,
}: {
  params: Promise<{ id: string; memId: string }>;
}) {
  const { id, memId } = await params;
  const memorial = await getMemorialById(memId);
  if (!memorial) notFound();

  return (
    <EditMemorialInfoForm
      memorial={memorial}
      backHref={`/dashboard/center/${id}/memorial/${memId}`}
      actorType="center"
    />
  );
}

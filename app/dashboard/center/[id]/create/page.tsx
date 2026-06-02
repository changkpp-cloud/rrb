import CreateMemorialClient from "./CreateMemorialClient";
import { redirect } from "next/navigation";
import { canEditCenterWork, getCenterAccess } from "@/lib/iam";

export default async function CreateMemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getCenterAccess(id);
  if (!access.allowed || !canEditCenterWork(access.role)) redirect("/dashboard/center");
  return <CreateMemorialClient centerId={id} />;
}

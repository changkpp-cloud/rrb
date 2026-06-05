import AiPhotoJobPageClient from "./page-client";

export default async function AiPhotoJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AiPhotoJobPageClient jobId={id} />;
}

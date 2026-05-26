import CreateMemorialClient from "./CreateMemorialClient";

export default async function CreateMemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateMemorialClient centerId={id} />;
}

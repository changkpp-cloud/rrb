import { getMemorialBySlug } from "@/lib/memorial";
import OverviewClient from "./OverviewClient";

export default async function SlugOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return null;
  return <OverviewClient memorial={memorial} slug={slug} />;
}

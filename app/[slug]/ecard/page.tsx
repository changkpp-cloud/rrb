import { Suspense } from "react";
import { getMemorialBySlug } from "@/lib/memorial";
import ECardClient from "@/app/ecard/ECardClient";

export const revalidate = 60;

export default async function SlugECardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return null;
  return (
    <Suspense>
      <ECardClient memorial={memorial} basePath={`/${slug}`} />
    </Suspense>
  );
}

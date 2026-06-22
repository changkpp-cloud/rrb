import { Suspense } from "react";
import { getMemorialBySlug } from "@/lib/memorial";
import { notFound } from "next/navigation";
import ECardClient from "@/app/ecard/ECardClient";
import PendingStatusBanner from "@/components/PendingStatusBanner";

export const revalidate = 60;

export default async function SlugSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) notFound();
  return (
    <div>
      <PendingStatusBanner />
      <Suspense>
        <ECardClient memorial={memorial} basePath={`/${slug}`} />
      </Suspense>
    </div>
  );
}

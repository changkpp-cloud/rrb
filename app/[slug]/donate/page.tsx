import PaymentPageClient from "@/components/PaymentPageClient";
import { getMemorialBySlug, getCenterById } from "@/lib/memorial";
import { notFound } from "next/navigation";

export default async function SlugDonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) notFound();
  const center = memorial.center_id ? await getCenterById(memorial.center_id) : null;
  const promptpayPhone = center?.phone ?? null;
  return <PaymentPageClient memorial={memorial} basePath={`/${slug}`} promptpayPhone={promptpayPhone} />;
}

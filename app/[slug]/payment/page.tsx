import PaymentPageClient from "@/components/PaymentPageClient";
import { getMemorialBySlug, getCenterById } from "@/lib/memorial";

export default async function SlugPaymentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return null;
  const center = memorial.center_id ? await getCenterById(memorial.center_id) : null;
  const promptpayPhone = center?.phone ?? null;
  return <PaymentPageClient memorial={memorial} basePath={`/${slug}`} promptpayPhone={promptpayPhone} />;
}

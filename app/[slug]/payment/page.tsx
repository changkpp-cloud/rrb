import PaymentPageClient from "@/components/PaymentPageClient";
import { getMemorialBySlug } from "@/lib/memorial";

export default async function SlugPaymentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return null;
  return <PaymentPageClient memorial={memorial} basePath={`/${slug}`} />;
}

import PaymentPageClient from "@/components/PaymentPageClient";
import { getMemorial } from "@/lib/memorial";

export default async function PaymentPage() {
  const memorial = await getMemorial();
  if (!memorial) return null;
  return <PaymentPageClient memorial={memorial} />;
}

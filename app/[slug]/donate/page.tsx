import { redirect } from "next/navigation";

// flow แยกเป็น 4 หน้าแล้ว — /donate ถูกแทนที่ด้วย /payment (หน้าการเงิน)
export default async function SlugDonatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/${slug}/payment`);
}

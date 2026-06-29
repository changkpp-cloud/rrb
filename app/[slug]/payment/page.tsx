import PaymentPageClient from "@/components/PaymentPageClient";
import { getMemorialBySlug } from "@/lib/memorial";

export default async function SlugPaymentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const memorial = await getMemorialBySlug(slug);
  if (!memorial) return null;
  // เงินเข้าบัญชีเจ้าภาพโดยตรง: QR พร้อมเพย์สร้างจากเบอร์เจ้าภาพที่ยืนยัน OTP แล้วเท่านั้น
  const promptpayPhone = memorial.host_phone_verified ? (memorial.host_phone ?? null) : null;
  const accountName = memorial.host_bank_account_name || memorial.host_name || null;
  return (
    <PaymentPageClient
      memorial={memorial}
      basePath={`/${slug}`}
      promptpayPhone={promptpayPhone}
      accountName={accountName}
    />
  );
}

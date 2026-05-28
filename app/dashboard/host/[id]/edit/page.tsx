import { getMemorialById } from "@/lib/memorial";
import EditMemorialInfoForm from "@/components/EditMemorialInfoForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HostEditMemorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;

  const memorial = await getMemorialById(id);
  if (!memorial) notFound();

  // Verify host_code
  if (!code || code !== memorial.host_code) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#ffffff" }}>
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-red-600">รหัสเจ้าภาพไม่ถูกต้อง</p>
          <p className="text-xs text-gold-500">กรุณาเข้าผ่านลิงก์จาก Dashboard เจ้าภาพ</p>
        </div>
      </div>
    );
  }

  return (
    <EditMemorialInfoForm
      memorial={memorial}
      backHref={`/dashboard/host/${id}`}
      actorType="host"
      hostCode={code}
    />
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { Donation } from "@/lib/supabase/types";
import { getMemorialById } from "@/lib/memorial";
import HostDashboardClient from "@/components/HostDashboardClient";
import { hasHostSession } from "@/lib/host-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? [];
  } catch { return []; }
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

export default async function HostFuneralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = await getMemorialById(id);
  if (!memorial) return null;
  if (!(await hasHostSession(memorial.id))) redirect("/dashboard/host");

  // ถ้าปิดงานเกิน 30 วัน → block
  if (
    memorial.funeral_status === "closed" &&
    memorial.host_expires_at &&
    new Date(memorial.host_expires_at) < new Date()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-2xl">🔒</p>
          <p className="text-base font-bold text-gold-800">หมดสิทธิ์เข้าถึง</p>
          <p className="text-xs text-gold-500 leading-relaxed">
            สิทธิ์เจ้าภาพหมดอายุแล้ว<br />
            ข้อมูลถูกล็อกหลังปิดงาน 30 วัน
          </p>
        </div>
      </div>
    );
  }

  const donations = await getDonations(memorial.id);
  const remainingDays = memorial.funeral_status === "closed" && memorial.host_expires_at
    ? daysLeft(memorial.host_expires_at)
    : null;

  return <HostDashboardClient memorial={memorial} donations={donations} id={id} hostExpiresInDays={remainingDays} />;
}

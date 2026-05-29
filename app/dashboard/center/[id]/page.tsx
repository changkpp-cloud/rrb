import Link from "next/link";
import { Plus, Users } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Center, Memorial } from "@/lib/supabase/types";
import { formatThaiDate } from "@/lib/memorial";
import MemorialCardActions from "./MemorialCardActions";

export const revalidate = 30;

async function getCenter(id: string): Promise<Center | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("centers").select("*").eq("id", id).single();
    return data as Center | null;
  } catch { return null; }
}

async function getMemorials(centerId: string): Promise<Memorial[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });
    return (data as Memorial[] | null) ?? [];
  } catch { return []; }
}

async function getDonationCounts(memorialIds: string[]): Promise<Record<string, number>> {
  if (memorialIds.length === 0) return {};
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("memorial_id, status")
      .in("memorial_id", memorialIds);
    const counts: Record<string, number> = {};
    for (const d of data ?? []) {
      if (d.status === "confirmed") counts[d.memorial_id] = (counts[d.memorial_id] || 0) + 1;
    }
    return counts;
  } catch { return {}; }
}

const STATUS_LABEL: Record<string, string> = {
  draft: "ร่าง",
  active: "กำลังดำเนินการ",
  closed: "ปิดแล้ว",
};
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gold-100 text-gold-700",
};

export default async function CenterDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const center = await getCenter(id);
  if (!center) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gold-400 text-sm">ไม่พบข้อมูลศูนย์</p>
    </div>
  );

  const memorials = await getMemorials(id);
  const donorCounts = await getDonationCounts(memorials.map(m => m.id));
  const activeCount = memorials.filter(m => m.funeral_status === "active").length;

  return (
    <div className="min-h-screen">
      <IosPageHeader title={center.name} subtitle="ศูนย์บริหาร" backHref="/dashboard/center" />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gold-800">{memorials.length}</p>
            <p className="text-xs text-gold-500 mt-0.5">งานทั้งหมด</p>
          </div>
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-gold-500 mt-0.5">กำลังดำเนินการ</p>
          </div>
        </div>

        {/* New memorial button */}
        <Link
          href={`/dashboard/center/${id}/create`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl gold-gradient text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          เปิดงานศพใหม่
        </Link>

        {/* Memorial list */}
        {memorials.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีงานศพ กดปุ่มด้านบนเพื่อเปิดงานใหม่</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gold-600 px-1">รายการงานศพ</p>
            {memorials.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-cream-50 rounded-2xl gold-border">
                <Link href={`/dashboard/center/${id}/memorial/${m.id}`} className="flex items-start gap-3 flex-1 min-w-0 px-4 py-3 hover:opacity-80 transition-opacity">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gold-800 leading-tight truncate">{m.name}</p>
                    <p className="text-[10px] text-gold-500 mt-0.5">ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
                    <p className="text-[10px] text-gold-400 truncate">{m.ceremony_location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.funeral_status]}`}>
                      {STATUS_LABEL[m.funeral_status]}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-gold-500">
                      <Users className="w-3 h-3" />
                      {donorCounts[m.id] || 0} คน
                    </div>
                  </div>
                </Link>
                <div className="pr-3">
                  <MemorialCardActions
                    memorialId={m.id}
                    memorialName={m.name}
                    isClosed={m.funeral_status === "closed"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-2" />
      </main>
    </div>
  );
}

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Building2, ChevronRight, Plus } from "lucide-react";
import DeleteCenterButton from "./DeleteCenterButton";

export const revalidate = 60;

async function getCenters() {
  const supabase = createAdminClient();
  const { data: centers } = await supabase.from("centers").select("*").order("created_at", { ascending: true });
  if (!centers || centers.length === 0) return [];

  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, center_id, funeral_status");

  const memMap: Record<string, { total: number; active: number }> = {};
  for (const m of memorials ?? []) {
    if (!m.center_id) continue;
    if (!memMap[m.center_id]) memMap[m.center_id] = { total: 0, active: 0 };
    memMap[m.center_id].total++;
    if (m.funeral_status === "active") memMap[m.center_id].active++;
  }

  return centers.map(c => ({
    ...c,
    totalMemorials: memMap[c.id]?.total ?? 0,
    activeMemorials: memMap[c.id]?.active ?? 0,
  }));
}

export default async function AdminCentersPage() {
  const centers = await getCenters();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gold-800">ศูนย์บริหารทั้งหมด</h2>
          <p className="text-[11px] text-gold-500">{centers.length} ศูนย์ในระบบ</p>
        </div>
        <Link
          href="/dashboard/admin/centers/new"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl gold-gradient text-white text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          เปิดศูนย์ใหม่
        </Link>
      </div>

      {centers.length === 0 ? (
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-10 text-center">
          <Building2 className="w-10 h-10 text-gold-300 mx-auto mb-2" />
          <p className="text-sm text-gold-400">ยังไม่มีศูนย์ในระบบ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {centers.map(c => (
            <div key={c.id} className="flex items-center gap-2 bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3.5">
              <Link
                href={`/dashboard/admin/centers/${c.id}`}
                className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gold-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-gold-500 mt-0.5">
                    {[c.tambon, c.amphoe, c.province].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gold-600 font-medium">{c.totalMemorials} งาน</span>
                    {c.activeMemorials > 0 && (
                      <span className="text-[10px] text-emerald-600 font-medium">เปิดอยู่ {c.activeMemorials}</span>
                    )}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.status === "active" ? "ใช้งาน" : "ปิดแล้ว"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gold-400 shrink-0" />
              </Link>
              <DeleteCenterButton centerId={c.id} centerName={c.name} />
            </div>
          ))}
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

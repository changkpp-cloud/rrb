import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { ChevronRight, Users } from "lucide-react";

export const revalidate = 60;

async function getMemorials(status: string) {
  const supabase = createAdminClient();
  let q = supabase
    .from("memorials")
    .select("id, name, ceremony_date, funeral_status, center_id, host_name, event_code")
    .order("created_at", { ascending: false });

  if (status === "active") q = q.eq("funeral_status", "active");
  else if (status === "closed") q = q.eq("funeral_status", "closed");

  const { data: memorials } = await q;
  if (!memorials || memorials.length === 0) return { memorials: [], donMap: {}, centerMap: {} };

  const memIds = memorials.map(m => m.id);
  const centerIds = [...new Set(memorials.map(m => m.center_id).filter(Boolean) as string[])];

  const [{ data: donations }, { data: centers }] = await Promise.all([
    supabase.from("donations").select("memorial_id, amount, status").in("memorial_id", memIds),
    centerIds.length > 0
      ? supabase.from("centers").select("id, name").in("id", centerIds)
      : { data: [] },
  ]);

  const donMap: Record<string, { count: number; amount: number; pending: number }> = {};
  for (const d of donations ?? []) {
    if (!donMap[d.memorial_id]) donMap[d.memorial_id] = { count: 0, amount: 0, pending: 0 };
    if (d.status === "confirmed") {
      donMap[d.memorial_id].count++;
      donMap[d.memorial_id].amount += d.amount || 0;
    } else if (d.status === "pending") {
      donMap[d.memorial_id].pending++;
    }
  }

  const centerMap: Record<string, string> = {};
  for (const c of centers ?? []) centerMap[c.id] = c.name;

  return { memorials, donMap, centerMap };
}

const TABS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "เปิดอยู่" },
  { value: "closed", label: "ปิดแล้ว" },
];
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gold-100 text-gold-700",
};
const STATUS_LABEL: Record<string, string> = { draft: "ร่าง", active: "เปิดอยู่", closed: "ปิดแล้ว" };

export default async function AdminMemorialsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const { memorials, donMap, centerMap } = await getMemorials(status);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gold-800">งานศพทั้งหมด</h2>
        <p className="text-[11px] text-gold-500">{memorials.length} รายการ</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map(t => (
          <Link
            key={t.value}
            href={`/dashboard/admin/memorials?status=${t.value}`}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              status === t.value
                ? "bg-gold-600 text-white border-gold-600"
                : "bg-cream-50 text-gold-600 border-gold-300 hover:bg-gold-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Memorial list */}
      {memorials.length === 0 ? (
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-10 text-center">
          <p className="text-sm text-gold-400">ไม่พบงานศพ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {memorials.map(m => (
            <Link
              key={m.id}
              href={`/dashboard/admin/memorials/${m.id}`}
              className="flex items-center gap-3 bg-cream-50 rounded-xl gold-border px-4 py-3 hover:bg-cream-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gold-800 truncate">{m.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[m.funeral_status]}`}>
                    {STATUS_LABEL[m.funeral_status]}
                  </span>
                </div>
                <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
                {m.center_id && centerMap[m.center_id] && (
                  <p className="text-[10px] text-gold-400 truncate">{centerMap[m.center_id]}</p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-0.5 text-[10px] text-gold-500">
                    <Users className="w-3 h-3" />{donMap[m.id]?.count ?? 0} คน
                  </span>
                  <span className="text-[10px] text-gold-600 font-medium">{(donMap[m.id]?.amount ?? 0).toLocaleString()} บาท</span>
                  {(donMap[m.id]?.pending ?? 0) > 0 && (
                    <span className="text-[10px] text-amber-600">เก่า {donMap[m.id]?.pending}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gold-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}

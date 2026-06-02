import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { Users, Leaf } from "lucide-react";

export const revalidate = 60;

async function getCenterData(id: string) {
  const supabase = createAdminClient();
  const [{ data: center }, { data: memorials }] = await Promise.all([
    supabase.from("centers").select("*").eq("id", id).single(),
    supabase.from("memorials").select("*").eq("center_id", id).order("created_at", { ascending: false }),
  ]);
  if (!center || !memorials) return null;

  const memIds = memorials.map(m => m.id);
  const { data: donations } = memIds.length > 0
    ? await supabase.from("donations").select("memorial_id, amount, status").in("memorial_id", memIds)
    : { data: [] };

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

  const totalAmount = Object.values(donMap).reduce((s, v) => s + v.amount, 0);
  const totalWreaths = Object.values(donMap).reduce((s, v) => s + v.count, 0);

  return { center, memorials, donMap, totalAmount, totalWreaths };
}

const STATUS_LABEL: Record<string, string> = { draft: "ร่าง", active: "เปิดอยู่", closed: "ปิดแล้ว" };
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gold-100 text-gold-700",
};

export default async function AdminCenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCenterData(id);
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-gold-400 text-sm">ไม่พบข้อมูลศูนย์</p>
    </div>
  );

  const { center, memorials, donMap, totalAmount, totalWreaths } = data;
  const activeCount = memorials.filter(m => m.funeral_status === "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-gold-800">{center.name}</h2>
          <p className="text-[11px] text-gold-500">{[center.tambon, center.amphoe, center.province].filter(Boolean).join(" · ")}</p>
        </div>
      </div>

      {/* Center info */}
      <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-1.5">
        <p className="text-[11px] font-semibold text-gold-700 mb-2">ข้อมูลศูนย์</p>
        {center.center_code && <Row label="รหัสศูนย์" value={center.center_code} />}
        {center.manager_name && <Row label="ผู้รับผิดชอบ" value={center.manager_name} />}
        {center.phone && <Row label="เบอร์โทร" value={center.phone} />}
        {center.municipality && <Row label="เทศบาล/อบต." value={center.municipality} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 text-center">
          <p className="text-xl font-bold text-gold-800">{memorials.length}</p>
          <p className="text-[11px] text-gold-500">งานทั้งหมด</p>
        </div>
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-[11px] text-gold-500">กำลังเปิดอยู่</p>
        </div>
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 text-center">
          <p className="text-xl font-bold text-amber-600">{totalAmount.toLocaleString()}</p>
          <p className="text-[11px] text-gold-500">บาทร่วมบุญรวม</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 card-shadow px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <p className="text-xl font-bold text-emerald-600">{totalWreaths}</p>
          </div>
          <p className="text-[11px] text-emerald-600">พวงหรีดที่ลดลง</p>
        </div>
      </div>

      {/* Memorial list */}
      <div>
        <p className="text-xs font-semibold text-gold-700 mb-2">รายการงานศพ</p>
        {memorials.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border px-4 py-6 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีงานศพ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {memorials.map(m => (
              <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`} className="flex items-center justify-between bg-cream-50 rounded-xl gold-border px-4 py-2.5 hover:bg-cream-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gold-800 truncate">{m.name}</p>
                  <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-gold-500">
                      <Users className="w-3 h-3" />{donMap[m.id]?.count ?? 0} คน
                    </span>
                    <span className="text-[10px] text-gold-500">{(donMap[m.id]?.amount ?? 0).toLocaleString()} บาท</span>
                    {(donMap[m.id]?.pending ?? 0) > 0 && (
                      <span className="text-[10px] text-amber-600">รอตรวจ {donMap[m.id]?.pending}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[m.funeral_status]}`}>
                  {STATUS_LABEL[m.funeral_status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gold-500 w-24 shrink-0">{label}</span>
      <span className="text-[11px] text-gold-800 font-medium">{value}</span>
    </div>
  );
}

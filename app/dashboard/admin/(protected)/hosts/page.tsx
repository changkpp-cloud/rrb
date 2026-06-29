import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { Banknote, User, ChevronRight } from "lucide-react";
import { netToHost } from "@/lib/fee";

export const revalidate = 60;

async function getHostsData() {
  const supabase = createAdminClient();
  const { data: memorials } = await supabase
    .from("memorials")
    .select("id, name, host_name, host_phone, host_relationship, ceremony_date, funeral_status, host_bank_name, host_bank_account_number, host_bank_account_name")
    .not("host_name", "is", null)
    .order("created_at", { ascending: false });

  if (!memorials || memorials.length === 0) return [];

  const memIds = memorials.map(m => m.id);
  const { data: donations } = await supabase
    .from("donations")
    .select("memorial_id, amount, status")
    .in("memorial_id", memIds);

  const donMap: Record<string, { amount: number; count: number }> = {};
  for (const d of donations ?? []) {
    if (d.status === "confirmed") {
      const e = donMap[d.memorial_id] ?? { amount: 0, count: 0 };
      e.amount += d.amount || 0;
      e.count += 1;
      donMap[d.memorial_id] = e;
    }
  }

  return memorials.map(m => {
    const agg = donMap[m.id] ?? { amount: 0, count: 0 };
    // ค่าดำเนินการ 5% ของยอดร่วมบุญ → ยอดนำส่งเจ้าภาพ = สุทธิหลังหัก
    const netAmount = netToHost(agg.amount);
    return { ...m, totalAmount: agg.amount, donorCount: agg.count, netAmount };
  });
}

const STATUS_LABEL: Record<string, string> = { draft: "ร่าง", active: "เปิดอยู่", closed: "ปิดแล้ว" };
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gold-100 text-gold-700",
};

export default async function AdminHostsPage() {
  const hosts = await getHostsData();
  const totalPending = hosts.filter(h => h.funeral_status === "active").reduce((s, h) => s + h.netAmount, 0);
  const totalPaid = hosts.filter(h => h.funeral_status === "closed").reduce((s, h) => s + h.netAmount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gold-800">เจ้าภาพและยอดนำส่ง</h2>
        <p className="text-[11px] text-gold-500">{hosts.length} งานที่มีข้อมูลเจ้าภาพ</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-lg font-bold text-amber-600">{totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-amber-700">บาท · รอนำส่ง (สุทธิ)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{totalPaid.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700">บาท · นำส่งแล้ว (สุทธิ)</p>
        </div>
      </div>

      {/* Host list */}
      {hosts.length === 0 ? (
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-10 text-center">
          <User className="w-10 h-10 text-gold-300 mx-auto mb-2" />
          <p className="text-sm text-gold-400">ยังไม่มีข้อมูลเจ้าภาพ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hosts.map(h => (
            <Link
              key={h.id}
              href={`/dashboard/admin/memorials/${h.id}`}
              className="block bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 hover:bg-cream-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gold-800 truncate">{h.name}</p>
                  <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(h.ceremony_date)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[h.funeral_status]}`}>
                    {STATUS_LABEL[h.funeral_status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gold-400" />
                </div>
              </div>

              {/* Host info */}
              <div className="flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-gold-400" />
                <p className="text-[11px] text-gold-700 font-medium">{h.host_name}</p>
                {h.host_relationship && (
                  <span className="text-[10px] text-gold-400">({h.host_relationship})</span>
                )}
              </div>

              {/* Bank */}
              {h.host_bank_account_number && (
                <p className="text-[10px] text-gold-500">
                  บัญชี: {h.host_bank_name || ""} {h.host_bank_account_number}
                  {h.host_bank_account_name ? ` · ${h.host_bank_account_name}` : ""}
                </p>
              )}

              {/* Amount */}
              <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gold-100">
                <Banknote className="w-3.5 h-3.5 text-gold-500" />
                <p className="text-xs font-bold text-gold-700">{h.netAmount.toLocaleString()} บาท</p>
                <span className="text-[10px] text-gold-400">
                  นำส่งเจ้าภาพ · จากร่วมบุญ {h.totalAmount.toLocaleString()} (หัก 5%)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}

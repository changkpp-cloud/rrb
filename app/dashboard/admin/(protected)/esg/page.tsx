import { createAdminClient } from "@/lib/supabase/admin";
import { Leaf, Trash2, Banknote, Users, Building2, ScrollText } from "lucide-react";

export const revalidate = 300;

const KG_PER_WREATH = 2;

async function getESGData() {
  const supabase = createAdminClient();
  const [
    { data: donations },
    { count: totalCenters },
    { count: activeMemorials },
    { count: closedMemorials },
    { data: memorialsWithCenter },
  ] = await Promise.all([
    supabase.from("donations").select("amount, status, created_at, memorial_id"),
    supabase.from("centers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("memorials").select("*", { count: "exact", head: true }).eq("funeral_status", "active"),
    supabase.from("memorials").select("*", { count: "exact", head: true }).eq("funeral_status", "closed"),
    supabase.from("memorials").select("id, center_id").not("center_id", "is", null),
  ]);

  const confirmed = donations?.filter(d => d.status === "confirmed") ?? [];
  const totalDonors = confirmed.length;
  const totalAmount = confirmed.reduce((s, d) => s + (d.amount || 0), 0);
  const wreaths = totalDonors;
  const wasteKg = wreaths * KG_PER_WREATH;

  // Monthly breakdown (last 6 months)
  const monthlyMap: Record<string, number> = {};
  for (const d of confirmed) {
    const date = new Date(d.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  }
  const months = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({
      month,
      count,
      label: (() => {
        const [y, m] = month.split("-");
        const thaiMonths = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        return `${thaiMonths[parseInt(m)]} ${(parseInt(y) + 543).toString().slice(-2)}`;
      })(),
    }));

  const maxMonth = Math.max(...months.map(m => m.count), 1);

  // Per-center breakdown
  const memIdToCenterId: Record<string, string> = {};
  for (const m of memorialsWithCenter ?? []) {
    if (m.center_id) memIdToCenterId[m.id] = m.center_id;
  }
  const centerWreaths: Record<string, number> = {};
  for (const d of confirmed) {
    const centerId = memIdToCenterId[d.memorial_id];
    if (centerId) centerWreaths[centerId] = (centerWreaths[centerId] || 0) + 1;
  }

  const centerIds = Object.keys(centerWreaths);
  let topCenters: { name: string; wreaths: number }[] = [];
  if (centerIds.length > 0) {
    const { data: centers } = await supabase.from("centers").select("id, name").in("id", centerIds);
    topCenters = (centers ?? [])
      .map(c => ({ name: c.name, wreaths: centerWreaths[c.id] || 0 }))
      .sort((a, b) => b.wreaths - a.wreaths)
      .slice(0, 5);
  }

  return {
    totalDonors, totalAmount, wreaths, wasteKg,
    totalCenters: totalCenters ?? 0,
    activeMemorials: activeMemorials ?? 0,
    closedMemorials: closedMemorials ?? 0,
    months, maxMonth, topCenters,
  };
}

export default async function AdminESGPage() {
  const d = await getESGData();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gold-800">รายงาน ESG / Zero Waste</h2>
        <p className="text-[11px] text-gold-500">ผลลัพธ์ด้านสิ่งแวดล้อมและสังคม</p>
      </div>

      {/* Big ESG numbers */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-emerald-800">ผลลัพธ์รวม (ตลอดการดำเนินงาน)</p>
        <div className="grid grid-cols-2 gap-3">
          <ESGCard icon={Leaf} label="พวงหรีดที่ลดลง" value={d.wreaths.toLocaleString()} unit="ชิ้น" color="text-emerald-600" />
          <ESGCard icon={Trash2} label="ขยะที่ลดได้" value={d.wasteKg.toLocaleString()} unit="กก." color="text-teal-600" />
          <ESGCard icon={Banknote} label="เงินถึงเจ้าภาพ" value={d.totalAmount.toLocaleString()} unit="บาท" color="text-amber-600" />
          <ESGCard icon={Users} label="ผู้ร่วมบุญ" value={d.totalDonors.toLocaleString()} unit="ราย" color="text-blue-600" />
        </div>
      </div>

      {/* System stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 text-center">
          <div className="flex justify-center mb-1"><Building2 className="w-4 h-4 text-gold-600" /></div>
          <p className="text-lg font-bold text-gold-800">{d.totalCenters}</p>
          <p className="text-[10px] text-gold-500">ศูนย์ใช้งาน</p>
        </div>
        <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 text-center">
          <div className="flex justify-center mb-1"><ScrollText className="w-4 h-4 text-emerald-600" /></div>
          <p className="text-lg font-bold text-emerald-600">{d.activeMemorials}</p>
          <p className="text-[10px] text-gold-500">งานเปิดอยู่</p>
        </div>
        <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 text-center">
          <div className="flex justify-center mb-1"><ScrollText className="w-4 h-4 text-gold-500" /></div>
          <p className="text-lg font-bold text-gold-700">{d.closedMemorials}</p>
          <p className="text-[10px] text-gold-500">งานปิดแล้ว</p>
        </div>
      </div>

      {/* Formula note */}
      <div className="bg-cream-50 rounded-xl gold-border px-4 py-3 space-y-1">
        <p className="text-[11px] font-semibold text-gold-700">สูตรคำนวณ ESG</p>
        <p className="text-[10px] text-gold-500">1 รายการร่วมบุญ = ลดพวงหรีดสด 1 ชิ้น</p>
        <p className="text-[10px] text-gold-500">1 พวงหรีดสด = ลดขยะ {KG_PER_WREATH} กิโลกรัม</p>
      </div>

      {/* Monthly bar chart */}
      {d.months.length > 0 && (
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4">
          <p className="text-xs font-semibold text-gold-700 mb-3">พวงหรีดที่ลดลงรายเดือน</p>
          <div className="flex items-end gap-2 h-24">
            {d.months.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] text-gold-600 font-medium">{m.count}</p>
                <div
                  className="w-full rounded-t-md bg-emerald-400"
                  style={{ height: `${Math.max((m.count / d.maxMonth) * 72, 4)}px` }}
                />
                <p className="text-[9px] text-gold-400">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top centers */}
      {d.topCenters.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gold-700 mb-2">อันดับศูนย์ลดขยะสูงสุด</p>
          <div className="space-y-2">
            {d.topCenters.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 bg-cream-50 rounded-xl gold-border px-4 py-2.5">
                <span className="text-sm font-bold text-gold-400 w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gold-800 truncate">{c.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600">{c.wreaths}</span>
                  <span className="text-[10px] text-gold-400">ชิ้น</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

function ESGCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="bg-white/60 rounded-xl border border-emerald-100 px-3 py-3">
      <Icon className={`w-4 h-4 ${color} mb-1`} />
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-emerald-600">{unit}</p>
      <p className="text-[10px] text-emerald-700 font-medium mt-0.5">{label}</p>
    </div>
  );
}

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { Building2, ScrollText, Users, Banknote, Leaf, Trash2, Clock, CheckCircle } from "lucide-react";

export const revalidate = 60;

async function getStats() {
  const supabase = createAdminClient();
  const [
    { count: totalCenters },
    { count: activeCenters },
    { count: totalMemorials },
    { count: activeMemorials },
    { data: donations },
    { data: recentMemorials },
  ] = await Promise.all([
    supabase.from("centers").select("*", { count: "exact", head: true }),
    supabase.from("centers").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("memorials").select("*", { count: "exact", head: true }),
    supabase.from("memorials").select("*", { count: "exact", head: true }).eq("funeral_status", "active"),
    supabase.from("donations").select("amount, status, memorial_id"),
    supabase.from("memorials").select("id, name, ceremony_date, funeral_status, center_id").order("created_at", { ascending: false }).limit(6),
  ]);

  const confirmed = donations?.filter(d => d.status === "confirmed") ?? [];
  const pending = donations?.filter(d => d.status === "pending") ?? [];
  const totalAmount = confirmed.reduce((s, d) => s + (d.amount || 0), 0);
  const wreaths = confirmed.length;

  return {
    totalCenters: totalCenters ?? 0,
    activeCenters: activeCenters ?? 0,
    totalMemorials: totalMemorials ?? 0,
    activeMemorials: activeMemorials ?? 0,
    confirmedDonors: confirmed.length,
    pendingCount: pending.length,
    totalAmount,
    wreaths,
    wasteKg: wreaths * 2,
    recentMemorials: recentMemorials ?? [],
  };
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xl font-bold text-gold-800">{value}</p>
          <p className="text-[11px] text-gold-500 mt-0.5">{label}</p>
          {sub && <p className="text-[10px] text-gold-400">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { draft: "ร่าง", active: "เปิดอยู่", closed: "ปิดแล้ว" };
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-gold-100 text-gold-700",
};

export default async function AdminOverviewPage() {
  const s = await getStats();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gold-800">ภาพรวมระบบทั้งหมด</h2>
        <p className="text-[11px] text-gold-500">ข้อมูล Real-time จากทุกศูนย์ทั่วประเทศ</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="ศูนย์บริหาร" value={s.activeCenters} sub={`ทั้งหมด ${s.totalCenters} แห่ง`} icon={Building2} color="bg-blue-50 text-blue-600" />
        <StatCard label="งานศพที่เปิดอยู่" value={s.activeMemorials} sub={`ทั้งหมด ${s.totalMemorials} งาน`} icon={ScrollText} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="ผู้ร่วมบุญ (ยืนยัน)" value={s.confirmedDonors.toLocaleString()} sub={`รอตรวจ ${s.pendingCount} รายการ`} icon={Users} color="bg-gold-100 text-gold-600" />
        <StatCard label="ยอดร่วมบุญ (บาท)" value={s.totalAmount.toLocaleString()} icon={Banknote} color="bg-amber-50 text-amber-600" />
        <StatCard label="พวงหรีดที่ลดลง" value={s.wreaths.toLocaleString()} sub="ชิ้น" icon={Leaf} color="bg-green-50 text-green-600" />
        <StatCard label="ขยะที่ลดได้" value={(s.wasteKg).toLocaleString()} sub="กิโลกรัม" icon={Trash2} color="bg-teal-50 text-teal-600" />
      </div>

      {/* Pending alert */}
      {s.pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">มีสลิปรอตรวจ {s.pendingCount} รายการ</p>
            <p className="text-[11px] text-amber-600">ศูนย์บริหารควรตรวจสอบโดยเร็ว</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { href: "/dashboard/admin/centers", label: "ศูนย์ทั้งหมด", icon: Building2 },
          { href: "/dashboard/admin/memorials", label: "งานศพ", icon: ScrollText },
          { href: "/dashboard/admin/esg", label: "รายงาน ESG", icon: Leaf },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 flex flex-col items-center gap-1 hover:bg-cream-100 transition-colors">
            <Icon className="w-5 h-5 text-gold-600" />
            <p className="text-[10px] font-semibold text-gold-700 text-center">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent memorials */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gold-700">งานศพล่าสุด</p>
          <Link href="/dashboard/admin/memorials" className="text-[11px] text-gold-500 hover:text-gold-700">ดูทั้งหมด →</Link>
        </div>
        <div className="space-y-2">
          {s.recentMemorials.length === 0 ? (
            <div className="bg-cream-50 rounded-2xl gold-border px-4 py-6 text-center">
              <p className="text-sm text-gold-400">ยังไม่มีงานศพในระบบ</p>
            </div>
          ) : s.recentMemorials.map((m) => (
            <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`} className="flex items-center justify-between bg-cream-50 rounded-xl gold-border px-4 py-2.5 hover:bg-cream-100 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gold-800">{m.name}</p>
                <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.funeral_status]}`}>
                {STATUS_LABEL[m.funeral_status]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ESG summary box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800">ผลลัพธ์ ESG Zero Waste</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-700">{s.wreaths.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600">พวงหรีดที่ลดลง</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-700">{(s.wasteKg).toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600">กก. ขยะที่ลด</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-700">{s.totalAmount.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600">บาทถึงเจ้าภาพ</p>
          </div>
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}

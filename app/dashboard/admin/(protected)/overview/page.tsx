import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatThaiDate } from "@/lib/memorial";
import { Building2, ScrollText, Users, Banknote, Leaf, Trash2, Clock, ChevronRight } from "lucide-react";

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
    supabase.from("donations").select("amount, status"),
    supabase.from("memorials")
      .select("id, name, ceremony_date, funeral_status, center_id")
      .order("created_at", { ascending: false })
      .limit(5),
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

      {/* ── 1. HERO: ผลลัพธ์ ESG ระดับประเทศ ── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-5">
        <p className="text-[11px] font-semibold text-emerald-700 mb-3 tracking-wide uppercase">ผลลัพธ์ ESG Zero Waste · ภาพรวมทั้งหมด</p>
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="text-2xl font-bold text-emerald-700">{s.wreaths.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Leaf className="w-3 h-3 text-emerald-500" />
              <p className="text-[10px] text-emerald-600">พวงหรีดที่ลดลง</p>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-700">{s.wasteKg.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Trash2 className="w-3 h-3 text-teal-500" />
              <p className="text-[10px] text-teal-600">กก. ขยะที่ลด</p>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{s.totalAmount >= 1000000
              ? `${(s.totalAmount / 1000000).toFixed(1)}M`
              : s.totalAmount >= 1000
              ? `${(s.totalAmount / 1000).toFixed(0)}K`
              : s.totalAmount.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Banknote className="w-3 h-3 text-amber-500" />
              <p className="text-[10px] text-amber-600">บาทถึงเจ้าภาพ</p>
            </div>
          </div>
        </div>
        <Link href="/dashboard/admin/esg" className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 transition-colors">
          ดูรายงาน ESG ทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── 2. สถิติระบบระดับประเทศ ── */}
      <div>
        <p className="text-[11px] font-semibold text-gold-600 mb-2 px-1">สถิติระบบ</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gold-800">{s.activeCenters}</p>
              <p className="text-[10px] text-gold-500">ศูนย์เปิดใช้งาน</p>
              <p className="text-[9px] text-gold-400">ทั้งหมด {s.totalCenters} แห่ง</p>
            </div>
          </div>
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <ScrollText className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{s.activeMemorials}</p>
              <p className="text-[10px] text-gold-500">งานที่เปิดอยู่</p>
              <p className="text-[9px] text-gold-400">ทั้งหมด {s.totalMemorials} งาน</p>
            </div>
          </div>
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-100 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-gold-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gold-800">{s.confirmedDonors.toLocaleString()}</p>
              <p className="text-[10px] text-gold-500">ผู้ร่วมบุญ (ยืนยัน)</p>
              <p className="text-[9px] text-gold-400">รอตรวจ {s.pendingCount} รายการ</p>
            </div>
          </div>
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Banknote className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gold-800">{s.totalAmount.toLocaleString()}</p>
              <p className="text-[10px] text-gold-500">บาทร่วมบุญรวม</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. รายการที่ต้องดำเนินการ ── */}
      {s.pendingCount > 0 && (
        <Link href="/dashboard/admin/memorials?status=active" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700">สลิปรอตรวจ {s.pendingCount} รายการ</p>
            <p className="text-[11px] text-amber-600">ศูนย์บริหารควรตรวจสอบโดยเร็ว</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </Link>
      )}

      {/* ── 4. งานศพล่าสุด (ระดับงาน) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gold-700">งานศพล่าสุด</p>
          <Link href="/dashboard/admin/memorials" className="text-[11px] text-gold-500 hover:text-gold-700 flex items-center gap-0.5">
            ทั้งหมด <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {s.recentMemorials.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border px-4 py-6 text-center">
            <p className="text-sm text-gold-400">ยังไม่มีงานศพในระบบ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {s.recentMemorials.map(m => (
              <Link key={m.id} href={`/dashboard/admin/memorials/${m.id}`}
                className="flex items-center justify-between bg-cream-50 rounded-xl gold-border px-4 py-2.5 hover:bg-cream-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gold-800">{m.name}</p>
                  <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(m.ceremony_date)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.funeral_status]}`}>
                    {STATUS_LABEL[m.funeral_status]}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gold-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. ลิงก์ไปหน้าย่อย (ระดับต่ำสุด) ── */}
      <div>
        <p className="text-[11px] font-semibold text-gold-500 mb-2 px-1">รายงานระดับศูนย์และรายละเอียด</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/dashboard/admin/centers", label: "ศูนย์บริหารทั้งหมด", icon: Building2 },
            { href: "/dashboard/admin/hosts", label: "เจ้าภาพและยอดนำส่ง", icon: Users },
            { href: "/dashboard/admin/memorials", label: "งานศพทั้งหมด", icon: ScrollText },
            { href: "/dashboard/admin/esg", label: "รายงาน ESG", icon: Leaf },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 bg-cream-50 rounded-xl gold-border px-3 py-3 hover:bg-cream-100 transition-colors">
              <Icon className="w-4 h-4 text-gold-500 shrink-0" />
              <p className="text-[11px] font-medium text-gold-700 leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}

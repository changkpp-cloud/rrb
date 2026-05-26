import Link from "next/link";
import { ArrowLeft, Building2, Users, Banknote, Leaf, BarChart3, Settings } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createClient } from "@/lib/supabase/server";
import type { Memorial, Donation } from "@/lib/supabase/types";
import { DEMO_MEMORIAL } from "@/lib/memorial";

export const revalidate = 60;

const DEMO_DONATIONS: Donation[] = [
  { id: "1", memorial_id: "demo", donor_name: "A", donor_title: null, amount: 500, message: null, slip_url: null, status: "confirmed", nameplate_status: "printed", created_at: new Date().toISOString() },
  { id: "2", memorial_id: "demo", donor_name: "B", donor_title: null, amount: 300, message: null, slip_url: null, status: "confirmed", nameplate_status: "posted", created_at: new Date().toISOString() },
  { id: "3", memorial_id: "demo", donor_name: "C", donor_title: null, amount: 1000, message: null, slip_url: null, status: "pending", nameplate_status: "pending", created_at: new Date().toISOString() },
];

const KG_PER_WREATH = 3.2;
const WREATHS_PER_DONOR = 0.8;

async function getData() {
  try {
    const supabase = await createClient();
    const [memRes, donRes] = await Promise.all([
      supabase.from("memorials").select("*"),
      supabase.from("donations").select("*"),
    ]);
    return {
      memorials: (memRes.data as Memorial[] | null) ?? [DEMO_MEMORIAL],
      donations: (donRes.data as Donation[] | null) ?? DEMO_DONATIONS,
    };
  } catch {
    return { memorials: [DEMO_MEMORIAL], donations: DEMO_DONATIONS };
  }
}

export default async function AdminPage() {
  const { memorials, donations } = await getData();

  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending = donations.filter(d => d.status === "pending");
  const totalAmount = confirmed.reduce((s, d) => s + d.amount, 0);
  const totalFee = confirmed.length * 100;
  const netToHosts = Math.max(0, totalAmount - totalFee);
  const wreathsReduced = Math.round(confirmed.length * WREATHS_PER_DONOR);
  const wasteReduced = +(wreathsReduced * KG_PER_WREATH).toFixed(1);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">Dashboard แอดมิน</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Admin Overview</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* National stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Building2 className="w-5 h-5 text-gold-600" />} value={memorials.length} label="งานศพทั้งหมด" bg="bg-cream-50" border="border-gold-200" />
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} value={donations.length} label="ผู้ร่วมบุญทั้งหมด" bg="bg-blue-50" border="border-blue-100" />
          <StatCard icon={<Banknote className="w-5 h-5 text-emerald-600" />} value={`${(totalAmount / 1000).toFixed(0)}K ฿`} label="ยอดร่วมบุญรวม" bg="bg-emerald-50" border="border-emerald-100" />
          <StatCard icon={<Leaf className="w-5 h-5 text-teal-600" />} value={`${wasteReduced} kg`} label="ขยะที่ลดลง" bg="bg-teal-50" border="border-teal-100" />
        </div>

        {/* Financial breakdown */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">สรุปการเงินระดับประเทศ</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gold-600">ยืนยันแล้ว</span>
              <span className="font-bold text-gold-800">{confirmed.length} ราย · {totalAmount.toLocaleString()} ฿</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gold-600">รอตรวจสอบ</span>
              <span className="font-bold text-amber-600">{pending.length} ราย</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gold-600">ค่าดำเนินการรวม</span>
              <span className="font-bold text-red-500">{totalFee.toLocaleString()} ฿</span>
            </div>
            <div className="border-t border-gold-200 pt-2 flex justify-between text-sm">
              <span className="font-bold text-gold-700">สุทธิถึงเจ้าภาพรวม</span>
              <span className="font-bold text-emerald-700">{netToHosts.toLocaleString()} ฿</span>
            </div>
          </div>
        </div>

        {/* ESG national */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)", boxShadow: "0 8px 32px rgba(4,120,87,0.3)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-4 h-4 text-emerald-300" />
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">ESG ระดับประเทศ</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-xl px-2 py-2.5">
              <p className="text-xl font-bold text-white">{wreathsReduced}</p>
              <p className="text-[9px] text-emerald-300">พวงลด</p>
            </div>
            <div className="bg-white/10 rounded-xl px-2 py-2.5">
              <p className="text-xl font-bold text-white">{wasteReduced}</p>
              <p className="text-[9px] text-emerald-300">kg ขยะลด</p>
            </div>
            <div className="bg-white/10 rounded-xl px-2 py-2.5">
              <p className="text-xl font-bold text-white">{memorials.length}</p>
              <p className="text-[9px] text-emerald-300">งานศพ</p>
            </div>
          </div>
        </div>

        {/* All funerals list */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gold-700 uppercase tracking-wider">งานศพทั้งหมด</p>
            <BarChart3 className="w-4 h-4 text-gold-400" />
          </div>
          {memorials.map(m => {
            const mDonors = confirmed.filter(d => d.memorial_id === m.id);
            const mAmount = mDonors.reduce((s, d) => s + d.amount, 0);
            return (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gold-100 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-gold-800 truncate max-w-[180px]">{m.name}</p>
                  <p className="text-[9px] text-gold-500">{mDonors.length} ราย ยืนยัน</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gold-700">{mAmount.toLocaleString()} ฿</p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${m.funeral_status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {m.funeral_status === "active" ? "กำลังดำเนิน" : m.funeral_status === "closed" ? "ปิดแล้ว" : "ร่าง"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/center"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.97] transition-all">
            <Building2 className="w-5 h-5" />
            จัดการศูนย์
          </Link>
          <Link href="/dashboard/admin/settings"
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cream-50 gold-border card-shadow text-gold-700 text-sm font-semibold hover:bg-cream-100 active:scale-[0.97] transition-all">
            <Settings className="w-5 h-5" />
            ตั้งค่าระบบ
          </Link>
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, bg, border }: { icon: React.ReactNode; value: string | number; label: string; bg: string; border: string }) {
  return (
    <div className={`${bg} border ${border} rounded-2xl px-4 py-3 card-shadow`}>
      <div className="mb-1">{icon}</div>
      <p className="text-xl font-bold text-gold-800">{value}</p>
      <p className="text-[10px] text-gold-500">{label}</p>
    </div>
  );
}

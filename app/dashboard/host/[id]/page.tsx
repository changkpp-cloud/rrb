import Link from "next/link";
import { ArrowLeft, Users, Download } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Donation } from "@/lib/supabase/types";
import { getMemorialById, formatThaiDate } from "@/lib/memorial";

export const dynamic = "force-dynamic";

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("donations").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? [];
  } catch { return []; }
}

export default async function HostFuneralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = await getMemorialById(id);
  if (!memorial) return null;
  const donations = await getDonations(memorial.id);

  const confirmed = donations.filter(d => d.status === "confirmed");
  const totalAmount = confirmed.reduce((s, d) => s + d.amount, 0);
  const serviceFee  = confirmed.length * 100;
  const netAmount   = Math.max(0, totalAmount - serviceFee);

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard/host" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">Dashboard เจ้าภาพ</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Host Dashboard</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Memorial info card */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 flex items-start gap-3">
          <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-gold-300 shrink-0 bg-gold-100 flex items-center justify-center">
            {memorial.photo_url
              ? <img src={memorial.photo_url} alt="" className="w-full h-full object-cover" />
              : <LotusIcon className="w-8 h-8 text-gold-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-gold-800 leading-tight">{memorial.name}</p>
            {memorial.birth_date && memorial.death_date && (
              <p className="text-[10px] text-gold-500 mt-0.5">
                ชาตะ {formatThaiDate(memorial.birth_date)} · มรณะ {formatThaiDate(memorial.death_date)}
              </p>
            )}
            <p className="text-[11px] text-gold-600 mt-1">
              ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}
            </p>
            <p className="text-[10px] text-gold-500">{[memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ")}</p>
            {memorial.host_code && (
              <span className="mt-1.5 inline-block text-[9px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-semibold">
                รหัส: {memorial.host_code}
              </span>
            )}
          </div>
        </div>

        {/* Financial summary */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">สรุปยอดเงิน</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-gold-800">{totalAmount.toLocaleString()}</p>
              <p className="text-[9px] text-gold-500">ยอดรวม (฿)</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">-{serviceFee.toLocaleString()}</p>
              <p className="text-[9px] text-gold-500">ค่าดำเนินการ (฿)</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-700">{netAmount.toLocaleString()}</p>
              <p className="text-[9px] text-gold-500">สุทธิเจ้าภาพ (฿)</p>
            </div>
          </div>
          <div className="pt-1 border-t border-gold-200 flex items-center justify-between text-xs text-gold-600">
            <span><span className="font-semibold">{confirmed.length}</span> รายร่วมบุญ</span>
            <span><span className="font-semibold">{donations.length}</span> รายทั้งหมด</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/dashboard/host/${id}/donors`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.97] transition-all">
            <Users className="w-5 h-5" />
            รายชื่อผู้ร่วมบุญ
          </Link>
          <Link href={`/dashboard/host/${id}/summary`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cream-50 gold-border card-shadow text-gold-700 text-sm font-semibold hover:bg-cream-100 active:scale-[0.97] transition-all">
            <Download className="w-5 h-5" />
            สรุปพิธีกร
          </Link>
        </div>

        {/* Recent donors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-gold-700 uppercase tracking-wider">ล่าสุด</p>
            <Link href={`/dashboard/host/${id}/donors`} className="text-[11px] text-gold-500">ดูทั้งหมด →</Link>
          </div>
          {donations.length === 0 && (
            <div className="bg-cream-50 rounded-2xl gold-border px-4 py-8 text-center">
              <Users className="w-7 h-7 text-gold-300 mx-auto mb-2" />
              <p className="text-sm text-gold-400">ยังไม่มีผู้ร่วมบุญ</p>
            </div>
          )}
          {donations.slice(0, 5).map(d => (
            <div key={d.id} className="flex items-center gap-3 bg-cream-50 rounded-2xl gold-border px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-gold-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-800 truncate">{d.donor_name}</p>
                {d.donor_title && <p className="text-[10px] text-gold-500 truncate">{d.donor_title}</p>}
              </div>
              <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
            </div>
          ))}
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Users, Download } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Donation } from "@/lib/supabase/types";
import { getMemorialById, DEMO_MEMORIAL, formatThaiDate } from "@/lib/memorial";

export const revalidate = 30;

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("donations").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? [];
  } catch { return []; }
}

const NAMEPLATE_COLORS: Record<string, string> = {
  pending: "text-gray-500 bg-gray-100",
  queued: "text-blue-600 bg-blue-50",
  printed: "text-emerald-600 bg-emerald-50",
  posted: "text-gold-700 bg-gold-100",
};
const NAMEPLATE_LABELS: Record<string, string> = {
  pending: "รอกรอก", queued: "รอพิมพ์", printed: "พิมพ์แล้ว", posted: "ติดบอร์ด",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function HostDonorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = (await getMemorialById(id)) ?? DEMO_MEMORIAL;
  const donations = await getDonations(memorial.id);

  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending = donations.filter(d => d.status === "pending");
  const total = confirmed.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href={`/dashboard/host/${id}`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">รายชื่อผู้ร่วมบุญ</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Donor List</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <Link href={`/dashboard/host/${id}/summary`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <Download className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-500" />
            <span className="text-sm text-gold-700">
              <span className="font-bold">{confirmed.length}</span> ยืนยัน
              {pending.length > 0 && <span className="text-amber-600 ml-2"><span className="font-bold">{pending.length}</span> รอตรวจ</span>}
            </span>
          </div>
          <p className="text-sm font-bold text-gold-800">{total.toLocaleString()} ฿</p>
        </div>

        <div className="space-y-2">
          {donations.length === 0 && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
              <Users className="w-8 h-8 text-gold-300 mx-auto mb-2" />
              <p className="text-sm text-gold-500">ยังไม่มีผู้ร่วมบุญ</p>
            </div>
          )}
          {donations.map((d, i) => (
            <div key={d.id} className="bg-cream-50 rounded-2xl gold-border px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-gold-600">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-800 leading-tight">{d.donor_name}</p>
                {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
                {d.message && <p className="text-[10px] text-gold-400 italic mt-0.5">"{d.message}"</p>}
                <p className="text-[9px] text-gold-400 mt-0.5">{formatDate(d.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gold-700">{d.amount.toLocaleString()} ฿</p>
                <div className="flex flex-col items-end gap-1 mt-0.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${NAMEPLATE_COLORS[d.nameplate_status]}`}>
                    {NAMEPLATE_LABELS[d.nameplate_status]}
                  </span>
                  {d.status === "pending" && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">รอตรวจ</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
}

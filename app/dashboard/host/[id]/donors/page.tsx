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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function HostDonorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = await getMemorialById(id);
  if (!memorial) return null;
  const donations = await getDonations(memorial.id);

  const confirmed = donations.filter(d => d.status === "confirmed");
  const total = confirmed.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
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

        {/* Summary bar */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-500" />
            <span className="text-sm text-gold-700">
              <span className="font-bold">{confirmed.length}</span> ราย
            </span>
          </div>
          <p className="text-sm font-bold text-gold-800">{total.toLocaleString()} ฿</p>
        </div>

        {/* Donor list */}
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
              <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
            </div>
          ))}
        </div>

        <div className="h-2" />
      </main>
    </div>
  );
}

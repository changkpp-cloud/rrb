import Link from "next/link";
import { ArrowLeft, User, Clock, CheckCircle2, XCircle } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createClient } from "@/lib/supabase/server";
import type { Donation } from "@/lib/supabase/types";

const DEMO_DONATIONS: Donation[] = [
  { id: "1", memorial_id: "demo", donor_name: "นายสมชาย ใจดี", amount: 500, message: "ขอแสดงความเสียใจอย่างสุดซึ้ง", slip_url: null, status: "confirmed", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", memorial_id: "demo", donor_name: "นางสาวมาลี รักดี", amount: 300, message: "ด้วยความอาลัย", slip_url: null, status: "pending", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", memorial_id: "demo", donor_name: "นายวิชัย เจริญ", amount: 1000, message: null, slip_url: null, status: "confirmed", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", memorial_id: "demo", donor_name: "นางประไพ สุขใส", amount: 200, message: "ด้วยความอาลัย", slip_url: null, status: "rejected", created_at: new Date(Date.now() - 172800000).toISOString() },
];

async function getDonations(): Promise<Donation[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? DEMO_DONATIONS;
  } catch {
    return DEMO_DONATIONS;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: Donation["status"] }) {
  if (status === "confirmed") return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว
    </span>
  );
  if (status === "rejected") return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> ปฏิเสธ
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> รอตรวจสอบ
    </span>
  );
}

export default async function DonorsPage() {
  const donations = await getDonations();
  const total = donations.filter(d => d.status === "confirmed").reduce((s, d) => s + d.amount, 0);

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}
    >
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text tracking-wide">รายชื่อผู้ร่วมบุญ</p>
              <p className="text-[9px] text-gold-500 tracking-widest uppercase -mt-0.5">Donors</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Summary card */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gold-500">ผู้ร่วมบุญทั้งหมด</p>
            <p className="text-2xl font-bold text-gold-800">{donations.length} <span className="text-sm font-normal text-gold-500">ราย</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gold-500">ยอดรวม (ยืนยันแล้ว)</p>
            <p className="text-2xl font-bold text-gold-800">{total.toLocaleString()} <span className="text-sm font-normal text-gold-500">บาท</span></p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { label: "ทั้งหมด", count: donations.length },
            { label: "รอตรวจ", count: donations.filter(d => d.status === "pending").length },
            { label: "ยืนยัน", count: donations.filter(d => d.status === "confirmed").length },
          ].map(tab => (
            <div key={tab.label} className="flex-1 bg-cream-50 rounded-xl gold-border px-3 py-2 text-center">
              <p className="text-base font-bold text-gold-800">{tab.count}</p>
              <p className="text-[10px] text-gold-500">{tab.label}</p>
            </div>
          ))}
        </div>

        {/* Donor list */}
        <div className="space-y-2">
          {donations.length === 0 && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-8 text-center">
              <User className="w-8 h-8 text-gold-300 mx-auto mb-2" />
              <p className="text-sm text-gold-500">ยังไม่มีผู้ร่วมบุญ</p>
            </div>
          )}
          {donations.map(d => (
            <div key={d.id} className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-100 border border-gold-200 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gold-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gold-800 truncate">{d.donor_name}</p>
                  <p className="text-sm font-bold text-gold-700 shrink-0">{d.amount.toLocaleString()} ฿</p>
                </div>
                {d.message && <p className="text-[11px] text-gold-500 mt-0.5 truncate">{d.message}</p>}
                <div className="flex items-center justify-between mt-1.5">
                  <StatusBadge status={d.status} />
                  <p className="text-[10px] text-gold-400">{formatDate(d.created_at)}</p>
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

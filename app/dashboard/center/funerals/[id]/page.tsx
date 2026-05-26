import Link from "next/link";
import { ArrowLeft, Users, Banknote, Printer, Edit, QrCode } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createClient } from "@/lib/supabase/server";
import type { Donation } from "@/lib/supabase/types";
import { getMemorialById, DEMO_MEMORIAL, formatThaiDate } from "@/lib/memorial";

export const revalidate = 30;

const DEMO_DONATIONS: Donation[] = [
  { id: "1", memorial_id: "demo", donor_name: "นายสมชาย ใจดี", donor_title: "ผู้อำนวยการ", amount: 500, message: "ขอแสดงความเสียใจ", slip_url: null, status: "confirmed", nameplate_status: "posted", created_at: new Date(Date.now()-3600000).toISOString() },
  { id: "2", memorial_id: "demo", donor_name: "นางสาวมาลี รักดี", donor_title: null, amount: 300, message: null, slip_url: null, status: "confirmed", nameplate_status: "printed", created_at: new Date(Date.now()-7200000).toISOString() },
  { id: "3", memorial_id: "demo", donor_name: "นายวิชัย เจริญ", donor_title: null, amount: 1000, message: null, slip_url: null, status: "pending", nameplate_status: "pending", created_at: new Date(Date.now()-86400000).toISOString() },
];

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("donations").select("*").eq("memorial_id", memorialId).order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? DEMO_DONATIONS;
  } catch { return DEMO_DONATIONS; }
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

export default async function CenterFuneralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memorial = (await getMemorialById(id)) ?? DEMO_MEMORIAL;
  const donations = await getDonations(memorial.id);

  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending = donations.filter(d => d.status === "pending");
  const totalAmount = confirmed.reduce((s, d) => s + d.amount, 0);
  const serviceFee = confirmed.length * 100;
  const netAmount = Math.max(0, totalAmount - serviceFee);

  const nameplateCounts = {
    pending: donations.filter(d => d.nameplate_status === "pending").length,
    queued: donations.filter(d => d.nameplate_status === "queued").length,
    printed: donations.filter(d => d.nameplate_status === "printed").length,
    posted: donations.filter(d => d.nameplate_status === "posted").length,
  };

  const donorQrUrl = `/memorial/${memorial.slug ?? memorial.id}`;

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse 110% 40% at 50% -5%,rgba(245,222,170,0.32) 0%,transparent 100%),linear-gradient(180deg,#FFF8F1 0%,#F7F3EA 35%,#F1E6DC 65%,#F7F3EA 85%,#FFF8F1 100%)" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard/center" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text">จัดการงานศพ</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">Funeral Management</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Memorial info */}
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
            <p className="text-[11px] text-gold-600 mt-1">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
            <p className="text-[10px] text-gold-500">{[memorial.ceremony_location, memorial.ceremony_hall].filter(Boolean).join(" ")}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {memorial.host_code && (
                <span className="text-[9px] bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-semibold">
                  รหัสเจ้าภาพ: {memorial.host_code}
                </span>
              )}
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${memorial.funeral_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {memorial.funeral_status === "active" ? "เปิดอยู่" : memorial.funeral_status === "closed" ? "ปิดแล้ว" : "ร่าง"}
              </span>
            </div>
          </div>
        </div>

        {/* Host info */}
        {(memorial.host_name || memorial.host_phone) && (
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-3 flex items-center gap-3">
            <Users className="w-4 h-4 text-gold-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gold-700">{memorial.host_name}</p>
              {memorial.host_phone && <p className="text-[10px] text-gold-500">{memorial.host_phone}</p>}
            </div>
          </div>
        )}

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
            <span><span className="font-semibold">{confirmed.length}</span> ยืนยัน</span>
            {pending.length > 0 && <span className="text-amber-600"><span className="font-semibold">{pending.length}</span> รอตรวจ</span>}
            <span><span className="font-semibold">{donations.length}</span> ทั้งหมด</span>
          </div>
        </div>

        {/* Nameplate status */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gold-600 uppercase tracking-wider">สถานะป้ายชื่อ</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["pending","queued","printed","posted"] as const).map(k => (
              <div key={k} className={`rounded-xl px-2 py-2 ${NAMEPLATE_COLORS[k]}`}>
                <p className="text-lg font-bold">{nameplateCounts[k]}</p>
                <p className="text-[8px] font-medium leading-tight">{NAMEPLATE_LABELS[k]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/dashboard/center/slips`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl gold-gradient text-white text-sm font-semibold shadow-md hover:opacity-90 active:scale-[0.97] transition-all">
            <Banknote className="w-5 h-5" />
            ตรวจสลิป
          </Link>
          <Link href={`/dashboard/center/print`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cream-50 gold-border card-shadow text-gold-700 text-sm font-semibold hover:bg-cream-100 active:scale-[0.97] transition-all">
            <Printer className="w-5 h-5" />
            พิมพ์ป้าย
          </Link>
          <Link href={donorQrUrl}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cream-50 gold-border card-shadow text-gold-700 text-sm font-semibold hover:bg-cream-100 active:scale-[0.97] transition-all">
            <QrCode className="w-5 h-5" />
            หน้าร่วมบุญ
          </Link>
          <Link href={`/dashboard/host/${memorial.id}`}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cream-50 gold-border card-shadow text-gold-700 text-sm font-semibold hover:bg-cream-100 active:scale-[0.97] transition-all">
            <Users className="w-5 h-5" />
            มุมเจ้าภาพ
          </Link>
        </div>

        {/* Recent donations */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gold-700 uppercase tracking-wider px-1">ล่าสุด</p>
          {donations.slice(0, 5).map(d => (
            <div key={d.id} className="flex items-center gap-3 bg-cream-50 rounded-2xl gold-border px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-800 truncate">{d.donor_name}</p>
                {d.donor_title && <p className="text-[10px] text-gold-500">{d.donor_title}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gold-700">{d.amount.toLocaleString()} ฿</p>
                <div className="flex gap-1 justify-end mt-0.5">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${d.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-700"}`}>
                    {d.status === "pending" ? "รอตรวจ" : "ยืนยัน"}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${NAMEPLATE_COLORS[d.nameplate_status]}`}>
                    {NAMEPLATE_LABELS[d.nameplate_status]}
                  </span>
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

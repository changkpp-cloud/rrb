import Link from "next/link";
import { ArrowLeft, Users, ExternalLink, Pencil } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Memorial, Donation } from "@/lib/supabase/types";
import { getMemorialById, formatThaiDate } from "@/lib/memorial";
import VerifyDonationButton from "./VerifyDonationButton";
import CloseMemorialButton from "./CloseMemorialButton";

const SYSTEM_FEE = 100;

export const revalidate = 30;

async function getDonations(memorialId: string): Promise<Donation[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("memorial_id", memorialId)
      .order("created_at", { ascending: false });
    return (data as Donation[] | null) ?? [];
  } catch { return []; }
}

const NAMEPLATE_LABEL: Record<string, string> = { pending: "รอกรอก", queued: "รอพิมพ์", printed: "พิมพ์แล้ว", posted: "ติดบอร์ด" };
const STATUS_LABEL: Record<string, string> = { pending: "รอตรวจ", confirmed: "ยืนยัน", rejected: "ปฏิเสธ" };
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function CenterMemorialPage({ params }: { params: Promise<{ id: string; memId: string }> }) {
  const { id, memId } = await params;
  const memorial = await getMemorialById(memId);
  if (!memorial) return null;

  const donations = await getDonations(memorial.id);
  const confirmed = donations.filter(d => d.status === "confirmed");
  const pending = donations.filter(d => d.status === "pending");
  const total = confirmed.reduce((s, d) => s + d.amount, 0);
  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/${memorial.slug}`;

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-gold-200">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <Link href={`/dashboard/center/${id}`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <LotusIcon className="w-5 h-5 text-gold-600" />
            <div className="text-center">
              <p className="text-sm font-bold gold-gradient-text truncate max-w-[160px]">{memorial.name}</p>
              <p className="text-[9px] text-gold-500 -mt-0.5">ฌาปนกิจ {formatThaiDate(memorial.ceremony_date)}</p>
            </div>
            <LotusIcon className="w-5 h-5 text-gold-600 scale-x-[-1]" />
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/dashboard/center/${id}/memorial/${memId}/edit`} className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all" title="แก้ไขข้อมูล">
              <Pencil className="w-3.5 h-3.5" />
            </Link>
            <a href={`/${memorial.slug}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-gold-300 bg-cream-50 flex items-center justify-center text-gold-600 hover:bg-gold-50 transition-all">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Stats */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-gold-800">{confirmed.length}</p>
            <p className="text-[10px] text-gold-500">ยืนยันแล้ว</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{pending.length}</p>
            <p className="text-[10px] text-gold-500">รอตรวจ</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gold-800">{total.toLocaleString()}</p>
            <p className="text-[10px] text-gold-500">บาท</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-1.5 text-xs text-gold-600">
          <div className="flex justify-between">
            <span className="text-gold-400">รหัสเจ้าภาพ</span>
            <span className="font-bold text-gold-800 tracking-wider">{memorial.host_code || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gold-400">เจ้าภาพ</span>
            <span>{memorial.host_name || "-"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gold-400 shrink-0">ลิงก์หน้างาน</span>
            <a href={`/${memorial.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline truncate text-right">{memorial.slug}</a>
          </div>
        </div>

        {/* Donation list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gold-600 px-1">
            รายการร่วมบุญ
            {pending.length > 0 && <span className="ml-2 text-amber-600">{pending.length} รายการรอตรวจ</span>}
          </p>

          {donations.length === 0 && (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-8 text-center">
              <Users className="w-8 h-8 text-gold-300 mx-auto mb-2" />
              <p className="text-sm text-gold-400">ยังไม่มีผู้ร่วมบุญ</p>
            </div>
          )}

          {donations.map((d, i) => (
            <div key={d.id} className="bg-cream-50 rounded-2xl gold-border px-4 py-3">
              <div className="flex items-start gap-3">
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
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${STATUS_COLOR[d.status]}`}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
              </div>
              {d.slip_url && (
                <div className="mt-2 ml-10">
                  <a href={d.slip_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline">ดูสลิป</a>
                </div>
              )}
              {d.status === "pending" && (
                <div className="mt-2 ml-10 flex gap-2">
                  <VerifyDonationButton donationId={d.id} action="confirmed" label="ยืนยัน" />
                  <VerifyDonationButton donationId={d.id} action="rejected" label="ปฏิเสธ" variant="danger" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Close memorial / transfer money */}
        <CloseMemorialButton
          memorialId={memorial.id}
          totalAmount={total}
          hostBankName={memorial.host_bank_name ?? null}
          hostBankAccount={memorial.host_bank_account_number ?? null}
          hostBankAccountName={memorial.host_bank_account_name ?? null}
          systemFee={SYSTEM_FEE}
          isClosed={memorial.funeral_status === "closed"}
        />

        <div className="h-2" />
      </main>
    </div>
  );
}

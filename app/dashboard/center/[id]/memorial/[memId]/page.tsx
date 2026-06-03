import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ExternalLink,
  Info,
  Pencil,
  Printer,
  ScrollText,
  Users,
} from "lucide-react";
import CenterMemorialScrollNav from "@/components/CenterMemorialScrollNav";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess } from "@/lib/iam";
import type { Donation } from "@/lib/supabase/types";
import { formatThaiDate, getMemorialById } from "@/lib/memorial";
import CloseMemorialButton from "./CloseMemorialButton";
import VerifyDonationButton from "./VerifyDonationButton";

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
  } catch {
    return [];
  }
}

const NAMEPLATE_LABEL: Record<string, string> = {
  pending: "รอจัดคิว",
  queued: "รอพิมพ์",
  printed: "พิมพ์แล้ว",
  posted: "ติดบอร์ดแล้ว",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "รอตรวจ",
  confirmed: "ยืนยัน",
  rejected: "ปฏิเสธ",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

export default async function CenterMemorialPage({ params }: { params: Promise<{ id: string; memId: string }> }) {
  const { id, memId } = await params;
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const memorial = await getMemorialById(memId);
  if (!memorial) return null;

  const donations = await getDonations(memorial.id);
  const pending = donations.filter((d) => d.status === "pending");
  const confirmed = donations.filter((d) => d.status === "confirmed");
  const rejected = donations.filter((d) => d.status === "rejected");
  const printQueue = confirmed.filter((d) => d.nameplate_status === "pending" || d.nameplate_status === "queued");
  const printed = confirmed.filter((d) => d.nameplate_status === "printed");
  const posted = confirmed.filter((d) => d.nameplate_status === "posted");
  const total = confirmed.reduce((s, d) => s + d.amount, 0);
  const netAmount = Math.max(total - SYSTEM_FEE, 0);

  return (
    <div className="min-h-screen bg-white">
      <IosPageHeader
        title={memorial.name}
        subtitle={`ฌาปนกิจ ${formatThaiDate(memorial.ceremony_date)}`}
        backHref={`/dashboard/center/${id}`}
        rightSlot={
          <div className="flex items-center gap-1.5">
            <HeaderIcon href={`/dashboard/center/${id}/memorial/${memId}/edit`} label="แก้ไขข้อมูลงาน" icon={Pencil} />
            <HeaderIcon href={`/${memorial.slug}`} label="เปิดหน้างาน" icon={ExternalLink} external />
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="ยืนยันแล้ว" value={confirmed.length.toLocaleString()} tone="emerald" />
          <Stat label="รอตรวจ" value={pending.length.toLocaleString()} tone="amber" />
          <Stat label="ยอดรวม" value={total.toLocaleString()} tone="gold" />
        </div>

        <CenterMemorialScrollNav />

        <section id="overview" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Info} title="ภาพรวมงาน" subtitle="ข้อมูลหลักของงานและสถานะรวม" />
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
            <InfoRow label="รหัสเจ้าภาพ" value={memorial.host_code || "-"} strong />
            <InfoRow label="เจ้าภาพ" value={memorial.host_name || "-"} />
            <InfoRow label="สถานที่" value={memorial.ceremony_location || "-"} />
            <InfoRow label="วันที่ฌาปนกิจ" value={formatThaiDate(memorial.ceremony_date)} />
            <div className="flex justify-between gap-2">
              <span className="text-gold-400 shrink-0">ลิงก์หน้างาน</span>
              <a href={`/${memorial.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline truncate text-right">
                {memorial.slug}
              </a>
            </div>
          </div>
        </section>

        <section id="slips" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={AlertTriangle} title="ตรวจสลิป" subtitle={`${pending.length} รายการรอตรวจ · ${rejected.length} รายการปฏิเสธ`} />
          {pending.length === 0 ? <Empty icon={CheckCircle2} text="ไม่มีสลิปรอตรวจ" /> : <DonationList donations={pending} mode="verify" />}
        </section>

        <section id="print" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Printer} title="คิวพิมพ์ป้าย" subtitle={`${printQueue.length} รอพิมพ์ · ${printed.length} พิมพ์แล้ว · ${posted.length} ติดบอร์ดแล้ว`} />
          {printQueue.length === 0 && printed.length === 0 ? (
            <Empty icon={Printer} text="ไม่มีคิวพิมพ์ป้ายค้าง" />
          ) : (
            <DonationList donations={[...printQueue, ...printed]} mode="nameplate" />
          )}
        </section>

        <section id="donors" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Users} title="รายชื่อผู้ร่วมบุญ" subtitle={`${confirmed.length} รายการยืนยันแล้ว`} />
          {confirmed.length === 0 ? <Empty icon={Users} text="ยังไม่มีผู้ร่วมบุญที่ยืนยันแล้ว" /> : <DonationList donations={confirmed} mode="donor" />}
        </section>

        <section id="finance" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Banknote} title="การเงิน" subtitle={`ยอดสุทธิประมาณ ${netAmount.toLocaleString()} บาท หลังหักค่าดำเนินการ ${SYSTEM_FEE.toLocaleString()} บาท`} />
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
            <InfoRow label="ยอดร่วมบุญยืนยันแล้ว" value={`${total.toLocaleString()} บาท`} strong />
            <InfoRow label="ค่าดำเนินการระบบ" value={`-${SYSTEM_FEE.toLocaleString()} บาท`} />
            <InfoRow label="ยอดสุทธิโอนเจ้าภาพ" value={`${netAmount.toLocaleString()} บาท`} strong />
            <InfoRow label="ธนาคารเจ้าภาพ" value={memorial.host_bank_name || "-"} />
            <InfoRow label="เลขบัญชี" value={memorial.host_bank_account_number || "-"} />
            <InfoRow label="ชื่อบัญชี" value={memorial.host_bank_account_name || "-"} />
          </div>
        </section>

        <section id="close" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={ScrollText} title="ปิดงาน" subtitle="ตรวจสลิป คิวป้าย และการเงินให้ครบก่อนปิดงาน" />
          {pending.length > 0 || printQueue.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">ควรตรวจรายการค้างก่อนปิดงาน</p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                ยังมี {pending.length} สลิปรอตรวจ และ {printQueue.length} ป้ายรอพิมพ์
              </p>
            </div>
          ) : null}
          <CloseMemorialButton
            memorialId={memorial.id}
            totalAmount={total}
            hostBankName={memorial.host_bank_name ?? null}
            hostBankAccount={memorial.host_bank_account_number ?? null}
            hostBankAccountName={memorial.host_bank_account_name ?? null}
            systemFee={SYSTEM_FEE}
            isClosed={memorial.funeral_status === "closed"}
          />
        </section>

        <div className="h-4" />
      </main>
    </div>
  );
}

function HeaderIcon({ external, href, icon: Icon, label }: { external?: boolean; href: string; icon: React.ElementType; label: string }) {
  const className = "flex items-center justify-center w-8 h-8 rounded-full active:scale-90 transition-transform";
  const style = {
    background: "rgba(14,9,2,0.75)",
    backdropFilter: "blur(24px)",
    border: "0.5px solid rgba(255,255,255,0.10)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.24)",
    WebkitBackdropFilter: "blur(24px)",
  };

  if (external) {
    return (
      <a href={href} title={label} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <Icon className="w-3.5 h-3.5 text-gold-300" />
      </a>
    );
  }

  return (
    <Link href={href} title={label} className={className} style={style}>
      <Icon className="w-3.5 h-3.5 text-gold-300" />
    </Link>
  );
}

function Stat({ label, tone, value }: { label: string; tone: "amber" | "emerald" | "gold"; value: string }) {
  const color = { amber: "text-amber-600", emerald: "text-emerald-600", gold: "text-gold-800" }[tone];
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-3 py-3">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gold-500">{label}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, subtitle, title }: { icon: React.ElementType; subtitle: string; title: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-base font-bold text-gold-800">{title}</h2>
        <p className="text-[11px] text-gold-500 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gold-400 shrink-0">{label}</span>
      <span className={`${strong ? "font-bold text-gold-800 tracking-wider" : ""} text-right`}>{value}</span>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-8 text-center">
      <Icon className="w-8 h-8 text-gold-300 mx-auto mb-2" />
      <p className="text-sm text-gold-400">{text}</p>
    </div>
  );
}

function DonationList({ donations, mode }: { donations: Donation[]; mode: "donor" | "nameplate" | "verify" }) {
  return (
    <div className="space-y-2">
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
                {mode === "nameplate" || mode === "donor" ? NAMEPLATE_LABEL[d.nameplate_status] : STATUS_LABEL[d.status]}
              </span>
            </div>
          </div>
          {d.slip_url && (
            <div className="mt-2 ml-10">
              <a href={d.slip_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline">
                ดูสลิป
              </a>
            </div>
          )}
          {mode === "verify" && (
            <div className="mt-2 ml-10 flex gap-2">
              <VerifyDonationButton donationId={d.id} action="confirmed" label="ยืนยัน" />
              <VerifyDonationButton donationId={d.id} action="rejected" label="ปฏิเสธ" variant="danger" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


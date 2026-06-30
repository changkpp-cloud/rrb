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
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { canEditCenterWork, getCenterAccess } from "@/lib/iam";
import type { Donation } from "@/lib/supabase/types";
import { formatThaiDate, getMemorialById } from "@/lib/memorial";
import CloseMemorialButton from "./CloseMemorialButton";
import MemorialShareCard from "@/components/MemorialShareCard";
import HostVerificationReview from "@/components/HostVerificationReview";
import CenterMemorialDocsForm from "@/components/CenterMemorialDocsForm";
import TransferConfirmButton from "@/components/TransferConfirmButton";
import HostPhoneVerify from "@/components/HostPhoneVerify";
import NameplateActions from "@/components/NameplateActions";
import PrinterStatusAlert from "@/components/PrinterStatusAlert";
import { getSiteUrl } from "@/lib/site-url";
import { systemFee, netToHost, FEE_RATE } from "@/lib/fee";

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
  queued: "ส่งพิมพ์แล้ว",
  printed: "ส่งพิมพ์แล้ว",
  posted: "ส่งพิมพ์แล้ว",
  error: "พิมพ์ไม่สำเร็จ",
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
  const { id: routeKey, memId } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");
  const canEdit = canEditCenterWork(access.role);

  const memorial = await getMemorialById(memId);
  if (!memorial) return null;
  if (memorial.center_id !== id) redirect(`/dashboard/center/${centerRouteKey}`);

  const donations = await getDonations(memorial.id);
  const confirmed = donations.filter((d) => d.status === "confirmed");
  const rejected = donations.filter((d) => d.status === "rejected");
  const slipEvidence = donations.filter((d) => d.slip_url);
  const slipWarnings = donations.filter((d) => d.slip_duplicate_warning);
  const printQueue = confirmed.filter((d) => d.nameplate_status === "pending" || d.nameplate_status === "queued");
  const printed = confirmed.filter((d) => d.nameplate_status === "printed");
  const posted = confirmed.filter((d) => d.nameplate_status === "posted");
  const printError = confirmed.filter((d) => (d.nameplate_status as string) === "error");
  const total = confirmed.reduce((s, d) => s + d.amount, 0);
  const systemFeeTotal = systemFee(total);
  const netAmount = netToHost(total);

  return (
    <div className="min-h-screen bg-white">
      <IosPageHeader
        title={memorial.name}
        subtitle={`ฌาปนกิจ ${formatThaiDate(memorial.ceremony_date)}`}
        backHref={`/dashboard/center/${centerRouteKey}`}
        backLabel="หน้าศูนย์"
        rightSlot={
          <div className="flex items-center gap-1.5">
            {canEdit && <HeaderIcon href={`/dashboard/center/${centerRouteKey}/memorial/${memId}/edit`} label="แก้ไขข้อมูลงาน" icon={Pencil} />}
            <HeaderIcon href={`/${memorial.slug}`} label="เปิดหน้างาน" icon={ExternalLink} external />
          </div>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-6">
        <PrinterStatusAlert memorialId={memorial.id} />
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="รับร่วมบุญแล้ว" value={confirmed.length.toLocaleString()} tone="emerald" />
          <Stat label="พิมพ์ไม่สำเร็จ" value={printError.length.toLocaleString()} tone={printError.length > 0 ? "amber" : "gold"} />
          <Stat label="ยอดรวม" value={total.toLocaleString()} tone="gold" />
        </div>

        <CenterMemorialScrollNav />

        <section id="overview" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Info} title="ภาพรวมงาน" subtitle="ข้อมูลหลักของงานและสถานะรวม" />
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
            <InfoRow label="รหัสเจ้าภาพ" value={memorial.host_code || "-"} strong />
            <InfoRow label="เจ้าภาพ" value={memorial.host_name || "-"} />
            <InfoRow label="สถานที่" value={memorial.ceremony_location || "-"} />
            <InfoRow label="วันฌาปนกิจ" value={formatThaiDate(memorial.ceremony_date)} />
          </div>

          <MemorialShareCard
            publicUrl={`${getSiteUrl()}/${memorial.slug}?openExternalBrowser=1`}
            slug={memorial.slug}
          />
          {canEdit ? (
            <Link
              href={`/dashboard/center/${centerRouteKey}/memorial/${memId}/edit`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-800 transition-colors hover:bg-gold-100"
            >
              <Pencil className="h-4 w-4" />
              แก้ไขวัด / วันเวลา / กำหนดการสวด
            </Link>
          ) : (
            <ReadOnlyNotice text="สิทธิ์นี้ดูข้อมูลงานได้อย่างเดียว ไม่สามารถแก้ไขรายละเอียดงานได้" />
          )}
        </section>

        <section id="slips" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={AlertTriangle} title="แจ้งเตือนสลิปซ้ำ" subtitle={`${slipWarnings.length} รายการย้อนหลัง`} />
          {slipWarnings.length === 0 ? (
            <Empty icon={CheckCircle2} text="ไม่มีสลิปซ้ำที่ต้องดูย้อนหลัง" />
          ) : (
            <DonationList donations={slipWarnings} mode="warning" />
          )}
          {rejected.length > 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] leading-relaxed text-red-700">
              ปฏิเสธ {rejected.length} รายการ
            </div>
          ) : null}
        </section>

        <section id="print" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Printer} title="ป้ายชื่อ" subtitle={`${printQueue.length + printed.length + posted.length} ส่งพิมพ์แล้ว · ${printError.length} พิมพ์ไม่สำเร็จ`} />
          {printError.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm font-semibold text-red-700">พิมพ์ไม่สำเร็จ {printError.length} รายการ</p>
              </div>
              <div className="space-y-1.5 pt-1">
                {printError.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs text-red-700 bg-red-100 rounded-xl px-3 py-2">
                    <span className="font-semibold">{d.donor_name}</span>
                    {d.donor_title && <span className="text-red-500">{d.donor_title}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {confirmed.length === 0 ? (
            <Empty icon={Printer} text="ยังไม่มีป้ายชื่อ" />
          ) : (
            <DonationList donations={[...printError, ...printQueue, ...printed, ...posted]} mode="nameplate" canEdit={canEdit} />
          )}
        </section>

        <section id="donors" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Users} title="รายชื่อผู้ร่วมบุญ" subtitle={`${confirmed.length} รายการรับร่วมบุญแล้ว`} />
          {confirmed.length === 0 ? <Empty icon={Users} text="ยังไม่มีผู้ร่วมบุญ" /> : <DonationList donations={confirmed} mode="donor" />}
        </section>

        <section id="host-verify" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={CheckCircle2} title="เอกสารและบัญชีเจ้าภาพ" subtitle="ศูนย์เพิ่ม/แก้ใบมรณะบัตร บัตรประชาชน และบัญชีรับเงินได้ แล้วยืนยันสิทธิ์เจ้าภาพ" />
          {canEdit ? (
            <>
              <CenterMemorialDocsForm memorial={memorial} />
              <HostVerificationReview memorial={memorial} />
            </>
          ) : (
            <ReadOnlyNotice text="สิทธิ์นี้ดูข้อมูลเอกสารและบัญชีเจ้าภาพได้ แต่ไม่สามารถอัปโหลดหรือยืนยันเอกสารได้" />
          )}
        </section>

        <section id="finance" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={Banknote} title="การเงิน" subtitle={`เงินเข้าบัญชีเจ้าภาพโดยตรง · ค่าดำเนินการ ${systemFeeTotal.toLocaleString()} บาท เก็บคืนวันคืนบอร์ด`} />
          {canEdit ? (
            <HostPhoneVerify
              memorialId={memorial.id}
              initialPhone={memorial.host_phone ?? null}
              initialVerified={Boolean(memorial.host_phone_verified)}
              initialBankName={memorial.host_bank_name ?? null}
              initialBankAccountNumber={memorial.host_bank_account_number ?? null}
              initialBankAccountName={memorial.host_bank_account_name ?? null}
            />
          ) : (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
              <InfoRow label="ธนาคารเจ้าภาพ" value={memorial.host_bank_name || "-"} />
              <InfoRow label="เลขบัญชี" value={memorial.host_bank_account_number || "-"} />
              <InfoRow label="ชื่อบัญชี" value={memorial.host_bank_account_name || "-"} />
            </div>
          )}
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
            <InfoRow label="ยอดร่วมบุญรวม (เข้าเจ้าภาพโดยตรง)" value={`${total.toLocaleString()} บาท`} strong />
            <InfoRow label={`ค่าดำเนินการ ${FEE_RATE * 100}% (เจ้าภาพจ่ายคืนศูนย์)`} value={`${systemFeeTotal.toLocaleString()} บาท`} />
            <InfoRow label="ยอดเจ้าภาพได้สุทธิ (หลังจ่ายคืน)" value={`${netAmount.toLocaleString()} บาท`} strong />
          </div>
          {canEdit ? (
            <TransferConfirmButton
              memorialId={memorial.id}
              transferConfirmedAt={memorial.transfer_confirmed_at ?? null}
              transferConfirmedBy={memorial.transfer_confirmed_by ?? null}
              hostBankAccount={memorial.host_bank_account_number ?? null}
              isClosed={memorial.funeral_status === "closed"}
            />
          ) : (
            <ReadOnlyNotice text="สิทธิ์นี้ดูข้อมูลการเงินได้ แต่ไม่สามารถยืนยันการเก็บคืนหรือเปลี่ยนสถานะการเงินได้" />
          )}
        </section>

        <section id="close" className="scroll-mt-36 space-y-3">
          <SectionHeader icon={ScrollText} title="ปิดงาน" subtitle="ตรวจยอดรวม ป้ายค้าง · เก็บค่าดำเนินการคืน + รับคืนบอร์ดก่อนปิดงาน" />
          {printError.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">ยังมีป้ายพิมพ์ไม่สำเร็จ</p>
              <p className="text-[10px] text-amber-700 mt-0.5">{printError.length} ป้ายพิมพ์ไม่สำเร็จ — ควรกด "พิมพ์ซ้ำ" ในส่วนป้ายชื่อก่อนปิดงาน</p>
            </div>
          ) : null}
          {canEdit ? (
            <CloseMemorialButton
              memorialId={memorial.id}
              totalAmount={total}
              hostBankName={memorial.host_bank_name ?? null}
              hostBankAccount={memorial.host_bank_account_number ?? null}
              hostBankAccountName={memorial.host_bank_account_name ?? null}
              systemFee={systemFeeTotal}
              isClosed={memorial.funeral_status === "closed"}
            />
          ) : (
            <ReadOnlyNotice text="สิทธิ์นี้ดูสถานะปิดงานได้ แต่ไม่สามารถปิดงานหรือเปลี่ยนสถานะงานได้" />
          )}
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

function Stat({ label, tone, value }: { label: string; tone: "amber" | "emerald" | "gold" | boolean; value: string }) {
  const resolvedTone: "amber" | "emerald" | "gold" = typeof tone === "boolean" ? (tone ? "amber" : "gold") : tone;
  const color = { amber: "text-amber-600", emerald: "text-emerald-600", gold: "text-gold-800" }[resolvedTone];
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

function ReadOnlyNotice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-emerald-700">
      {text}
    </div>
  );
}

function DonationList({ canEdit = true, donations, mode }: { canEdit?: boolean; donations: Donation[]; mode: "donor" | "nameplate" | "warning" }) {
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
              <p className="text-sm font-bold text-gold-700">{d.amount.toLocaleString()} บาท</p>
              {mode === "warning" ? (
                <span className="mt-0.5 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                  แจ้งเตือน
                </span>
              ) : (
                <span className="mt-0.5 inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold-50 border border-gold-200 text-gold-600">
                  {NAMEPLATE_LABEL[d.nameplate_status] ?? d.nameplate_status}
                </span>
              )}
            </div>
          </div>
          {d.slip_url && (
            <div className="mt-2 ml-10">
              <a href={`/api/donations/${d.id}/slip`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 underline">
                ดูสลิป
              </a>
            </div>
          )}
          {mode === "nameplate" && canEdit && <NameplateActions donationId={d.id} />}
          {mode === "warning" && d.slip_duplicate_warning && (
            <div className="mt-2 ml-10 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">
              สลิปนี้ซ้ำกับรายการก่อนหน้า ระบบปล่อยผ่านให้พิมพ์ป้ายแล้ว เก็บไว้ตรวจย้อนหลังเท่านั้น
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Leaf,
  Printer,
  Users,
} from "lucide-react";

export const revalidate = 60;

type MemorialRow = {
  id: string;
  name: string;
  ceremony_date: string;
  funeral_status: "draft" | "active" | "closed";
  center_id: string | null;
  host_name: string | null;
  host_phone: string | null;
  host_bank_name: string | null;
  host_bank_account_number: string | null;
  host_bank_account_name: string | null;
};

type DonationRow = {
  memorial_id: string;
  donor_name: string;
  amount: number | null;
  status: "pending" | "confirmed" | "rejected";
  nameplate_status: "pending" | "queued" | "printed" | "posted";
};

async function getReports(centerId: string) {
  const supabase = createAdminClient();
  const [{ data: memorialsData }, { data: donationsData }] = await Promise.all([
    supabase
      .from("memorials")
      .select("id, name, ceremony_date, funeral_status, center_id, host_name, host_phone, host_bank_name, host_bank_account_number, host_bank_account_name")
      .eq("center_id", centerId)
      .in("funeral_status", ["active", "closed"])
      .order("ceremony_date", { ascending: false })
      .limit(80),
    supabase
      .from("donations")
      .select("memorial_id, donor_name, amount, status, nameplate_status")
      .limit(1000),
  ]);

  const memorials = ((memorialsData ?? []) as MemorialRow[]).filter((m) => m.center_id === centerId);
  const memorialIds = new Set(memorials.map((m) => m.id));
  const donations = ((donationsData ?? []) as DonationRow[]).filter((d) => memorialIds.has(d.memorial_id));

  const donationMap = new Map<string, DonationRow[]>();
  for (const d of donations) {
    const rows = donationMap.get(d.memorial_id) ?? [];
    rows.push(d);
    donationMap.set(d.memorial_id, rows);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = memorials.map((m) => {
    const allDonations = donationMap.get(m.id) ?? [];
    const confirmed = allDonations.filter((d) => d.status === "confirmed");
    const pending = allDonations.filter((d) => d.status === "pending");
    const rejected = allDonations.filter((d) => d.status === "rejected");
    const unposted = confirmed.filter((d) => d.nameplate_status !== "posted");
    const amount = confirmed.reduce((sum, d) => sum + (d.amount ?? 0), 0);
    const donors = confirmed.length;
    const ceremonyReached = new Date(m.ceremony_date) <= today;
    const readyToClose = m.funeral_status === "active" && ceremonyReached && pending.length === 0 && unposted.length === 0 && donors > 0;
    const needsReview = pending.length > 0 || unposted.length > 0 || (m.funeral_status === "closed" && !m.host_bank_account_number);

    return {
      memorial: m,
      amount,
      donors,
      pending: pending.length,
      rejected: rejected.length,
      unposted: unposted.length,
      wasteKg: donors * 2,
      readyToClose,
      needsReview,
      reportText: buildReportText({
        amount,
        centerName: "",
        donors,
        hostName: m.host_name,
        memorialName: m.name,
        wasteKg: donors * 2,
      }),
    };
  });

  return {
    ready: rows.filter((r) => r.readyToClose).slice(0, 12),
    attention: rows.filter((r) => r.memorial.funeral_status === "active" && r.needsReview).slice(0, 12),
    closed: rows.filter((r) => r.memorial.funeral_status === "closed").slice(0, 12),
    totals: rows.reduce(
      (sum, r) => ({
        amount: sum.amount + r.amount,
        donors: sum.donors + r.donors,
        pending: sum.pending + r.pending,
        unposted: sum.unposted + r.unposted,
      }),
      { amount: 0, donors: 0, pending: 0, unposted: 0 },
    ),
  };
}

function buildReportText({
  amount,
  centerName,
  donors,
  hostName,
  memorialName,
  wasteKg,
}: {
  amount: number;
  centerName: string;
  donors: number;
  hostName: string | null;
  memorialName: string;
  wasteKg: number;
}) {
  return [
    `สรุปงานหรีดร่วมบุญ: ${memorialName}`,
    centerName ? `ศูนย์ดูแล: ${centerName}` : "",
    hostName ? `เจ้าภาพ: ${hostName}` : "เจ้าภาพ: -",
    `ผู้ร่วมทำบุญที่ยืนยันแล้ว: ${donors.toLocaleString()} ราย`,
    `ยอดร่วมทำบุญรวม: ${amount.toLocaleString()} บาท`,
    `ผลลัพธ์ Zero Waste: ลดพวงหรีดสด ${donors.toLocaleString()} ชิ้น หรือประมาณ ${wasteKg.toLocaleString()} กก. ขยะ`,
    "หมายเหตุ: กรุณาตรวจสลิปและสถานะป้ายก่อนส่งรายงานนี้",
  ].filter(Boolean).join("\n");
}

export default async function CenterCloseReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const centerName = center.name ?? "ศูนย์บริหาร";
  const data = await getReports(id);

  return (
    <div className="min-h-screen">
      <IosPageHeader
        title="รายงานปิดงาน"
        subtitle={access.user ? `${centerName} · ${roleLabel(access.role)} · ${access.user.display_name}` : centerName}
        backHref={`/dashboard/center/${centerRouteKey}`}
      />

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={Users} label="ผู้ร่วมทำบุญ" value={`${data.totals.donors.toLocaleString()} ราย`} />
          <Kpi icon={Banknote} label="ยอด confirmed" value={`${data.totals.amount.toLocaleString()} บาท`} />
          <Kpi icon={Leaf} label="ลดขยะประมาณ" value={`${(data.totals.donors * 2).toLocaleString()} กก.`} />
          <Kpi icon={AlertCircle} label="ค้างตรวจ" value={`${data.totals.pending} สลิป · ${data.totals.unposted} ป้าย`} />
        </div>

        <ReportSection title="พร้อมปิดงาน" hint="ไม่มีสลิป pending และป้าย confirmed ติดบอร์ดครบแล้ว" empty="ยังไม่มีงานพร้อมปิด" icon={ClipboardCheck}>
          {data.ready.map((row) => (
            <ReportCard key={row.memorial.id} row={row} centerId={centerRouteKey} centerName={centerName} />
          ))}
        </ReportSection>

        <ReportSection title="ต้องตรวจต่อก่อนปิด" hint="ยังมีสลิปหรือป้ายค้างในงาน active" empty="ไม่มีรายการที่ต้องตรวจต่อ" icon={AlertCircle}>
          {data.attention.map((row) => (
            <ReportCard key={row.memorial.id} row={row} centerId={centerRouteKey} centerName={centerName} attention />
          ))}
        </ReportSection>

        <ReportSection title="ปิดงานแล้วล่าสุด" hint="ร่างข้อความรายงานสำหรับส่งเจ้าภาพหรือส่วนกลาง" empty="ยังไม่มีงานปิดแล้ว" icon={CheckCircle2}>
          {data.closed.map((row) => (
            <ReportCard key={row.memorial.id} row={row} centerId={centerRouteKey} centerName={centerName} showDraft />
          ))}
        </ReportSection>

        <div className="h-2" />
      </main>
    </div>
  );
}

type ReportRow = Awaited<ReturnType<typeof getReports>>["closed"][number];

function ReportCard({
  attention,
  centerId,
  centerName,
  row,
  showDraft,
}: {
  attention?: boolean;
  centerId: string;
  centerName: string;
  row: ReportRow;
  showDraft?: boolean;
}) {
  const reportText = buildReportText({
    amount: row.amount,
    centerName,
    donors: row.donors,
    hostName: row.memorial.host_name,
    memorialName: row.memorial.name,
    wasteKg: row.wasteKg,
  });

  return (
    <article className={`rounded-xl gold-border px-4 py-3 ${attention ? "bg-amber-50" : "bg-cream-50"}`}>
      <Link href={`/dashboard/center/${centerId}/memorial/${row.memorial.id}`} className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gold-800 truncate">{row.memorial.name}</p>
          <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(row.memorial.ceremony_date)}</p>
          {row.memorial.host_name && <p className="text-[10px] text-gold-500">เจ้าภาพ: {row.memorial.host_name}</p>}
        </div>
        <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
      </Link>

      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        <Mini icon={Users} label="ราย" value={row.donors.toLocaleString()} />
        <Mini icon={Banknote} label="บาท" value={row.amount.toLocaleString()} />
        <Mini icon={Leaf} label="กก." value={row.wasteKg.toLocaleString()} />
        <Mini icon={Printer} label="ค้าง" value={`${row.pending}/${row.unposted}`} warning={row.pending > 0 || row.unposted > 0} />
      </div>

      {showDraft && (
        <div className="mt-3 rounded-lg bg-white/70 border border-gold-100 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-gold-600" />
            <p className="text-[10px] font-semibold text-gold-700">ร่างข้อความรายงาน</p>
          </div>
          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-gold-700 font-sans">{reportText}</pre>
        </div>
      )}
    </article>
  );
}

function ReportSection({
  children,
  empty,
  hint,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  empty: string;
  hint: string;
  icon: React.ElementType;
  title: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-gold-800">{title}</p>
          <p className="text-[10px] text-gold-500">{hint}</p>
        </div>
      </div>
      {hasChildren ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="bg-cream-50 rounded-xl gold-border px-4 py-6 text-center">
          <p className="text-sm text-gold-400">{empty}</p>
        </div>
      )}
    </section>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-gold-800 truncate">{value}</p>
        <p className="text-[10px] text-gold-500">{label}</p>
      </div>
    </div>
  );
}

function Mini({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className={`rounded-lg py-1.5 px-1 ${warning ? "bg-amber-100" : "bg-white/70"}`}>
      <Icon className={`w-3 h-3 mx-auto mb-0.5 ${warning ? "text-amber-600" : "text-gold-500"}`} />
      <p className={`text-[11px] font-bold ${warning ? "text-amber-700" : "text-gold-800"}`}>{value}</p>
      <p className={`text-[9px] ${warning ? "text-amber-600" : "text-gold-500"}`}>{label}</p>
    </div>
  );
}

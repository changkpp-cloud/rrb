import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Plus,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import CenterDashboardScrollNav from "@/components/CenterDashboardScrollNav";
import IosPageHeader from "@/components/IosPageHeader";
import CenterSettingsForm from "@/components/CenterSettingsForm";
import CreateMemorialClient from "./create/CreateMemorialClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { canManageCenterSettings, getCenterAccess, roleLabel } from "@/lib/iam";
import type { Center, Memorial } from "@/lib/supabase/types";
import { formatThaiDate } from "@/lib/memorial";

export const revalidate = 30;

type DonationStats = {
  amount: number;
  confirmed: number;
  slipWarning: number;
  nameplatePending: number;
  nameplateQueued: number;
  nameplatePrinted: number;
  nameplatePosted: number;
};

type MemorialSummary = DonationStats & {
  memorial: Memorial;
  wasteKg: number;
};

async function getMemorials(centerId: string): Promise<Memorial[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("memorials")
      .select("*")
      .eq("center_id", centerId)
      .order("created_at", { ascending: false });
    return (data as Memorial[] | null) ?? [];
  } catch {
    return [];
  }
}

async function getDonationStats(memorialIds: string[]): Promise<Record<string, DonationStats>> {
  if (memorialIds.length === 0) return {};

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("donations")
      .select("memorial_id, status, amount, nameplate_status, slip_duplicate_warning")
      .in("memorial_id", memorialIds);

    const stats: Record<string, DonationStats> = {};
    for (const d of data ?? []) {
      if (!stats[d.memorial_id]) {
        stats[d.memorial_id] = {
          amount: 0,
          confirmed: 0,
          slipWarning: 0,
          nameplatePending: 0,
          nameplateQueued: 0,
          nameplatePrinted: 0,
          nameplatePosted: 0,
        };
      }

      const row = stats[d.memorial_id];
      if (d.slip_duplicate_warning) row.slipWarning++;
      if (d.status !== "confirmed") continue;

      row.confirmed++;
      row.amount += d.amount || 0;
      if (d.nameplate_status === "pending") row.nameplatePending++;
      if (d.nameplate_status === "queued") row.nameplateQueued++;
      if (d.nameplate_status === "printed") row.nameplatePrinted++;
      if (d.nameplate_status === "posted") row.nameplatePosted++;
    }
    return stats;
  } catch {
    return {};
  }
}

const emptyStats: DonationStats = {
  amount: 0,
  confirmed: 0,
  slipWarning: 0,
  nameplatePending: 0,
  nameplateQueued: 0,
  nameplatePrinted: 0,
  nameplatePosted: 0,
};

export default async function CenterDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gold-400 text-sm">ไม่พบข้อมูลศูนย์</p>
      </div>
    );
  }

  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const memorials = await getMemorials(id);
  const donationStats = await getDonationStats(memorials.map((m) => m.id));

  const summaries: MemorialSummary[] = memorials.map((memorial) => {
    const stats = donationStats[memorial.id] ?? emptyStats;
    return { memorial, ...stats, wasteKg: stats.confirmed * 2 };
  });

  const activeRows = summaries.filter((row) => row.memorial.funeral_status === "active");
  const closedRows = summaries.filter((row) => row.memorial.funeral_status === "closed");
  const totalAmount = summaries.reduce((sum, row) => sum + row.amount, 0);
  const totalDonors = summaries.reduce((sum, row) => sum + row.confirmed, 0);
  const slipWarningCount = summaries.reduce((sum, row) => sum + row.slipWarning, 0);
  const pendingPrintCount = summaries.reduce((sum, row) => sum + row.nameplatePending + row.nameplateQueued, 0);
  const canEditSettings = canManageCenterSettings(access.role);

  return (
    <div className="min-h-screen bg-white">
      <IosPageHeader
        title={center.name}
        subtitle={access.user ? `${roleLabel(access.role)} · ${access.user.display_name}` : "ศูนย์บริหารประจำตำบล"}
        backHref="/dashboard/center"
      />

      <main className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-6">
        <CenterDashboardScrollNav
          open={

        <section id="open" className="scroll-mt-24 space-y-3">
          <SectionHeader icon={Plus} title="1. เปิดงานใหม่" subtitle="สร้างงานใหม่และเริ่มรับร่วมทำบุญในศูนย์นี้" />
          <Link
            href={`/dashboard/center/${centerRouteKey}/create`}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            <Plus className="w-5 h-5" />
            เปิดงานศพใหม่
          </Link>
          <CreateMemorialClient centerId={id} embedded />
        </section>
          }

          active={
        <section id="active" className="scroll-mt-24 space-y-3">
          <SectionHeader
            icon={ScrollText}
            title="2. งานเปิดอยู่"
            subtitle={`${activeRows.length} งาน · ${slipWarningCount} แจ้งเตือนสลิป · ${pendingPrintCount} ป้ายรอพิมพ์`}
          />
          {activeRows.length === 0 ? (
            <Empty text="ยังไม่มีงานศพที่เปิดอยู่" />
          ) : (
            <div className="space-y-3">
              {activeRows.map((row) => (
                <ActiveMemorialCard key={row.memorial.id} centerId={centerRouteKey} row={row} />
              ))}
            </div>
          )}
        </section>
          }

          reports={
        <section id="reports" className="scroll-mt-24 space-y-3">
          <SectionHeader icon={BarChart3} title="3. รายงานศูนย์" subtitle="สรุปยอดร่วมทำบุญ งานที่ปิดแล้ว และผลลัพธ์ Zero Waste ของศูนย์" />
          <div className="grid grid-cols-2 gap-3">
            <Metric icon={Banknote} label="ยอดร่วมทำบุญ" value={`${totalAmount.toLocaleString()} บาท`} tone="amber" />
            <Metric icon={Users} label="ผู้ร่วมบุญ" value={totalDonors.toLocaleString()} tone="blue" />
            <Metric icon={CheckCircle2} label="งานปิดแล้ว" value={closedRows.length.toLocaleString()} tone="emerald" />
            <Metric icon={Leaf} label="ลดขยะประมาณ" value={`${(totalDonors * 2).toLocaleString()} กก.`} tone="gold" />
          </div>
          <Link href={`/dashboard/center/${centerRouteKey}/closed`} className="block text-center text-xs font-semibold text-gold-700 underline underline-offset-4">
            ดูงานศพที่ปิดแล้วทั้งหมด
          </Link>
        </section>
          }

          settings={
        <section id="settings" className="scroll-mt-24 space-y-3">
          <SectionHeader icon={Settings} title="4. ตั้งค่าศูนย์" subtitle="ข้อมูลหลักของศูนย์บริหารประจำตำบล" />
          {canEditSettings ? (
            <CenterSettingsForm center={center as Center & { access_code?: string | null; official_lgo_code?: string | null }} />
          ) : (
            <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 space-y-2 text-xs text-gold-600">
              <p className="rounded-xl bg-white/70 px-3 py-2 text-[11px] font-semibold text-gold-700">
                สิทธิ์นี้ดูข้อมูลได้เท่านั้น หากต้องแก้ไขข้อมูลศูนย์ให้ใช้บัญชีผู้จัดการศูนย์
              </p>
              <InfoRow label="ชื่อศูนย์" value={center.name} />
              <InfoRow label="ผู้จัดการ" value={center.manager_name || "-"} />
              <InfoRow label="โทรศัพท์" value={center.phone || "-"} />
              <InfoRow label="พื้นที่" value={[center.tambon, center.amphoe, center.province].filter(Boolean).join(" · ") || "-"} />
              <InfoRow label="สถานะศูนย์" value={center.status || "-"} />
            </div>
          )}
        </section>
          }
        />

        <div className="h-4" />
      </main>
    </div>
  );
}

function ActiveMemorialCard({ centerId, row }: { centerId: string; row: MemorialSummary }) {
  return (
    <Link
      href={`/dashboard/center/${centerId}/memorial/${row.memorial.id}`}
      className="block bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-3 hover:bg-cream-100 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gold-800 truncate">{row.memorial.name}</p>
          <p className="text-[10px] text-gold-500">ฌาปนกิจ {formatThaiDate(row.memorial.ceremony_date)}</p>
          <p className="text-[10px] text-gold-400 truncate">{row.memorial.ceremony_location}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        <StatusMini label="แจ้งเตือนสลิป" value={row.slipWarning} warning={row.slipWarning > 0} />
        <StatusMini label="รอพิมพ์ป้าย" value={row.nameplatePending + row.nameplateQueued} warning={row.nameplatePending + row.nameplateQueued > 0} />
        <StatusMini label="พิมพ์แล้ว" value={row.nameplatePrinted} />
        <StatusMini label="ติดบอร์ดแล้ว" value={row.nameplatePosted} done />
      </div>
      <p className="text-[10px] text-gold-500 mt-2">กดเข้าไปดูรายละเอียดงาน</p>
    </Link>
  );
}

function StatusMini({ done, label, value, warning }: { done?: boolean; label: string; value: number; warning?: boolean }) {
  const tone = warning ? "bg-amber-50 text-amber-700" : done ? "bg-emerald-50 text-emerald-700" : "bg-white/70 text-gold-700";
  return (
    <div className={`rounded-lg py-1.5 px-1 ${tone}`}>
      <p className="text-sm font-bold">{value.toLocaleString()}</p>
      <p className="text-[8px] leading-tight">{label}</p>
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

function Metric({ icon: Icon, label, tone, value }: { icon: React.ElementType; label: string; tone: "amber" | "blue" | "emerald" | "gold"; value: string }) {
  const color = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    gold: "bg-gold-100 text-gold-700",
  }[tone];
  return (
    <div className="bg-cream-50 rounded-xl gold-border card-shadow px-3 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-gold-800 truncate">{value}</p>
        <p className="text-[10px] text-gold-500">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gold-400 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-5 py-10 text-center">
      <p className="text-sm text-gold-400">{text}</p>
    </div>
  );
}

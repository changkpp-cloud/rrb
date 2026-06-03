import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Gauge,
  Leaf,
  LineChart,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

export const revalidate = 60;

type CenterRow = {
  id: string;
  name: string;
  province: string | null;
  amphoe: string | null;
  status: string | null;
};

type MemorialRow = {
  id: string;
  name: string;
  center_id: string | null;
  funeral_status: string | null;
  ceremony_date: string;
  created_at: string;
  host_bank_account_number: string | null;
};

type DonationRow = {
  id: string;
  memorial_id: string;
  amount: number | null;
  status: string | null;
  created_at: string;
};

function shortMoney(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 100_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("th-TH");
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const [year, month] = key.split("-");
  return `${months[Number(month) - 1]} ${String(Number(year) + 543).slice(-2)}`;
}

async function getAnalytics() {
  const supabase = createAdminClient();

  const [{ data: centers }, { data: memorials }, { data: donations }] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe, status"),
    supabase.from("memorials").select("id, name, center_id, funeral_status, ceremony_date, created_at, host_bank_account_number"),
    supabase.from("donations").select("id, memorial_id, amount, status, created_at"),
  ]);

  const centerRows = (centers ?? []) as CenterRow[];
  const memorialRows = (memorials ?? []) as MemorialRow[];
  const donationRows = (donations ?? []) as DonationRow[];

  const confirmed = donationRows.filter((d) => d.status === "confirmed");
  const pending = donationRows.filter((d) => d.status === "pending");
  const rejected = donationRows.filter((d) => d.status === "rejected");
  const totalAmount = confirmed.reduce((sum, d) => sum + (d.amount || 0), 0);
  const avgDonation = confirmed.length ? totalAmount / confirmed.length : 0;
  const confirmationRate = donationRows.length ? (confirmed.length / donationRows.length) * 100 : 0;
  const rejectionRate = donationRows.length ? (rejected.length / donationRows.length) * 100 : 0;

  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = monthKey(lastMonthDate);
  const amountThisMonth = confirmed
    .filter((d) => monthKey(new Date(d.created_at)) === thisMonth)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const amountLastMonth = confirmed
    .filter((d) => monthKey(new Date(d.created_at)) === lastMonth)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const monthGrowth = amountLastMonth > 0 ? ((amountThisMonth - amountLastMonth) / amountLastMonth) * 100 : amountThisMonth > 0 ? 100 : 0;

  const memorialById = new Map(memorialRows.map((m) => [m.id, m]));
  const centerStats = new Map<string, { id: string; name: string; province: string; active: number; closed: number; memorials: number; donors: number; amount: number; pending: number }>();

  for (const center of centerRows) {
    centerStats.set(center.id, {
      id: center.id,
      name: center.name,
      province: center.province || "ไม่ระบุจังหวัด",
      active: 0,
      closed: 0,
      memorials: 0,
      donors: 0,
      amount: 0,
      pending: 0,
    });
  }

  for (const memorial of memorialRows) {
    if (!memorial.center_id) continue;
    const stat = centerStats.get(memorial.center_id);
    if (!stat) continue;
    stat.memorials += 1;
    if (memorial.funeral_status === "active") stat.active += 1;
    if (memorial.funeral_status === "closed") stat.closed += 1;
  }

  for (const donation of donationRows) {
    const memorial = memorialById.get(donation.memorial_id);
    if (!memorial?.center_id) continue;
    const stat = centerStats.get(memorial.center_id);
    if (!stat) continue;
    if (donation.status === "confirmed") {
      stat.donors += 1;
      stat.amount += donation.amount || 0;
    }
    if (donation.status === "pending") stat.pending += 1;
  }

  const topCenters = [...centerStats.values()]
    .filter((center) => center.memorials > 0 || center.donors > 0 || center.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueActive = memorialRows.filter((m) => {
    if (m.funeral_status !== "active") return false;
    const ceremony = new Date(m.ceremony_date);
    ceremony.setHours(0, 0, 0, 0);
    return ceremony < today;
  });
  const activeWithoutHostBank = memorialRows.filter((m) => m.funeral_status === "active" && !m.host_bank_account_number);
  const inactiveCenters = centerRows.filter((c) => c.status !== "active");
  const pendingRatio = donationRows.length ? (pending.length / donationRows.length) * 100 : 0;

  const trendMap = new Map<string, { amount: number; donors: number }>();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap.set(monthKey(date), { amount: 0, donors: 0 });
  }
  for (const donation of confirmed) {
    const key = monthKey(new Date(donation.created_at));
    const row = trendMap.get(key);
    if (!row) continue;
    row.amount += donation.amount || 0;
    row.donors += 1;
  }
  const trend = [...trendMap.entries()].map(([key, value]) => ({ key, label: monthLabel(key), ...value }));
  const maxTrendAmount = Math.max(...trend.map((row) => row.amount), 1);

  return {
    totals: {
      centers: centerRows.length,
      activeCenters: centerRows.filter((c) => c.status === "active").length,
      memorials: memorialRows.length,
      activeMemorials: memorialRows.filter((m) => m.funeral_status === "active").length,
      closedMemorials: memorialRows.filter((m) => m.funeral_status === "closed").length,
      donors: confirmed.length,
      pending: pending.length,
      rejected: rejected.length,
      amount: totalAmount,
      avgDonation,
      confirmationRate,
      rejectionRate,
      amountThisMonth,
      monthGrowth,
      wasteKg: confirmed.length * 2,
    },
    risk: {
      overdueActive: overdueActive.length,
      activeWithoutHostBank: activeWithoutHostBank.length,
      inactiveCenters: inactiveCenters.length,
      pendingRatio,
    },
    topCenters,
    trend,
    maxTrendAmount,
  };
}

export default async function AdminOverviewPage() {
  const data = await getAnalytics();
  const s = data.totals;

  const statusMax = Math.max(s.activeMemorials, s.closedMemorials, 1);
  const riskScore = Math.min(
    100,
    Math.round(data.risk.pendingRatio + data.risk.overdueActive * 8 + data.risk.activeWithoutHostBank * 5 + data.risk.inactiveCenters * 3)
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-gold-200 bg-cream-50 px-4 py-4 card-shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-gold-500">Central Analytical Dashboard</p>
            <h1 className="mt-1 text-xl font-bold text-gold-900">ภาพรวมเชิงวิเคราะห์แอดมินกลาง</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-gold-600">
              ใช้ติดตามผลลัพธ์ทั้งระบบ เปรียบเทียบศูนย์ และมองสัญญาณความเสี่ยง โดยไม่เข้าไปแทนงานปฏิบัติการของศูนย์
            </p>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 text-right gold-border">
            <p className="text-[10px] text-gold-500">Risk index</p>
            <p className={`text-2xl font-bold ${riskScore >= 60 ? "text-red-600" : riskScore >= 30 ? "text-amber-600" : "text-emerald-600"}`}>
              {riskScore}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard icon={CircleDollarSign} label="ยอดร่วมบุญรวม" value={`${shortMoney(s.amount)} บาท`} sub={`เดือนนี้ ${shortMoney(s.amountThisMonth)} บาท`} />
        <MetricCard icon={Users} label="ผู้ร่วมบุญยืนยัน" value={s.donors.toLocaleString("th-TH")} sub={`เฉลี่ย ${Math.round(s.avgDonation).toLocaleString("th-TH")} บาท/รายการ`} />
        <MetricCard icon={Building2} label="ศูนย์ในระบบ" value={`${s.activeCenters}/${s.centers}`} sub="ศูนย์ active / ทั้งหมด" />
        <MetricCard icon={Leaf} label="ผลลัพธ์ ESG" value={`${s.wasteKg.toLocaleString("th-TH")} กก.`} sub={`${s.donors.toLocaleString("th-TH")} พวงหรีดที่ลดลง`} />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <AnalyticPanel title="แนวโน้ม 6 เดือน" icon={LineChart} className="md:col-span-2">
          <div className="flex h-36 items-end gap-2 pt-4">
            {data.trend.map((row) => (
              <div key={row.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <p className="text-[9px] font-semibold text-gold-700">{shortMoney(row.amount)}</p>
                <div className="w-full rounded-t-md bg-emerald-400" style={{ height: `${Math.max((row.amount / data.maxTrendAmount) * 92, 4)}px` }} />
                <p className="text-[9px] text-gold-500">{row.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 gold-border">
            <TrendingUp className={`h-4 w-4 ${s.monthGrowth >= 0 ? "text-emerald-600" : "text-red-500"}`} />
            <p className="text-[11px] text-gold-700">
              การเติบโตเทียบเดือนก่อน <span className="font-bold">{percent(s.monthGrowth)}</span>
            </p>
          </div>
        </AnalyticPanel>

        <AnalyticPanel title="คุณภาพข้อมูลการเงิน" icon={Gauge}>
          <QualityRow label="ยืนยันแล้ว" value={percent(s.confirmationRate)} tone="good" />
          <QualityRow label="รอตรวจจากศูนย์" value={`${s.pending.toLocaleString("th-TH")} รายการ`} tone={s.pending > 0 ? "warn" : "good"} />
          <QualityRow label="สลิปตีกลับ" value={percent(s.rejectionRate)} tone={s.rejectionRate > 10 ? "bad" : "neutral"} />
          <div className="mt-3 rounded-xl bg-gold-50 px-3 py-2">
            <p className="text-[10px] leading-relaxed text-gold-600">
              แอดมินกลางใช้ส่วนนี้ดูคุณภาพรวมและแจ้งนโยบายให้ศูนย์ ไม่ใช่จุดอนุมัติสลิปแทนศูนย์
            </p>
          </div>
        </AnalyticPanel>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <AnalyticPanel title="สถานะงานศพทั้งระบบ" icon={ScrollText}>
          <StatusBar label="งานที่เปิดอยู่" value={s.activeMemorials} max={statusMax} tone="emerald" />
          <StatusBar label="งานที่ปิดแล้ว" value={s.closedMemorials} max={statusMax} tone="gold" />
          <StatusBar label="งานทั้งหมด" value={s.memorials} max={Math.max(s.memorials, 1)} tone="blue" />
        </AnalyticPanel>

        <AnalyticPanel title="สัญญาณที่ควรดูแล" icon={ShieldCheck}>
          <RiskRow icon={Clock} label="งาน active ที่เลยวันพิธี" value={data.risk.overdueActive} />
          <RiskRow icon={Banknote} label="งาน active ที่ยังไม่มีบัญชีเจ้าภาพ" value={data.risk.activeWithoutHostBank} />
          <RiskRow icon={Building2} label="ศูนย์ที่ยังไม่ active" value={data.risk.inactiveCenters} />
          <RiskRow icon={AlertTriangle} label="สัดส่วนสลิปรอตรวจ" valueText={percent(data.risk.pendingRatio)} />
        </AnalyticPanel>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gold-800">ศูนย์ที่สร้างผลลัพธ์สูงสุด</p>
            <p className="text-[10px] text-gold-500">จัดอันดับด้วยยอดร่วมบุญที่ยืนยันแล้ว</p>
          </div>
          <Link href="/dashboard/admin/analytics?type=centers" className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-600">
            วิเคราะห์เพิ่ม <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {data.topCenters.length === 0 ? (
            <div className="rounded-2xl bg-cream-50 px-4 py-6 text-center gold-border">
              <p className="text-sm text-gold-400">ยังไม่มีข้อมูลศูนย์สำหรับจัดอันดับ</p>
            </div>
          ) : (
            data.topCenters.map((center, index) => (
              <Link key={center.id} href={`/dashboard/admin/centers/${center.id}`} className="block rounded-xl bg-cream-50 px-4 py-3 transition-colors hover:bg-cream-100 gold-border">
                <div className="flex items-center gap-3">
                  <span className="w-7 shrink-0 text-sm font-bold text-gold-400">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gold-900">{center.name}</p>
                    <p className="text-[10px] text-gold-500">{center.province} · {center.memorials} งาน · pending {center.pending}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">{shortMoney(center.amount)}</p>
                    <p className="text-[9px] text-gold-500">{center.donors} ผู้ร่วมบุญ</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-gold-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <InsightLink href="/dashboard/admin/analytics" icon={BarChart3} label="วิเคราะห์พื้นที่/เวลา" />
        <InsightLink href="/dashboard/admin/report" icon={LineChart} label="รายงานตามภูมิศาสตร์" />
        <InsightLink href="/dashboard/admin/audit" icon={ShieldCheck} label="ตรวจสอบความเสี่ยง" />
        <InsightLink href="/dashboard/admin/centers" icon={Building2} label="ดูแลสถานะศูนย์" />
      </section>

      <div className="h-2" />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-cream-50 px-4 py-3 card-shadow gold-border">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gold-600 gold-border">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-semibold text-gold-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gold-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-gold-500">{sub}</p>
    </div>
  );
}

function AnalyticPanel({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: typeof Banknote;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-cream-50 px-4 py-4 card-shadow gold-border ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gold-600 gold-border">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-bold text-gold-900">{title}</p>
      </div>
      {children}
    </section>
  );
}

function QualityRow({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : tone === "bad" ? "text-red-600" : "text-gold-800";
  return (
    <div className="flex items-center justify-between border-b border-gold-100 py-2 last:border-b-0">
      <span className="text-[11px] text-gold-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatusBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "emerald" | "gold" | "blue" }) {
  const color = tone === "emerald" ? "bg-emerald-500" : tone === "gold" ? "bg-gold-500" : "bg-blue-500";
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] text-gold-600">{label}</p>
        <p className="text-[11px] font-bold text-gold-900">{value.toLocaleString("th-TH")}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white gold-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

function RiskRow({
  icon: Icon,
  label,
  value,
  valueText,
}: {
  icon: typeof Banknote;
  label: string;
  value?: number;
  valueText?: string;
}) {
  const rawValue = value ?? 0;
  const isRisk = valueText ? valueText !== "0%" : rawValue > 0;
  return (
    <div className="flex items-center gap-3 border-b border-gold-100 py-2.5 last:border-b-0">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${isRisk ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
        {isRisk ? <Icon className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </div>
      <p className="flex-1 text-[11px] text-gold-700">{label}</p>
      <p className={`text-sm font-bold ${isRisk ? "text-amber-700" : "text-emerald-700"}`}>{valueText ?? rawValue.toLocaleString("th-TH")}</p>
    </div>
  );
}

function InsightLink({ href, icon: Icon, label }: { href: string; icon: typeof Banknote; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-xl bg-cream-50 px-3 py-3 transition-colors hover:bg-cream-100 gold-border">
      <Icon className="h-4 w-4 shrink-0 text-gold-600" />
      <span className="text-[11px] font-semibold text-gold-800">{label}</span>
    </Link>
  );
}

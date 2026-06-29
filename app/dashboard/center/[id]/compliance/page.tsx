import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, FileText, MinusCircle } from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";

export const revalidate = 0;

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

type SubmissionRow = { period_type: string; period_key: string; submitted_at: string; submitted_by: string | null };
type PeriodStatus = {
  key: string;
  label: string;
  hasData: boolean;
  submittedAt: string | null;
  submittedBy: string | null;
};

function statusOf(s: PeriodStatus): "submitted" | "pending" | "none" {
  if (s.submittedAt) return "submitted";
  if (s.hasData) return "pending";
  return "none";
}

async function getCompliance(centerId: string) {
  const supabase = createAdminClient();
  const [{ data: memorialsData }, { data: subsData }] = await Promise.all([
    supabase
      .from("memorials")
      .select("ceremony_date, funeral_status")
      .eq("center_id", centerId)
      .in("funeral_status", ["active", "closed"]),
    // center_report_submissions ยังไม่มีใน generated types — cast client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("center_report_submissions").select("period_type, period_key, submitted_at, submitted_by").eq("center_id", centerId),
  ]);

  const dates = ((memorialsData ?? []) as { ceremony_date: string }[]).map((m) => m.ceremony_date ?? "");
  const monthHasData = new Set<string>();
  const yearHasData = new Set<string>();
  for (const d of dates) {
    if (/^\d{4}-\d{2}/.test(d)) {
      monthHasData.add(d.slice(0, 7));
      yearHasData.add(d.slice(0, 4));
    }
  }

  const subs = (subsData ?? []) as SubmissionRow[];
  const subMap = new Map(subs.map((s) => [`${s.period_type}:${s.period_key}`, s]));

  // 12 เดือนล่าสุด (ใหม่สุดอยู่บน)
  const now = new Date();
  const months: PeriodStatus[] = [];
  for (let i = 0; i < 12; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    const sub = subMap.get(`month:${key}`);
    months.push({
      key,
      label: `${THAI_MONTHS[m]} ${y + 543}`,
      hasData: monthHasData.has(key),
      submittedAt: sub?.submitted_at ?? null,
      submittedBy: sub?.submitted_by ?? null,
    });
  }

  // ปีปัจจุบัน + ปีก่อน
  const years: PeriodStatus[] = [now.getFullYear(), now.getFullYear() - 1].map((y) => {
    const key = String(y);
    const sub = subMap.get(`year:${key}`);
    return {
      key,
      label: `ปี พ.ศ. ${y + 543}`,
      hasData: yearHasData.has(key),
      submittedAt: sub?.submitted_at ?? null,
      submittedBy: sub?.submitted_by ?? null,
    };
  });

  return { months, years };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default async function CenterCompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const { months, years } = await getCompliance(id);
  const centerName = center.name ?? "ศูนย์บริหารหรีดร่วมบุญ";

  const pending = months.filter((m) => statusOf(m) === "pending").length;
  const submitted = months.filter((m) => statusOf(m) === "submitted").length;

  return (
    <div className="min-h-screen bg-white">
      <IosPageHeader
        title="ติดตามการส่งรายงาน"
        subtitle={roleLabel(access.role)}
        backHref={`/dashboard/center/${centerRouteKey}/oversight`}
        backLabel="กำกับดูแล"
      />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div className="text-center">
          <h1 className="text-base font-bold text-gold-900">{centerName}</h1>
          <p className="text-[11px] text-gold-500">สถานะการส่งรายงานให้เทศบาล (12 เดือนล่าสุด)</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-3 text-center">
            <p className="text-lg font-bold text-emerald-700">{submitted}</p>
            <p className="text-[10px] text-emerald-600">ส่งแล้ว (เดือน)</p>
          </div>
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-center">
            <p className="text-lg font-bold text-amber-700">{pending}</p>
            <p className="text-[10px] text-amber-600">มีงานแต่ยังไม่ส่ง</p>
          </div>
        </div>

        <Section title="รายเดือน">
          {months.map((m) => <Row key={m.key} item={m} />)}
        </Section>

        <Section title="รายปี">
          {years.map((y) => <Row key={y.key} item={y} />)}
        </Section>

        <Link
          href={`/dashboard/center/${centerRouteKey}/report`}
          className="flex items-center justify-center gap-2 rounded-2xl gold-gradient px-4 py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
        >
          <FileText className="w-4 h-4" /> เปิดรายงาน / ส่งออกเอกสาร
        </Link>
        <div className="h-4" />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <p className="text-xs font-semibold text-gold-700">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ item }: { item: PeriodStatus }) {
  const st = statusOf(item);
  const cfg = {
    submitted: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "ส่งแล้ว" },
    pending:   { icon: Clock3,       color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",     label: "ยังไม่ส่ง" },
    none:      { icon: MinusCircle,  color: "text-gold-300",    bg: "bg-cream-50 gold-border",          label: "ไม่มีงาน" },
  }[st];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${cfg.bg}`}>
      <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gold-800">{item.label}</p>
        {item.submittedAt && (
          <p className="text-[10px] text-gold-500">
            ส่งเมื่อ {formatDate(item.submittedAt)}{item.submittedBy ? ` · โดย ${item.submittedBy}` : ""}
          </p>
        )}
      </div>
      <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
    </div>
  );
}

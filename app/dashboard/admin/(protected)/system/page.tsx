import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Printer,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { getSystemHealth, type SystemIssue, type SystemIssueSeverity } from "@/lib/system-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AREA = {
  ai: { label: "AI", icon: Bot },
  printing: { label: "พิมพ์ป้าย", icon: Printer },
  centers: { label: "ศูนย์", icon: Building2 },
  database: { label: "ฐานข้อมูล", icon: Database },
} satisfies Record<SystemIssue["area"], { label: string; icon: typeof Bot }>;

function tone(severity: SystemIssueSeverity) {
  if (severity === "critical") {
    return {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-700",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
      label: "ด่วน",
    };
  }
  if (severity === "warning") {
    return {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      label: "ควรตรวจ",
    };
  }
  return {
    card: "border-blue-100 bg-blue-50",
    icon: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    label: "ข้อมูล",
  };
}

function formatCheckedAt(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminSystemPage() {
  const health = await getSystemHealth();
  const normal = health.totalIssues === 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-24">
      <section className={`rounded-2xl px-4 py-4 card-shadow gold-border ${normal ? "bg-emerald-50" : "bg-cream-50"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-gold-500">System Health Monitor</p>
            <h1 className="mt-1 text-xl font-bold text-gold-900">รายงานระบบแอดมิน</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-gold-600">
              ตรวจสัญญาณผิดปกติระดับระบบภาพรวม ไม่ลงลึกถึงผู้ใช้หรือปัญหาหน้างานของแต่ละศูนย์
            </p>
          </div>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${normal ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
            {normal ? <CheckCircle2 className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatusPill label="ทั้งหมด" value={health.totalIssues} toneClass={normal ? "text-emerald-700" : "text-gold-900"} />
          <StatusPill label="ด่วน" value={health.criticalCount} toneClass={health.criticalCount > 0 ? "text-red-700" : "text-emerald-700"} />
          <StatusPill label="ควรตรวจ" value={health.warningCount} toneClass={health.warningCount > 0 ? "text-amber-700" : "text-emerald-700"} />
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-gold-500">
          <RefreshCw className="h-3.5 w-3.5" />
          ตรวจล่าสุด {formatCheckedAt(health.checkedAt)}
        </div>
      </section>

      {normal ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center card-shadow">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 text-base font-bold text-emerald-800">ระบบทำงานปกติ</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-700">
            ตอนนี้ยังไม่พบสัญญาณระบบภาพรวมที่ต้องให้แอดมินกลางตรวจทันที
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {health.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </section>
      )}

      <section className="rounded-2xl bg-cream-50 px-4 py-4 gold-border card-shadow">
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-gold-600" />
          <p className="text-sm font-bold text-gold-900">สิ่งที่ระบบตรวจให้ตอนนี้</p>
        </div>
        <div className="space-y-2 text-[11px] leading-relaxed text-gold-600">
          <p>• AI เจนภาพล้มเหลว หรือค้างนานผิดปกติ</p>
          <p>• คิวพิมพ์ป้าย error หรือค้างในระดับระบบ</p>
          <p>• ตาราง/ฐานข้อมูลที่จำเป็นต่อระบบแจ้งเตือนอ่านไม่ได้</p>
          <p>• ศูนย์ active ที่ยังไม่มีรหัสเข้าใช้งาน หรือข้อมูลผู้รับผิดชอบไม่ครบ</p>
          <p>• รายการที่เป็นปัญหาหน้างานของผู้ใช้ ให้ศูนย์เป็นผู้รับรายงานและจัดการ</p>
        </div>
      </section>

      <div className="h-2" />
    </div>
  );
}

function StatusPill({ label, toneClass, value }: { label: string; toneClass: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2 text-center gold-border">
      <p className={`text-lg font-bold ${toneClass}`}>{value.toLocaleString("th-TH")}</p>
      <p className="text-[10px] text-gold-500">{label}</p>
    </div>
  );
}

function IssueCard({ issue }: { issue: SystemIssue }) {
  const area = AREA[issue.area];
  const Icon = area.icon;
  const colors = tone(issue.severity);
  const content = (
    <div className={`rounded-2xl border px-4 py-3 card-shadow ${colors.card}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${colors.badge}`}>
              {colors.label}
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-gold-600">
              {area.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-gold-900">{issue.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gold-600">{issue.detail}</p>
          <p className={`mt-2 text-lg font-bold ${colors.text}`}>{issue.count.toLocaleString("th-TH")} รายการ</p>
        </div>
        {issue.href ? <ChevronRight className="mt-8 h-4 w-4 shrink-0 text-gold-400" /> : null}
      </div>
    </div>
  );

  if (!issue.href) return content;
  return <Link href={issue.href}>{content}</Link>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Banknote,
  ClipboardCheck,
  FileText,
  Leaf,
  HeartHandshake,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";
import IosPageHeader from "@/components/IosPageHeader";
import CenterLogoutButton from "@/components/center/CenterLogoutButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, roleLabel } from "@/lib/iam";
import { FEE_RATE, systemFee } from "@/lib/fee";

export const revalidate = 0;

// แดชบอร์ดกำกับดูแลสำหรับ อปท. (lgo_observer) — read-only, ภาพรวม/สถิติ "ไม่มี PII"
// เงินผู้ร่วมบุญเข้าบัญชีเจ้าภาพโดยตรง: อปท. ดูเพื่อกำกับดูแล/แถลงผลงาน/ส่งหน่วยประเมินเท่านั้น
const KG_PER_WREATH = 2;

type MemorialRow = { id: string; ceremony_date: string; funeral_status: string };
type DonationRow = { memorial_id: string; amount: number | null; status: string };

function emptyTotals() {
  return { memorials: 0, donors: 0, amount: 0, fee: 0, net: 0, wasteKg: 0, helpedHosts: 0 };
}

async function getOverview(centerId: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, ceremony_date, funeral_status")
    .eq("center_id", centerId)
    .in("funeral_status", ["active", "closed"]);

  const memorials = (memorialsData ?? []) as MemorialRow[];
  if (memorials.length === 0) return { all: emptyTotals(), thisYear: emptyTotals() };

  const ids = memorials.map((m) => m.id);
  const { data: donationsData } = await supabase
    .from("donations")
    .select("memorial_id, amount, status")
    .in("memorial_id", ids)
    .limit(10000);

  const byMemorial = new Map<string, { donors: number; amount: number }>();
  for (const d of (donationsData ?? []) as DonationRow[]) {
    if (d.status !== "confirmed") continue;
    const e = byMemorial.get(d.memorial_id) ?? { donors: 0, amount: 0 };
    e.donors += 1;
    e.amount += d.amount ?? 0;
    byMemorial.set(d.memorial_id, e);
  }

  const currentYear = String(new Date().getFullYear());
  const acc = (filterThisYear: boolean) =>
    memorials.reduce((s, m) => {
      if (filterThisYear && !(m.ceremony_date ?? "").startsWith(currentYear)) return s;
      const agg = byMemorial.get(m.id) ?? { donors: 0, amount: 0 };
      const fee = systemFee(agg.amount);
      return {
        memorials: s.memorials + 1,
        donors: s.donors + agg.donors,
        amount: s.amount + agg.amount,
        fee: s.fee + fee,
        net: s.net + Math.max(agg.amount - fee, 0),
        wasteKg: s.wasteKg + agg.donors * KG_PER_WREATH,
        helpedHosts: s.helpedHosts + (agg.donors > 0 ? 1 : 0),
      };
    }, emptyTotals());

  return { all: acc(false), thisYear: acc(true) };
}

export default async function CenterOversightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: routeKey } = await params;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const { all, thisYear } = await getOverview(id);
  const centerName = center.name ?? "ศูนย์บริหารหรีดร่วมบุญ";
  const area = [center.tambon, center.amphoe, center.province].filter(Boolean).join(" · ") || "-";

  return (
    <div className="min-h-screen bg-white">
      <IosPageHeader title="กำกับดูแล (อปท.)" subtitle={roleLabel(access.role)} />

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* หัวศูนย์ */}
        <div className="text-center">
          <h1 className="text-base font-bold text-gold-900">{centerName}</h1>
          <p className="text-[11px] text-gold-500">พื้นที่: {area}</p>
        </div>

        {/* แถบโปร่งใส */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            <span className="font-bold">เพื่อความโปร่งใส:</span> เงินผู้ร่วมบุญเข้าบัญชีเจ้าภาพโดยตรง
            ไม่ผ่านบัญชี อปท. หรือศูนย์ · มุมมองนี้สำหรับ <span className="font-semibold">กำกับดูแล/แถลงผลงาน</span> เท่านั้น
            (ดูได้ ส่งออกได้ แต่แก้ไขข้อมูลไม่ได้)
          </p>
        </div>

        {/* KPI รวมทั้งหมด */}
        <section>
          <p className="text-xs font-semibold text-gold-700 mb-2">ภาพรวมสะสมทั้งหมด</p>
          <div className="grid grid-cols-3 gap-2.5">
            <Kpi icon={BarChart3} label="จำนวนงาน" value={all.memorials.toLocaleString()} unit="งาน" />
            <Kpi icon={Users} label="ผู้ร่วมบุญ" value={all.donors.toLocaleString()} unit="ราย" />
            <Kpi icon={Banknote} label="ยอดร่วมบุญ" value={all.amount.toLocaleString()} unit="บาท" />
            <Kpi icon={HeartHandshake} label="ถึงเจ้าภาพ" value={all.net.toLocaleString()} unit="บาท" tone="emerald" />
            <Kpi icon={ShieldCheck} label={`ค่าดำเนินการ ${FEE_RATE * 100}%`} value={all.fee.toLocaleString()} unit="บาท" />
            <Kpi icon={Leaf} label="ลดขยะ" value={all.wasteKg.toLocaleString()} unit="กก." tone="emerald" />
          </div>
        </section>

        {/* 4 มุมตามผู้ฟัง อปท. */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-gold-700">สรุปตามมิติ (ปี {new Date().getFullYear() + 543})</p>
          <Angle
            icon={BarChart3}
            title="ผลงานผู้บริหาร"
            detail={`ให้บริการ ${thisYear.memorials.toLocaleString()} งาน · ผู้ร่วมบุญ ${thisYear.donors.toLocaleString()} ราย`}
          />
          <Angle
            icon={Banknote}
            title="การเงินโปร่งใส"
            detail={`เงินถึงเจ้าภาพโดยตรง ${thisYear.net.toLocaleString()} บาท · ค่าดำเนินการศูนย์ ${thisYear.fee.toLocaleString()} บาท (อปท. ไม่รับเงิน)`}
          />
          <Angle
            icon={Leaf}
            title="ลดขยะต้นทาง (สิ่งแวดล้อม)"
            detail={`ลดพวงหรีด ~${thisYear.donors.toLocaleString()} พวง · ประมาณการลดขยะ ${thisYear.wasteKg.toLocaleString()} กก.`}
          />
          <Angle
            icon={HeartHandshake}
            title="สวัสดิการชุมชน"
            detail={`ช่วยเหลือเจ้าภาพ ${thisYear.helpedHosts.toLocaleString()} ครอบครัว ที่มีผู้ร่วมบุญ`}
          />
        </section>

        {/* ปุ่มไปรายงาน + รายการงาน */}
        <section className="space-y-2">
          <Link
            href={`/dashboard/center/${centerRouteKey}/report`}
            className="flex items-center gap-3 rounded-2xl gold-gradient px-4 py-3.5 text-white active:scale-[0.98] transition-transform"
          >
            <FileText className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">รายงานรายเดือน/รายปี + ส่งออก (PDF / CSV)</p>
              <p className="text-[10px] text-white/80">เลือกช่วงเวลา ดึงเอกสารส่ง อปท. / หน่วยประเมิน (LPA · ITA · จังหวัดสะอาด)</p>
            </div>
          </Link>
          <Link
            href={`/dashboard/center/${centerRouteKey}/compliance`}
            className="flex items-center gap-3 rounded-2xl bg-cream-50 gold-border px-4 py-3.5 active:scale-[0.98] transition-transform"
          >
            <ClipboardCheck className="w-5 h-5 text-gold-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gold-800">ติดตามการส่งรายงานของศูนย์</p>
              <p className="text-[10px] text-gold-500">ศูนย์ส่งรายงานรายเดือน/รายปีให้ อปท. ครบ-ตรงเวลาหรือไม่</p>
            </div>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <NavCard href={`/dashboard/center/${centerRouteKey}/active`} icon={ListChecks} label="งานที่เปิดอยู่" />
            <NavCard href={`/dashboard/center/${centerRouteKey}/closed`} icon={ListChecks} label="งานที่ปิดแล้ว" />
          </div>
        </section>

        <div className="pt-2">
          <CenterLogoutButton />
        </div>
        <div className="h-4" />
      </main>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, unit, tone,
}: { icon: typeof BarChart3; label: string; value: string; unit: string; tone?: "emerald" }) {
  const emerald = tone === "emerald";
  return (
    <div className={`rounded-xl border px-2.5 py-3 text-center ${emerald ? "border-emerald-300 bg-emerald-50" : "border-gold-200 bg-cream-50"}`}>
      <Icon className={`mx-auto mb-1 h-4 w-4 ${emerald ? "text-emerald-500" : "text-gold-500"}`} />
      <p className={`text-base font-bold leading-tight ${emerald ? "text-emerald-700" : "text-gold-800"}`}>{value}</p>
      <p className="text-[10px] text-gold-500">{label} ({unit})</p>
    </div>
  );
}

function Angle({ icon: Icon, title, detail }: { icon: typeof BarChart3; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-cream-50 gold-border px-4 py-3">
      <span className="text-gold-500 shrink-0 mt-0.5"><Icon className="w-4 h-4" /></span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gold-800">{title}</p>
        <p className="text-[11px] text-gold-600 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

function NavCard({ href, icon: Icon, label }: { href: string; icon: typeof BarChart3; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-2xl bg-cream-50 gold-border px-4 py-3 text-gold-800 active:scale-[0.98] transition-transform"
    >
      <Icon className="w-4 h-4 text-gold-500 shrink-0" />
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}

import { redirect } from "next/navigation";
import IosPageHeader from "@/components/IosPageHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterByRouteKey, getCenterRouteKey } from "@/lib/center-route";
import { getCenterAccess, canEditCenterWork, roleLabel } from "@/lib/iam";
import { formatThaiDate } from "@/lib/memorial";
import CenterReportActions from "./CenterReportActions";
import CenterReportPeriodSelector from "./CenterReportPeriodSelector";
import ReportSubmissionControl from "./ReportSubmissionControl";
import { FEE_RATE, systemFee } from "@/lib/fee";

export const revalidate = 0;

const KG_PER_WREATH = 2;
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

type MemorialRow = { id: string; name: string; ceremony_date: string; host_name: string | null; funeral_status: string };
type DonationRow = { memorial_id: string; amount: number | null; status: string };

function parsePeriod(raw?: string) {
  const now = new Date();
  const def = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let period = raw ?? def;
  let mode: "month" | "year";
  if (/^\d{4}$/.test(period)) mode = "year";
  else if (/^\d{4}-\d{2}$/.test(period)) mode = "month";
  else { period = def; mode = "month"; }

  if (mode === "year") {
    const y = Number(period);
    return { mode, period, start: `${y}-01-01`, end: `${y}-12-31`, label: `ปี พ.ศ. ${y + 543}` };
  }
  const [y, m] = period.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    mode,
    period,
    start: `${y}-${String(m).padStart(2, "0")}-01`,
    end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    label: `${THAI_MONTHS[m - 1]} พ.ศ. ${y + 543}`,
  };
}

async function getReportData(centerId: string, start: string, end: string) {
  const supabase = createAdminClient();
  const { data: memorialsData } = await supabase
    .from("memorials")
    .select("id, name, ceremony_date, host_name, funeral_status")
    .eq("center_id", centerId)
    .in("funeral_status", ["active", "closed"])
    .gte("ceremony_date", start)
    .lte("ceremony_date", end)
    .order("ceremony_date", { ascending: true });

  const memorials = (memorialsData ?? []) as MemorialRow[];
  if (memorials.length === 0) return { rows: [], totals: emptyTotals() };

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

  const rows = memorials.map((m) => {
    const agg = byMemorial.get(m.id) ?? { donors: 0, amount: 0 };
    const fee = systemFee(agg.amount);
    return {
      id: m.id,
      name: m.name,
      ceremonyDate: m.ceremony_date,
      hostName: m.host_name,
      closed: m.funeral_status === "closed",
      donors: agg.donors,
      amount: agg.amount,
      fee,
      net: Math.max(agg.amount - fee, 0),
      wasteKg: agg.donors * KG_PER_WREATH,
    };
  });

  const totals = rows.reduce(
    (s, r) => ({
      memorials: s.memorials + 1,
      donors: s.donors + r.donors,
      amount: s.amount + r.amount,
      fee: s.fee + r.fee,
      net: s.net + r.net,
      wasteKg: s.wasteKg + r.wasteKg,
    }),
    emptyTotals(),
  );

  return { rows, totals };
}

function emptyTotals() {
  return { memorials: 0, donors: 0, amount: 0, fee: 0, net: 0, wasteKg: 0 };
}

function buildCsv(rows: Awaited<ReturnType<typeof getReportData>>["rows"], totals: ReturnType<typeof emptyTotals>) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const head = ["ลำดับ", "ชื่องาน", "วันฌาปนกิจ", "เจ้าภาพ", "สถานะ", "ผู้ร่วมบุญ(ราย)", "ยอดร่วมบุญ(บาท)", "ค่าดำเนินการ(บาท)", "นำส่งเจ้าภาพ(บาท)", "ลดขยะ(กก.)"];
  const lines = rows.map((r, i) =>
    [i + 1, r.name, formatThaiDate(r.ceremonyDate), r.hostName ?? "-", r.closed ? "ปิดแล้ว" : "เปิดอยู่", r.donors, r.amount, r.fee, r.net, r.wasteKg]
      .map(esc).join(","),
  );
  const totalLine = ["", "รวมทั้งสิ้น", "", "", `${totals.memorials} งาน`, totals.donors, totals.amount, totals.fee, totals.net, totals.wasteKg].map(esc).join(",");
  return [head.map(esc).join(","), ...lines, totalLine].join("\r\n");
}

export default async function CenterReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id: routeKey } = await params;
  const { period: periodParam } = await searchParams;
  const center = await getCenterByRouteKey(routeKey);
  if (!center) redirect("/dashboard/center");
  const id = center.id;
  const centerRouteKey = getCenterRouteKey(center);
  const access = await getCenterAccess(id);
  if (!access.allowed) redirect("/dashboard/center");

  const { mode, period, start, end, label } = parsePeriod(periodParam);
  const { rows, totals } = await getReportData(id, start, end);

  // สถานะการส่งรายงานงวดนี้ให้ อปท. (compliance)
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: submissionRow } = await (supabase as any)
    .from("center_report_submissions")
    .select("submitted_at, submitted_by")
    .eq("center_id", id)
    .eq("period_type", mode)
    .eq("period_key", period)
    .maybeSingle();
  const canMark = canEditCenterWork(access.role);

  const centerName = center.name ?? "ศูนย์บริหารหรีดร่วมบุญ";
  const area = [center.tambon, center.amphoe, center.province].filter(Boolean).join(" · ") || "-";
  const csv = buildCsv(rows, totals);
  const csvFilename = `รายงานหรีดร่วมบุญ-${centerName}-${period}.csv`;

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden">
        <IosPageHeader
          title="รายงานศูนย์ → อปท."
          subtitle={access.user ? `${centerName} · ${roleLabel(access.role)}` : centerName}
          backHref={`/dashboard/center/${centerRouteKey}`}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div className="print:hidden space-y-3">
          <CenterReportPeriodSelector mode={mode} period={period} />
          <ReportSubmissionControl
            centerId={id}
            periodType={mode}
            periodKey={period}
            periodLabel={label}
            submittedAt={submissionRow?.submitted_at ?? null}
            submittedBy={submissionRow?.submitted_by ?? null}
            canMark={canMark}
          />
          <CenterReportActions csv={csv} filename={csvFilename} />
        </div>

        {/* ── เอกสารรายงาน (ส่วนที่พิมพ์) ── */}
        <article className="rounded-2xl border border-gold-200 bg-white px-5 py-6 print:border-0 print:px-0 print:py-0">
          <header className="text-center border-b border-gold-200 pb-4">
            <h1 className="text-lg font-bold text-gold-900">รายงานสรุปผลการดำเนินงานหรีดร่วมบุญ</h1>
            <p className="text-sm text-gold-700 mt-1">ประจำ{label}</p>
            <p className="text-xs text-gold-600 mt-2">{centerName}</p>
            <p className="text-[11px] text-gold-500">พื้นที่: {area}</p>
            {center.manager_name && <p className="text-[11px] text-gold-500">ผู้จัดการศูนย์: {center.manager_name}</p>}
          </header>

          {/* สรุปรวม */}
          <section className="grid grid-cols-3 gap-3 mt-5">
            <Stat label="จำนวนงาน" value={`${totals.memorials}`} unit="งาน" />
            <Stat label="ผู้ร่วมบุญ" value={totals.donors.toLocaleString()} unit="ราย" />
            <Stat label="ยอดร่วมบุญรวม" value={totals.amount.toLocaleString()} unit="บาท" />
            <Stat label="ค่าดำเนินการศูนย์" value={totals.fee.toLocaleString()} unit="บาท" highlight />
            <Stat label="นำส่งเจ้าภาพ" value={totals.net.toLocaleString()} unit="บาท" />
            <Stat label="ลดขยะ" value={totals.wasteKg.toLocaleString()} unit="กก." />
          </section>

          {/* ตารางต่องาน */}
          <section className="mt-6 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-cream-100 text-gold-700">
                  <Th>#</Th><Th left>ชื่องาน / เจ้าภาพ</Th><Th>ฌาปนกิจ</Th><Th>ราย</Th>
                  <Th>ร่วมบุญ</Th><Th>ค่าดำเนินการ</Th><Th>นำส่งเจ้าภาพ</Th><Th>ขยะ(กก.)</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gold-400 py-6">ไม่มีงานในช่วงเวลานี้</td></tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.id} className="border-b border-gold-100">
                      <Td>{i + 1}</Td>
                      <Td left>
                        <span className="font-semibold text-gold-800">{r.name}</span>
                        <span className="block text-[10px] text-gold-500">{r.hostName ?? "-"} · {r.closed ? "ปิดแล้ว" : "เปิดอยู่"}</span>
                      </Td>
                      <Td>{formatThaiDate(r.ceremonyDate)}</Td>
                      <Td>{r.donors}</Td>
                      <Td>{r.amount.toLocaleString()}</Td>
                      <Td>{r.fee.toLocaleString()}</Td>
                      <Td>{r.net.toLocaleString()}</Td>
                      <Td>{r.wasteKg}</Td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-cream-100 font-bold text-gold-800">
                    <Td></Td><Td left>รวมทั้งสิ้น {totals.memorials} งาน</Td><Td></Td>
                    <Td>{totals.donors}</Td><Td>{totals.amount.toLocaleString()}</Td>
                    <Td>{totals.fee.toLocaleString()}</Td><Td>{totals.net.toLocaleString()}</Td><Td>{totals.wasteKg}</Td>
                  </tr>
                </tfoot>
              )}
            </table>
          </section>

          {/* ช่องลงนาม */}
          <section className="grid grid-cols-2 gap-8 mt-10 text-center text-[11px] text-gold-600">
            <Sign role="ผู้จัดทำรายงาน (ศูนย์บริหาร)" />
            <Sign role="ผู้รับรองรายงาน (อปท.)" />
          </section>
          <p className="text-[10px] text-gold-400 text-center mt-6">
            ค่าดำเนินการคิด {FEE_RATE * 100}% ของยอดร่วมบุญ · ประมาณการลดขยะ {KG_PER_WREATH} กก./พวงหรีด · ออกโดยระบบหรีดร่วมบุญ
          </p>
        </article>

        <div className="h-4 print:hidden" />
      </main>
    </div>
  );
}

function Stat({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${highlight ? "border-emerald-300 bg-emerald-50" : "border-gold-200 bg-cream-50"}`}>
      <p className={`text-lg font-bold ${highlight ? "text-emerald-700" : "text-gold-800"}`}>{value}</p>
      <p className="text-[10px] text-gold-500">{label} ({unit})</p>
    </div>
  );
}

function Th({ children, left }: { children?: React.ReactNode; left?: boolean }) {
  return <th className={`border border-gold-200 px-2 py-1.5 font-semibold ${left ? "text-left" : "text-center"}`}>{children}</th>;
}
function Td({ children, left }: { children?: React.ReactNode; left?: boolean }) {
  return <td className={`border border-gold-100 px-2 py-1.5 ${left ? "text-left" : "text-center"}`}>{children}</td>;
}
function Sign({ role }: { role: string }) {
  return (
    <div>
      <div className="border-b border-dotted border-gold-400 h-10" />
      <p className="mt-1">( ......................................... )</p>
      <p>{role}</p>
      <p className="mt-1">วันที่ ......... / ......... / .........</p>
    </div>
  );
}

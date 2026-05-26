import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { REGION_MAP, REGION_ORDER, getRegion, getDateFrom, PERIOD_LABELS, GEO_LABELS, TYPE_LABELS } from "@/lib/regions";
import AnalyticsFilters from "@/components/AnalyticsFilters";
import { Leaf, Trash2, Banknote, Users, ScrollText, Building2, ChevronRight, Clock } from "lucide-react";

export const revalidate = 120;

// ─── Types ─────────────────────────────────────────────────────────────────
type CenterRow = {
  id: string; name: string; province: string; amphoe: string; region: string;
};
type Stats = { centers: number; memorials: number; donors: number; amount: number };
type BreakdownRow = { key: string; label: string; href: string } & Stats;

// ─── Fetch + filter ─────────────────────────────────────────────────────────
async function getData(geoLevel: string, geoVal: string, period: string) {
  const supabase = createAdminClient();
  const dateFrom = getDateFrom(period);

  const [{ data: allCenters }, { data: allMemorials }, { data: allDonations }, { data: auditLogs }] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe"),
    supabase.from("memorials").select("id, center_id, funeral_status, host_name, host_bank_account_number, name, ceremony_date"),
    supabase.from("donations").select("id, memorial_id, amount, status, created_at, donor_name"),
    supabase.from("audit_logs").select("id, action, table_name, created_at, user_id").order("created_at", { ascending: false }).limit(20),
  ]);

  const centers: CenterRow[] = (allCenters ?? []).map(c => ({
    id: c.id, name: c.name,
    province: c.province ?? "ไม่ระบุ",
    amphoe: c.amphoe ?? "ไม่ระบุ",
    region: getRegion(c.province),
  }));

  // ── Apply geo filter ──
  let filteredCenters = centers;
  if (geoLevel === "region" && geoVal)   filteredCenters = centers.filter(c => c.region === geoVal);
  if (geoLevel === "province" && geoVal) filteredCenters = centers.filter(c => c.province === geoVal);
  if (geoLevel === "amphoe" && geoVal)   filteredCenters = centers.filter(c => c.amphoe === geoVal);
  if (geoLevel === "center" && geoVal)   filteredCenters = centers.filter(c => c.id === geoVal);

  const filteredCenterIds = new Set(filteredCenters.map(c => c.id));

  // ── Filter memorials by geo ──
  const filteredMemorials = (allMemorials ?? []).filter(m => m.center_id && filteredCenterIds.has(m.center_id));
  const filteredMemIds = new Set(filteredMemorials.map(m => m.id));

  // ── Filter donations by geo + time ──
  const filteredDonations = (allDonations ?? []).filter(d =>
    filteredMemIds.has(d.memorial_id) &&
    (!dateFrom || d.created_at >= dateFrom)
  );

  const confirmedDonations = filteredDonations.filter(d => d.status === "confirmed");
  const pendingDonations   = filteredDonations.filter(d => d.status === "pending");
  const rejectedDonations  = filteredDonations.filter(d => d.status === "rejected");

  const totalAmount = confirmedDonations.reduce((s, d) => s + (d.amount || 0), 0);
  const wreaths     = confirmedDonations.length;

  // ── Center-level stats for breakdown/center report ──
  const centerMemMap: Record<string, string[]> = {};
  for (const m of filteredMemorials) {
    if (!m.center_id) continue;
    if (!centerMemMap[m.center_id]) centerMemMap[m.center_id] = [];
    centerMemMap[m.center_id].push(m.id);
  }

  const memDonMap: Record<string, { donors: number; amount: number }> = {};
  for (const d of confirmedDonations) {
    if (!memDonMap[d.memorial_id]) memDonMap[d.memorial_id] = { donors: 0, amount: 0 };
    memDonMap[d.memorial_id].donors++;
    memDonMap[d.memorial_id].amount += d.amount || 0;
  }

  const centerStats: Record<string, Stats> = {};
  for (const c of filteredCenters) {
    const mIds = centerMemMap[c.id] ?? [];
    const donors = mIds.reduce((s, mid) => s + (memDonMap[mid]?.donors ?? 0), 0);
    const amount = mIds.reduce((s, mid) => s + (memDonMap[mid]?.amount ?? 0), 0);
    centerStats[c.id] = { centers: 1, memorials: mIds.length, donors, amount };
  }

  // ── Breakdown by next geo level ──
  function buildBreakdown(keyFn: (c: CenterRow) => string, hrefFn: (key: string, c: CenterRow) => string, sortByOrder?: string[]): BreakdownRow[] {
    const map = new Map<string, BreakdownRow>();
    for (const c of filteredCenters) {
      const key = keyFn(c);
      if (!map.has(key)) map.set(key, { key, label: key, href: hrefFn(key, c), centers: 0, memorials: 0, donors: 0, amount: 0 });
      const e = map.get(key)!;
      const s = centerStats[c.id] ?? { centers: 1, memorials: 0, donors: 0, amount: 0 };
      e.centers += 1; e.memorials += s.memorials; e.donors += s.donors; e.amount += s.amount;
    }
    const rows = [...map.values()];
    if (sortByOrder) rows.sort((a, b) => (sortByOrder.indexOf(a.key) + 1 || 99) - (sortByOrder.indexOf(b.key) + 1 || 99));
    else rows.sort((a, b) => b.donors - a.donors);
    return rows;
  }

  const sp = (k: string, v: string) => `?geoLevel=${k}&geo=${encodeURIComponent(v)}&period=${period}&type=overview`;
  let breakdown: BreakdownRow[] = [];
  if (geoLevel === "country")  breakdown = buildBreakdown(c => c.region,   (k) => `/dashboard/admin/analytics${sp("region", k)}`,   REGION_ORDER);
  if (geoLevel === "region")   breakdown = buildBreakdown(c => c.province, (k) => `/dashboard/admin/analytics${sp("province", k)}`);
  if (geoLevel === "province") breakdown = buildBreakdown(c => c.amphoe,   (k) => `/dashboard/admin/analytics${sp("amphoe", k)}`);
  if (geoLevel === "amphoe")   breakdown = buildBreakdown(c => c.id,       (_, c) => `/dashboard/admin/centers/${c.id}`).map(r => ({
    ...r, label: filteredCenters.find(c => c.id === r.key)?.name ?? r.key,
  }));

  // ── Monthly trend (last 6 months of confirmed donations) ──
  const monthMap: Record<string, number> = {};
  for (const d of confirmedDonations) {
    const dt = new Date(d.created_at);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] || 0) + 1;
  }
  const thaiM = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthTrend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, count]) => {
      const [y, m] = k.split("-");
      return { label: `${thaiM[+m]} ${(+y + 543).toString().slice(-2)}`, count };
    });
  const maxMonth = Math.max(...monthTrend.map(m => m.count), 1);

  // ── Geo options for filter dropdowns ──
  const regions  = [...new Set(centers.map(c => c.region))].sort((a, b) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b));
  const provinces = [...new Set(centers.map(c => c.province))].filter(p => p !== "ไม่ระบุ").sort();
  const amphoes   = [...new Set(centers.map(c => c.amphoe))].filter(a => a !== "ไม่ระบุ").sort();
  const centerOpts = centers.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name, "th"));

  return {
    geoOptions: { regions, provinces, amphoes, centers: centerOpts },
    totals: { centers: filteredCenters.length, memorials: filteredMemorials.length, donors: wreaths, amount: totalAmount },
    pending: pendingDonations.length,
    rejected: rejectedDonations.length,
    wreaths, wasteKg: wreaths * 2,
    breakdown,
    centerRows: filteredCenters.map(c => ({
      id: c.id, name: c.name, ...centerStats[c.id] ?? { centers: 1, memorials: 0, donors: 0, amount: 0 },
    })).sort((a, b) => b.donors - a.donors),
    monthTrend, maxMonth,
    hostRows: filteredMemorials.filter(m => m.host_name).map(m => {
      const d = memDonMap[m.id] ?? { donors: 0, amount: 0 };
      return { id: m.id, name: m.name, hostName: m.host_name!, hasBankAccount: !!m.host_bank_account_number, status: m.funeral_status, amount: d.amount };
    }),
    activeAmount:  filteredMemorials.filter(m => m.funeral_status === "active").reduce((s, m) => s + (memDonMap[m.id]?.amount ?? 0), 0),
    closedAmount:  filteredMemorials.filter(m => m.funeral_status === "closed").reduce((s, m) => s + (memDonMap[m.id]?.amount ?? 0), 0),
    auditLogs: auditLogs ?? [],
    filteredCenters,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const geoLevel = sp.geoLevel ?? "country";
  const geoVal   = sp.geo      ?? "";
  const period   = sp.period   ?? "all";
  const type     = sp.type     ?? "overview";

  const d = await getData(geoLevel, geoVal, period);

  const contextLabel = [
    geoVal ? geoVal : GEO_LABELS[geoLevel],
    PERIOD_LABELS[period],
    TYPE_LABELS[type],
  ].join(" · ");

  const maxBreakdown = Math.max(...d.breakdown.map(r => r.donors), 1);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-gold-800">ศูนย์รายงาน ESG และ Impact</h2>
        <p className="text-[11px] text-gold-500">{contextLabel}</p>
      </div>

      {/* ─ Filters ─ */}
      <AnalyticsFilters
        geoLevel={geoLevel} geoVal={geoVal} period={period} type={type}
        geoOptions={d.geoOptions}
      />

      {/* ─ KPI Cards (always visible) ─ */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ศูนย์", value: d.totals.centers, icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "งานศพ", value: d.totals.memorials, icon: ScrollText, color: "text-emerald-600 bg-emerald-50" },
          { label: "ผู้ร่วมบุญ", value: d.totals.donors.toLocaleString(), icon: Users, color: "text-gold-600 bg-gold-100" },
          { label: "บาทร่วมบุญ", value: d.totals.amount.toLocaleString(), icon: Banknote, color: "text-amber-600 bg-amber-50" },
          { label: "พวงหรีดลด", value: d.wreaths.toLocaleString(), icon: Leaf, color: "text-teal-600 bg-teal-50" },
          { label: "กก.ขยะลด", value: d.wasteKg.toLocaleString(), icon: Trash2, color: "text-green-600 bg-green-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-cream-50 rounded-xl gold-border card-shadow px-4 py-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-gold-800 leading-none">{value}</p>
              <p className="text-[10px] text-gold-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─ Pending alert ─ */}
      {d.pending > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">สลิปรอตรวจ <span className="font-bold">{d.pending}</span> รายการ · ตีกลับ {d.rejected} รายการ</p>
        </div>
      )}

      {/* ─ Report type specific content ─ */}

      {/* === ESG === */}
      {(type === "esg" || type === "overview") && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-4 space-y-3">
          <p className="text-[11px] font-bold text-emerald-800">ผลลัพธ์ ESG Zero Waste</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-bold text-emerald-700">{d.wreaths.toLocaleString()}</p><p className="text-[10px] text-emerald-600">พวงหรีดลด</p></div>
            <div><p className="text-2xl font-bold text-teal-700">{d.wasteKg.toLocaleString()}</p><p className="text-[10px] text-teal-600">กก. ขยะลด</p></div>
            <div><p className="text-2xl font-bold text-amber-600">{d.totals.amount >= 1000000 ? `${(d.totals.amount/1000000).toFixed(1)}M` : d.totals.amount.toLocaleString()}</p><p className="text-[10px] text-amber-600">บาทถึงเจ้าภาพ</p></div>
          </div>
          {/* Monthly chart */}
          {d.monthTrend.length > 0 && (
            <div>
              <p className="text-[10px] text-emerald-700 mb-2">พวงหรีดที่ลดรายเดือน</p>
              <div className="flex items-end gap-1.5 h-16">
                {d.monthTrend.map(m => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-0.5">
                    <p className="text-[8px] text-emerald-600">{m.count}</p>
                    <div className="w-full rounded-t-sm bg-emerald-400" style={{ height: `${Math.max((m.count / d.maxMonth) * 48, 3)}px` }} />
                    <p className="text-[8px] text-emerald-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === CENTERS === */}
      {(type === "centers") && (
        <div>
          <p className="text-xs font-semibold text-gold-700 mb-2">อันดับศูนย์ ({d.centerRows.length} ศูนย์)</p>
          <div className="space-y-2">
            {d.centerRows.slice(0, 20).map((c, i) => (
              <Link key={c.id} href={`/dashboard/admin/centers/${c.id}`}
                className="flex items-center gap-3 bg-cream-50 rounded-xl gold-border px-4 py-2.5 hover:bg-cream-100 transition-colors">
                <span className="text-[11px] font-bold text-gold-400 w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gold-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-gold-500">{c.memorials} งาน · {c.donors} คน · {c.amount.toLocaleString()} บาท</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gold-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* === HOSTS === */}
      {type === "hosts" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
              <p className="text-lg font-bold text-amber-600">{d.activeAmount.toLocaleString()}</p>
              <p className="text-[10px] text-amber-700">บาท · งานเปิดอยู่</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{d.closedAmount.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-700">บาท · งานปิดแล้ว</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-gold-700">รายชื่อเจ้าภาพ ({d.hostRows.length})</p>
          <div className="space-y-2">
            {d.hostRows.map(h => (
              <Link key={h.id} href={`/dashboard/admin/memorials/${h.id}`}
                className="flex items-center justify-between bg-cream-50 rounded-xl gold-border px-4 py-2.5 hover:bg-cream-100 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gold-800">{h.hostName}</p>
                  <p className="text-[10px] text-gold-500">งาน: {h.name} · {h.amount.toLocaleString()} บาท</p>
                  {!h.hasBankAccount && <p className="text-[10px] text-red-500">ยังไม่มีบัญชีรับเงิน</p>}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${h.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gold-100 text-gold-700"}`}>
                  {h.status === "active" ? "เปิดอยู่" : "ปิดแล้ว"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* === FINANCE === */}
      {type === "finance" && (
        <div className="space-y-3">
          <div className="bg-cream-50 rounded-2xl gold-border card-shadow px-4 py-4 space-y-2">
            <p className="text-[11px] font-semibold text-gold-700">สรุปการเงิน</p>
            <FinRow label="ยอดร่วมบุญ (ยืนยัน)" value={`${d.totals.amount.toLocaleString()} บาท`} />
            <FinRow label="สลิปรอตรวจ" value={`${d.pending} รายการ`} />
            <FinRow label="สลิปตีกลับ" value={`${d.rejected} รายการ`} />
            <div className="border-t border-gold-100 pt-2 mt-2">
              <FinRow label="งานที่ยังเปิดอยู่" value={`${d.activeAmount.toLocaleString()} บาท`} highlight />
              <FinRow label="งานที่ปิดแล้ว" value={`${d.closedAmount.toLocaleString()} บาท`} />
            </div>
          </div>
        </div>
      )}

      {/* === AUDIT === */}
      {type === "audit" && (
        <div>
          <p className="text-xs font-semibold text-gold-700 mb-2">Audit Log ล่าสุด</p>
          {d.auditLogs.length === 0 ? (
            <div className="bg-cream-50 rounded-xl gold-border px-4 py-6 text-center">
              <p className="text-sm text-gold-400">ยังไม่มีข้อมูล Audit Log</p>
            </div>
          ) : (
            <div className="space-y-2">
              {d.auditLogs.map(log => (
                <div key={log.id} className="bg-cream-50 rounded-xl gold-border px-4 py-2.5">
                  <p className="text-xs font-semibold text-gold-800">{log.action}</p>
                  <p className="text-[10px] text-gold-500">{log.table_name ?? "-"} · {new Date(log.created_at).toLocaleString("th-TH")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─ Geographic breakdown (overview + esg) ─ */}
      {(type === "overview" || type === "esg") && d.breakdown.length > 0 && geoLevel !== "center" && (
        <div>
          <p className="text-xs font-semibold text-gold-700 mb-2">
            {geoLevel === "country" ? "แยกรายภาค" : geoLevel === "region" ? "แยกรายจังหวัด" : geoLevel === "province" ? "แยกรายอำเภอ" : "แยกรายศูนย์"}
          </p>
          <div className="space-y-2">
            {d.breakdown.map((r, i) => (
              <Link key={r.key} href={r.href}
                className="block bg-cream-50 rounded-xl gold-border hover:bg-cream-100 transition-colors overflow-hidden">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-gold-400 shrink-0">#{i + 1}</span>
                      <p className="text-sm font-bold text-gold-800 truncate">{r.label}</p>
                      <span className="text-[10px] text-gold-400 shrink-0">{r.centers} ศูนย์ · {r.memorials} งาน</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 ml-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-lg py-1">
                      <p className="text-sm font-bold text-emerald-700">{r.donors.toLocaleString()}</p>
                      <p className="text-[9px] text-emerald-600">พวงหรีดลด</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg py-1">
                      <p className="text-sm font-bold text-teal-700">{(r.donors * 2).toLocaleString()}</p>
                      <p className="text-[9px] text-teal-600">กก.ขยะ</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-1">
                      <p className="text-sm font-bold text-amber-600">
                        {r.amount >= 1000000 ? `${(r.amount/1000000).toFixed(1)}M` : r.amount >= 1000 ? `${(r.amount/1000).toFixed(0)}K` : r.amount}
                      </p>
                      <p className="text-[9px] text-amber-600">บาท</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 bg-gold-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.max(r.donors / maxBreakdown * 100, 2)}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="h-2" />
    </div>
  );
}

function FinRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-gold-600">{label}</span>
      <span className={`text-[11px] font-bold ${highlight ? "text-amber-600" : "text-gold-800"}`}>{value}</span>
    </div>
  );
}

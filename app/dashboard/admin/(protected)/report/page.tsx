import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronRight, Leaf, Banknote, Users, ScrollText, Building2, Map as MapIcon } from "lucide-react";

export const revalidate = 300;

// ─── Province → Region mapping ───────────────────────────────────────────────
const REGION_MAP: Record<string, string> = {
  // ภาคเหนือ
  "เชียงใหม่": "ภาคเหนือ", "เชียงราย": "ภาคเหนือ", "ลำปาง": "ภาคเหนือ",
  "ลำพูน": "ภาคเหนือ", "แม่ฮ่องสอน": "ภาคเหนือ", "พะเยา": "ภาคเหนือ",
  "แพร่": "ภาคเหนือ", "น่าน": "ภาคเหนือ", "อุตรดิตถ์": "ภาคเหนือ",
  "ตาก": "ภาคเหนือ", "สุโขทัย": "ภาคเหนือ", "พิษณุโลก": "ภาคเหนือ",
  "พิจิตร": "ภาคเหนือ", "กำแพงเพชร": "ภาคเหนือ", "เพชรบูรณ์": "ภาคเหนือ",
  "นครสวรรค์": "ภาคเหนือ", "อุทัยธานี": "ภาคเหนือ",
  // ภาคตะวันออกเฉียงเหนือ
  "นครราชสีมา": "ภาคอีสาน", "บุรีรัมย์": "ภาคอีสาน", "สุรินทร์": "ภาคอีสาน",
  "ศรีสะเกษ": "ภาคอีสาน", "อุบลราชธานี": "ภาคอีสาน", "ยโสธร": "ภาคอีสาน",
  "อำนาจเจริญ": "ภาคอีสาน", "มุกดาหาร": "ภาคอีสาน", "ชัยภูมิ": "ภาคอีสาน",
  "ขอนแก่น": "ภาคอีสาน", "กาฬสินธุ์": "ภาคอีสาน", "มหาสารคาม": "ภาคอีสาน",
  "ร้อยเอ็ด": "ภาคอีสาน", "อุดรธานี": "ภาคอีสาน", "เลย": "ภาคอีสาน",
  "หนองบัวลำภู": "ภาคอีสาน", "หนองคาย": "ภาคอีสาน", "บึงกาฬ": "ภาคอีสาน",
  "สกลนคร": "ภาคอีสาน", "นครพนม": "ภาคอีสาน",
  // ภาคกลาง
  "กรุงเทพมหานคร": "ภาคกลาง", "นนทบุรี": "ภาคกลาง", "ปทุมธานี": "ภาคกลาง",
  "สมุทรปราการ": "ภาคกลาง", "สมุทรสาคร": "ภาคกลาง", "สมุทรสงคราม": "ภาคกลาง",
  "นครปฐม": "ภาคกลาง", "พระนครศรีอยุธยา": "ภาคกลาง", "อ่างทอง": "ภาคกลาง",
  "สิงห์บุรี": "ภาคกลาง", "ชัยนาท": "ภาคกลาง", "สระบุรี": "ภาคกลาง",
  "ลพบุรี": "ภาคกลาง", "นครนายก": "ภาคกลาง", "สุพรรณบุรี": "ภาคกลาง",
  "กาญจนบุรี": "ภาคกลาง", "ราชบุรี": "ภาคกลาง",
  // ภาคตะวันออก
  "ชลบุรี": "ภาคตะวันออก", "ระยอง": "ภาคตะวันออก", "จันทบุรี": "ภาคตะวันออก",
  "ตราด": "ภาคตะวันออก", "ฉะเชิงเทรา": "ภาคตะวันออก",
  "ปราจีนบุรี": "ภาคตะวันออก", "สระแก้ว": "ภาคตะวันออก",
  // ภาคตะวันตก
  "เพชรบุรี": "ภาคตะวันตก", "ประจวบคีรีขันธ์": "ภาคตะวันตก",
  // ภาคใต้
  "ชุมพร": "ภาคใต้", "ระนอง": "ภาคใต้", "สุราษฎร์ธานี": "ภาคใต้",
  "นครศรีธรรมราช": "ภาคใต้", "พัทลุง": "ภาคใต้", "สงขลา": "ภาคใต้",
  "ตรัง": "ภาคใต้", "กระบี่": "ภาคใต้", "พังงา": "ภาคใต้",
  "ภูเก็ต": "ภาคใต้", "สตูล": "ภาคใต้", "ปัตตานี": "ภาคใต้",
  "ยะลา": "ภาคใต้", "นราธิวาส": "ภาคใต้",
};

const REGION_ORDER = ["ภาคเหนือ", "ภาคอีสาน", "ภาคกลาง", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้", "อื่นๆ"];

// ─── Types ────────────────────────────────────────────────────────────────────
type CenterRow = {
  id: string; name: string;
  province: string; amphoe: string; region: string;
  centers: number; memorials: number; donors: number; amount: number;
};

type AggRow = {
  key: string; label: string;
  centers: number; memorials: number; donors: number; amount: number;
  nextLevel: string; nextParam: string;
};

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getAllData(): Promise<CenterRow[]> {
  const supabase = createAdminClient();
  const [{ data: centers }, { data: memorials }, { data: donations }] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe"),
    supabase.from("memorials").select("id, center_id"),
    supabase.from("donations").select("memorial_id, amount").eq("status", "confirmed"),
  ]);

  const donByMem: Record<string, { count: number; amount: number }> = {};
  for (const d of donations ?? []) {
    if (!donByMem[d.memorial_id]) donByMem[d.memorial_id] = { count: 0, amount: 0 };
    donByMem[d.memorial_id].count++;
    donByMem[d.memorial_id].amount += d.amount ?? 0;
  }

  const centerStats: Record<string, { memorials: number; donors: number; amount: number }> = {};
  for (const m of memorials ?? []) {
    if (!m.center_id) continue;
    if (!centerStats[m.center_id]) centerStats[m.center_id] = { memorials: 0, donors: 0, amount: 0 };
    centerStats[m.center_id].memorials++;
    const d = donByMem[m.id] ?? { count: 0, amount: 0 };
    centerStats[m.center_id].donors += d.count;
    centerStats[m.center_id].amount += d.amount;
  }

  return (centers ?? []).map(c => ({
    id: c.id,
    name: c.name,
    province: c.province ?? "ไม่ระบุ",
    amphoe: c.amphoe ?? "ไม่ระบุ",
    region: REGION_MAP[c.province ?? ""] ?? "อื่นๆ",
    centers: 1,
    memorials: centerStats[c.id]?.memorials ?? 0,
    donors: centerStats[c.id]?.donors ?? 0,
    amount: centerStats[c.id]?.amount ?? 0,
  }));
}

function agg(
  rows: CenterRow[],
  keyFn: (r: CenterRow) => string,
  labelFn: (r: CenterRow) => string,
  nextLevel: string,
  nextParamKey: string,
  nextParamFn: (r: CenterRow) => string,
  sortByOrder?: string[]
): AggRow[] {
  const map = new Map<string, AggRow>();
  for (const r of rows) {
    const key = keyFn(r);
    if (!map.has(key)) {
      map.set(key, { key, label: labelFn(r), centers: 0, memorials: 0, donors: 0, amount: 0, nextLevel, nextParam: `${nextParamKey}=${encodeURIComponent(nextParamFn(r))}` });
    }
    const e = map.get(key)!;
    e.centers += r.centers;
    e.memorials += r.memorials;
    e.donors += r.donors;
    e.amount += r.amount;
  }
  const result = [...map.values()];
  if (sortByOrder) {
    result.sort((a, b) => {
      const ia = sortByOrder.indexOf(a.key);
      const ib = sortByOrder.indexOf(b.key);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  } else {
    result.sort((a, b) => b.donors - a.donors);
  }
  return result;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const LEVELS = [
  { value: "region",   label: "ภาค" },
  { value: "province", label: "จังหวัด" },
  { value: "amphoe",   label: "อำเภอ" },
  { value: "center",   label: "ศูนย์" },
];

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; region?: string; province?: string; amphoe?: string }>;
}) {
  const sp = await searchParams;
  const level    = sp.level    ?? "region";
  const region   = sp.region   ? decodeURIComponent(sp.region)   : undefined;
  const province = sp.province ? decodeURIComponent(sp.province) : undefined;
  const amphoe   = sp.amphoe   ? decodeURIComponent(sp.amphoe)   : undefined;

  const all = await getAllData();

  // Filter based on selected context
  let filtered = all;
  if (region)   filtered = filtered.filter(r => r.region === region);
  if (province) filtered = filtered.filter(r => r.province === province);
  if (amphoe)   filtered = filtered.filter(r => r.amphoe === amphoe);

  // National totals (always from full data)
  const national = all.reduce((s, r) => ({
    centers: s.centers + 1, memorials: s.memorials + r.memorials,
    donors: s.donors + r.donors, amount: s.amount + r.amount,
  }), { centers: 0, memorials: 0, donors: 0, amount: 0 });

  // Build rows based on level
  let rows: AggRow[] = [];
  if (level === "region") {
    rows = agg(all, r => r.region, r => r.region, "province", "province", r => r.province, REGION_ORDER).map(r => ({
      ...r, nextLevel: "province", nextParam: `level=province&region=${encodeURIComponent(r.key)}`,
    }));
  } else if (level === "province") {
    rows = agg(filtered.length > 0 ? filtered : all, r => r.province, r => r.province, "amphoe", "amphoe", r => r.amphoe).map(r => ({
      ...r, nextLevel: "amphoe", nextParam: `level=amphoe${region ? `&region=${encodeURIComponent(region)}` : ""}&province=${encodeURIComponent(r.key)}`,
    }));
  } else if (level === "amphoe") {
    rows = agg(filtered.length > 0 ? filtered : all, r => r.amphoe, r => r.amphoe, "center", "amphoe", r => r.amphoe).map(r => ({
      ...r, nextLevel: "center", nextParam: `level=center${province ? `&province=${encodeURIComponent(province)}` : ""}&amphoe=${encodeURIComponent(r.key)}`,
    }));
  } else if (level === "center") {
    rows = (filtered.length > 0 ? filtered : all).map(r => ({
      key: r.id, label: r.name,
      centers: 1, memorials: r.memorials, donors: r.donors, amount: r.amount,
      nextLevel: "center-detail", nextParam: ``,
    })).sort((a, b) => b.donors - a.donors);
  }

  // Breadcrumb
  const crumbs: { label: string; href: string }[] = [{ label: "ทั้งประเทศ", href: "/dashboard/admin/report?level=region" }];
  if (region)   crumbs.push({ label: region,   href: `/dashboard/admin/report?level=province&region=${encodeURIComponent(region)}` });
  if (province) crumbs.push({ label: province, href: `/dashboard/admin/report?level=amphoe${region ? `&region=${encodeURIComponent(region)}` : ""}&province=${encodeURIComponent(province)}` });
  if (amphoe)   crumbs.push({ label: amphoe,   href: `/dashboard/admin/report?level=center${province ? `&province=${encodeURIComponent(province)}` : ""}&amphoe=${encodeURIComponent(amphoe)}` });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gold-800">รายงานภูมิภาค</h2>
        <p className="text-[11px] text-gold-500">เลือกระดับเพื่อดูข้อมูลเจาะลึก</p>
      </div>

      {/* ─ National summary hero ─ */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
        <p className="text-[10px] font-semibold text-emerald-700 mb-2 uppercase tracking-wide">ภาพรวมทั้งประเทศ</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-base font-bold text-gold-800">{national.centers}</p><p className="text-[9px] text-gold-500">ศูนย์</p></div>
          <div><p className="text-base font-bold text-gold-800">{national.memorials}</p><p className="text-[9px] text-gold-500">งานศพ</p></div>
          <div><p className="text-base font-bold text-emerald-700">{national.donors.toLocaleString()}</p><p className="text-[9px] text-emerald-600">พวงหรีดลด</p></div>
          <div><p className="text-base font-bold text-amber-600">{national.amount >= 1000 ? `${(national.amount/1000).toFixed(0)}K` : national.amount}</p><p className="text-[9px] text-gold-500">บาท</p></div>
        </div>
      </div>

      {/* ─ Level tabs ─ */}
      <div className="flex gap-2 overflow-x-auto">
        {LEVELS.map(t => {
          const isActive = level === t.value;
          const href = `/dashboard/admin/report?level=${t.value}${
            t.value === "province" && region ? `&region=${encodeURIComponent(region)}` : ""
          }${
            t.value === "amphoe" && province ? `${region ? `&region=${encodeURIComponent(region)}` : ""}&province=${encodeURIComponent(province)}` : ""
          }${
            t.value === "center" && amphoe ? `${province ? `&province=${encodeURIComponent(province)}` : ""}&amphoe=${encodeURIComponent(amphoe)}` : ""
          }`;
          return (
            <Link key={t.value} href={href}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                isActive ? "bg-gold-600 text-white border-gold-600" : "bg-cream-50 text-gold-600 border-gold-300 hover:bg-gold-50"
              }`}>
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* ─ Breadcrumb ─ */}
      {crumbs.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-gold-400" />}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} className="text-[11px] text-gold-500 hover:text-gold-700 underline underline-offset-2">{c.label}</Link>
              ) : (
                <span className="text-[11px] font-semibold text-gold-800">{c.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* ─ Row list ─ */}
      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="bg-cream-50 rounded-2xl gold-border px-4 py-10 text-center">
            <MapIcon className="w-10 h-10 text-gold-300 mx-auto mb-2" />
            <p className="text-sm text-gold-400">ไม่มีข้อมูลในระดับนี้</p>
          </div>
        ) : rows.map((r, i) => {
          const isCenter = level === "center";
          const href = isCenter
            ? `/dashboard/admin/centers/${r.key}`
            : `/dashboard/admin/report?${r.nextParam}`;
          const pct = rows[0].donors > 0 ? (r.donors / rows[0].donors) * 100 : 0;

          return (
            <Link key={r.key} href={href}
              className="block bg-cream-50 rounded-xl gold-border hover:bg-cream-100 transition-colors overflow-hidden">
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-gold-400 w-5 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gold-800 truncate">{r.label}</p>
                      <p className="text-[10px] text-gold-400">
                        {r.centers} ศูนย์ · {r.memorials} งานศพ
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 rounded-lg py-1.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <Leaf className="w-3 h-3 text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-700">{r.donors.toLocaleString()}</p>
                    </div>
                    <p className="text-[9px] text-emerald-600">พวงหรีดลด</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg py-1.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <Banknote className="w-3 h-3 text-amber-500" />
                      <p className="text-sm font-bold text-amber-600">
                        {r.amount >= 1000000 ? `${(r.amount/1000000).toFixed(1)}M` : r.amount >= 1000 ? `${(r.amount/1000).toFixed(0)}K` : r.amount}
                      </p>
                    </div>
                    <p className="text-[9px] text-amber-600">บาท</p>
                  </div>
                  <div className="bg-teal-50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-teal-600">{(r.donors * 2).toLocaleString()}</p>
                    <p className="text-[9px] text-teal-600">กก. ขยะลด</p>
                  </div>
                </div>
                {/* Progress bar relative to top */}
                <div className="mt-2 h-1 bg-gold-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="h-2" />
    </div>
  );
}

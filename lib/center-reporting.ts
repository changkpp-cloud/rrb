import { createAdminClient } from "@/lib/supabase/admin";

export type CenterReportTotal = {
  center_id: string;
  center_name: string;
  province: string;
  amphoe: string;
  center_status: string | null;
  donation_count: number;
  pending_count: number;
  confirmed_count: number;
  rejected_count: number;
  total_amount: number;
  wreaths_reduced: number;
  waste_reduced_kg: number;
  memorials: number;
  active_memorials: number;
  closed_memorials: number;
  updated_at: string | null;
};

type CenterRow = {
  id: string;
  name: string;
  province: string | null;
  amphoe: string | null;
  status: string | null;
};

type MemorialRow = {
  id: string;
  center_id: string | null;
  funeral_status: string | null;
};

type DonationRow = {
  memorial_id: string;
  amount: number | null;
  status: string | null;
};

function emptyTotal(center: CenterRow): CenterReportTotal {
  return {
    center_id: center.id,
    center_name: center.name,
    province: center.province ?? "ไม่ระบุ",
    amphoe: center.amphoe ?? "ไม่ระบุ",
    center_status: center.status,
    donation_count: 0,
    pending_count: 0,
    confirmed_count: 0,
    rejected_count: 0,
    total_amount: 0,
    wreaths_reduced: 0,
    waste_reduced_kg: 0,
    memorials: 0,
    active_memorials: 0,
    closed_memorials: 0,
    updated_at: null,
  };
}

export async function getCenterReportTotals(): Promise<CenterReportTotal[]> {
  const supabase = createAdminClient();

  const [{ data: centersData }, { data: memorialsData }] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe, status"),
    supabase.from("memorials").select("id, center_id, funeral_status"),
  ]);

  const centers = (centersData ?? []) as CenterRow[];
  const totals = new Map(centers.map((center) => [center.id, emptyTotal(center)]));

  for (const memorial of (memorialsData ?? []) as MemorialRow[]) {
    if (!memorial.center_id) continue;
    const total = totals.get(memorial.center_id);
    if (!total) continue;
    total.memorials += 1;
    if (memorial.funeral_status === "active") total.active_memorials += 1;
    if (memorial.funeral_status === "closed") total.closed_memorials += 1;
  }

  const { data: reportRows, error } = await supabase
    .from("center_report_totals")
    .select("*");

  if (!error && reportRows) {
    for (const row of reportRows) {
      if (!row.center_id) continue;
      const total = totals.get(row.center_id);
      if (!total) continue;
      total.donation_count = row.donation_count ?? 0;
      total.pending_count = row.pending_count ?? 0;
      total.confirmed_count = row.confirmed_count ?? 0;
      total.rejected_count = row.rejected_count ?? 0;
      total.total_amount = row.total_amount ?? 0;
      total.wreaths_reduced = row.wreaths_reduced ?? 0;
      total.waste_reduced_kg = row.waste_reduced_kg ?? 0;
      total.updated_at = row.updated_at ?? null;
    }
    return [...totals.values()];
  }

  // Fallback for deployments that have not run the reporting migration yet.
  const { data: donationsData } = await supabase
    .from("donations")
    .select("memorial_id, amount, status");

  const memorialCenter = new Map(
    ((memorialsData ?? []) as MemorialRow[]).map((memorial) => [memorial.id, memorial.center_id]),
  );

  for (const donation of (donationsData ?? []) as DonationRow[]) {
    const centerId = memorialCenter.get(donation.memorial_id);
    if (!centerId) continue;
    const total = totals.get(centerId);
    if (!total) continue;
    total.donation_count += 1;
    if (donation.status === "pending") total.pending_count += 1;
    if (donation.status === "rejected") total.rejected_count += 1;
    if (donation.status === "confirmed") {
      total.confirmed_count += 1;
      total.total_amount += donation.amount ?? 0;
      total.wreaths_reduced += 1;
      total.waste_reduced_kg += 2;
    }
  }

  return [...totals.values()];
}

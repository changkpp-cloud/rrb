import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRegion, getDateFrom } from "@/lib/regions";
import { getCenterReportTotals } from "@/lib/center-reporting";

type CenterExportRow = {
  id: string;
  name: string;
  province: string;
  amphoe: string;
  region: string;
};

type MemorialExportRow = {
  id: string;
  center_id: string | null;
  name: string;
  funeral_status: string | null;
  host_name: string | null;
  ceremony_date: string;
};

type DonationExportRow = {
  id: string;
  memorial_id: string;
  amount: number | null;
  status: string | null;
  created_at: string;
  donor_name: string;
  donor_title: string | null;
};

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const geoLevel = searchParams.get("geoLevel") ?? "country";
  const geoVal = searchParams.get("geo") ?? "";
  const period = searchParams.get("period") ?? "all";
  const type = searchParams.get("type") ?? "centers";

  const supabase = createAdminClient();
  const dateFrom = getDateFrom(period);

  const [{ data: allCenters }, { data: allMemorials }, { data: allDonations }, centerReports] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe"),
    supabase.from("memorials").select("id, center_id, name, funeral_status, host_name, ceremony_date"),
    supabase.from("donations").select("id, memorial_id, amount, status, created_at, donor_name, donor_title").limit(5000),
    getCenterReportTotals(),
  ]);

  const centers: CenterExportRow[] = ((allCenters ?? []) as unknown as Array<{
    id: string;
    name: string;
    province: string | null;
    amphoe: string | null;
  }>).map((center) => ({
    id: center.id,
    name: center.name,
    province: center.province ?? "ไม่ระบุ",
    amphoe: center.amphoe ?? "ไม่ระบุ",
    region: getRegion(center.province),
  }));

  let filteredCenters = centers;
  if (geoLevel === "region" && geoVal) filteredCenters = centers.filter((center) => center.region === geoVal);
  if (geoLevel === "province" && geoVal) filteredCenters = centers.filter((center) => center.province === geoVal);
  if (geoLevel === "amphoe" && geoVal) filteredCenters = centers.filter((center) => center.amphoe === geoVal);
  if (geoLevel === "center" && geoVal) filteredCenters = centers.filter((center) => center.id === geoVal);

  const centerIds = new Set(filteredCenters.map((center) => center.id));
  const filteredMemorials = ((allMemorials ?? []) as unknown as MemorialExportRow[])
    .filter((memorial) => memorial.center_id && centerIds.has(memorial.center_id));
  const memIds = new Set(filteredMemorials.map((memorial) => memorial.id));
  const filteredDonations = ((allDonations ?? []) as unknown as DonationExportRow[])
    .filter((donation) => memIds.has(donation.memorial_id) && (!dateFrom || donation.created_at >= dateFrom));

  let csv = "";

  if (type === "hosts") {
    csv = "ชื่องานศพ,เจ้าภาพ,สถานะ,ยอดเงินยืนยัน(บาท)\n";
    for (const memorial of filteredMemorials) {
      const donations = filteredDonations.filter((donation) => donation.memorial_id === memorial.id && donation.status === "confirmed");
      const amount = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
      csv += [
        csvEscape(memorial.name),
        csvEscape(memorial.host_name ?? "-"),
        csvEscape(memorial.funeral_status ?? "-"),
        amount,
      ].join(",") + "\n";
    }
  } else if (type === "donors" && geoLevel === "center" && geoVal) {
    csv = "ชื่องาน,ผู้ร่วมบุญ,ตำแหน่ง/ข้อความบนป้าย,ยอด(บาท),สถานะ,วันที่\n";
    for (const donation of filteredDonations) {
      const memorial = filteredMemorials.find((row) => row.id === donation.memorial_id);
      const date = new Date(donation.created_at).toLocaleDateString("th-TH");
      csv += [
        csvEscape(memorial?.name ?? "-"),
        csvEscape(donation.donor_name),
        csvEscape(donation.donor_title ?? "-"),
        donation.amount ?? 0,
        csvEscape(donation.status ?? "-"),
        csvEscape(date),
      ].join(",") + "\n";
    }
  } else {
    const reportByCenter = new Map(centerReports.map((row) => [row.center_id, row]));
    csv = "ชื่อศูนย์,จังหวัด,อำเภอ,ภาค,จำนวนงานศพ,ผู้ร่วมบุญยืนยัน,ยอดเงิน(บาท),พวงหรีดที่ลด,ขยะที่ลด(กก.),รอตรวจ,ตีกลับ\n";
    for (const center of filteredCenters) {
      const report = reportByCenter.get(center.id);
      csv += [
        csvEscape(center.name),
        csvEscape(center.province),
        csvEscape(center.amphoe),
        csvEscape(center.region),
        report?.memorials ?? 0,
        report?.confirmed_count ?? 0,
        report?.total_amount ?? 0,
        report?.wreaths_reduced ?? 0,
        report?.waste_reduced_kg ?? 0,
        report?.pending_count ?? 0,
        report?.rejected_count ?? 0,
      ].join(",") + "\n";
    }
  }

  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${type}-${period}.csv"`,
    },
  });
}

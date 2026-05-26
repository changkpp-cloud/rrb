import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRegion, getDateFrom } from "@/lib/regions";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const geoLevel = searchParams.get("geoLevel") ?? "country";
  const geoVal   = searchParams.get("geo") ?? "";
  const period   = searchParams.get("period") ?? "all";
  const type     = searchParams.get("type") ?? "overview";

  const supabase  = createAdminClient();
  const dateFrom  = getDateFrom(period);

  const [{ data: allCenters }, { data: allMemorials }, { data: allDonations }] = await Promise.all([
    supabase.from("centers").select("id, name, province, amphoe"),
    supabase.from("memorials").select("id, center_id, name, funeral_status, host_name, ceremony_date"),
    supabase.from("donations").select("id, memorial_id, amount, status, created_at, donor_name, donor_title"),
  ]);

  const centers = (allCenters ?? []).map(c => ({
    id: c.id, name: c.name,
    province: c.province ?? "ไม่ระบุ",
    amphoe: c.amphoe ?? "ไม่ระบุ",
    region: getRegion(c.province),
  }));

  let filteredCenters = centers;
  if (geoLevel === "region"   && geoVal) filteredCenters = centers.filter(c => c.region === geoVal);
  if (geoLevel === "province" && geoVal) filteredCenters = centers.filter(c => c.province === geoVal);
  if (geoLevel === "amphoe"   && geoVal) filteredCenters = centers.filter(c => c.amphoe === geoVal);
  if (geoLevel === "center"   && geoVal) filteredCenters = centers.filter(c => c.id === geoVal);

  const centerIds = new Set(filteredCenters.map(c => c.id));
  const filteredMemorials = (allMemorials ?? []).filter(m => m.center_id && centerIds.has(m.center_id));
  const memIds = new Set(filteredMemorials.map(m => m.id));
  const filteredDonations = (allDonations ?? []).filter(d =>
    memIds.has(d.memorial_id) && (!dateFrom || d.created_at >= dateFrom)
  );

  let csv = "";

  if (type === "centers") {
    const centerMemMap: Record<string, number> = {};
    const centerDonMap: Record<string, { donors: number; amount: number }> = {};
    for (const m of filteredMemorials) {
      if (!m.center_id) continue;
      centerMemMap[m.center_id] = (centerMemMap[m.center_id] || 0) + 1;
    }
    for (const d of filteredDonations.filter(d => d.status === "confirmed")) {
      const mem = filteredMemorials.find(m => m.id === d.memorial_id);
      const cid = mem?.center_id;
      if (!cid) continue;
      if (!centerDonMap[cid]) centerDonMap[cid] = { donors: 0, amount: 0 };
      centerDonMap[cid].donors++;
      centerDonMap[cid].amount += d.amount || 0;
    }
    csv = "ชื่อศูนย์,จังหวัด,อำเภอ,ภาค,จำนวนงานศพ,ผู้ร่วมบุญ,ยอดเงิน(บาท),พวงหรีดที่ลด,ขยะที่ลด(กก.)\n";
    for (const c of filteredCenters) {
      const d = centerDonMap[c.id] ?? { donors: 0, amount: 0 };
      const m = centerMemMap[c.id] ?? 0;
      csv += `"${c.name}","${c.province}","${c.amphoe}","${c.region}",${m},${d.donors},${d.amount},${d.donors},${d.donors * 2}\n`;
    }
  } else if (type === "hosts") {
    csv = "ชื่องานศพ,เจ้าภาพ,สถานะ,ยอดเงิน(บาท)\n";
    for (const m of filteredMemorials) {
      const donations = filteredDonations.filter(d => d.memorial_id === m.id && d.status === "confirmed");
      const amount = donations.reduce((s, d) => s + (d.amount || 0), 0);
      csv += `"${m.name}","${m.host_name ?? "-"}","${m.funeral_status}",${amount}\n`;
    }
  } else {
    // Default: donor list
    csv = "ชื่องาน,ผู้ร่วมบุญ,ตำแหน่ง,ยอด(บาท),สถานะ,วันที่\n";
    for (const d of filteredDonations) {
      const mem = filteredMemorials.find(m => m.id === d.memorial_id);
      const date = new Date(d.created_at).toLocaleDateString("th-TH");
      csv += `"${mem?.name ?? "-"}","${d.donor_name}","${d.donor_title ?? "-"}",${d.amount},${d.status},"${date}"\n`;
    }
  }

  const bom = "﻿"; // UTF-8 BOM for Excel
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${type}-${period}.csv"`,
    },
  });
}

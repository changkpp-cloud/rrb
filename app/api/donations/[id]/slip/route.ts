import { NextRequest, NextResponse } from "next/server";
import { hasHostSession } from "@/lib/host-session";
import { getCenterAccess } from "@/lib/iam";
import { normalizeHostCode } from "@/lib/memorial";
import { createAdminClient } from "@/lib/supabase/admin";

type DonationSlipRow = {
  id: string;
  memorial_id: string;
  center_id: string | null;
  slip_url: string | null;
  memorials?: {
    center_id?: string | null;
    host_code?: string | null;
  } | null;
};

function forbidden() {
  return NextResponse.json({ error: "Slip access denied" }, { status: 403 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const hostCode = searchParams.get("code");

  const { data, error } = await supabase
    .from("donations")
    .select("id, memorial_id, center_id, slip_url, memorials(center_id, host_code)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("slip access error:", error);
    return NextResponse.json({ error: "Failed to fetch slip" }, { status: 500 });
  }

  const donation = data as DonationSlipRow | null;
  if (!donation?.slip_url) {
    return NextResponse.json({ error: "Slip not found" }, { status: 404 });
  }

  const centerId = donation.center_id ?? donation.memorials?.center_id ?? null;
  let allowed = false;

  if (centerId) {
    const access = await getCenterAccess(centerId);
    allowed = access.allowed && access.role !== "super_admin";
  }

  if (!allowed && hostCode && donation.memorials?.host_code) {
    allowed = normalizeHostCode(hostCode) === normalizeHostCode(donation.memorials.host_code);
  }
  if (!allowed) {
    allowed = await hasHostSession(donation.memorial_id);
  }

  if (!allowed) return forbidden();

  if (/^https?:\/\//i.test(donation.slip_url)) {
    return NextResponse.redirect(donation.slip_url);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("donations")
    .createSignedUrl(donation.slip_url, 60);

  if (signError || !signed?.signedUrl) {
    console.error("slip sign error:", signError);
    return NextResponse.json({ error: "Failed to sign slip" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}

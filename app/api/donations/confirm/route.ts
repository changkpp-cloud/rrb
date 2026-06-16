import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { getCenterAccess } from "@/lib/iam";

type ConfirmResult = { ok: boolean; reason?: string; memorial_id?: string };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const donation_id = body?.donation_id as string | undefined;

  if (!donation_id) {
    return NextResponse.json({ error: "donation_id required" }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: donation } = await supabase
    .from("donations")
    .select("id, center_id, memorial_id, memorials(center_id)")
    .eq("id", donation_id)
    .maybeSingle();

  const centerId =
    (donation as any)?.center_id ??
    (donation as any)?.memorials?.center_id ??
    null;

  if (!centerId) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }

  const access = await getCenterAccess(centerId);
  if (!access.allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("confirm_donation", {
    p_donation_id:  donation_id,
    p_provider:     "manual",
    p_provider_ref: `manual:${donation_id}`,
    p_amount:       0,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as ConfirmResult;
  if (!result.ok) {
    return NextResponse.json({ error: "already_confirmed", ...result }, { status: 409 });
  }

  return NextResponse.json(result);
}

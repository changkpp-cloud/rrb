import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { notifyHost, msgDonationConfirmed } from "@/lib/notify";

type DonationUpdate = Database["public"]["Tables"]["donations"]["Update"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = ["status", "nameplate_status", "donor_name", "donor_title", "message"];
  const update: DonationUpdate = {};
  for (const key of allowed) {
    if (key in body) (update as Record<string, unknown>)[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  let { data, error } = await supabase
    .from("donations")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  // If migration columns (donor_title, nameplate_status) don't exist yet, retry with base columns only
  if (error && error.message.includes("Could not find")) {
    const baseAllowed = ["status", "donor_name", "message"];
    const baseUpdate: DonationUpdate = {};
    for (const key of baseAllowed) {
      if (key in update) (baseUpdate as Record<string, unknown>)[key] = (update as Record<string, unknown>)[key];
    }
    if (Object.keys(baseUpdate).length > 0) {
      ({ data, error } = await supabase.from("donations").update(baseUpdate).eq("id", id).select().single());
    }
  }

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  // Notify host when center confirms a donation
  if (update.status === "confirmed" && data) {
    const supabaseInner = createAdminClient();
    const donation = data as { memorial_id: string; donor_name: string; amount: number };
    const { data: mem } = await supabaseInner
      .from("memorials")
      .select("name, host_phone")
      .eq("id", donation.memorial_id)
      .single();
    if (mem) {
      const m = mem as { name: string; host_phone?: string | null };
      notifyHost({
        hostPhone: m.host_phone ?? null,
        message: msgDonationConfirmed({
          memorialName: m.name,
          donorName: donation.donor_name,
          amount: donation.amount,
          hostId: donation.memorial_id,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, donation: data });
}

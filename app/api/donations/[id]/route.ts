import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPrintJob } from "@/lib/printnode";
import type { Database } from "@/lib/supabase/types";

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

  const allowed = ["nameplate_status", "donor_name", "donor_title", "message", "status"];
  const update: DonationUpdate = {};
  for (const key of allowed) {
    if (key in body) (update as Record<string, unknown>)[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Validate status values
  if ("status" in update) {
    const s = update.status;
    if (s !== "confirmed" && s !== "rejected" && s !== "pending") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }
    if (s === "confirmed") {
      update.confirmed_at = new Date().toISOString();
    }
  }

  const supabase = createAdminClient();
  let { data, error } = await (supabase.from("donations") as any)
    .update(update)
    .eq("id", id)
    .select("*, memorials(name, printer_id, host_phone)")
    .single();

  // If migration columns don't exist yet, retry with base columns only
  if (error && error.message.includes("Could not find")) {
    const baseAllowed = ["donor_name", "message"];
    const baseUpdate: DonationUpdate = {};
    for (const key of baseAllowed) {
      if (key in update) (baseUpdate as Record<string, unknown>)[key] = (update as Record<string, unknown>)[key];
    }
    if (Object.keys(baseUpdate).length > 0) {
      ({ data, error } = await (supabase.from("donations") as any)
        .update(baseUpdate)
        .eq("id", id)
        .select()
        .single());
    }
  }

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  // When status becomes "confirmed", generate PDF and send to PrintNode
  if (update.status === "confirmed" && data) {
    const memorial = (data as any).memorials as { name?: string; printer_id?: string | null } | null;
    if (memorial?.printer_id) {
      const printResult = await sendPrintJob({
        printerId: memorial.printer_id,
        donorName: (data as any).donor_name ?? "",
        donorTitle: (data as any).donor_title ?? "",
        amount: (data as any).amount ?? 0,
        memorialName: memorial.name ?? "งานศพ",
        donationId: id,
      });
      // Update nameplate_status based on print result
      const nameplateStatus = printResult.ok ? "queued" : "error";
      await (supabase.from("donations") as any)
        .update({ nameplate_status: nameplateStatus })
        .eq("id", id);
      if (printResult.ok) {
        (data as any).nameplate_status = nameplateStatus;
      }
    }
  }

  return NextResponse.json({ success: true, donation: data });
}

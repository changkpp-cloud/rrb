import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess } from "@/lib/iam";
import { sendPrintJob } from "@/lib/printnode";

export const runtime = "nodejs";
export const maxDuration = 30;

// ศูนย์สั่งพิมพ์ป้ายซ้ำ — body: { action: "reprint" }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let action = "";
  try {
    action = (await request.json())?.action ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (action !== "reprint") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: donation } = await supabase
    .from("donations")
    .select("id, donor_name, donor_title, amount, memorials(name, printer_id, center_id)")
    .eq("id", id)
    .single();

  if (!donation) return NextResponse.json({ error: "Donation not found" }, { status: 404 });

  const memorial = (donation as any).memorials as
    | { name?: string; printer_id?: string | null; center_id?: string | null }
    | null;

  // ตรวจสิทธิ์ศูนย์ที่เป็นเจ้าของงาน
  const centerId = memorial?.center_id ?? null;
  if (!centerId) return NextResponse.json({ error: "ไม่พบศูนย์เจ้าของงาน" }, { status: 403 });
  const access = await getCenterAccess(centerId);
  if (!access.allowed) return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });

  // reprint — ยิงพิมพ์ใหม่ผ่าน PrintNode
  if (!memorial?.printer_id) {
    return NextResponse.json(
      { error: "งานนี้ยังไม่ได้ตั้งค่าเครื่องพิมพ์ (Printer ID) — ตั้งค่าก่อนจึงพิมพ์ได้" },
      { status: 400 },
    );
  }
  const result = await sendPrintJob({
    printerId: memorial.printer_id,
    donorName: (donation as any).donor_name ?? "",
    donorTitle: (donation as any).donor_title ?? "",
    amount: (donation as any).amount ?? 0,
    memorialName: memorial.name ?? "งานศพ",
    donationId: id,
  });
  const nameplate_status = result.ok ? "queued" : "error";
  await (supabase.from("donations") as any).update({ nameplate_status }).eq("id", id);

  return NextResponse.json(
    { success: result.ok, nameplate_status, error: result.error },
    { status: result.ok ? 200 : 502 },
  );
}

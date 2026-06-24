import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCenterAccess } from "@/lib/iam";
import { hasHostSession } from "@/lib/host-session";
import { getPrinterState } from "@/lib/printnode";

export const runtime = "nodejs";

// สถานะเครื่องพิมพ์ + จำนวนป้ายพิมพ์ไม่สำเร็จ ของงานหนึ่ง (ให้ทั้งศูนย์และเจ้าภาพเรียกได้)
export async function GET(req: NextRequest) {
  const memorialId = req.nextUrl.searchParams.get("memorialId");
  if (!memorialId) return NextResponse.json({ error: "memorialId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: memorial } = await supabase
    .from("memorials")
    .select("center_id, printer_id")
    .eq("id", memorialId)
    .maybeSingle();
  if (!memorial) return NextResponse.json({ error: "not found" }, { status: 404 });

  const centerId = (memorial as { center_id?: string | null }).center_id ?? null;
  const printerId = (memorial as { printer_id?: string | null }).printer_id ?? null;

  const hostAllowed = await hasHostSession(memorialId);
  const centerAllowed = centerId ? (await getCenterAccess(centerId)).allowed : false;
  if (!hostAllowed && !centerAllowed) {
    return NextResponse.json({ error: "denied" }, { status: 403 });
  }

  const { count: failed } = await supabase
    .from("donations")
    .select("id", { count: "exact", head: true })
    .eq("memorial_id", memorialId)
    .eq("nameplate_status", "error");

  const state = printerId ? await getPrinterState(printerId) : null;
  const online = state === null ? null : state === "online";

  return NextResponse.json({
    hasPrinter: Boolean(printerId),
    online,
    state,
    failed: failed ?? 0,
  });
}

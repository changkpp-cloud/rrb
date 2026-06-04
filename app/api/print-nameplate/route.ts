/**
 * POST /api/print-nameplate
 *
 * Body (JSON):
 *   donationId   string  — UUID of the donation
 *   donorName    string  — ชื่อผู้มอบ
 *   donorTitle   string  — ตำแหน่ง / ข้อความอาลัย (optional)
 *   imageDataUrl string  — base64 PNG ของป้ายชื่อ
 *
 * Workflow:
 *   1. อัปโหลดรูปป้ายขึ้น Supabase Storage (memorials bucket / nameplates/)
 *   2. ถ้ามี PRINT_SERVICE_URL → POST ไปที่ปริ้นเตอร์อัตโนมัติ
 *   3. สำเร็จ  → nameplate_status = "queued"
 *      ล้มเหลว → nameplate_status = "error"
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let donationId = "";

  try {
    const body = (await req.json()) as {
      donationId: string;
      donorName?: string;
      donorTitle?: string;
      imageDataUrl: string;
    };

    donationId = body.donationId ?? "";
    const donorName = body.donorName ?? "";
    const donorTitle = body.donorTitle ?? "";
    const { imageDataUrl } = body;

    if (!donationId || !imageDataUrl) {
      return NextResponse.json({ error: "donationId และ imageDataUrl จำเป็น" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── 1. Upload PNG to Supabase Storage ──────────────────────────────
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const storagePath = `nameplates/${donationId}.png`;

    const { error: uploadErr } = await supabase.storage
      .from("memorials")
      .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

    if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);

    const { data: urlData } = supabase.storage
      .from("memorials")
      .getPublicUrl(storagePath);
    const imageUrl = urlData.publicUrl;

    // ── 2. Call external print service (if configured) ─────────────────
    const printServiceUrl = process.env.PRINT_SERVICE_URL;

    if (printServiceUrl) {
      let printFailed = false;
      let printError = "";

      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 20_000);

        const printRes = await fetch(`${printServiceUrl}/print`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donation_id: donationId,
            image_url: imageUrl,
            donor_name: donorName,
            donor_title: donorTitle,
          }),
          signal: ctrl.signal,
        });

        clearTimeout(timeout);

        if (!printRes.ok) {
          printFailed = true;
          printError = `เครื่องพิมพ์ตอบกลับ HTTP ${printRes.status}`;
        }
      } catch (e) {
        printFailed = true;
        printError =
          e instanceof Error && e.name === "AbortError"
            ? "เครื่องพิมพ์ไม่ตอบสนองภายใน 20 วินาที"
            : (e instanceof Error ? e.message : "ติดต่อเครื่องพิมพ์ไม่ได้");
      }

      if (printFailed) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("donations") as any)
          .update({ nameplate_status: "error" })
          .eq("id", donationId);

        return NextResponse.json(
          { error: printError, imageUrl, status: "error" },
          { status: 502 }
        );
      }
    }

    // ── 3. Mark as queued ───────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("donations") as any)
      .update({ nameplate_status: "queued" })
      .eq("id", donationId);

    return NextResponse.json({
      success: true,
      imageUrl,
      status: "queued",
      printServiceConnected: Boolean(printServiceUrl),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";

    // Best-effort mark as error
    if (donationId) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("donations") as any)
          .update({ nameplate_status: "error" })
          .eq("id", donationId);
      } catch {}
    }

    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}

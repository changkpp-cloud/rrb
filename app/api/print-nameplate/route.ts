import { NextRequest, NextResponse } from "next/server";
import { enqueue } from "@/lib/outbox";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

type PrintNameplateBody = {
  donationId: string;
  donorName?: string;
  donorTitle?: string;
  imageDataUrl: string;
};

async function quickDispatchPrint(payload: Record<string, unknown>) {
  const printServiceUrl = process.env.PRINT_SERVICE_URL;
  if (!printServiceUrl) return false;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 1_200);

  try {
    const res = await fetch(`${printServiceUrl}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  let donationId = "";

  try {
    const body = (await req.json()) as PrintNameplateBody;
    donationId = body.donationId ?? "";

    const donorName = body.donorName ?? "";
    const donorTitle = body.donorTitle ?? "";
    const imageDataUrl = body.imageDataUrl ?? "";

    if (!donationId || !imageDataUrl) {
      return NextResponse.json({ error: "donationId and imageDataUrl are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const storagePath = `nameplates/${donationId}.png`;

    const { error: uploadError } = await supabase.storage
      .from("memorials")
      .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      throw new Error(`Storage upload: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("memorials").getPublicUrl(storagePath);
    const imageUrl = urlData.publicUrl;

    // Queue first. The donor flow must not wait on the physical printer.
    await (supabase.from("donations") as any)
      .update({ nameplate_status: "queued" })
      .eq("id", donationId);

    const printPayload = {
      donation_id: donationId,
      image_url: imageUrl,
      donor_name: donorName,
      donor_title: donorTitle,
    };

    await enqueue("dispatch_print", printPayload, { maxAttempts: 5 }).catch(() => {});
    const quickDispatch = await quickDispatchPrint(printPayload);

    return NextResponse.json({
      success: true,
      imageUrl,
      status: "queued",
      printServiceConnected: Boolean(process.env.PRINT_SERVICE_URL),
      quickDispatch,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue nameplate";

    if (donationId) {
      try {
        await (createAdminClient().from("donations") as any)
          .update({ nameplate_status: "queued" })
          .eq("id", donationId);
      } catch {}
    }

    return NextResponse.json({ error: message, status: "queued" }, { status: 500 });
  }
}

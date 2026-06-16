import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

type WebhookBody = {
  provider:    string;
  provider_ref: string;
  donation_id: string;
  amount:      number;
};

type ConfirmResult = { ok: boolean; reason?: string; memorial_id?: string };

// Verify HMAC-SHA256 signature from payment provider.
// Set PAYMENT_WEBHOOK_SECRET in env and configure the same secret on your provider.
function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const sig = signature.replace(/^sha256=/, "");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { provider, provider_ref, donation_id, amount } = body;
  if (!provider || !provider_ref || !donation_id || amount == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await getAdminClient().rpc("confirm_donation", {
    p_donation_id:  donation_id,
    p_provider:     provider,
    p_provider_ref: provider_ref,
    p_amount:       amount,
    p_metadata:     body as unknown as Record<string, unknown>,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as ConfirmResult;
  // Return 200 even for duplicates so the provider won't keep retrying
  return NextResponse.json({ received: true, result });
}

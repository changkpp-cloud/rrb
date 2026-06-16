import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import type { OutboxJob } from "@/lib/outbox";

const BATCH_SIZE = 10;
const RETRY_DELAY_MS = 60_000;

// Vercel cron calls GET /api/worker with Authorization: Bearer <CRON_SECRET>.
// Manual trigger can also POST with the same header.
// Set CRON_SECRET in Vercel env (Vercel sets it automatically when crons are configured).
function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

async function run() {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc("claim_outbox_jobs", {
    p_batch_size: BATCH_SIZE,
  });

  if (error) throw new Error(`claim_outbox_jobs failed: ${error.message}`);

  const jobs = (data ?? []) as OutboxJob[];
  const results: { id: string; status: string; error?: string }[] = [];

  for (const job of jobs) {
    try {
      await processJob(job);
      await supabase
        .from("outbox_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ id: job.id, status: "completed" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isFinal = job.attempts >= job.max_attempts;
      await supabase
        .from("outbox_jobs")
        .update({
          status:       isFinal ? "failed" : "pending",
          last_error:   msg,
          claimed_at:   null,
          scheduled_at: isFinal
            ? new Date().toISOString()
            : new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
        })
        .eq("id", job.id);
      results.push({ id: job.id, status: isFinal ? "failed" : "retry", error: msg });
    }
  }

  return results;
}

// ── Job handlers ─────────────────────────────────────────────
async function processJob(job: OutboxJob) {
  switch (job.job_type) {
    case "print_nameplate":
      await handlePrintNameplate(job.payload);
      break;
    default:
      throw new Error(`Unknown job_type: ${job.job_type}`);
  }
}

// Worker queues the donation for printing by setting nameplate_status = 'queued'.
// Print size, font, and layout are owned by the nameplate page — this handler never touches them.
async function handlePrintNameplate(payload: Record<string, unknown>) {
  const donation_id = payload.donation_id as string | undefined;
  if (!donation_id) throw new Error("Missing donation_id in payload");

  const { error } = await getAdminClient()
    .from("donations")
    .update({ nameplate_status: "queued" })
    .eq("id", donation_id)
    .eq("nameplate_status", "pending"); // idempotent: skip if already queued/printed

  if (error) throw error;
}

// ── Route handlers ────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await run().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  });
  if (results instanceof NextResponse) return results;
  return NextResponse.json({ processed: results.length, results });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await run().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  });
  if (results instanceof NextResponse) return results;
  return NextResponse.json({ processed: results.length, results });
}

import { getAdminClient } from "@/lib/supabase";

export type JobType = "print_nameplate";

export type OutboxJob = {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  dedupe_key: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type EnqueueOptions = {
  dedupeKey?: string;
  scheduledAt?: Date;
  maxAttempts?: number;
};

// Insert a job into the outbox. Returns null silently when dedupeKey collides.
export async function enqueue(
  jobType: JobType,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {},
): Promise<{ id: string } | null> {
  const { dedupeKey, scheduledAt, maxAttempts = 3 } = options;

  const { data, error } = await getAdminClient()
    .from("outbox_jobs")
    .insert({
      job_type:     jobType,
      payload,
      dedupe_key:   dedupeKey ?? null,
      scheduled_at: (scheduledAt ?? new Date()).toISOString(),
      max_attempts: maxAttempts,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null; // duplicate dedupe_key — expected
    throw error;
  }

  return data as { id: string };
}

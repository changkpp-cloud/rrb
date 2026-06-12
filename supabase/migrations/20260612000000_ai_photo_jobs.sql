-- AI photo jobs, credits, and status-link recovery.
-- Idempotent: safe to run more than once in Supabase SQL Editor.

create table if not exists public.ai_photo_credits (
  id uuid primary key default gen_random_uuid(),
  donation_id text not null unique,
  free_quota integer not null default 1,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_photo_requests (
  id uuid primary key default gen_random_uuid(),
  donation_id text,
  memorial_id text,
  template_key text not null,
  final_prompt text,
  reference_image_url text,
  generated_image_url text,
  status text not null default 'completed'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_photo_credits_donation_id_idx
  on public.ai_photo_credits(donation_id);

create index if not exists ai_photo_requests_donation_id_idx
  on public.ai_photo_requests(donation_id);

create index if not exists ai_photo_requests_status_idx
  on public.ai_photo_requests(status);

-- Center dashboard one-code login.
-- Idempotent: safe to run more than once in Supabase SQL Editor.

alter table public.centers
  add column if not exists access_code text;

create unique index if not exists centers_access_code_unique
  on public.centers (access_code)
  where access_code is not null;

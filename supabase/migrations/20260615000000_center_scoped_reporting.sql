-- Center-scoped national reporting support.
-- Donations belong to one center so center dashboards can query locally and
-- central admin dashboards can read daily aggregates instead of raw slips.

alter table public.donations
  add column if not exists center_id uuid references public.centers(id) on delete set null,
  add column if not exists confirmed_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

update public.donations d
set center_id = m.center_id
from public.memorials m
where d.memorial_id = m.id
  and d.center_id is null;

update public.donations
set confirmed_at = coalesce(confirmed_at, created_at)
where status = 'confirmed';

create index if not exists idx_donations_center_created
  on public.donations(center_id, created_at desc);

create index if not exists idx_donations_center_status_created
  on public.donations(center_id, status, created_at desc);

create index if not exists idx_donations_memorial_status_created
  on public.donations(memorial_id, status, created_at desc);

create index if not exists idx_donations_center_nameplate
  on public.donations(center_id, nameplate_status, created_at desc);

create table if not exists public.center_daily_stats (
  center_id uuid not null references public.centers(id) on delete cascade,
  report_date date not null,
  donation_count int not null default 0,
  pending_count int not null default 0,
  confirmed_count int not null default 0,
  rejected_count int not null default 0,
  total_amount numeric(14,2) not null default 0,
  wreaths_reduced int not null default 0,
  waste_reduced_kg numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (center_id, report_date)
);

create index if not exists idx_center_daily_stats_date
  on public.center_daily_stats(report_date desc);

create index if not exists idx_center_daily_stats_center_date
  on public.center_daily_stats(center_id, report_date desc);

create or replace function public.refresh_center_daily_stats(p_center_id uuid, p_report_date date)
returns void
language plpgsql
security definer
as $$
begin
  if p_center_id is null or p_report_date is null then
    return;
  end if;

  insert into public.center_daily_stats (
    center_id,
    report_date,
    donation_count,
    pending_count,
    confirmed_count,
    rejected_count,
    total_amount,
    wreaths_reduced,
    waste_reduced_kg,
    updated_at
  )
  select
    p_center_id,
    p_report_date,
    count(*)::int,
    count(*) filter (where status = 'pending')::int,
    count(*) filter (where status = 'confirmed')::int,
    count(*) filter (where status = 'rejected')::int,
    coalesce(sum(amount) filter (where status = 'confirmed'), 0),
    count(*) filter (where status = 'confirmed')::int,
    (count(*) filter (where status = 'confirmed') * 2)::numeric(12,2),
    now()
  from public.donations
  where center_id = p_center_id
    and created_at >= p_report_date::timestamptz
    and created_at < (p_report_date + 1)::timestamptz
  on conflict (center_id, report_date) do update
  set
    donation_count = excluded.donation_count,
    pending_count = excluded.pending_count,
    confirmed_count = excluded.confirmed_count,
    rejected_count = excluded.rejected_count,
    total_amount = excluded.total_amount,
    wreaths_reduced = excluded.wreaths_reduced,
    waste_reduced_kg = excluded.waste_reduced_kg,
    updated_at = now();
end;
$$;

create or replace function public.sync_donation_center_id()
returns trigger
language plpgsql
as $$
begin
  if new.center_id is null then
    select center_id into new.center_id
    from public.memorials
    where id = new.memorial_id;
  end if;

  if new.status = 'confirmed' and new.confirmed_at is null then
    new.confirmed_at = now();
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    new.reviewed_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_donation_center_id on public.donations;
create trigger trg_sync_donation_center_id
before insert or update on public.donations
for each row execute function public.sync_donation_center_id();

create or replace function public.refresh_center_daily_stats_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_center_daily_stats(old.center_id, old.created_at::date);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_center_daily_stats(new.center_id, new.created_at::date);
  end if;

  return null;
end;
$$;

drop trigger if exists trg_refresh_center_daily_stats on public.donations;
create trigger trg_refresh_center_daily_stats
after insert or update or delete on public.donations
for each row execute function public.refresh_center_daily_stats_trigger();

insert into public.center_daily_stats (
  center_id,
  report_date,
  donation_count,
  pending_count,
  confirmed_count,
  rejected_count,
  total_amount,
  wreaths_reduced,
  waste_reduced_kg,
  updated_at
)
select
  center_id,
  created_at::date,
  count(*)::int,
  count(*) filter (where status = 'pending')::int,
  count(*) filter (where status = 'confirmed')::int,
  count(*) filter (where status = 'rejected')::int,
  coalesce(sum(amount) filter (where status = 'confirmed'), 0),
  count(*) filter (where status = 'confirmed')::int,
  (count(*) filter (where status = 'confirmed') * 2)::numeric(12,2),
  now()
from public.donations
where center_id is not null
group by center_id, created_at::date
on conflict (center_id, report_date) do update
set
  donation_count = excluded.donation_count,
  pending_count = excluded.pending_count,
  confirmed_count = excluded.confirmed_count,
  rejected_count = excluded.rejected_count,
  total_amount = excluded.total_amount,
  wreaths_reduced = excluded.wreaths_reduced,
  waste_reduced_kg = excluded.waste_reduced_kg,
  updated_at = now();

create or replace view public.center_report_totals as
select
  c.id as center_id,
  c.name as center_name,
  c.province,
  c.amphoe,
  c.status as center_status,
  coalesce(sum(s.donation_count), 0)::int as donation_count,
  coalesce(sum(s.pending_count), 0)::int as pending_count,
  coalesce(sum(s.confirmed_count), 0)::int as confirmed_count,
  coalesce(sum(s.rejected_count), 0)::int as rejected_count,
  coalesce(sum(s.total_amount), 0)::numeric(14,2) as total_amount,
  coalesce(sum(s.wreaths_reduced), 0)::int as wreaths_reduced,
  coalesce(sum(s.waste_reduced_kg), 0)::numeric(12,2) as waste_reduced_kg,
  max(s.updated_at) as updated_at
from public.centers c
left join public.center_daily_stats s on s.center_id = c.id
group by c.id, c.name, c.province, c.amphoe, c.status;

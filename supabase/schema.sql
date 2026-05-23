-- หรีดร่วมบุญ Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- MEMORIALS TABLE
-- =====================
create table if not exists public.memorials (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  birth_date date not null,
  death_date date not null,
  age integer not null,
  photo_url text,
  ceremony_date date not null,
  ceremony_time text not null,        -- e.g. "16.00"
  ceremony_location text not null,
  ceremony_hall text,
  bank_name text not null,
  bank_account_number text not null,
  bank_account_name text not null,
  bank_account_image_url text,        -- QR code image
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================
-- DONATIONS TABLE
-- =====================
create type public.donation_status as enum ('pending', 'confirmed', 'rejected');

create table if not exists public.donations (
  id uuid primary key default uuid_generate_v4(),
  memorial_id uuid not null references public.memorials(id) on delete cascade,
  donor_name text not null,
  amount numeric(10, 2) not null default 0,
  message text,
  slip_url text,
  status public.donation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists donations_memorial_id_idx on public.donations (memorial_id);
create index if not exists donations_status_idx on public.donations (status);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table public.memorials enable row level security;
alter table public.donations enable row level security;

-- Anyone can read active memorials
create policy "Public read active memorials"
  on public.memorials for select
  using (is_active = true);

-- Anyone can read confirmed donations
create policy "Public read confirmed donations"
  on public.donations for select
  using (status = 'confirmed');

-- Anyone can insert a pending donation
create policy "Public insert donations"
  on public.donations for insert
  with check (status = 'pending');

-- =====================
-- STORAGE BUCKET
-- =====================
insert into storage.buckets (id, name, public)
  values ('donations', 'donations', true)
  on conflict (id) do nothing;

-- Allow public uploads to donations bucket
create policy "Allow public uploads"
  on storage.objects for insert
  with check (bucket_id = 'donations');

create policy "Allow public reads"
  on storage.objects for select
  using (bucket_id = 'donations');

-- =====================
-- SEED DEMO DATA
-- =====================
insert into public.memorials (
  slug, name, birth_date, death_date, age,
  ceremony_date, ceremony_time, ceremony_location, ceremony_hall,
  bank_name, bank_account_number, bank_account_name,
  is_active
) values (
  'somsri-2568',
  'คุณแม่สมศรี จันทร์เพ็ญ',
  '1942-08-15',
  '2025-05-25',
  82,
  '2025-06-08',
  '16.00',
  'วัดเทพศิรินทราวาส',
  'ศาลา 10',
  'ธนาคารไทยพาณิชย์',
  '123-4-56789-0',
  'นายสมชาย จันทร์เพ็ญ',
  true
) on conflict (slug) do nothing;

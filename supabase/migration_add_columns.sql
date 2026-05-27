-- Migration: Add missing columns to memorials table
-- Run this in Supabase SQL Editor

-- Centers table (required before adding center_id FK)
create table if not exists public.centers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  center_code text unique not null,
  province text,
  amphoe text,
  tambon text,
  municipality text,
  manager_name text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Add missing columns to memorials
alter table public.memorials
  add column if not exists event_code text unique,
  add column if not exists center_id uuid references public.centers(id),
  add column if not exists funeral_status text not null default 'active',
  add column if not exists host_name text,
  add column if not exists host_phone text,
  add column if not exists host_code text unique,
  add column if not exists host_relationship text,
  add column if not exists prayer_date date,
  add column if not exists prayer_location text,
  add column if not exists host_bank_name text,
  add column if not exists host_bank_account_number text,
  add column if not exists host_bank_account_name text;

-- Add missing columns to donations
alter table public.donations
  add column if not exists donor_title text,
  add column if not exists nameplate_status text not null default 'pending';

-- Nameplates table
create table if not exists public.nameplates (
  id uuid primary key default uuid_generate_v4(),
  donation_id uuid references public.donations(id) on delete cascade,
  memorial_id uuid references public.memorials(id) on delete cascade,
  donor_name text not null,
  donor_title text,
  message text,
  pdf_url text,
  print_status text not null default 'pending',
  board_status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Backfill event_code for existing rows that have none
update public.memorials
  set event_code = upper(substring(id::text, 1, 8))
  where event_code is null;

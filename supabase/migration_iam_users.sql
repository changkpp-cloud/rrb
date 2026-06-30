-- IAM / RBAC foundation for center and admin users.
-- Run this in Supabase SQL editor before using the new user approval flow.

create extension if not exists "uuid-ossp";

do $$ begin
  create type public.app_user_role as enum ('super_admin', 'center_manager', 'center_staff', 'center_viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_user_status as enum ('pending', 'active', 'suspended', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.auth_provider as enum ('password', 'email', 'line', 'facebook', 'google');
exception when duplicate_object then null;
end $$;

create table if not exists public.app_users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  display_name text not null,
  phone text,
  auth_provider public.auth_provider not null default 'password',
  provider_user_id text,
  password_hash text,
  global_role public.app_user_role,
  status public.app_user_status not null default 'pending',
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.center_memberships (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid not null references public.centers(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role public.app_user_role not null default 'center_staff',
  status public.app_user_status not null default 'active',
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(center_id, user_id)
);

create table if not exists public.center_user_requests (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid not null references public.centers(id) on delete cascade,
  email text,
  display_name text not null,
  phone text,
  requested_role public.app_user_role not null default 'center_staff',
  auth_provider public.auth_provider not null default 'password',
  provider_user_id text,
  password_hash text,
  status public.app_user_status not null default 'pending',
  approved_user_id uuid references public.app_users(id) on delete set null,
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.app_user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_users_email_idx on public.app_users (lower(email));
create index if not exists center_memberships_center_idx on public.center_memberships (center_id);
create index if not exists center_memberships_user_idx on public.center_memberships (user_id);
create index if not exists center_user_requests_status_idx on public.center_user_requests (status, center_id);
create index if not exists app_user_sessions_user_idx on public.app_user_sessions (user_id, expires_at);

alter table public.audit_logs add column if not exists actor_user_id uuid references public.app_users(id) on delete set null;
alter table public.audit_logs add column if not exists actor_role text;
alter table public.audit_logs add column if not exists center_id uuid references public.centers(id) on delete set null;

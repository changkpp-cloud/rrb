-- Phone-only center user access.
-- New center access accounts use phone + password/code. Email is no longer required
-- for center user requests, but the legacy column remains nullable for old data.

alter table public.center_user_requests
  alter column email drop not null;

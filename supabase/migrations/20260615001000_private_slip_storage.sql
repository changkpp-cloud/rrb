-- Store donation slips as private evidence. The app serves short-lived signed
-- URLs only to the center that owns the memorial or the host with host_code.

update storage.buckets
set public = false
where id = 'donations';

drop policy if exists "Allow public reads" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;

comment on column public.donations.slip_url is
  'Private storage path for new slips. Legacy rows may contain public URLs and are served only through authorized app routes.';

create table public.image_migration_log (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  old_path text not null,
  new_path text not null,
  old_size bigint,
  new_size bigint,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);
grant select, insert on public.image_migration_log to authenticated;
grant all on public.image_migration_log to service_role;
alter table public.image_migration_log enable row level security;
create policy "Admins manage image migration log"
  on public.image_migration_log for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
create index idx_image_migration_log_created on public.image_migration_log(created_at desc);
create index idx_image_migration_log_status on public.image_migration_log(status);
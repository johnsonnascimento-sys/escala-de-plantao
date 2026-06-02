create table if not exists public.escala_db_healthchecks (
  id text primary key,
  test_source text not null default 'manual',
  status text not null check (status in ('ok', 'fail')),
  message text not null,
  details text not null default '',
  duration_ms integer,
  tested_at timestamptz not null default now(),
  tested_by_user_id uuid,
  tested_by_email text,
  table_name text not null default 'escala_app_state',
  row_id text not null default 'current'
);

alter table public.escala_db_healthchecks enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert on public.escala_db_healthchecks to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'escala_db_healthchecks'
      and policyname = 'healthcheck log read access'
  ) then
    create policy "healthcheck log read access"
    on public.escala_db_healthchecks
    for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'escala_db_healthchecks'
      and policyname = 'healthcheck log insert access'
  ) then
    create policy "healthcheck log insert access"
    on public.escala_db_healthchecks
    for insert
    to authenticated
    with check (true);
  end if;
end $$;

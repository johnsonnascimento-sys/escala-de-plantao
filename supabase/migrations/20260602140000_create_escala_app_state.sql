create table if not exists public.escala_app_state (
  id text primary key check (id = 'current'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.escala_app_state enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.escala_app_state to anon, authenticated, service_role;
grant insert, update on public.escala_app_state to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'escala_app_state'
      and policyname = 'public read access'
  ) then
    create policy "public read access"
    on public.escala_app_state
    for select
    to anon
    using (id = 'current');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'escala_app_state'
      and policyname = 'public insert access'
  ) then
    create policy "public insert access"
    on public.escala_app_state
    for insert
    to authenticated
    with check (id = 'current');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'escala_app_state'
      and policyname = 'public update access'
  ) then
    create policy "public update access"
    on public.escala_app_state
    for update
    to authenticated
    using (id = 'current')
    with check (id = 'current');
  end if;
end $$;

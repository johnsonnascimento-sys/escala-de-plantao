create table if not exists public.shift_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  mode text not null check (mode in ('replace', 'create')),
  judge_name text not null,
  server_name text not null,
  "desc" text not null,
  tipo text not null check (tipo in ('SAB', 'DOM')),
  notes text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shift_overrides_date on public.shift_overrides (date);

create or replace function public.handle_shift_override_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shift_overrides_updated_at on public.shift_overrides;
create trigger trg_shift_overrides_updated_at
before update on public.shift_overrides
for each row
execute function public.handle_shift_override_updated_at();

alter table public.shift_overrides enable row level security;

drop policy if exists "Public users can read overrides" on public.shift_overrides;
drop policy if exists "Authenticated users can insert overrides" on public.shift_overrides;
drop policy if exists "Authenticated users can update overrides" on public.shift_overrides;

create policy "Public users can read overrides"
on public.shift_overrides
for select
to public
using (true);

create policy "Authenticated users can insert overrides"
on public.shift_overrides
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Authenticated users can update overrides"
on public.shift_overrides
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_admin_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.handle_admin_users_updated_at();

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = coalesce(p_user_id, auth.uid())
      and active = true
  );
$$;

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
drop policy if exists "Admins can insert admin users" on public.admin_users;
drop policy if exists "Admins can update admin users" on public.admin_users;
drop policy if exists "Admins can delete admin users" on public.admin_users;

create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins can insert admin users"
on public.admin_users
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "Admins can update admin users"
on public.admin_users
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can delete admin users"
on public.admin_users
for delete
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.admin_create_user(p_email text, p_password text, p_display_name text default null)
returns public.admin_users
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  new_user_id uuid := gen_random_uuid();
  new_identity_id uuid := gen_random_uuid();
  new_row public.admin_users;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem criar usuarios.';
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(p_email) and deleted_at is null) then
    raise exception 'Ja existe um usuario com este e-mail.';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    '', '', '', '',
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('display_name', coalesce(p_display_name, split_part(lower(p_email), '@', 1))),
    now(), now(),
    false, false
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    new_identity_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', lower(p_email), 'email_verified', true),
    'email',
    lower(p_email),
    now(), now(), now()
  );

  insert into public.admin_users (id, email, display_name, active)
  values (new_user_id, lower(p_email), coalesce(p_display_name, split_part(lower(p_email), '@', 1)), true)
  returning * into new_row;

  return new_row;
end;
$$;

create or replace function public.admin_update_user(p_user_id uuid, p_email text, p_display_name text, p_active boolean)
returns public.admin_users
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  updated_row public.admin_users;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem editar usuarios.';
  end if;

  update auth.users
  set email = lower(p_email),
      raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{display_name}', to_jsonb(coalesce(p_display_name, '')), true),
      updated_at = now()
  where id = p_user_id;

  update auth.identities
  set provider_id = lower(p_email),
      identity_data = jsonb_set(jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(lower(p_email)), true), '{email_verified}', 'true'::jsonb, true),
      updated_at = now()
  where user_id = p_user_id
    and provider = 'email';

  update public.admin_users
  set email = lower(p_email),
      display_name = p_display_name,
      active = p_active,
      updated_at = now()
  where id = p_user_id
  returning * into updated_row;

  return updated_row;
end;
$$;

create or replace function public.admin_update_password(p_user_id uuid, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem redefinir senhas.';
  end if;

  update auth.users
  set encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now(),
      reauthentication_token = '',
      recovery_token = ''
  where id = p_user_id
    and deleted_at is null;

  return found;
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas administradores podem excluir usuarios.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Nao e permitido excluir o proprio usuario administrador.';
  end if;

  delete from public.admin_users where id = p_user_id;
  delete from auth.identities where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  return true;
end;
$$;

create table if not exists public.schedule_servers (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  jan_only boolean not null default false,
  ferias jsonb not null default '[]'::jsonb,
  impedimentos jsonb not null default '[]'::jsonb,
  indisponibilidades_plantao jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_schedule_servers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_schedule_servers_updated_at on public.schedule_servers;
create trigger trg_schedule_servers_updated_at
before update on public.schedule_servers
for each row
execute function public.handle_schedule_servers_updated_at();

alter table public.schedule_servers enable row level security;

drop policy if exists "Public users can read servers" on public.schedule_servers;
drop policy if exists "Authenticated admins can insert servers" on public.schedule_servers;
drop policy if exists "Authenticated admins can update servers" on public.schedule_servers;
drop policy if exists "Authenticated admins can delete servers" on public.schedule_servers;

create policy "Public users can read servers"
on public.schedule_servers
for select
to public
using (true);

create policy "Authenticated admins can insert servers"
on public.schedule_servers
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create policy "Authenticated admins can update servers"
on public.schedule_servers
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Authenticated admins can delete servers"
on public.schedule_servers
for delete
to authenticated
using (public.is_admin(auth.uid()));

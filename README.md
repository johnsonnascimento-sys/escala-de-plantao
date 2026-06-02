# Escala de Plantao

Aplicacao local em React para visualizar e ajustar a escala de plantao.

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Persistencia

- Servidores e overrides sao salvos no `localStorage` e, quando configurado, sincronizados com o Supabase.
- Para compartilhar os dados entre navegadores, configure as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- O banco precisa da tabela `escala_app_state` com coluna `payload` em `jsonb`.

```sql
create table if not exists public.escala_app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.escala_app_state enable row level security;

create policy "public read access"
on public.escala_app_state
for select
to anon
using (true);

create policy "public insert access"
on public.escala_app_state
for insert
to anon
with check (true);

create policy "public update access"
on public.escala_app_state
for update
to anon
using (true)
with check (true);
```

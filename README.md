# Escala de Plantao

Aplicacao local em React para visualizar e ajustar a escala de plantao.

## Supabase

Este projeto usa o Supabase como backend opcional de persistencia compartilhada. O contrato atual assume uma unica linha na tabela `public.escala_app_state`, com `id = 'current'`, contendo o estado consolidado em `payload`.

### Configuracao recomendada do projeto

- `Region`: `South America (São Paulo)`
- `Postgres Type`: `Postgres`
- `Enable Data API`: ligado
- `Automatically expose new tables`: desligado
- `Enable automatic RLS`: ligado

### Variaveis de ambiente

Crie um arquivo `.env.local` com:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
```

Sem essas variaveis, o sistema continua funcionando apenas com `localStorage`.
Na publicacao em GitHub Pages, o app usa a configuracao publica embutida do projeto para manter a sincronizacao ativa.
Para editar a escala, e necessario ter um usuario cadastrado no Supabase Auth.

### Migração SQL

O repositório ja inclui a migracao base em `supabase/migrations/20260602140000_create_escala_app_state.sql`. Ela cria a tabela, habilita RLS e libera acesso minimo para a linha `current`.

Se quiser aplicar manualmente no SQL Editor do Supabase, use:

```sql
create table if not exists public.escala_app_state (
  id text primary key check (id = 'current'),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.escala_app_state enable row level security;

grant usage on schema public to anon, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.escala_app_state to anon, authenticated, service_role;
grant insert, update on public.escala_app_state to authenticated, service_role;

create policy "public read access"
on public.escala_app_state
for select
to anon
using (id = 'current');

create policy "public insert access"
on public.escala_app_state
for insert
to authenticated
with check (id = 'current');

create policy "public update access"
on public.escala_app_state
for update
to authenticated
using (id = 'current')
with check (id = 'current');
```

Crie um usuario administrador em `Authentication > Users` no painel do Supabase e use esse login no painel admin do app.

### Fluxo de uso

1. Criar o projeto no Supabase com as configuracoes acima.
2. Aplicar a migracao.
3. Colocar as variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Iniciar o app.
5. O front carrega primeiro o estado remoto; se o Supabase falhar, usa o cache local.

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

- `servers` e `overrides` sao salvos no `localStorage` e, quando o Supabase esta configurado, sincronizados com a tabela `public.escala_app_state`.
- A sincronizacao usa sempre a linha `current`.
- Se o Supabase nao estiver disponivel, o app continua operando localmente.

## Healthcheck semanal do banco

O repositorio inclui um healthcheck semanal do Supabase via GitHub Actions em [`.github/workflows/supabase-healthcheck.yml`](./.github/workflows/supabase-healthcheck.yml).

- Frequencia: toda segunda-feira, 03:00 UTC.
- O teste usa as mesmas variaveis do deploy: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- A verificacao faz leitura da linha `current` em `public.escala_app_state` e falha se a tabela, a permissao de leitura ou o payload estiverem inconsistentes.
- Se o repositório tiver o segredo opcional `SUPABASE_SERVICE_ROLE_KEY`, o workflow semanal tambem grava o resultado em `public.escala_db_healthchecks`, que e a mesma fonte lida pelo painel admin.
- Se o painel mostrar aviso de migration pendente, aplique `supabase/migrations/20260602190000_create_escala_db_healthchecks.sql` no projeto Supabase remoto e recarregue a pagina.

Para executar manualmente:

```bash
npm run healthcheck:supabase
```

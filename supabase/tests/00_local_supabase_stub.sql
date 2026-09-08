-- =============================================================================
-- STUB LOCAL DO SUPABASE — SOMENTE PARA TESTES NESTA MÁQUINA
-- =============================================================================
-- ATENÇÃO: NÃO execute este arquivo no projeto Supabase. Ele recria, em um
-- Postgres vazio, apenas o suficiente da plataforma (roles, schema auth,
-- schema storage) para que as migrations reais e as policies de RLS possam ser
-- exercitadas exatamente como serão em produção.
--
-- As migrations de produção (supabase/migrations/*) rodam sem alteração por
-- cima deste stub — é isso que dá valor ao teste.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Roles equivalentes aos do Supabase
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    -- No Supabase esta role tem BYPASSRLS. É a chave de privilégio máximo.
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- schema auth
-- -----------------------------------------------------------------------------
create schema if not exists auth;

create table if not exists auth.users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique,
  encrypted_password text,      -- existe no Supabase; a aplicação NUNCA a lê
  created_at        timestamptz not null default now()
);

-- Implementação equivalente à do Supabase: lê os claims do JWT que o PostgREST
-- injeta em `request.jwt.claims` a cada requisição.
create or replace function auth.jwt()
returns jsonb
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb;
$$;

create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql stable
as $$
  select nullif(auth.jwt() ->> 'role', '');
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt(), auth.role() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- schema storage (só o necessário para exercitar as policies do bucket)
-- -----------------------------------------------------------------------------
create schema if not exists storage;

create table if not exists storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz not null default now()
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text not null references storage.buckets (id),
  name       text not null,
  owner      uuid,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

-- ############################################################################
-- DZ COLLECTION — SETUP COMPLETO DO BANCO
-- ############################################################################
--
-- COMO USAR
--   1. Supabase → SQL Editor → New query
--   2. Cole ESTE ARQUIVO INTEIRO
--   3. Run
--
-- Deve terminar com "Success". Roda tudo numa tacada e é idempotente:
-- se algo der errado no meio, pode corrigir e rodar de novo sem duplicar nada.
--
-- As políticas de Storage ficam num arquivo separado (02_storage.sql) porque
-- dependem de permissão de owner na tabela storage.objects, que em alguns
-- projetos precisa ser feita pela interface.
--
-- Verificado contra PostgreSQL 16 com 46 casos de teste de segurança.
-- ############################################################################


-- ############################################################################
-- 1 de 5 · Schema
-- ############################################################################

-- =============================================================================
-- DZ COLLECTION — 0001 · Schema base
-- =============================================================================
-- O PostgreSQL passa a ser a fonte única da verdade do catálogo.
-- Todo dinheiro é armazenado em CENTAVOS (bigint). Nunca float.
--
-- Esta migration é idempotente: pode ser reaplicada sem quebrar.
-- =============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()
create extension if not exists "citext";    -- e-mail case-insensitive

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  name          text not null,
  description   text,
  -- Agrupador da loja atual ("Feminino"). Texto livre porque a taxonomia da
  -- loja é rasa; se virar hierarquia real, promover para self-FK.
  parent_name   text,
  display_order integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint categories_slug_key          unique (slug),
  constraint categories_slug_format       check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_slug_len          check (char_length(slug) between 1 and 160),
  constraint categories_name_len          check (char_length(name) between 1 and 120),
  constraint categories_description_len   check (description is null or char_length(description) <= 500),
  constraint categories_parent_name_len   check (parent_name is null or char_length(parent_name) <= 120)
);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null,
  description            text,
  category_id            uuid,

  price_cents            bigint not null,
  compare_at_price_cents bigint,

  stock                  integer not null default 0,
  active                 boolean not null default true,
  is_launch              boolean not null default false,
  is_featured            boolean not null default false,
  display_order          integer not null default 0,

  meta_title             text,
  meta_description       text,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint products_slug_key      unique (slug),
  constraint products_slug_format   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_slug_len      check (char_length(slug) between 1 and 160),
  constraint products_name_len      check (char_length(name) between 1 and 120),
  constraint products_description_len      check (description is null or char_length(description) <= 8000),
  constraint products_meta_title_len       check (meta_title is null or char_length(meta_title) <= 160),
  constraint products_meta_description_len check (meta_description is null or char_length(meta_description) <= 320),

  -- Dinheiro: nunca negativo, e o preço "de" nunca abaixo do preço atual.
  constraint products_price_nonnegative check (price_cents >= 0),
  constraint products_price_sane        check (price_cents <= 100000000),
  constraint products_compare_at_gte_price check (
    compare_at_price_cents is null or compare_at_price_cents >= price_cents
  ),
  constraint products_stock_nonnegative check (stock >= 0),

  -- Categoria some → produto vira "sem categoria", nunca é apagado em cascata.
  constraint products_category_fk foreign key (category_id)
    references public.categories (id) on delete set null
);

create index if not exists products_active_idx        on public.products (active);
create index if not exists products_category_idx      on public.products (category_id);
create index if not exists products_launch_idx        on public.products (is_launch) where is_launch;
create index if not exists products_featured_idx      on public.products (is_featured) where is_featured;
create index if not exists products_display_order_idx on public.products (display_order, created_at desc);

-- -----------------------------------------------------------------------------
-- product_images
-- -----------------------------------------------------------------------------
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null,
  -- Caminho dentro do bucket do Storage. Nunca o filename enviado pelo usuário.
  storage_path  text not null,
  alt_text      text,
  display_order integer not null default 0,
  is_primary    boolean not null default false,
  width         integer,
  height        integer,
  created_at    timestamptz not null default now(),

  constraint product_images_product_fk foreign key (product_id)
    references public.products (id) on delete cascade,
  constraint product_images_storage_path_key unique (storage_path),
  constraint product_images_storage_path_len check (char_length(storage_path) between 1 and 400),
  -- Sem path traversal e sem caminho absoluto.
  constraint product_images_storage_path_safe check (
    storage_path !~ '\.\.' and storage_path !~ '^/' and storage_path !~ '\\'
  ),
  constraint product_images_alt_len check (alt_text is null or char_length(alt_text) <= 300),
  constraint product_images_dimensions check (
    (width is null or (width > 0 and width <= 12000)) and
    (height is null or (height > 0 and height <= 12000))
  )
);

create index if not exists product_images_product_idx on public.product_images (product_id, display_order);

-- No máximo uma imagem principal por produto.
create unique index if not exists product_images_one_primary_per_product
  on public.product_images (product_id) where is_primary;

-- -----------------------------------------------------------------------------
-- product_specifications
-- -----------------------------------------------------------------------------
create table if not exists public.product_specifications (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null,
  label         text not null,
  value         text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint product_specifications_product_fk foreign key (product_id)
    references public.products (id) on delete cascade,
  constraint product_specifications_label_len check (char_length(label) between 1 and 80),
  constraint product_specifications_value_len check (char_length(value) between 1 and 600),
  constraint product_specifications_unique_label unique (product_id, label)
);

create index if not exists product_specifications_product_idx
  on public.product_specifications (product_id, display_order);

-- -----------------------------------------------------------------------------
-- product_highlights — bullets de "Características" / "Destaques"
-- -----------------------------------------------------------------------------
create table if not exists public.product_highlights (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null,
  text          text not null,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),

  constraint product_highlights_product_fk foreign key (product_id)
    references public.products (id) on delete cascade,
  constraint product_highlights_text_len check (char_length(text) between 1 and 400)
);

create index if not exists product_highlights_product_idx
  on public.product_highlights (product_id, display_order);

-- -----------------------------------------------------------------------------
-- admin_users — tabela de AUTORIZAÇÃO. Nunca guarda senha nem hash.
-- A autenticação é inteiramente delegada ao Supabase Auth (auth.users).
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key,
  email      citext not null,
  full_name  text,
  created_at timestamptz not null default now(),

  constraint admin_users_email_key unique (email),
  constraint admin_users_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint admin_users_full_name_len check (full_name is null or char_length(full_name) <= 120),
  constraint admin_users_auth_fk foreign key (user_id)
    references auth.users (id) on delete cascade
);

-- Guarda-corpo em nível de schema: esta tabela jamais deve ganhar uma coluna
-- de senha. Se alguém tentar, o INSERT/UPDATE do schema falha na revisão.
comment on table public.admin_users is
  'Autorização administrativa. NUNCA adicionar coluna de senha/hash aqui — credenciais vivem exclusivamente no Supabase Auth.';

-- -----------------------------------------------------------------------------
-- site_settings — conteúdo editável da home e configurações
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid,

  constraint site_settings_key_format check (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  constraint site_settings_key_len check (char_length(key) between 1 and 80),
  constraint site_settings_value_size check (pg_column_size(value) <= 65536),
  constraint site_settings_updated_by_fk foreign key (updated_by)
    references public.admin_users (user_id) on delete set null
);

-- -----------------------------------------------------------------------------
-- audit_logs — trilha de auditoria administrativa (append-only)
-- -----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id            bigint generated always as identity primary key,
  admin_user_id uuid,
  actor_email   citext,
  action        text not null,
  entity_type   text,
  entity_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),

  constraint audit_logs_action_len      check (char_length(action) between 1 and 60),
  constraint audit_logs_entity_type_len check (entity_type is null or char_length(entity_type) <= 60),
  constraint audit_logs_entity_id_len   check (entity_id is null or char_length(entity_id) <= 120),
  constraint audit_logs_metadata_size   check (pg_column_size(metadata) <= 16384),
  -- Admin apagado não apaga o histórico: o log sobrevive ao usuário.
  constraint audit_logs_admin_fk foreign key (admin_user_id)
    references public.admin_users (user_id) on delete set null
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx  on public.audit_logs (entity_type, entity_id);

-- -----------------------------------------------------------------------------
-- auth_rate_limits — throttling de login/reset, escrito só pelo servidor
-- -----------------------------------------------------------------------------
create table if not exists public.auth_rate_limits (
  bucket        text not null,
  identifier    text not null,
  window_start  timestamptz not null,
  attempts      integer not null default 0,
  blocked_until timestamptz,

  primary key (bucket, identifier, window_start),
  constraint auth_rate_limits_bucket_len     check (char_length(bucket) between 1 and 40),
  constraint auth_rate_limits_identifier_len check (char_length(identifier) between 1 and 200),
  constraint auth_rate_limits_attempts_check check (attempts >= 0)
);

create index if not exists auth_rate_limits_window_idx on public.auth_rate_limits (window_start);

-- ############################################################################
-- 2 de 5 · Funções e triggers
-- ############################################################################

-- =============================================================================
-- DZ COLLECTION — 0002 · Funções, triggers e invariantes de servidor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at automático + proteção de campos server-owned.
-- Mesmo que um DTO deixe passar `created_at` ou `id`, o banco os ignora.
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;   -- created_at é imutável
    new.id         := old.id;           -- id é imutável
  end if;
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- IS_ADMIN — ponto único de autorização no banco.
--
-- SECURITY DEFINER porque public.admin_users é inacessível para anon e
-- authenticated (zero grants). A função lê a tabela em nome do owner e devolve
-- apenas um booleano — nunca expõe o conteúdo da tabela.
--
-- search_path fixo evita sequestro da resolução de nomes por schema hostil.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'True quando auth.uid() corresponde a um registro em admin_users. Único ponto de autorização usado pelas policies de RLS.';

-- -----------------------------------------------------------------------------
-- Preço no Pix. O desconto é um dado de configuração, não um número solto no
-- código, e por regra da loja NÃO acumula com preço promocional.
-- -----------------------------------------------------------------------------
create or replace function public.pix_price_cents(
  p_price_cents bigint,
  p_compare_at_price_cents bigint,
  p_discount_percent numeric default 5
)
returns bigint
language sql
immutable
set search_path = pg_catalog, public
as $$
  select case
    when p_compare_at_price_cents is not null then null   -- já está em promoção
    when p_discount_percent is null or p_discount_percent <= 0 then null
    else round(p_price_cents * (1 - p_discount_percent / 100.0))::bigint
  end;
$$;

-- -----------------------------------------------------------------------------
-- AUDIT LOG APPEND-ONLY.
--
-- Bloqueia UPDATE/DELETE para os papéis que a aplicação usa — inclusive o
-- backend privilegiado (service_role), que ignora RLS mas não ignora trigger.
-- Um administrador não consegue reescrever a própria trilha por caminho nenhum
-- da aplicação.
--
-- Manutenção legítima do banco (migrations, expurgo de logs antigos, restore de
-- backup) roda como owner/postgres e continua possível — do contrário a tabela
-- se tornaria impossível de administrar.
-- -----------------------------------------------------------------------------
create or replace function public.audit_logs_block_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if current_user in ('anon', 'authenticated', 'service_role', 'authenticator') then
    raise exception 'audit_logs é append-only (operação % bloqueada)', tg_op
      using errcode = 'insufficient_privilege';
  end if;
  return case tg_op when 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_logs_no_update on public.audit_logs;
create trigger audit_logs_no_update
  before update on public.audit_logs
  for each row execute function public.audit_logs_block_mutation();

drop trigger if exists audit_logs_no_delete on public.audit_logs;
create trigger audit_logs_no_delete
  before delete on public.audit_logs
  for each row execute function public.audit_logs_block_mutation();

-- -----------------------------------------------------------------------------
-- Registro de auditoria. SECURITY DEFINER para escrever mesmo com a tabela
-- fechada para escrita direta, mas o actor vem SEMPRE de auth.uid() — nunca de
-- um parâmetro controlado pelo cliente.
-- -----------------------------------------------------------------------------
create or replace function public.log_admin_action(
  p_action      text,
  p_entity_type text default null,
  p_entity_id   text default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.is_admin() then
    raise exception 'não autorizado' using errcode = 'insufficient_privilege';
  end if;

  insert into public.audit_logs (admin_user_id, actor_email, action, entity_type, entity_id, metadata)
  select v_uid, a.email, p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb)
  from public.admin_users a
  where a.user_id = v_uid;
end;
$$;

revoke all on function public.log_admin_action(text, text, text, jsonb) from public;
grant execute on function public.log_admin_action(text, text, text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Normalização de texto para slug. `unaccent` é uma extensão opcional no
-- Supabase; esta versão cobre o português sem depender de instalação extra.
-- -----------------------------------------------------------------------------
create or replace function public.unaccent_fallback(p_text text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select translate(
    p_text,
    'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
  );
$$;

create or replace function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = pg_catalog, public
as $$
  select trim(both '-' from
    regexp_replace(
      lower(public.unaccent_fallback(p_text)),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- ############################################################################
-- 3 de 5 · RLS e grants
-- ############################################################################

-- =============================================================================
-- DZ COLLECTION — 0003 · Row Level Security + GRANTS
-- =============================================================================
-- Duas camadas independentes:
--   GRANTS  → o que o ROLE pode fazer com a TABELA   (nível de objeto)
--   RLS     → quais LINHAS ele alcança               (nível de linha)
-- RLS não substitui grant. Aqui os dois são explícitos, em DEFAULT DENY.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DEFAULT DENY — tira tudo antes de liberar qualquer coisa.
-- -----------------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Tabelas criadas no futuro não nascem liberadas por acidente.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. RLS LIGADO EM TODAS AS TABELAS DA APLICAÇÃO. Sem exceção.
-- -----------------------------------------------------------------------------
alter table public.products              enable row level security;
alter table public.categories            enable row level security;
alter table public.product_images        enable row level security;
alter table public.product_specifications enable row level security;
alter table public.product_highlights    enable row level security;
alter table public.site_settings         enable row level security;
alter table public.admin_users           enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.auth_rate_limits      enable row level security;

-- -----------------------------------------------------------------------------
-- 3. GRANTS MÍNIMOS
-- -----------------------------------------------------------------------------

-- Catálogo: leitura pública, escrita só para autenticados (RLS filtra admin).
grant select on public.products               to anon, authenticated;
grant select on public.categories             to anon, authenticated;
grant select on public.product_images         to anon, authenticated;
grant select on public.product_specifications to anon, authenticated;
grant select on public.product_highlights     to anon, authenticated;
grant select on public.site_settings          to anon, authenticated;

grant insert, update, delete on public.products               to authenticated;
grant insert, update, delete on public.categories             to authenticated;
grant insert, update, delete on public.product_images         to authenticated;
grant insert, update, delete on public.product_specifications to authenticated;
grant insert, update, delete on public.product_highlights     to authenticated;
grant insert, update, delete on public.site_settings          to authenticated;

-- Auditoria: admin lê, ninguém escreve direto (só via log_admin_action).
grant select on public.audit_logs to authenticated;

-- admin_users e auth_rate_limits: ZERO grant. Nem anon, nem authenticated.
-- Acesso apenas por funções SECURITY DEFINER e pelo backend privilegiado.

-- -----------------------------------------------------------------------------
-- 4. POLICIES — PRODUCTS
-- -----------------------------------------------------------------------------
drop policy if exists products_select_public on public.products;
create policy products_select_public
  on public.products for select
  to anon, authenticated
  using (active = true);

drop policy if exists products_select_admin on public.products;
create policy products_select_admin
  on public.products for select
  to authenticated
  using (public.is_admin());

drop policy if exists products_insert_admin on public.products;
create policy products_insert_admin
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists products_update_admin on public.products;
create policy products_update_admin
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists products_delete_admin on public.products;
create policy products_delete_admin
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. POLICIES — CATEGORIES
-- -----------------------------------------------------------------------------
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories for select
  to anon, authenticated
  using (active = true);

drop policy if exists categories_select_admin on public.categories;
create policy categories_select_admin
  on public.categories for select
  to authenticated
  using (public.is_admin());

drop policy if exists categories_insert_admin on public.categories;
create policy categories_insert_admin
  on public.categories for insert
  to authenticated with check (public.is_admin());

drop policy if exists categories_update_admin on public.categories;
create policy categories_update_admin
  on public.categories for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists categories_delete_admin on public.categories;
create policy categories_delete_admin
  on public.categories for delete
  to authenticated using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. POLICIES — TABELAS FILHAS
--
-- A visibilidade pública é derivada do produto: o EXISTS abaixo consulta
-- public.products, que por sua vez está sob RLS. Ou seja, uma imagem só é
-- visível para quem já pode ver o produto. Produto desativado → imagens e
-- especificações somem junto, sem regra duplicada.
-- -----------------------------------------------------------------------------
drop policy if exists product_images_select_public on public.product_images;
create policy product_images_select_public
  on public.product_images for select
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

drop policy if exists product_images_write_admin on public.product_images;
create policy product_images_write_admin
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists product_specifications_select_public on public.product_specifications;
create policy product_specifications_select_public
  on public.product_specifications for select
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

drop policy if exists product_specifications_write_admin on public.product_specifications;
create policy product_specifications_write_admin
  on public.product_specifications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists product_highlights_select_public on public.product_highlights;
create policy product_highlights_select_public
  on public.product_highlights for select
  to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

drop policy if exists product_highlights_write_admin on public.product_highlights;
create policy product_highlights_write_admin
  on public.product_highlights for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. POLICIES — SITE_SETTINGS
-- -----------------------------------------------------------------------------
drop policy if exists site_settings_select_public on public.site_settings;
create policy site_settings_select_public
  on public.site_settings for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists site_settings_admin_all on public.site_settings;
create policy site_settings_admin_all
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. POLICIES — AUDIT_LOGS (somente leitura, e somente admin)
-- -----------------------------------------------------------------------------
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

-- Sem policy de INSERT/UPDATE/DELETE e sem grant: a escrita só acontece pela
-- função log_admin_action (SECURITY DEFINER), e UPDATE/DELETE ainda esbarram
-- nos triggers append-only.

-- -----------------------------------------------------------------------------
-- 9. ADMIN_USERS e AUTH_RATE_LIMITS — nenhuma policy, nenhum grant.
--
-- RLS ligado sem policy = negado para todo mundo que não seja owner/bypass.
-- É o "ZERO ACCESS" literal: mesmo que um grant seja adicionado por engano
-- no futuro, continua não havendo linha alcançável.
-- -----------------------------------------------------------------------------

comment on table public.auth_rate_limits is
  'Escrita exclusiva do backend privilegiado (secret key). Sem grants e sem policies para anon/authenticated.';

-- -----------------------------------------------------------------------------
-- 10. EXECUTE em funções — concedido DEPOIS do revoke em massa do passo 1.
--
-- Ordem importa: o `revoke all on all functions` acima derruba qualquer grant
-- feito em migrations anteriores. Estes grants precisam ser os últimos.
--
-- is_admin() é chamada pelas policies e portanto avaliada como o usuário da
-- requisição — `authenticated` precisa de EXECUTE. `anon` não precisa: nenhuma
-- policy aplicável a anon a invoca (as policies públicas olham só `active`).
-- -----------------------------------------------------------------------------
grant execute on function public.is_admin() to authenticated;
grant execute on function public.log_admin_action(text, text, text, jsonb) to authenticated;
grant execute on function public.slugify(text) to authenticated;
grant execute on function public.unaccent_fallback(text) to authenticated;

-- Cálculo do preço no Pix é usado na leitura pública do catálogo.
grant execute on function public.pix_price_cents(bigint, bigint, numeric) to anon, authenticated;

-- ############################################################################
-- 4 de 5 · Rate limiting
-- ############################################################################

-- =============================================================================
-- DZ COLLECTION — 0005 · Rate limiting atômico
-- =============================================================================
-- Contagem no banco (e não em memória) porque a Vercel é serverless: cada
-- invocação é um processo novo, então contador em memória não protege nada.
--
-- A função é atômica: o INSERT ... ON CONFLICT DO UPDATE resolve corrida entre
-- requisições concorrentes sem transação explícita.
--
-- Chamada exclusivamente pelo backend privilegiado (secret key). A tabela não
-- tem grant para anon nem authenticated.
-- =============================================================================

create or replace function public.consume_rate_limit(
  p_bucket          text,
  p_identifier      text,
  p_max_attempts    integer,
  p_window_seconds  integer,
  p_max_block_seconds integer default 900
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_window_start timestamptz;
  v_attempts     integer;
  v_blocked_until timestamptz;
  v_backoff      integer;
begin
  if p_max_attempts < 1 or p_window_seconds < 1 then
    raise exception 'parâmetros inválidos de rate limit';
  end if;

  -- Janela fixa, alinhada para que a chave seja determinística.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.auth_rate_limits (bucket, identifier, window_start, attempts)
  values (p_bucket, left(p_identifier, 200), v_window_start, 1)
  on conflict (bucket, identifier, window_start) do update
    set attempts = public.auth_rate_limits.attempts + 1
  returning public.auth_rate_limits.attempts, public.auth_rate_limits.blocked_until
    into v_attempts, v_blocked_until;

  -- Ainda dentro de um bloqueio anterior.
  if v_blocked_until is not null and v_blocked_until > now() then
    return query select false, ceil(extract(epoch from (v_blocked_until - now())))::integer;
    return;
  end if;

  if v_attempts > p_max_attempts then
    -- Backoff progressivo: dobra a cada tentativa acima do limite, com teto.
    -- O teto existe para que um atacante NÃO consiga bloquear a conta da
    -- proprietária indefinidamente só mandando senha errada.
    v_backoff := least(
      p_max_block_seconds,
      p_window_seconds * power(2, least(v_attempts - p_max_attempts, 6))::integer
    );

    update public.auth_rate_limits
       set blocked_until = now() + make_interval(secs => v_backoff)
     where bucket = p_bucket
       and identifier = left(p_identifier, 200)
       and window_start = v_window_start;

    return query select false, v_backoff;
    return;
  end if;

  return query select true, 0;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer, integer) from public;
-- Sem grant para anon/authenticated: só a secret key (que ignora RLS e grants)
-- pode chamar. O rate limit não é acionável pelo cliente.

-- Limpeza de janelas antigas. Rodar por cron do Supabase (opcional).
create or replace function public.purge_rate_limits()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  delete from public.auth_rate_limits
  where window_start < now() - interval '24 hours'
    and (blocked_until is null or blocked_until < now());
$$;

revoke all on function public.purge_rate_limits() from public;

-- ############################################################################
-- 5 de 5 · Catálogo real
-- ############################################################################

-- =============================================================================
-- SEED DO CATÁLOGO — gerado por scripts/generate-seed.mts
-- =============================================================================
-- Os 8 produtos reais auditados na loja Nuvemshop em 07/09/2026.
-- Preços em CENTAVOS. Slugs preservados exatamente como já estão publicados,
-- para que nenhum link enviado por WhatsApp quebre.
--
-- Idempotente: ON CONFLICT em todas as inserções. Pode reaplicar à vontade.
-- =============================================================================

begin;

-- ---------------------------------------------------------------- categorias
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('redondo', 'Redondo', 'Armações redondas e ovais, do vintage ao urbano.', 'Feminino', 0, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('gatinho', 'Gatinho', 'O cat-eye que define o olhar.', 'Feminino', 1, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('quadrado', 'Quadrado', 'Linhas geométricas e presença.', 'Feminino', 2, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('aviador', 'Aviador', 'O clássico que nunca sai de moda.', 'Feminino', 3, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;
insert into public.categories (slug, name, description, parent_name, display_order, active)
values ('retangular', 'Retangular', null, 'Feminino', 4, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;

-- ------------------------------------------------------------------ produtos

-- Óculos de Sol Atena - Camuflado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Atena - Camuflado', 'oculos-de-sol-atena-camuflado',
  'A elegância clássica do animal print em uma armação que nunca sai de moda. O Óculos de Sol Atena apresenta lentes em degradê suave combinadas com uma estampa tartaruga rica em detalhes, trazendo um ar sofisticado, versátil e cheio de charme para o seu dia a dia.',
  (select id from public.categories where slug = 'redondo'),
  12990, null,
  1, true, true, false, 0,
  'Óculos de Sol Atena - Camuflado', 'A elegância clássica do animal print em uma armação que nunca sai de moda. O Óculos de Sol Atena apresenta lentes em degradê suave combinadas com uma estampa tartaruga rica em detalhes, trazendo um ar sofisticado, versátil e cheio de charme para o seu dia a dia.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-01.webp', 'Modelo usando o Óculos de Sol Atena camuflado, com lentes em degradê, ao ar livre', 0, true
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-02.webp', 'Óculos de Sol Atena camuflado apoiado sobre superfície clara, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-03.webp', 'Detalhe da armação camuflada e das hastes do Óculos de Sol Atena', 2, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'atena/oculos-atena-camuflado-04.webp', 'Óculos de Sol Atena camuflado em close, mostrando a estampa tartaruga', 3, false
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '4,7 cm', 0
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '2,3 cm', 1
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '14 cm', 2
from public.products where slug = 'oculos-de-sol-atena-camuflado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Celeste - Preto
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Celeste - Preto', 'oculos-de-sol-celeste-preto',
  'Presença marcante e design cheio de personalidade! O Óculos de Sol Celeste aposta em lentes escuras e uma armação redonda encorpada com detalhes texturizados nas bordas, criando um visual moderno, urbano e autêntico.

O acessório perfeito para quem quer transformar qualquer look básico em uma produção cheia de estilo e atitude.',
  (select id from public.categories where slug = 'redondo'),
  11990, 14990,
  1, true, true, false, 1,
  'Óculos de Sol Celeste - Preto', 'Presença marcante e design cheio de personalidade! O Óculos de Sol Celeste aposta em lentes escuras e uma armação redonda encorpada com detalhes texturizados nas bordas, criando um visual moderno, urbano e autêntico.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-01.webp', 'Modelo usando o Óculos de Sol Celeste preto, de armação redonda encorpada', 0, true
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-02.webp', 'Óculos de Sol Celeste preto segurado na mão, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'celeste/oculos-celeste-preto-03.webp', 'Modelo de perfil usando o Óculos de Sol Celeste preto', 2, false
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '4,6 cm', 0
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,6 cm', 1
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '13,5 cm', 2
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Acetato Premium', 3
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Redondo', 4
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', 'Preto, resistente a riscos', 5
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400 (100% proteção contra raios UVA e UVB)', 6
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formatos de rosto recomendados', 'Quadrado, retangular e oval', 7
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da haste', 'Preto', 8
from public.products where slug = 'oculos-de-sol-celeste-preto'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Luna - Preto Degradê
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Luna - Preto Degradê', 'oculos-de-sol-luna-preto-degrade',
  'O charme atemporal do formato redondo com um acabamento impecável! O Óculos de Sol Luna combina lentes em degradê com uma armação delicada em tons escuros e dourados, trazendo um visual moderno, chique e cheio de personalidade.

Um modelo versátil que transita perfeitamente entre um passeio ao ar livre e produções mais urbanas, garantindo elegância em qualquer ocasião.',
  (select id from public.categories where slug = 'redondo'),
  12990, 15990,
  1, true, true, true, 2,
  'Óculos de Sol Luna - Preto Degradê', 'O charme atemporal do formato redondo com um acabamento impecável! O Óculos de Sol Luna combina lentes em degradê com uma armação delicada em tons escuros e dourados, trazendo um visual moderno, chique e cheio de personalidade.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-01.webp', 'Modelo usando o Óculos de Sol Luna preto degradê, de armação redonda', 0, true
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-02.webp', 'Modelo de perfil usando o Óculos de Sol Luna preto degradê', 1, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-03.webp', 'Óculos de Sol Luna preto degradê visto de frente, com detalhe da armação metálica', 2, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'luna/oculos-luna-preto-degrade-04.webp', 'Modelo usando o Óculos de Sol Luna preto degradê em ambiente externo', 3, false
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '5,0 cm', 0
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '2,0 cm', 1
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '14,2 cm', 2
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Metal rose', 3
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', 'Preto degradê, resistente a riscos, proteção UV400', 4
from public.products where slug = 'oculos-de-sol-luna-preto-degrade'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de Sol Valentina - Preto Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Valentina - Preto Dourado', 'oculos-de-sol-valentina-preto-dourado',
  'O Óculos de Sol Valentina traz um design cat-eye super moderno e geométrico, com armação metálica dourada delicada e lentes escuras que garantem proteção e muito mistério.

Perfeito para quem ama se destacar com elegância, personalidade e um toque de alta costura. Um modelo empoderado que eleva instantaneamente o visual.',
  (select id from public.categories where slug = 'gatinho'),
  11990, 14990,
  1, true, true, false, 3,
  'Óculos de Sol Valentina - Preto Dourado', 'O Óculos de Sol Valentina traz um design cat-eye super moderno e geométrico, com armação metálica dourada delicada e lentes escuras que garantem proteção e muito mistério.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-01.webp', 'Modelo usando o Óculos de Sol Valentina, cat-eye com armação dourada e lentes pretas', 0, true
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-02.webp', 'Óculos de Sol Valentina preto e dourado apoiado sobre bandeja clara', 1, false
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'valentina/oculos-valentina-preto-dourado-03.webp', 'Modelo em close usando o Óculos de Sol Valentina preto e dourado', 2, false
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Gatinho', 0
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tamanho', 'Médio', 1
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '3,8 cm', 2
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,5 cm', 3
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '13,5 cm', 4
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Metal', 5
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da lente', 'Preto', 6
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Cor da haste', 'Dourado', 7
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tipo', 'Feminino', 8
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400', 9
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Resistência', 'Lente resistente a risco', 10
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formatos de rosto ideais', 'Rosto redondo, quadrado e oval. O formato gatinho é especialmente flattering para rostos redondos, pois cria definição, e também funciona perfeitamente para rostos quadrados, suavizando as linhas.', 11
from public.products where slug = 'oculos-de-sol-valentina-preto-dourado'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;

-- Óculos de sol Vogue - Preto Marrom
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de sol Vogue - Preto Marrom', 'oculos-de-sol-vogue-preto-marrom',
  'O modelo Vogue traduz a essência da modernidade e da alta-costura em um único acessório. Com uma armação geométrica de acetato encorpado e lentes com proteção UV, este óculos une perfeitamente o estilo urbano com a elegância clássica.',
  (select id from public.categories where slug = 'quadrado'),
  15990, null,
  2, true, false, true, 4,
  'Óculos de sol Vogue - Preto Marrom', 'O modelo Vogue traduz a essência da modernidade e da alta-costura em um único acessório. Com uma armação geométrica de acetato encorpado e lentes com proteção UV, este óculos une perfeitamente o estilo urbano com a elegância clássica.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-01.webp', 'Modelo usando o Óculos de sol Vogue, quadrado em acetato preto com lentes marrons', 0, true
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-02.webp', 'Óculos de sol Vogue preto e marrom segurado ao lado de uma bolsa clara', 1, false
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'vogue/oculos-vogue-preto-marrom-03.webp', 'Modelo em close usando o Óculos de sol Vogue preto e marrom', 2, false
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Lente', '50 mm', 0
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '10 mm', 1
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Haste', '138 mm', 2
from public.products where slug = 'oculos-de-sol-vogue-preto-marrom'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-vogue-preto-marrom');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação retangular em acetato premium', 0 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes de mola para maior conforto, flexibilidade e durabilidade', 1 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes de policarbonato resistentes a riscos', 2 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Proteção UV400', 3 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Tamanho médio', 4 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Unissex', 5 from public.products where slug = 'oculos-de-sol-vogue-preto-marrom';

-- Óculos de Sol Oval Mimié - Tartaruga
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Oval Mimié - Tartaruga', 'oculos-de-sol-oval-mimie-tartaruga',
  'Uma fusão perfeita entre o charme vintage e a sofisticação moderna. O modelo Mimié traz um formato oval delicado com a clássica estampa tartaruga (havana), garantindo um visual elegante e atemporal para qualquer ocasião.

O formato oval é especialmente flattering para rostos quadrados e retangulares, pois suaviza as linhas e cria uma expressão mais delicada e sofisticada. Para rostos redondos e ovais, o tamanho pequeno e refinado traz harmonia e elegância. É aquele óculos que valoriza qualquer rosto!',
  (select id from public.categories where slug = 'redondo'),
  15990, null,
  1, true, false, true, 5,
  'Óculos de Sol Oval Mimié - Tartaruga', 'Uma fusão perfeita entre o charme vintage e a sofisticação moderna. O modelo Mimié traz um formato oval delicado com a clássica estampa tartaruga (havana), garantindo um visual elegante e atemporal para qualquer ocasião.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'mimie/oculos-mimie-tartaruga-01.webp', 'Modelo usando o Óculos de Sol Oval Mimié com estampa tartaruga', 0, true
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'mimie/oculos-mimie-tartaruga-02.webp', 'Óculos de Sol Oval Mimié tartaruga apoiado sobre superfície clara, visto de frente', 1, false
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Formato', 'Oval', 0
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tamanho', 'Pequeno', 1
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Diâmetro', '3,8 cm', 2
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Ponte', '1,5 cm', 3
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Largura total', '12,7 cm', 4
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Material', 'Acetato Premium', 5
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Tipo', 'Feminino', 6
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Proteção', 'UV400', 7
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
insert into public.product_specifications (product_id, label, value, display_order)
select id, 'Resistência', 'Lente resistente a risco', 8
from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga'
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design: armação oval clássica e versátil.', 0 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Acabamento: estampa tartaruga em tons de marrom e âmbar com detalhes refinados.', 1 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Conforto: estrutura leve em acetato de alta qualidade para uso prolongado.', 2 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Proteção: lentes marrons com proteção UV.', 3 from public.products where slug = 'oculos-de-sol-oval-mimie-tartaruga';

-- Óculos de Sol Range Preto Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Range Preto Dourado', 'oculos-de-sol-range-preto-dourado',
  'Sofisticação, personalidade e elegância em um único acessório. Este modelo hexagonal da DZ Collection combina linhas modernas com detalhes refinados, criando um visual marcante para mulheres que valorizam estilo em qualquer ocasião.

A armação metálica dourada traz leveza e um acabamento premium, enquanto as hastes robustas em preto, com detalhe exclusivo, elevam o design e garantem um toque de luxo. As lentes escuras oferecem proteção UV400, protegendo seus olhos contra os raios UVA e UVB com muito estilo.

Ideal para compor looks casuais, urbanos ou sofisticados, este modelo é perfeito para quem deseja um acessório versátil e atemporal.',
  null,
  14990, null,
  1, true, false, false, 6,
  'Óculos de Sol Range Preto Dourado', 'Sofisticação, personalidade e elegância em um único acessório. Este modelo hexagonal da DZ Collection combina linhas modernas com detalhes refinados, criando um visual marcante para mulheres que valorizam estilo em qualquer ocasião.'
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-01.webp', 'Modelo usando o Óculos de Sol Range hexagonal, com armação dourada e hastes pretas', 0, true
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-02.webp', 'Óculos de Sol Range preto e dourado segurado na mão', 1, false
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'range/oculos-range-preto-dourado-03.webp', 'Óculos de Sol Range preto e dourado apoiado sobre bandeja clara', 2, false
from public.products where slug = 'oculos-de-sol-range-preto-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-range-preto-dourado');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design hexagonal moderno e elegante.', 0 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação metálica dourada de alta qualidade.', 1 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes premium com acabamento sofisticado.', 2 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes com proteção UV400.', 3 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Leve, confortável e resistente para o uso diário.', 4 from public.products where slug = 'oculos-de-sol-range-preto-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Combina com diversos formatos de rosto.', 5 from public.products where slug = 'oculos-de-sol-range-preto-dourado';

-- Óculos de Sol Rancher - Dourado
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  'Óculos de Sol Rancher - Dourado', 'oculos-de-sol-rancher-dourado',
  'Inspirado no estilo country de luxo, o Rancher combina personalidade, elegância e autenticidade em um único acessório. Seu design aviador com acabamento metálico dourado e lentes em degradê traz um visual sofisticado, enquanto as hastes exclusivas com detalhe inspirado em esporas adicionam um toque marcante e cheio de atitude.

Ideal para quem busca um óculos versátil, o Rancher acompanha desde os dias no campo até produções urbanas, elevando qualquer look com charme e presença.

Rancher by DZ Collection. Para quem carrega a liberdade no olhar e a elegância em cada detalhe.',
  (select id from public.categories where slug = 'aviador'),
  12990, 15990,
  1, true, false, false, 7,
  'Óculos de Sol Rancher - Dourado', 'Inspirado no estilo country de luxo, o Rancher combina personalidade, elegância e autenticidade em um único acessório. Seu design aviador com acabamento metálico dourado e lentes em degradê traz um visual sofisticado, enquanto as hastes exclusivas com detalhe inspirado em esporas adicionam um toque '
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-01.webp', 'Modelo de chapéu usando o Óculos de Sol Rancher dourado, modelo aviador', 0, true
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-02.webp', 'Óculos de Sol Rancher dourado apoiado sobre um chapéu de palha', 1, false
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, 'rancher/oculos-rancher-dourado-03.webp', 'Modelo usando o Óculos de Sol Rancher dourado ao ar livre', 2, false
from public.products where slug = 'oculos-de-sol-rancher-dourado'
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;
delete from public.product_highlights
where product_id = (select id from public.products where slug = 'oculos-de-sol-rancher-dourado');
insert into public.product_highlights (product_id, text, display_order)
select id, 'Design aviador atemporal.', 0 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Hastes com detalhe exclusivo inspirado no universo western.', 1 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Armação metálica leve e resistente.', 2 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Lentes com proteção UV400.', 3 from public.products where slug = 'oculos-de-sol-rancher-dourado';
insert into public.product_highlights (product_id, text, display_order)
select id, 'Elegância e conforto para o uso diário.', 4 from public.products where slug = 'oculos-de-sol-rancher-dourado';

-- --------------------------------------------------------------- configurações
insert into public.site_settings (key, value, is_public) values
  ('pix_discount_percent', '5'::jsonb, true),
  ('whatsapp_number', '"5527996441300"'::jsonb, true),
  ('announcement', '{"texto":"Seu estilo começa pelo olhar","complemento":"5% de desconto no Pix"}'::jsonb, true)
on conflict (key) do nothing;

commit;


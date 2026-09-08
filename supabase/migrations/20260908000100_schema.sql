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

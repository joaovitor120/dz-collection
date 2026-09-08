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

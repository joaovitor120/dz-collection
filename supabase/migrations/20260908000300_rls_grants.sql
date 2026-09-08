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

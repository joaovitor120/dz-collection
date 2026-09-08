-- =============================================================================
-- MATRIZ DE TESTES DE RLS E GRANTS
-- =============================================================================
-- Testa o PERMITIDO e o NEGADO para os três perfis reais:
--   anon                    → visitante do catálogo
--   authenticated não-admin → alguém que conseguiu uma sessão qualquer
--   admin                   → conta presente em admin_users
--
-- Roda igual no Postgres local e no projeto Supabase.
-- Saída: uma linha por caso, com PASS/FAIL, e um resumo final.
-- =============================================================================

create schema if not exists rls_test;

create table if not exists rls_test.results (
  id       serial primary key,
  perfil   text,
  caso     text,
  esperado text,
  obtido   text,
  passou   boolean
);

truncate rls_test.results restart identity;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Executa `p_sql` sob um papel/identidade e registra se foi BLOQUEADO.
-- Bloqueio conta como: exceção (permission denied / RLS violation) OU
-- zero linhas afetadas (que é como o RLS silenciosamente barra UPDATE/DELETE).
create or replace function rls_test.expect_blocked(
  p_perfil text, p_role text, p_uid uuid, p_sql text, p_caso text
) returns void language plpgsql as $$
declare
  v_rows int;
  v_obtido text;
  v_blocked boolean;
begin
  begin
    perform set_config('role', p_role, true);
    perform set_config('request.jwt.claims',
      case when p_uid is null then '{}'
           else json_build_object('sub', p_uid, 'role', p_role)::text end, true);

    execute p_sql;
    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      v_blocked := true;  v_obtido := 'bloqueado (0 linhas)';
    else
      v_blocked := false; v_obtido := format('PERMITIDO (%s linhas)', v_rows);
    end if;
  exception when others then
    v_blocked := true;
    v_obtido  := 'bloqueado (' || coalesce(sqlerrm, sqlstate) || ')';
  end;

  perform set_config('role', 'postgres', true);
  insert into rls_test.results (perfil, caso, esperado, obtido, passou)
  values (p_perfil, p_caso, 'bloqueado', v_obtido, v_blocked);
end;
$$;

-- Executa e espera SUCESSO com um número exato de linhas.
create or replace function rls_test.expect_rows(
  p_perfil text, p_role text, p_uid uuid, p_sql text, p_esperado int, p_caso text
) returns void language plpgsql as $$
declare
  v_rows int;
  v_obtido text;
  v_ok boolean;
begin
  begin
    perform set_config('role', p_role, true);
    perform set_config('request.jwt.claims',
      case when p_uid is null then '{}'
           else json_build_object('sub', p_uid, 'role', p_role)::text end, true);

    execute p_sql;
    get diagnostics v_rows = row_count;
    v_ok := (v_rows = p_esperado);
    v_obtido := format('%s linhas', v_rows);
  exception when others then
    v_ok := false;
    v_obtido := 'ERRO: ' || coalesce(sqlerrm, sqlstate);
  end;

  perform set_config('role', 'postgres', true);
  insert into rls_test.results (perfil, caso, esperado, obtido, passou)
  values (p_perfil, p_caso, format('%s linhas', p_esperado), v_obtido, v_ok);
end;
$$;

-- Espera que uma constraint do banco rejeite o dado.
create or replace function rls_test.expect_constraint_error(
  p_sql text, p_caso text
) returns void language plpgsql as $$
declare v_ok boolean; v_obtido text;
begin
  begin
    execute p_sql;
    v_ok := false; v_obtido := 'ACEITO (constraint não barrou)';
  exception when others then
    v_ok := true;  v_obtido := 'rejeitado (' || sqlstate || ')';
  end;
  insert into rls_test.results (perfil, caso, esperado, obtido, passou)
  values ('constraints', p_caso, 'rejeitado', v_obtido, v_ok);
end;
$$;

-- =============================================================================
-- FIXTURES
-- =============================================================================
do $$
declare
  v_admin_uid uuid := '11111111-1111-1111-1111-111111111111';
  v_user_uid  uuid := '22222222-2222-2222-2222-222222222222';
  v_cat_id    uuid;
  v_active_id uuid;
  v_inactive_id uuid;
begin
  delete from public.audit_logs;
  delete from public.product_images;
  delete from public.product_specifications;
  delete from public.product_highlights;
  delete from public.products;
  delete from public.categories;
  delete from public.site_settings;
  delete from public.admin_users;
  delete from auth.users where id in (v_admin_uid, v_user_uid);

  insert into auth.users (id, email) values
    (v_admin_uid, 'admin-teste@example.com'),
    (v_user_uid,  'qualquer@example.com');

  insert into public.admin_users (user_id, email)
  values (v_admin_uid, 'admin-teste@example.com');

  insert into public.categories (slug, name, active)
  values ('redondo', 'Redondo', true) returning id into v_cat_id;

  insert into public.products (name, slug, category_id, price_cents, active, stock)
  values ('Produto Ativo', 'produto-ativo', v_cat_id, 15990, true, 1)
  returning id into v_active_id;

  insert into public.products (name, slug, category_id, price_cents, active, stock)
  values ('Produto Inativo', 'produto-inativo', v_cat_id, 12990, false, 1)
  returning id into v_inactive_id;

  insert into public.product_images (product_id, storage_path, is_primary, display_order)
  values (v_active_id,   'ativo/foto-01.webp',   true, 0),
         (v_inactive_id, 'inativo/foto-01.webp', true, 0);

  insert into public.product_specifications (product_id, label, value)
  values (v_active_id, 'Material', 'Acetato'),
         (v_inactive_id, 'Material', 'Metal');

  insert into public.site_settings (key, value, is_public) values
    ('home_hero', '{"titulo":"publico"}'::jsonb, true),
    ('internal_flags', '{"segredo":true}'::jsonb, false);
end
$$;

-- =============================================================================
-- PERFIL 1 — ANON
-- =============================================================================
select rls_test.expect_rows('anon', 'anon', null,
  'select 1 from public.products where slug = ''produto-ativo''', 1,
  'lê produto ativo');

select rls_test.expect_rows('anon', 'anon', null,
  'select 1 from public.products where slug = ''produto-inativo''', 0,
  'NÃO enxerga produto inativo');

select rls_test.expect_rows('anon', 'anon', null,
  'select 1 from public.product_images', 1,
  'só vê imagem de produto ativo');

select rls_test.expect_rows('anon', 'anon', null,
  'select 1 from public.product_specifications', 1,
  'só vê spec de produto ativo');

select rls_test.expect_rows('anon', 'anon', null,
  'select 1 from public.site_settings', 1,
  'só vê configuração pública');

select rls_test.expect_blocked('anon', 'anon', null,
  'insert into public.products (name, slug, price_cents) values (''Hack'', ''hack-anon'', 1)',
  'INSERT produto');

select rls_test.expect_blocked('anon', 'anon', null,
  'update public.products set price_cents = 1 where slug = ''produto-ativo''',
  'UPDATE produto');

select rls_test.expect_blocked('anon', 'anon', null,
  'delete from public.products where slug = ''produto-ativo''',
  'DELETE produto');

select rls_test.expect_blocked('anon', 'anon', null,
  'update public.products set active = true where slug = ''produto-inativo''',
  'UPDATE para reativar produto');

select rls_test.expect_blocked('anon', 'anon', null,
  'select * from public.admin_users',
  'SELECT admin_users');

select rls_test.expect_blocked('anon', 'anon', null,
  'select * from public.audit_logs',
  'SELECT audit_logs');

select rls_test.expect_blocked('anon', 'anon', null,
  'select * from public.auth_rate_limits',
  'SELECT auth_rate_limits');

select rls_test.expect_blocked('anon', 'anon', null,
  'insert into public.admin_users (user_id, email) values (''22222222-2222-2222-2222-222222222222'', ''eu@hack.com'')',
  'auto-promoção a admin');

select rls_test.expect_blocked('anon', 'anon', null,
  'insert into storage.objects (bucket_id, name) values (''product-images'', ''hack.webp'')',
  'upload no Storage');

-- =============================================================================
-- PERFIL 2 — AUTENTICADO, NÃO ADMIN  (teste obrigatório do briefing)
-- =============================================================================
select rls_test.expect_rows('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'select 1 from public.products where slug = ''produto-ativo''', 1,
  'lê produto ativo');

select rls_test.expect_rows('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'select 1 from public.products where slug = ''produto-inativo''', 0,
  'NÃO enxerga produto inativo');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'insert into public.products (name, slug, price_cents) values (''Hack'', ''hack-user'', 1)',
  'INSERT produto');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'update public.products set price_cents = 1 where slug = ''produto-ativo''',
  'UPDATE produto');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'delete from public.products where slug = ''produto-ativo''',
  'DELETE produto');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'insert into public.categories (slug, name) values (''hack'', ''Hack'')',
  'INSERT categoria');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'insert into public.product_images (product_id, storage_path) select id, ''x/y.webp'' from public.products limit 1',
  'INSERT imagem');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'select * from public.admin_users',
  'SELECT admin_users');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'insert into public.admin_users (user_id, email) values (''22222222-2222-2222-2222-222222222222'', ''eu@hack.com'')',
  'auto-promoção a admin');

select rls_test.expect_rows('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'select 1 from public.audit_logs', 0,
  'não lê trilha de auditoria');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'select public.log_admin_action(''PRODUCT_DELETED'')',
  'escrever na auditoria');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'insert into storage.objects (bucket_id, name) values (''product-images'', ''hack.webp'')',
  'upload no Storage');

select rls_test.expect_blocked('autenticado não-admin', 'authenticated', '22222222-2222-2222-2222-222222222222',
  'update public.site_settings set value = ''{"x":1}''::jsonb where key = ''home_hero''',
  'UPDATE configuração da home');

-- =============================================================================
-- PERFIL 3 — ADMIN
-- =============================================================================
select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'select 1 from public.products', 2,
  'enxerga produtos ativos E inativos');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'insert into public.products (name, slug, price_cents) values (''Novo'', ''produto-novo'', 9990)', 1,
  'INSERT produto');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'update public.products set price_cents = 17990 where slug = ''produto-ativo''', 1,
  'UPDATE preço');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'update public.products set active = false where slug = ''produto-novo''', 1,
  'desativa produto');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'delete from public.products where slug = ''produto-novo''', 1,
  'DELETE produto');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'insert into public.categories (slug, name) values (''gatinho'', ''Gatinho'')', 1,
  'INSERT categoria');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'select public.log_admin_action(''PRICE_CHANGED'', ''product'', ''produto-ativo'')', 1,
  'grava na trilha de auditoria');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'select 1 from public.audit_logs', 1,
  'lê a própria trilha de auditoria');

select rls_test.expect_blocked('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'update public.audit_logs set action = ''NADA_ACONTECEU''',
  'reescrever a trilha para esconder ação');

select rls_test.expect_blocked('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'delete from public.audit_logs',
  'apagar a trilha de auditoria');

select rls_test.expect_blocked('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'insert into public.admin_users (user_id, email) values (''22222222-2222-2222-2222-222222222222'', ''outro@admin.com'')',
  'criar outro admin pela Data API');

select rls_test.expect_rows('admin', 'authenticated', '11111111-1111-1111-1111-111111111111',
  'insert into storage.objects (bucket_id, name) values (''product-images'', ''ok.webp'')', 1,
  'upload no Storage');

-- =============================================================================
-- PERFIL 4 — CONSTRAINTS DO BANCO (validação independente da aplicação)
-- =============================================================================
select rls_test.expect_constraint_error(
  'insert into public.products (name, slug, price_cents) values (''Neg'', ''preco-negativo'', -1)',
  'preço negativo');

select rls_test.expect_constraint_error(
  'insert into public.products (name, slug, price_cents, compare_at_price_cents) values (''Cmp'', ''compare-menor'', 15990, 9990)',
  'preço "de" menor que o preço atual');

select rls_test.expect_constraint_error(
  'insert into public.products (name, slug, price_cents) values (''Dup'', ''produto-ativo'', 100)',
  'slug duplicado');

select rls_test.expect_constraint_error(
  'insert into public.products (name, slug, price_cents) values (''Bad'', ''Slug Com Espaço'', 100)',
  'slug com formato inválido');

select rls_test.expect_constraint_error(
  'insert into public.product_images (product_id, storage_path) select id, ''../../../etc/passwd'' from public.products limit 1',
  'path traversal no storage_path');

select rls_test.expect_constraint_error(
  'insert into public.products (name, slug, price_cents) values (repeat(''x'', 500), ''nome-gigante'', 100)',
  'nome acima do limite de tamanho');

select rls_test.expect_constraint_error(
  'insert into public.product_images (product_id, storage_path, is_primary) select id, ''ativo/segunda.webp'', true from public.products where slug = ''produto-ativo''',
  'segunda imagem principal no mesmo produto');

-- =============================================================================
-- RELATÓRIO
-- =============================================================================
\echo ''
\echo '================= MATRIZ DE SEGURANÇA — RLS, GRANTS E CONSTRAINTS ================='
select
  rpad(perfil, 24)                as "perfil",
  rpad(caso, 46)                  as "caso",
  case when passou then 'PASS' else 'FAIL' end as "res",
  obtido                          as "obtido"
from rls_test.results
order by id;

\echo ''
select
  count(*)                                  as "total",
  count(*) filter (where passou)            as "passou",
  count(*) filter (where not passou)        as "falhou"
from rls_test.results;

-- Falha o script inteiro se qualquer caso falhou.
do $$
declare v_fail int;
begin
  select count(*) into v_fail from rls_test.results where not passou;
  if v_fail > 0 then
    raise exception 'MATRIZ DE SEGURANÇA FALHOU EM % CASO(S)', v_fail;
  end if;
end
$$;

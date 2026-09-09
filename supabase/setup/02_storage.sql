-- ############################################################################
-- DZ COLLECTION — STORAGE (rodar DEPOIS do 01_completo.sql)
-- ############################################################################
--
-- Se der erro "must be owner of table objects", NÃO insista no SQL:
-- crie o bucket e as policies pela interface. O passo a passo alternativo
-- está no fim deste arquivo, em comentário.
-- ############################################################################

-- =============================================================================
-- DZ COLLECTION — 0004 · Supabase Storage
-- =============================================================================
-- Bucket único para fotos de produto. Leitura pública (são imagens de catálogo),
-- escrita exclusiva de administradores autenticados.
--
-- Ter a URL do bucket NÃO autoriza upload: as policies abaixo exigem is_admin().
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,                                    -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- SVG fica deliberadamente de fora: é XML com script ativo e não há necessidade
-- real dele em foto de produto.

-- -----------------------------------------------------------------------------
-- Policies em storage.objects
-- -----------------------------------------------------------------------------
drop policy if exists product_images_read_public on storage.objects;
create policy product_images_read_public
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists product_images_insert_admin on storage.objects;
create policy product_images_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_update_admin on storage.objects;
create policy product_images_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_delete_admin on storage.objects;
create policy product_images_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());


-- ############################################################################
-- ALTERNATIVA PELA INTERFACE, se o SQL acima falhar por permissão
-- ############################################################################
--
-- 1. Storage → New bucket
--      Name: product-images
--      Public bucket: SIM
--      File size limit: 5 MB
--      Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 2. Storage → Policies → product-images → New policy, quatro vezes:
--
--      SELECT  · target roles: anon, authenticated
--                USING:  bucket_id = 'product-images'
--
--      INSERT  · target roles: authenticated
--                WITH CHECK:  bucket_id = 'product-images' AND public.is_admin()
--
--      UPDATE  · target roles: authenticated
--                USING e WITH CHECK:  bucket_id = 'product-images' AND public.is_admin()
--
--      DELETE  · target roles: authenticated
--                USING:  bucket_id = 'product-images' AND public.is_admin()
--
-- O que importa é que só INSERT/UPDATE/DELETE exijam is_admin(). Ter a URL do
-- bucket não pode autorizar upload.
-- ############################################################################

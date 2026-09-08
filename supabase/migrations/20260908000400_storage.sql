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

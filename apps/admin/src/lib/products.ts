import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CategoryRow, ProductImageRow, ProductRow, ProductSpecificationRow } from '@dz/shared';
import { SORT_COLUMNS, type SortOption } from '@dz/shared';

/**
 * =============================================================================
 * LEITURA DE PRODUTOS NO PAINEL
 * =============================================================================
 * Todas as consultas usam o client da SESSÃO da pessoa logada — nunca a secret
 * key. Isso mantém o RLS no caminho: se um dia a autorização da aplicação
 * falhar, o banco ainda recusa. Duas camadas independentes, e não uma só.
 * =============================================================================
 */

export interface ProductListItem extends ProductRow {
  category: Pick<CategoryRow, 'id' | 'slug' | 'name'> | null;
  images: Pick<ProductImageRow, 'storage_path' | 'is_primary' | 'display_order'>[];
}

export interface ProductDetail extends ProductRow {
  category: Pick<CategoryRow, 'id' | 'slug' | 'name'> | null;
  images: ProductImageRow[];
  specifications: ProductSpecificationRow[];
}

export interface ListParams {
  q?: string | undefined;
  sort?: SortOption | undefined;
  status?: 'active' | 'inactive' | 'all' | undefined;
  category?: string | undefined;
}

export async function listProducts(
  client: SupabaseClient,
  params: ListParams = {},
): Promise<{ items: ProductListItem[]; total: number }> {
  const sort = SORT_COLUMNS[params.sort ?? 'lancamentos'];

  let query = client
    .from('products')
    .select(
      `*, category:categories (id, slug, name),
       images:product_images (storage_path, is_primary, display_order)`,
      { count: 'exact' },
    )
    .order(sort.column, { ascending: sort.ascending })
    .order('name', { ascending: true })
    .limit(200);

  if (params.status === 'active') query = query.eq('active', true);
  if (params.status === 'inactive') query = query.eq('active', false);
  if (params.category) query = query.eq('category_id', params.category);

  // Busca por nome. `q` vai como PARÂMETRO — o supabase-js monta a query,
  // nada é concatenado em SQL à mão.
  if (params.q) query = query.ilike('name', `%${escapeLike(params.q)}%`);

  const { data, error, count } = await query;
  if (error) throw error;

  const items = ((data ?? []) as ProductListItem[]).map((p) => ({
    ...p,
    images: [...(p.images ?? [])].sort((a, b) => a.display_order - b.display_order),
  }));

  return { items, total: count ?? items.length };
}

export async function getProduct(
  client: SupabaseClient,
  id: string,
): Promise<ProductDetail | null> {
  const { data, error } = await client
    .from('products')
    .select(
      `*, category:categories (id, slug, name),
       images:product_images (id, storage_path, alt_text, display_order, is_primary, width, height),
       specifications:product_specifications (id, label, value, display_order)`,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const detail = data as ProductDetail;
  return {
    ...detail,
    images: [...(detail.images ?? [])].sort((a, b) => a.display_order - b.display_order),
    specifications: [...(detail.specifications ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    ),
  };
}

export async function listCategories(client: SupabaseClient): Promise<CategoryRow[]> {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

/** `%` e `_` são curingas no ILIKE. Escapados, viram texto literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** URL pública da imagem no Storage. O bucket é público apenas para leitura. */
export function storagePublicUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

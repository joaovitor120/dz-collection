/**
 * Camada de leitura do catálogo.
 *
 * Todas as consultas usam o query builder do Supabase, que parametriza os
 * valores. Não existe concatenação de SQL em nenhum ponto, e a ordenação só
 * aceita colunas vindas do mapa fechado SORT_COLUMNS.
 *
 * O filtro `active = true` NÃO é aplicado aqui de propósito: quem garante isso
 * é o RLS. Se esta camada esquecer, o banco não esquece.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { SORT_COLUMNS, type SortOption } from './schemas';
import { pixPriceCents } from './money';
import type { CategoryRow, Product, ProductRow } from './types';

const PRODUCT_SELECT = `
  id, name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description,
  created_at, updated_at,
  category:categories ( id, slug, name ),
  images:product_images ( id, storage_path, alt_text, display_order, is_primary, width, height ),
  specifications:product_specifications ( id, label, value, display_order ),
  highlights:product_highlights ( id, text, display_order )
`;

type RawProduct = ProductRow & {
  category: { id: string; slug: string; name: string } | null;
  images: Product['images'];
  specifications: Product['specifications'];
  highlights: Product['highlights'];
};

function hydrate(row: RawProduct, pixDiscount: number): Product {
  const byOrder = <T extends { display_order: number }>(a: T, b: T) =>
    a.display_order - b.display_order;

  return {
    ...row,
    price_cents: Number(row.price_cents),
    compare_at_price_cents:
      row.compare_at_price_cents === null ? null : Number(row.compare_at_price_cents),
    category: row.category ?? null,
    images: [...(row.images ?? [])].sort(byOrder),
    specifications: [...(row.specifications ?? [])].sort(byOrder),
    highlights: [...(row.highlights ?? [])].sort(byOrder),
    pix_price_cents: pixPriceCents(
      Number(row.price_cents),
      row.compare_at_price_cents === null ? null : Number(row.compare_at_price_cents),
      pixDiscount,
    ),
  };
}

export async function getPixDiscountPercent(client: SupabaseClient): Promise<number> {
  const { data } = await client
    .from('site_settings')
    .select('value')
    .eq('key', 'pix_discount_percent')
    .maybeSingle();
  const raw = typeof data?.value === 'number' ? data.value : Number(data?.value);
  return Number.isFinite(raw) ? raw : 0;
}

export interface CatalogQuery {
  sort?: SortOption;
  categorySlug?: string;
  limit?: number;
  onlyLaunches?: boolean;
  onlyFeatured?: boolean;
}

export async function getProducts(
  client: SupabaseClient,
  opts: CatalogQuery = {},
): Promise<Product[]> {
  const pixDiscount = await getPixDiscountPercent(client);
  const sortKey: SortOption = opts.sort && opts.sort in SORT_COLUMNS ? opts.sort : 'lancamentos';
  const order = SORT_COLUMNS[sortKey];

  let query = client.from('products').select(PRODUCT_SELECT);

  if (opts.onlyLaunches) query = query.eq('is_launch', true);
  if (opts.onlyFeatured) query = query.eq('is_featured', true);
  if (opts.categorySlug) query = query.eq('categories.slug', opts.categorySlug);

  query = query
    .order(order.column, { ascending: order.ascending })
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(opts.limit ?? 100, 1), 100));

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as unknown as RawProduct[];
  if (opts.categorySlug) rows = rows.filter((r) => r.category?.slug === opts.categorySlug);

  return rows.map((r) => hydrate(r, pixDiscount));
}

export async function getProductBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<Product | null> {
  const pixDiscount = await getPixDiscountPercent(client);
  const { data, error } = await client
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return hydrate(data as unknown as RawProduct, pixDiscount);
}

export async function getCategories(client: SupabaseClient): Promise<CategoryRow[]> {
  const { data, error } = await client
    .from('categories')
    .select('id, slug, name, description, parent_name, display_order, active')
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
}

export async function getPublicSettings(
  client: SupabaseClient,
): Promise<Record<string, unknown>> {
  const { data, error } = await client.from('site_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.key as string, r.value]));
}

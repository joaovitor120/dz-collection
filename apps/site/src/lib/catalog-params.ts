import type { CatalogFilters, CategorySlug, SortKey } from '@/types';
import { categories, priceBuckets } from '@/data/site';
import { sortOptions } from '@/lib/catalog';

export type SearchParams = Record<string, string | string[] | undefined>;

const VALID_SORT = new Set(sortOptions.map((o) => o.key));

function one(params: SearchParams, key: string): string {
  const v = params[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

/** Estado do catálogo lido da URL — no servidor e no cliente, do mesmo jeito. */
export function parseFilters(params: SearchParams): CatalogFilters {
  const cats = one(params, 'categoria')
    .split(',')
    .filter(Boolean)
    .filter((c): c is CategorySlug => categories.some((x) => x.slug === c));
  const cols = one(params, 'cor').split(',').filter(Boolean);
  const buckets = one(params, 'preco')
    .split(',')
    .filter(Boolean)
    .filter((b) => priceBuckets.some((x) => x.id === b));

  return {
    query: one(params, 'busca'),
    categories: cats,
    colors: cols,
    priceBuckets: buckets,
    onlyPromo: one(params, 'promo') === '1',
  };
}

export function parseSort(params: SearchParams): SortKey {
  const s = one(params, 'ordenar');
  return VALID_SORT.has(s as SortKey) ? (s as SortKey) : 'lancamentos';
}

/** Serializa o estado do catálogo de volta para a query string. */
export function toParams(filters: CatalogFilters, sort: SortKey): string {
  const p = new URLSearchParams();
  if (filters.query.trim()) p.set('busca', filters.query.trim());
  if (filters.categories.length) p.set('categoria', filters.categories.join(','));
  if (filters.colors.length) p.set('cor', filters.colors.join(','));
  if (filters.priceBuckets.length) p.set('preco', filters.priceBuckets.join(','));
  if (filters.onlyPromo) p.set('promo', '1');
  if (sort !== 'lancamentos') p.set('ordenar', sort);
  const s = p.toString();
  return s ? `?${s}` : '';
}

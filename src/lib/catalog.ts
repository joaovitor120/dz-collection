import type { CatalogFilters, Product, SortKey } from '@/types';
import { priceBuckets } from '@/data/site';
import { discountPercent, normalize } from '@/lib/format';

export const emptyFilters: CatalogFilters = {
  query: '',
  categories: [],
  colors: [],
  priceBuckets: [],
  onlyPromo: false,
};

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'lancamentos', label: 'Lançamentos' },
  { key: 'destaques', label: 'Destaques' },
  { key: 'menor-preco', label: 'Menor preço' },
  { key: 'maior-preco', label: 'Maior preço' },
  { key: 'maior-desconto', label: 'Maior desconto' },
  { key: 'a-z', label: 'A–Z' },
];

/** Texto indexado para a busca: nome, cores, categoria, descrição e specs. */
function haystack(product: Product): string {
  return normalize(
    [
      product.name,
      product.colors.join(' '),
      product.category ?? '',
      product.description.join(' '),
      product.highlights?.join(' ') ?? '',
      product.specifications?.map((s) => `${s.label} ${s.value}`).join(' ') ?? '',
    ].join(' '),
  );
}

export function searchProducts(list: Product[], query: string): Product[] {
  const q = normalize(query);
  if (!q) return list;
  const terms = q.split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    const hay = haystack(p);
    return terms.every((t) => hay.includes(t));
  });
}

export function applyFilters(list: Product[], filters: CatalogFilters): Product[] {
  let out = searchProducts(list, filters.query);

  if (filters.categories.length) {
    out = out.filter((p) => p.category && filters.categories.includes(p.category));
  }
  if (filters.colors.length) {
    out = out.filter((p) => p.colors.some((c) => filters.colors.includes(c)));
  }
  if (filters.priceBuckets.length) {
    const buckets = priceBuckets.filter((b) => filters.priceBuckets.includes(b.id));
    out = out.filter((p) =>
      buckets.some((b) => p.price >= b.min && (b.max === null || p.price <= b.max)),
    );
  }
  if (filters.onlyPromo) {
    out = out.filter((p) => Boolean(p.compareAtPrice));
  }
  return out;
}

export function sortProducts(list: Product[], key: SortKey): Product[] {
  const out = [...list];
  switch (key) {
    case 'menor-preco':
      return out.sort((a, b) => a.price - b.price);
    case 'maior-preco':
      return out.sort((a, b) => b.price - a.price);
    case 'a-z':
      return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    case 'maior-desconto':
      return out.sort(
        (a, b) =>
          (discountPercent(b.price, b.compareAtPrice) ?? 0) -
          (discountPercent(a.price, a.compareAtPrice) ?? 0),
      );
    case 'destaques':
      return out.sort(
        (a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          Number(b.id) - Number(a.id),
      );
    case 'lancamentos':
    default:
      return out.sort((a, b) => Number(b.id) - Number(a.id));
  }
}

export function countFor<T extends string>(
  list: Product[],
  pick: (p: Product) => T[] | T | null,
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of list) {
    const v = pick(p);
    if (v === null) continue;
    for (const item of Array.isArray(v) ? v : [v]) {
      acc[item] = (acc[item] ?? 0) + 1;
    }
  }
  return acc;
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    filters.categories.length +
    filters.colors.length +
    filters.priceBuckets.length +
    (filters.onlyPromo ? 1 : 0)
  );
}

/** Lista de cores disponíveis, na ordem em que aparecem no catálogo. */
export function allColors(list: Product[]): string[] {
  const seen: string[] = [];
  for (const p of list) for (const c of p.colors) if (!seen.includes(c)) seen.push(c);
  return seen;
}

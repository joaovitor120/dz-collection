import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getCategories as dbCategories,
  getProductBySlug as dbProductBySlug,
  getProducts as dbProducts,
  type Product as DbProduct,
} from '@dz/shared';
import type { CategorySlug, Product } from '@/types';

/**
 * =============================================================================
 * O CATÁLOGO PÚBLICO LÊ DO BANCO
 * =============================================================================
 * Este arquivo é a fronteira entre o PostgreSQL e a interface. Ele lê com a
 * chave publicável — a mesma que qualquer visitante teria — e portanto vê
 * exatamente o que o RLS permite ver: produtos ativos, e nada além disso.
 *
 * A secret key NÃO aparece aqui, e não deve nunca. Se um dia esta camada
 * esquecer um filtro, o banco continua recusando. É a diferença entre "o site
 * não mostra" e "o dado não sai".
 *
 * A saída é adaptada para o formato que os componentes já usam, para que a
 * troca da fonte de dados não vire uma reescrita da interface inteira.
 * =============================================================================
 */

let cached: SupabaseClient | null = null;

function publicClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Catálogo indisponível: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY precisam estar definidas.',
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** URL pública do arquivo no Storage. Bucket público apenas para leitura. */
export function imageUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}

const CATEGORY_SLUGS: readonly CategorySlug[] = [
  'aviador',
  'quadrado',
  'redondo',
  'gatinho',
  'retangular',
];

function toCategorySlug(slug: string | undefined | null): CategorySlug | null {
  if (!slug) return null;
  return CATEGORY_SLUGS.includes(slug as CategorySlug) ? (slug as CategorySlug) : null;
}

/**
 * Cores vêm do próprio nome, como na loja de origem:
 * "Óculos de Sol Atena - Camuflado" → ["Camuflado"].
 * Nada é inventado: se o nome não declara cor, a lista fica vazia.
 */
function colorsFromName(name: string): string[] {
  const parts = name.split(/\s+[-–]\s+/);
  if (parts.length < 2) return [];
  const tail = parts[parts.length - 1];
  if (!tail) return [];
  return tail
    .split(/\s+e\s+|\//i)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.length <= 40);
}

function centsToReais(cents: number | null | undefined): number | undefined {
  if (cents === null || cents === undefined) return undefined;
  return cents / 100;
}

/** DbProduct (banco) → Product (interface). Um só lugar faz essa tradução. */
function adapt(row: DbProduct): Product {
  const images = row.images.map((i) => imageUrl(i.storage_path));
  const imageAlts = row.images.map((i) => i.alt_text ?? row.name);

  const product: Product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: toCategorySlug(row.category?.slug),
    colors: colorsFromName(row.name),
    price: row.price_cents / 100,
    description: (row.description ?? '')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    images,
    imageAlts,
    stock: row.stock,
    available: row.active && row.stock > 0,
    updatedAt: row.updated_at,
  };

  const compareAt = centsToReais(row.compare_at_price_cents);
  if (compareAt !== undefined) product.compareAtPrice = compareAt;

  const pix = centsToReais(row.pix_price_cents);
  if (pix !== undefined) product.pixPrice = pix;

  if (row.highlights.length > 0) product.highlights = row.highlights.map((h) => h.text);
  if (row.specifications.length > 0) {
    product.specifications = row.specifications.map((s) => ({ label: s.label, value: s.value }));
  }
  if (row.is_launch) product.isNew = true;
  if (row.is_featured) product.featured = true;

  return product;
}

// -----------------------------------------------------------------------------
// Leituras
// -----------------------------------------------------------------------------

/** Catálogo inteiro, já na ordem de exibição definida no painel. */
export async function fetchProducts(): Promise<Product[]> {
  const rows = await dbProducts(publicClient(), { sort: 'lancamentos', limit: 100 });
  return rows.map(adapt);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const row = await dbProductBySlug(publicClient(), slug);
  return row ? adapt(row) : null;
}

export async function fetchLaunches(limit = 4): Promise<Product[]> {
  const rows = await dbProducts(publicClient(), {
    onlyLaunches: true,
    sort: 'lancamentos',
    limit,
  });
  return rows.map(adapt);
}

export async function fetchFeatured(): Promise<Product[]> {
  const rows = await dbProducts(publicClient(), { onlyFeatured: true, sort: 'lancamentos' });
  return rows.map(adapt);
}

export async function fetchCategoriesWithCounts(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const [categories, products] = await Promise.all([
    dbCategories(publicClient()),
    fetchProducts(),
  ]);
  return categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: products.filter((p) => p.category === c.slug).length,
  }));
}

/** Relacionados: mesma categoria primeiro, completando com o restante. */
export function relatedFrom(all: Product[], product: Product, limit = 4): Product[] {
  const sameCategory = all.filter(
    (p) => p.slug !== product.slug && p.category && p.category === product.category,
  );
  const rest = all.filter((p) => p.slug !== product.slug && !sameCategory.includes(p));
  return [...sameCategory, ...rest].slice(0, limit);
}

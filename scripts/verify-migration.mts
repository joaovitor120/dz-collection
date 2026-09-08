/**
 * Compara CATÁLOGO ANTIGO (src/data/products.ts) vs BANCO, campo a campo.
 *
 * A dependência do array hardcoded só pode ser removida depois que este script
 * passar — é a evidência de que a migração está completa.
 *
 *   node --experimental-strip-types scripts/verify-migration.mts
 *
 * Variáveis: PGHOST, PGPORT, PGUSER, DB (default dz_rls_test)
 */
import { execFileSync } from 'node:child_process';
import { products } from '../src/data/products.ts';
import { categories } from '../src/data/site.ts';

const PGHOST = process.env.PGHOST ?? '/tmp';
const PGPORT = process.env.PGPORT ?? '5433';
const PGUSER = process.env.PGUSER ?? 'postgres';
const DB = process.env.DB ?? 'dz_rls_test';

function query<T>(sql: string): T {
  const out = execFileSync(
    'psql',
    ['-h', PGHOST, '-p', PGPORT, '-U', PGUSER, '-d', DB, '-tAc', sql],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(out.trim() || 'null') as T;
}

interface DbProduct {
  slug: string;
  name: string;
  description: string | null;
  category_slug: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  active: boolean;
  is_launch: boolean;
  is_featured: boolean;
  images: { storage_path: string; alt_text: string; display_order: number; is_primary: boolean }[];
  specs: { label: string; value: string; display_order: number }[];
  highlights: { text: string; display_order: number }[];
}

const rows = query<DbProduct[]>(`
  select coalesce(json_agg(row_to_json(t) order by t.slug), '[]'::json) from (
    select p.slug, p.name, p.description,
           c.slug as category_slug,
           p.price_cents, p.compare_at_price_cents, p.stock,
           p.active, p.is_launch, p.is_featured,
           coalesce((select json_agg(json_build_object(
                       'storage_path', i.storage_path, 'alt_text', i.alt_text,
                       'display_order', i.display_order, 'is_primary', i.is_primary)
                     order by i.display_order)
                     from public.product_images i where i.product_id = p.id), '[]'::json) as images,
           coalesce((select json_agg(json_build_object(
                       'label', s.label, 'value', s.value, 'display_order', s.display_order)
                     order by s.display_order)
                     from public.product_specifications s where s.product_id = p.id), '[]'::json) as specs,
           coalesce((select json_agg(json_build_object(
                       'text', h.text, 'display_order', h.display_order)
                     order by h.display_order)
                     from public.product_highlights h where h.product_id = p.id), '[]'::json) as highlights
    from public.products p
    left join public.categories c on c.id = p.category_id
  ) t
`);

const byslug = new Map(rows.map((r) => [r.slug, r]));
const problems: string[] = [];
const cents = (v: number) => Math.round(v * 100);

function eq(label: string, slug: string, a: unknown, b: unknown) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) problems.push(`${slug} · ${label}\n    catálogo: ${sa}\n    banco:    ${sb}`);
}

for (const p of products) {
  const d = byslug.get(p.slug);
  if (!d) {
    problems.push(`${p.slug} · AUSENTE NO BANCO`);
    continue;
  }
  eq('nome', p.slug, p.name, d.name);
  eq('preço (centavos)', p.slug, cents(p.price), Number(d.price_cents));
  eq(
    'preço "de" (centavos)',
    p.slug,
    p.compareAtPrice ? cents(p.compareAtPrice) : null,
    d.compare_at_price_cents === null ? null : Number(d.compare_at_price_cents),
  );
  eq('estoque', p.slug, p.stock, d.stock);
  eq('ativo', p.slug, p.available, d.active);
  eq('lançamento', p.slug, !!p.isNew, d.is_launch);
  eq('destaque', p.slug, !!p.featured, d.is_featured);
  eq('categoria', p.slug, p.category, d.category_slug);
  eq('descrição', p.slug, p.description.join('\n\n'), d.description);

  eq(
    'imagens',
    p.slug,
    p.images.map((src, i) => ({
      storage_path: src.replace(/^\/images\/products\//, ''),
      alt_text: p.imageAlts[i] ?? p.name,
      display_order: i,
      is_primary: i === 0,
    })),
    d.images,
  );

  eq(
    'especificações',
    p.slug,
    (p.specifications ?? []).map((s, i) => ({ label: s.label, value: s.value, display_order: i })),
    d.specs,
  );

  eq(
    'características',
    p.slug,
    (p.highlights ?? []).map((t, i) => ({ text: t, display_order: i })),
    d.highlights,
  );
}

// Produtos que existem no banco mas não no catálogo antigo (fora os de teste).
const known = new Set(products.map((p) => p.slug));
const extras = rows.filter((r) => !known.has(r.slug)).map((r) => r.slug);

// Categorias
const dbCats = query<{ slug: string; name: string }[]>(
  `select coalesce(json_agg(json_build_object('slug', slug, 'name', name) order by slug), '[]'::json) from public.categories`,
);
for (const c of categories) {
  const found = dbCats.find((d) => d.slug === c.slug);
  if (!found) problems.push(`categoria ${c.slug} · AUSENTE NO BANCO`);
  else if (found.name !== c.name)
    problems.push(`categoria ${c.slug} · nome divergente: ${c.name} vs ${found.name}`);
}

console.log('');
console.log('========== CATÁLOGO ANTIGO  vs  BANCO ==========');
console.log(`produtos no catálogo: ${products.length}`);
console.log(`produtos no banco:    ${rows.length}${extras.length ? ` (extras: ${extras.join(', ')})` : ''}`);
console.log(`categorias:           ${categories.length} / ${dbCats.length}`);
console.log(
  `imagens:              ${products.reduce((n, p) => n + p.images.length, 0)} / ${rows.reduce((n, r) => n + r.images.length, 0)}`,
);
console.log(
  `especificações:       ${products.reduce((n, p) => n + (p.specifications?.length ?? 0), 0)} / ${rows.reduce((n, r) => n + r.specs.length, 0)}`,
);
console.log('');

if (problems.length === 0) {
  console.log('✓ MIGRAÇÃO COMPLETA — nenhum campo divergente.');
  process.exit(0);
}
console.log(`✗ ${problems.length} DIVERGÊNCIA(S):\n`);
for (const p of problems) console.log('  - ' + p);
process.exit(1);

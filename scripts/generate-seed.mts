/**
 * Gera supabase/seed/0001_catalog.sql a partir de src/data/products.ts.
 *
 * O seed é IDEMPOTENTE: reaplicar não duplica produto nem imagem.
 * Rodar com:  node --experimental-strip-types scripts/generate-seed.mts
 */
import { writeFileSync } from 'node:fs';
import { products } from '../apps/site/src/data/products.ts';
import { categories } from '../apps/site/src/data/site.ts';

const q = (v: string | null | undefined) =>
  v === null || v === undefined ? 'null' : `'${v.replace(/'/g, "''")}'`;
const cents = (v: number) => String(Math.round(v * 100));

const out: string[] = [];
out.push(`-- =============================================================================
-- SEED DO CATÁLOGO — gerado por scripts/generate-seed.mts
-- =============================================================================
-- Os 8 produtos reais auditados na loja Nuvemshop em 07/09/2026.
-- Preços em CENTAVOS. Slugs preservados exatamente como já estão publicados,
-- para que nenhum link enviado por WhatsApp quebre.
--
-- Idempotente: ON CONFLICT em todas as inserções. Pode reaplicar à vontade.
-- =============================================================================

begin;
`);

out.push(`-- ---------------------------------------------------------------- categorias`);
for (const [i, c] of categories.entries()) {
  out.push(`insert into public.categories (slug, name, description, parent_name, display_order, active)
values (${q(c.slug)}, ${q(c.name)}, ${q(c.description ?? null)}, ${q(c.parent)}, ${i}, true)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  parent_name = excluded.parent_name, display_order = excluded.display_order;`);
}

out.push(`\n-- ------------------------------------------------------------------ produtos`);
// display_order segue a ordem do catálogo (id desc na loja = mais novo primeiro)
for (const [i, p] of products.entries()) {
  const cat = p.category ? `(select id from public.categories where slug = ${q(p.category)})` : 'null';
  out.push(`
-- ${p.name}
insert into public.products (
  name, slug, description, category_id, price_cents, compare_at_price_cents,
  stock, active, is_launch, is_featured, display_order, meta_title, meta_description
) values (
  ${q(p.name)}, ${q(p.slug)},
  ${q(p.description.join('\n\n'))},
  ${cat},
  ${cents(p.price)}, ${p.compareAtPrice ? cents(p.compareAtPrice) : 'null'},
  ${p.stock}, ${p.available}, ${!!p.isNew}, ${!!p.featured}, ${i},
  ${q(p.name)}, ${q((p.description[0] ?? '').slice(0, 300))}
)
on conflict (slug) do update set
  name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  compare_at_price_cents = excluded.compare_at_price_cents, stock = excluded.stock,
  active = excluded.active, is_launch = excluded.is_launch,
  is_featured = excluded.is_featured, display_order = excluded.display_order,
  meta_title = excluded.meta_title, meta_description = excluded.meta_description;`);

  // imagens — storage_path espelha o caminho dentro do bucket
  for (const [j, img] of p.images.entries()) {
    const path = img.replace(/^\/images\/products\//, '');
    out.push(`insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select id, ${q(path)}, ${q(p.imageAlts[j] ?? p.name)}, ${j}, ${j === 0}
from public.products where slug = ${q(p.slug)}
on conflict (storage_path) do update set
  alt_text = excluded.alt_text, display_order = excluded.display_order,
  is_primary = excluded.is_primary;`);
  }

  for (const [j, s] of (p.specifications ?? []).entries()) {
    out.push(`insert into public.product_specifications (product_id, label, value, display_order)
select id, ${q(s.label)}, ${q(s.value)}, ${j}
from public.products where slug = ${q(p.slug)}
on conflict (product_id, label) do update set
  value = excluded.value, display_order = excluded.display_order;`);
  }

  if (p.highlights?.length) {
    out.push(`delete from public.product_highlights
where product_id = (select id from public.products where slug = ${q(p.slug)});`);
    for (const [j, h] of p.highlights.entries()) {
      out.push(`insert into public.product_highlights (product_id, text, display_order)
select id, ${q(h)}, ${j} from public.products where slug = ${q(p.slug)};`);
    }
  }
}

out.push(`
-- --------------------------------------------------------------- configurações
insert into public.site_settings (key, value, is_public) values
  ('pix_discount_percent', '5'::jsonb, true),
  ('whatsapp_number', '"5527996441300"'::jsonb, true),
  ('announcement', '{"texto":"Seu estilo começa pelo olhar","complemento":"5% de desconto no Pix"}'::jsonb, true)
on conflict (key) do nothing;

commit;
`);

writeFileSync(new URL('../supabase/seed/0001_catalog.sql', import.meta.url), out.join('\n') + '\n');
console.log('seed gerado com', products.length, 'produtos e', categories.length, 'categorias');

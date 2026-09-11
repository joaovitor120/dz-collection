import type { Metadata } from 'next';
import { CatalogView } from '@/components/catalog/CatalogView';
import { parseFilters, parseSort } from '@/lib/catalog-params';
import { fetchProducts } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Todos os óculos de sol da DZ Collection: formatos, cores e preços. Escolha o seu modelo e fale com a gente pelo WhatsApp.',
  alternates: { canonical: '/catalogo' },
  openGraph: {
    title: 'Catálogo — DZ Collection',
    description: 'Todos os óculos de sol da DZ Collection: formatos, cores e preços.',
    url: '/catalogo',
  },
};

/**
 * O estado do catálogo vem da URL e é resolvido no servidor, de modo que a
 * grade já chega renderizada no HTML (bom para SEO e para o primeiro paint).
 * A partir daí o componente cliente assume filtros, busca e ordenação.
 */
export default async function CatalogPage({
  searchParams,
}: {
  // A partir do Next 15 searchParams é uma Promise. Tratar como objeto simples
  // faria a página ser pré-renderizada estaticamente e os filtros da URL
  // seriam silenciosamente ignorados.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, products] = await Promise.all([searchParams, fetchProducts()]);
  return (
    <CatalogView
      products={products}
      initialFilters={parseFilters(params)}
      initialSort={parseSort(params)}
    />
  );
}

import type { Metadata } from 'next';
import { CatalogView } from '@/components/catalog/CatalogView';
import { parseFilters, parseSort } from '@/lib/catalog-params';

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
export default function CatalogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <CatalogView
      initialFilters={parseFilters(searchParams)}
      initialSort={parseSort(searchParams)}
    />
  );
}

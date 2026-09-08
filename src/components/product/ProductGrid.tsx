import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

/**
 * Grid compacto — 2 colunas no mobile (pedido explícito da proprietária),
 * 3 no tablet, 4 no desktop e 5 em telas muito largas.
 * As linhas finas entre as colunas substituem cards com caixa e sombra.
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 'default',
}: {
  products: Product[];
  priorityCount?: number;
  columns?: 'default' | 'wide';
}) {
  const cols =
    columns === 'wide'
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  const sizes =
    columns === 'wide'
      ? '(min-width: 1440px) 18vw, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw'
      : '(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw';

  return (
    <ul className={`grid ${cols} gap-x-4 gap-y-9 md:gap-x-6 md:gap-y-12`}>
      {products.map((product, index) => (
        <li key={product.id} className="animate-fadeUp">
          <ProductCard
            product={product}
            priority={index < priorityCount}
            sizes={sizes}
          />
        </li>
      ))}
    </ul>
  );
}
